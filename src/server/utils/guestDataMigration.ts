type GuestCartItem = {
  product?: {
    id?: string;
    _id?: string;
    name?: string;
  };
  quantity?: number;
  [key: string]: unknown;
};

function getCartItemKey(item: GuestCartItem): string {
  const productKey = item.product?.id || item.product?._id || item.product?.name;
  const options = item.selectedOptions && typeof item.selectedOptions === "object"
    ? Object.fromEntries(
        Object.entries(item.selectedOptions as Record<string, unknown>).sort(([left], [right]) =>
          left.localeCompare(right)
        )
      )
    : item.selectedOptions;

  return JSON.stringify([
    productKey || item.product || item,
    options || null,
    item.selectedVariantVid || item.variantId || null,
    item.selectedCarrier || null,
    item.selectedShippingCost || null,
    item.selectedCountry || null,
  ]);
}

export function mergeGuestCartItems(
  cartSources: Array<unknown[] | null | undefined>
): GuestCartItem[] {
  const merged = new Map<string, { item: GuestCartItem; quantity: number }>();

  for (const source of cartSources) {
    if (!Array.isArray(source)) continue;

    const sourceItems = new Map<string, { item: GuestCartItem; quantity: number }>();
    for (const value of source) {
      if (!value || typeof value !== "object") continue;
      const item = value as GuestCartItem;
      const quantity = Number(item.quantity);
      if (!Number.isFinite(quantity) || quantity <= 0) continue;

      const key = getCartItemKey(item);
      const existing = sourceItems.get(key);
      sourceItems.set(key, {
        item,
        quantity: (existing?.quantity || 0) + quantity,
      });
    }

    for (const [key, candidate] of sourceItems) {
      const existing = merged.get(key);
      if (!existing || candidate.quantity > existing.quantity) {
        merged.set(key, candidate);
      }
    }
  }

  return Array.from(merged.values(), ({ item, quantity }) => ({ ...item, quantity }));
}

export async function migrateGuestReelInteractions(
  MongoReel: any,
  guestIds: string[],
  user: { id: string; username: string; avatar: string }
): Promise<void> {
  if (!MongoReel || guestIds.length === 0) return;

  const uniqueGuestIds = Array.from(new Set(guestIds.filter((id) => id && id !== user.id)));
  if (uniqueGuestIds.length === 0) return;

  try {
    await MongoReel.updateMany(
      { likedBy: { $in: uniqueGuestIds } },
      [
        {
          $set: {
            likedBy: {
              $setUnion: [
                {
                  $filter: {
                    input: { $ifNull: ["$likedBy", []] },
                    as: "userId",
                    cond: { $not: [{ $in: ["$$userId", uniqueGuestIds] }] },
                  },
                },
                [user.id],
              ],
            },
          },
        },
        { $set: { likes: { $size: "$likedBy" } } },
      ],
      { updatePipeline: true }
    );
  } catch (err) {
    console.warn("⚠️ [migrateGuestReelInteractions] Error migrando likes de reels:", err);
  }

  try {
    await MongoReel.updateMany(
      { "comments.userId": { $in: uniqueGuestIds } },
      {
        $set: {
          "comments.$[comment].userId": user.id,
          "comments.$[comment].username": user.username,
          "comments.$[comment].avatar": user.avatar,
        },
      },
      { arrayFilters: [{ "comment.userId": { $in: uniqueGuestIds } }] }
    );
  } catch (err) {
    console.warn("⚠️ [migrateGuestReelInteractions] Error migrando comentarios en reels:", err);
  }
}

export async function migrateGuestChatHistory(
  MongoChatMessage: any,
  guestIds: string[],
  userId: string
): Promise<void> {
  const uniqueGuestIds = Array.from(new Set(guestIds.filter((id) => id && id !== userId)));
  if (!MongoChatMessage || uniqueGuestIds.length === 0) return;

  try {
    await MongoChatMessage.updateMany(
      {
        $or: [
          { senderId: { $in: uniqueGuestIds } },
          { receiverId: { $in: uniqueGuestIds } },
        ],
      },
      [
        {
          $set: {
            senderId: {
              $cond: [{ $in: ["$senderId", uniqueGuestIds] }, userId, "$senderId"],
            },
            receiverId: {
              $cond: [{ $in: ["$receiverId", uniqueGuestIds] }, userId, "$receiverId"],
            },
          },
        },
      ],
      { updatePipeline: true }
    );
  } catch (err) {
    console.warn("⚠️ [migrateGuestChatHistory] Error migrando historial de chat:", err);
  }
}

