"use client";

import { useState } from "react";
import { Settings, Shield, User, Bell, Save, Sparkles, CheckCircle2 } from "lucide-react";

export default function SettingsView() {
  const [calGoal, setCalGoal] = useState("2000");
  const [proteinGoal, setProteinGoal] = useState("130");
  const [carbGoal, setCarbGoal] = useState("220");
  const [fatGoal, setFatGoal] = useState("65");
  const [notifyExpiry, setNotifyExpiry] = useState(true);
  const [showSaved, setShowSaved] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setShowSaved(true);
    setTimeout(() => setShowSaved(false), 3000);
  };

  return (
    <div className="flex flex-col gap-6 animate-fade-in pb-8">
      {/* Header */}
      <div>
        <h2 className="text-xl font-heading font-bold text-foreground">ตั้งค่าระบบ (Settings)</h2>
        <p className="mt-1 text-xs font-body text-foreground-secondary">
          ปรับแต่งเป้าหมายโภชนาการประจำวันของคุณเพื่อสุขภาพและโภชนาการที่ดีที่สุด
        </p>
      </div>

      <div className="mx-auto w-full max-w-2xl">
        <div className="rounded-xl border border-outline bg-surface p-5 shadow-card">
          <div className="flex items-center justify-between mb-5 border-b border-outline pb-3">
            <h3 className="text-sm font-heading font-semibold text-foreground flex items-center gap-2">
              <Settings className="h-4 w-4 text-primary" />
              เป้าหมายโภชนาการประจำวัน
            </h3>
          </div>

          {showSaved && (
            <div className="mb-4 flex items-center gap-2 rounded-lg border border-success/20 bg-success/5 p-3 text-success animate-scale-in">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              <span className="text-xs font-body font-semibold">บันทึกการตั้งค่าเป้าหมายสำเร็จ!</span>
            </div>
          )}

          <form onSubmit={handleSave} className="flex flex-col gap-4">
            {/* Daily Calories */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-body font-medium text-foreground-secondary">
                เป้าหมายแคลอรี่รายวัน (kcal)
              </label>
              <input
                type="number"
                value={calGoal}
                onChange={e => setCalGoal(e.target.value)}
                className="rounded-lg border border-outline bg-surface-alt px-3.5 py-2 text-sm font-body text-foreground placeholder-foreground-muted focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/20"
              />
            </div>

            {/* Macros Row */}
            <div className="grid grid-cols-3 gap-3">
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-body font-medium text-foreground-secondary">โปรตีนเป้าหมาย (กรัม)</label>
                <input
                  type="number"
                  value={proteinGoal}
                  onChange={e => setProteinGoal(e.target.value)}
                  className="rounded-lg border border-outline bg-surface-alt px-3 py-1.5 text-xs font-body text-foreground focus:border-primary focus:outline-none"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-body font-medium text-foreground-secondary">คาร์บเป้าหมาย (กรัม)</label>
                <input
                  type="number"
                  value={carbGoal}
                  onChange={e => setCarbGoal(e.target.value)}
                  className="rounded-lg border border-outline bg-surface-alt px-3 py-1.5 text-xs font-body text-foreground focus:border-primary focus:outline-none"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-body font-medium text-foreground-secondary">ไขมันเป้าหมาย (กรัม)</label>
                <input
                  type="number"
                  value={fatGoal}
                  onChange={e => setFatGoal(e.target.value)}
                  className="rounded-lg border border-outline bg-surface-alt px-3 py-1.5 text-xs font-body text-foreground focus:border-primary focus:outline-none"
                />
              </div>
            </div>

            {/* Action Button */}
            <button
              type="submit"
              className="mt-4 flex items-center justify-center gap-2 rounded-lg bg-primary py-2.5 text-sm font-heading font-semibold text-white shadow-sm transition-colors hover:bg-primary-dark"
            >
              <Save className="h-4 w-4" />
              บันทึกการตั้งค่า
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
