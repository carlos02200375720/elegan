import { Request, Response } from "express";
import mongoose from "mongoose";
import crypto from "crypto";
import { User, Reel } from "../../types";
import { MongoUser, MongoReel, MongoProduct, MongoOrder, MongoCart, MongoChatMessage } from "../models";
import { generateId } from "../utils/helpers";
import { uploadBase64ToGCS } from "../services/mediaStorage";
import { bucketName } from "../config/storage";
import { getCachedDefaultAvatar, getCachedDefaultCoverPhoto } from "./settingsController";
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

/**
 * Get all real users directly from MongoDB Atlas (excluding guests)
 */
export async function getUsers(): Promise<User[]> {
  try {
    if (mongoose.connection.readyState !== 1 && mongoose.connection.readyState === 2) {
      await Promise.race([
        new Promise((resolve) => mongoose.connection.once("connected", resolve)),
        new Promise((resolve) => setTimeout(resolve, 3500)),
      ]);
    }
    if (mongoose.connection.readyState === 1) {
      const dbUsers = await MongoUser.find({
        id: { $nin: ["current_user", "user_guest", "creator", "creador"] },
        username: { $nin: ["invitado", "creador", "creator"] }
      });
      const mapped = dbUsers.map((u: any) => ({
        id: u.id,
        username: u.username,
        name: u.name,
        avatar: u.avatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=120&q=80",
        bio: u.bio || "Creador en la plataforma",
        isOnline: u.isOnline !== undefined ? u.isOnline : false,
        followers: u.followers || 0,
        following: u.following || 0,
        followingUserIds: u.followingUserIds || [],
        savedReelIds: u.savedReelIds || [],
        coverPhoto: u.coverPhoto || "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80",
        isGuest: u.isGuest || false,
        password: u.password || "",
        email: u.email || "",
        address: u.address || "",
        shippingAddress: u.shippingAddress || u.address || "",
        city: u.city || "",
        country: u.country || "",
        phone: u.phone || "",
        privacyPolicy: u.privacyPolicy || "",
        canSell: u.canSell === true || isConfiguredSuperadmin(u),
        isAdmin: isConfiguredSuperadmin(u),
        role: isConfiguredSuperadmin(u) ? "superadmin" : (u.canSell ? "seller" : "user")
      }));
      for (const memUser of memoryUsers) {
        if (!mapped.some((u) => u.id === memUser.id || u.username?.toLowerCase() === memUser.username?.toLowerCase())) {
          mapped.push(memUser);
        }
      }
      return mapped;
    } else {
      console.warn("⚠️ Cannot fetch users: MongoDB connection readyState is", mongoose.connection.readyState);
    }
  } catch (err) {
    console.error("Error fetching users from MongoDB:", err);
  }

  return [...memoryUsers];
}

/**
 * Helper to resolve the authenticated user for publications and products
 */
export async function resolveAuthenticatedUser(req: any, fallbackRole = "creator"): Promise<any> {
  const body = req.body || {};
  const headerUserId = req.headers["x-user-id"];
  const headerUsername = req.headers["x-user-username"];

  const idCandidates: string[] = [
    body.creatorOriginalId,
    body.sellerOriginalId,
    body.originalId,
    body.sellerId !== "current_user" ? body.sellerId : undefined,
    body.creatorId !== "current_user" ? body.creatorId : undefined,
    headerUserId !== "current_user" ? headerUserId : undefined,
    activeOriginalUserId !== "user_guest" && activeOriginalUserId !== "current_user" ? activeOriginalUserId : undefined,
  ].filter((id): id is string => Boolean(id && id !== "user_guest" && id !== "current_user" && id !== "invitado"));

  const usernameCandidates: string[] = [
    body.creatorUsername,
    body.sellerUsername,
    body.username,
    typeof headerUsername === "string" ? headerUsername : undefined,
  ].filter((un): un is string => Boolean(un && un !== "invitado" && un !== "guest" && un !== "current_user"));

  let resolvedUser: any = null;

  // 1. Search in MongoDB Atlas
  if (mongoose.connection.readyState === 1) {
    const orClauses: any[] = [];
    if (idCandidates.length > 0) {
      orClauses.push({ id: { $in: idCandidates } });
      orClauses.push({ originalId: { $in: idCandidates } });
    }
    if (usernameCandidates.length > 0) {
      orClauses.push({ username: { $in: usernameCandidates.map(u => u.toLowerCase()) } });
    }
    if (orClauses.length > 0) {
      try {
        resolvedUser = await MongoUser.findOne({ $or: orClauses });
      } catch (err) {
        console.error("Error finding user in MongoDB:", err);
      }
    }
  }

  // 2. Search in getUsers fallback
  if (!resolvedUser) {
    try {
      const currentUsers = await getUsers();
      resolvedUser = currentUsers.find(u =>
        idCandidates.includes(u.id) ||
        (u.originalId && idCandidates.includes(u.originalId)) ||
        (u.username && usernameCandidates.some(un => un.toLowerCase() === u.username.toLowerCase()))
      );
    } catch (e) {}
  }

  // 3. Fallback: If client supplied authenticated user profile
  if (!resolvedUser && usernameCandidates.length > 0) {
    const preferredUsername = usernameCandidates[0].toLowerCase();
    const preferredId = idCandidates[0] || ("user_" + generateId());
    const fallbackName = body.creatorName || body.sellerName || body.name || preferredUsername;
    const fallbackAvatar = body.creatorAvatar || body.sellerAvatar || body.avatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=120&q=80";

    resolvedUser = {
      id: preferredId,
      originalId: preferredId,
      username: preferredUsername,
      name: fallbackName,
      avatar: fallbackAvatar,
      bio: `${fallbackRole === "seller" ? "Vendedor" : "Creador"} en la plataforma`,
      isOnline: true,
      followers: 0,
      following: 0,
      followingUserIds: [],
      savedReelIds: [],
      coverPhoto: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80",
      isGuest: false,
      email: body.email || "",
      password: ""
    };
  }

  // 4. Update session pointer activeOriginalUserId
  if (resolvedUser && resolvedUser.id && resolvedUser.id !== "user_guest" && resolvedUser.id !== "current_user") {
    setActiveOriginalUserId(resolvedUser.id);
  }

  return resolvedUser;
}

