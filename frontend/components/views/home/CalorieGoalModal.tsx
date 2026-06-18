import React, { useRef } from "react";
import { createPortal } from "react-dom";
import { Pencil, X, Save, CheckCircle2 } from "lucide-react";

type CalorieGoalModalProps = {
  showGoalModal: boolean;
  setShowGoalModal: (val: boolean) => void;
  mounted: boolean;
  goalSaved: boolean;
  calGoal: string;
  setCalGoal: (val: string) => void;
  proteinGoal: string;
  setProteinGoal: (val: string) => void;
  carbGoal: string;
  setCarbGoal: (val: string) => void;
  fatGoal: string;
  setFatGoal: (val: string) => void;
  handleSaveGoals: (e: React.FormEvent) => void;
};

export default function CalorieGoalModal({
  showGoalModal,
  setShowGoalModal,
  mounted,
  goalSaved,
  calGoal,
  setCalGoal,
  proteinGoal,
  setProteinGoal,
  carbGoal,
  setCarbGoal,
  fatGoal,
  setFatGoal,
  handleSaveGoals,
}: CalorieGoalModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);

  if (!showGoalModal || !mounted) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm animate-fade-in"
      onClick={(e) => { if (e.target === e.currentTarget) setShowGoalModal(false); }}
    >
      <div
        ref={modalRef}
        className="w-full sm:max-w-md bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl border border-outline animate-scale-in"
      >
        {/* Modal Header */}
        <div className="flex items-center gap-2 px-5 pt-5 pb-4 border-b border-outline">
          <Pencil className="h-4 w-4 text-primary shrink-0" />
          <h3 className="text-sm font-heading font-semibold text-foreground flex-1">
            แก้ไขเป้าหมายโภชนาการ
          </h3>
          <button
            onClick={() => setShowGoalModal(false)}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-foreground-muted hover:bg-surface-alt transition-all"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Form — pb-24 on mobile so Save button clears the bottom nav bar */}
        <form onSubmit={handleSaveGoals} className="flex flex-col gap-4 px-5 pt-5 pb-24 sm:pb-5">
          {/* Success Banner */}
          {goalSaved && (
            <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2.5 animate-scale-in">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
              <span className="text-xs font-body font-semibold text-emerald-700">บันทึกเป้าหมายสำเร็จ!</span>
            </div>
          )}

          {/* Calories — large input, most important */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-body font-semibold text-foreground">
              เป้าหมายแคลอรี่รายวัน
              <span className="ml-1 text-foreground-muted font-normal">(kcal)</span>
            </label>
            <input
              type="number"
              value={calGoal}
              onChange={e => setCalGoal(e.target.value)}
              min="500" max="6000"
              className="rounded-xl border border-outline bg-surface-alt px-4 py-2.5 text-base font-heading font-bold text-primary text-center focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/10 transition-all"
            />
          </div>

          {/* Macros Row */}
          <div className="grid grid-cols-3 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-body font-medium text-foreground-secondary">โปรตีน (g)</label>
              <input
                type="number"
                value={proteinGoal}
                onChange={e => setProteinGoal(e.target.value)}
                min="0"
                className="rounded-lg border border-outline bg-surface-alt px-3 py-2 text-sm font-body text-foreground text-center focus:border-primary focus:outline-none transition-all"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-body font-medium text-foreground-secondary">คาร์บ (g)</label>
              <input
                type="number"
                value={carbGoal}
                onChange={e => setCarbGoal(e.target.value)}
                min="0"
                className="rounded-lg border border-outline bg-surface-alt px-3 py-2 text-sm font-body text-foreground text-center focus:border-primary focus:outline-none transition-all"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-body font-medium text-foreground-secondary">ไขมัน (g)</label>
              <input
                type="number"
                value={fatGoal}
                onChange={e => setFatGoal(e.target.value)}
                min="0"
                className="rounded-lg border border-outline bg-surface-alt px-3 py-2 text-sm font-body text-foreground text-center focus:border-primary focus:outline-none transition-all"
              />
            </div>
          </div>

          {/* Save */}
          <button
            type="submit"
            className="flex items-center justify-center gap-2 rounded-xl bg-primary py-3 text-sm font-heading font-semibold text-white hover:bg-primary-dark active:scale-95 transition-all shadow-sm mt-1"
          >
            <Save className="h-4 w-4" />
            บันทึกเป้าหมาย
          </button>
        </form>
      </div>
    </div>,
    document.body
  );
}
