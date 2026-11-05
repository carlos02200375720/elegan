import React, { useEffect, useMemo, useState } from "react";
import { resolveSupportUser, isSupportAdmin, SUPPORT_EMAIL, SUPPORT_USER_ID } from "../../../utils/supportChat";
import type { AndroidSocialPanelProps } from "./TiposSocialPanel";
import { getAdminClientList, getConversationMessages } from "./FuncionesSocialPanel";
import VistaConversacion from "./VistaConversacion";
import VistaBandeja from "./VistaBandeja";

export type { AndroidSocialPanelProps } from "./TiposSocialPanel";

export default function AndroidSocialPanel({
  users,
  currentUser,
  messages,
  activeChatUser,
  onSelectChatUser,
  onSendPrivateMessage,
  unreadCounts,
  clearUnreads,
  onClose,
}: AndroidSocialPanelProps) {
  const isAdmin = isSupportAdmin(currentUser);
  const supportUser = useMemo(() => resolveSupportUser(users), [users]);
  const [searchQuery, setSearchQuery] = useState("");

  const conversationMessages = useMemo(
    () => getConversationMessages(messages, currentUser, activeChatUser, isAdmin, supportUser),
    [messages, currentUser, activeChatUser, isAdmin, supportUser]
  );

  const adminClientList = useMemo(
    () => isAdmin ? getAdminClientList(messages, users, currentUser, unreadCounts, searchQuery) : [],
    [isAdmin, messages, users, currentUser, unreadCounts, searchQuery]
  );

  const clientUnreads = unreadCounts[supportUser.id] || unreadCounts[SUPPORT_USER_ID] || unreadCounts[SUPPORT_EMAIL] || 0;

  useEffect(() => {
    const applyStatusBar = async () => {
      try {
        if (typeof window !== "undefined" && (window as any).Capacitor?.isPluginAvailable?.("StatusBar")) {
          const { StatusBar, Style } = await import("@capacitor/status-bar");
          await StatusBar.setStyle({ style: Style.Light });
          await StatusBar.setBackgroundColor({ color: "#ffffff" });
        }
      } catch {
        // El plugin puede no estar disponible en web.
      }

      if (typeof document !== "undefined") {
        document.querySelectorAll('meta[name="theme-color"]').forEach((tag) => tag.setAttribute("content", "#ffffff"));
      }
    };

    void applyStatusBar();
  }, [activeChatUser]);

  return (
    <div id="android-social-panel" className="w-full h-full min-h-screen bg-white text-slate-900 flex flex-col font-sans select-none" style={{ backgroundColor: "#ffffff" }}>
      {activeChatUser ? (
        <VistaConversacion
          currentUser={currentUser}
          activeChatUser={activeChatUser}
          isAdmin={isAdmin}
          supportUser={supportUser}
          messages={conversationMessages}
          onBack={() => onSelectChatUser(null)}
          onClose={onClose}
          onSend={onSendPrivateMessage}
        />
      ) : (
        <VistaBandeja
          isAdmin={isAdmin}
          supportUser={supportUser}
          clients={adminClientList}
          clientUnreads={clientUnreads}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onSelectUser={onSelectChatUser}
          onClearUnreads={clearUnreads}
          onClose={onClose}
        />
      )}
    </div>
  );
}
