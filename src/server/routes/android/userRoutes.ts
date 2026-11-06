import { Router, Request, Response, NextFunction } from "express";
import mongoose from "mongoose";
import fs from "fs";
import path from "path";
import { Bucket } from "@google-cloud/storage";
import { User, Reel, Product, Order } from "./types";
import { transcodeVideoToLocalHlsDirect } from "./hlsTranscoder";
import { formatReelDTO, createCompanionReelForProduct } from "./utils/reelUtils";
import {
  getCanonicalReelsFromMongo,
  saveCanonicalReelToMongo,
  getUserCanonicalReelsFromMongo,
} from "./services/reelService";
import { isConfiguredSuperadmin, handleGuestSession, registerUser, switchUser, loginWithEmail, logoutUser } from "./controllers/userController";
import { getCart, updateCart, clearCart } from "./controllers/cartController";
import { createPaypalOrder, getPaypalConfig } from "./controllers/paypalController";
import { MongoCart, MongoChatMessage, MongoSuperAdmin } from "./models";
import type { AndroidRouterDependencies } from "../../androidRouterTypes";

export function registerUserRoutes(router: Router, deps: AndroidRouterDependencies): void {
  const {
    MongoUser, MongoProduct, MongoReel, MongoOrder, MongoPublicacion,
    getUsers, getReels, setReels, getProducts, setProducts, getOrders, setOrders,
    uploadToGCS, uploadSingleSafe, uploadBase64ToGCS, broadcastToAll, generateId,
    bucket, bucketName, hlsQueue,
  } = deps;

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
            postalCode: u.postalCode || "",
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
  
    router.get("/users/current_user", async (req: Request, res: Response) => {
      try {
        const headerUsername = req.headers["x-user-username"] as string;
        const headerUserId = req.headers["x-user-id"] as string;
        const headerGuestToken = (req.headers["x-guest-token"] as string || req.query.guestToken as string || "").trim();
  
        let targetUser = null;
        if (mongoose.connection.readyState === 1) {
          if (headerUsername && headerUsername !== "invitado" && headerUsername !== "guest") {
            const accountQuery = { $or: [
              { username: headerUsername.toLowerCase() },
              { username: headerUsername },
              { email: headerUsername.toLowerCase() },
            ] };
            targetUser = await MongoSuperAdmin.findOne(accountQuery) || await MongoUser.findOne(accountQuery);
          } else if (headerUserId && headerUserId !== "current_user" && headerUserId !== "user_guest") {
            const accountQuery = { $or: [{ id: headerUserId }, { _id: mongoose.isValidObjectId(headerUserId) ? headerUserId : undefined }] };
            targetUser = await MongoSuperAdmin.findOne(accountQuery) || await MongoUser.findOne(accountQuery);
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
            postalCode: targetUser.postalCode || "",
            canSell: targetUser.canSell === true || isConfiguredSuperadmin(targetUser),
            isAdmin: isConfiguredSuperadmin(targetUser),
            role: isConfiguredSuperadmin(targetUser) ? "superadmin" : (targetUser.canSell ? "seller" : "user"),
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
  
    router.post("/users/current/update", async (req: Request, res: Response) => {
      try {
        const { userId, name, bio, avatar, email, address, shippingAddress, city, country, phone, postalCode, currentUsername } = req.body;
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
        if (postalCode !== undefined) updateFields.postalCode = String(postalCode).trim();
  
        if (avatar) {
          if (typeof avatar === "string" && avatar.startsWith("data:")) {
            const savedAvatar = await uploadBase64ToGCS(avatar, "avatars");
            if (!savedAvatar) {
              throw new Error("La foto de perfil no se pudo guardar en el almacenamiento en la nube.");
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
  
        const accountFilter = { $or: searchCriteria };
        const adminAccount = await MongoSuperAdmin.findOne(accountFilter);
        const AccountModel = adminAccount ? MongoSuperAdmin : MongoUser;
        const updated = await AccountModel.findOneAndUpdate(
          accountFilter,
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
          postalCode: updated.postalCode || postalCode || "",
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
          const accountQuery = { $or: [
            { id: targetId },
            { username: targetId.toLowerCase() },
            { _id: mongoose.isValidObjectId(targetId) ? targetId : undefined },
          ] };
          user = await MongoSuperAdmin.findOne(accountQuery) || await MongoUser.findOne(accountQuery);
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
              postalCode: user.postalCode || "",
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
          const accountQuery = { $or: [
            { id: targetId },
            { username: targetId.toLowerCase() },
            { _id: mongoose.isValidObjectId(targetId) ? targetId : undefined },
          ] };
          const userDoc = await MongoSuperAdmin.findOne(accountQuery) || await MongoUser.findOne(accountQuery);
  
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
            currentUserObj = {
              id: userId || guestToken || "guest",
              username: username || "invitado",
              name: "Invitado",
              guestToken: guestToken,
              savedReelIds: [],
              followingUserIds: [],
              isGuest: true,
            };
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
  
        if (mongoose.connection.readyState === 1 && !currentUserObj.isGuest && currentUserObj._id) {
          await MongoUser.updateOne(
            { _id: currentUserObj._id },
            { $set: { savedReelIds: currentUserObj.savedReelIds } }
          );
        }
  
        res.json({ success: true, saved, savedReelIds: currentUserObj.savedReelIds });
      } catch (err: any) {
        console.error("❌ [Android Gateway] Error en save:", err);
        res.status(500).json({ error: "Error al guardar elemento", details: err.message });
      }
    });
  
    // Android Shop: Get Orders (supports optional ?userId=...)
}
