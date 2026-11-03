import mongoose from "mongoose";

// Colección aislada para la cuenta de superadministración.
const SuperAdminSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true, index: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
}, { timestamps: true, strict: false, collection: "super_admins" });

export const MongoSuperAdmin = (
  mongoose.models.SuperAdmin || mongoose.model("SuperAdmin", SuperAdminSchema, "super_admins")
) as any;
