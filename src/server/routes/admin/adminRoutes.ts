import { Router } from "express";
import * as userController from "../../controllers/userController";
import * as orderController from "../../controllers/orderController";
import * as settingsController from "../../controllers/settingsController";
import * as visitorController from "../../controllers/visitorController";

/**
 * Administrative mutations and reports.
 * Public read endpoints remain in shared/apiRoutes.ts.
 */
export function createAdminRouter(): Router {
  const router = Router();

  router.delete("/users/:id", userController.adminDeleteUser);
  router.post("/users/:id/permission", userController.updateUserSellerPermission);
  router.post("/orders/:id/update-tracking", orderController.updateTracking);

  router.get("/banner", settingsController.getPublicBanner);
  router.post("/banner", settingsController.saveBanner);
  router.get("/default-assets", settingsController.getDefaultAssets);
  router.post("/default-assets", settingsController.updateDefaultAssets);
  router.post("/default-assets/reset", settingsController.resetDefaultAssets);

  router.get("/analytics/visitors/daily", visitorController.getDailyVisitorAnalytics);

  return router;
}
