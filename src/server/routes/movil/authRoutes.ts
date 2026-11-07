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

export function registerAndroidAuthRoutes(router: Router, deps: MovilRouterDependencies): void {
  const {
    MongoUser, MongoProduct, MongoReel, MongoOrder, MongoPublicacion,
    getUsers, getReels, setReels, getProducts, setProducts, getOrders, setOrders,
    uploadToGCS, uploadSingleSafe, uploadBase64ToGCS, broadcastToAll, generateId,
    bucket, bucketName, hlsQueue,
  } = deps;

    router.all(["/auth/guest-session", "/users/guest-session", "/guest-session"], handleGuestSession);
  
    // Android: Current user status / auto session resolution
  
    router.post("/users/current/switch", switchUser);
  
    router.post("/users/current/logout", logoutUser);
  
    // Android Cart: use the same MongoDB-backed cart handlers as the main API.
  
    router.post("/auth/login", switchUser);
  
    router.post(["/auth/register", "/users/register"], registerUser);
  
    // Android: Iniciar sesión y recuperar perfil completo con correo
  
    router.post(["/auth/email-login", "/auth/login-email", "/users/current/email-login"], loginWithEmail);
  
    // Android: Update profile
}
