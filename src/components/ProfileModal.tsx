"use client";

import React, { useState } from "react";
import { X, User, Shield, Phone, Globe, Check, LogIn, LogOut, Sparkles, Image as ImageIcon } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface UserProfile {
  id: number;
  telegramId?: string;
  username: string;
  firstName: string;
  lastName: string;
  photoUrl: string;
  languageCode?: string;
}

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserProfile | null;
  onLogin: (data: {
    telegramId?: string;
    username: string;
    firstName: string;
    lastName: string;
    photoUrl?: string;
    languageCode?: string;
  }) => Promise<void>;
  onLogout: () => void;
  telegramStatus?: { configured: boolean; live: boolean; botUsername?: string };
  isRealTelegram?: boolean;
}

const TEST_ACCOUNTS = [
  {
    telegramId: "tg_1001",
    username: "alirad_ai",
    firstName: "علی",
    lastName: "راد",
    languageCode: "fa",
    photoUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
    label: "علی راد (مدیر مینی‌اپ)",
  },
  {
    telegramId: "tg_1002",
    username: "sara_developer",
    firstName: "سارا",
    lastName: "احمدی",
    languageCode: "fa",
    photoUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80",
    label: "سارا احمدی (توسعه‌دهنده)",
  },
  {
    telegramId: "tg_1003",
    username: "amir_ai_explorer",
    firstName: "امیرحسین",
    lastName: "کاظمی",
    languageCode: "en",
    photoUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
    label: "امیرحسین (پژوهشگر هوش‌مصنوعی)",
  },
];

