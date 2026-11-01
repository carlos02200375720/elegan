import { Router, Request, Response, NextFunction } from "express";
import mongoose from "mongoose";
import fs from "fs";
import path from "path";
import { Bucket } from "@google-cloud/storage";
import { User, Reel, Product, Order } from "../types";
import { transcodeVideoToLocalHlsDirect } from "./hlsTranscoder";
import { formatReelDTO, createCompanionReelForProduct } from "./utils/reelUtils";
import {
  getCanonicalReelsFromMongo,
  saveCanonicalReelToMongo,
  getUserCanonicalReelsFromMongo,
} from "./services/reelService";
import { isConfiguredSuperadmin, handleGuestSession, registerUser, switchUser, loginWithEmail } from "./controllers/userController";
import { createPaypalOrder, getPaypalConfig } from "./controllers/paypalController";
import { MongoCart, MongoChatMessage } from "./models";
import {
  mergeGuestCartItems,
  migrateGuestChatHistory,
  migrateGuestReelInteractions,
} from "./utils/guestDataMigration";

export interface AndroidRouterDependencies {
  MongoUser: any;
  MongoProduct: any;
  MongoReel: any;
  MongoOrder: any;
  MongoPublicacion: any;
  getUsers?: () => Promise<User[]>;
  getReels: () => Reel[];
  setReels: (reels: Reel[]) => void;
  getProducts: () => Product[];
  setProducts?: (products: Product[]) => void;
  getOrders: () => Order[];
  setOrders: (orders: Order[]) => void;
  uploadToGCS: (file: Express.Multer.File, folder?: string) => Promise<string>;
  uploadSingleSafe: (fieldName: string) => any;
  uploadBase64ToGCS: (base64Str: string, folder?: string) => Promise<string>;
  broadcastToAll: (data: any) => void;
  generateId: () => string;
  bucket?: Bucket;
  bucketName?: string;
  hlsQueue?: {
    enqueueAndWait: (
      jobId: string,
      videoBuffer: Buffer,
      sourceName: string,
      bucket: Bucket,
      bucketName: string,
      options?: {
        reelId?: string;
        publicacionId?: string;
        onComplete?: (result: any) => Promise<void> | void;
        onError?: (err: Error) => void;
      }
    ) => Promise<any>;
  };
}

