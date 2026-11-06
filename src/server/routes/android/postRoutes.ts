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

export function registerAndroidPostRoutes(router: Router, deps: AndroidRouterDependencies): void {
  const {
    MongoUser, MongoProduct, MongoReel, MongoOrder, MongoPublicacion,
    getUsers, getReels, setReels, getProducts, setProducts, getOrders, setOrders,
    uploadToGCS, uploadSingleSafe, uploadBase64ToGCS, broadcastToAll, generateId,
    bucket, bucketName, hlsQueue,
  } = deps;

    router.post(["/v1/posts", "/posts", "/v1/publicaciones", "/publicaciones"], async (req: Request, res: Response) => {
      try {
        const { caption, media_url, media_type, title, description, creatorId, creatorUsername } = req.body || {};
        if (!media_url) {
          res.status(400).json({ error: "media_url is required" });
          return;
        }
        const pubId = "pub_" + generateId();
        const resolvedCaption = caption || description || title || "";
        const resolvedType = media_type || (media_url.endsWith(".m3u8") || media_url.includes("video") ? "video" : "image");
        const createdAt = new Date();
  
        if (mongoose.connection.readyState === 1) {
          try {
            await MongoPublicacion.create({
              id: pubId,
              url: media_url,
              hlsUrl: resolvedType === "video" ? media_url : undefined,
              title: title || resolvedCaption,
              description: resolvedCaption,
              creatorId: creatorId || (req.headers["x-user-id"] as string) || "current_user",
              createdAt,
              caption: resolvedCaption,
              media_url,
              media_type: resolvedType,
            });
          } catch (dbErr) {
            console.warn("⚠️ [Android Gateway] Error saving post to MongoPublicacion:", dbErr);
          }
        }
  
        res.status(201).json({
          id: pubId,
          status: "success",
          post: {
            id: pubId,
            caption: resolvedCaption,
            media_url,
            media_type: resolvedType,
            created_at: createdAt.toISOString(),
          }
        });
      } catch (err: any) {
        res.status(500).json({ error: "Error saving post in Android Gateway", details: err.message });
      }
    });
  
    // Android: Feed retrieval
  
    router.get(["/v1/feed", "/feed"], async (req: Request, res: Response) => {
      try {
        const limit = Math.min(Math.max(Number(req.query.limit) || 20, 1), 100);
        let posts: any[] = [];
        if (mongoose.connection.readyState === 1) {
          const docs = await MongoPublicacion.find().sort({ createdAt: -1 }).limit(limit).lean();
          if (docs && docs.length > 0) {
            posts = docs.map((doc: any) => ({
              _id: doc._id?.toString() || doc.id,
              id: doc.id || doc._id?.toString(),
              caption: doc.description || doc.title || doc.caption || "",
              media_url: doc.url || doc.media_url || doc.hlsUrl || "",
              media_type: doc.media_type || (doc.url?.endsWith(".m3u8") || doc.url?.includes("video") ? "video" : "image"),
              created_at: doc.createdAt || new Date(),
              creatorId: doc.creatorId,
            }));
          }
        }
        if (posts.length === 0) {
          posts = getReels().slice(0, limit).map((r) => ({
            _id: r.id,
            id: r.id,
            caption: r.description || r.title || "",
            media_url: r.videoUrl || r.hlsUrl || (r.images && r.images[0]) || r.thumbnailUrl || "",
            media_type: r.type === "image" || r.type === "carousel" ? "image" : "video",
            created_at: (r as any).createdAt || new Date(),
            creatorId: r.creatorId,
          }));
        }
        res.json({ posts });
      } catch (err: any) {
        res.status(500).json({ error: "Error fetching feed in Android Gateway", details: err.message });
      }
    });
  
    // Android Shop: Products from MongoDB Atlas
}
