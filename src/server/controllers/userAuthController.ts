import { Request, Response } from "express";
import mongoose from "mongoose";
import { waitForMongoConnection } from "../utils/mongoConnection";
import crypto from "crypto";
import { User, Reel } from "../types";
import { MongoUser, MongoSuperAdmin, MongoReel, MongoProduct, MongoOrder, MongoCart, MongoChatMessage } from "../models";
import { generateId } from "../utils/helpers";
import { uploadBase64ToGCS } from "../services/mediaStorage";
import { bucketName } from "../config/storage";
import { getCachedDefaultAvatar } from "./settingsController";
import { formatReelDTO } from "../utils/reelUtils";
import { getUserCanonicalReelsFromMongo } from "../services/reelService";
import {
  mergeGuestCartItems,
  migrateGuestChatHistory,
  migrateGuestReelInteractions,
} from "../utils/guestDataMigration";
import {
  activeOriginalUserId,
  setActiveOriginalUserId,
  pendingRegistrations,
  products,
  reels,
  orders,
  broadcastToAll,
  memoryUsers,
} from "../services/state";

// Auth, session resolution, and account access handlers.
import { findAccount, getUsers, isConfiguredSuperadmin } from "./userAccessController";

// Registration and authentication request handlers.

export async function registerUser(req: Request, res: Response): Promise<void> {
  const { name, avatar, password, email } = req.body;
  if (!name || !String(name).trim()) {
    res.status(400).json({ error: "El nombre completo es obligatorio." });
    return;
  }
  if (!email || !String(email).trim()) {
    res.status(400).json({ error: "El correo electrónico es un requisito obligatorio." });
    return;
  }
  if (!password || !String(password).trim()) {
    res.status(400).json({ error: "La contraseña es obligatoria." });
    return;
  }

  const headerGuestToken = (req.headers["x-guest-token"] as string)?.trim();
  const requestedPlatform = String(
    req.body?.platform ||
    req.headers["x-client-platform"] ||
    req.headers["x-platform"] ||
    "web"
  ).trim().toLowerCase();
  const registrationPlatform: "web" | "android" = requestedPlatform === "android" ? "android" : "web";
  const registeredAt = new Date();
  const cleanEmail = String(email).trim().toLowerCase();
  const lockKey = cleanEmail;
  if (pendingRegistrations.has(lockKey)) {
    res.status(409).json({ error: "Ya hay una solicitud de registro en proceso con este correo. Por favor espera." });
    return;
  }
  pendingRegistrations.add(lockKey);

  try {
    if (mongoose.connection.readyState === 1) {
      await MongoUser.deleteMany({
        $or: [
          { id: "current_user" },
          { id: "usuario_actual" },
          { id: "user_guest" },
          { id: "usuario_invitado" }
        ]
      });

      const existing = await findAccount({ email: cleanEmail });

      if (existing) {
        const isSelfGuest = Boolean(headerGuestToken && existing.guestToken === headerGuestToken && existing.isGuest);
        if (isSelfGuest) {
          // Current guest transitioning to registered account: remove prior guest placeholder
          await MongoUser.deleteOne({ _id: existing._id }).catch(() => {});
        } else {
          if (existing.email && existing.email.toLowerCase() === cleanEmail) {
            res.status(409).json({ error: "⚠️ Este correo electrónico ya está registrado con otra cuenta." });
            return;
          }
          res.status(409).json({ error: "Este correo electrónico ya está registrado." });
          return;
        }
      }
    }

    let resolvedAvatar = avatar || getCachedDefaultAvatar();

    if (avatar && avatar.startsWith("data:")) {
      try {
        console.log("📸 Base64 avatar detected in registration, uploading to GCS...");
        const uploadedAvatar = await uploadBase64ToGCS(avatar, "avatars");
        resolvedAvatar = (uploadedAvatar && !uploadedAvatar.startsWith("data:"))
          ? uploadedAvatar
          : `https://storage.googleapis.com/${bucketName || "elegan-bucket"}/avatars/${Date.now()}-${cleanEmail.replace(/[^a-z0-9]/g, "_")}.png`;
        console.log(`✅ Base64 avatar uploaded to GCS: ${resolvedAvatar}`);
      } catch (uploadErr) {
        console.error("❌ Failed to upload base64 avatar during registration:", uploadErr);
        resolvedAvatar = `https://storage.googleapis.com/${bucketName || "elegan-bucket"}/avatars/${Date.now()}-${cleanEmail.replace(/[^a-z0-9]/g, "_")}.png`;
      }
    }


    let guestSavedReels: string[] = [];
    let priorGuest: any = null;
    const guestId = (req.body?.guestId || req.headers["x-user-id"] || "").toString().trim();

    if (mongoose.connection.readyState === 1) {
      try {
        const guestOrConditions: any[] = [];
        if (headerGuestToken) guestOrConditions.push({ guestToken: headerGuestToken });
        if (guestId && guestId !== "current_user" && guestId !== "user_guest") {
          guestOrConditions.push({ id: guestId });
          if (mongoose.isValidObjectId(guestId)) guestOrConditions.push({ _id: guestId });
        }
        if (guestOrConditions.length > 0) {
          priorGuest = await MongoUser.findOne({ isGuest: true, $or: guestOrConditions });
        }
        guestSavedReels = Array.from(new Set(priorGuest?.savedReelIds || []));
      } catch (e) {
        console.error("Error buscando el perfil invitado para migrar:", e);
        res.status(500).json({ error: "No se pudo localizar la información de invitado para migrarla." });
        return;
      }
    }

    const clientSavedReelIds = Array.isArray(req.body?.savedReelIds) ? req.body.savedReelIds : [];
    const mergedSavedReels = Array.from(new Set([...guestSavedReels, ...clientSavedReelIds]));

    const guestIdCandidates = Array.from(new Set([
      guestId,
      priorGuest?.id,
      priorGuest?.guestToken,
      priorGuest?._id?.toString()
    ])).filter((id): id is string =>
      Boolean(id && id.trim() && !["current_user", "user_guest", "usuario_invitado", "usuario_actual"].includes(id))
    );

    const newUserId = "user_" + generateId();
    const newUser: User & { registeredAt: Date; registrationPlatform: "web" | "android"; platform: "web" | "android" } = {
      id: newUserId,
      originalId: newUserId,
      name: String(name).trim(),
      bio: "",
      email: cleanEmail,
      avatar: resolvedAvatar,
      followers: 0,
      following: priorGuest?.following ?? priorGuest?.followingUserIds?.length ?? 0,
      followingUserIds: priorGuest?.followingUserIds || [],
      savedReelIds: mergedSavedReels,
      isOnline: true,
      password: password || "",
      isGuest: false,
      platform: registrationPlatform,
      registeredAt,
      registrationPlatform,
      canSell: isConfiguredSuperadmin({ email: cleanEmail }),
      address: req.body?.address || priorGuest?.address || "",
      shippingAddress: req.body?.shippingAddress || req.body?.address || priorGuest?.shippingAddress || priorGuest?.address || "",
      city: req.body?.city || priorGuest?.city || "",
      country: req.body?.country || priorGuest?.country || "República Dominicana",
      phone: req.body?.phone || priorGuest?.phone || "",
      postalCode: req.body?.postalCode || priorGuest?.postalCode || "",
    };

    if (mongoose.connection.readyState !== 1) {
      console.error("❌ MongoDB Atlas is not connected (readyState !== 1). Registration blocked.");
      res.status(503).json({
        error: "La base de datos MongoDB no está conectada. No se pueden registrar cuentas sin conexión activa a MongoDB Atlas.",
        code: "DATABASE_NOT_CONNECTED"
      });
      return;
    }

    const isNewSuperadmin = isConfiguredSuperadmin(newUser);
    const AccountModel = isNewSuperadmin ? MongoSuperAdmin : MongoUser;
    const accountData: any = { ...newUser, canSell: isNewSuperadmin || newUser.canSell, isAdmin: isNewSuperadmin, role: isNewSuperadmin ? "superadmin" : "user" };
    const mongoUser = new AccountModel(accountData);
    try {
      await mongoUser.save();
    } catch (saveErr: any) {
      if (saveErr?.code === 11000 && (saveErr?.message?.includes("username") || saveErr?.keyPattern?.username)) {
        console.warn("⚠️ Legacy username index collision detected during save, dropping index and retrying...", saveErr.message);
        try {
          await MongoUser.collection.dropIndex("username_1").catch(() => {});
          const indexes = await MongoUser.collection.indexes().catch(() => []);
          for (const idx of indexes) {
            if (idx.name === "username_1" || (idx.key && idx.key.username)) {
              await MongoUser.collection.dropIndex(idx.name).catch(() => {});
            }
          }
        } catch {}
        await mongoUser.save();
        console.log(`✅ User registration recovered and saved successfully for ${newUser.email}`);
      } else {
        throw saveErr;
      }
    }
    console.log(`Cuenta registrada para ${newUser.email} con id=${newUser.id} en MongoDB Atlas.`);
    setActiveOriginalUserId(newUser.id);

    // Migración de pedidos del invitado
    let migratedOrders: any[] = [];
    if (MongoOrder) {
      try {
        const orderOrQueries: any[] = [
          { buyerId: { $in: guestIdCandidates } },
          { userId: { $in: guestIdCandidates } },
        ];
        if (cleanEmail) {
          const escapedEmail = cleanEmail.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
          orderOrQueries.push({ buyerEmail: { $regex: new RegExp(`^${escapedEmail}$`, "i") } });
          orderOrQueries.push({ "buyer.email": { $regex: new RegExp(`^${escapedEmail}$`, "i") } });
          orderOrQueries.push({ "contactInfo.email": { $regex: new RegExp(`^${escapedEmail}$`, "i") } });
        }

        await MongoOrder.updateMany(
          { $or: orderOrQueries },
          {
            $set: {
              buyerId: newUser.id,
              buyerName: newUser.name,
              buyerEmail: newUser.email || cleanEmail
            }
          }
        );

        migratedOrders = await MongoOrder.find({
          $or: [
            { buyerId: newUser.id },
            ...(cleanEmail ? [{ buyerEmail: cleanEmail }] : [])
          ]
        }).sort({ createdAt: -1 }).lean();
        console.log(`📦 [Server Register] Migrados ${migratedOrders.length} pedidos a ${newUser.name}`);
      } catch (ordErr) {
        console.error("Error migrando pedidos en registerUser:", ordErr);
        throw ordErr;
      }
    }

    // Migración de carrito del invitado
    let userCart: any[] = [];
    if (MongoCart) {
      try {
        const priorCarts = await MongoCart.find({ userId: { $in: guestIdCandidates } }).lean();
        const clientCart = Array.isArray(req.body?.cart) ? req.body.cart : [];
        const mergedCart = mergeGuestCartItems([
          ...priorCarts.map((priorCart: any) => priorCart.items),
          clientCart,
        ]);
        if (mergedCart.length > 0) {
          await MongoCart.findOneAndUpdate(
            { userId: newUser.id },
            { $set: { items: mergedCart, updatedAt: new Date() } },
            { upsert: true, returnDocument: "after" }
          );
          userCart = mergedCart;
        }
      } catch (cartErr) {
        console.error("Error migrando carrito en registerUser:", cartErr);
        throw cartErr;
      }
    }

    await migrateGuestReelInteractions(MongoReel, guestIdCandidates, newUser);
    await migrateGuestChatHistory(MongoChatMessage, guestIdCandidates, newUser.id);

    if (MongoCart) {
      await MongoCart.deleteMany({ userId: { $in: guestIdCandidates.filter(id => id !== newUser.id) } });
    }

    if (priorGuest && priorGuest._id && priorGuest._id.toString() !== newUserId) {
      await MongoUser.deleteOne({ _id: priorGuest._id, isGuest: true });
    }

    const returnedUser = {
      ...newUser,
      id: newUser.id,
      originalId: newUser.id,
      isGuest: false,
      isAdmin: isConfiguredSuperadmin(newUser),
      role: isConfiguredSuperadmin(newUser) ? "superadmin" : (newUser.canSell ? "seller" : "user")
    };

    res.status(201).json({
      success: true,
      user: returnedUser,
      orders: migratedOrders,
      cart: userCart,
      savedReelIds: returnedUser.savedReelIds || [],
      message: `¡Cuenta creada exitosamente! Tus datos han sido vinculados a tu nuevo perfil.`
    });
  } catch (err: any) {
    if (err.code === 11000) {
      console.warn("⚠️ Duplicate key collision caught in MongoDB registration:", err.message);
      if (err.keyPattern?.email || err.message?.includes("email")) {
        res.status(409).json({ error: "Este correo electrónico ya está registrado." });
        return;
      }
      res.status(409).json({ error: "Esta cuenta ya existe en la base de datos." });
      return;
    }
    console.error("❌ Error registering user:", err);
    res.status(500).json({ error: "Error al registrar el usuario", details: err.message });
  } finally {
    pendingRegistrations.delete(lockKey);
    pendingRegistrations.delete(cleanEmail);
  }
}

