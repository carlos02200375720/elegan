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

export function registerAndroidOrderRoutes(router: Router, deps: AndroidRouterDependencies): void {
  const {
    MongoUser, MongoProduct, MongoReel, MongoOrder, MongoPublicacion,
    getUsers, getReels, setReels, getProducts, setProducts, getOrders, setOrders,
    uploadToGCS, uploadSingleSafe, uploadBase64ToGCS, broadcastToAll, generateId,
    bucket, bucketName, hlsQueue,
  } = deps;

    router.get("/orders", async (req: Request, res: Response) => {
      try {
        const { userId } = req.query;
        let allOrders = getOrders();
  
        if (mongoose.connection.readyState === 1 && MongoOrder) {
          try {
            const dbOrders = await MongoOrder.find().sort({ createdAt: -1 }).lean();
            if (dbOrders && dbOrders.length > 0) {
              const seen = new Set<string>();
              allOrders = dbOrders.filter((o: any) => {
                if (!o.id || seen.has(o.id)) return false;
                seen.add(o.id);
                return true;
              }) as any[];
            }
          } catch (dbErr) {
            console.error("Error fetching MongoOrders in android router:", dbErr);
          }
        }
  
        if (!userId || typeof userId !== "string") {
          return res.json(allOrders);
        }
  
        const cleanId = userId.toLowerCase().trim();
        const purchases = allOrders.filter(
          (o: any) =>
            o.buyerId === userId ||
            (o.buyerId && o.buyerId.toLowerCase() === cleanId) ||
            (o.buyerUsername && o.buyerUsername.toLowerCase() === cleanId) ||
            (o.buyerEmail && o.buyerEmail.toLowerCase() === cleanId) ||
            (userId === "current_user" && (o.buyerId === "current_user" || !o.buyerId))
        );
  
        res.json({ orders: allOrders, purchases });
      } catch (err: any) {
        console.error("Error in GET /api/android/orders:", err);
        res.status(500).json({ error: "Error al obtener órdenes", details: err.message });
      }
    });
  
    // Android Shop: Create Order
  
    router.post("/orders", async (req: Request, res: Response) => {
      try {
        const { items, total, userId, userName, userEmail } = req.body;
        const newOrder: Order = {
          id: "ord_android_" + generateId(),
          buyerId: userId || "current_user",
          buyerName: userName || "Usuario Android",
          buyerEmail: userEmail || "android@mallsocial.app",
          buyerUsername: req.body?.buyerUsername || (userName ? userName.toLowerCase().replace(/\s+/g, "_") : undefined),
          buyerAvatar: req.body?.buyerAvatar || undefined,
          buyerPhone: req.body?.buyerPhone || undefined,
          items: items || [],
          total: total || 0,
          shippingAddress: req.body?.shippingAddress || req.body?.address || "Dirección Android Móvil",
          status: "processing",
          paymentStatus: "paid",
          createdAt: new Date().toISOString(),
        };
  
        if (mongoose.connection.readyState === 1) {
          const mongoOrder = new MongoOrder(newOrder);
          await mongoOrder.save();
        }
  
        // Reducir inventario de productos vendidos
        const allProds = getProducts();
        const updatedStockList: { id: string; stock: number }[] = [];
        if (items && Array.isArray(items)) {
          for (const item of items) {
            const prodId = item.productId || item.product?.id;
            const qty = item.quantity || 1;
            const targetProd = allProds.find((p) => p.id === prodId);
            if (targetProd) {
              targetProd.stock = Math.max(0, (targetProd.stock ?? 10) - qty);
              updatedStockList.push({ id: targetProd.id, stock: targetProd.stock });
              if (mongoose.connection.readyState === 1 && MongoProduct) {
                await MongoProduct.updateOne(
                  { id: targetProd.id },
                  { $set: { stock: targetProd.stock } }
                ).catch((err: any) => console.error("Error updating MongoProduct stock in android router:", err));
              }
            }
          }
          if (setProducts) {
            setProducts([...allProds]);
          }
        }
  
        const allOrders = [newOrder, ...getOrders()];
        setOrders(allOrders);
  
        if (updatedStockList.length > 0) {
          broadcastToAll({
            type: "stock_updated",
            products: allProds.map((p) => ({ id: p.id, stock: p.stock })),
          });
        }
  
        broadcastToAll({
          type: "new_order",
          order: newOrder,
          platform: "android",
        });
  
        console.log(`📱 [Android Gateway] Orden creada desde Android en Atlas: ${newOrder.id} ($${newOrder.total})`);
        res.json({ success: true, order: newOrder, products: allProds });
      } catch (err: any) {
        console.error("❌ [Android Gateway] Error al registrar orden:", err);
        res.status(500).json({ error: "Error al crear orden en Android", details: err.message });
      }
    });
  
    return router;
  }
}
