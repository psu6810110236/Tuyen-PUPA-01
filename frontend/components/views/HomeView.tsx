"use client";

export default function HomeView() {
  // Calorie data
  const calorieGoal = 2000;
  const calorieConsumed = 1650;
  const calorieRemaining = calorieGoal - calorieConsumed;
  const caloriePercent = (calorieConsumed / calorieGoal) * 100;
  
  // SVG circle calculations
  const radius = 90;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (caloriePercent / 100) * circumference;

  // Macro data
  const macros = [
    { name: "โปรตีน", current: 72, goal: 120, unit: "g", color: "bg-primary-dark", bgColor: "bg-primary-pale", textColor: "text-primary-dark" },
    { name: "คาร์โบไฮเดรต", current: 180, goal: 250, unit: "g", color: "bg-primary-fixed", bgColor: "bg-secondary-light", textColor: "text-surface-tint" },
    { name: "ไขมัน", current: 45, goal: 65, unit: "g", color: "bg-accent-lavender", bgColor: "bg-accent-lavender/30", textColor: "text-purple-600" },
  ];

  // Recent meals
  const meals = [
    { name: "ข้าวต้มหมูสับ", time: "07:30", calories: 380, icon: "🍚", period: "เช้า" },
    { name: "ข้าวผัดกะเพรา", time: "12:15", calories: 650, icon: "🍛", period: "กลางวัน" },
    { name: "สลัดอกไก่", time: "18:30", calories: 420, icon: "🥗", period: "เย็น" },
  ];

  // Get Thai date
  const today = new Date();
  const thaiDate = today.toLocaleDateString('th-TH', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      {/* ─── Date & Greeting ─── */}
      <div>
        <p className="text-sm font-body text-foreground-muted">{thaiDate}</p>
        <h2 className="mt-1 text-2xl font-heading font-bold text-foreground">ภาพรวมวันนี้</h2>
      </div>

      {/* ─── Calorie Ring + Macros Row ─── */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Circular Calorie Chart */}
        <div className="flex flex-col items-center rounded-2xl border-2 border-white bg-surface p-6 shadow-soft-blue">
          <h3 className="mb-4 text-sm font-heading font-semibold text-foreground-secondary">แคลอรี่วันนี้</h3>
          <div className="relative">
            <svg width="220" height="220" viewBox="0 0 220 220" className="-rotate-90">
              {/* Background circle */}
              <circle
                cx="110" cy="110" r={radius}
                fill="none"
                stroke="#E2E8F0"
                strokeWidth="12"
              />
              {/* Progress circle */}
              <circle
                cx="110" cy="110" r={radius}
                fill="none"
                stroke="url(#calorieGradient)"
                strokeWidth="12"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                className="transition-all duration-1000 ease-out"
              />
              <defs>
                <linearGradient id="calorieGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#4263EB" />
                  <stop offset="100%" stopColor="#748FFC" />
                </linearGradient>
              </defs>
            </svg>
            {/* Center text */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-4xl font-heading font-bold text-foreground">{calorieConsumed.toLocaleString()}</span>
              <span className="text-sm font-body text-foreground-muted">/ {calorieGoal.toLocaleString()} kcal</span>
              <div className="mt-2 rounded-full bg-primary-pale px-3 py-1">
                <span className="text-xs font-heading font-semibold text-primary-dark">เหลือ {calorieRemaining} kcal</span>
              </div>
            </div>
          </div>
        </div>

        {/* Macro Progress Bars */}
        <div className="flex flex-col justify-center gap-5 rounded-2xl border-2 border-white bg-surface p-6 shadow-soft-blue">
          <h3 className="text-sm font-heading font-semibold text-foreground-secondary">สารอาหารหลัก</h3>
          {macros.map((macro) => {
            const percent = Math.round((macro.current / macro.goal) * 100);
            return (
              <div key={macro.name} className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className={`text-sm font-body font-medium ${macro.textColor}`}>{macro.name}</span>
                  <span className="text-sm font-body text-foreground-muted">
                    {macro.current}{macro.unit} / {macro.goal}{macro.unit}
                  </span>
                </div>
                <div className={`h-3 w-full overflow-hidden rounded-full ${macro.bgColor}`}>
                  <div
                    className={`h-full rounded-full ${macro.color} transition-all duration-1000 ease-out`}
                    style={{ width: `${percent}%` }}
                  />
                </div>
                <span className="text-xs font-body text-foreground-muted">{percent}%</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* ─── Recent Meals ─── */}
      <div>
        <h3 className="mb-4 text-sm font-heading font-semibold text-foreground">🍽️ มื้ออาหารล่าสุด</h3>
        <div className="flex gap-4 overflow-x-auto pb-2">
          {meals.map((meal) => (
            <div
              key={meal.name}
              className="flex min-w-[200px] shrink-0 items-center gap-3 rounded-2xl border-2 border-white bg-surface p-4 shadow-soft-blue transition-airy hover-lift cursor-pointer"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-surface-alt text-2xl">
                {meal.icon}
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-body font-medium text-primary-dark">{meal.period}</span>
                <span className="text-sm font-heading font-semibold text-foreground">{meal.name}</span>
                <span className="text-xs font-body text-foreground-muted">{meal.calories} kcal · {meal.time}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
