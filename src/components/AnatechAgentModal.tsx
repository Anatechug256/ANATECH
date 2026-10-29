import React, { useState, useRef, useEffect } from 'react';
import { 
  X, Send, Sparkles, Bot, ShieldCheck, MapPin, Download, 
  HelpCircle, RefreshCw, ChevronRight, User as UserIcon,
  Store, CheckCircle2, ArrowRight
} from 'lucide-react';
import { User } from '../types';

interface ActionItem {
  label: string;
  actionType: string;
  payload?: string;
}

interface MessageItem {
  id: string;
  sender: 'user' | 'agent';
  text: string;
  timestamp: string;
  actions?: ActionItem[];
}

interface AnatechAgentModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User;
  onOpenSellerRegistration: () => void;
  onOpenSafeTrading: () => void;
  onOpenInstall: () => void;
  onExecuteSearch?: (query: string) => void;
}

const PRESET_QUESTIONS = [
  { label: '🛡️ Register as Seller', prompt: 'How do I register as a seller and verify my NIN to sell items?' },
  { label: '💰 Safe MoMo Escrow', prompt: 'How does Mobile Money escrow and safe trading work on ANATECH MARKET?' },
  { label: '📍 Kampala Meetup Spots', prompt: 'Where are the safest police station meetup spots in Kampala?' },
  { label: '📱 Download Android APK', prompt: 'How do I download and install the ANATECH MARKET Android APK?' },
  { label: '🏷️ Uganda Pricing Guide', prompt: 'What are the current fair market prices for a Toyota Premio, Boda Boda, and Samsung Galaxy in Uganda?' }
];

