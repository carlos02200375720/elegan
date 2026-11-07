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
import type { MovilRouterDependencies } from "./types";

export function registerAndroidMediaRoutes(router: Router, deps: MovilRouterDependencies): void {
  const {
    MongoUser, MongoProduct, MongoReel, MongoOrder, MongoPublicacion,
    getUsers, getReels, setReels, getProducts, setProducts, getOrders, setOrders,
    uploadToGCS, uploadSingleSafe, uploadBase64ToGCS, broadcastToAll, generateId,
    bucket, bucketName, hlsQueue,
  } = deps;

    router.post("/upload", uploadSingleSafe("file"), async (req: any, res: Response) => {
      const pubId = "pub_" + generateId();
      try {
        if (!req.file) {
          res.status(400).json({ error: "No se proporcionó ningún archivo" });
          return;
        }
  
        const originalName = req.file.originalname || "upload";
        const mimeType = (req.file.mimetype || "").toLowerCase();
        const isVideo = mimeType.startsWith("video/") || /\.(mp4|mov|m4v|webm|avi|mkv|3gp|flv|ts|m3u8)$/i.test(originalName);
  
        if (!isVideo) {
          console.log(`📱 [Android Gateway] Subiendo archivo no-video desde Android: ${originalName}`);
          const publicUrl = await uploadToGCS(req.file, "android_media");
  
          return res.json({
            success: true,
            platform: "android",
            url: publicUrl,
            publicacionId: pubId,
          });
        }
  
        // Video branch: Android uses the same HLS pipeline and always returns HLS directly from GCS
        const jobId = "hls_" + generateId();
        console.log(`📱 [Android Gateway] Procesando video HLS-only desde Android para GCS: ${originalName}`);
  
        let hlsUrl = "";
        if (hlsQueue) {
          try {
            const hlsResult = await hlsQueue.enqueueAndWait(
              jobId,
              req.file.buffer,
              originalName,
              bucket,
              bucketName,
              { publicacionId: pubId }
            );
            hlsUrl = hlsResult.masterM3u8Url;
          } catch (queueErr) {
            console.warn("⚠️ [Android Gateway] Cola HLS falló, subiendo directamente a GCS:", queueErr);
          }
        }
  
        if (!hlsUrl) {
          try {
            hlsUrl = await transcodeVideoToLocalHlsDirect(req.file.buffer, pubId, originalName);
          } catch {}
        }
  
        if (!hlsUrl || !hlsUrl.startsWith("https://storage.googleapis.com/")) {
          throw new Error("No se pudo almacenar el video en Google Cloud Storage.");
        }
  
        return res.json({
          success: true,
          platform: "android",
          url: hlsUrl,
          hlsUrl,
          publicacionId: pubId,
        });
      } catch (err: any) {
        console.error("❌ [Android Gateway] Error en upload a GCS:", err);
        res.status(500).json({ error: "Error al procesar y subir archivo a Google Cloud Storage en Android", details: err?.message || "Error desconocido" });
      }
    });
  
    // Android: GCS Signed URL generation (Direct GCS upload pattern)
  
    router.get(["/v1/media/upload-url", "/media/upload-url"], async (req: Request, res: Response) => {
      try {
        if (!bucket) {
          res.status(503).json({ error: "Google Cloud Storage bucket not configured" });
          return;
        }
        const folder = (req.query.folder as string)?.trim() || "publicaciones";
        const fileType = (req.query.file_type as string)?.trim() || (req.query.contentType as string)?.trim() || "image/jpeg";
        const fileNameParam = (req.query.file_name as string)?.trim() || (req.query.filename as string)?.trim();
  
        let extension = "";
        if (fileNameParam && fileNameParam.includes(".")) {
          extension = fileNameParam.split(".").pop() || "";
        }
        if (!extension) {
          extension = fileType.split("/").pop()?.split(";")[0]?.trim() || "bin";
        }
        if (extension === "jpeg") extension = "jpg";
  
        const uniqueKey = `${folder}/${Date.now()}-${generateId()}.${extension}`;
        const fileBlob = bucket.file(uniqueKey);
  
        const [signedUrl] = await fileBlob.getSignedUrl({
          version: "v4",
          action: "write",
          expires: Date.now() + 15 * 60 * 1000,
          contentType: fileType,
        });
  
        const effectiveBucket = bucketName || "elegan-bucket";
        const publicUrl = `https://storage.googleapis.com/${effectiveBucket}/${uniqueKey}`;
  
        res.json({
          upload_url: signedUrl,
          public_url: publicUrl,
          file_key: uniqueKey,
          bucket: effectiveBucket,
          expiresInMinutes: 15,
          method: "PUT",
        });
      } catch (err: any) {
        const isSignBlobError =
          err?.message?.includes("signBlob") ||
          err?.message?.includes("iam.serviceAccounts") ||
          err?.message?.includes("denied on resource");
  
        if (isSignBlobError) {
          console.warn("⚠️ [Android Gateway] 'signBlob' permission missing. Instructing client to fallback to server upload.");
          res.json({
            direct_upload_available: false,
            upload_url: null,
            fallback_to_server: true,
            message: "Signed URLs require 'Service Account Token Creator' role. Falling back to server upload.",
          });
          return;
        }
  
        console.error("❌ [Android Gateway] Error generating GCS signed URL:", err);
        res.status(500).json({ error: "Error generating GCS signed URL", details: err.message });
      }
    });
  
    // Android: Direct Post creation
}
