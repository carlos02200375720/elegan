import { Router, Request, Response, NextFunction } from "express";
import mongoose from "mongoose";
import { getPaypalConfig, createPaypalOrder } from "../../controllers/paypalController";
import type { MovilRouterDependencies } from "./types";
import { registerMovilAuthRoutes } from "./authRoutes";
import { registerMovilUserRoutes } from "./userRoutes";
import { registerMovilCartRoutes } from "./cartRoutes";
import { registerMovilReelRoutes } from "./reelRoutes";
import { registerMovilProductRoutes } from "./productRoutes";
import { registerMovilMediaRoutes } from "./mediaRoutes";
import { registerMovilPostRoutes } from "./postRoutes";
import { registerMovilOrderRoutes } from "./orderRoutes";
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

  registerMovilAuthRoutes(router, deps);
  registerMovilUserRoutes(router, deps);
  registerMovilCartRoutes(router, deps);
  registerMovilReelRoutes(router, deps);
  registerMovilProductRoutes(router, deps);
  registerMovilMediaRoutes(router, deps);
  registerMovilPostRoutes(router, deps);
  registerMovilOrderRoutes(router, deps);

  router.use(createMovilAppRouter());

  return router;
}