export function createAndroidRouter(deps: AndroidRouterDependencies): Router {
  const router = Router();
  const {
    MongoUser,
    MongoProduct,
    MongoReel,
    MongoOrder,
    MongoPublicacion,
    getUsers,
    getReels,
    setReels,
    getProducts,
    setProducts,
    getOrders,
    setOrders,
    uploadToGCS,
    uploadSingleSafe,
    uploadBase64ToGCS,
    broadcastToAll,
    generateId,
    bucket,
    bucketName,
    hlsQueue,
  } = deps;

  // Dedicated Android middleware
  router.use((req: Request, res: Response, next: NextFunction) => {
    (req as any).isAndroid = true;
    res.setHeader("X-Platform-Engine", "MallSocial-Android-V1");
    next();
  });

  // Health and Android Engine Status
  router.get("/health", (req: Request, res: Response) => {
    res.json({
      status: "ok",
      platform: "android",
      engine: "MallSocial Android Backend Gateway",
      timestamp: new Date().toISOString(),
      mongoConnected: mongoose.connection.readyState === 1,
    });
  });

  router.get("/paypal/config", getPaypalConfig);
  router.post("/paypal/orders", createPaypalOrder);

  // Android: Real Users list from MongoDB Atlas
  router.get("/users", async (req: Request, res: Response) => {
    try {
      if (getUsers) {
        const users = await getUsers();
        if (users && users.length > 0) {
          res.json(users);
          return;
        }
      }

      if (mongoose.connection.readyState === 1) {
        const dbUsers = await MongoUser.find({
          id: { $nin: ["current_user", "user_guest"] },
          username: { $ne: "invitado" },
        });

        const users: User[] = dbUsers.map((u: any) => ({
          id: u.id,
          originalId: u._id ? u._id.toString() : u.id,
          username: u.username,
          name: u.name,
          avatar: u.avatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=120&q=80",
          bio: u.bio || "",
          coverPhoto: u.coverPhoto || "",
          isOnline: u.isOnline !== undefined ? u.isOnline : false,
          followers: u.followers || 0,
          following: u.following || 0,
          followingUserIds: u.followingUserIds || [],
          savedReelIds: u.savedReelIds || [],
          isGuest: u.isGuest === true,
          email: u.email || "",
          address: u.address || "",
          shippingAddress: u.shippingAddress || u.address || "",
          city: u.city || "",
          country: u.country || "",
          phone: u.phone || "",
          canSell: u.canSell === true || isConfiguredSuperadmin(u),
          isAdmin: isConfiguredSuperadmin(u),
          role: isConfiguredSuperadmin(u) ? "superadmin" : (u.canSell ? "seller" : "user")
        }));

        res.json(users);
        return;
      }

      res.json([]);
    } catch (err: any) {
      console.error("❌ [Android Gateway] Error fetching users:", err);
      res.status(500).json({ error: "Error al obtener usuarios de MongoDB", details: err.message });
    }
  });

  // Android Gateway: Guest Session route
  router.all(["/auth/guest-session", "/users/guest-session", "/guest-session"], handleGuestSession);

  // Android: Current user status / auto session resolution
  router.get("/users/current_user", async (req: Request, res: Response) => {
    try {
      const headerUsername = req.headers["x-user-username"] as string;
      const headerUserId = req.headers["x-user-id"] as string;
      const headerGuestToken = (req.headers["x-guest-token"] as string || req.query.guestToken as string || "").trim();

      let targetUser = null;
      if (mongoose.connection.readyState === 1) {
        if (headerUsername && headerUsername !== "invitado" && headerUsername !== "guest") {
          targetUser = await MongoUser.findOne({
            $or: [
              { username: headerUsername.toLowerCase() },
              { username: headerUsername },
              { email: headerUsername.toLowerCase() },
            ],
          });
        } else if (headerUserId && headerUserId !== "current_user" && headerUserId !== "user_guest") {
          targetUser = await MongoUser.findOne({
            $or: [{ id: headerUserId }, { _id: mongoose.isValidObjectId(headerUserId) ? headerUserId : undefined }],
          });
        }

        // Check if guest token was sent
        if (!targetUser && headerGuestToken) {
          const foundGuest = await MongoUser.findOne({ guestToken: headerGuestToken });
          if (foundGuest) {
            const SIXTY_DAYS_MS = 60 * 24 * 60 * 60 * 1000;
            const lastSeenTime = foundGuest.lastSeenAt ? new Date(foundGuest.lastSeenAt).getTime() : 0;
            if (lastSeenTime > 0 && (Date.now() - lastSeenTime > SIXTY_DAYS_MS)) {
              await MongoUser.deleteOne({ _id: foundGuest._id }).catch(() => {});
              console.log(`⏱️ Purged guest token inactive for > 60 days in Android current_user: @${foundGuest.username}`);
            } else {
              const now = new Date();
              await MongoUser.updateOne({ _id: foundGuest._id }, { $set: { lastSeenAt: now, isOnline: true } }).catch(() => {});
              foundGuest.lastSeenAt = now;
              targetUser = foundGuest;
            }
          }
        }
      }

      if (targetUser) {
        const userObj: User = {
          id: targetUser.isGuest ? "current_user" : targetUser.id,
          originalId: targetUser.id || (targetUser._id ? targetUser._id.toString() : targetUser.id),
          guestToken: targetUser.guestToken,
          username: targetUser.username,
          name: targetUser.name,
          bio: targetUser.bio || "",
          avatar: targetUser.avatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=120&q=80",
          coverPhoto: targetUser.coverPhoto || "",
          followers: targetUser.followers || 0,
          following: targetUser.following || 0,
          followingUserIds: targetUser.followingUserIds || [],
          savedReelIds: targetUser.savedReelIds || [],
          isGuest: targetUser.isGuest === true,
          isOnline: true,
          lastSeenAt: targetUser.lastSeenAt,
          email: targetUser.email || "",
          address: targetUser.address || "",
          shippingAddress: targetUser.shippingAddress || targetUser.address || "",
          city: targetUser.city || "",
          country: targetUser.country || "",
          phone: targetUser.phone || "",
        };
        res.json({ success: true, user: userObj });
        return;
      }

      res.json({
        success: true,
        user: {
          id: "current_user",
          username: "invitado",
          name: "Invitado",
          avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=120&q=80",
          bio: "Modo explorador",
          isOnline: true,
          followers: 0,
          following: 0,
          followingUserIds: [],
          savedReelIds: [],
          isGuest: true,
        },
      });
    } catch (err: any) {
      console.error("❌ [Android Gateway] Error en current_user:", err);
      res.status(500).json({ error: "Error al obtener usuario actual", details: err.message });
    }
  });

  // Android Auth: Switch or restore user session
  router.post("/users/current/switch", switchUser);

  // Android Auth: Login
  router.post("/auth/login", switchUser);

  router.post(["/auth/register", "/users/register"], registerUser);

  // Android: Iniciar sesión y recuperar perfil completo con correo
  router.post(["/auth/email-login", "/auth/login-email", "/users/current/email-login"], loginWithEmail);

  // Android: Update profile
  router.post("/users/current/update", async (req: Request, res: Response) => {
    try {
      const { userId, name, bio, avatar, email, address, shippingAddress, city, country, phone, currentUsername } = req.body;
      const headerUsername = (req.headers["x-user-username"] as string)?.trim().toLowerCase();
      const headerUserId = (req.headers["x-user-id"] as string)?.trim();
      const targetId = userId || headerUserId;

      if (mongoose.connection.readyState !== 1) {
        res.status(503).json({ error: "La base de datos no está disponible. El perfil no se guardó." });
        return;
      }

      if (!targetId && !currentUsername && !headerUsername) {
        res.status(400).json({ error: "Identificador de usuario requerido para actualización" });
        return;
      }

      const updateFields: any = {};
      if (name !== undefined) updateFields.name = String(name).trim();
      if (bio !== undefined) updateFields.bio = bio.trim();
      if (email !== undefined) updateFields.email = String(email).trim().toLowerCase();
      if (address !== undefined) updateFields.address = String(address).trim();
      if (shippingAddress !== undefined) updateFields.shippingAddress = String(shippingAddress).trim();
      if (city !== undefined) updateFields.city = String(city).trim();
      if (country !== undefined) updateFields.country = String(country).trim();
      if (phone !== undefined) updateFields.phone = String(phone).trim();

      if (avatar) {
        if (typeof avatar === "string" && avatar.startsWith("data:")) {
          const savedAvatar = await uploadBase64ToGCS(avatar, "avatars");
          if (!savedAvatar || !savedAvatar.startsWith("https://storage.googleapis.com/")) {
            throw new Error("La foto de perfil no se pudo guardar en Google Cloud Storage.");
          }
          updateFields.avatar = savedAvatar;
        } else {
          updateFields.avatar = avatar;
        }
      }

      const searchCriteria: any[] = [];
      if (targetId && targetId !== "current_user") {
        searchCriteria.push({ id: targetId });
        if (mongoose.isValidObjectId(targetId)) searchCriteria.push({ _id: targetId });
      }
      if (headerUserId && headerUserId !== "current_user" && headerUserId !== targetId) {
        searchCriteria.push({ id: headerUserId });
        if (mongoose.isValidObjectId(headerUserId)) searchCriteria.push({ _id: headerUserId });
      }
      const resolvedUsername = (currentUsername || headerUsername || "").toLowerCase();
      if (resolvedUsername && resolvedUsername !== "invitado") {
        searchCriteria.push({ username: resolvedUsername });
      }

      if (searchCriteria.length === 0) {
        res.status(400).json({ error: "No se pudo identificar la cuenta cuyo perfil se debe guardar." });
        return;
      }

      const updated = await MongoUser.findOneAndUpdate(
        { $or: searchCriteria },
        { $set: updateFields },
        { returnDocument: "after", runValidators: true }
      );
      if (!updated) {
        res.status(404).json({ error: "No se encontró la cuenta en MongoDB Atlas. El perfil no se guardó." });
        return;
      }

      console.log(`📱 [Android Gateway] Perfil guardado en MongoDB Atlas para ${updated.username}.`);

      const returnedUser: User = {
        id: updated.id,
        originalId: updated._id ? updated._id.toString() : updated.id,
        username: updated.username,
        name: updated.name,
        bio: updated.bio || "",
        avatar: updated.avatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=120&q=80",
        coverPhoto: updated.coverPhoto || "",
        followers: updated.followers || 0,
        following: updated.following || 0,
        followingUserIds: updated.followingUserIds || [],
        savedReelIds: updated.savedReelIds || [],
        isGuest: updated.isGuest === true,
        isOnline: true,
        email: updated.email || "",
        address: updated.address || address || "",
        shippingAddress: updated.shippingAddress || shippingAddress || address || "",
        city: updated.city || city || "",
        country: updated.country || country || "",
        phone: updated.phone || phone || "",
        canSell: updated.canSell === true || isConfiguredSuperadmin(updated),
        isAdmin: isConfiguredSuperadmin(updated),
        role: isConfiguredSuperadmin(updated) ? "superadmin" : (updated.canSell ? "seller" : "user")
      };

      res.json({ success: true, user: returnedUser });
    } catch (err: any) {
      console.error("❌ [Android Gateway] Error al actualizar perfil:", err);
      res.status(err?.code === 11000 ? 409 : 500).json({
        error: err?.code === 11000
          ? "El correo electrónico ya está asociado a otra cuenta."
          : "No se pudo guardar el perfil en MongoDB Atlas.",
        details: err.message
      });
    }
  });

  // Android: Get user by ID / username
  router.get("/users/:id", async (req: Request, res: Response) => {
    try {
      const targetId = req.params.id;
      let user = null;
      if (mongoose.connection.readyState === 1) {
        user = await MongoUser.findOne({
          $or: [
            { id: targetId },
            { username: targetId.toLowerCase() },
            { _id: mongoose.isValidObjectId(targetId) ? targetId : undefined },
          ],
        });
      }

      if (user) {
        res.json({
          success: true,
          user: {
            id: user.id,
            originalId: user._id ? user._id.toString() : user.id,
            username: user.username,
            name: user.name,
            bio: user.bio || "",
            avatar: user.avatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=120&q=80",
            coverPhoto: user.coverPhoto || "",
            followers: user.followers || 0,
            following: user.following || 0,
            followingUserIds: user.followingUserIds || [],
            savedReelIds: user.savedReelIds || [],
            isGuest: false,
            isOnline: true,
            email: user.email || "",
            address: user.address || "",
            shippingAddress: user.shippingAddress || user.address || "",
            city: user.city || "",
            country: user.country || "",
            phone: user.phone || "",
            canSell: user.canSell === true || isConfiguredSuperadmin(user),
            isAdmin: isConfiguredSuperadmin(user),
            role: isConfiguredSuperadmin(user) ? "superadmin" : (user.canSell ? "seller" : "user"),
          },
        });
        return;
      }
      res.status(404).json({ error: "Usuario no encontrado" });
    } catch (err: any) {
      res.status(500).json({ error: "Error al buscar usuario", details: err.message });
    }
  });

  // Android: Get all publications and reels created by a specific user
  router.get("/users/:id/publications", async (req: Request, res: Response) => {
    try {
      const targetId = (req.params.id || "").trim();
      const userIdentifiers = new Set<string>();
      if (targetId) {
        userIdentifiers.add(targetId);
        userIdentifiers.add(targetId.toLowerCase());
      }

      if (mongoose.connection.readyState === 1) {
        const userDoc = await MongoUser.findOne({
          $or: [
            { id: targetId },
            { username: targetId.toLowerCase() },
            { _id: mongoose.isValidObjectId(targetId) ? targetId : undefined },
          ],
        });

        if (userDoc) {
          if (userDoc.id) userIdentifiers.add(userDoc.id);
          if (userDoc.originalId) userIdentifiers.add(userDoc.originalId);
          if (userDoc._id) userIdentifiers.add(userDoc._id.toString());
          if (userDoc.username) {
            userIdentifiers.add(userDoc.username);
            userIdentifiers.add(userDoc.username.toLowerCase());
          }
        }
      }

      let userReels: Reel[] = [];
      if (mongoose.connection.readyState === 1) {
        userReels = await getUserCanonicalReelsFromMongo(userIdentifiers);
      }

      if (userReels.length === 0) {
        userReels = getReels()
          .filter(
            (r) =>
              userIdentifiers.has(r.creatorId) ||
              (r.creatorUsername && userIdentifiers.has(r.creatorUsername.toLowerCase()))
          )
          .map((r) => formatReelDTO(r));
      }

      res.json({
        success: true,
        reels: userReels,
        publicaciones: userReels,
      });
    } catch (err: any) {
      res.status(500).json({ error: "Error al obtener publicaciones del usuario", details: err.message });
    }
  });

  // Android Feed / Reels endpoint: Canonical single source of truth from MongoReel
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

      // If GCS is unavailable or failed, store in MongoDB Atlas GridFS (persistent cloud database, zero local disk)
      if (!hlsUrl || !hlsUrl.startsWith("https://storage.googleapis.com/")) {
        console.log(`📱 [Android Gateway] Almacenando video en la nube en MongoDB Atlas GridFS: ${originalName}`);
        const { saveMediaToMongoGridFS } = await import("./services/mongoGridFs");
        const gridVideo = await saveMediaToMongoGridFS(req.file.buffer, originalName, req.file.mimetype || "video/mp4");
        hlsUrl = gridVideo.url;
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
  router.post("/users/current/save", async (req: Request, res: Response) => {
    try {
      const { reelId, productId, id, userId, username } = req.body;
      const targetItemId = reelId || productId || id;
      if (!targetItemId) {
        res.status(400).json({ error: "ID de publicación o producto requerido" });
        return;
      }

      let currentUserObj: any = null;
      if (mongoose.connection.readyState === 1) {
        const candidates = [userId, username, req.headers["x-user-id"], req.headers["x-user-username"]].filter(
          (c) => c && c !== "user_guest" && c !== "current_user" && c !== "invitado"
        );
        if (candidates.length > 0) {
          currentUserObj = await MongoUser.findOne({
            $or: candidates.flatMap((c) => [
              { id: c },
              { username: c },
              { username: typeof c === "string" ? c.toLowerCase() : c }
            ])
          });
        }

        const headerGuestToken = (req.headers["x-guest-token"] as string)?.trim();
        const bodyGuestToken = req.body?.guestToken;
        const guestToken = headerGuestToken || bodyGuestToken;

        if (!currentUserObj && guestToken) {
          currentUserObj = await MongoUser.findOne({ guestToken });
          if (!currentUserObj) {
            currentUserObj = {
              id: userId || `guest_${Date.now()}`,
              username: username || "invitado",
              name: "Invitado",
              guestToken: guestToken,
              savedReelIds: [],
              followingUserIds: [],
              isGuest: true,
            };
            try {
              await MongoUser.updateOne(
                { guestToken },
                { $setOnInsert: currentUserObj },
                { upsert: true }
              );
            } catch (e) {}
          }
        }
      }

      if (!currentUserObj) {
        res.json({ success: true, saved: true, savedReelIds: [targetItemId] });
        return;
      }

      if (!currentUserObj.savedReelIds) {
        currentUserObj.savedReelIds = [];
      }

      const index = currentUserObj.savedReelIds.indexOf(targetItemId);
      let saved = false;
      if (index > -1) {
        currentUserObj.savedReelIds.splice(index, 1);
      } else {
        currentUserObj.savedReelIds.push(targetItemId);
        saved = true;
      }

      if (mongoose.connection.readyState === 1) {
        await MongoUser.updateOne(
          { $or: [{ id: currentUserObj.id }, { guestToken: currentUserObj.guestToken }] },
          { $set: { savedReelIds: currentUserObj.savedReelIds } },
          { upsert: true }
        );
      }

      res.json({ success: true, saved, savedReelIds: currentUserObj.savedReelIds });
    } catch (err: any) {
      console.error("❌ [Android Gateway] Error en save:", err);
      res.status(500).json({ error: "Error al guardar elemento", details: err.message });
    }
  });

  // Android Shop: Get Orders (supports optional ?userId=...)
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
