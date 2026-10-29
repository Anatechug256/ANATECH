import React, { useState } from 'react';
import { 
  Send, ShieldCheck, MapPin, AlertCircle, Ban, 
  Flag, ChevronLeft, Check, CheckCheck, DollarSign,
  Clock, HardDrive, WifiOff, Star
} from 'lucide-react';
import { Conversation, ChatMessage, User } from '../types';
import { store } from '../services/marketplaceStore';

interface MessagesViewProps {
  currentUser: User;
  conversations: Conversation[];
  onOpenReport: (targetId: string, title: string) => void;
  onSelectListingId?: (productId: string) => void;
  onOpenLeaveReview?: (sellerId: string, listingId?: string, listingTitle?: string, transactionId?: string) => void;
  onOpenSellerProfile?: (sellerId: string) => void;
}

export const MessagesView: React.FC<MessagesViewProps> = ({
  currentUser,
  conversations,
  onOpenReport,
  onSelectListingId,
  onOpenLeaveReview,
  onOpenSellerProfile
}) => {
  const [selectedConvId, setSelectedConvId] = useState<string | null>(
    conversations.length > 0 ? conversations[0].id : null
  );
  const [inputText, setInputText] = useState('');
  const [showOfferInput, setShowOfferInput] = useState(false);
  const [offerValue, setOfferValue] = useState('');

  const activeConv = conversations.find(c => c.id === selectedConvId);
  const messages = selectedConvId ? store.getMessages(selectedConvId) : [];

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedConvId || !inputText.trim()) return;

    store.sendMessage(selectedConvId, inputText.trim());
    setInputText('');
  };

  const handleSendOffer = () => {
    if (!selectedConvId) return;
    const amt = Number(offerValue);
    if (!amt || amt <= 0) return;

    store.sendMessage(selectedConvId, `Sent formal price offer for ${store.formatPrice(amt)}`, amt);
    setOfferValue('');
    setShowOfferInput(false);
  };

  const handleOfferResponse = (messageId: string, decision: 'accepted' | 'declined') => {
    if (!selectedConvId) return;
    store.respondToOffer(messageId, selectedConvId, decision);
  };

  const handleBlockUser = () => {
    if (!selectedConvId) return;
    if (confirm('Are you sure you want to block this user from contacting you?')) {
      store.blockConversation(selectedConvId, currentUser.id);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-4 pb-20 md:pb-8">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden flex flex-col md:flex-row min-h-[75vh] max-h-[82vh]">
        
        {/* Left Side: Conversations List */}
        <div className={`w-full md:w-80 lg:w-96 border-r border-slate-200 dark:border-slate-800 flex flex-col ${
          selectedConvId ? 'hidden md:flex' : 'flex'
        }`}>
          <div className="p-4 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Messages & Inquiries
              </h2>
              <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800" title="All conversations stored in local storage and viewable offline">
                <HardDrive className="w-3 h-3" />
                <span>Offline Synced</span>
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Connected buyer & seller chat threads (saved locally)
            </p>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
            {conversations.length > 0 ? (
              conversations.map(conv => {
                const isSelected = conv.id === selectedConvId;
                const isSeller = currentUser.id === conv.sellerId;
                const otherPartyName = isSeller ? conv.buyerName : conv.sellerName;
                const otherPartyAvatar = isSeller ? conv.buyerAvatar : conv.sellerAvatar;
                const unreadCount = isSeller ? conv.unreadCountSeller : conv.unreadCountBuyer;

                return (
                  <div
                    key={conv.id}
                    onClick={() => setSelectedConvId(conv.id)}
                    className={`p-3.5 flex items-start gap-3 cursor-pointer transition-colors ${
                      isSelected 
                        ? 'bg-cyan-50/50 dark:bg-cyan-950/20 border-l-2 border-cyan-500' 
                        : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
                    }`}
                  >
                    <img
                      src={otherPartyAvatar}
                      alt={otherPartyName}
                      className="w-11 h-11 rounded-full object-cover shrink-0 border border-slate-200 dark:border-slate-700"
                    />

                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline justify-between gap-1">
                        <span className="text-xs font-bold text-slate-900 dark:text-white truncate">
                          {otherPartyName}
                        </span>
                        <span className="text-[10px] text-slate-400 shrink-0 flex items-center gap-1">
                          <HardDrive className="w-2.5 h-2.5 text-slate-400" />
                          {new Date(conv.lastMessageTimestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>

                      <div className="text-[11px] font-medium text-cyan-600 dark:text-cyan-400 truncate">
                        {conv.productTitle}
                      </div>

                      <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
                        {conv.lastMessage}
                      </p>
                    </div>

                    {unreadCount > 0 && (
                      <span className="w-5 h-5 rounded-full bg-cyan-600 text-white text-[10px] font-bold flex items-center justify-center shrink-0">
                        {unreadCount}
                      </span>
                    )}
                  </div>
                );
              })
            ) : (
              <div className="p-8 text-center text-slate-500 text-xs">
                No active conversations yet. Reach out to sellers on product pages to begin inquiries.
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Active Chat View */}
        {activeConv ? (
          <div className={`flex-1 flex flex-col ${selectedConvId ? 'flex' : 'hidden md:flex'}`}>
            {/* Chat Top Header */}
            <div className="p-3 sm:p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-white dark:bg-slate-900 z-10">
              <div className="flex items-center gap-3 min-w-0">
                <button
                  onClick={() => setSelectedConvId(null)}
                  className="md:hidden p-1 -ml-1 text-slate-500 hover:text-slate-900"
                  aria-label="Back to conversations"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const targetId = currentUser.id === activeConv.sellerId ? activeConv.buyerId : activeConv.sellerId;
                    onOpenSellerProfile?.(targetId);
                  }}
                  className="rounded-full hover:ring-2 hover:ring-cyan-500/40 transition-all text-left"
                  title="View Profile"
                >
                  <img
                    src={currentUser.id === activeConv.sellerId ? activeConv.buyerAvatar : activeConv.sellerAvatar}
                    alt=""
                    className="w-10 h-10 rounded-full object-cover shrink-0"
                  />
                </button>

                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        const targetId = currentUser.id === activeConv.sellerId ? activeConv.buyerId : activeConv.sellerId;
                        onOpenSellerProfile?.(targetId);
                      }}
                      className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate hover:text-cyan-600 transition-colors text-left"
                    >
                      {currentUser.id === activeConv.sellerId ? activeConv.buyerName : activeConv.sellerName}
                    </button>
                    <span className="text-[10px] text-slate-400 hidden sm:inline">
                      ({currentUser.id === activeConv.sellerId ? 'Buyer' : 'Seller'})
                    </span>
                  </div>

                  {/* Linked Product Preview Pill */}
                  <button 
                    onClick={() => onSelectListingId && onSelectListingId(activeConv.productId)}
                    className="text-[11px] text-slate-500 dark:text-slate-400 truncate flex items-center gap-1 hover:text-cyan-600 transition-colors"
                  >
                    <span>Item: <strong>{activeConv.productTitle}</strong> ({store.formatPrice(activeConv.productPrice)})</span>
                  </button>
                </div>
              </div>

              {/* Chat Actions */}
              <div className="flex items-center gap-2">
                {currentUser.id === activeConv.buyerId && (
                  <button
                    onClick={() => onOpenLeaveReview?.(activeConv.sellerId, activeConv.productId, activeConv.productTitle)}
                    className="px-2.5 py-1 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300 hover:bg-amber-100 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors"
                    title="Leave seller review after transaction"
                  >
                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                    <span className="hidden sm:inline">Rate Seller</span>
                  </button>
                )}
                <button
                  onClick={() => onOpenReport(activeConv.id, `Chat regarding ${activeConv.productTitle}`)}
                  className="p-1.5 text-slate-400 hover:text-rose-500 transition-colors"
                  title="Report user or spam"
                >
                  <Flag className="w-4 h-4" />
                </button>
                <button
                  onClick={handleBlockUser}
                  className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors"
                  title="Block conversation"
                >
                  <Ban className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Anti-fraud advisory in chat header */}
            <div className="bg-amber-50/70 dark:bg-amber-950/20 border-b border-amber-200/50 px-4 py-1.5 text-[11px] text-amber-800 dark:text-amber-300 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-amber-600 shrink-0" />
              <span>Safety Tip: Inspect product before sending Mobile Money. Never pay fees in advance.</span>
            </div>

            {/* Post-Transaction Feedback Banner (when an offer is accepted and user is buyer) */}
            {currentUser.id === activeConv.buyerId && messages.some(m => m.offerStatus === 'accepted') && (
              <div className="bg-emerald-50 dark:bg-emerald-950/40 border-b border-emerald-200/60 dark:border-emerald-800/60 px-4 py-2 text-xs text-emerald-900 dark:text-emerald-200 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 min-w-0">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span className="truncate">Deal agreed! Completed this transaction? Rate & review {activeConv.sellerName}.</span>
                </div>
                <button
                  onClick={() => onOpenLeaveReview?.(activeConv.sellerId, activeConv.productId, activeConv.productTitle)}
                  className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold shrink-0 transition-colors flex items-center gap-1 shadow-2xs"
                >
                  <Star className="w-3 h-3 fill-white" />
                  <span>Leave Review</span>
                </button>
              </div>
            )}

            {/* Message Stream */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50/40 dark:bg-slate-950/40">
              {messages.map(msg => {
                const isMe = msg.senderId === currentUser.id;

                if (msg.isSystemMessage) {
                  return (
                    <div key={msg.id} className="flex justify-center my-2">
                      <span className="text-[11px] bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-3 py-1 rounded-full">
                        {msg.text}
                      </span>
                    </div>
                  );
                }

                return (
                  <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                    <div className={`max-w-[85%] sm:max-w-md rounded-2xl px-3.5 py-2.5 shadow-xs ${
                      isMe 
                        ? 'bg-slate-900 text-white dark:bg-cyan-600 dark:text-white rounded-br-none' 
                        : 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-200/80 dark:border-slate-700/80 rounded-bl-none'
                    }`}>
                      <p className="text-xs sm:text-sm leading-relaxed">{msg.text}</p>

                      {/* Offer card within chat */}
                      {typeof msg.offerAmount === 'number' && (
                        <div className="mt-2 pt-2 border-t border-white/20 dark:border-slate-700 space-y-1.5">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-semibold">Offer: {store.formatPrice(msg.offerAmount)}</span>
                            <span className="text-[10px] uppercase font-bold tracking-wider">
                              {msg.offerStatus}
                            </span>
                          </div>

                          {/* Seller decision buttons if offer is pending */}
                          {!isMe && currentUser.id === activeConv.sellerId && msg.offerStatus === 'pending' && (
                            <div className="flex gap-2 pt-1">
                              <button
                                onClick={() => handleOfferResponse(msg.id, 'accepted')}
                                className="flex-1 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs font-bold"
                              >
                                Accept Offer
                              </button>
                              <button
                                onClick={() => handleOfferResponse(msg.id, 'declined')}
                                className="flex-1 py-1 bg-rose-600 hover:bg-rose-500 text-white rounded text-xs font-bold"
                              >
                                Decline
                              </button>
                            </div>
                          )}

                          {/* Buyer review button if offer is accepted */}
                          {msg.offerStatus === 'accepted' && currentUser.id === activeConv.buyerId && (
                            <div className="pt-2 border-t border-emerald-500/20 flex items-center justify-between gap-2">
                              <span className="text-[11px] font-semibold text-emerald-400">Offer Accepted</span>
                              <button
                                onClick={() => onOpenLeaveReview?.(activeConv.sellerId, activeConv.productId, activeConv.productTitle, `offer_${msg.id}`)}
                                className="px-2.5 py-1 bg-amber-500 hover:bg-amber-400 text-white rounded text-[11px] font-bold flex items-center gap-1 shadow-2xs"
                              >
                                <Star className="w-3 h-3 fill-white" />
                                <span>Leave Feedback</span>
                              </button>
                            </div>
                          )}
                        </div>
                      )}

                      <div className="flex items-center justify-end gap-1 mt-1 text-[10px] opacity-75">
                        <span>{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        {isMe && (
                          msg.isPendingSync ? (
                            <span className="flex items-center gap-1 text-amber-300 font-semibold text-[9px]" title="Saved in offline local storage. Will sync when reconnected.">
                              <Clock className="w-3 h-3 animate-pulse" />
                              <span>Queued offline</span>
                            </span>
                          ) : (
                            <CheckCheck className="w-3 h-3 text-cyan-400" />
                          )
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Chat Input Bar */}
            <div className="p-3 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-2">
              {showOfferInput && (
                <div className="p-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Offer UGX:</span>
                  <input
                    type="number"
                    placeholder="e.g. 2300000"
                    value={offerValue}
                    onChange={(e) => setOfferValue(e.target.value)}
                    className="flex-1 px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs"
                  />
                  <button
                    onClick={handleSendOffer}
                    className="px-3 py-1.5 bg-cyan-600 text-white rounded-lg text-xs font-bold"
                  >
                    Submit Offer
                  </button>
                  <button
                    onClick={() => setShowOfferInput(false)}
                    className="text-xs text-slate-400 hover:text-slate-600 px-1"
                  >
                    Cancel
                  </button>
                </div>
              )}

              <form onSubmit={handleSend} className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowOfferInput(!showOfferInput)}
                  className="px-2.5 py-2 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 shrink-0"
                >
                  Make Offer
                </button>

                <input
                  type="text"
                  placeholder="Type your message..."
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  className="flex-1 px-3.5 py-2 bg-slate-100 dark:bg-slate-800 border-none rounded-xl text-sm focus:ring-2 focus:ring-cyan-500/20"
                />

                <button
                  type="submit"
                  disabled={!inputText.trim()}
                  className="p-2.5 bg-slate-900 dark:bg-cyan-600 disabled:opacity-40 text-white rounded-xl hover:opacity-90 transition-opacity shrink-0"
                  aria-label="Send message"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </div>
          </div>
        ) : (
          <div className="flex-1 hidden md:flex items-center justify-center p-8 text-center text-slate-400 text-xs">
            Select a conversation to view chat and offers.
          </div>
        )}
      </div>
    </div>
  );
};
