/**
 * 🌐 Centralized API Client
 * ศูนย์กลางการเรียก Backend API ทั้งหมดของ Frontend
 * - Auto-attach JWT token ในทุก request
 * - จัดการ error response กลาง
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
const AI_BASE_URL = process.env.NEXT_PUBLIC_AI_URL || "http://localhost:8001";

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

  login: async (username: string, password: string) => {
    const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
    const formData = new URLSearchParams();
    formData.append("username", username);
    formData.append("password", password);

    const res = await fetch(`${API_BASE_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: formData.toString(),
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new APIError(
        errorData.detail || `Login failed: ${res.status}`,
        res.status
      );
    }

    return res.json() as Promise<{ access_token: string; token_type: string }>;
  },

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

  deleteAll: () =>
    fetchAPI<{ status: string; message: string }>("/inventory/", {
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
  extendedIngredients?: { name: string; amount: number; unit: string }[];
  available_ingredients?: { name: string; amount: number; unit: string; lotus_search_url?: string }[];
  missing_ingredients?: { name: string; amount: number; unit: string; lotus_search_url?: string }[];
  line_share_url?: string | null;
  shopping_list_ready?: boolean;
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

  cook: (id: number) =>
    fetchAPI<{
      success: boolean;
      recipe_title: string;
      deducted_ingredients: Array<{
        name: string;
        deducted_amount: number;
        unit: string;
        remaining_amount: number;
      }>;
      logged_nutrition: {
        food_name: string;
        calories: number;
        protein: number;
        carb: number;
        fat: number;
      };
    }>(`/recipes/${id}/cook`, {
      method: "POST",
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

  scanAndAdd: async (image_base64: string, mime_type: string = "image/jpeg") => {
    const token = typeof window !== "undefined" ? localStorage.getItem("tuyen_token") : null;
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
    const res = await fetch(`${AI_BASE_URL}/ai/scan-and-add`, {
      method: "POST",
      headers,
      body: JSON.stringify({ image_base64, mime_type }),
    });
    
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new APIError(errorData.detail || "Scanning failed", res.status);
    }
    
    return res.json() as Promise<{
      success: boolean;
      message: string;
      ingredients_found: string[];
      added: string[];
      failed: string[];
      added_count: number;
      detections?: Array<{ name: string; quantity: number; unit: string; box_2d: number[] }>;
    }>;
  },
};