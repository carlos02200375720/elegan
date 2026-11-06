import { Router, Request, Response, NextFunction } from "express";
import mongoose from "mongoose";
import { getPaypalConfig, createPaypalOrder } from "./controllers/paypalController";
import type { AndroidRouterDependencies } from "./androidRouterTypes";
import { registerAndroidAuthRoutes } from "./routes/movil/authRoutes";
import { registerAndroidUserRoutes } from "./routes/movil/userRoutes";
import { registerAndroidCartRoutes } from "./routes/movil/cartRoutes";
import { registerAndroidReelRoutes } from "./routes/movil/reelRoutes";
import { registerAndroidProductRoutes } from "./routes/movil/productRoutes";
import { registerAndroidMediaRoutes } from "./routes/movil/mediaRoutes";
import { registerAndroidPostRoutes } from "./routes/movil/postRoutes";
import { registerAndroidOrderRoutes } from "./routes/movil/orderRoutes";

export type { AndroidRouterDependencies } from "./androidRouterTypes";

export function createAndroidRouter(deps: AndroidRouterDependencies): Router {
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

  return router;
}
