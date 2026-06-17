"use client";

import { useState, useEffect, useRef } from "react";
import { aiAPI } from "@/lib/api";
import { BotMessageSquare, Sparkles, Send, Loader2, Trash2, Plus, MessageSquare, ChevronLeft } from "lucide-react";

const suggestions = [
  "วันนี้ฉันควรกินอะไร?",
  "อาหารลดน้ำหนัก",
  "คำนวณ BMI ของฉัน",
  "โปรตีนสูงมีอะไรบ้าง?",
  "แนะนำเมนูอาหารเช้า",
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
    "สวัสดีค่ะ! 👋 ฉันคือ TUYEN AI ผู้ช่วยด้านโภชนาการส่วนตัวของคุณ \n\nฉันสามารถช่วยคุณได้ในเรื่อง:\n• 🍽️ แนะนำเมนูอาหารที่เหมาะกับเป้าหมายของคุณ\n• 📊 วิเคราะห์คุณค่าทางโภชนาการ\n• 💪 วางแผนมื้ออาหารรายวัน\n\nลองถามฉันได้เลยนะคะ!",
  time: new Date().toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" }),
});

const newSession = (): ChatSession => ({
  id: Date.now().toString(),
  title: "แชทใหม่",
  messages: [makeWelcome()],
  createdAt: new Date().toLocaleDateString("th-TH", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }),
});

