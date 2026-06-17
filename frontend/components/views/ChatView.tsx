"use client";

import { useState, useEffect, useRef } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { aiAPI } from "@/lib/api";
import {
  BotMessageSquare,
  Sparkles,
  Send,
  Loader2,
  Trash2,
  Plus,
  MessageSquare,
  Menu,
  X,
} from "lucide-react";

// ─── Quick suggestion chips ───
const suggestions = [
  "วันนี้ฉันควรกินอะไร?",
  "อาหารลดน้ำหนัก",
  "คำนวณ BMI ของฉัน",
  "โปรตีนสูงมีอะไรบ้าง?",
  "แนะนำเมนูอาหารเช้า",
  "แคลอรี่ของข้าวผัด",
];

interface Message {
  id: number;
  role: "ai" | "user";
  content: string;
  time: string;
}

interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  createdAt: string;
}

const STORAGE_KEY = "tuyen_chat_sessions";
const ACTIVE_KEY = "tuyen_active_session";

const makeWelcome = (): Message => ({
  id: Date.now(),
  role: "ai",
  content:
    "สวัสดีค่ะ! 👋 ฉันคือ **TUYEN AI** ผู้ช่วยด้านโภชนาการส่วนตัวของคุณ\n\nฉันสามารถช่วยคุณได้ในเรื่อง:\n• 🍽️ แนะนำเมนูอาหารที่เหมาะกับเป้าหมายของคุณ\n• 📊 วิเคราะห์คุณค่าทางโภชนาการ\n• 💪 วางแผนมื้ออาหารรายวัน\n\nลองถามฉันได้เลยนะคะ!",
  time: new Date().toLocaleTimeString("th-TH", {
    hour: "2-digit",
    minute: "2-digit",
  }),
});

const newSession = (): ChatSession => ({
  id: Date.now().toString(),
  title: "แชทใหม่",
  messages: [makeWelcome()],
  createdAt: new Date().toLocaleDateString("th-TH", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }),
});

