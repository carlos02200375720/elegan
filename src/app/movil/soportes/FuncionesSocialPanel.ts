import type { User, ChatMessage } from "../tipos";
import { isSupportAlias, SUPPORT_EMAIL } from "./utilidades";
import type { AdminClient } from "./TiposSocialPanel";

const DEFAULT_CLIENT_AVATAR = "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=120&q=80";

export function getConversationMessages(
  messages: ChatMessage[],
  currentUser: User,
  activeChatUser: User | null,
  isAdmin: boolean,
  supportUser: User
): ChatMessage[] {
  if (!activeChatUser) return [];

  const myId = currentUser.originalId || currentUser.id;
  const partnerId = activeChatUser.originalId || activeChatUser.id;

  if (!isAdmin) {
    return messages.filter((msg) => {
      const isFromMe = msg.senderId === myId || msg.senderId === currentUser.id || msg.senderId === "current_user";
      const isToMe = msg.receiverId === myId || msg.receiverId === currentUser.id || msg.receiverId === "current_user";
      const isFromSupport = isSupportAlias(msg.senderId) || msg.senderId === partnerId || msg.senderId === supportUser.id;
      const isToSupport = isSupportAlias(msg.receiverId) || msg.receiverId === partnerId || msg.receiverId === supportUser.id;
      return (isFromMe && isToSupport) || (isFromSupport && isToMe);
    });
  }

  return messages.filter((msg) => {
    const isFromPartner = msg.senderId === partnerId || msg.senderId === activeChatUser.id;
    const isToPartner = msg.receiverId === partnerId || msg.receiverId === activeChatUser.id;
    const isFromSupport = isSupportAlias(msg.senderId) || msg.senderId === myId || msg.senderId === currentUser.id || msg.senderId === "current_user";
    const isToSupport = isSupportAlias(msg.receiverId) || msg.receiverId === myId || msg.receiverId === currentUser.id || msg.receiverId === "current_user";
    return (isFromSupport && isToPartner) || (isFromPartner && isToSupport);
  });
}

export function getAdminClientList(
  messages: ChatMessage[],
  users: User[],
  currentUser: User,
  unreadCounts: Record<string, number>,
  searchQuery: string
): AdminClient[] {
  const clientMap = new Map<string, AdminClient>();

  messages.forEach((msg) => {
    let otherId = "";
    if (isSupportAlias(msg.senderId)) otherId = msg.receiverId;
    else if (isSupportAlias(msg.receiverId)) otherId = msg.senderId;

    if (otherId && !isSupportAlias(otherId) && otherId !== "current_user") {
      const found = users.find((user) => user.id === otherId || user.originalId === otherId);
      clientMap.set(otherId, {
        user: found || {
          id: otherId,
          name: otherId.startsWith("guest_") ? "Cliente Invitado" : "Cliente",
          username: otherId,
          avatar: DEFAULT_CLIENT_AVATAR,
          bio: "Cliente de Mall Social",
          isOnline: false,
          followers: 0,
          following: 0,
        },
        lastMsg: msg,
        unreads: unreadCounts[otherId] || 0,
      });
    }
  });

  users.forEach((user) => {
    if (
      user.id !== currentUser.id &&
      user.email?.toLowerCase() !== SUPPORT_EMAIL &&
      user.username !== "invitado" &&
      !clientMap.has(user.id)
    ) {
      clientMap.set(user.id, { user, unreads: unreadCounts[user.id] || 0 });
    }
  });

  const query = searchQuery.trim().toLowerCase();
  const clients = Array.from(clientMap.values());
  return query
    ? clients.filter(({ user }) =>
        user.name.toLowerCase().includes(query) || Boolean(user.email?.toLowerCase().includes(query))
      )
    : clients;
}
