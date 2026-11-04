import { Request, Response } from "express";
import mongoose from "mongoose";
import { MongoAppSettings, MongoSuperAdmin } from "../models";
import { uploadBase64ToGCS } from "../services/mediaStorage";

export const FACTORY_DEFAULT_AVATAR =
  "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=120&q=80";

export const FACTORY_DEFAULT_COVER =
  "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80";

let cachedDefaultAvatar = FACTORY_DEFAULT_AVATAR;
let cachedDefaultCoverPhoto = FACTORY_DEFAULT_COVER;
let isCacheLoaded = false;

/**
 * Load global settings from MongoDB into in-memory cache
 */
export async function loadDefaultAssetsFromDb(): Promise<void> {
  if (mongoose.connection.readyState !== 1) return;
  try {
    const settings = await MongoAppSettings.findOne({ key: "global" });
    if (settings) {
      if (settings.defaultAvatar) cachedDefaultAvatar = settings.defaultAvatar;
      if (settings.defaultCoverPhoto) cachedDefaultCoverPhoto = settings.defaultCoverPhoto;
      isCacheLoaded = true;
      console.log("⚙️ [Settings] Default assets loaded from MongoDB Atlas");
    } else {
      // Initialize with factory defaults
      await MongoAppSettings.create({
        key: "global",
        defaultAvatar: FACTORY_DEFAULT_AVATAR,
        defaultCoverPhoto: FACTORY_DEFAULT_COVER,
        updatedAt: new Date()
      });
      isCacheLoaded = true;
    }
  } catch (err) {
    console.warn("⚠️ [Settings] Error loading default assets from DB:", err);
  }
}

// Immediately attempt load
setTimeout(() => {
  loadDefaultAssetsFromDb().catch(() => {});
}, 1500);

export function getCachedDefaultAvatar(): string {
  return cachedDefaultAvatar || FACTORY_DEFAULT_AVATAR;
}

export function getCachedDefaultCoverPhoto(): string {
  return cachedDefaultCoverPhoto || FACTORY_DEFAULT_COVER;
}

/**
 * GET /api/admin/default-assets & GET /api/app-settings/defaults
 */
export async function getDefaultAssets(req: Request, res: Response): Promise<void> {
  try {
    if (!isCacheLoaded && mongoose.connection.readyState === 1) {
      await loadDefaultAssetsFromDb();
    }

    res.json({
      success: true,
      defaultAvatar: getCachedDefaultAvatar(),
      defaultCoverPhoto: getCachedDefaultCoverPhoto(),
      factoryDefaults: {
        avatar: FACTORY_DEFAULT_AVATAR,
        coverPhoto: FACTORY_DEFAULT_COVER
      }
    });
  } catch (err: any) {
    console.error("❌ Error fetching default assets:", err);
    res.status(500).json({ error: "Error al obtener assets por defecto", details: err.message });
  }
}

/**
 * POST /api/admin/default-assets
 */
export async function updateDefaultAssets(req: Request, res: Response): Promise<void> {
  try {
    const { defaultAvatar, defaultCoverPhoto } = req.body || {};

    let resolvedAvatar = cachedDefaultAvatar;
    let resolvedCover = cachedDefaultCoverPhoto;

    if (defaultAvatar !== undefined && defaultAvatar !== null) {
      const trimmedAvatar = String(defaultAvatar).trim();
      if (trimmedAvatar.startsWith("data:")) {
        console.log("📸 [Settings] Uploading base64 default avatar to storage...");
        resolvedAvatar = await uploadBase64ToGCS(trimmedAvatar, "avatars");
      } else if (trimmedAvatar.length > 0) {
        resolvedAvatar = trimmedAvatar;
      }
    }

    if (defaultCoverPhoto !== undefined && defaultCoverPhoto !== null) {
      const trimmedCover = String(defaultCoverPhoto).trim();
      if (trimmedCover.startsWith("data:")) {
        console.log("📸 [Settings] Uploading base64 default cover to storage...");
        resolvedCover = await uploadBase64ToGCS(trimmedCover, "covers");
      } else if (trimmedCover.length > 0) {
        resolvedCover = trimmedCover;
      }
    }

    // Update memory cache
    cachedDefaultAvatar = resolvedAvatar;
    cachedDefaultCoverPhoto = resolvedCover;
    isCacheLoaded = true;

    // Persist in MongoDB
    if (mongoose.connection.readyState === 1) {
      await MongoAppSettings.findOneAndUpdate(
        { key: "global" },
        {
          defaultAvatar: resolvedAvatar,
          defaultCoverPhoto: resolvedCover,
          updatedAt: new Date()
        },
        { upsert: true, returnDocument: "after" }
      );
      console.log("💾 [Settings] Default assets saved to MongoDB Atlas:", {
        avatar: resolvedAvatar,
        cover: resolvedCover
      });
    }

    res.json({
      success: true,
      message: "Imágenes por defecto actualizadas correctamente",
      defaultAvatar: resolvedAvatar,
      defaultCoverPhoto: resolvedCover
    });
  } catch (err: any) {
    console.error("❌ Error updating default assets:", err);
    res.status(500).json({ error: "Error al actualizar imágenes por defecto", details: err.message });
  }
}

