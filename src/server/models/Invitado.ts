import mongoose from "mongoose";

const InvitadoSchema = new mongoose.Schema({
  visitorId: { type: String, required: true, trim: true },
  dateKey: { type: String, required: true, index: true },
  platform: { type: String, enum: ["web", "android"], required: true, index: true },
  visitorType: { type: String, enum: ["guest", "registered"], default: "guest", required: true },
  userId: { type: String, default: "" },
  firstVisitAt: { type: Date, default: Date.now },
  lastVisitAt: { type: Date, default: Date.now },
  visitCount: { type: Number, default: 1 },
}, {
  timestamps: true,
  collection: "invitados",
});

InvitadoSchema.index(
  { visitorId: 1, dateKey: 1, platform: 1 },
  { unique: true, name: "unique_daily_visitor_platform" }
);

export const MongoInvitado = (
  mongoose.models.Invitado ||
  mongoose.model("Invitado", InvitadoSchema, "invitados")
) as any;