export default function ChatView() {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeId, setActiveId] = useState<string>("");
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  // ── Load sessions from localStorage ──
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    const savedActiveId = localStorage.getItem(ACTIVE_KEY);
    let parsed: ChatSession[] = [];
    
    if (saved) {
      try {
        const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
        parsed = JSON.parse(saved);
        // Filter: Keep < 30 days AND (has messages OR is currently active)
        parsed = parsed.filter(s => {
          const isRecent = parseInt(s.id) > thirtyDaysAgo;
          const hasMessages = s.messages.length > 1;
          const isActiveNow = s.id === savedActiveId;
          return isRecent && (hasMessages || isActiveNow);
        });
      } catch { /* use default */ }
    }

    const isNewLoginSession = !sessionStorage.getItem("chat_session_initialized");

    if (isNewLoginSession) {
      // Force new chat on new login
      const first = newSession();
      // Clean up any empty sessions
      const cleanedParsed = parsed.filter(s => s.messages.length > 1);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSessions([first, ...cleanedParsed]);
      setActiveId(first.id);
      sessionStorage.setItem("chat_session_initialized", "true");
    } else {
      if (parsed.length > 0) {
        setSessions(parsed);
        const toActivate = parsed.find(s => s.id === savedActiveId) ? savedActiveId! : parsed[0].id;
        setActiveId(toActivate);
      } else {
        const first = newSession();
        setSessions([first]);
        setActiveId(first.id);
      }
    }
  }, []);

  useEffect(() => {
    if (sessions.length > 0) localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
  }, [sessions]);

  useEffect(() => {
    if (activeId) localStorage.setItem(ACTIVE_KEY, activeId);
  }, [activeId]);

  // ── Auto-scroll to bottom ──
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [sessions, activeId]);

  const activeSession = sessions.find((s) => s.id === activeId);

  const updateSession = (id: string, updater: (s: ChatSession) => ChatSession) => {
    setSessions((prev) => prev.map((s) => (s.id === id ? updater(s) : s)));
  };

  const handleNewChat = () => {
    const session = newSession();
    setSessions((prev) => [session, ...prev]);
    setActiveId(session.id);
    setMobileDrawerOpen(false);
  };

  const handleDeleteSession = (id: string) => {
    setSessions((prev) => {
      const next = prev.filter((s) => s.id !== id);
      if (next.length === 0) {
        const fresh = newSession();
        setActiveId(fresh.id);
        return [fresh];
      }
      if (id === activeId) setActiveId(next[0].id);
      return next;
    });
  };

  const handleSend = async () => {
    if (!inputValue.trim() || isLoading || !activeSession) return;

    const userText = inputValue.trim();
    const userMsg: Message = {
      // eslint-disable-next-line react-hooks/purity
      id: Date.now(),
      role: "user",
      content: userText,
      time: new Date().toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" }),
    };

    const isFirstUserMsg = activeSession.messages.filter((m) => m.role === "user").length === 0;
    const newTitle = isFirstUserMsg ? userText.slice(0, 30) : activeSession.title;
    const history = activeSession.messages.map((m) => ({ role: m.role, content: m.content }));

    updateSession(activeId, (s) => ({ ...s, title: newTitle, messages: [...s.messages, userMsg] }));
    setInputValue("");
    setIsLoading(true);

    try {
      const data = await aiAPI.chat(userText, history);
      const aiMsg: Message = {
        // eslint-disable-next-line react-hooks/purity
        id: Date.now() + 1,
        role: "ai",
        content: data.reply,
        time: new Date().toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" }),
      };
      updateSession(activeId, (s) => ({ ...s, messages: [...s.messages, aiMsg] }));
    } catch (error: unknown) {
      const errMsg: Message = {
        // eslint-disable-next-line react-hooks/purity
        id: Date.now() + 1,
        role: "ai",
        content: `ขออภัยค่ะ เกิดข้อผิดพลาด: ${(error as Error).message || "ไม่สามารถเชื่อมต่อระบบ AI ได้"}`,
        time: new Date().toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" }),
      };
      updateSession(activeId, (s) => ({ ...s, messages: [...s.messages, errMsg] }));
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // ─── Sidebar panel — shared between drawer & desktop ───
  const renderSidebarContent = () => (
    <div className="flex h-full flex-col">
      {/* New Chat */}
      <div className="p-3">
        <button
          onClick={handleNewChat}
          className="flex w-full items-center gap-2 rounded-xl bg-primary px-3 py-2.5 text-sm font-heading font-semibold text-white hover:bg-primary-dark transition-all active:scale-95"
        >
          <Plus className="h-4 w-4 shrink-0" />
          แชทใหม่
        </button>
      </div>

      {/* Session List */}
      <div className="flex-1 overflow-y-auto px-2 pb-3 scrollbar-none">
        <p className="mb-1 px-2 text-[10px] font-body font-semibold uppercase tracking-wider text-foreground-muted">
          ประวัติ
        </p>
        {sessions.map((s) => (
          <div
            key={s.id}
            onClick={() => { setActiveId(s.id); setMobileDrawerOpen(false); }}
            className={`group flex cursor-pointer items-center gap-2 rounded-xl px-2 py-2 transition-all ${
              s.id === activeId ? "bg-primary/10 border border-primary/20" : "hover:bg-background"
            }`}
          >
            <MessageSquare className="h-3.5 w-3.5 shrink-0 text-foreground-muted" />
            <div className="flex-1 min-w-0">
              <p className="truncate text-xs font-body font-medium text-foreground">{s.title}</p>
              <p className="text-[10px] font-body text-foreground-muted">{s.createdAt}</p>
            </div>
            <button
              onClick={(e) => { e.stopPropagation(); handleDeleteSession(s.id); }}
              className="hidden group-hover:flex h-5 w-5 items-center justify-center rounded-lg hover:bg-red-100 hover:text-danger transition-all"
            >
              <Trash2 className="h-3 w-3" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    // Fix #4: height accounts for global header (56px) + py-6 (24px) + mobile bottom nav (64px)
    // Height: mobile gets full space (no outer padding now), desktop keeps its padding
    <div className="relative flex h-[calc(100vh-120px)] md:h-[calc(100vh-104px)] rounded-none md:rounded-2xl border-0 md:border md:border-[#E5E7EB] bg-[#F8F9FB] shadow-none md:shadow-card animate-fade-in overflow-hidden">

      {/* ─── Mobile Drawer Backdrop ─── */}
      {mobileDrawerOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm md:hidden"
          onClick={() => setMobileDrawerOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* ─── Mobile Drawer (slide from left) ─── */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-2xl transform transition-transform duration-300 ease-in-out md:hidden ${
          mobileDrawerOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between border-b border-[#E5E7EB] px-3 py-3">
          <span className="text-sm font-heading font-semibold text-foreground">ประวัติการสนทนา</span>
          <button
            onClick={() => setMobileDrawerOpen(false)}
            className="flex h-7 w-7 items-center justify-center rounded-lg hover:bg-surface-alt transition-all"
          >
            <X className="h-4 w-4 text-foreground-muted" />
          </button>
        </div>
        {renderSidebarContent()}
      </div>

      {/* ─── Desktop Sidebar (md+) ─── */}
      <div className="hidden md:flex w-52 shrink-0 flex-col border-r border-[#E5E7EB] bg-white">
        {renderSidebarContent()}
      </div>

      {/* ─── Chat Area ─── */}
      <div className="flex flex-1 flex-col min-w-0">

        {/* Fix #2: Compact single-row header — avatar + name + status inline */}
        <div className="flex items-center gap-2.5 border-b border-[#E5E7EB] bg-white px-3 py-2.5 shrink-0">
          {/* Hamburger — mobile only */}
          <button
            onClick={() => setMobileDrawerOpen(true)}
            className="flex h-7 w-7 items-center justify-center rounded-lg hover:bg-surface-alt transition-all md:hidden"
            aria-label="เปิดประวัติการสนทนา"
          >
            <Menu className="h-4 w-4 text-foreground-muted" />
          </button>

          {/* AI Avatar */}
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-secondary text-white shadow-sm">
            <BotMessageSquare className="h-4 w-4" />
          </div>

          {/* Name + inline online badge — one row */}
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <h2 className="text-sm font-heading font-semibold text-foreground leading-none">TUYEN AI</h2>
            <span className="inline-flex items-center gap-1 text-[11px] font-body text-success leading-none">
              <span className="h-1.5 w-1.5 rounded-full bg-success inline-block" />
              ออนไลน์
            </span>
          </div>
        </div>

        {/* Fix #1: Horizontal-scroll suggestion chips — compact, no border-b waste */}
        <div className="flex items-center gap-1.5 overflow-x-auto px-3 py-2 shrink-0 scrollbar-none border-b border-[#E5E7EB]/60 bg-white/60">
          <Sparkles className="h-3 w-3 text-primary shrink-0" />
          {suggestions.map((s) => (
            <button
              key={s}
              onClick={() => setInputValue(s)}
              className="shrink-0 rounded-full border border-primary/20 bg-primary-pale px-2.5 py-1 text-[11px] font-body font-medium text-primary-dark hover:bg-primary hover:text-white hover:border-primary transition-all whitespace-nowrap"
            >
              {s}
            </button>
          ))}
        </div>

        {/* Messages — scrollable, fills remaining space */}
        {/* Fix #6: bg-[#F8F9FB], bubbles #FFFFFF with border #E5E7EB for contrast */}
        <div className="flex-1 overflow-y-auto px-3 py-3 min-h-0 scrollbar-none">
          <div className="flex flex-col gap-3">
            {activeSession?.messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                {/* Fix #3: max-w-[90%] so bubbles use more horizontal space */}
                <div
                  className={`max-w-[90%] min-w-0 rounded-2xl px-4 py-3 ${
                    msg.role === "user"
                      // User bubble: primary colour, strong contrast
                      ? "bg-primary text-white rounded-br-sm shadow-sm"
                      // AI bubble: Fix #6 — pure white with visible border
                      : "bg-white text-foreground rounded-bl-sm border border-[#E5E7EB] shadow-sm"
                  }`}
                >
                  <div className="text-sm font-body leading-relaxed break-words">
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      components={{
                        p: ({node, ...props}) => <p className="mb-2 last:mb-0 whitespace-pre-wrap" {...props} />,
                        strong: ({node, ...props}) => <strong className="font-semibold" {...props} />,
                        ul: ({node, ...props}) => <ul className="list-disc pl-4 mb-2" {...props} />,
                        ol: ({node, ...props}) => <ol className="list-decimal pl-4 mb-2" {...props} />,
                        li: ({node, ...props}) => <li className="mb-1" {...props} />,
                        h1: ({node, ...props}) => <h1 className="text-lg font-bold mb-2" {...props} />,
                        h2: ({node, ...props}) => <h2 className="text-base font-bold mb-2" {...props} />,
                        h3: ({node, ...props}) => <h3 className="text-sm font-bold mb-2" {...props} />,
                        a: ({node, ...props}) => <a className="underline hover:opacity-80" target="_blank" rel="noopener noreferrer" {...props} />
                      }}
                    >
                      {msg.content}
                    </ReactMarkdown>
                  </div>
                  <p className={`mt-1 text-right text-[10px] font-body ${
                    msg.role === "user" ? "text-white/60" : "text-foreground-muted"
                  }`}>
                    {msg.time}
                  </p>
                </div>
              </div>
            ))}

            {/* Typing indicator */}
            {isLoading && (
              <div className="flex justify-start">
                <div className="rounded-2xl rounded-bl-sm border border-[#E5E7EB] bg-white px-4 py-3 shadow-sm">
                  <div className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-primary animate-bounce [animation-delay:0ms]" />
                    <span className="h-2 w-2 rounded-full bg-primary animate-bounce [animation-delay:150ms]" />
                    <span className="h-2 w-2 rounded-full bg-primary animate-bounce [animation-delay:300ms]" />
                  </div>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>
        </div>

        {/* Fix #4 & #5: Input bar — text field is primary CTA, send button prominent */}
        {/* pb-12 on mobile ensures it clears the floating bottom navigation bar and camera button perfectly */}
        <div className="shrink-0 border-t border-[#E5E7EB] bg-white px-3 pt-2.5 pb-12 md:pb-2.5">
          <div className="flex items-center gap-2">
            {/* Fix #5: Input is the primary CTA — full width, styled prominently */}
            <input
              type="text"
              placeholder="พิมพ์ข้อความถึง TUYEN AI..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              className="flex-1 min-w-0 rounded-full border border-[#E5E7EB] bg-[#F8F9FB] px-4 py-2.5 text-sm font-body text-foreground placeholder-foreground-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/10 transition-all"
            />
            {/* Send — primary action button, visually prominent */}
            <button
              onClick={handleSend}
              disabled={!inputValue.trim() || isLoading}
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-white transition-all ${
                !inputValue.trim() || isLoading
                  ? "bg-foreground-muted/30 text-foreground-muted cursor-not-allowed"
                  : "bg-primary hover:bg-primary-dark shadow-sm hover:shadow-md"
              }`}
            >
              {isLoading
                ? <Loader2 className="h-4 w-4 animate-spin" />
                : <Send className="h-4 w-4 ml-0.5" />
              }
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}