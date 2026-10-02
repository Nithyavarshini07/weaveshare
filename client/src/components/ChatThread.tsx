import { useEffect, useMemo, useRef, useState } from 'react';
import type { FormEvent, KeyboardEvent } from 'react';
import { useTranslation } from 'react-i18next';
import type { ChatConversation, ChatMessage } from '../lib/mockChat';

type ChatThreadProps = {
  conversation: ChatConversation | null;
  currentUserId: string;
  messages: ChatMessage[];
  onSend: (text: string) => void;
};

type DatedMessage = {
  message: ChatMessage;
  day: string;
};

export default function ChatThread({ conversation, currentUserId, messages, onSend }: ChatThreadProps) {
  const { t, i18n } = useTranslation();
  const [draft, setDraft] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  const datedMessages = useMemo<DatedMessage[]>(() => messages.map((message) => ({
    message,
    day: new Date(message.createdAt).toLocaleDateString('en-CA'),
  })), [messages]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length, conversation?.id]);

  useEffect(() => {
    setDraft('');
  }, [conversation?.id]);

  const handleSubmit = (event: FormEvent<HTMLFormElement> | KeyboardEvent<HTMLTextAreaElement>) => {
    event.preventDefault();
    const text = draft.trim();
    if (!text) return;
    onSend(text);
    setDraft('');
  };

  const labelForDay = (day: string) => {
    const today = new Date();
    const messageDay = new Date(`${day}T00:00:00`);
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const yesterdayStart = new Date(todayStart);
    yesterdayStart.setDate(yesterdayStart.getDate() - 1);

    if (messageDay.getTime() === todayStart.getTime()) return t('chat.today');
    if (messageDay.getTime() === yesterdayStart.getTime()) return t('chat.yesterday');
    return new Date(`${day}T00:00:00`).toLocaleDateString(i18n.language, { month: 'short', day: 'numeric' });
  };

  if (!conversation) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 bg-white text-center">
        <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-16 w-16 text-slate-300">
          <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3.75h5.25m-8.25 7.5 2.4-3.2a2.25 2.25 0 0 1 1.8-.9h8.55A3.75 3.75 0 0 0 21 11.65V6.75A3.75 3.75 0 0 0 17.25 3h-10.5A3.75 3.75 0 0 0 3 6.75v5.1a3.75 3.75 0 0 0 1.5 3v4.65Z" />
        </svg>
        <p className="text-sm text-slate-500">{t('chat.startConversation')}</p>
      </div>
    );
  }

  const otherUser = conversation.buyer.id === currentUserId ? conversation.seller : conversation.buyer;

  return (
    <div className="flex h-full flex-col bg-white">
      <header className="flex items-center gap-3 border-b border-slate-100 px-4 py-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-teal font-bold text-white">
          {otherUser.name.charAt(0).toLocaleUpperCase()}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate font-bold text-slate-800">{otherUser.name}</p>
          <div className="flex min-w-0 items-center gap-2">
            <img src={conversation.yarn.image || '/blue.jpg'} alt="" className="h-6 w-6 shrink-0 rounded object-cover" />
            <p className="truncate text-xs text-slate-500">{conversation.yarn.name}</p>
          </div>
        </div>
      </header>

      <main className="flex-1 space-y-2 overflow-y-auto px-4 py-4">
        {messages.length === 0 ? (
          <div className="flex h-full items-center justify-center text-center text-sm text-slate-500">
            {t('chat.noMessages')}
          </div>
        ) : datedMessages.map(({ message, day }, index) => {
          const isOwn = message.senderId === currentUserId;
          const previousDay = index > 0 ? datedMessages[index - 1].day : undefined;

          return (
            <div key={message.id}>
              {day !== previousDay && (
                <div className="flex items-center justify-center py-3">
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-500">
                    {labelForDay(day)}
                  </span>
                </div>
              )}
              <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[75%] rounded-2xl px-4 py-2 ${isOwn ? 'bg-brand-teal text-white rounded-br-sm' : 'bg-slate-100 text-slate-800 rounded-bl-sm'}`}>
                  <p className="whitespace-pre-wrap break-words text-sm">{message.text}</p>
                  <p className={`mt-1 text-[10px] ${isOwn ? 'text-white/70' : 'text-slate-400'}`}>
                    {new Date(message.createdAt).toLocaleTimeString(i18n.language, { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </main>

      <footer className="border-t border-slate-100 p-3">
        <form onSubmit={handleSubmit} className="flex items-end gap-2">
          <textarea
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' && !event.shiftKey) {
                event.preventDefault();
                handleSubmit(event);
              }
            }}
            placeholder={t('chat.typeMessage')}
            rows={1}
            className="soft-input flex-1 resize-none max-h-32 min-h-[44px]"
          />
          <button
            type="submit"
            disabled={!draft.trim()}
            className="primary-btn px-4 py-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {t('chat.send')}
          </button>
        </form>
      </footer>
    </div>
  );
}