export default function ChatView() {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeId, setActiveId] = useState<string>("");
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showSidebar, setShowSidebar] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);

  // ── โหลด sessions จาก localStorage ──
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    const savedActiveId = localStorage.getItem(ACTIVE_KEY);
    if (saved) {
      try {
        const parsed: ChatSession[] = JSON.parse(saved);
        if (parsed.length > 0) {
          setSessions(parsed);
          setActiveId(savedActiveId || parsed[0].id);
          return;
        }
      } catch { /* ใช้ default */ }
    }
    const first = newSession();
    setSessions([first]);
    setActiveId(first.id);
  }, []);

  // ── บันทึก sessions ──
  useEffect(() => {
    if (sessions.length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
    }
  }, [sessions]);

  useEffect(() => {
    if (activeId) localStorage.setItem(ACTIVE_KEY, activeId);
  }, [activeId]);

  // ── scroll ลงล่าง ──
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
      id: Date.now(),
      role: "user",
      content: userText,
      time: new Date().toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" }),
    };

    // อัปเดต title จากข้อความแรกของ user
    const isFirstUserMsg = activeSession.messages.filter((m) => m.role === "user").length === 0;
    const newTitle = isFirstUserMsg ? userText.slice(0, 30) : activeSession.title;

    const history = activeSession.messages.map((m) => ({ role: m.role, content: m.content }));

    updateSession(activeId, (s) => ({
      ...s,
      title: newTitle,
      messages: [...s.messages, userMsg],
    }));
    setInputValue("");
    setIsLoading(true);

    try {
      const data = await aiAPI.chat(userText, history);
      const aiMsg: Message = {
        id: Date.now() + 1,
        role: "ai",
        content: data.reply,
        time: new Date().toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" }),
      };
      updateSession(activeId, (s) => ({ ...s, messages: [...s.messages, aiMsg] }));
    } catch (error: unknown) {
      const errMsg: Message = {
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

  return (
    <div className="flex h-[calc(100vh-120px)] rounded-2xl border-2 border-white bg-surface shadow-soft-blue animate-fade-in overflow-hidden">

      {/* ─── Sidebar ─── */}
      {showSidebar && (
        <div className="flex w-56 shrink-0 flex-col border-r border-outline bg-surface-alt">
          {/* New Chat */}
          <div className="p-3">
            <button
              onClick={handleNewChat}
              className="flex w-full items-center gap-2 rounded-xl border-2 border-white bg-primary px-3 py-2.5 text-sm font-heading font-semibold text-white shadow-soft-blue hover:bg-primary-dark transition-all"
            >
              <Plus className="h-4 w-4" />
              แชทใหม่
            </button>
          </div>

          {/* Session List */}
          <div className="flex-1 overflow-y-auto px-2 pb-3">
            <p className="mb-1 px-2 text-[10px] font-body font-semibold uppercase tracking-wider text-foreground-muted">
              ประวัติ
            </p>
            {sessions.map((s) => (
              <div
                key={s.id}
                onClick={() => setActiveId(s.id)}
                className={`group flex cursor-pointer items-center gap-2 rounded-xl px-2 py-2 transition-all ${s.id === activeId
                    ? "bg-primary-pale border-2 border-white shadow-soft-blue"
                    : "hover:bg-background"
                  }`}
              >
                <MessageSquare className="h-3.5 w-3.5 shrink-0 text-foreground-muted" />
                <div className="flex-1 min-w-0">
                  <p className="truncate text-xs font-body font-medium text-foreground">
                    {s.title}
                  </p>
                  <p className="text-[10px] font-body text-foreground-muted">{s.createdAt}</p>
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); handleDeleteSession(s.id); }}
                  className="hidden group-hover:flex h-5 w-5 items-center justify-center rounded-lg hover:bg-accent-red hover:text-danger transition-all"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ─── Chat Area ─── */}
      <div className="flex flex-1 flex-col min-w-0">

        {/* Header */}
        <div className="flex items-center gap-3 border-b border-outline px-4 py-3">
          <button
            onClick={() => setShowSidebar((v) => !v)}
            className="flex h-8 w-8 items-center justify-center rounded-xl hover:bg-surface-alt transition-all"
          >
            <ChevronLeft className={`h-4 w-4 text-foreground-muted transition-transform ${showSidebar ? "" : "rotate-180"}`} />
          </button>
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-secondary text-white shadow-soft-blue">
            <BotMessageSquare className="h-4 w-4" />
          </div>
          <div>
            <h2 className="text-sm font-heading font-semibold text-foreground">TUYEN AI</h2>
            <p className="text-xs font-body text-success">● ออนไลน์</p>
          </div>
        </div>

        {/* Suggestions */}
        <div className="flex gap-2 overflow-x-auto border-b border-outline px-4 py-2">
          {suggestions.map((s) => (
            <button
              key={s}
              onClick={() => setInputValue(s)}
              className="shrink-0 flex items-center gap-1.5 rounded-full border-2 border-white bg-primary-pale px-3 py-1 text-xs font-body font-medium text-primary-dark shadow-soft-blue hover:bg-primary hover:text-white group transition-all"
            >
              <Sparkles className="h-3 w-3 group-hover:animate-pulse" />
              {s}
            </button>
          ))}
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto bg-background px-4 py-4">
          <div className="flex flex-col gap-4">
            {activeSession?.messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div className={`max-w-[80%] rounded-2xl px-4 py-3 ${msg.role === "user"
                    ? "bg-primary text-white rounded-br-md border-2 border-white shadow-soft-blue"
                    : "bg-background-agent text-foreground rounded-bl-md border-2 border-white shadow-soft-blue"
                  }`}>
                  <p className="whitespace-pre-line text-sm font-body leading-relaxed">{msg.content}</p>
                  <p className={`mt-1.5 text-right text-[10px] font-body ${msg.role === "user" ? "text-white/60" : "text-foreground-muted"
                    }`}>
                    {msg.time}
                  </p>
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex justify-start">
                <div className="rounded-2xl rounded-bl-md border-2 border-white bg-background-agent px-4 py-3 shadow-soft-blue">
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

        {/* Input */}
        <div className="border-t border-outline px-4 py-3">
          <div className="flex items-center gap-2">
            <input
              type="text"
              placeholder="พิมพ์ข้อความ..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              className="flex-1 rounded-full border-2 border-white bg-background px-4 py-2.5 text-sm font-body text-foreground placeholder-foreground-muted shadow-soft-blue focus:border-primary-light focus:outline-none focus:ring-2 focus:ring-primary-pale transition-all"
            />
            <button
              onClick={handleSend}
              disabled={!inputValue.trim() || isLoading}
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-white shadow-soft-blue transition-all ${!inputValue.trim() || isLoading
                  ? "bg-outline text-foreground-muted"
                  : "bg-primary hover:bg-primary-dark"
                }`}
            >
              {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5 ml-0.5" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}