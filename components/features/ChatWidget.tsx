"use client";
import { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { MessageCircle, X, Send, Star, Bot, User, Loader2 } from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

type HotelCard = {
  id: string; slug: string; name: string; city: string;
  starRating: number; images: string[]; minPrice: number;
  avgReview: number | null; amenities: string[];
};

type Message = {
  role: "user" | "assistant";
  content: string;
  hotels?: HotelCard[];
  id: string;
};

// ─── Hotel mini-card ──────────────────────────────────────────────────────────

function HotelMiniCard({ hotel }: { hotel: HotelCard }) {
  const img = hotel.images[0];
  return (
    <Link
      href={`/hotels/${hotel.slug}`}
      className="flex-shrink-0 w-44 rounded-xl border border-slate-100 bg-white overflow-hidden hover:border-amber-300 hover:shadow-md transition-all"
    >
      {img ? (
        <Image src={img} alt={hotel.name} width={176} height={96} className="w-full h-24 object-cover" />
      ) : (
        <div className="w-full h-24 bg-slate-100 flex items-center justify-center">
          <Star className="w-5 h-5 text-slate-300" />
        </div>
      )}
      <div className="p-2">
        <p className="text-xs font-semibold text-slate-800 leading-tight truncate">{hotel.name}</p>
        <p className="text-xs text-slate-400 truncate">{hotel.city}</p>
        <p className="text-xs text-amber-600 font-medium mt-0.5">
          NPR {hotel.minPrice.toLocaleString()}/night
        </p>
      </div>
    </Link>
  );
}

// ─── Typing indicator ─────────────────────────────────────────────────────────

function TypingDots() {
  return (
    <div className="flex items-center gap-1 px-3 py-2.5 bg-slate-100 rounded-2xl rounded-bl-sm w-fit">
      {[0, 1, 2].map(i => (
        <span
          key={i}
          className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"
          style={{ animationDelay: `${i * 0.15}s`, animationDuration: "0.8s" }}
        />
      ))}
    </div>
  );
}

// ─── Single message bubble ────────────────────────────────────────────────────

function MessageBubble({ msg }: { msg: Message }) {
  const isUser = msg.role === "user";
  return (
    <div className={`flex gap-2 ${isUser ? "flex-row-reverse" : "flex-row"}`}>
      {/* Avatar */}
      <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-1 ${
        isUser ? "bg-amber-500" : "bg-slate-200"
      }`}>
        {isUser
          ? <User className="w-3.5 h-3.5 text-white" />
          : <Bot className="w-3.5 h-3.5 text-slate-600" />
        }
      </div>

      <div className={`flex flex-col gap-2 max-w-[80%] ${isUser ? "items-end" : "items-start"}`}>
        {/* Text bubble */}
        <div className={`px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed ${
          isUser
            ? "bg-amber-500 text-white rounded-br-sm"
            : "bg-slate-100 text-slate-800 rounded-bl-sm"
        }`}>
          {msg.content}
        </div>

        {/* Hotel cards */}
        {msg.hotels && msg.hotels.length > 0 && (
          <div className="flex gap-2 overflow-x-auto pb-1 max-w-full">
            {msg.hotels.map(h => (
              <HotelMiniCard key={h.id} hotel={h} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main Widget ──────────────────────────────────────────────────────────────

export default function ChatWidget() {
  const [isOpen, setIsOpen]   = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content: "Namaste! 🙏 I'm NepalStay's AI travel assistant. Ask me about hotels, travel tips, or anything about Nepal!",
    },
  ]);
  const [input, setInput]     = useState("");
  const [isTyping, setIsTyping] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isTyping, isOpen]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  const sendMessage = useCallback(async () => {
    const text = input.trim();
    if (!text || isTyping) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: "user",
      content: text,
    };

    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setIsTyping(true);

    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), 20000);
    try {
      // Build history (exclude welcome msg and hotel data for context)
      const history = messages
        .filter((m) => m.id !== "welcome")
        .map((m) => ({ role: m.role, content: m.content }));
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, history }),
        signal: controller.signal,
      });
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }

      const data = await res.json();
      const botMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content:
          data?.reply || data?.error || "I couldn't get a response. Please try again.",
        hotels: data.hasHotels ? data.hotels : undefined,
      };
      setMessages((prev) => [...prev, botMsg]);
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content:
            error instanceof DOMException && error.name === "AbortError"
              ? "The chat request timed out. Please try again."
              : "Sorry, I'm having trouble connecting. Please try again.",
        },
      ]);
    } finally {
      window.clearTimeout(timeoutId);
      setIsTyping(false);
    }
  }, [input, isTyping, messages]);

 const handleKeyDown = (e: React.KeyboardEvent) => {
   if (e.nativeEvent.isComposing) return;
   if (e.key === "Enter" && !e.shiftKey) {
     e.preventDefault();
     sendMessage();
   }
 };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
      {/* ─── Expanded panel ─── */}
      {isOpen && (
        <div
          className="flex flex-col bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden"
          style={{
            width: "min(380px, calc(100vw - 1.5rem))",
            height: "min(520px, calc(100vh - 6rem))",
          }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-amber-500">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                <Bot className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className="text-sm font-bold text-white">NepalStay AI</p>
                <p className="text-xs text-amber-100">Travel assistant</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="w-7 h-7 flex items-center justify-center rounded-full bg-white/20 hover:bg-white/30 text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 bg-slate-50">
            {messages.map((msg) => (
              <MessageBubble key={msg.id} msg={msg} />
            ))}
            {isTyping && (
              <div className="flex gap-2">
                <div className="w-7 h-7 rounded-full bg-slate-200 flex items-center justify-center flex-shrink-0 mt-1">
                  <Bot className="w-3.5 h-3.5 text-slate-600" />
                </div>
                <TypingDots />
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input area */}
          <div className="px-3 py-3 bg-white border-t border-slate-100">
            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 focus-within:border-amber-400 transition-colors">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask about hotels, travel tips…"
                disabled={isTyping}
                className="flex-1 bg-transparent text-sm text-slate-800 placeholder-slate-400 focus:outline-none disabled:opacity-50"
              />
              <button
                onClick={sendMessage}
                disabled={!input.trim() || isTyping}
                className="w-8 h-8 flex items-center justify-center rounded-lg bg-amber-500 hover:bg-amber-600 disabled:bg-amber-200 text-white transition-colors flex-shrink-0"
              >
                {isTyping ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Send className="w-3.5 h-3.5" />
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Floating toggle button ─── */}
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        aria-expanded={isOpen}
        className="w-14 h-14 bg-amber-500 hover:bg-amber-600 text-white rounded-full shadow-lg shadow-amber-300 flex items-center justify-center transition-all hover:scale-105 active:scale-95"
        aria-label={isOpen ? "Close AI chat assistant" : "Open AI chat assistant"}
      >
        {isOpen ? (
          <X className="w-6 h-6" />
        ) : (
          <MessageCircle className="w-6 h-6" />
        )}
      </button>
    </div>
  );
}
