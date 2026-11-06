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
import { getUsers, isConfiguredSuperadmin } from "./userAccessController";

// Saved content and user publication request handlers.

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
