import { useEffect, useMemo, useRef, useState } from "react";
import type { User, ChatMessage } from "../../../types";
import { isGuestUser } from "../../../types";
import { resolveSupportUser, isSupportAdmin, isSupportAlias, SUPPORT_EMAIL, SUPPORT_USER_ID } from "../../../utils/supportChat";
import { apiFetch } from "../../../config";
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
  return {
    isAdmin, supportUser, chatInput, setChatInput, searchQuery, setSearchQuery,
    adminTabFilter, setAdminTabFilter, apiConversations, scrollRef,
    handleSubmit, handleSelectClient, currentConversationMessages,
    clientLastMessage, adminClientList, clientUnreads, isGuest,
  };
}