/**
 * POST /api/users/current/switch
 */

export async function switchUser(req: Request, res: Response): Promise<void> {
  try {
    const cleanEmail = String(req.body?.email || req.body?.targetEmail || "").trim().toLowerCase();
    const password = req.body?.password;
    const isSessionRestore = req.body?.isSessionRestore === true;
    if (!cleanEmail || !cleanEmail.includes("@")) {
      res.status(400).json({ error: "Debe ingresar un correo electrónico válido." });
      return;
    }
    if (!(await waitForMongoConnection())) {
      res.status(503).json({ error: "La base de datos no está disponible." });
      return;
    }
    const targetUser = await findAccount({ email: cleanEmail, id: { $ne: "current_user" } });
    if (!targetUser) {
      res.status(404).json({ error: "No existe ninguna cuenta registrada con este correo electrónico.", code: "USER_NOT_FOUND" });
      return;
    }
    const expectedPassword = String(targetUser.password || "").trim();
    if (!isSessionRestore && (!password || !expectedPassword || expectedPassword !== String(password).trim())) {
      res.status(401).json({ error: "La contraseña ingresada es incorrecta. Por favor verifícala." });
      return;
    }
    const headerGuestToken = (req.headers["x-guest-token"] as string)?.trim();
    if (headerGuestToken) {
      try {
        const priorGuest = await MongoUser.findOne({ guestToken: headerGuestToken });
        if (priorGuest && Array.isArray(priorGuest.savedReelIds) && priorGuest.savedReelIds.length > 0) {
          const merged = Array.from(new Set([...(targetUser.savedReelIds || []), ...priorGuest.savedReelIds]));
          targetUser.savedReelIds = merged;
          await targetUser.save();
        }
      } catch (guestErr) { console.warn("No se pudieron migrar los guardados de la sesión invitada:", guestErr); }
    }
    setActiveOriginalUserId(targetUser.id);
    const isSuperadmin = isConfiguredSuperadmin(targetUser);
    const returnedUser = {
      id: "current_user", originalId: targetUser.id, username: targetUser.name || "", name: targetUser.name,
      avatar: targetUser.avatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=120&q=80",
      followers: targetUser.followers || 0, following: targetUser.following || 0,
      followingUserIds: targetUser.followingUserIds || [], savedReelIds: targetUser.savedReelIds || [],
      guestToken: targetUser.guestToken || headerGuestToken || undefined, isGuest: false, password: targetUser.password || "",
      email: targetUser.email || cleanEmail, address: targetUser.address || "",
      shippingAddress: targetUser.shippingAddress || targetUser.address || "", city: targetUser.city || "",
      country: targetUser.country || "", phone: targetUser.phone || "", postalCode: targetUser.postalCode || "",
      canSell: targetUser.canSell === true || isSuperadmin, isAdmin: isSuperadmin,
      role: isSuperadmin ? "superadmin" : (targetUser.canSell ? "seller" : "user")
    };
    res.json({ success: true, user: returnedUser });
  } catch (routeErr: any) {
    console.error("Error al iniciar sesión con correo:", routeErr);
    res.status(500).json({ error: "No se pudo iniciar sesión.", details: routeErr.message });
  }
}
/**
 * POST /api/users/:id/permission
 * Superadmin-only toggle for seller capabilities.
 */

