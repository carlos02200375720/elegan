import { useEffect, useMemo, useRef, useState } from "react";
import type React from "react";
import type { User, ChatMessage } from "../tipos";
import { isGuestUser } from "../tipos";
import { resolveSupportUser, isSupportAdmin, isSupportAlias, SUPPORT_EMAIL, SUPPORT_USER_ID } from "./utilidades";
import { apiFetch } from "../config";
import type { SocialPanelProps, SupportConversationItem } from "./tipos";

export function useEstadoSoporte(props: SocialPanelProps) {
  const { users, currentUser, messages, activeChatUser, onSelectChatUser, onSendPrivateMessage, unreadCounts, clearUnreads } = props;
  const isAdmin = isSupportAdmin(currentUser);
  const supportUser = useMemo(() => resolveSupportUser(users), [users]);

  const [chatInput, setChatInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [adminTabFilter, setAdminTabFilter] = useState<"all" | "unreads">("all");
  const [apiConversations, setApiConversations] = useState<SupportConversationItem[]>([]);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  // Auto-scroll chat to bottom when messages update
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, activeChatUser]);

  // For regular clients: auto-select the single Support chat by default on desktop/large screens
  useEffect(() => {
    if (!isAdmin && (!activeChatUser || !activeChatUser.id)) {
      onSelectChatUser(supportUser);
      if (unreadCounts[supportUser.id]) clearUnreads(supportUser.id);
      if (unreadCounts[SUPPORT_USER_ID]) clearUnreads(SUPPORT_USER_ID);
      if (unreadCounts[SUPPORT_EMAIL]) clearUnreads(SUPPORT_EMAIL);
    }
  }, [isAdmin, activeChatUser?.id, supportUser.id]);

  // For ADMIN: fetch past conversations from server to ensure complete inbox
  useEffect(() => {
    if (isAdmin) {
      apiFetch("/api/chats/support/conversations")
        .then(async (res) => {
          if (!res.ok) return { conversations: [] };
          const text = await res.text();
          if (!text) return { conversations: [] };
          try {
            return JSON.parse(text);
          } catch {
            return { conversations: [] };
          }
        })
        .then((data) => {
          if (Array.isArray(data?.conversations)) {
            setApiConversations(data.conversations);
          }
        })
        .catch((err) => console.warn("Notice fetching support conversations:", err?.message || err));
    }
  }, [isAdmin]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    onSendPrivateMessage(chatInput.trim());
    setChatInput("");
  };

  const handleSelectClient = (clientUser: User) => {
    onSelectChatUser(clientUser);
    clearUnreads(clientUser.id);
  };

  // Filter messages specifically for the active conversation
  const currentConversationMessages = useMemo(() => {
    if (!activeChatUser) return [];

    const myId = currentUser.originalId || currentUser.id;
    const partnerId = activeChatUser.originalId || activeChatUser.id;

    if (!isAdmin) {
      // For Client: all messages between this client and Support (checking aliases)
      return messages.filter((msg) => {
        const isFromMe = msg.senderId === myId || msg.senderId === currentUser.id || msg.senderId === "current_user";
        const isToMe = msg.receiverId === myId || msg.receiverId === currentUser.id || msg.receiverId === "current_user";
        const isFromSupport = isSupportAlias(msg.senderId) || msg.senderId === partnerId || msg.senderId === supportUser.id;
        const isToSupport = isSupportAlias(msg.receiverId) || msg.receiverId === partnerId || msg.receiverId === supportUser.id;

        return (isFromMe && isToSupport) || (isFromSupport && isToMe);
      });
    } else {
      // For Admin: messages between active client (partnerId) and Support/Admin
      return messages.filter((msg) => {
        const isFromPartner = msg.senderId === partnerId || msg.senderId === activeChatUser.id;
        const isToPartner = msg.receiverId === partnerId || msg.receiverId === activeChatUser.id;
        const isFromSupportOrMe = isSupportAlias(msg.senderId) || msg.senderId === myId || msg.senderId === currentUser.id || msg.senderId === "current_user";
        const isToSupportOrMe = isSupportAlias(msg.receiverId) || msg.receiverId === myId || msg.receiverId === currentUser.id || msg.receiverId === "current_user";

        return (isFromSupportOrMe && isToPartner) || (isFromPartner && isToSupportOrMe);
      });
    }
  }, [messages, activeChatUser, currentUser, isAdmin, supportUser]);

  // Client's last support message snippet
  const clientLastMessage = useMemo(() => {
    if (currentConversationMessages.length > 0) {
      return currentConversationMessages[currentConversationMessages.length - 1];
    }
    // Also check if any in general messages list matches
    const myId = currentUser.originalId || currentUser.id;
    const supportMsgs = messages.filter((m) => {
      const isFromMe = m.senderId === myId || m.senderId === currentUser.id || m.senderId === "current_user";
      const isToMe = m.receiverId === myId || m.receiverId === currentUser.id || m.receiverId === "current_user";
      const isSupportS = isSupportAlias(m.senderId);
      const isSupportR = isSupportAlias(m.receiverId);
      return (isFromMe && isSupportR) || (isSupportS && isToMe);
    });
    return supportMsgs.length > 0 ? supportMsgs[supportMsgs.length - 1] : null;
  }, [currentConversationMessages, messages, currentUser]);

  // For ADMIN: Build the list of client conversations
  const adminClientList = useMemo(() => {
    if (!isAdmin) return [];

    const myId = currentUser.originalId || currentUser.id;
    const clientMap = new Map<string, { user: User; lastMsg?: ChatMessage; unreads: number }>();

    // 1. Seed from apiConversations if loaded
    apiConversations.forEach((conv) => {
      const foundUser = users.find((u) => u.id === conv.clientId || u.originalId === conv.clientId) || conv.user;
      clientMap.set(conv.clientId, {
        user: foundUser,
        lastMsg: conv.lastMessage,
        unreads: unreadCounts[conv.clientId] || 0,
      });
    });

    // 2. Supplement from live messages in state
    messages.forEach((msg) => {
      let otherId = "";
      if (isSupportAlias(msg.senderId) || msg.senderId === myId) {
        otherId = msg.receiverId;
      } else if (isSupportAlias(msg.receiverId) || msg.receiverId === myId) {
        otherId = msg.senderId;
      }

      if (otherId && !isSupportAlias(otherId) && otherId !== "current_user") {
        const existing = clientMap.get(otherId);
        const foundUser = users.find((u) => u.id === otherId || u.originalId === otherId);
        const resolvedUser: User = foundUser || (existing?.user) || {
          id: otherId,
          name: otherId.startsWith("guest_") ? "Cliente Invitado" : "Cliente",
          username: otherId.startsWith("guest_") ? otherId.slice(0, 12) : otherId,
          avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=120&q=80",
          bio: "Cliente de Mall Social",
          isOnline: false,
          followers: 0,
          following: 0,
        };

        clientMap.set(otherId, {
          user: resolvedUser,
          lastMsg: msg,
          unreads: unreadCounts[otherId] || 0,
        });
      }
    });

    // 3. Add known registered users who are not the admin
    users.forEach((u) => {
      if (
        u.id !== currentUser.id &&
        u.email?.toLowerCase() !== SUPPORT_EMAIL &&
        !isSupportAlias(u.username) &&
        u.username !== "invitado" &&
        !clientMap.has(u.id)
      ) {
        clientMap.set(u.id, {
          user: u,
          unreads: unreadCounts[u.id] || 0,
        });
      }
    });

    let clients = Array.from(clientMap.values());

    // Apply search filter if query exists
    const query = searchQuery.trim().toLowerCase();
    if (query) {
      clients = clients.filter(
        (c) =>
          c.user.name.toLowerCase().includes(query) ||
          (c.user.email && c.user.email.toLowerCase().includes(query)) ||
          (c.user.email && c.user.email.toLowerCase().includes(query))
      );
    }

    // Apply tab filter (unreads only)
    if (adminTabFilter === "unreads") {
      clients = clients.filter((c) => c.unreads > 0);
    }

    // Sort by latest message timestamp or unreads
    return clients.sort((a, b) => {
      if (a.unreads > 0 && b.unreads === 0) return -1;
      if (b.unreads > 0 && a.unreads === 0) return 1;
      const timeA = a.lastMsg?.timestamp ? new Date(a.lastMsg.timestamp).getTime() : 0;
      const timeB = b.lastMsg?.timestamp ? new Date(b.lastMsg.timestamp).getTime() : 0;
      return timeB - timeA;
    });
  }, [isAdmin, apiConversations, messages, users, currentUser, unreadCounts, searchQuery, adminTabFilter]);

  const clientUnreads = unreadCounts[supportUser.id] || unreadCounts[SUPPORT_USER_ID] || unreadCounts[SUPPORT_EMAIL] || 0;
  const isGuest = isGuestUser(currentUser);
  return {
    isAdmin, supportUser, chatInput, setChatInput, searchQuery, setSearchQuery,
    adminTabFilter, setAdminTabFilter, apiConversations, scrollRef,
    handleSubmit, handleSelectClient, currentConversationMessages,
    clientLastMessage, adminClientList, clientUnreads, isGuest,
  };
}
