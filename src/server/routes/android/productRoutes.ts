import { Router, Request, Response, NextFunction } from "express";
import mongoose from "mongoose";
import fs from "fs";
import path from "path";
import { Bucket } from "@google-cloud/storage";
import { User, Reel, Product, Order } from "../../types";
import { transcodeVideoToLocalHlsDirect } from "../../hlsTranscoder";
import { formatReelDTO, createCompanionReelForProduct } from "../../utils/reelUtils";
import {
  getCanonicalReelsFromMongo,
  saveCanonicalReelToMongo,
  getUserCanonicalReelsFromMongo,
} from "../../services/reelService";
import { isConfiguredSuperadmin, handleGuestSession, registerUser, switchUser, loginWithEmail, logoutUser } from "../../controllers/userController";
import { getCart, updateCart, clearCart } from "../../controllers/cartController";
import { createPaypalOrder, getPaypalConfig } from "../../controllers/paypalController";
import { MongoCart, MongoChatMessage, MongoSuperAdmin } from "../../models";
import type { AndroidRouterDependencies } from "../../androidRouterTypes";

export function registerAndroidProductRoutes(router: Router, deps: AndroidRouterDependencies): void {
  const {
    MongoUser, MongoProduct, MongoReel, MongoOrder, MongoPublicacion,
    getUsers, getReels, setReels, getProducts, setProducts, getOrders, setOrders,
    uploadToGCS, uploadSingleSafe, uploadBase64ToGCS, broadcastToAll, generateId,
    bucket, bucketName, hlsQueue,
  } = deps;

    router.post("/products", async (req: Request, res: Response) => {
      try {
        const { name, description, price, imageUrl, stock, sellerId, shippingCost, shippingCapital, shippingProvince, freeShipping, shippingOptions, images, videos, variants, variantList, category } = req.body;
        let resolvedSellerId = sellerId || req.headers["x-user-id"];
        let seller: any = null;
  
        if (mongoose.connection.readyState === 1 && resolvedSellerId) {
          seller = await MongoUser.findOne({
            $or: [{ id: resolvedSellerId }, { username: req.headers["x-user-username"] }],
          });
        }
  
        if (!seller) {
          seller = {
            id: resolvedSellerId || "seller_" + generateId(),
            name: (req.headers["x-user-name"] as string) || "Vendedor",
            username: (req.headers["x-user-username"] as string) || "vendedor",
            avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=120&q=80",
          };
        }
  
        const normalizedShippingOptions = Array.isArray(shippingOptions)
          ? shippingOptions
              .filter((opt: any) => opt && String(opt.label || "").trim().length > 0)
              .map((opt: any, idx: number) => ({
                id: opt.id || `ship_${Date.now()}_${idx}`,
                label: String(opt.label || "").trim(),
                origin: opt.origin ? String(opt.origin).trim() : "",
                price: Math.max(0, Number(opt.price) || 0),
                deliveryTime: String(opt.deliveryTime || "3-7 días hábiles").trim(),
              }))
          : [];
  
        const isFreeShipping = Boolean(freeShipping) || normalizedShippingOptions.some((o) => o.price === 0);
        const parsedStock = stock !== undefined && stock !== "" ? Math.max(0, Number(stock)) : 10;
        const parsedCapital = shippingCapital !== undefined && shippingCapital !== "" ? Math.max(0, Number(shippingCapital) || 0) : 0;
        const parsedProvince = shippingProvince !== undefined && shippingProvince !== "" ? Math.max(0, Number(shippingProvince) || 0) : 0;
        const parsedShipping =
          shippingCost !== undefined && shippingCost !== ""
            ? Math.max(0, Number(shippingCost) || 0)
            : normalizedShippingOptions.length > 0
            ? normalizedShippingOptions[0].price
            : parsedCapital > 0
            ? parsedCapital
            : parsedProvince > 0
            ? parsedProvince
            : 0;
  
        const newProduct: Product = {
          id: "prod_" + generateId(),
          name: name || "Producto sin nombre",
          description: description || "",
          price: Number(price) || 0,
          imageUrl: imageUrl || (images && images[0]) || "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=300&q=80",
          stock: Number.isNaN(parsedStock) ? 10 : parsedStock,
          sellerId: seller.id,
          rating: 5,
          shippingCost: Number.isNaN(parsedShipping) ? 0 : parsedShipping,
          shippingCapital: Number.isNaN(parsedCapital) ? 0 : parsedCapital,
          shippingProvince: Number.isNaN(parsedProvince) ? 0 : parsedProvince,
          freeShipping: isFreeShipping,
          shippingOptions: normalizedShippingOptions,
          images: images || [],
          videos: videos || [],
          variants: Array.isArray(variants) ? variants : [],
          variantList: Array.isArray(variantList) ? variantList : [],
          category: category || "",
          views: 0,
        };
  
        if (mongoose.connection.readyState === 1) {
          const mongoProd = new MongoProduct(newProduct);
          await mongoProd.save();
        }
  
        if (setProducts) {
          setProducts([newProduct, ...getProducts()]);
        }
  
        // Automatically generate unified companion Reel for Android & Web
        const companionReel = createCompanionReelForProduct(newProduct, seller);
        const newReel = await saveCanonicalReelToMongo(companionReel);
  
        setReels([newReel, ...getReels().filter((r) => r.id !== newReel.id)]);
  
        broadcastToAll({
          type: "product_created",
          product: newProduct,
          platform: "android",
        });
  
        broadcastToAll({
          type: "reel_created",
          reel: newReel,
          platform: "android",
        });
  
        res.status(201).json({ success: true, product: newProduct, reel: newReel });
      } catch (err: any) {
        console.error("❌ [Android Gateway] Error al crear producto:", err);
        res.status(500).json({ error: "Error al crear producto", details: err.message });
      }
    });
  
    // Android Like Reel
  
    router.get("/products", async (req: Request, res: Response) => {
      try {
        let prods = getProducts();
        if (mongoose.connection.readyState === 1) {
          const dbUsers = await MongoUser.find();
          const userMap = new Map<string, any>();
          dbUsers.forEach((u: any) => {
            userMap.set(u.id, u);
            if (u.username) userMap.set(u.username.toLowerCase(), u);
            if (u._id) userMap.set(u._id.toString(), u);
          });
  
          const dbProds = await MongoProduct.find();
          if (dbProds.length > 0) {
            prods = dbProds.map((p: any) => {
              const seller =
                userMap.get(p.sellerId) ||
                (p.sellerUsername ? userMap.get(p.sellerUsername.toLowerCase()) : null);
  
              return {
                id: p.id,
                name: p.name,
                description: p.description || "",
                price: p.price,
                imageUrl: p.imageUrl || "",
                stock: p.stock !== undefined ? p.stock : 10,
                sellerId: seller ? seller.id : (p.sellerId || "seller"),
                sellerName: seller ? seller.name : (p.sellerName || "Vendedor"),
                sellerUsername: seller ? seller.username : (p.sellerUsername || "vendedor"),
                rating: p.rating || 5,
                shippingCost: p.shippingCost !== undefined ? Number(p.shippingCost) : 0,
                shippingCapital: p.shippingCapital !== undefined ? Number(p.shippingCapital) : 0,
                shippingProvince: p.shippingProvince !== undefined ? Number(p.shippingProvince) : 0,
                freeShipping: Boolean(p.freeShipping),
                shippingOptions: Array.isArray(p.shippingOptions) ? p.shippingOptions : [],
                category: p.category || "General",
                images: p.images || [],
                videos: p.videos || [],
                variants: p.variants || [],
                variantList: p.variantList || [],
                views: p.views || 0,
              };
            });
            if (setProducts) setProducts(prods);
          }
        }
        res.json(prods);
      } catch (err: any) {
        console.error("❌ [Android Gateway] Error fetching products:", err);
        res.status(500).json({ error: "Error al obtener productos en Android", details: err.message });
      }
    });
  
    // Android: Toggle save/unsave (reel or product)
}
