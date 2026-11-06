/**
 * Public compatibility layer for user-related HTTP handlers.
 * Implementations live in focused controllers to keep responsibilities isolated.
 */
export {
  getUsers,
  resolveAuthenticatedUser,
  isConfiguredSuperadmin,
  hasSellerPermission,
  handleGuestSession,
  registerUser,
  switchUser,
  logoutUser,
  loginWithEmail,
} from "./userAuthController";

export {
  getAllUsers,
  getUserById,
  getUserPublications,
  toggleSaveReel,
  toggleFollow,
  updateCurrentUser,
  updateUserSellerPermission,
  adminDeleteUser,
} from "./userProfileController";