export async function logoutUser(req: Request, res: Response): Promise<void> {
  try {
    setActiveOriginalUserId("user_guest");
    console.log(`🔄 Session logged out on server. Reset activeOriginalUserId to user_guest`);
    res.json({ success: true, message: "Logged out successfully" });
  } catch (routeErr: any) {
    console.error("❌ Exception caught in user/logout endpoint:", routeErr);
    res.status(500).json({ error: "Internal server error on logout", details: routeErr.message });
  }
}

/**
 * DELETE /api/users/:id
 * Administrative deletion of a user profile
 */

export async function loginWithEmail(req: Request, res: Response): Promise<void> {
  try {
    const rawEmail = req.body?.email || req.body?.targetEmail;
    if (!rawEmail || typeof rawEmail !== "string") {
      res.status(400).json({ error: "Debe ingresar un correo electrónico válido." });
      return;
    }
    const cleanEmail = rawEmail.trim().toLowerCase();
    const escapedEmail = cleanEmail.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

    let user: any = null;
    if (mongoose.connection.readyState === 1) {
      user = await findAccount({
        email: cleanEmail,
        id: { $ne: "current_user" }
      });
    }

    if (!user) {
      const allUsers = await getUsers();
      user = allUsers.find(
        (u) => u.email?.trim().toLowerCase() === cleanEmail
      );
    }

    if (!user) {
      res.status(404).json({
        error: "No encontramos ninguna cuenta con este correo electrónico. Por favor verifica que esté bien escrito o regístralo primero en tu perfil."
      });
      return;
    }

    setActiveOriginalUserId(user.id);

    // Recuperar historial de compras / pedidos de este usuario en MongoDB Atlas
    let userOrders: any[] = [];
    if (mongoose.connection.readyState === 1 && MongoOrder) {
      try {
        userOrders = await MongoOrder.find({
          $or: [
            { userId: user.id },
            { "buyer.email": { $regex: new RegExp(`^${escapedEmail}$`, "i") } },
            { buyerEmail: { $regex: new RegExp(`^${escapedEmail}$`, "i") } },
            { "contactInfo.email": { $regex: new RegExp(`^${escapedEmail}$`, "i") } }
          ]
        }).sort({ createdAt: -1 }).lean();
      } catch (orderErr) {
        console.warn("Error cargando pedidos para email-login:", orderErr);
      }
    }

    // Recuperar carrito guardado en MongoDB Atlas
    let userCart: any[] = [];
    if (mongoose.connection.readyState === 1 && MongoCart) {
      try {
        const cartDoc = await MongoCart.findOne({ userId: user.id });
        if (cartDoc && Array.isArray(cartDoc.items)) {
          userCart = cartDoc.items;
        }
      } catch (cartErr) {
        console.warn("Error cargando carrito para email-login:", cartErr);
      }
    }

    const formattedUser: User = {
      id: user.id,
      originalId: user._id ? user._id.toString() : user.id,
      name: user.name,
      bio: "",
      avatar: user.avatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=120&q=80",
      followers: user.followers || 0,
      following: user.following || 0,
      followingUserIds: user.followingUserIds || [],
      savedReelIds: user.savedReelIds || [],
      savedProductIds: user.savedProductIds || [],
      isGuest: false,
      isOnline: true,
      username: user.name || "",
      email: user.email || cleanEmail,
      address: user.address || "",
      shippingAddress: user.shippingAddress || user.address || "",
      city: user.city || "",
      country: user.country || "",
      phone: user.phone || "",
      postalCode: user.postalCode || "",
      canSell: user.canSell === true || isConfiguredSuperadmin(user),
      isAdmin: isConfiguredSuperadmin(user),
      role: isConfiguredSuperadmin(user) ? "superadmin" : (user.canSell ? "seller" : "user")
    };

    console.log(`Sesión iniciada con correo: ${cleanEmail} (Pedidos: ${userOrders.length}, Carrito: ${userCart.length})`);

    res.json({
      success: true,
      user: formattedUser,
      orders: userOrders,
      cart: userCart,
      savedReelIds: formattedUser.savedReelIds || [],
      savedProductIds: formattedUser.savedProductIds || [],
      message: `¡Bienvenido/a de nuevo, ${formattedUser.name}! Tu perfil, historial de compras, carrito y dirección han sido restaurados.`
    });
  } catch (err: any) {
    console.error("❌ Error en email-login:", err);
    res.status(500).json({ error: "Error al iniciar sesión con correo", details: err.message });
  }
}
