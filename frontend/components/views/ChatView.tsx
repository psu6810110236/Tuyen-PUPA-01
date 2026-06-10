"use client";

import { useState } from "react";

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

  const handleSend = () => {
    if (!inputValue.trim()) return;
    const newMsg: Message = {
      id: messages.length + 1,
      role: "user",
      content: inputValue,
      time: new Date().toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" }),
    };
    setMessages([...messages, newMsg]);
    setInputValue("");
    
    // Simulate AI response
    setTimeout(() => {
      const aiReply: Message = {
        id: messages.length + 2,
        role: "ai",
        content: "ขอบคุณสำหรับคำถามค่ะ! กำลังวิเคราะห์ข้อมูลให้คุณ... 🔄\n\nระบบ AI กำลังประมวลผล กรุณารอสักครู่นะคะ",
        time: new Date().toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" }),
      };
      setMessages(prev => [...prev, aiReply]);
    }, 1000);
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
    <div className="flex h-[calc(100vh-120px)] flex-col rounded-2xl bg-surface shadow-card animate-fade-in">
      {/* ─── Chat Header ─── */}
      <div className="flex items-center gap-3 border-b border-border px-5 py-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary-light text-lg">
          🤖
        </div>
        <div>
          <h2 className="text-sm font-semibold text-foreground">TUYEN AI</h2>
          <p className="text-xs text-success">● ออนไลน์</p>
        </div>
      </div>

      {/* ─── Suggestion Chips ─── */}
      <div className="flex gap-2 overflow-x-auto border-b border-border-light px-5 py-3">
        {suggestions.map((s) => (
          <button
            key={s}
            onClick={() => handleSuggestionClick(s)}
            className="shrink-0 rounded-full border border-primary-light bg-primary-pale px-3.5 py-1.5 text-xs font-medium text-primary-dark transition-airy hover:bg-primary-light hover:text-white"
          >
            {s}
          </button>
        ))}
      </div>

      {/* ─── Messages Area ─── */}
      <div className="flex-1 overflow-y-auto px-5 py-4">
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
                    ? "bg-primary text-white rounded-br-md"
                    : "bg-surface-alt text-foreground rounded-bl-md"
                }`}
              >
                <p className="whitespace-pre-line text-sm leading-relaxed">{msg.content}</p>
                <p
                  className={`mt-1.5 text-right text-[10px] ${
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
      <div className="border-t border-border px-4 py-3">
        <div className="flex items-center gap-2">
          <button className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-foreground-muted transition-airy hover:bg-surface-alt hover:text-primary">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z" />
            </svg>
          </button>
          <input
            type="text"
            placeholder="พิมพ์ข้อความ..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-1 rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-foreground placeholder-foreground-muted transition-airy focus:border-primary-light focus:outline-none focus:ring-2 focus:ring-primary-pale"
          />
          <button
            onClick={handleSend}
            disabled={!inputValue.trim()}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary text-white transition-airy hover:bg-primary-dark disabled:bg-border disabled:text-foreground-muted"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
