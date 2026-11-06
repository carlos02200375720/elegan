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

import { findAccount, getUsers, isConfiguredSuperadmin } from "./userAuthController";

// User profile, saved content, and administration handlers.

export async function getAllUsers(req: Request, res: Response): Promise<void> {
  const dbUsers = await getUsers();
  res.json(dbUsers);
}

/**
 * GET /api/users/:id
 */

export async function getUserById(req: Request, res: Response): Promise<void> {
  const rawParam = (req.params.id || "").trim();
  const cleanParam = rawParam.toLowerCase().replace(/^@/, "");

  // The test profile 'creador' has been deleted and must return 404
  if (cleanParam === "creador" || cleanParam === "creator") {
    res.status(404).json({ error: "Usuario no encontrado" });
    return;
  }

  const dbUsers = await getUsers();

  const headerUserId = (req.headers["x-user-id"] as string)?.trim();
  const headerGuestToken = (req.headers["x-guest-token"] as string)?.trim();
  const queryUserId = (req.query.userId as string)?.trim();
  const queryGuestToken = (req.query.guestToken as string)?.trim();
  const guestTokenCandidate = headerGuestToken || queryGuestToken;

  let user: any = null;

  // Dynamic current_user resolver to preserve user session
  if (
    rawParam === "current_user" ||
    cleanParam === "current_user" ||
    cleanParam === "invitado" ||
    cleanParam === "user_guest" ||
    cleanParam === "guest"
  ) {
    let activeUser: any = null;
    const targetIdentifier = headerUserId || queryUserId;

    if (mongoose.connection.readyState === 1) {
      if (targetIdentifier && targetIdentifier !== "invitado" && targetIdentifier !== "user_guest" && targetIdentifier !== "current_user" && targetIdentifier !== "guest") {
        activeUser = await findAccount({
          $or: [
            { id: targetIdentifier },
            { email: targetIdentifier.toLowerCase() }
          ]
        });
      }

      if (!activeUser && activeOriginalUserId && activeOriginalUserId !== "user_guest" && activeOriginalUserId !== "current_user" && activeOriginalUserId !== "invitado") {
        activeUser = await findAccount({ id: activeOriginalUserId });
      }
    }

    if (!activeUser && targetIdentifier && targetIdentifier !== "invitado" && targetIdentifier !== "user_guest" && targetIdentifier !== "guest") {
      activeUser = dbUsers.find(u =>
        u.id === targetIdentifier ||
        (u.originalId && u.originalId === targetIdentifier) ||
        (u.email && u.email.toLowerCase() === targetIdentifier.toLowerCase())
      );
    }

    if (activeUser && !activeUser.isGuest) {
      user = {
        id: "current_user",
        originalId: activeUser.id,
        name: activeUser.name,
        avatar: activeUser.avatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=120&q=80",
        isOnline: activeUser.isOnline !== undefined ? activeUser.isOnline : true,
        followers: activeUser.followers || 0,
        following: activeUser.following || 0,
        followingUserIds: activeUser.followingUserIds || [],
        savedReelIds: activeUser.savedReelIds || [],
        isGuest: false,
        password: activeUser.password || "",
        email: activeUser.email || "",
        address: activeUser.address || "",
        shippingAddress: activeUser.shippingAddress || activeUser.address || "",
        city: activeUser.city || "",
        country: activeUser.country || "",
        phone: activeUser.phone || "",
        postalCode: activeUser.postalCode || "",
        canSell: activeUser.canSell === true || isConfiguredSuperadmin(activeUser),
        isAdmin: isConfiguredSuperadmin(activeUser),
        role: isConfiguredSuperadmin(activeUser) ? "superadmin" : (activeUser.canSell ? "seller" : "user")
      };
    } else {
      user = {
        id: "current_user",
        name: "Invitado",
        avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=120&q=80",
        isOnline: false,
        followers: 0,
        following: 0,
        followingUserIds: [],
        savedReelIds: [],
        isGuest: true,
        password: "",
        email: "",
      };
    }
  } else {
    // Direct MongoDB lookup
    if (mongoose.connection.readyState === 1) {
      try {
        const found = await findAccount({
          $or: [
            { id: rawParam },
            { id: cleanParam },
            { email: cleanParam },
            { email: rawParam },
            { name: rawParam }
          ]
        });
        if (found) {
          user = {
            id: found.id,
            originalId: found.id,
            name: found.name,
            avatar: found.avatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=120&q=80",
            isOnline: found.isOnline !== undefined ? found.isOnline : false,
            followers: found.followers || 0,
            following: found.following || 0,
            followingUserIds: found.followingUserIds || [],
            savedReelIds: found.savedReelIds || [],
            isGuest: false,
            password: found.password || "",
            email: found.email || "",
            address: found.address || "",
            shippingAddress: found.shippingAddress || found.address || "",
            city: found.city || "",
            country: found.country || "",
            phone: found.phone || "",
            postalCode: found.postalCode || "",
            canSell: found.canSell === true || isConfiguredSuperadmin(found),
            isAdmin: isConfiguredSuperadmin(found),
            role: isConfiguredSuperadmin(found) ? "superadmin" : (found.canSell ? "seller" : "user")
          };
        }
      } catch (dbErr: any) {
        console.warn("⚠️ User profile lookup failed; continuing with cached/in-memory data:", dbErr?.message || dbErr);
      }
    }

    if (!user) {
      const normalizedParamSlug = cleanParam
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/\s+/g, "")
        .replace(/[^a-z0-9._-]/g, "");
      user = dbUsers.find((u) => {
        const uNameSlug = (u.name || "")
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .toLowerCase()
          .replace(/\s+/g, "")
          .replace(/[^a-z0-9._-]/g, "");
        return (
          u.id === rawParam ||
          uNameSlug === normalizedParamSlug ||
          u.email?.toLowerCase() === cleanParam ||
          u.id?.toLowerCase() === cleanParam ||
          (u.originalId && u.originalId === rawParam)
        );
      });
    }

    if (!user) {
      const normalizedParamSlug = cleanParam
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/\s+/g, "")
        .replace(/[^a-z0-9._-]/g, "");
      const matchedOrder = orders.find((o) => {
        const bNameSlug = (o.buyerName || "")
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .toLowerCase()
          .replace(/\s+/g, "")
          .replace(/[^a-z0-9._-]/g, "");
        return (
          o.buyerId === rawParam ||
          o.buyerId?.toLowerCase() === cleanParam ||
          (bNameSlug && bNameSlug === normalizedParamSlug) ||
          o.buyerEmail?.toLowerCase() === cleanParam
        );
      });
      if (matchedOrder) {
        const resolvedId = matchedOrder.buyerId || rawParam;
        const resolvedEmail = matchedOrder.buyerEmail || (cleanParam.includes("@") ? cleanParam : "");
        user = {
          id: resolvedId,
          originalId: resolvedId,
          name: matchedOrder.buyerName || "Cliente",
          avatar: matchedOrder.buyerAvatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=120&q=80",
          isOnline: true,
          followers: 0,
          following: 0,
          followingUserIds: [],
          savedReelIds: [],
          isGuest: false,
          password: "123",
          email: resolvedEmail,
        };
      }
    }

    // Fallback in reels
    if (!user) {
      const matchedReel = reels.find(
        (r) =>
          r.creatorId === rawParam ||
          r.creatorName?.toLowerCase() === cleanParam ||
          (cleanParam && r.creatorId && cleanParam.includes(r.creatorId.toLowerCase()))
      );

      let matchedMongoReel = null;
      if (!matchedReel && mongoose.connection.readyState === 1) {
        matchedMongoReel = await MongoReel.findOne({
          $or: [
            { creatorId: rawParam },
            { creatorName: rawParam }
          ]
        }).catch(() => null);
      }

      const sourceReel = matchedReel || matchedMongoReel;
      if (
        sourceReel &&
        sourceReel.creatorId !== "creator" &&
        sourceReel.creatorId !== "creador"
      ) {
        let creatorMongoUser = null;
        if (mongoose.connection.readyState === 1) {
          creatorMongoUser = await MongoUser.findOne({
            id: sourceReel.creatorId
          }).catch(() => null);
        }
        user = {
          id: sourceReel.creatorId || rawParam,
          originalId: sourceReel.creatorId || rawParam,
          name: sourceReel.creatorName || "Usuario",
          avatar: sourceReel.creatorAvatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=120&q=80",
          followers: creatorMongoUser?.followers || 0,
          following: creatorMongoUser?.following || 0,
          followingUserIds: creatorMongoUser?.followingUserIds || [],
          savedReelIds: creatorMongoUser?.savedReelIds || [],
          isGuest: false,
          password: "",
          email: "",
        };
      }
    }

    // Fallback in products
    if (!user) {
      const matchedProd = products.find(
        (p) =>
          p.sellerId === rawParam ||
          p.sellerName?.toLowerCase() === cleanParam ||
          (cleanParam && p.sellerId && cleanParam.includes(p.sellerId.toLowerCase()))
      );

      let matchedMongoProd = null;
      if (!matchedProd && mongoose.connection.readyState === 1) {
        matchedMongoProd = await MongoProduct.findOne({
          $or: [
            { sellerId: rawParam },
            { sellerName: rawParam }
          ]
        }).catch(() => null);
      }

      const sourceProd = matchedProd || matchedMongoProd;
      if (sourceProd) {
        let sellerMongoUser = null;
        if (mongoose.connection.readyState === 1) {
          sellerMongoUser = await MongoUser.findOne({
            id: sourceProd.sellerId
          }).catch(() => null);
        }
        user = {
          id: sourceProd.sellerId || rawParam,
          originalId: sourceProd.sellerId || rawParam,
          name: sourceProd.sellerName || "Tienda Oficial",
          avatar: sourceProd.sellerAvatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=120&q=80",
          followers: sellerMongoUser?.followers || 85,
          following: sellerMongoUser?.following || 15,
          followingUserIds: sellerMongoUser?.followingUserIds || [],
          savedReelIds: sellerMongoUser?.savedReelIds || [],
          isGuest: false,
          password: "",
          email: "",
        };
      }
    }
  }

  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  const userIdentifiers = new Set<string>();
  if (user.id) userIdentifiers.add(user.id);
  if (user.originalId) userIdentifiers.add(user.originalId);
  if (user.email) {
    userIdentifiers.add(user.email);
    userIdentifiers.add(user.email.toLowerCase());
  }
  if (user.guestToken) {
    userIdentifiers.add(user.guestToken);
  }
  if (activeOriginalUserId && activeOriginalUserId !== "user_guest" && (user.id === "current_user" || user.originalId === activeOriginalUserId)) {
    userIdentifiers.add(activeOriginalUserId);
  }

  const seenProd = new Set<string>();
  const userProducts = products
    .filter((p) =>
      userIdentifiers.has(p.sellerId) ||
      (user.id === "current_user" && p.sellerId === activeOriginalUserId)
    )
    .filter((p) => {
      if (!p.id || seenProd.has(p.id)) return false;
      seenProd.add(p.id);
      return true;
    });

  let userReels: Reel[] = [];
  if (mongoose.connection.readyState === 1) {
    try {
      userReels = await getUserCanonicalReelsFromMongo(userIdentifiers);
    } catch (err) {
      console.warn("⚠️ Failed to load user reels directly from MongoReel:", err);
    }
  }

  if (userReels.length === 0) {
    const seenReel = new Set<string>();
    userReels = reels
      .filter((r) =>
        userIdentifiers.has(r.creatorId) ||
        (user.id === "current_user" && r.creatorId === activeOriginalUserId)
      )
      .filter((r) => {
        if (!r.id || seenReel.has(r.id)) return false;
        seenReel.add(r.id);
        return true;
      });
  }

  // Purchases
  const userPurchases = orders.filter((o) => {
    if (user.id === "current_user") {
      return (
        o.buyerId === "current_user" ||
        (activeOriginalUserId && o.buyerId === activeOriginalUserId) ||
        userIdentifiers.has(o.buyerId || "") ||
        (o.buyerEmail && userIdentifiers.has(o.buyerEmail.toLowerCase())) ||
        !o.buyerId
      );
    }
    return (
      userIdentifiers.has(o.buyerId || "") ||
      (o.buyerEmail && userIdentifiers.has(o.buyerEmail.toLowerCase()))
    );
  });

  // Sales
  const userSales = orders.filter((o) => {
    return o.items.some((it) => {
      if (user.id === "current_user") {
        return it.sellerId === "current_user" || (activeOriginalUserId && it.sellerId === activeOriginalUserId) || !it.sellerId;
      }
      return userIdentifiers.has(it.sellerId || "");
    });
  });

  const seenSaved = new Set<string>();
  const userSavedReels = reels
    .filter((r) => (user.savedReelIds || []).includes(r.id))
    .filter((r) => {
      if (!r.id || seenSaved.has(r.id)) return false;
      seenSaved.add(r.id);
      return true;
    });

  const seenSavedProd = new Set<string>();
  const userSavedProducts = products
    .filter((p) => (user.savedReelIds || []).includes(p.id))
    .filter((p) => {
      if (!p.id || seenSavedProd.has(p.id)) return false;
      seenSavedProd.add(p.id);
      return true;
    });

  res.json({
    user,
    products: userProducts,
    reels: userReels,
    orders: userPurchases,
    purchases: userPurchases,
    sales: userSales,
    savedReels: userSavedReels,
    savedProducts: userSavedProducts,
  });
}