export function ProfileModal({ isOpen, onClose, user, onLogin, onLogout, telegramStatus, isRealTelegram }: ProfileModalProps) {
  const [isCustom, setIsCustom] = useState(false);
  const [username, setUsername] = useState(user?.username || "");
  const [firstName, setFirstName] = useState(user?.firstName || "");
  const [lastName, setLastName] = useState(user?.lastName || "");
  const [photoUrl, setPhotoUrl] = useState(user?.photoUrl || "");
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleCustomSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !firstName) return;
    setLoading(true);
    try {
      await onLogin({
        username,
        firstName,
        lastName,
        photoUrl: photoUrl || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80",
        languageCode: "fa",
      });
      onClose();
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = async (account: typeof TEST_ACCOUNTS[0]) => {
    setLoading(true);
    try {
      await onLogin(account);
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className="bg-card w-full max-w-lg rounded-2xl shadow-2xl border border-border overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-border bg-gradient-to-r from-primary/10 to-secondary/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/20 border border-primary/40 flex items-center justify-center text-primary">
              <User size={20} />
            </div>
            <div>
              <h3 className="font-bold text-base sm:text-lg text-text">
                حساب کاربری مینی‌اپ تلگرام
              </h3>
              <p className="text-xs text-text/60">پروفایل، چت‌ها و داده‌های حافظه</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-black/5 dark:hover:bg-white/10 text-text/60">
            <X size={20} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-6 custom-scrollbar">
          {/* Honest Telegram connection banner */}
          <div
            className={`p-3 rounded-xl border text-xs leading-relaxed ${
              isRealTelegram
                ? "bg-green-500/10 border-green-500/30 text-green-600 dark:text-green-400"
                : telegramStatus?.live
                ? "bg-blue-500/10 border-blue-500/30 text-blue-600 dark:text-blue-400"
                : "bg-amber-500/10 border-amber-500/30 text-amber-600 dark:text-amber-400"
            }`}
          >
            {isRealTelegram ? (
              <span>✅ شما داخل کلاینت تلگرام هستید — احراز هویت واقعی با <b>initData</b> و اعتبارسنجی سرور انجام شد.</span>
            ) : telegramStatus?.live ? (
              <span>
                🤖 ربات <b>@{telegramStatus.botUsername}</b> فعال است. برای ورود واقعی، این صفحه را از داخل تلگرام (Mini App) باز کنید. در مرورگر می‌توانید یک حساب دستی بسازید 👇
              </span>
            ) : telegramStatus?.configured ? (
              <span>⚠️ توکن ربات تنظیم شده اما پاسخ نمی‌دهد. اعتبار توکن را در @BotFather بررسی کنید.</span>
            ) : (
              <span>
                ℹ️ توکن ربات تلگرام هنوز تنظیم نشده. مقدار <b>TELEGRAM_BOT_TOKEN</b> را در فایل <b>.env</b> بگذارید تا ورود واقعی تلگرام فعال شود. فعلاً می‌توانید حساب دستی بسازید 👇
              </span>
            )}
          </div>

          {user ? (
            /* Current Logged In Profile */
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row items-center gap-4 p-4 rounded-2xl bg-black/5 dark:bg-white/5 border border-border">
                <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-primary shadow-md shrink-0">
                  <img src={user.photoUrl || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80"} alt={user.firstName} className="w-full h-full object-cover" />
                </div>
                <div className="text-center sm:text-right flex-1">
                  <div className="flex items-center justify-center sm:justify-start gap-2">
                    <h4 className="font-bold text-lg text-text">
                      {user.firstName} {user.lastName}
                    </h4>
                    <span className="bg-blue-500/20 text-blue-500 text-[10px] px-2 py-0.5 rounded-full font-semibold flex items-center gap-1">
                      <Shield size={12} />
                      تایید تلگرام
                    </span>
                  </div>
                  <p className="text-sm text-text/60 mt-1">@{user.username}</p>
                  <p className="text-xs text-text/40 mt-2">شناسه تلگرام: {user.telegramId || "کاربر سفارشی"} | زبان: {user.languageCode?.toUpperCase() || "FA"}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-black/5 dark:bg-white/5 border border-border text-center">
                  <span className="text-text/50 block mb-1">وضعیت احراز هویت</span>
                  <span className="font-semibold text-green-500">متصل به Mini App</span>
                </div>
                <div className="p-3 rounded-xl bg-black/5 dark:bg-white/5 border border-border text-center">
                  <span className="text-text/50 block mb-1">حافظه بلندمدت</span>
                  <span className="font-semibold text-primary">فعال (PostgreSQL)</span>
                </div>
              </div>

              <div className="border-t border-border pt-4">
                <p className="text-xs font-semibold text-text/70 mb-3 flex items-center gap-1.5">
                  <Sparkles size={14} className="text-secondary" />
                  <span>سوییچ سریع به اکانت‌های نمایشی (فقط برای تست در مرورگر):</span>
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {TEST_ACCOUNTS.map((acc) => (
                    <button
                      key={acc.telegramId}
                      disabled={loading}
                      onClick={() => handleQuickLogin(acc)}
                      className="p-2 rounded-xl border border-border hover:border-primary/50 bg-card hover:bg-primary/5 text-left transition-all text-xs flex items-center gap-2"
                    >
                      <img src={acc.photoUrl} alt={acc.firstName} className="w-6 h-6 rounded-full object-cover shrink-0" />
                      <span className="truncate text-text font-medium">{acc.firstName} {acc.lastName}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : null}

          {/* Switch / Custom Login Section */}
          <div className="space-y-4">
            {!user || isCustom ? (
              <form onSubmit={handleCustomSubmit} className="space-y-4 p-4 rounded-2xl bg-black/5 dark:bg-white/5 border border-border">
                <h4 className="font-semibold text-sm text-text flex items-center gap-2">
                  <LogIn size={16} className="text-primary" />
                  <span>ثبت‌نام یا ورود با نام و اطلاعات دلخواه</span>
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-text/60 block mb-1">نام *</label>
                    <input
                      type="text"
                      required
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      placeholder="مثلا: رضا"
                      className="w-full px-3 py-2 rounded-xl bg-card border border-border text-sm text-text focus:outline-none focus:border-primary"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-text/60 block mb-1">نام خانوادگی</label>
                    <input
                      type="text"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      placeholder="مثلا: کریمی"
                      className="w-full px-3 py-2 rounded-xl bg-card border border-border text-sm text-text focus:outline-none focus:border-primary"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs text-text/60 block mb-1">نام کاربری (Username) *</label>
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="reza_karimi"
                    className="w-full px-3 py-2 rounded-xl bg-card border border-border text-sm text-text focus:outline-none focus:border-primary text-left dir-ltr"
                  />
                </div>
                <div>
                  <label className="text-xs text-text/60 block mb-1">آدرس عکس پروفایل (اختیاری)</label>
                  <input
                    type="url"
                    value={photoUrl}
                    onChange={(e) => setPhotoUrl(e.target.value)}
                    placeholder="https://..."
                    className="w-full px-3 py-2 rounded-xl bg-card border border-border text-sm text-text focus:outline-none focus:border-primary text-left dir-ltr"
                  />
                </div>
                <div className="flex gap-2 pt-2">
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 py-2.5 px-4 bg-primary hover:bg-primary/90 text-white rounded-xl text-xs font-semibold shadow-md transition-all"
                  >
                    {loading ? "در حال ورود..." : "ذخیره و ورود"}
                  </button>
                  {user && (
                    <button
                      type="button"
                      onClick={() => setIsCustom(false)}
                      className="py-2.5 px-4 bg-black/5 dark:bg-white/10 hover:bg-black/10 text-text rounded-xl text-xs"
                    >
                      انصراف
                    </button>
                  )}
                </div>
              </form>
            ) : (
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setIsCustom(true)}
                  className="text-xs text-primary hover:underline font-medium"
                >
                  + ویرایش اطلاعات یا ورود با نام کاربری دیگر...
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onLogout();
                    onClose();
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-500 text-xs font-medium transition-colors"
                >
                  <LogOut size={14} />
                  <span>خروج از حساب</span>
                </button>
              </div>
            )}

            {/* If not logged in, show quick accounts immediately */}
            {!user && !isCustom && (
              <div className="space-y-2">
                <p className="text-xs font-semibold text-text/70 mb-2">
                  اکانت‌های نمایشی (فقط برای تست سریع در مرورگر — ورود واقعی از داخل تلگرام انجام می‌شود):
                </p>
                <div className="space-y-2">
                  {TEST_ACCOUNTS.map((acc) => (
                    <button
                      key={acc.telegramId}
                      disabled={loading}
                      onClick={() => handleQuickLogin(acc)}
                      className="w-full p-3 rounded-xl border border-border hover:border-primary/50 bg-card hover:bg-primary/5 text-left transition-all text-xs flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <img src={acc.photoUrl} alt={acc.firstName} className="w-8 h-8 rounded-full object-cover shrink-0" />
                        <div>
                          <div className="font-bold text-text">{acc.label}</div>
                          <div className="text-[11px] text-text/50">@{acc.username}</div>
                        </div>
                      </div>
                      <span className="bg-primary/10 text-primary px-2 py-1 rounded-lg font-semibold text-[10px]">
                        ورود فوری
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-border bg-card/50 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/15 text-text rounded-xl text-xs font-medium transition-colors"
          >
            بستن
          </button>
        </div>
      </motion.div>
    </div>
  );
}
