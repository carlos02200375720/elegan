import mongoose from "mongoose";

const GuestSessionSchema = new mongoose.Schema({
  token: { type: String, required: true, unique: true, index: true },
  platform: { type: String, enum: ["web"], default: "web" },
  deviceInfo: { type: String, default: "" },
  firstVisitAt: { type: Date, default: Date.now },
  lastSeenAt: { type: Date, default: Date.now },
  visitCount: { type: Number, default: 1 },
  savedReelIds: { type: [String], default: [] },
  followingUserIds: { type: [String], default: [] },
  following: { type: Number, default: 0 },
}, { timestamps: true });

export const MongoGuestSession = (mongoose.models.GuestSession || mongoose.model("GuestSession", GuestSessionSchema)) as any;
