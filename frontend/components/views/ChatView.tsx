"use client";

import { useState } from "react";
import { aiAPI } from "@/lib/api";
import { BotMessageSquare, Sparkles, Send, Loader2 } from "lucide-react";

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

const initialMessages: Message[] = [
  {
    id: 1,
    role: "ai",
    content:
      "สวัสดีค่ะ! 👋 ฉันคือ TUYEN AI ผู้ช่วยด้านโภชนาการส่วนตัวของคุณ \n\nฉันสามารถช่วยคุณได้ในเรื่อง:\n• 🍽️ แนะนำเมนูอาหารที่เหมาะกับเป้าหมายของคุณ\n• 📊 วิเคราะห์คุณค่าทางโภชนาการ\n• 💪 วางแผนมื้ออาหารรายวัน\n\nลองถามฉันได้เลยนะคะ!",
    time: "10:00",
  },
];

export default function ChatView() {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [inputValue, setInputValue] = useState("");

  const [isLoading, setIsLoading] = useState(false);

  const handleSend = async () => {
    if (!inputValue.trim() || isLoading) return;
    
    const userText = inputValue.trim();
    const newMsg: Message = {
      id: messages.length + 1,
      role: "user",
      content: userText,
      time: new Date().toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" }),
    };
    
    // Extract history format for the backend
    const history = messages.map(m => ({ role: m.role, content: m.content }));
    
    setMessages(prev => [...prev, newMsg]);
    setInputValue("");
    setIsLoading(true);
    
    try {
      const data = await aiAPI.chat(userText, history);
      const aiReply: Message = {
        id: messages.length + 2, // This might not be 100% accurate if multiple requests, but ok for now
        role: "ai",
        content: data.reply,
        time: new Date().toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" }),
      };
      setMessages(prev => [...prev, aiReply]);
    } catch (error: unknown) {
      const errorMsg: Message = {
        id: Date.now(),
        role: "ai",
        content: `ขออภัยค่ะ เกิดข้อผิดพลาด: ${(error as Error).message || "ไม่สามารถเชื่อมต่อระบบ AI ได้"}`,
        time: new Date().toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" }),
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setInputValue(suggestion);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex h-[calc(100vh-120px)] flex-col rounded-2xl border-2 border-white bg-surface shadow-soft-blue animate-fade-in">
      {/* ─── Chat Header ─── */}
      <div className="flex items-center gap-3 border-b border-outline px-5 py-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-secondary text-white shadow-soft-blue">
          <BotMessageSquare className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-sm font-heading font-semibold text-foreground">TUYEN AI</h2>
          <p className="text-xs font-body text-success">● ออนไลน์</p>
        </div>
      </div>

      {/* ─── Suggestion Chips (Pill-shaped — rounded-full) ─── */}
      <div className="flex gap-2 overflow-x-auto border-b border-outline px-5 py-3">
        {suggestions.map((s) => (
          <button
            key={s}
            onClick={() => handleSuggestionClick(s)}
            className="shrink-0 flex items-center gap-1.5 rounded-full border-2 border-white bg-primary-pale px-3.5 py-1.5 text-xs font-body font-medium text-primary-dark shadow-soft-blue transition-airy hover:bg-primary hover:text-white group"
          >
            <Sparkles className="h-3 w-3 group-hover:animate-pulse" />
            {s}
          </button>
        ))}
      </div>

      {/* ─── Messages Area (Split-View: user bg-background, AI bg-background-agent) ─── */}
      <div className="flex-1 overflow-y-auto bg-background px-5 py-4">
        <div className="flex flex-col gap-4">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex animate-slide-up ${
                msg.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                  msg.role === "user"
                    ? "bg-primary text-white rounded-br-md border-2 border-white shadow-soft-blue"
                    : "bg-background-agent text-foreground rounded-bl-md border-2 border-white shadow-soft-blue"
                }`}
              >
                <p className="whitespace-pre-line text-sm font-body leading-relaxed">{msg.content}</p>
                <p
                  className={`mt-1.5 text-right text-[10px] font-body ${
                    msg.role === "user" ? "text-white/60" : "text-foreground-muted"
                  }`}
                >
                  {msg.time}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ─── Input Area ─── */}
      <div className="border-t border-outline px-4 py-3">
        <div className="flex items-center gap-2">
          <button className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl text-foreground-muted transition-airy hover:bg-surface-alt hover:text-primary-dark">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z" />
            </svg>
          </button>
          {/* Chat Input (Pill-shaped — rounded-full) */}
          <input
            type="text"
            placeholder="พิมพ์ข้อความ..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-1 rounded-full border-2 border-white bg-background px-4 py-2.5 text-sm font-body text-foreground placeholder-foreground-muted shadow-soft-blue transition-airy focus:border-primary-light focus:outline-none focus:ring-2 focus:ring-primary-pale"
          />
          {/* Send Button (FAB — rounded-full) */}
          <button
            onClick={handleSend}
            disabled={!inputValue.trim() || isLoading}
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-white shadow-soft-blue transition-airy ${
              !inputValue.trim() || isLoading
                ? "bg-outline text-foreground-muted"
                : "bg-primary hover:bg-primary-dark"
            }`}
          >
            {isLoading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Send className="h-5 w-5 ml-0.5" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
