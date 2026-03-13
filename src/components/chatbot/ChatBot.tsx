import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import DOMPurify from 'dompurify';
import { FAQ_CATEGORIES, WELCOME_MESSAGE, LANDING_FAQ_CATEGORIES, LANDING_WELCOME_MESSAGE, FAQCategory, FAQItem } from './chatbotData';
import { cn } from '../../lib/utils';

const MessageCircle = (props: any) => (
  <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
);
const X = (props: any) => (
  <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
);
const ChevronLeft = (props: any) => (
  <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>
);
const Search = (props: any) => (
  <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
);

interface ChatBotProps {
  variant?: 'dashboard' | 'landing';
}

type View = 'home' | 'category' | 'answer';

interface Message {
  id: string;
  type: 'bot' | 'user';
  text: string;
}

function renderMarkdown(text: string): string {
  const html = text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\n/g, '<br/>');
  return DOMPurify.sanitize(html);
}

// #10 — Online/Offline: Mon–Fri 9am–6pm IST
function getIsOnline(): boolean {
  const now = new Date();
  const utc = now.getTime() + now.getTimezoneOffset() * 60000;
  const ist = new Date(utc + 330 * 60000); // UTC+5:30
  const day = ist.getDay();   // 0=Sun, 6=Sat
  const hour = ist.getHours();
  return day >= 1 && day <= 5 && hour >= 9 && hour < 18;
}

