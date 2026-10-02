import { useTranslation } from 'react-i18next';
import type { ChatConversation } from '../lib/mockChat';
import { timeAgo } from '../lib/timeAgo';

type ChatListProps = {
  conversations: ChatConversation[];
  activeId?: string;
  onSelect: (id: string) => void;
  currentUserId: string;
};

export default function ChatList({ conversations, activeId, onSelect, currentUserId }: ChatListProps) {
  const { t, i18n } = useTranslation();

  const otherUser = (conversation: ChatConversation) =>
    conversation.buyer.id === currentUserId ? conversation.seller : conversation.buyer;

  const relativeTime = (date: string) => {
    const elapsed = timeAgo(date);
    if (elapsed === 'just now') return t('time.justNow');

    const minuteMatch = elapsed.match(/^(\d+) min ago$/);
    if (minuteMatch) return t('time.minutesAgo', { count: Number(minuteMatch[1]) });

    const hourMatch = elapsed.match(/^(\d+) hours? ago$/);
    if (hourMatch) return t('time.hoursAgo', { count: Number(hourMatch[1]) });

    const dayMatch = elapsed.match(/^(\d+) days? ago$/);
    if (dayMatch) {
      const days = Number(dayMatch[1]);
      if (days === 1) return t('chat.yesterday');
      if (days < 7) return t('time.daysAgo', { count: days });
    }

    const weekMatch = elapsed.match(/^(\d+) weeks? ago$/);
    if (weekMatch) return t('time.weeksAgo', { count: Number(weekMatch[1]) });

    return new Date(date).toLocaleDateString(i18n.language, { weekday: 'short' });
  };

  return (
    <div className="flex h-full flex-col">
      <h2 className="px-4 py-3 text-lg font-black text-brand-dark">{t('chat.title')}</h2>
      <div className="flex-1 space-y-1 overflow-y-auto px-2 pb-2">
        {conversations.length ? conversations.map((conversation) => {
          const user = otherUser(conversation);
          return (
            <button
              key={conversation.id}
              type="button"
              onClick={() => onSelect(conversation.id)}
              className={`flex w-full cursor-pointer items-center gap-3 rounded-2xl p-3 text-left transition-colors hover:bg-slate-50 ${conversation.id === activeId ? 'bg-brand-teal/10 ring-1 ring-brand-teal/30' : ''}`}
            >
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brand-teal font-bold text-white">
                {user.name.charAt(0).toLocaleUpperCase()}
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex min-w-0 items-center justify-between gap-2">
                  <span className="truncate font-bold text-slate-800">{user.name}</span>
                  <span className="max-w-[44%] truncate text-xs text-slate-500">{conversation.yarn.name}</span>
                </span>
                <span className="block truncate text-sm text-slate-500">{conversation.lastMessage}</span>
              </span>
              <span className="flex shrink-0 flex-col items-end gap-1">
                <span className="text-xs text-slate-400">{relativeTime(conversation.lastMessageAt)}</span>
                {conversation.unreadCount > 0 && (
                  <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                    {conversation.unreadCount}
                  </span>
                )}
              </span>
            </button>
          );
        }) : (
          <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
            <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-12 w-12 text-slate-300">
              <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3.75h5.25m-8.25 7.5 2.4-3.2a2.25 2.25 0 0 1 1.8-.9h8.55A3.75 3.75 0 0 0 21 11.65V6.75A3.75 3.75 0 0 0 17.25 3h-10.5A3.75 3.75 0 0 0 3 6.75v5.1a3.75 3.75 0 0 0 1.5 3v4.65Z" />
            </svg>
            <p className="text-sm text-slate-500">{t('chat.noConversations')}</p>
          </div>
        )}
      </div>
    </div>
  );
}
