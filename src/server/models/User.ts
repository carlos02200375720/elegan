import mongoose from "mongoose";

const UserSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  username: { type: String, required: false, lowercase: true, trim: true },
  name: { type: String, required: true },
  avatar: { type: String },
  bio: { type: String },
  isOnline: { type: Boolean, default: false },
  followers: { type: Number, default: 0 },
  following: { type: Number, default: 0 },
  followingUserIds: { type: [String], default: [] },
  savedReelIds: { type: [String], default: [] },
  coverPhoto: { type: String },
  isGuest: { type: Boolean, default: false },
  guestToken: { type: String, sparse: true, unique: true, index: true },
  deviceInfo: { type: String, default: "" },
  platform: { type: String, default: "web" },
  lastSeenAt: { type: Date, default: Date.now },
  firstVisitAt: { type: Date, default: Date.now },
  visitCount: { type: Number, default: 1 },
  registeredAt: { type: Date },
  registrationPlatform: { type: String, enum: ["web", "android"] },
  password: { type: String },
  email: { type: String, unique: true, sparse: true, lowercase: true, trim: true },
  address: { type: String, default: "" },
  shippingAddress: { type: String, default: "" },
  city: { type: String, default: "" },
  country: { type: String, default: "" },
  phone: { type: String, default: "" },
  privacyPolicy: { type: String, default: "" },
  canSell: { type: Boolean, default: false }
}, { timestamps: true });

export const MongoUser = (mongoose.models.User || mongoose.model("User", UserSchema)) as any;