/**
 * GET /api/users/:id/publications
 */

export async function getUserPublications(req: Request, res: Response): Promise<void> {
  try {
    const targetId = (req.params.id || "").trim();
    const userIdentifiers = new Set<string>();
    if (targetId) {
      userIdentifiers.add(targetId);
      userIdentifiers.add(targetId.toLowerCase());
    }

    // MongoDB is the primary source, but publication loading must remain available
    // during transient DB/query failures. Always fall back to the in-memory feed.
    if (mongoose.connection.readyState === 1) {
      try {
        const userDoc = await MongoUser.findOne({ id: targetId });
        if (userDoc) {
          if (userDoc.id) userIdentifiers.add(userDoc.id);
          if (userDoc.originalId) userIdentifiers.add(userDoc.originalId);
          if (userDoc._id) userIdentifiers.add(userDoc._id.toString());
        }
      } catch (dbErr: any) {
        console.warn("⚠️ Publication user lookup failed; using fallback identifiers:", dbErr?.message || dbErr);
      }
    }

    let userReels: Reel[] = [];
    if (mongoose.connection.readyState === 1) {
      try {
        userReels = await getUserCanonicalReelsFromMongo(userIdentifiers);
      } catch (dbErr: any) {
        console.warn("⚠️ MongoReel publication query failed; using in-memory fallback:", dbErr?.message || dbErr);
      }
    }

    if (userReels.length === 0) {
      const seenReelIds = new Set<string>();
      userReels = reels
        .filter(
          (r) => userIdentifiers.has(r.creatorId)
        )
        .filter((r) => {
          if (!r.id || seenReelIds.has(r.id)) return false;
          seenReelIds.add(r.id);
          return true;
        })
        .map((r) => formatReelDTO(r));
    }

    res.json({
      reels: userReels,
      publicaciones: userReels,
    });
  } catch (err: any) {
    res.status(500).json({ error: "Error al obtener publicaciones", details: err.message });
  }
}