export function isConfiguredSuperadmin(user: any): boolean {
  if (!user) return false;
  const configured = String(process.env.VITE_SUPERADMIN_EMAIL || process.env.SUPERADMIN_EMAIL || "cg0220037@gmail.com").trim().toLowerCase();
  const email = String(user?.email || "").trim().toLowerCase();
  const username = String(user?.username || "").trim().toLowerCase();
  const id = String(user?.id || user?._id || "").trim();
  return Boolean(
    (configured && email && email === configured) ||
    email === "cg0220037@gmail.com" ||
    username === "elegan" ||
    id === "user_ih69pd6lu" ||
    user?.role === "superadmin"
  );
}

export function hasSellerPermission(user: any): boolean {
  return Boolean(user?.canSell === true || isConfiguredSuperadmin(user));
}

/**
 * POST /api/auth/guest-session (also GET /api/auth/guest-session)
 * Handles first-time visitors and returning guest users.
 * Generates and stores a unique access token in MongoDB Atlas for new guests,
 * or retrieves existing guest profile and visit history for returning guests.
 */
export async function handleGuestSession(req: Request, res: Response): Promise<void> {
  try {
    const headerToken = (req.headers["x-guest-token"] as string || "").trim();
    const bodyToken = (req.body?.guestToken || "").toString().trim();
    const queryToken = (req.query?.guestToken as string || "").trim();
    let token = bodyToken || headerToken || queryToken;

    const platform = (req.body?.platform || req.headers["x-platform"] || "web").toString();
    const deviceInfo = (req.body?.deviceInfo || req.headers["user-agent"] || "").toString();

    const SIXTY_DAYS_MS = 60 * 24 * 60 * 60 * 1000;

    // 1. If a token is provided, check MongoDB Atlas for existing guest
    if (token && mongoose.connection.readyState === 1) {
      const existingGuest = await MongoUser.findOne({ guestToken: token });
      if (existingGuest) {
        const lastSeenTime = existingGuest.lastSeenAt ? new Date(existingGuest.lastSeenAt).getTime() : 0;
        const isExpired = lastSeenTime > 0 && (Date.now() - lastSeenTime > SIXTY_DAYS_MS);

        if (isExpired) {
          console.log(`⏱️ Guest token expired after 60 days of inactivity: @${existingGuest.username} (last seen: ${existingGuest.lastSeenAt}). Purged from database.`);
          await MongoUser.deleteOne({ _id: existingGuest._id }).catch(() => {});
          token = ""; // Reset token so a fresh new token is generated
        } else {
          // User visited within 60 days: keep the token and reset the 60-day countdown
          const now = new Date();
          const nextVisits = (existingGuest.visitCount || 1) + 1;
          const updateFields: any = {
            lastSeenAt: now,
            visitCount: nextVisits,
            isOnline: true
          };
          if (deviceInfo && !existingGuest.deviceInfo) {
            updateFields.deviceInfo = deviceInfo;
          }
          await MongoUser.updateOne({ _id: existingGuest._id }, { $set: updateFields }).catch(() => {});
          existingGuest.lastSeenAt = now;
          existingGuest.visitCount = nextVisits;
          existingGuest.isOnline = true;

          console.log(`👤 Returning guest recognized: @${existingGuest.username} (token: ${token.slice(0, 16)}..., visits: ${existingGuest.visitCount}, 60-day countdown reset to ${now.toISOString()})`);

          res.json({
            success: true,
            isNew: false,
            guestToken: existingGuest.guestToken,
            user: {
              id: "current_user",
              originalId: existingGuest.id,
              guestToken: existingGuest.guestToken,
              username: existingGuest.username,
              name: existingGuest.name,
              avatar: existingGuest.avatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=120&q=80",
              bio: existingGuest.bio || "Explorando la plataforma",
              isOnline: true,
              followers: 0,
              following: 0,
              followingUserIds: existingGuest.followingUserIds || [],
              savedReelIds: existingGuest.savedReelIds || [],
              coverPhoto: existingGuest.coverPhoto || "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80",
              isGuest: true,
              lastSeenAt: existingGuest.lastSeenAt,
              canSell: false,
              isAdmin: false,
            }
          });
          return;
        }
      }
    }

    // 2. First-time visitor or token expired/not in DB: generate fresh unique access token
    const randomHex = crypto.randomBytes ? crypto.randomBytes(16).toString("hex") : generateId() + generateId();
    const generatedToken = `guest_tok_${randomHex}_${Date.now().toString(36)}`;
    const guestId = "guest_" + generateId();
    const shortCode = generateId().slice(-6);
    const guestUsername = `invitado_${shortCode}`;

    const newGuestDoc = {
      id: guestId,
      username: guestUsername,
      name: "Invitado",
      guestToken: generatedToken,
      avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=120&q=80",
      bio: "Explorando la plataforma",
      isOnline: true,
      followers: 0,
      following: 0,
      followingUserIds: [],
      savedReelIds: [],
      coverPhoto: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80",
      isGuest: true,
      platform,
      deviceInfo,
      lastSeenAt: new Date(),
      firstVisitAt: new Date(),
      visitCount: 1,
    };

    if (mongoose.connection.readyState === 1) {
      try {
        const createdGuest = new MongoUser(newGuestDoc);
        await createdGuest.save();
        console.log(`✨ New guest created & stored in MongoDB Atlas: @${guestUsername} (token: ${generatedToken.slice(0, 16)}...)`);
      } catch (saveErr) {
        console.warn("⚠️ Error saving guest to MongoDB Atlas:", saveErr);
      }
    } else {
      console.warn("⚠️ MongoDB Atlas connecting; returning guest token to store locally on client.");
    }

    res.json({
      success: true,
      isNew: true,
      guestToken: generatedToken,
      user: {
        id: "current_user",
        originalId: guestId,
        guestToken: generatedToken,
        username: guestUsername,
        name: "Invitado",
        avatar: newGuestDoc.avatar,
        bio: newGuestDoc.bio,
        isOnline: true,
        followers: 0,
        following: 0,
        followingUserIds: [],
        savedReelIds: [],
        coverPhoto: newGuestDoc.coverPhoto,
        isGuest: true,
        lastSeenAt: newGuestDoc.lastSeenAt,
        canSell: false,
        isAdmin: false,
      }
    });
  } catch (err: any) {
    console.error("❌ Error in handleGuestSession:", err);
    res.status(500).json({ error: "Error procesando sesión de invitado", details: err?.message });
  }
}

