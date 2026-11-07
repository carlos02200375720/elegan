import { Router } from "express";
import * as analyticsController from "../../controllers/analyticsController";
import * as chatController from "../../controllers/chatController";
import * as settingsController from "../../controllers/settingsController";
import * as visitorController from "../../controllers/visitorController";

/**
 * Mobile-only application endpoints not owned by the dedicated commerce/auth
 * route modules in router.ts. All URLs are mounted below /api/movil.
 */
export function createMovilAppRouter(): Router {
  const router = Router();

  router.get("/banner", settingsController.getPublicBanner);

  router.get("/analytics/funnel", analyticsController.getFunnelAnalytics);
  router.post("/analytics/track", analyticsController.trackFunnelEvent);
  router.post("/analytics/visitors/track", visitorController.trackDailyVisitor);

  router.get("/chats/support/conversations", chatController.getSupportConversations);
  router.post("/chats", chatController.sendChatMessage);
  router.get("/chats/:partnerId", chatController.getChatMessages);

  return router;
}
