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

  router.post("/admin/banner", settingsController.saveBanner);
  router.post("/admin/default-assets", settingsController.updateDefaultAssets);
  router.post("/admin/default-assets/reset", settingsController.resetDefaultAssets);

  router.get("/analytics/visitors/daily", visitorController.getDailyVisitorAnalytics);

  return router;
}
