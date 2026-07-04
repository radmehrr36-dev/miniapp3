import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

// ============================================
// 📌 تنظیمات اتصال به دیتابیس
// ============================================

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error("❌ DATABASE_URL is required. Please set it in .env.local or Vercel Environment Variables.");
}

// جلوگیری از ایجاد چندین Pool در محیط توسعه (Hot Reload)
const globalForDb = globalThis as typeof globalThis & {
  _radAiPool?: Pool;
};

// ایجاد Pool با تنظیمات مناسب برای Vercel و محیط ابری
export const pool =
  globalForDb._radAiPool ??
  new Pool({
    connectionString: databaseUrl,
    max: 20, // حداکثر اتصالات همزمان
    idleTimeoutMillis: 30000, // بستن اتصالات بیکار بعد از ۳۰ ثانیه
    connectionTimeoutMillis: 5000, // تایم‌اوت اتصال
    ssl: process.env.NODE_ENV === "production" 
      ? { rejectUnauthorized: false } // برای Vercel و Neon
      : false,
  });

// ذخیره Pool در Global برای جلوگیری از ایجاد مجدد
if (process.env.NODE_ENV !== "production") {
  globalForDb._radAiPool = pool;
}

// ============================================
// 📦 ایجاد نمونه Drizzle
// ============================================
export const db = drizzle(pool);

// ============================================
// 📤 اکسپورت Schema برای استفاده در جاهای دیگر
// ============================================
export * from "./schema";

// ============================================
// 🛠️ تابع کمکی برای بستن اتصال (اختیاری)
// ============================================
export async function closeDbConnection() {
  try {
    await pool.end();
    console.log("✅ Database connection closed.");
  } catch (error) {
    console.error("❌ Error closing database connection:", error);
  }
}