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
// Shared account lookup, session resolution, and permission helpers.

export async function getUsers(): Promise<User[]> {
  try {
    if (mongoose.connection.readyState !== 1 && mongoose.connection.readyState === 2) {
      await Promise.race([
        new Promise((resolve) => mongoose.connection.once("connected", resolve)),
        new Promise((resolve) => setTimeout(resolve, 3500)),
      ]);
    }
    if (mongoose.connection.readyState === 1) {
      const userFilter = {
        id: { $nin: ["current_user", "user_guest", "creator", "creador"] },
        isGuest: { $ne: true }
      };
      const [dbUsers, dbSuperAdmins] = await Promise.all([
        MongoUser.find(userFilter),
        MongoSuperAdmin.find({ id: { $nin: ["current_user", "user_guest", "creator", "creador"] } })
      ]);
      const mapAccount = (u: any, isSuperadmin = false) => ({
        id: u.id,
        name: u.name,
        bio: "",
        avatar: u.avatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=120&q=80",
        isOnline: u.isOnline !== undefined ? u.isOnline : false,
        followers: u.followers || 0,
        following: u.following || 0,
        followingUserIds: u.followingUserIds || [],
        savedReelIds: u.savedReelIds || [],
        isGuest: u.isGuest || false,
        password: u.password || "",
        email: u.email || "",
        address: u.address || "",
        shippingAddress: u.shippingAddress || u.address || "",
        city: u.city || "",
        country: u.country || "",
        phone: u.phone || "",
        postalCode: u.postalCode || "",
        canSell: u.canSell === true || isConfiguredSuperadmin(u),
        isAdmin: isConfiguredSuperadmin(u),
        role: isSuperadmin ? "superadmin" : (u.canSell ? "seller" : "user")
      });
      const mapped = [
        ...dbUsers.filter((u: any) => !isConfiguredSuperadmin(u)).map((u: any) => mapAccount(u, false)),
        ...dbSuperAdmins.map((u: any) => mapAccount(u, true))
      ];
      for (const memUser of memoryUsers) {
        if (!mapped.some((u) => u.id === memUser.id)) {
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

  const idCandidates: string[] = [
    body.creatorOriginalId,
    body.sellerOriginalId,
    body.originalId,
    body.sellerId !== "current_user" ? body.sellerId : undefined,
    body.creatorId !== "current_user" ? body.creatorId : undefined,
    headerUserId !== "current_user" ? headerUserId : undefined,
    activeOriginalUserId !== "user_guest" && activeOriginalUserId !== "current_user" ? activeOriginalUserId : undefined,
  ].filter((id): id is string => Boolean(id && id !== "user_guest" && id !== "current_user" && id !== "invitado"));

  let resolvedUser: any = null;

  // 1. Search in MongoDB Atlas
  if (mongoose.connection.readyState === 1) {
    const orClauses: any[] = [];
    if (idCandidates.length > 0) {
      orClauses.push({ id: { $in: idCandidates } });
      orClauses.push({ originalId: { $in: idCandidates } });
    }
    if (body.email) {
      orClauses.push({ email: String(body.email).trim().toLowerCase() });
    }
    if (orClauses.length > 0) {
      try {
        resolvedUser = await findAccount({ $or: orClauses });
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
        (body.email && u.email && u.email.toLowerCase() === String(body.email).trim().toLowerCase())
      );
    } catch (e) {}
  }

  // 3. Fallback: If client supplied authenticated user profile
  if (!resolvedUser && (body.creatorName || body.sellerName || body.name || body.email)) {
    const preferredId = idCandidates[0] || ("user_" + generateId());
    const fallbackName = body.creatorName || body.sellerName || body.name || "Usuario";
    const fallbackAvatar = body.creatorAvatar || body.sellerAvatar || body.avatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=120&q=80";

    resolvedUser = {
      id: preferredId,
      originalId: preferredId,
      name: fallbackName,
      avatar: fallbackAvatar,
      isOnline: true,
      followers: 0,
      following: 0,
      followingUserIds: [],
      savedReelIds: [],
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

export async function findAccount(filter: any): Promise<any> {
  if (mongoose.connection.readyState !== 1) return null;

  const configuredSuperadminEmail = String(
    process.env.VITE_SUPERADMIN_EMAIL || process.env.SUPERADMIN_EMAIL || "cg0220037@gmail.com"
  ).trim().toLowerCase();

  // The configured superadmin is strictly isolated in super_admins.
  // Never fall back to the user collection when resolving this account.
  const filterEmail = String(filter?.email || "").trim().toLowerCase();
  const orEmail = Array.isArray(filter?.$or)
    ? filter.$or.some((condition: any) =>
        String(condition?.email || "").trim().toLowerCase() === configuredSuperadminEmail
      )
    : false;

  if (filterEmail === configuredSuperadminEmail || orEmail) {
    return MongoSuperAdmin.findOne(filter);
  }

  const admin = await MongoSuperAdmin.findOne(filter);
  return admin || MongoUser.findOne(filter);
}

export function isConfiguredSuperadmin(user: any): boolean {
  if (!user) return false;
  const configured = String(process.env.VITE_SUPERADMIN_EMAIL || process.env.SUPERADMIN_EMAIL || "cg0220037@gmail.com").trim().toLowerCase();
  const email = String(user?.email || "").trim().toLowerCase();
  return Boolean(
    user?.collection?.name === "super_admins" ||
    email === "cg0220037@gmail.com" ||
    (configured && email === configured)
  );
}

export function hasSellerPermission(user: any): boolean {
  return Boolean(user?.canSell === true || isConfiguredSuperadmin(user));
}

/**
/**
 * POST /api/auth/guest-session (also GET /api/auth/guest-session)
 * Handles guest visitor session.
 * Does NOT create or save any User document in MongoDB Atlas.
 * Users are created in the database strictly upon account registration.
 */

export async function handleGuestSession(req: Request, res: Response): Promise<void> {
  try {
    const headerToken = (req.headers["x-guest-token"] as string || "").trim();
    const bodyToken = (req.body?.guestToken || "").toString().trim();
    const queryToken = (req.query?.guestToken as string || "").trim();
    let token = bodyToken || headerToken || queryToken;

    if (!token) {
      const randomHex = crypto.randomBytes ? crypto.randomBytes(16).toString("hex") : generateId() + generateId();
      token = `guest_${randomHex}`;
    }

    // Guests explore anonymously. No user document is created in MongoDB Atlas.
    // The user document is only created in the database when the client registers.
    res.json({
      success: true,
      isNew: false,
      guestToken: token,
      user: {
        id: "current_user",
        originalId: token,
        guestToken: token,
        name: "Invitado",
        avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=120&q=80",
        isOnline: true,
        followers: 0,
        following: 0,
        followingUserIds: [],
        savedReelIds: [],
        isGuest: true,
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
 * Automatically purges any guest user records from MongoDB Atlas.
 * Registered accounts are untouched.
 */
