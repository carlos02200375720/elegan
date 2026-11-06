/**
 * Stable public interface for user-related backend handlers.
 * Keep existing route and controller imports pointed at this file.
 */
export {
  getUsers,
  resolveAuthenticatedUser,
  isConfiguredSuperadmin,
  hasSellerPermission,
  handleGuestSession,
} from "./userAccessController";

export {
  registerUser,
  switchUser,
  logoutUser,
  loginWithEmail,
} from "./userAuthController";

export {
  getAllUsers,
  getUserById,
  updateCurrentUser,
  updateUserSellerPermission,
  adminDeleteUser,
} from "./userProfileController";

export {
  getUserPublications,
  toggleSaveReel,
  toggleFollow,
} from "./userContentController";
