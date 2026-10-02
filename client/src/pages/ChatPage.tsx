import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import ChatList from '../components/ChatList';
import ChatThread from '../components/ChatThread';
import LanguageSwitcher from '../components/LanguageSwitcher';
import {
  getConversationsForUser,
  getMessagesForConversation,
  mockConversations,
  mockMessages,
  type ChatConversation,
  type ChatMessage,
} from '../lib/mockChat';

export default function ChatPage() {
  const { user } = useAuth();
  const { conversationId } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const canChat = user?.role === 'BUYER' || user?.role === 'SELLER';

  const [conversations, setConversations] = useState<ChatConversation[]>(() => {
    if (!user || (user.role !== 'BUYER' && user.role !== 'SELLER')) return [];
    const userConversations = getConversationsForUser(user.id, user.role);
    return userConversations.length || user.role !== 'SELLER' ? userConversations : mockConversations;
  });

  const [messagesByConversation, setMessagesByConversation] = useState<Record<string, ChatMessage[]>>(() => {
    const initial: Record<string, ChatMessage[]> = {};
    conversations.forEach((conversation) => {
      const conversationMessages = getMessagesForConversation(conversation.id);
      initial[conversation.id] = conversationMessages.length
        ? conversationMessages
        : [...(mockMessages[conversation.id] || [])];
    });
    return initial;
  });

  const activeConversationId = conversationId;
  const activeConversation = conversations.find((conversation) => conversation.id === activeConversationId) ?? null;
  const messages = useMemo(
    () => activeConversation ? messagesByConversation[activeConversation.id] ?? [] : [],
    [activeConversation, messagesByConversation]
  );

  useEffect(() => {
    if (!user || user.role !== 'BUYER' || !conversationId?.startsWith('mock-')) return;
    if (conversations.some((conversation) => conversation.id === conversationId)) return;

    const newConversation: ChatConversation = {
      id: conversationId,
      buyer: { id: user.id, name: user.name, role: 'BUYER' },
      seller: { id: 'seller-mock-1', name: 'Mock Seller', role: 'SELLER' },
      yarn: {
        id: conversationId.replace('mock-', ''),
        name: 'Yarn',
      },
      lastMessage: '',
      lastMessageAt: new Date().toISOString(),
      unreadCount: 0,
    };

    setConversations((current) => [newConversation, ...current]);
    setMessagesByConversation((current) => ({ ...current, [conversationId]: [] }));
  }, [conversationId, conversations, user]);

  const handleSelect = useCallback((id: string) => {
    navigate(`/chat/${id}`);
  }, [navigate]);

  const handleSend = useCallback((text: string) => {
    if (!activeConversation || !user) return;

    const newMessage: ChatMessage = {
      id: crypto.randomUUID(),
      conversationId: activeConversation.id,
      senderId: user.id,
      text,
      createdAt: new Date().toISOString(),
      read: false,
    };

    setMessagesByConversation((current) => ({
      ...current,
      [activeConversation.id]: [...(current[activeConversation.id] ?? []), newMessage],
    }));
    setConversations((current) => current.map((conversation) => conversation.id === activeConversation.id
      ? { ...conversation, lastMessage: text, lastMessageAt: newMessage.createdAt }
      : conversation));
  }, [activeConversation, user]);

  if (!user || !canChat) return null;

  return (
    <div className="min-h-screen bg-[#dfeef0] p-4 md:p-6">
      <div className="mx-auto max-w-7xl">
        <nav className="mb-6 flex items-center justify-between rounded-[28px] bg-white p-4 shadow-soft">
          <img src="/logo.jpeg" alt="WeaveShare" className="h-12 w-auto" />
          <LanguageSwitcher />
        </nav>
        <div className="card-shell h-[calc(100vh-120px)] overflow-hidden">
          <div className="hidden h-full md:grid md:grid-cols-[340px_1fr]">
            <div className="border-r border-slate-100">
              <ChatList
                conversations={conversations}
                activeId={activeConversationId}
                onSelect={handleSelect}
                currentUserId={user.id}
              />
            </div>
            <div className="min-w-0">
              <ChatThread
                conversation={activeConversation}
                currentUserId={user.id}
                messages={messages}
                onSend={handleSend}
              />
            </div>
          </div>

          <div className="h-full md:hidden">
            {activeConversation ? (
              <div className="relative h-full">
                <button
                  type="button"
                  onClick={() => navigate('/chat')}
                  aria-label={t('chat.backToList')}
                  className="absolute left-2 top-2 z-10 rounded-full bg-white p-2 text-brand-dark shadow-soft"
                >
                  <ArrowLeft size={18} />
                </button>
                <ChatThread
                  conversation={activeConversation}
                  currentUserId={user.id}
                  messages={messages}
                  onSend={handleSend}
                />
              </div>
            ) : (
              <ChatList
                conversations={conversations}
                activeId={activeConversationId}
                onSelect={handleSelect}
                currentUserId={user.id}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