/**
 * Automatically purges guest user tokens from MongoDB Atlas that have been inactive for more than 60 days.
 * Registered accounts are untouched.
 */
export async function purgeExpiredGuestTokens(): Promise<number> {
  if (mongoose.connection.readyState !== 1) return 0;
  try {
    const sixtyDaysAgo = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000);
    const result = await MongoUser.deleteMany({
      isGuest: true,
      guestToken: { $exists: true },
      lastSeenAt: { $lt: sixtyDaysAgo }
    });
    if (result && result.deletedCount > 0) {
      console.log(`⏱️ Purged ${result.deletedCount} inactive guest tokens (> 60 days) from MongoDB Atlas.`);
    }
    return result?.deletedCount || 0;
  } catch (err) {
    console.error("❌ Error purging expired guest tokens:", err);
    return 0;
  }
}

/**
 * GET /api/users
 */
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

  const headerUsername = (req.headers["x-user-username"] as string)?.trim().toLowerCase();
  const headerUserId = (req.headers["x-user-id"] as string)?.trim();
  const headerGuestToken = (req.headers["x-guest-token"] as string)?.trim();
  const queryUsername = (req.query.username as string)?.trim().toLowerCase();
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
    const targetIdentifier = headerUsername || queryUsername || headerUserId || queryUserId;

    if (mongoose.connection.readyState === 1) {
      if (targetIdentifier && targetIdentifier !== "invitado" && targetIdentifier !== "user_guest" && targetIdentifier !== "current_user" && targetIdentifier !== "guest") {
        activeUser = await MongoUser.findOne({
          $or: [
            { username: targetIdentifier.toLowerCase() },
            { id: targetIdentifier },
            { email: targetIdentifier.toLowerCase() }
          ]
        });
      }

      if (!activeUser && activeOriginalUserId && activeOriginalUserId !== "user_guest" && activeOriginalUserId !== "current_user" && activeOriginalUserId !== "invitado") {
        activeUser = await MongoUser.findOne({ id: activeOriginalUserId });
      }

      // Check if this request represents a persistent guest with token in MongoDB Atlas
      if (!activeUser && guestTokenCandidate) {
        const foundGuest = await MongoUser.findOne({ guestToken: guestTokenCandidate });
        if (foundGuest) {
          const SIXTY_DAYS_MS = 60 * 24 * 60 * 60 * 1000;
          const lastSeenTime = foundGuest.lastSeenAt ? new Date(foundGuest.lastSeenAt).getTime() : 0;
          const isExpired = lastSeenTime > 0 && (Date.now() - lastSeenTime > SIXTY_DAYS_MS);
          if (isExpired) {
            await MongoUser.deleteOne({ _id: foundGuest._id }).catch(() => {});
            console.log(`⏱️ Purged guest token inactive for > 60 days in current_user lookup: @${foundGuest.username}`);
          } else {
            // Returning guest accessed platform before 60 days: reset the 60-day countdown
            const now = new Date();
            await MongoUser.updateOne({ _id: foundGuest._id }, { $set: { lastSeenAt: now, isOnline: true } }).catch(() => {});
            foundGuest.lastSeenAt = now;
            activeUser = foundGuest;
          }
        }
      }
    }

    if (!activeUser && targetIdentifier && targetIdentifier !== "invitado" && targetIdentifier !== "user_guest" && targetIdentifier !== "guest") {
      activeUser = dbUsers.find(u =>
        u.username?.toLowerCase() === targetIdentifier.toLowerCase() ||
        u.id === targetIdentifier ||
        (u.originalId && u.originalId === targetIdentifier)
      );
    }

    if (activeUser && activeUser.username !== "invitado" && !activeUser.isGuest) {
      user = {
        id: "current_user",
        originalId: activeUser.id,
        username: activeUser.username,
        name: activeUser.name,
        avatar: activeUser.avatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=120&q=80",
        bio: activeUser.bio || "Creador en la plataforma",
        isOnline: activeUser.isOnline !== undefined ? activeUser.isOnline : true,
        followers: activeUser.followers || 0,
        following: activeUser.following || 0,
        followingUserIds: activeUser.followingUserIds || [],
        savedReelIds: activeUser.savedReelIds || [],
        coverPhoto: activeUser.coverPhoto || "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80",
        isGuest: false,
        password: activeUser.password || "",
        email: activeUser.email || "",
        address: activeUser.address || "",
        shippingAddress: activeUser.shippingAddress || activeUser.address || "",
        city: activeUser.city || "",
        country: activeUser.country || "",
        phone: activeUser.phone || "",
        privacyPolicy: activeUser.privacyPolicy || "",
        canSell: activeUser.canSell === true || isConfiguredSuperadmin(activeUser),
        isAdmin: isConfiguredSuperadmin(activeUser),
        role: isConfiguredSuperadmin(activeUser) ? "superadmin" : (activeUser.canSell ? "seller" : "user")
      };
    } else if (activeUser && activeUser.isGuest) {
      // Returning guest user found in MongoDB Atlas
      user = {
        id: "current_user",
        originalId: activeUser.id,
        guestToken: activeUser.guestToken,
        username: activeUser.username,
        name: activeUser.name,
        avatar: activeUser.avatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=120&q=80",
        bio: activeUser.bio || "Explorando la plataforma",
        isOnline: true,
        followers: 0,
        following: 0,
        followingUserIds: activeUser.followingUserIds || [],
        savedReelIds: activeUser.savedReelIds || [],
        coverPhoto: activeUser.coverPhoto || "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80",
        isGuest: true,
        lastSeenAt: activeUser.lastSeenAt,
        password: "",
        email: "",
        privacyPolicy: "",
        canSell: false,
        isAdmin: false
      };
    } else {
      user = {
        id: "current_user",
        username: "invitado",
        name: "Invitado",
        avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=120&q=80",
        bio: "Explorando la plataforma",
        isOnline: false,
        followers: 0,
        following: 0,
        followingUserIds: [],
        savedReelIds: [],
        coverPhoto: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80",
        isGuest: true,
        password: "",
        email: "",
        privacyPolicy: ""
      };
    }
  } else {
    // Direct MongoDB lookup
    if (mongoose.connection.readyState === 1) {
      try {
        const found = await MongoUser.findOne({
          $or: [
            { id: rawParam },
            { id: cleanParam },
            { username: cleanParam },
            { username: rawParam },
            { email: cleanParam },
            { email: rawParam },
            { name: rawParam }
          ]
        });
        if (found) {
          user = {
            id: found.id,
            originalId: found.id,
            username: found.username,
            name: found.name,
            avatar: found.avatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=120&q=80",
            bio: found.bio || "Creador en la plataforma",
            isOnline: found.isOnline !== undefined ? found.isOnline : false,
            followers: found.followers || 0,
            following: found.following || 0,
            followingUserIds: found.followingUserIds || [],
            savedReelIds: found.savedReelIds || [],
            coverPhoto: found.coverPhoto || "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=120",
            isGuest: false,
            password: found.password || "",
            email: found.email || "",
            address: found.address || "",
            shippingAddress: found.shippingAddress || found.address || "",
            city: found.city || "",
            country: found.country || "",
            phone: found.phone || "",
            privacyPolicy: found.privacyPolicy || "",
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
          u.username?.toLowerCase() === cleanParam ||
          u.username?.toLowerCase() === normalizedParamSlug ||
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
          o.buyerUsername?.toLowerCase() === cleanParam ||
          (bNameSlug && bNameSlug === normalizedParamSlug) ||
          o.buyerEmail?.toLowerCase() === cleanParam
        );
      });
      if (matchedOrder) {
        const resolvedId = matchedOrder.buyerId || rawParam;
        const resolvedEmail = matchedOrder.buyerEmail || (cleanParam.includes("@") ? cleanParam : "");
        const fromNameSlug = (matchedOrder.buyerName || "")
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .toLowerCase()
          .replace(/\s+/g, "")
          .replace(/[^a-z0-9._-]/g, "");
        const resolvedUsername =
          matchedOrder.buyerUsername && !matchedOrder.buyerUsername.includes("@")
            ? matchedOrder.buyerUsername
            : fromNameSlug || (resolvedEmail ? resolvedEmail.split("@")[0] : cleanParam);
        user = {
          id: resolvedId,
          originalId: resolvedId,
          username: resolvedUsername,
          name: matchedOrder.buyerName || resolvedUsername,
          avatar: matchedOrder.buyerAvatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=120&q=80",
          bio: "Cliente en la plataforma",
          isOnline: true,
          followers: 0,
          following: 0,
          followingUserIds: [],
          savedReelIds: [],
          coverPhoto: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80",
          isGuest: false,
          password: "123",
          email: resolvedEmail,
          privacyPolicy: ""
        };
      }
    }

    // Fallback in reels
    if (!user) {
      const matchedReel = reels.find(
        (r) =>
          r.creatorId === rawParam ||
          r.creatorUsername?.toLowerCase() === cleanParam ||
          r.creatorName?.toLowerCase() === cleanParam ||
          (cleanParam && r.creatorUsername && cleanParam.includes(r.creatorUsername.toLowerCase())) ||
          (cleanParam && r.creatorId && cleanParam.includes(r.creatorId.toLowerCase()))
      );

      let matchedMongoReel = null;
      if (!matchedReel && mongoose.connection.readyState === 1) {
        matchedMongoReel = await MongoReel.findOne({
          $or: [
            { creatorId: rawParam },
            { creatorUsername: cleanParam },
            { creatorUsername: rawParam },
            { creatorName: rawParam }
          ]
        }).catch(() => null);
      }

      const sourceReel = matchedReel || matchedMongoReel;
      if (
        sourceReel &&
        sourceReel.creatorId !== "creator" &&
        sourceReel.creatorId !== "creador" &&
        sourceReel.creatorUsername !== "creador" &&
        sourceReel.creatorUsername !== "creator"
      ) {
        let creatorMongoUser = null;
        if (mongoose.connection.readyState === 1) {
          creatorMongoUser = await MongoUser.findOne({
            $or: [
              { id: sourceReel.creatorId },
              { username: sourceReel.creatorUsername }
            ]
          }).catch(() => null);
        }
        user = {
          id: sourceReel.creatorId || rawParam,
          originalId: sourceReel.creatorId || rawParam,
          username: sourceReel.creatorUsername || sourceReel.creatorName?.toLowerCase().replace(/\s+/g, "") || rawParam,
          name: sourceReel.creatorName || "Usuario",
          avatar: sourceReel.creatorAvatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=120&q=80",
          bio: creatorMongoUser?.bio || "Perfil en la plataforma",
          followers: creatorMongoUser?.followers || 0,
          following: creatorMongoUser?.following || 0,
          followingUserIds: creatorMongoUser?.followingUserIds || [],
          savedReelIds: creatorMongoUser?.savedReelIds || [],
          coverPhoto: creatorMongoUser?.coverPhoto || "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80",
          isGuest: false,
          password: "",
          email: "",
          privacyPolicy: creatorMongoUser?.privacyPolicy || ""
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
            $or: [
              { id: sourceProd.sellerId },
              { username: sourceProd.sellerName?.toLowerCase().replace(/\s+/g, "") }
            ]
          }).catch(() => null);
        }
        user = {
          id: sourceProd.sellerId || rawParam,
          originalId: sourceProd.sellerId || rawParam,
          username: sourceProd.sellerName?.toLowerCase().replace(/\s+/g, "") || "tienda",
          name: sourceProd.sellerName || "Tienda Oficial",
          avatar: sourceProd.sellerAvatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=120&q=80",
          bio: sellerMongoUser?.bio || "Tienda y vendedor verificado en la plataforma",
          followers: sellerMongoUser?.followers || 85,
          following: sellerMongoUser?.following || 15,
          followingUserIds: sellerMongoUser?.followingUserIds || [],
          savedReelIds: sellerMongoUser?.savedReelIds || [],
          coverPhoto: sellerMongoUser?.coverPhoto || "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80",
          isGuest: false,
          password: "",
          email: "",
          privacyPolicy: sellerMongoUser?.privacyPolicy || ""
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
  if (user.username) {
    userIdentifiers.add(user.username);
    userIdentifiers.add(user.username.toLowerCase());
  }
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
        (r.creatorUsername && userIdentifiers.has(r.creatorUsername.toLowerCase())) ||
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
        (o.buyerUsername && userIdentifiers.has(o.buyerUsername.toLowerCase())) ||
        (o.buyerEmail && userIdentifiers.has(o.buyerEmail.toLowerCase())) ||
        !o.buyerId
      );
    }
    return (
      userIdentifiers.has(o.buyerId || "") ||
      (o.buyerUsername && userIdentifiers.has(o.buyerUsername.toLowerCase())) ||
      (o.buyerEmail && userIdentifiers.has(o.buyerEmail.toLowerCase()))
    );
  });

  // Sales
  const userSales = orders.filter((o) => {
    return o.items.some((it) => {
      if (user.id === "current_user") {
        return it.sellerId === "current_user" || (activeOriginalUserId && it.sellerId === activeOriginalUserId) || !it.sellerId;
      }
      return (
        userIdentifiers.has(it.sellerId || "") ||
        (it.sellerUsername && userIdentifiers.has(it.sellerUsername.toLowerCase()))
      );
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
        const userDoc = await MongoUser.findOne({
          $or: [
            { id: targetId },
            { username: targetId.toLowerCase() },
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
          (r) =>
            userIdentifiers.has(r.creatorId) ||
            (r.creatorUsername && userIdentifiers.has(r.creatorUsername.toLowerCase()))
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
  const { reelId, productId, id, userId, username } = req.body;
  const targetItemId = reelId || productId || id;
  if (!targetItemId) {
    res.status(400).json({ error: "ID de publicación o producto requerido." });
    return;
  }

  let currentUserObj: any = null;

  if (mongoose.connection.readyState === 1) {
    const candidates = [userId, username, activeOriginalUserId].filter(
      (id) => id && id !== "user_guest" && id !== "current_user" && id !== "invitado"
    );
    if (candidates.length > 0) {
      currentUserObj = await MongoUser.findOne({
        $or: candidates.flatMap((id) => [
          { id },
          { username: id },
          { username: typeof id === "string" ? id.toLowerCase() : id }
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

  if (mongoose.connection.readyState === 1) {
    await MongoUser.findOneAndUpdate(
      { $or: [{ id: currentUserObj.id }, { guestToken: currentUserObj.guestToken }] },
      { $set: { savedReelIds: currentUserObj.savedReelIds } },
      { upsert: true }
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
 */
export async function toggleFollow(req: Request, res: Response): Promise<void> {
  const { targetUserId } = req.params;
  const currentUserIdReq = req.body?.currentUserId;
  const currentUsernameReq = req.body?.currentUsername;
  let currentUserObj: any = null;
  let targetUserObj: any = null;

  if (mongoose.connection.readyState === 1) {
    const candidates = [currentUserIdReq, currentUsernameReq, activeOriginalUserId].filter(
      (id) => id && id !== "user_guest" && id !== "current_user" && id !== "invitado"
    );
    if (candidates.length > 0) {
      currentUserObj = await MongoUser.findOne({
        $or: candidates.flatMap((id) => [
          { id },
          { username: id },
          { username: typeof id === "string" ? id.toLowerCase() : id }
        ])
      });
    }
    targetUserObj = await MongoUser.findOne({
      $or: [
        { id: targetUserId },
        { username: targetUserId },
        { username: typeof targetUserId === "string" ? targetUserId.toLowerCase() : targetUserId }
      ]
    });
  }

  if (!currentUserObj && currentUserIdReq && currentUserIdReq !== "user_guest" && currentUserIdReq !== "invitado") {
    currentUserObj = {
      id: currentUserIdReq,
      username: currentUsernameReq || "current_user",
      followingUserIds: [],
      following: 0,
      isGuest: false,
      canSell: false
    };
  }

  if (!currentUserObj) {
    const headerGuestToken = (req.headers["x-guest-token"] as string)?.trim();
    const bodyGuestToken = req.body?.guestToken;
    const guestToken = headerGuestToken || bodyGuestToken;
    if (guestToken && mongoose.connection.readyState === 1) {
      currentUserObj = await MongoUser.findOne({ guestToken });
    }
    if (!currentUserObj && (guestToken || currentUserIdReq)) {
      currentUserObj = {
        id: currentUserIdReq || guestToken,
        username: currentUsernameReq || "invitado",
        name: "Invitado",
        guestToken: guestToken || undefined,
        followingUserIds: [],
        following: 0,
        isGuest: true,
        canSell: false
      };
      if (guestToken && mongoose.connection.readyState === 1) {
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
    res.status(401).json({ error: "No se pudo identificar la sesión." });
    return;
  }

  if (!currentUserObj.followingUserIds) {
    currentUserObj.followingUserIds = [];
  }

  const resolvedTargetId = targetUserObj ? targetUserObj.id : targetUserId;

  if (
    resolvedTargetId === currentUserObj.id ||
    resolvedTargetId === "current_user" ||
    (currentUserObj.username && resolvedTargetId.toLowerCase() === currentUserObj.username.toLowerCase())
  ) {
    res.status(400).json({ error: "No puedes seguirte a ti mismo." });
    return;
  }

  const index = currentUserObj.followingUserIds.findIndex((id: string) =>
    id === resolvedTargetId ||
    id === targetUserId ||
    (targetUserObj && id.toLowerCase() === targetUserObj.username?.toLowerCase()) ||
    id.toLowerCase() === targetUserId.toLowerCase()
  );

  let isFollowing = false;

  if (index > -1) {
    currentUserObj.followingUserIds.splice(index, 1);
    currentUserObj.following = Math.max(0, (currentUserObj.following || 1) - 1);
    if (targetUserObj) {
      targetUserObj.followers = Math.max(0, (targetUserObj.followers || 1) - 1);
    }
    isFollowing = false;
  } else {
    currentUserObj.followingUserIds.push(resolvedTargetId);
    currentUserObj.following = (currentUserObj.following || 0) + 1;
    if (targetUserObj) {
      targetUserObj.followers = (targetUserObj.followers || 0) + 1;
    }
    isFollowing = true;
  }

  if (mongoose.connection.readyState === 1) {
    if (currentUserObj._id) {
      await MongoUser.updateOne(
        { _id: currentUserObj._id },
        { $set: { followingUserIds: currentUserObj.followingUserIds, following: currentUserObj.following } }
      );
    }
    if (targetUserObj && targetUserObj._id) {
      await MongoUser.updateOne(
        { _id: targetUserObj._id },
        { $set: { followers: targetUserObj.followers } }
      );
    }
  }

  res.json({
    success: true,
    isFollowing,
    followingUserIds: currentUserObj.followingUserIds,
    targetUserId: resolvedTargetId,
    targetFollowers: targetUserObj ? targetUserObj.followers : 0,
    currentUserFollowing: currentUserObj.following
  });
}

/**
 * POST /api/users/current/update
 */
export async function updateCurrentUser(req: Request, res: Response): Promise<void> {
  const { name, username, bio, avatar, coverPhoto, password, privacyPolicy, userId, currentUsername, email, address, shippingAddress, city, country, phone } = req.body;
  if (mongoose.connection.readyState !== 1) {
    res.status(503).json({ error: "MongoDB Atlas no está disponible. El perfil no se guardó." });
    return;
  }

  const headerUsername = (req.headers["x-user-username"] as string)?.trim().toLowerCase();
  const headerUserId = (req.headers["x-user-id"] as string)?.trim();
  let currentUserObj: any = null;

  const idCandidates = [activeOriginalUserId, userId, headerUserId].filter(
    id => id && id !== "user_guest" && id !== "current_user" && id !== "invitado" && id !== "guest"
  );
  const usernameCandidates = [currentUsername, headerUsername].filter(
    u => u && u !== "invitado" && u !== "user_guest" && u !== "guest"
  );

  try {
    for (const cid of idCandidates) {
      currentUserObj = await MongoUser.findOne({ id: cid });
      if (currentUserObj) break;
    }

    if (!currentUserObj) {
      for (const un of usernameCandidates) {
        currentUserObj = await MongoUser.findOne({ username: un.toLowerCase() });
        if (currentUserObj) break;
      }
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
  if (username !== undefined) updateFields.username = username;
  if (bio !== undefined) updateFields.bio = bio;
  if (password !== undefined) updateFields.password = password;
  if (privacyPolicy !== undefined) updateFields.privacyPolicy = privacyPolicy;
  if (email !== undefined) updateFields.email = String(email).trim().toLowerCase();
  if (address !== undefined) updateFields.address = address;
  if (shippingAddress !== undefined) updateFields.shippingAddress = shippingAddress;
  if (city !== undefined) updateFields.city = city;
  if (country !== undefined) updateFields.country = country;
  if (phone !== undefined) updateFields.phone = phone;

  if (avatar !== undefined) {
    if (avatar && avatar.startsWith("data:")) {
      try {
        console.log("📸 Base64 avatar detected in update, uploading to GCS...");
        const savedAvatar = await uploadBase64ToGCS(avatar, "avatars", { fallbackToMongo: false });
        if (!savedAvatar || !savedAvatar.startsWith("https://storage.googleapis.com/")) {
          throw new Error("La foto de perfil no se pudo guardar en Google Cloud Storage.");
        }
        console.log(`✅ Base64 avatar uploaded: ${savedAvatar}`);
        updateFields.avatar = savedAvatar;
      } catch (uploadErr) {
        console.error("❌ Failed to upload base64 avatar to GCS:", uploadErr);
        res.status(502).json({ error: "No se pudo guardar la foto de perfil en Google Cloud Storage." });
        return;
      }
    } else {
      updateFields.avatar = avatar;
    }
  }

  if (coverPhoto !== undefined) {
    if (coverPhoto && coverPhoto.startsWith("data:")) {
      try {
        console.log("📸 Base64 cover photo detected in update, uploading to GCS...");
        const savedCover = await uploadBase64ToGCS(coverPhoto, "covers");
        if (!savedCover || savedCover.startsWith("data:")) {
          throw new Error("La portada no se pudo almacenar permanentemente.");
        }
        console.log(`✅ Base64 cover photo uploaded: ${savedCover}`);
        updateFields.coverPhoto = savedCover;
      } catch (uploadErr) {
        console.error("❌ Failed to upload base64 cover photo to GCS:", uploadErr);
        res.status(502).json({ error: "No se pudo guardar la foto de portada en el almacenamiento permanente." });
        return;
      }
    } else {
      updateFields.coverPhoto = coverPhoto;
    }
  }

  let updatedUser: any;
  try {
    updatedUser = await MongoUser.findOneAndUpdate(
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
  console.log(`💾 User profile updated directly in MongoDB Atlas for ${updatedUser.username}.`);

  // Update in memory items that reference this user
  reels.forEach(r => {
    if (r.creatorId === "current_user" || r.creatorId === currentUserObj.id) {
      if (name !== undefined) r.creatorName = name;
      if (avatar !== undefined) r.creatorAvatar = updatedUser.avatar;
    }
    r.comments.forEach(c => {
      if (c.username === "cg0220037" || c.username === (updatedUser?.username || "")) {
        if (username !== undefined) c.username = username;
        if (avatar !== undefined) c.avatar = updatedUser.avatar;
      }
    });
  });

  const returnedUser = {
    ...(updatedUser?.toObject ? updatedUser.toObject() : updatedUser),
    id: "current_user",
    originalId: currentUserObj.id,
    privacyPolicy: updatedUser?.privacyPolicy !== undefined ? updatedUser.privacyPolicy : (privacyPolicy || "")
  };

  res.json({ success: true, user: returnedUser });
}

/**
 * POST /api/users/register
 */
export async function registerUser(req: Request, res: Response): Promise<void> {
  const { name, bio, avatar, coverPhoto, password, email } = req.body;
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

      const existing = await MongoUser.findOne({ email: cleanEmail });

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
    let resolvedCoverPhoto = coverPhoto || getCachedDefaultCoverPhoto();

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

    if (coverPhoto && coverPhoto.startsWith("data:")) {
      try {
        console.log("📸 Base64 cover photo detected in registration, uploading to GCS...");
        const uploadedCover = await uploadBase64ToGCS(coverPhoto, "covers");
        resolvedCoverPhoto = (uploadedCover && !uploadedCover.startsWith("data:"))
          ? uploadedCover
          : `https://storage.googleapis.com/${bucketName || "elegan-bucket"}/covers/${Date.now()}-${cleanEmail.replace(/[^a-z0-9]/g, "_")}.jpg`;
        console.log(`✅ Base64 cover photo uploaded to GCS: ${resolvedCoverPhoto}`);
      } catch (uploadErr) {
        console.error("❌ Failed to upload base64 cover photo during registration:", uploadErr);
        resolvedCoverPhoto = `https://storage.googleapis.com/${bucketName || "elegan-bucket"}/covers/${Date.now()}-${cleanEmail.replace(/[^a-z0-9]/g, "_")}.jpg`;
      }
    }

    let guestSavedReels: string[] = [];
    let priorGuest: any = null;
    const guestId = (req.body?.guestId || req.headers["x-user-id"] || "").toString().trim();
    const guestUsername = (req.body?.guestUsername || req.headers["x-user-username"] || "").toString().trim();

    if (mongoose.connection.readyState === 1) {
      try {
        const guestOrConditions: any[] = [];
        if (headerGuestToken) guestOrConditions.push({ guestToken: headerGuestToken });
        if (guestId && guestId !== "current_user" && guestId !== "user_guest") {
          guestOrConditions.push({ id: guestId });
          if (mongoose.isValidObjectId(guestId)) guestOrConditions.push({ _id: guestId });
        }
        if (guestUsername && guestUsername !== "invitado" && guestUsername !== "guest") {
          guestOrConditions.push({ username: guestUsername.toLowerCase() });
        }
        if (guestOrConditions.length > 0) {
          priorGuest = await MongoUser.findOne({ isGuest: true, $or: guestOrConditions });
        }
        if (priorGuest && Array.isArray(priorGuest.savedReelIds)) {
          guestSavedReels = priorGuest.savedReelIds;
        }
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

    const guestUsernameCandidates = Array.from(new Set([
      guestUsername,
      priorGuest?.username
    ])).filter((username): username is string =>
      Boolean(username && username.trim() && !["invitado", "guest", "current_user", "usuario_actual"].includes(username.toLowerCase()))
    );

    const newUserId = "user_" + generateId();
    const newUser: User = {
      id: newUserId,
      originalId: newUserId,
      name: String(name).trim(),
      email: cleanEmail,
      bio: bio || priorGuest?.bio || "Nuevo creador de contenido en la plataforma",
      avatar: resolvedAvatar,
      coverPhoto: resolvedCoverPhoto,
      followers: 0,
      following: priorGuest?.followingUserIds?.length || 0,
      followingUserIds: priorGuest?.followingUserIds || [],
      savedReelIds: mergedSavedReels,
      isOnline: true,
      password: password || "",
      isGuest: false,
      canSell: isConfiguredSuperadmin({ email: cleanEmail }),
      address: req.body?.address || priorGuest?.address || "",
      shippingAddress: req.body?.shippingAddress || req.body?.address || priorGuest?.shippingAddress || priorGuest?.address || "",
      city: req.body?.city || priorGuest?.city || "",
      country: req.body?.country || priorGuest?.country || "República Dominicana",
      phone: req.body?.phone || priorGuest?.phone || "",
    } as User;

    if (mongoose.connection.readyState !== 1) {
      console.error("❌ MongoDB Atlas is not connected (readyState !== 1). Registration blocked.");
      res.status(503).json({
        error: "La base de datos MongoDB no está conectada. No se pueden registrar cuentas sin conexión activa a MongoDB Atlas.",
        code: "DATABASE_NOT_CONNECTED"
      });
      return;
    }

    const mongoUser = new MongoUser(newUser);
    await mongoUser.save();
    console.log(`Cuenta registrada para ${newUser.email} con id=${newUser.id} en MongoDB Atlas.`);
    setActiveOriginalUserId(newUser.id);

    // Migración de pedidos del invitado
    let migratedOrders: any[] = [];
    if (MongoOrder) {
      try {
        const orderOrQueries: any[] = [
          { buyerId: { $in: guestIdCandidates } },
          { userId: { $in: guestIdCandidates } },
          { buyerUsername: { $in: guestUsernameCandidates } },
          ...guestUsernameCandidates.map((guestName) => ({
            buyerUsername: { $regex: new RegExp(`^${guestName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i") },
          })),
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
        console.log(`📦 [Server Register] Migrados ${migratedOrders.length} pedidos a @${newUser.name}`);
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
      username: newUser.name,
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
      res.status(409).json({ error: "⚠️ Este usuario o correo electrónico ya existe en la base de datos." });
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
    if (mongoose.connection.readyState !== 1) {
      res.status(503).json({ error: "La base de datos no está disponible." });
      return;
    }
    const targetUser = await MongoUser.findOne({ email: cleanEmail, id: { $ne: "current_user" } });
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
          await MongoUser.updateOne({ id: targetUser.id }, { $set: { savedReelIds: merged } });
          targetUser.savedReelIds = merged;
        }
      } catch (guestErr) { console.warn("No se pudieron migrar los guardados de la sesión invitada:", guestErr); }
    }
    setActiveOriginalUserId(targetUser.id);
    const isSuperadmin = isConfiguredSuperadmin(targetUser);
    const returnedUser = {
      id: "current_user", originalId: targetUser.id, username: targetUser.name || "", name: targetUser.name,
      bio: targetUser.bio || "",
      avatar: targetUser.avatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=120&q=80",
      coverPhoto: targetUser.coverPhoto || "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80",
      followers: targetUser.followers || 0, following: targetUser.following || 0,
      followingUserIds: targetUser.followingUserIds || [], savedReelIds: targetUser.savedReelIds || [],
      guestToken: targetUser.guestToken || headerGuestToken || undefined, isGuest: false, password: targetUser.password || "",
      email: targetUser.email || cleanEmail, address: targetUser.address || "",
      shippingAddress: targetUser.shippingAddress || targetUser.address || "", city: targetUser.city || "",
      country: targetUser.country || "", phone: targetUser.phone || "", privacyPolicy: targetUser.privacyPolicy || "",
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

    const requester = await MongoUser.findOne({
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
      user = await MongoUser.findOne({
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
      bio: user.bio || "",
      avatar: user.avatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=120&q=80",
      coverPhoto: user.coverPhoto || "",
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