export default function ChatBot({ variant = 'dashboard' }: ChatBotProps) {
  const isLanding = variant === 'landing';
  const ACTIVE_CATEGORIES = isLanding ? LANDING_FAQ_CATEGORIES : FAQ_CATEGORIES;
  const ACTIVE_WELCOME = isLanding ? LANDING_WELCOME_MESSAGE : WELCOME_MESSAGE;

  const [isOpen, setIsOpen] = useState(false);
  const [view, setView] = useState<View>('home');
  const [selectedCategory, setSelectedCategory] = useState<FAQCategory | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    { id: 'welcome', type: 'bot', text: ACTIVE_WELCOME },
  ]);
  const [hasUnread, setHasUnread] = useState(true);
  const [isTyping, setIsTyping] = useState(false);  // #7
  const isOnline = getIsOnline();                    // #10
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setHasUnread(false);
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    }
  }, [isOpen, messages]);

  const addMessage = (type: 'bot' | 'user', text: string) => {
    setMessages((prev) => [
      ...prev,
      { id: `${Date.now()}-${Math.random()}`, type, text },
    ]);
  };

  const handleCategorySelect = (cat: FAQCategory) => {
    setSelectedCategory(cat);
    setSearchQuery('');
    addMessage('user', `${cat.icon} ${cat.label}`);
    setIsTyping(true);
    setTimeout(() => {
      setIsTyping(false);
      addMessage('bot', `Here are common questions about **${cat.label}**. Tap one to see the answer:`);
      setView('category');
    }, 700);
  };

  const handleFAQSelect = (faq: FAQItem) => {
    addMessage('user', faq.question);
    setIsTyping(true);
    setTimeout(() => {
      setIsTyping(false);
      addMessage('bot', faq.answer);
      setView('answer');
    }, 900);
  };

  const handleBack = () => {
    if (view === 'answer') {
      setView('category');
    } else if (view === 'category') {
      setSelectedCategory(null);
      setSearchQuery('');
      setView('home');
    }
  };

  const handleReset = () => {
    setView('home');
    setSelectedCategory(null);
    setSearchQuery('');
    setMessages([{ id: 'welcome', type: 'bot', text: ACTIVE_WELCOME }]);
  };

  // Filtered FAQs for search
  const searchResults = searchQuery.trim().length > 1
    ? ACTIVE_CATEGORIES.flatMap((cat) =>
        cat.faqs
          .filter(
            (faq) =>
              faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
              faq.answer.toLowerCase().includes(searchQuery.toLowerCase()),
          )
          .map((faq) => ({ faq, cat })),
      )
    : [];

  const filteredFAQs = selectedCategory
    ? selectedCategory.faqs.filter((f) =>
        f.question.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    : [];

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen((o) => !o)}
        aria-label="Open Help Chat"
        className={cn(
          'fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full shadow-2xl flex items-center justify-center transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-emerald-400/50',
          isOpen
            ? 'bg-slate-700 dark:bg-slate-600 rotate-0 scale-95'
            : 'bg-emerald-600 hover:bg-emerald-700 hover:scale-110',
        )}
      >
        {isOpen ? (
          <X className="w-6 h-6 text-white" />
        ) : (
          <>
            <MessageCircle className="w-6 h-6 text-white" />
            {hasUnread && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 rounded-full flex items-center justify-center text-[10px] text-white font-bold animate-bounce">
                ?
              </span>
            )}
          </>
        )}
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div
          className={cn(
            'fixed bottom-24 right-6 z-50 w-[360px] max-w-[calc(100vw-1.5rem)] rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 flex flex-col overflow-hidden',
            'bg-white dark:bg-slate-900',
            'animate-in slide-in-from-bottom-4 fade-in duration-300',
          )}
          style={{ maxHeight: '560px' }}
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-emerald-600 to-emerald-700 px-4 py-3 flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-2.5">
              {view !== 'home' && (
                <button
                  onClick={handleBack}
                  className="p-1 rounded-lg hover:bg-white/20 transition-colors text-white"
                  aria-label="Go back"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
              )}
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-base">
                  🤖
                </div>
                <div>
                  <p className="text-white font-semibold text-sm leading-none">FlatLedger Guide</p>
                  <p className="text-emerald-200 text-[11px] mt-0.5 flex items-center gap-1">
                    <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${isOnline ? 'bg-emerald-400' : 'bg-slate-400'}`} />
                    {isOnline ? 'Online · replies in minutes' : 'Offline · replies in 24h'}
                  </p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={handleReset}
                title="Start over"
                className="p-1.5 rounded-lg hover:bg-white/20 transition-colors text-white text-xs font-medium"
              >
                ↺
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg hover:bg-white/20 transition-colors text-white"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-3 space-y-3 min-h-0 bg-slate-50 dark:bg-slate-950">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={cn(
                  'flex',
                  msg.type === 'user' ? 'justify-end' : 'justify-start',
                )}
              >
                {msg.type === 'bot' && (
                  <div className="w-7 h-7 rounded-full bg-emerald-100 dark:bg-emerald-900 flex items-center justify-center text-sm flex-shrink-0 mr-2 mt-0.5">
                    🤖
                  </div>
                )}
                <div
                  className={cn(
                    'max-w-[78%] px-3 py-2 rounded-2xl text-sm leading-relaxed',
                    msg.type === 'user'
                      ? 'bg-emerald-600 text-white rounded-tr-sm'
                      : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-100 dark:border-slate-700 rounded-tl-sm shadow-sm',
                  )}
                  dangerouslySetInnerHTML={{ __html: renderMarkdown(msg.text) }}
                />
              </div>
            ))}

            {/* #7 — Typing indicator */}
            {isTyping && (
              <div className="flex justify-start">
                <div className="w-7 h-7 rounded-full bg-emerald-100 dark:bg-emerald-900 flex items-center justify-center text-sm flex-shrink-0 mr-2 mt-0.5">
                  🤖
                </div>
                <div className="px-4 py-3 rounded-2xl rounded-tl-sm bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 shadow-sm flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Interaction Panel */}
          <div className="flex-shrink-0 border-t border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
            {/* HOME: search + categories */}
            {view === 'home' && (
              <div className="p-3 space-y-2">
                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                  <input
                    ref={searchRef}
                    type="text"
                    placeholder="Search a question..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-8 pr-3 py-2 text-sm border border-slate-200 dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-400"
                  />
                </div>

                {/* Search results */}
                {searchQuery.trim().length > 1 ? (
                  <div className="space-y-1 max-h-52 overflow-y-auto">
                    {searchResults.length === 0 ? (
                      <p className="text-xs text-slate-400 text-center py-3">No results found.</p>
                    ) : (
                      searchResults.map(({ faq, cat }, idx) => (
                        <button
                          key={idx}
                          onClick={() => {
                            setSelectedCategory(cat);
                            handleFAQSelect(faq);
                          }}
                          className="w-full text-left px-3 py-2 rounded-lg text-xs text-slate-700 dark:text-slate-300 hover:bg-emerald-50 dark:hover:bg-slate-800 border border-slate-100 dark:border-slate-700 transition-colors"
                        >
                          <span className="text-emerald-500 font-medium">{cat.icon} {cat.label}</span>
                          <br />
                          {faq.question}
                        </button>
                      ))
                    )}
                  </div>
                ) : (
                  /* Category grid */
                  <div className="grid grid-cols-3 gap-1.5">
                    {ACTIVE_CATEGORIES.map((cat) => (
                      <button
                        key={cat.id}
                        onClick={() => handleCategorySelect(cat)}
                        className="flex flex-col items-center gap-1 px-2 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-emerald-400 hover:bg-emerald-50 dark:hover:bg-slate-800 transition-all text-center group"
                      >
                        <span className="text-xl group-hover:scale-110 transition-transform">{cat.icon}</span>
                        <span className="text-[11px] font-medium text-slate-700 dark:text-slate-300 leading-tight">
                          {cat.label}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* CATEGORY: list of questions */}
            {view === 'category' && selectedCategory && (
              <div className="p-3 space-y-1.5 max-h-52 overflow-y-auto">
                {/* Search within category */}
                <div className="relative mb-2">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Filter questions..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 text-xs border border-slate-200 dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-400"
                  />
                </div>
                {filteredFAQs.length === 0 ? (
                  <p className="text-xs text-slate-400 text-center py-3">No questions match your search.</p>
                ) : (
                  filteredFAQs.map((faq, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleFAQSelect(faq)}
                      className="w-full text-left px-3 py-2.5 rounded-xl border border-slate-100 dark:border-slate-700 hover:border-emerald-400 hover:bg-emerald-50 dark:hover:bg-slate-800 transition-all text-xs text-slate-700 dark:text-slate-300 font-medium flex items-start gap-2"
                    >
                      <span className="text-emerald-400 font-bold mt-0.5 flex-shrink-0">Q</span>
                      {faq.question}
                    </button>
                  ))
                )}
              </div>
            )}

            {/* ANSWER: ask another question */}
            {view === 'answer' && (
              <div className="p-3 space-y-2">
                <p className="text-xs text-slate-500 dark:text-slate-400 text-center">Was this helpful?</p>
                <div className="flex gap-2">
                  <button
                    onClick={handleBack}
                    className="flex-1 py-2 rounded-xl border border-emerald-200 dark:border-emerald-700 text-emerald-600 dark:text-emerald-400 text-xs font-medium hover:bg-emerald-50 dark:hover:bg-slate-800 transition-colors"
                  >
                    ← More in {selectedCategory?.label}
                  </button>
                  <button
                    onClick={handleReset}
                    className="flex-1 py-2 rounded-xl bg-emerald-600 text-white text-xs font-medium hover:bg-emerald-700 transition-colors"
                  >
                    Ask another
                  </button>
                </div>
                {isLanding && (
                  <Link
                    to="/signup"
                    onClick={() => setIsOpen(false)}
                    className="flex items-center justify-center w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-700 text-white text-xs font-semibold hover:from-emerald-700 hover:to-emerald-800 transition-all shadow-sm gap-1.5"
                  >
                    Start Free Trial — 30 days free, no card needed →
                  </Link>
                )}
                {/* #3 — Email fallback for all variants */}
                <p className="text-center text-[11px] text-slate-400 dark:text-slate-500 pt-0.5">
                  Still confused?{' '}
                  <a
                    href="mailto:support@FlatLedger.com"
                    className="text-emerald-500 hover:text-emerald-600 underline underline-offset-2"
                  >
                    Email us →
                  </a>
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
