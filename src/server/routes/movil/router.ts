import { Router, Request, Response, NextFunction } from "express";
import mongoose from "mongoose";
import { getPaypalConfig, createPaypalOrder } from "../../controllers/paypalController";
import type { MovilRouterDependencies } from "./types";
import { registerAndroidAuthRoutes } from "./authRoutes";
import { registerAndroidUserRoutes } from "./userRoutes";
import { registerAndroidCartRoutes } from "./cartRoutes";
import { registerAndroidReelRoutes } from "./reelRoutes";
import { registerAndroidProductRoutes } from "./productRoutes";
import { registerAndroidMediaRoutes } from "./mediaRoutes";
import { registerAndroidPostRoutes } from "./postRoutes";
import { registerAndroidOrderRoutes } from "./orderRoutes";
import { createMovilAppRouter } from "./appRoutes";

export type { MovilRouterDependencies } from "./types";

export function createMovilRouter(deps: MovilRouterDependencies): Router {
  const router = Router();

  router.use((req: Request, res: Response, next: NextFunction) => {
    (req as any).isAndroid = true;
    res.setHeader("X-Platform-Engine", "MallSocial-Android-V1");
    next();
  });

  router.get("/health", (_req: Request, res: Response) => {
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

  registerAndroidAuthRoutes(router, deps);
  registerAndroidUserRoutes(router, deps);
  registerAndroidCartRoutes(router, deps);
  registerAndroidReelRoutes(router, deps);
  registerAndroidProductRoutes(router, deps);
  registerAndroidMediaRoutes(router, deps);
  registerAndroidPostRoutes(router, deps);
  registerAndroidOrderRoutes(router, deps);

  router.use(createMovilAppRouter());

  return router;
}