/**
 * POST /api/users/current/save
 */

export async function toggleSaveReel(req: Request, res: Response): Promise<void> {
  const { reelId, productId, id, userId } = req.body;
  const targetItemId = reelId || productId || id;
  if (!targetItemId) {
    res.status(400).json({ error: "ID de publicación o producto requerido." });
    return;
  }

  let currentUserObj: any = null;
  const guestToken =
    (req.headers["x-guest-token"] as string)?.trim() ||
    String(req.body?.guestToken || "").trim();

  if (mongoose.connection.readyState === 1 && !currentUserObj) {
    const candidates = [userId, activeOriginalUserId].filter(
      (id) => id && id !== "user_guest" && id !== "current_user" && id !== "invitado"
    );
    if (candidates.length > 0) {
      currentUserObj = await MongoUser.findOne({
        $or: candidates.map((id) => ({ id }))
      });
    }

    if (!currentUserObj && guestToken) {
      currentUserObj = {
        id: guestToken,
        guestToken,
        name: "Invitado",
        savedReelIds: [],
        followingUserIds: [],
        isGuest: true,
      };
    }
  }

  if (!currentUserObj) {
    res.status(401).json({ error: "No se pudo identificar al usuario o token." });
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

  if (mongoose.connection.readyState === 1 && !currentUserObj.isGuest && currentUserObj._id) {
    await MongoUser.updateOne(
      { _id: currentUserObj._id },
      { $set: { savedReelIds: currentUserObj.savedReelIds } }
    );
  }

  // Update saves count on target reel if it's a reel
  const reel = reels.find((r) => r.id === targetItemId);
  let newSavesCount = 0;
  if (reel) {
    if (saved) {
      reel.saves = (reel.saves || 0) + 1;
    } else {
      reel.saves = Math.max(0, (reel.saves || 1) - 1);
    }
    newSavesCount = reel.saves;

    if (mongoose.connection.readyState === 1) {
      try {
        await MongoReel.updateOne({ id: reel.id }, { $set: { saves: reel.saves } });
      } catch (err) {
        console.error("❌ Failed to update reel saves in MongoDB:", err);
      }
    }

    broadcastToAll({
      type: "reel_updated",
      reelId: reel.id,
      likes: reel.likes,
      saves: reel.saves,
      commentsCount: reel.comments.length
    });
  }

  res.json({ success: true, saved, saves: newSavesCount, savedReelIds: currentUserObj.savedReelIds });
}

/**
 * POST /api/users/:targetUserId/follow
 * Follow functionality removed (platform is a single-owner store).
 */

export async function toggleFollow(req: Request, res: Response): Promise<void> {
  res.json({
    success: true,
    isFollowing: false,
    followingUserIds: [],
    targetUserId: req.params.targetUserId || "",
    targetFollowers: 0,
    currentUserFollowing: 0
  });
}

/**
 * POST /api/users/current/update
 */

export async function updateCurrentUser(req: Request, res: Response): Promise<void> {
  const { name, avatar, password, userId, email, address, shippingAddress, city, country, phone, postalCode } = req.body;
  if (mongoose.connection.readyState !== 1) {
    res.status(503).json({ error: "MongoDB Atlas no está disponible. El perfil no se guardó." });
    return;
  }

  const headerUserId = (req.headers["x-user-id"] as string)?.trim();
  let currentUserObj: any = null;

  const idCandidates = [activeOriginalUserId, userId, headerUserId].filter(
    id => id && id !== "user_guest" && id !== "current_user" && id !== "invitado" && id !== "guest"
  );

  try {
    for (const cid of idCandidates) {
      currentUserObj = await findAccount({ id: cid });
      if (currentUserObj) break;
    }
  } catch (err) {
    console.error("Failed to find profile in MongoDB Atlas:", err);
    res.status(503).json({ error: "No se pudo consultar la cuenta en MongoDB Atlas." });
    return;
  }

  if (!currentUserObj) {
    res.status(401).json({ error: "Debe iniciar sesión para realizar esta acción." });
    return;
  }

  setActiveOriginalUserId(currentUserObj.id);

  const updateFields: any = {};
  if (name !== undefined) updateFields.name = name;
  if (password !== undefined) updateFields.password = password;
  if (email !== undefined) updateFields.email = String(email).trim().toLowerCase();
  if (address !== undefined) updateFields.address = address;
  if (shippingAddress !== undefined) updateFields.shippingAddress = shippingAddress;
  if (city !== undefined) updateFields.city = city;
  if (country !== undefined) updateFields.country = country;
  if (phone !== undefined) updateFields.phone = phone;
  if (postalCode !== undefined) updateFields.postalCode = String(postalCode).trim();

  if (avatar !== undefined) {
    if (avatar && avatar.startsWith("data:")) {
      try {
        console.log("📸 Base64 avatar detected in update, uploading to Cloud Storage...");
        const savedAvatar = await uploadBase64ToGCS(avatar, "avatars");
        if (!savedAvatar) {
          throw new Error("La foto de perfil no se pudo guardar en el almacenamiento en la nube.");
        }
        console.log(`✅ Base64 avatar uploaded to cloud storage: ${savedAvatar}`);
        updateFields.avatar = savedAvatar;
      } catch (uploadErr: any) {
        console.error("❌ Failed to upload base64 avatar to Cloud Storage:", uploadErr?.message || uploadErr);
        res.status(500).json({ error: "No se pudo guardar la foto de perfil en el almacenamiento en la nube." });
        return;
      }
    } else {
      updateFields.avatar = avatar;
    }
  }

  let updatedUser: any;
  try {
    const AccountModel = isConfiguredSuperadmin(currentUserObj) ? MongoSuperAdmin : MongoUser;
    updatedUser = await AccountModel.findOneAndUpdate(
      { id: currentUserObj.id },
      updateFields,
      { returnDocument: "after", runValidators: true }
    );
  } catch (err: any) {
    console.error("Failed to update profile in MongoDB Atlas:", err);
    res.status(err?.code === 11000 ? 409 : 500).json({
      error: err?.code === 11000
        ? "El correo electrónico ya está asociado a otra cuenta."
        : "No se pudo guardar el perfil en MongoDB Atlas."
    });
    return;
  }
  if (!updatedUser) {
    res.status(404).json({ error: "No se encontró la cuenta en MongoDB Atlas. El perfil no se guardó." });
    return;
  }
  console.log(`💾 User profile updated directly in MongoDB Atlas for ${updatedUser.name || updatedUser.email}.`);

  // Update in memory items that reference this user
  reels.forEach(r => {
    if (r.creatorId === "current_user" || r.creatorId === currentUserObj.id) {
      if (name !== undefined) r.creatorName = name;
      if (avatar !== undefined) r.creatorAvatar = updatedUser.avatar;
    }
    r.comments.forEach(c => {
      if (c.userId === currentUserObj.id) {
        if (name !== undefined) c.name = name;
        if (avatar !== undefined) c.avatar = updatedUser.avatar;
      }
    });
  });

  const returnedUser = {
    ...(updatedUser?.toObject ? updatedUser.toObject() : updatedUser),
    id: "current_user",
    originalId: currentUserObj.id,
  };

  res.json({ success: true, user: returnedUser });
}

/**
 * POST /api/users/register
 */

export async function updateUserSellerPermission(req: Request, res: Response): Promise<void> {
  try {
    const targetId = String(req.params.id || "").trim();
    const canSell = req.body?.canSell === true;
    const requesterId = String(req.headers["x-user-id"] || "").trim();
    const requesterUsername = String(req.headers["x-user-username"] || "").trim().toLowerCase();
    const configuredSuperadmin = String(process.env.VITE_SUPERADMIN_EMAIL || process.env.SUPERADMIN_EMAIL || "cg0220037@gmail.com").trim().toLowerCase();

    if (!targetId || !requesterId) {
      res.status(403).json({ error: "Solo el superadministrador puede cambiar permisos." });
      return;
    }

    if (mongoose.connection.readyState !== 1) {
      res.status(503).json({ error: "Base de datos no disponible." });
      return;
    }

    const requester = await findAccount({
      $or: [
        { id: requesterId },
        ...(requesterUsername ? [{ username: requesterUsername }] : [])
      ]
    });

    if (!requester || !isConfiguredSuperadmin(requester)) {
      res.status(403).json({ error: "Solo el superadministrador puede cambiar permisos." });
      return;
    }

    const target = await MongoUser.findOne({
      $or: [{ id: targetId }, { username: targetId.toLowerCase() }]
    });

    if (!target) {
      res.status(404).json({ error: "Usuario no encontrado." });
      return;
    }

    if (isConfiguredSuperadmin(target)) {
      res.status(400).json({ error: "No se pueden revocar los permisos del superadministrador." });
      return;
    }

    target.canSell = canSell;
    await target.save();

    res.json({
      success: true,
      userId: target.id,
      canSell: target.canSell === true
    });
  } catch (err: any) {
    console.error("❌ Error updating user seller permission:", err);
    res.status(500).json({ error: "Error al actualizar el permiso del usuario", details: err.message });
  }
}

/**
 * POST /api/users/current/logout
 */

export async function adminDeleteUser(req: Request, res: Response): Promise<void> {
  try {
    const rawId = (req.params.id || "").trim();
    if (!rawId) {
      res.status(400).json({ error: "ID de usuario requerido" });
      return;
    }
    const cleanId = rawId.toLowerCase().replace("@", "");

    if (mongoose.connection.readyState === 1) {
      await MongoUser.deleteMany({
        $or: [
          { id: rawId },
          { id: cleanId },
          { username: rawId },
          { username: cleanId }
        ]
      });
    }

    console.log(`🛡️ Admin deleted user ${rawId}`);
    res.json({ success: true, message: `Usuario ${rawId} eliminado exitosamente` });
  } catch (err: any) {
    console.error("❌ Error deleting user as admin:", err);
    res.status(500).json({ error: "Error al eliminar usuario", details: err.message });
  }
}

/**
 * POST /api/auth/email-login or POST /api/users/current/email-login
 * Iniciar sesión directamente con correo para recuperar perfil, pedidos, carrito y guardados
 */