/**
 * POST /api/admin/default-assets/reset
 */
export async function resetDefaultAssets(req: Request, res: Response): Promise<void> {
  try {
    cachedDefaultAvatar = FACTORY_DEFAULT_AVATAR;
    cachedDefaultCoverPhoto = FACTORY_DEFAULT_COVER;
    isCacheLoaded = true;

    if (mongoose.connection.readyState === 1) {
      await MongoAppSettings.findOneAndUpdate(
        { key: "global" },
        {
          defaultAvatar: FACTORY_DEFAULT_AVATAR,
          defaultCoverPhoto: FACTORY_DEFAULT_COVER,
          updatedAt: new Date()
        },
        { upsert: true, returnDocument: "after" }
      );
      console.log("🔄 [Settings] Default assets reset to factory defaults in MongoDB Atlas");
    }

    res.json({
      success: true,
      message: "Imágenes por defecto restablecidas a los valores de fábrica",
      defaultAvatar: FACTORY_DEFAULT_AVATAR,
      defaultCoverPhoto: FACTORY_DEFAULT_COVER
    });
  } catch (err: any) {
    console.error("❌ Error resetting default assets:", err);
    res.status(500).json({ error: "Error al restablecer imágenes por defecto", details: err.message });
  }
}


/** GET /api/admin/banner — contenido público del banner activo. */
export async function getPublicBanner(req: Request, res: Response): Promise<void> {
  try {
    if (mongoose.connection.readyState !== 1) {
      res.status(503).json({ success: false, error: "Base de datos no disponible" });
      return;
    }
    const settings = await MongoAppSettings.findOne({ key: "global" }).lean();
    if (!settings || !settings.bannerTitle) {
      res.json({ success: true, banner: null });
      return;
    }
    res.setHeader("Cache-Control", "public, max-age=30, stale-while-revalidate=60");
    res.json({ success: true, banner: {
      label: settings.bannerLabel || "Promoción",
      title: settings.bannerTitle || "",
      description: settings.bannerDescription || "",
      link: settings.bannerLink || "",
      imageUrl: settings.bannerImageUrl || "",
      enabled: settings.bannerEnabled === true
    }});
  } catch (err: any) {
    res.status(500).json({ success: false, error: "No se pudo obtener la promoción" });
  }
}

/** POST /api/admin/banner — solo la cuenta configurada como superadministrador puede guardar. */
export async function saveBanner(req: Request, res: Response): Promise<void> {
  try {
    if (mongoose.connection.readyState !== 1) {
      res.status(503).json({ success: false, error: "Base de datos no disponible" });
      return;
    }
    const userId = String(req.headers["x-user-id"] || "").trim();
    if (!userId || userId === "current_user" || userId === "user_guest") {
      res.status(401).json({ success: false, error: "Debes iniciar sesión como administrador" });
      return;
    }
    const admin = await MongoSuperAdmin.findOne({ $or: [{ id: userId }, { originalId: userId }] }).lean();
    const configuredEmail = String(process.env.VITE_SUPERADMIN_EMAIL || process.env.SUPERADMIN_EMAIL || "cg0220037@gmail.com").trim().toLowerCase();
    if (!admin || String(admin.email || "").trim().toLowerCase() !== configuredEmail) {
      res.status(403).json({ success: false, error: "No tienes permisos para administrar las promociones" });
      return;
    }

    const body = req.body || {};
    const title = String(body.title || "").trim().slice(0, 70);
    const description = String(body.description || "").trim().slice(0, 160);
    const label = String(body.label || "Promoción").trim().slice(0, 35);
    const link = String(body.link || "").trim().slice(0, 2048);
    const imageUrl = String(body.imageUrl || "").trim().slice(0, 2048);
    const enabled = body.enabled === true;
    if (enabled && !title) {
      res.status(400).json({ success: false, error: "Escribe el título de la promoción antes de activarla" });
      return;
    }
    if (link && !/^https?:\/\//i.test(link)) {
      res.status(400).json({ success: false, error: "El enlace debe comenzar con http:// o https://" });
      return;
    }
    const settings = await MongoAppSettings.findOneAndUpdate(
      { key: "global" },
      { $set: {
        bannerLabel: label || "Promoción",
        bannerTitle: title,
        bannerDescription: description,
        bannerLink: link,
        bannerImageUrl,
        bannerEnabled: enabled,
        updatedAt: new Date()
      }, $setOnInsert: { key: "global" } },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    ).lean();
    res.json({ success: true, message: "Promoción guardada correctamente", banner: {
      label: settings.bannerLabel || "Promoción",
      title: settings.bannerTitle || "",
      description: settings.bannerDescription || "",
      link: settings.bannerLink || "",
      imageUrl: settings.bannerImageUrl || "",
      enabled: settings.bannerEnabled === true
    }});
  } catch (err: any) {
    console.error("[Banner] Error guardando promoción:", err);
    res.status(500).json({ success: false, error: "No se pudo guardar la promoción" });
  }
}
