/**
 * 🌐 Centralized API Client
 * ศูนย์กลางการเรียก Backend API ทั้งหมดของ Frontend
 * - Auto-attach JWT token ในทุก request
 * - จัดการ error response กลาง
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

// ─── Generic Fetch Helper ───
export async function fetchAPI<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token =
    typeof window !== "undefined" ? localStorage.getItem("tuyen_token") : null;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };

  // แนบ JWT Token อัตโนมัติถ้ามี
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  // ถ้า 401 (Unauthorized) — token หมดอายุหรือไม่ถูกต้อง
  if (res.status === 401) {
    if (typeof window !== "undefined") {
      localStorage.removeItem("tuyen_token");
      localStorage.removeItem("tuyen_user");
      // ให้ AuthContext จัดการ redirect
      window.dispatchEvent(new Event("auth:logout"));
    }
    throw new APIError("โทเค็นหมดอายุ กรุณาเข้าสู่ระบบใหม่", 401);
  }

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new APIError(
      errorData.detail || `Request failed: ${res.status}`,
      res.status
    );
  }

  return res.json();
}

// ─── Custom Error Class ───
export class APIError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = "APIError";
    this.status = status;
  }
}

// ═══════════════════════════════════════════
// 🔐 AUTH API
// ═══════════════════════════════════════════

export const authAPI = {
  register: (username: string, password: string) =>
    fetchAPI<{ message: string }>("/auth/register", {
      method: "POST",
      body: JSON.stringify({ username, password }),
    }),

  login: (username: string, password: string) =>
    fetchAPI<{ access_token: string; token_type: string }>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ username, password }),
    }),

  logout: () =>
    fetchAPI<{ message: string }>("/auth/logout", { method: "POST" }),
};

// ═══════════════════════════════════════════
// 📦 INVENTORY API
// ═══════════════════════════════════════════

export interface InventoryItem {
  id: number;
  user_id: number;
  name: string;
  quantity: number;
  unit: string;
  category: string | null;
  expiry_date: string | null;
  added_by: string;
}

export const inventoryAPI = {
  getAll: () => fetchAPI<InventoryItem[]>("/inventory/"),

  getById: (id: number) => fetchAPI<InventoryItem>(`/inventory/${id}`),

  addManual: (data: {
    name: string;
    quantity: number;
    unit: string;
    category?: string;
    expiry_date?: string;
  }) =>
    fetchAPI<InventoryItem>("/inventory/manual", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  update: (
    id: number,
    data: Partial<{
      name: string;
      quantity: number;
      unit: string;
      category: string;
      expiry_date: string;
    }>
  ) =>
    fetchAPI<InventoryItem>(`/inventory/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  delete: (id: number) =>
    fetchAPI<{ status: string; message: string }>(`/inventory/${id}`, {
      method: "DELETE",
    }),
};

// ═══════════════════════════════════════════
// 🍳 RECIPE API
// ═══════════════════════════════════════════

export interface RecipeSuggestion {
  id: number;
  title: string;
  image: string;
  usedIngredientCount: number;
  missedIngredientCount: number;
}

export interface RecipeDetail {
  id: number;
  title: string;
  image: string | null;
  readyInMinutes: number;
  servings: number;
  instructions: string | null;
  extendedIngredients: { name: string; amount: number; unit: string }[];
}

export interface RecipeSearchResult {
  id: number;
  title: string;
  image: string | null;
  readyInMinutes: number;
}

export interface RecipeSaved {
  id: number;
  user_id: number;
  spoonacular_id: number;
  title: string;
  image_url: string | null;
  ready_in_minutes: number | null;
  servings: number | null;
  saved_at: string;
}

export const recipeAPI = {
  suggest: () => fetchAPI<RecipeSuggestion[]>("/recipes/suggest"),

  search: (query: string) =>
    fetchAPI<RecipeSearchResult[]>(`/recipes/search?q=${encodeURIComponent(query)}`),

  getDetail: (id: number) => fetchAPI<RecipeDetail>(`/recipes/${id}`),

  save: (data: {
    spoonacular_id: number;
    title: string;
    image_url?: string;
    ready_in_minutes?: number;
    servings?: number;
  }) =>
    fetchAPI<RecipeSaved>("/recipes/saved", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  getSaved: () => fetchAPI<RecipeSaved[]>("/recipes/saved"),

  deleteSaved: (recipeId: number) =>
    fetchAPI<{ status: string; message: string }>(`/recipes/saved/${recipeId}`, {
      method: "DELETE",
    }),
};

// ═══════════════════════════════════════════
// 📊 NUTRITION API
// ═══════════════════════════════════════════

export interface NutritionLog {
  id: number;
  user_id: number;
  meal_type: string;
  food_name: string;
  calories: number;
  protein: number;
  carb: number;
  fat: number;
  logged_at: string;
  source: string;
}

export interface TodaySummary {
  date: string;
  totals: { calories: number; protein: number; carb: number; fat: number };
  goals: { calories: number; protein: number; carb: number; fat: number };
  progress_percentage: {
    calories_pct: number;
    protein_pct: number;
    carb_pct: number;
    fat_pct: number;
  };
  meals_count: number;
}

export interface NutritionEstimate {
  food_name: string;
  calories: number;
  protein: number;
  carb: number;
  fat: number;
  note: string;
}

export const nutritionAPI = {
  logMeal: (data: {
    meal_type: string;
    food_name: string;
    calories: number;
    protein: number;
    carb: number;
    fat: number;
    source?: string;
  }) =>
    fetchAPI<NutritionLog>("/nutrition/log", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  getToday: () => fetchAPI<TodaySummary>("/nutrition/today"),

  getHistory: (days: number = 7) =>
    fetchAPI<NutritionLog[]>(`/nutrition/history?days=${days}`),

  estimate: (foodName: string) =>
    fetchAPI<NutritionEstimate>(
      `/nutrition/estimate?food_name=${encodeURIComponent(foodName)}`
    ),

  deleteLog: (logId: number) =>
    fetchAPI<{ status: string; message: string }>(`/nutrition/log/${logId}`, {
      method: "DELETE",
    }),
};

// ═══════════════════════════════════════════
// 🤖 AI CHAT API
// ═══════════════════════════════════════════

export const aiAPI = {
  chat: (message: string, history: { role: string; content: string }[]) =>
    fetchAPI<{ reply: string }>("/ai/chat", {
      method: "POST",
      body: JSON.stringify({ message, history }),
    }),
};