export const AnatechAgentModal: React.FC<AnatechAgentModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onOpenSellerRegistration,
  onOpenSafeTrading,
  onOpenInstall,
  onExecuteSearch
}) => {
  const [messages, setMessages] = useState<MessageItem[]>([
    {
      id: 'welcome',
      sender: 'agent',
      text: `Hello ${currentUser.name.split(' ')[0]}! 👋 I am the **ANATECH Market AI Assistant**, powered by ANATECH UG.\n\nI can answer questions about:\n* 🛡️ **Seller Registration & NIN rules** (mandatory before posting listings)\n* 💰 **Ugandan Shillings (UGX) Fair Market Valuations**\n* 📍 **Verified Safe Meetup Spots & Police Station zones**\n* 📱 **Downloading our native Android APK with live camera capture**\n\nHow can I help your trade today in Uganda?`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      actions: [
        { label: '🛡️ Seller Requirements', actionType: 'register_seller' },
        { label: '📍 Safe Meetup Spots', actionType: 'safe_trade' },
        { label: '📱 Download Android APK', actionType: 'download_apk' }
      ]
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  if (!isOpen) return null;

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputMessage).trim();
    if (!text || isLoading) return;

    const userMsg: MessageItem = {
      id: `usr_${Date.now()}`,
      sender: 'user',
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    setInputMessage('');
    setIsLoading(true);

    try {
      // Map previous messages to format expected by server
      const history = messages.slice(-6).map(m => ({
        role: m.sender === 'user' ? 'user' : 'model',
        text: m.text
      }));

      const res = await fetch('/api/agent/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, history })
      });

      if (!res.ok) {
        throw new Error(`Server returned HTTP ${res.status}`);
      }

      const data = await res.json();
      const agentMsg: MessageItem = {
        id: `agt_${Date.now()}`,
        sender: 'agent',
        text: data.reply || "I'm here to assist with any questions on ANATECH MARKET.",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        actions: data.actions || []
      };

      setMessages(prev => [...prev, agentMsg]);
    } catch (err: any) {
      console.error('Agent chat error:', err);
      const errorMsg: MessageItem = {
        id: `agt_err_${Date.now()}`,
        sender: 'agent',
        text: "I experienced a slight connection delay to the Kampala node. Please try asking again, or tap one of the quick options below.",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        actions: [
          { label: '🛡️ Seller Registration Rules', actionType: 'register_seller' },
          { label: '📍 Safe Trading Guidelines', actionType: 'safe_trade' },
          { label: '📱 Download Android APK', actionType: 'download_apk' }
        ]
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTriggerAction = (action: ActionItem) => {
    if (action.actionType === 'register_seller') {
      onClose();
      onOpenSellerRegistration();
    } else if (action.actionType === 'safe_trade') {
      onClose();
      onOpenSafeTrading();
    } else if (action.actionType === 'download_apk') {
      onClose();
      onOpenInstall();
    } else if (action.actionType === 'search_items' && onExecuteSearch) {
      onClose();
      onExecuteSearch(action.payload || 'items');
    }
  };

  const handleClearChat = () => {
    setMessages([
      {
        id: 'welcome_reset',
        sender: 'agent',
        text: `Chat cleared! How can I assist you with ANATECH MARKET today?`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        actions: [
          { label: '🛡️ How to Sell', actionType: 'register_seller' },
          { label: '📍 Safe Meetups', actionType: 'safe_trade' },
          { label: '📱 Download APK', actionType: 'download_apk' }
        ]
      }
    ]);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="w-full max-w-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl flex flex-col h-[90vh] max-h-[700px] overflow-hidden"
        role="dialog"
        aria-modal="true"
        aria-labelledby="agent-modal-title"
      >
        {/* Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-950 via-slate-900 to-cyan-950 text-white flex items-center justify-between border-b border-cyan-500/20 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="relative">
              <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-gradient-to-tr from-cyan-500 via-teal-400 to-amber-400 p-0.5 shadow-lg shadow-cyan-500/20 flex items-center justify-center">
                <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
                  <Bot className="w-5 h-5 sm:w-6 sm:h-6 text-cyan-400" />
                </div>
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 border-2 border-slate-950 rounded-full" />
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h2 id="agent-modal-title" className="text-base sm:text-lg font-black tracking-tight text-white truncate">
                  ANATECH AI Agent
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 uppercase tracking-wider shrink-0">
                  Online
                </span>
              </div>
              <p className="text-xs text-slate-300 truncate">
                Uganda Verified Marketplace Intelligence · ANATECH UG
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={handleClearChat}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800/80 rounded-xl transition-colors cursor-pointer"
              title="Reset conversation"
              aria-label="Reset conversation"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800/80 rounded-xl transition-colors cursor-pointer"
              title="Close assistant"
              aria-label="Close assistant"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Quick Question Chips Bar */}
        <div className="px-3 sm:px-4 py-2 bg-slate-50 dark:bg-slate-900/60 border-b border-slate-100 dark:border-slate-800/60 flex items-center gap-1.5 overflow-x-auto no-scrollbar shrink-0">
          <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 shrink-0 select-none pr-1">
            Questions:
          </span>
          {PRESET_QUESTIONS.map((q, idx) => (
            <button
              key={idx}
              onClick={() => handleSendMessage(q.prompt)}
              disabled={isLoading}
              className="px-2.5 py-1 bg-white dark:bg-slate-800 hover:bg-cyan-50 dark:hover:bg-cyan-950/40 text-slate-700 dark:text-slate-200 hover:text-cyan-600 dark:hover:text-cyan-300 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-semibold whitespace-nowrap transition-all shadow-2xs active:scale-95 disabled:opacity-50 cursor-pointer"
            >
              {q.label}
            </button>
          ))}
        </div>

        {/* Chat Messages Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 bg-slate-50/50 dark:bg-slate-950/40">
          {messages.map((msg) => (
            <div 
              key={msg.id}
              className={`flex items-start gap-2.5 sm:gap-3 ${msg.sender === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
            >
              {msg.sender === 'agent' ? (
                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-cyan-600 to-teal-500 text-white flex items-center justify-center shrink-0 shadow-xs">
                  <Sparkles className="w-4 h-4" />
                </div>
              ) : (
                <img 
                  src={currentUser.avatar} 
                  alt={currentUser.name} 
                  className="w-8 h-8 rounded-xl object-cover border border-slate-300 dark:border-slate-700 shrink-0 shadow-xs" 
                />
              )}

              <div className={`max-w-[85%] sm:max-w-[78%] space-y-2`}>
                <div 
                  className={`p-3.5 sm:p-4 rounded-2xl text-xs sm:text-sm leading-relaxed whitespace-pre-line shadow-xs ${
                    msg.sender === 'user'
                      ? 'bg-gradient-to-r from-cyan-600 to-teal-600 text-white rounded-tr-none font-medium'
                      : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 border border-slate-200/80 dark:border-slate-700/80 rounded-tl-none'
                  }`}
                >
                  {msg.text}
                </div>

                {/* Smart Action Buttons if attached to agent message */}
                {msg.actions && msg.actions.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {msg.actions.map((act, aIdx) => (
                      <button
                        key={aIdx}
                        onClick={() => handleTriggerAction(act)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-cyan-500/10 to-teal-500/10 hover:from-cyan-500/20 hover:to-teal-500/20 border border-cyan-400/40 text-cyan-800 dark:text-cyan-200 rounded-xl text-xs font-bold transition-all shadow-2xs hover:shadow-cyan-500/10 active:scale-95 cursor-pointer"
                      >
                        <span>{act.label}</span>
                        <ChevronRight className="w-3.5 h-3.5 text-cyan-500" />
                      </button>
                    ))}
                  </div>
                )}

                <div className={`text-[10px] text-slate-400 font-medium ${msg.sender === 'user' ? 'text-right' : 'text-left'}`}>
                  {msg.timestamp}
                </div>
              </div>
            </div>
          ))}

          {/* Typing Indicator */}
          {isLoading && (
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-cyan-600 to-teal-500 text-white flex items-center justify-center shrink-0 animate-pulse">
                <Sparkles className="w-4 h-4" />
              </div>
              <div className="p-3.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl rounded-tl-none text-xs text-slate-500 flex items-center gap-2">
                <div className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-cyan-500 animate-bounce" />
                  <span className="w-2 h-2 rounded-full bg-cyan-500 animate-bounce [animation-delay:0.2s]" />
                  <span className="w-2 h-2 rounded-full bg-cyan-500 animate-bounce [animation-delay:0.4s]" />
                </div>
                <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                  ANATECH AI is thinking...
                </span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <div className="p-3 sm:p-4 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 shrink-0">
          <form 
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="Ask anything about selling, NIN, safe trade, prices..."
              disabled={isLoading}
              className="flex-1 px-4 py-2.5 bg-slate-100 dark:bg-slate-800 border-transparent focus:border-cyan-500 focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-cyan-500/20 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-white transition-all placeholder:text-slate-400 disabled:opacity-60"
            />
            <button
              type="submit"
              disabled={!inputMessage.trim() || isLoading}
              className="p-2.5 sm:px-4 sm:py-2.5 bg-gradient-to-r from-cyan-600 via-cyan-500 to-teal-500 hover:from-cyan-500 hover:to-teal-400 disabled:opacity-40 text-white rounded-xl font-bold text-xs sm:text-sm transition-all shadow-md shadow-cyan-500/20 active:scale-95 flex items-center gap-1.5 cursor-pointer"
              aria-label="Send query"
            >
              <Send className="w-4 h-4" />
              <span className="hidden sm:inline">Ask AI</span>
            </button>
          </form>
          <p className="text-[10px] text-slate-400 dark:text-slate-500 text-center mt-2">
            ANATECH AI gives official Uganda marketplace guidance and safe trade advice.
          </p>
        </div>
      </div>
    </div>
  );
};
