import type { User, ChatMessage } from "../../../types";

interface SocialPanelProps {
  users: User[];
  currentUser: User;
  messages: ChatMessage[];
  activeChatUser: User | null;
  onSelectChatUser: (user: User | null) => void;
  onSendPrivateMessage: (text: string) => void;
  unreadCounts: Record<string, number>;
  clearUnreads: (userId: string) => void;
  onClose: () => void;
}

interface SupportConversationItem {
  clientId: string;
  user: User;
  lastMessage?: ChatMessage;
  messageCount: number;
}
