import mongoose from "mongoose";
import { MongoUser, MongoSuperAdmin, MongoProduct, MongoReel, MongoOrder, MongoPublicacion } from "../models";
import { Product, Order } from "../../types";
import {
  setProducts,
  getProducts,
  setReels,
  getReels,
  setOrders,
} from "../services/state";
import {
  getCanonicalReelsFromMongo,
  saveCanonicalReelToMongo,
  syncLegacyPublicacionesToMongoReel,
} from "../services/reelService";

export let lastMongoError: string | null = null;
export let isMongoConfigured: boolean = false;
let mongoReconnectTimer: ReturnType<typeof setTimeout> | null = null;

export function getMongoStatus() {
  return {
    configured: isMongoConfigured,
    connected: mongoose.connection.readyState === 1,
    readyState: mongoose.connection.readyState,
    error: lastMongoError,
  };
}

/**
 * Connect to MongoDB Atlas and load/seed users, products, reels, and orders.
 */
export async function connectToMongoDB(): Promise<void> {
  let mongoUri =
    process.env.MONGODB_URI ||
    process.env.MONGO_URI ||
    process.env.MONGODB_URL ||
    process.env.MONGO_URL ||
    process.env.DATABASE_URL;

  if (!mongoUri) {
    isMongoConfigured = false;
    lastMongoError = "Variable de entorno MONGODB_URI no encontrada en el contenedor.";
    console.error("❌ MONGODB_URI / MONGO_URI environment variable is missing! MongoDB Atlas is required for data persistence.");
    return;
  }

  isMongoConfigured = true;

  // Strip outer quotes if present
  mongoUri = mongoUri.trim();
  if (mongoUri.startsWith('"') && mongoUri.endsWith('"')) {
    mongoUri = mongoUri.slice(1, -1).trim();
  } else if (mongoUri.startsWith("'") && mongoUri.endsWith("'")) {
    mongoUri = mongoUri.slice(1, -1).trim();
  }

  // Parse credentials and host to properly clean and encode password
  const uriMatch = mongoUri.match(/^(mongodb(?:\+srv)?:\/\/)([^:]+):(.*)@([^/]+)(.*)$/);
  if (uriMatch) {
    const [_, protocol, username, password, host, rest] = uriMatch;
    let cleanPass = password;
    if (cleanPass.startsWith('<') && cleanPass.endsWith('>')) {
      cleanPass = cleanPass.slice(1, -1);
    }
    try {
      const decodedPass = decodeURIComponent(cleanPass);
      cleanPass = encodeURIComponent(decodedPass);
    } catch {
      if (cleanPass.includes('@')) {
        cleanPass = cleanPass.replace(/@/g, '%40');
      }
    }
    mongoUri = `${protocol}${username}:${cleanPass}@${host}${rest}`;
  } else {
    const simpleMatch = mongoUri.match(/(mongodb\+srv:\/\/.*?):(.*?)@(.*)/);
    if (simpleMatch) {
      const [_, prefix, pass, suffix] = simpleMatch;
      let cleanPass = pass;
      if (cleanPass.startsWith('<') && cleanPass.endsWith('>')) {
        cleanPass = cleanPass.slice(1, -1);
      }
      if (cleanPass.includes('@')) {
        cleanPass = cleanPass.replace(/@/g, '%40');
      }
      mongoUri = `${prefix}:${cleanPass}@${suffix}`;
    }
  }

  try {
    console.log("🔌 Connecting to MongoDB Atlas...");
    await mongoose.connect(mongoUri);
    console.log("✅ Successfully connected to MongoDB Atlas!");

    // Remove deprecated profile fields from every regular user document.
    const removedProfileFields = await MongoUser.collection.updateMany(
      {},
      { $unset: { bio: "", coverPhoto: "", privacyPolicy: "" } }
    );
    if (removedProfileFields.modifiedCount > 0) {
      console.log(`🧹 Removed deprecated bio, coverPhoto and privacyPolicy fields from ${removedProfileFields.modifiedCount} user documents.`);
    }

    // Move the configured superadministrator out of the regular users collection.
    const configuredSuperadminEmail = String(
      process.env.VITE_SUPERADMIN_EMAIL || process.env.SUPERADMIN_EMAIL || "cg0220037@gmail.com"
    ).trim().toLowerCase();
    if (configuredSuperadminEmail) {
      const existingSuperadmin = await MongoSuperAdmin.findOne({ email: configuredSuperadminEmail });
      const legacySuperadmin = await MongoUser.findOne({ email: configuredSuperadminEmail });
      if (!existingSuperadmin && legacySuperadmin) {
        const adminData = legacySuperadmin.toObject ? legacySuperadmin.toObject() : { ...legacySuperadmin };
        delete adminData._id;
        delete adminData.username;
        await MongoSuperAdmin.create({
          ...adminData,
          email: configuredSuperadminEmail,
          canSell: true,
          isAdmin: true,
          role: "superadmin",
        });
        await MongoUser.deleteOne({ _id: legacySuperadmin._id });
        console.log("🛡️ Superadministrator migrated from users to super_admins.");
      } else if (existingSuperadmin && legacySuperadmin) {
        await MongoUser.deleteOne({ _id: legacySuperadmin._id });
        console.log("🧹 Removed duplicate superadministrator record from users.");
      }
    }

    // Delete any guest/ghost users or test profiles from the database.
    // Users are created in MongoUser only when the client registers.
    console.log("🧹 Purging any leftover guest/ghost/anonymous profiles and test creator profiles from database...");
    const purgedGuests = await MongoUser.deleteMany({
      $or: [
        { isGuest: true },
        { guestToken: { $exists: true } },
        { id: /^guest_/i },
        { id: "user_guest" },
        { id: "current_user" },
        { id: "usuario_actual" },
        { id: "usuario_invitado" },
        { id: "creator" },
        { id: "creador" },
        { name: /^creador$/i },
        { name: /^creator$/i }
      ]
    });
    if (purgedGuests.deletedCount > 0) {
      console.log(`🧹 Purged ${purgedGuests.deletedCount} guest user documents from MongoDB Atlas. Only registered users remain in database.`);
    }


    // Permanently purge any test reel or test publicacion from creador/creator or delinquent HLS resources
    await MongoReel.deleteMany({
      $or: [
        { id: "reel_pub_vatdfyio3" },
        { creatorId: "creator" },
        { creatorId: "creador" },
        { creatorUsername: "creador" },
        { creatorUsername: "creator" },
        { creatorName: /^creador$/i },
        { creatorName: /^creator$/i },
        { videoUrl: { $regex: /hls_7a5hkwg34/ } },
        { hlsUrl: { $regex: /hls_7a5hkwg34/ } },
        { videoUrl: { $regex: /hls_(?:cvzp6xrcs|1k2m78m19)/ } },
        { hlsUrl: { $regex: /hls_(?:cvzp6xrcs|1k2m78m19)/ } }
      ]
    });
    await MongoPublicacion.deleteMany({
      $or: [
        { id: "pub_vatdfyio3" },
        { creatorId: "creator" },
        { creatorId: "creador" },
        { usuarioNombre: /^creador$/i },
        { url: { $regex: /hls_7a5hkwg34/ } },
        { hlsUrl: { $regex: /hls_7a5hkwg34/ } },
        { url: { $regex: /hls_(?:cvzp6xrcs|1k2m78m19)/ } },
        { hlsUrl: { $regex: /hls_(?:cvzp6xrcs|1k2m78m19)/ } }
      ]
    });
    await MongoProduct.updateMany(
      { videos: { $elemMatch: { $regex: /hls_(?:cvzp6xrcs|1k2m78m19|7a5hkwg34)/ } } },
      { $set: { videos: [] } }
    ).catch(() => {});
    console.log("🧹 Guest/anonymous profiles and test creator content purged successfully!");

    // Remove legacy username fields from account documents. Elegan identifies
    // accounts exclusively by stable id and email.
    const [usersWithoutUsername, adminsWithoutUsername] = await Promise.all([
      MongoUser.updateMany({ username: { $exists: true } }, { $unset: { username: "" } }),
      MongoSuperAdmin.updateMany({ username: { $exists: true } }, { $unset: { username: "" } }),
    ]);
    console.log(`🧹 Removed legacy username from ${usersWithoutUsername.modifiedCount || 0} user accounts and ${adminsWithoutUsername.modifiedCount || 0} superadmin accounts.`);

    // Drop any legacy index on username from users and super_admins collections to prevent duplicate null key collisions (E11000)
    try {
      const existingIndexes = await MongoUser.collection.indexes();
      for (const idx of existingIndexes) {
        if (idx.name === "username_1" || (idx.key && idx.key.username)) {
          await MongoUser.collection.dropIndex(idx.name);
          console.log(`🧹 Dropped legacy index '${idx.name}' from users collection.`);
        }
      }
    } catch (idxErr: any) {
      console.warn("Notice: index check on users collection:", idxErr?.message);
    }
    try {
      const adminIndexes = await MongoSuperAdmin.collection.indexes();
      for (const idx of adminIndexes) {
        if (idx.name === "username_1" || (idx.key && idx.key.username)) {
          await MongoSuperAdmin.collection.dropIndex(idx.name);
          console.log(`🧹 Dropped legacy index '${idx.name}' from super_admins collection.`);
        }
      }
    } catch (adminIdxErr: any) {
      console.warn("Notice: index check on super_admins collection:", adminIdxErr?.message);
    }

    // Deduplicate registered users by email only; username is not used in Elegan.
    const allUsersInDb = await MongoUser.find();
    const seenEmails = new Set<string>();
    for (const u of allUsersInDb) {
      const email = (u.email || "").trim().toLowerCase();
      if (!email || !email.includes("@")) continue;
      if (seenEmails.has(email)) {
        console.log(`🧹 Removing duplicate user from Atlas: id=${u.id}, email=${u.email}`);
        await MongoUser.deleteOne({ _id: u._id });
      } else {
        seenEmails.add(email);
      }
    }

    // Migrate and sanitize any remaining base64 avatars in MongoDB Atlas to GCS URLs
    try {
      const { sanitizeBase64AvatarsInMongo } = await import("../services/state");
      await sanitizeBase64AvatarsInMongo();
    } catch (migrErr) {
      console.warn("Notice: Base64 avatar migration check:", migrErr);
    }

    console.log("📦 Loading existing users from MongoDB...");
    const dbUsers = await MongoUser.find();
    console.log(`📦 Loaded ${dbUsers.length} users successfully from MongoDB Atlas!`);

    // Load products from MongoDB Atlas.
    // An empty collection is a valid state: products deleted by the administrator
    // must not be recreated from in-memory/default data on server restart.
    const productCount = await MongoProduct.countDocuments();
    if (productCount === 0) {
      setProducts([]);
      console.log("📦 MongoDB product catalog is empty; preserving the empty catalog.");
    } else {
      console.log("📦 Loading products from MongoDB...");
      const dbProducts = await MongoProduct.find();
      const seenProdIds = new Set<string>();
      const uniqueDbProducts = dbProducts.filter((p) => {
        if (!p.id || seenProdIds.has(p.id)) return false;
        seenProdIds.add(p.id);
        return true;
      });
      const loadedProducts: Product[] = uniqueDbProducts.map((p) => ({
        id: p.id,
        name: p.name,
        description: p.description || "",
        price: p.price,
        imageUrl: p.imageUrl || "",
        stock: p.stock !== undefined ? p.stock : 10,
        sellerId: p.sellerId || "current_user",
        rating: p.rating || 5,
        shippingCost: p.shippingCost || 0,
        images: p.images || [],
        videos: p.videos || [],
        variants: p.variants || [],
        variantList: p.variantList || [],
        category: p.category || "",
        views: p.views || 0,
      }));
      setProducts(loadedProducts);
      console.log(`📦 Loaded ${loadedProducts.length} unique products successfully from MongoDB Atlas!`);
    }

    // 1. Sync and migrate any legacy MongoPublicacion documents into MongoReel
    console.log("📦 Checking and migrating any legacy MongoPublicacion documents into MongoReel...");
    await syncLegacyPublicacionesToMongoReel();

    // Clean up any old rainbow placeholder thumbnails from MongoDB
    await MongoReel.updateMany(
      { thumbnailUrl: { $regex: "1618005182384" } },
      { $set: { thumbnailUrl: "" } }
    ).catch(() => {});

    // 2. Load canonical reels directly from MongoReel in Atlas
    const canonicalDbReels = await getCanonicalReelsFromMongo();
    if (canonicalDbReels.length > 0) {
      setReels(canonicalDbReels);
      console.log(`📦 Loaded ${canonicalDbReels.length} canonical reels successfully from MongoReel in Atlas!`);
    } else {
      console.log("🌱 Seeding default reels to MongoReel in Atlas...");
      for (const r of getReels()) {
        await saveCanonicalReelToMongo(r);
      }
      const reloadedReels = await getCanonicalReelsFromMongo();
      setReels(reloadedReels);
      console.log("🌱 Seeding canonical reels completed!");
    }

    // Remove only the two legacy demo orders created by the old startup seed.
    const removedDemoOrders = await MongoOrder.deleteMany({
      id: { $in: ["ord_demo_compra", "ord_demo_venta"] }
    });
    if (removedDemoOrders.deletedCount > 0) {
      console.log(`🧹 Removed ${removedDemoOrders.deletedCount} legacy demo orders from MongoDB.`);
    }

    // Load only real orders from MongoDB. An empty collection stays empty.
    console.log("📦 Loading real orders from MongoDB...");
    const orderCount = await MongoOrder.countDocuments();
    if (orderCount === 0) {
      setOrders([]);
      console.log("📦 MongoDB orders collection is empty; no demo orders will be created.");
    } else {
      const dbOrders = await MongoOrder.find().sort({ createdAt: -1 });
      const seenOrderIds = new Set<string>();
      const loadedOrders: Order[] = dbOrders
        .filter((o: any) => {
          if (!o.id || seenOrderIds.has(o.id)) return false;
          seenOrderIds.add(o.id);
          return true;
        })
        .map((o: any) => ({
          id: o.id,
          buyerId: o.buyerId,
          buyerName: o.buyerName,
          buyerUsername: o.buyerUsername,
          buyerAvatar: o.buyerAvatar,
          buyerEmail: o.buyerEmail,
          items: o.items || [],
          total: o.total,
          shippingCost: o.shippingCost || 0,
          shippingAddress: o.shippingAddress,
          paymentStatus: o.paymentStatus || "paid",
          status: o.status || "processing",
          trackingNumber: o.trackingNumber || "",
          carrier: o.carrier || "",
          trackingUrl: o.trackingUrl || "",
          estimatedDelivery: o.estimatedDelivery || "",
          sellerNotes: o.sellerNotes || "",
          statusHistory: o.statusHistory || [],
          createdAt: o.createdAt || new Date().toISOString(),
          updatedAt: o.updatedAt || o.createdAt || new Date().toISOString(),
        }));
      setOrders(loadedOrders);
      console.log(`📦 Loaded ${loadedOrders.length} real orders successfully from MongoDB Atlas!`);
    }
    lastMongoError = null;
  } catch (error: any) {
    lastMongoError = error?.message || String(error);
    console.error("❌ Failed to connect to MongoDB Atlas:", error);

    // Retry only when the initial connection is still down. This avoids
    // rerunning database cleanup/migrations after a successful connection.
    if (isMongoConfigured && mongoose.connection.readyState !== 1 && !mongoReconnectTimer) {
      mongoReconnectTimer = setTimeout(() => {
        mongoReconnectTimer = null;
        if (mongoose.connection.readyState !== 1) {
          void connectToMongoDB();
        }
      }, 30000);
    }
  }
}
