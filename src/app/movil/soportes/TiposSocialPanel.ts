import type { User, ChatMessage } from "../tipos";

export interface AndroidSocialPanelProps {
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

export interface AdminClient {
  user: User;
  lastMsg?: ChatMessage;
  unreads: number;
}

export interface ConversationProps {
  currentUser: User;
  activeChatUser: User;
  isAdmin: boolean;
  supportUser: User;
  messages: ChatMessage[];
  onBack: () => void;
  onClose: () => void;
  onSend: (text: string) => void;
}
