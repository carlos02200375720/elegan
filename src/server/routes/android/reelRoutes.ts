import { Router, Request, Response, NextFunction } from "express";
import mongoose from "mongoose";
import fs from "fs";
import path from "path";
import { Bucket } from "@google-cloud/storage";
import { User, Reel, Product, Order } from "../../"types";
import { transcodeVideoToLocalHlsDirect } from "../../"hlsTranscoder";
import { formatReelDTO, createCompanionReelForProduct } from "../../"utils/reelUtils";
import {
  getCanonicalReelsFromMongo,
  saveCanonicalReelToMongo,
  getUserCanonicalReelsFromMongo,
} from "../../"services/reelService";
import { isConfiguredSuperadmin, handleGuestSession, registerUser, switchUser, loginWithEmail, logoutUser } from "../../"controllers/userController";
import { getCart, updateCart, clearCart } from "../../"controllers/cartController";
import { createPaypalOrder, getPaypalConfig } from "../../"controllers/paypalController";
import { MongoCart, MongoChatMessage, MongoSuperAdmin } from "../../"models";
import type { AndroidRouterDependencies } from "../../androidRouterTypes";

export function registerAndroidReelRoutes(router: Router, deps: AndroidRouterDependencies): void {
  const {
    MongoUser, MongoProduct, MongoReel, MongoOrder, MongoPublicacion,
    getUsers, getReels, setReels, getProducts, setProducts, getOrders, setOrders,
    uploadToGCS, uploadSingleSafe, uploadBase64ToGCS, broadcastToAll, generateId,
    bucket, bucketName, hlsQueue,
  } = deps;

    router.get("/reels", async (req: Request, res: Response) => {
      try {
        let currentReels: Reel[] = [];
        if (mongoose.connection.readyState === 1) {
          currentReels = await getCanonicalReelsFromMongo();
          if (currentReels.length > 0) {
            setReels(currentReels);
          }
        }
  
        if (currentReels.length === 0) {
          currentReels = getReels().map((r) => formatReelDTO(r));
        }
  
        res.json(currentReels);
      } catch (err: any) {
        console.error("❌ [Android Gateway] Error loading reels:", err);
        res.status(500).json({ error: "Error al cargar feed de Android", details: err.message });
      }
    });
  
    // Android Publish / Create Reel: Transactional save to MongoReel
  
    router.post("/reels", async (req: Request, res: Response) => {
      try {
        const {
          title,
          videoUrl,
          thumbnailUrl,
          description,
          creatorId,
          creatorName,
          creatorUsername,
          creatorAvatar,
          taggedProductId,
          productId,
          type,
          images,
          media,
          hlsUrl,
          aspectRatio,
        } = req.body;
  
        if (!videoUrl && (!images || images.length === 0) && (!media || media.length === 0) && !thumbnailUrl) {
          res.status(400).json({ error: "Debe proporcionar video, imagen o contenido multimedia para la publicación" });
          return;
        }
  
        let resolvedCreatorId = creatorId;
        let resolvedCreatorName = creatorName;
        let resolvedCreatorUsername = creatorUsername;
        let resolvedCreatorAvatar = creatorAvatar;
  
        if (
          !resolvedCreatorId ||
          resolvedCreatorId === "creator" ||
          resolvedCreatorId === "creador" ||
          !resolvedCreatorUsername ||
          resolvedCreatorUsername === "creador" ||
          resolvedCreatorUsername === "creator"
        ) {
          if (mongoose.connection.readyState === 1) {
            const author = await MongoUser.findOne({
              $or: [
                ...(req.headers["x-user-username"] ? [{ username: (req.headers["x-user-username"] as string).trim().toLowerCase() }] : []),
                ...(req.headers["x-user-id"] ? [{ id: (req.headers["x-user-id"] as string).trim() }] : []),
                { id: { $nin: ["current_user", "user_guest", "creator", "creador"] } }
              ],
              username: { $nin: ["invitado", "creador", "creator"] }
            });
            if (author) {
              resolvedCreatorId = author.id;
              resolvedCreatorName = author.name;
              resolvedCreatorUsername = author.username;
              resolvedCreatorAvatar = author.avatar;
            }
          }
        }
  
        const effectiveProductId = productId || taggedProductId || undefined;
        const normalizedVideoUrl = typeof videoUrl === "string" ? videoUrl.trim() : "";
        const normalizedHlsUrl = typeof hlsUrl === "string" && hlsUrl.includes(".m3u8") ? hlsUrl.trim() : undefined;
        const normalizedThumbnailUrl =
          typeof thumbnailUrl === "string" && thumbnailUrl.trim() &&
          !thumbnailUrl.includes("1618005182384") && !thumbnailUrl.toLowerCase().endsWith(".m3u8")
            ? thumbnailUrl.trim() : "";
  
        const normalizedMedia =
          Array.isArray(media) && media.length > 0
            ? media.map((item: any) => {
                const itemType = item?.type === "video" ? "video" : "image";
                const itemUrl = itemType === "video"
                  ? normalizedHlsUrl || normalizedVideoUrl || item?.url
                  : item?.url;
                if (typeof itemUrl !== "string" || !itemUrl.trim()) return null;
                return {
                  type: itemType,
                  url: itemUrl.trim(),
                  hlsUrl: itemType === "video" ? normalizedHlsUrl || item?.hlsUrl : undefined,
                  thumbnailUrl: item?.thumbnailUrl || normalizedThumbnailUrl || undefined,
                };
              }).filter(Boolean)
            : normalizedVideoUrl
              ? [{ type: "video", url: normalizedHlsUrl || normalizedVideoUrl, hlsUrl: normalizedHlsUrl, thumbnailUrl: normalizedThumbnailUrl || undefined }]
              : Array.isArray(images)
                ? images.filter((url: any) => typeof url === "string" && url.trim()).map((url: string, index: number) => ({ type: "image", url: url.trim(), order: index }))
                : [];
  
        const effectiveType =
          type || (effectiveProductId ? "product" : normalizedVideoUrl ? "video" : images && images.length > 1 ? "carousel" : "image");
  
        const rawReelData = {
          id: "reel_" + generateId(),
          title: (title || "").trim(),
          videoUrl: normalizedVideoUrl,
          thumbnailUrl: normalizedThumbnailUrl,
          description: description || "",
          creatorId: resolvedCreatorId || "user_anon",
          creatorName: resolvedCreatorName || "Usuario",
          creatorUsername: resolvedCreatorUsername || "usuario",
          creatorAvatar: resolvedCreatorAvatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=120&q=80",
          productId: effectiveProductId,
          type: effectiveType,
          images: images || [],
          media: normalizedMedia,
          hlsUrl: normalizedHlsUrl,
          aspectRatio: aspectRatio || "vertical",
        };
  
        // Transactional save to MongoReel: will throw if DB write fails
        const newReel = await saveCanonicalReelToMongo(rawReelData);
  
        const updatedReels = [newReel, ...getReels().filter((r) => r.id !== newReel.id)];
        setReels(updatedReels);
  
        broadcastToAll({
          type: "reel_created",
          reel: newReel,
          platform: "android",
        });
  
        broadcastToAll({
          type: "new_reel",
          reel: newReel,
          platform: "android",
        });
  
        console.log(`📱 [Android Gateway] Reel publicado exitosamente en MongoReel: ${newReel.id} por @${resolvedCreatorUsername}`);
        res.status(201).json({ success: true, reel: newReel });
      } catch (err: any) {
        console.error("❌ [Android Gateway] Error al publicar reel en MongoReel:", err);
        res.status(500).json({ error: "Error al registrar la publicación en la base de datos", details: err.message });
      }
    });
  
    // Android Publish / Create Product with auto Companion Reel
  
    router.post("/reels/:id/like", async (req: Request, res: Response) => {
      try {
        const reelId = req.params.id;
        const { userId } = req.body;
        const headerGuestToken = (req.headers["x-guest-token"] as string)?.trim();
        const guestToken = (req.body?.guestToken || headerGuestToken || "").trim();
        const targetUserId = userId || req.headers["x-user-id"] || guestToken || "current_user";
  
        let likes = 0;
        let likedBy: string[] = [];
  
        if (mongoose.connection.readyState === 1) {
          let reel = await MongoReel.findOne({ id: reelId });
  
          // If not in Mongo and is a companion reel for a product, find product and generate companion reel
          if (!reel && reelId.startsWith("reel_prod_")) {
            const prodId = reelId.replace("reel_prod_", "");
            const product = await MongoProduct.findOne({ id: prodId });
            if (product) {
              const seller = await MongoUser.findOne({
                $or: [
                  ...(product.sellerId ? [{ id: product.sellerId }, { _id: mongoose.isValidObjectId(product.sellerId) ? product.sellerId : undefined }] : []),
                  ...(product.sellerUsername ? [{ username: product.sellerUsername }] : []),
                ],
              });
              const companion = createCompanionReelForProduct(product, seller);
              companion.id = reelId;
              reel = await saveCanonicalReelToMongo(companion);
            }
          }
  
          if (reel) {
            const set = new Set<string>(reel.likedBy || []);
            if (set.has(targetUserId)) {
              set.delete(targetUserId);
            } else {
              set.add(targetUserId);
            }
            likedBy = Array.from(set);
            likes = likedBy.length;
            await MongoReel.updateOne({ id: reelId }, { $set: { likes, likedBy } });
  
            // Keep in-memory reels updated and broadcast
            const current = getReels();
            setReels(current.map((r) => (r.id === reelId ? { ...r, likes, likedBy } : r)));
            broadcastToAll({
              type: "reel_updated",
              reelId,
              likes,
              likedBy,
            });
          }
        }
  
        res.json({ success: true, likes, likedBy });
      } catch (err: any) {
        res.status(500).json({ error: "Error al dar like", details: err.message });
      }
    });
  
    // Android Comment on Reel
  
    router.post("/reels/:id/comment", async (req: Request, res: Response) => {
      try {
        const reelId = req.params.id;
        const { userId, username, avatar, text } = req.body;
        if (!text) {
          res.status(400).json({ error: "Texto del comentario es requerido" });
          return;
        }
  
        const newComment = {
          id: "com_" + generateId(),
          userId: userId || req.headers["x-user-id"] || req.headers["x-guest-token"] || "user",
          username: username || "usuario",
          avatar: avatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=120&q=80",
          text: text.trim(),
          createdAt: new Date().toISOString(),
        };
  
        if (mongoose.connection.readyState === 1) {
          let reel = await MongoReel.findOne({ id: reelId });
  
          if (!reel && reelId.startsWith("reel_prod_")) {
            const prodId = reelId.replace("reel_prod_", "");
            const product = await MongoProduct.findOne({ id: prodId });
            if (product) {
              const seller = await MongoUser.findOne({
                $or: [
                  ...(product.sellerId ? [{ id: product.sellerId }, { _id: mongoose.isValidObjectId(product.sellerId) ? product.sellerId : undefined }] : []),
                  ...(product.sellerUsername ? [{ username: product.sellerUsername }] : []),
                ],
              });
              const companion = createCompanionReelForProduct(product, seller);
              companion.id = reelId;
              reel = await saveCanonicalReelToMongo(companion);
            }
          }
  
          await MongoReel.updateOne({ id: reelId }, { $push: { comments: newComment } });
  
          // Update in-memory state and broadcast
          const current = getReels();
          setReels(
            current.map((r) =>
              r.id === reelId ? { ...r, comments: [...(r.comments || []), newComment] } : r
            )
          );
          broadcastToAll({
            type: "reel_updated",
            reelId,
            newComment,
          });
        }
  
        res.json(newComment);
      } catch (err: any) {
        res.status(500).json({ error: "Error al agregar comentario", details: err.message });
      }
    });
  
    // Android Delete Publication / Reel (Wipe completely from MongoDB, GCS, and local disk)
  
    router.delete(["/reels/:id", "/publicaciones/:id"], async (req: Request, res: Response) => {
      try {
        const targetId = req.params.id;
        if (!targetId) {
          res.status(400).json({ error: "ID de publicación requerido" });
          return;
        }
  
        console.log(`🗑️ [Android Gateway] Eliminando publicación / reel completa ${targetId}...`);
  
        const isObjectId = mongoose.Types.ObjectId.isValid(targetId) && String(targetId).length === 24;
        const mongoQuery = isObjectId ? { $or: [{ id: targetId }, { _id: targetId }] } : { id: targetId };
  
        let existingReel = getReels().find((r) => r.id === targetId);
        let existingPub: any = null;
  
        if (mongoose.connection.readyState === 1) {
          try {
            if (!existingReel) existingReel = await MongoReel.findOne(mongoQuery);
            existingPub = await MongoPublicacion.findOne(mongoQuery);
  
            // Cross-match if one exists but not the other
            if (existingReel && !existingPub && (existingReel.hlsUrl || existingReel.videoUrl)) {
              const matchUrl = existingReel.hlsUrl || existingReel.videoUrl;
              existingPub = await MongoPublicacion.findOne({
                $or: [{ hlsUrl: matchUrl }, { url: matchUrl }]
              });
            }
            if (existingPub && !existingReel && (existingPub.hlsUrl || existingPub.url)) {
              const matchUrl = existingPub.hlsUrl || existingPub.url;
              existingReel = await MongoReel.findOne({
                $or: [{ hlsUrl: matchUrl }, { videoUrl: matchUrl }]
              });
            }
          } catch {}
        }
  
        const mediaToDelete = [
          existingReel?.videoUrl,
          existingReel?.hlsUrl,
          existingReel?.thumbnailUrl,
          existingPub?.url,
          existingPub?.hlsUrl,
          existingPub?.thumbnailUrl,
          ...(Array.isArray(existingReel?.images) ? existingReel.images : []),
          ...(Array.isArray(existingPub?.images) ? existingPub.images : []),
        ];
  
        const { deleteFullPublicationMedia } = await import("./services/mediaStorage");
        const cleanupStats = await deleteFullPublicationMedia(mediaToDelete);
  
        const deleteIds = Array.from(new Set([targetId, existingReel?.id, existingPub?.id].filter(Boolean)));
  
        const validMediaUrls = mediaToDelete.filter((u): u is string => typeof u === "string" && u.trim().length > 0);
        const mediaQuery = validMediaUrls.length > 0 ? [
          { videoUrl: { $in: validMediaUrls } },
          { url: { $in: validMediaUrls } },
          { hlsUrl: { $in: validMediaUrls } }
        ] : [];
  
        if (mongoose.connection.readyState === 1) {
          try {
            await MongoReel.deleteMany({
              $or: [mongoQuery, { id: { $in: deleteIds } }, ...mediaQuery]
            });
            await MongoPublicacion.deleteMany({
              $or: [mongoQuery, { id: { $in: deleteIds } }, ...mediaQuery]
            });
            console.log(`💾 [Android Gateway] Eliminado de MongoDB: ${deleteIds.join(", ")}`);
          } catch (dbErr) {
            console.error("Error al eliminar de MongoDB:", dbErr);
          }
        }
  
        // Update in-memory reels
        const current = getReels();
        setReels(current.filter((r) => !deleteIds.includes(r.id) && !validMediaUrls.includes(r.videoUrl || "")));
  
        deleteIds.forEach((delId) => {
          broadcastToAll({
            type: "reel_deleted",
            reelId: delId,
          });
        });
  
        res.json({ success: true, deletedId: targetId, deleteIds, cleanupStats });
      } catch (err: any) {
        console.error("❌ [Android Gateway] Error deleting reel:", err);
        res.status(500).json({ error: "Error al eliminar publicación", details: err.message });
      }
    });
  
    // Android Upload: Pure media file uploader (does not create publication until user submits publish form)
}
