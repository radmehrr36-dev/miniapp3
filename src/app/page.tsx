"use client";

import React, { useState, useRef, useEffect } from "react";
import { useTheme } from "next-themes";
import { 
  Moon, Sun, Send, Bot, User, Trash2, Menu, Settings, Sparkles, 
  Copy, Check, Mic, Paperclip, MessageSquare, ChevronDown, ShieldCheck, RefreshCw 
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Sidebar } from "@/components/Sidebar";
import { ProfileModal } from "@/components/ProfileModal";
import { SettingsModal } from "@/components/SettingsModal";
import { getTelegramWebApp, getTelegramInitData } from "@/lib/telegram-webapp";

type Message = {
  id: string | number;
  role: "user" | "assistant" | "system";
  content: string;
  apiUsed?: string;
  createdAt?: string | Date;
};

type Session = {
  id: number;
  title: string;
  modelUsed: string;
  updatedAt: string;
};

type UserProfile = {
  id: number;
  telegramId?: string;
  username: string;
  firstName: string;
  lastName: string;
  photoUrl: string;
  languageCode?: string;
  systemPrompt?: string;
  defaultModel?: string;
  temperature?: string;
  memoryEnabled?: boolean;
};

const QUICK_SUGGESTIONS = [
  { icon: "💻", title: "کدنویسی وب", text: "یک کامپوننت مودال مدرن و زیبا با React و Tailwind CSS و انیمیشن Framer Motion برایم بنویس." },
  { icon: "🚀", title: "مینی‌اپ تلگرام", text: "چطور می‌توانم احراز هویت با initData تلگرام را در Next.js 15 و App Router پیاده‌سازی کنم؟" },
  { icon: "✍️", title: "تولید محتوا", text: "یک متن تبلیغاتی جذاب و کوتاه (حداکثر ۵۰ کلمه) برای معرفی پلتفرم هوش‌مصنوعی Rad AI بنویس." },
  { icon: "🌍", title: "ترجمه هوشمند", text: "این جمله را به ۳ زبان انگلیسی، فرانسوی و عربی با لحنی محترمانه ترجمه کن: «به پلتفرم هوشمند ما خوش آمدید.»" },
];

export default function ChatApp() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Core app state
  const [user, setUser] = useState<UserProfile | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<number | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | number | null>(null);

  // Modals & Drawer state
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [settingsModalOpen, setSettingsModalOpen] = useState(false);

  // Settings
  const [userSettings, setUserSettings] = useState({
    systemPrompt: "تو Rad AI هستی، یک دستیار هوشمند، دوستانه و مفید. پاسخ‌هایت را به زبان فارسی و با لحنی صمیمانه بده.",
    defaultModel: "auto",
    openrouterModel: "openrouter/free",
    temperature: "0.7",
    memoryEnabled: true,
  });

  // Live status of providers + telegram bot (honest UI badges).
  const [status, setStatus] = useState<{
    anyProviderLive: boolean;
    providers: { id: string; name: string; live: boolean }[];
    telegram: { configured: boolean; live: boolean; botUsername?: string };
  } | null>(null);
  const [isRealTelegram, setIsRealTelegram] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const applyUserToState = async (u: UserProfile) => {
    setUser(u);
    setUserSettings({
      systemPrompt: u.systemPrompt || "تو Rad AI هستی، یک دستیار هوشمند، دوستانه و مفید. پاسخ‌هایت را به زبان فارسی و با لحنی صمیمانه بده.",
      defaultModel: u.defaultModel || "auto",
      openrouterModel: (u as any).openrouterModel || "openrouter/free",
      temperature: u.temperature || "0.7",
      memoryEnabled: u.memoryEnabled ?? true,
    });
    await loadSessions(u.id);
  };

  // Initial Boot: try REAL Telegram auth first, otherwise wait for manual login.
  useEffect(() => {
    setMounted(true);

    const initApp = async () => {
      // 1) Fetch honest provider/bot status for the UI badges.
      try {
        const st = await fetch("/api/status").then((r) => r.json());
        setStatus(st);
      } catch { /* ignore */ }

      // 2) If opened inside the real Telegram client, verify initData server-side.
      try {
        const wa = getTelegramWebApp();
        if (wa) {
          wa.ready?.();
          wa.expand?.();
        }
        const initData = getTelegramInitData();
        if (initData) {
          setIsRealTelegram(true);
          const res = await fetch("/api/auth/telegram", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ initData }),
          });
          if (res.ok) {
            const data = await res.json();
            if (data.success && data.user) {
              await applyUserToState(data.user);
              return;
            }
          }
          // If verification failed we fall through to the manual login modal.
        }
      } catch (err) {
        console.error("Telegram init error:", err);
      }

      // 3) Not inside Telegram (browser preview): open the login modal so the
      //    user consciously chooses/creates an account (no silent fake profile).
      setProfileModalOpen(true);
    };

    initApp();
  }, []);

  // Load Sessions for User
  const loadSessions = async (userId: number) => {
    try {
      const res = await fetch(`/api/sessions?userId=${userId}`);
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setSessions(data.sessions || []);
          if (data.sessions.length > 0) {
            setActiveSessionId(data.sessions[0].id);
            await loadMessages(data.sessions[0].id);
          } else {
            await handleNewChat(userId);
          }
        }
      }
    } catch (err) {
      console.error("Load sessions error:", err);
    }
  };

  // Load Messages for Session
  const loadMessages = async (sessionId: number) => {
    try {
      const res = await fetch(`/api/sessions/${sessionId}`);
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setMessages(data.messages || []);
        }
      }
    } catch (err) {
      console.error("Load messages error:", err);
    }
  };

  // Select Session
  const handleSelectSession = async (id: number) => {
    setActiveSessionId(id);
    await loadMessages(id);
    setSidebarOpen(false);
  };

  // ============================================
  // ✅ New Chat - نسخه اصلاح‌شده نهایی
  // ============================================
  const handleNewChat = async (userIdParam?: number) => {
    const targetUserId = userIdParam || user?.id;
    
    // اگر کاربر لاگین نکرده، پیام بده و مودال لاگین را باز کن
    if (!targetUserId) {
      alert("⚠️ برای ایجاد گفتگوی جدید، لطفاً ابتدا وارد حساب کاربری خود شوید.");
      setProfileModalOpen(true);
      return;
    }

    console.log("🔄 ایجاد گفتگوی جدید برای کاربر:", targetUserId);

    try {
      const res = await fetch("/api/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: targetUserId,
          title: "چت جدید",
          modelUsed: userSettings.defaultModel || "auto",
        }),
      });

      const data = await res.json();
      console.log("📨 پاسخ سرور:", data);

      if (!res.ok) {
        throw new Error(data.error || `HTTP error! status: ${res.status}`);
      }

      if (data.success && data.session) {
        setSessions((prev) => [data.session, ...prev]);
        setActiveSessionId(data.session.id);
        setMessages([
          {
            id: "welcome",
            role: "assistant",
            content: "سلام! چطور می‌تونم در این گفتگو کمکت کنم؟",
            apiUsed: "system",
          },
        ]);
        setSidebarOpen(false);
        console.log("✅ گفتگوی جدید با موفقیت ایجاد شد:", data.session.id);
      } else {
        console.error("⚠️ پاسخ سرور موفقیت‌آمیز نبود:", data);
        alert("متأسفانه ایجاد گفتگوی جدید با مشکل مواجه شد.");
      }
    } catch (err) {
      console.error("❌ خطا در ایجاد گفتگوی جدید:", err);
      alert("خطا در ارتباط با سرور. لطفاً دوباره تلاش کنید.");
    }
  };

  // Delete Session
  const handleDeleteSession = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("آیا از حذف این گفتگو اطمینان دارید؟")) return;

    try {
      const res = await fetch(`/api/sessions/${id}`, { method: "DELETE" });
      if (res.ok) {
        const remaining = sessions.filter((s) => s.id !== id);
        setSessions(remaining);
        if (activeSessionId === id) {
          if (remaining.length > 0) {
            setActiveSessionId(remaining[0].id);
            await loadMessages(remaining[0].id);
          } else if (user) {
            await handleNewChat(user.id);
          }
        }
      }
    } catch (err) {
      console.error("Delete session error:", err);
    }
  };

  // Login Handler (from ProfileModal)
  const handleLogin = async (loginData: any) => {
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(loginData),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success && data.user) {
          await applyUserToState(data.user);
        }
      }
    } catch (err) {
      console.error("Login error:", err);
    }
  };

  // Logout
  const handleLogout = () => {
    setUser(null);
    setSessions([]);
    setActiveSessionId(null);
    setMessages([]);
  };

  // Save Settings Handler
  const handleSaveSettings = async (newSettings: any) => {
    setUserSettings(newSettings);
    if (user) {
      try {
        await fetch("/api/user/settings", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: user.id,
            ...newSettings,
          }),
        });
      } catch (err) {
        console.error("Save settings error:", err);
      }
    }
  };

  // Send Message
  const handleSubmit = async (e?: React.FormEvent, customText?: string) => {
    if (e) e.preventDefault();
    const messageText = customText || input;
    if (!messageText.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: messageText,
      createdAt: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    if (!customText) setInput("");
    setIsLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMessage.content,
          history: messages,
          sessionId: activeSessionId,
          modelUsed: userSettings.defaultModel || "auto",
          openrouterModel: userSettings.openrouterModel || "openrouter/free",
          systemPrompt: userSettings.systemPrompt,
          temperature: parseFloat(userSettings.temperature || "0.7"),
        }),
      });

      if (!res.ok) throw new Error("Network response was not ok");

      const data = await res.json();

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: data.response || "خطایی در دریافت پاسخ رخ داد.",
        apiUsed: data.usedApi || "Rad AI Engine",
        createdAt: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, assistantMessage]);

      // Refresh session title if it was default
      if (user && activeSessionId) {
        const sessionRes = await fetch(`/api/sessions?userId=${user.id}`);
        if (sessionRes.ok) {
          const sessionData = await sessionRes.json();
          if (sessionData.success) setSessions(sessionData.sessions);
        }
      }
    } catch (error) {
      console.error("Chat error:", error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "متأسفانه ارتباط با سرور برقرار نشد. لطفاً وضعیت اینترنت را بررسی کنید یا مدل دیگری را از بخش تنظیمات انتخاب نمایید.",
        apiUsed: "System Error",
        createdAt: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = (text: string, id: string | number) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const activeSession = sessions.find((s) => s.id === activeSessionId);
  const currentModelName = 
    userSettings.defaultModel === "auto" ? "⚡ خودکار (Auto Fallback)" :
    userSettings.defaultModel === "api_1" ? "🟢 OpenAI GPT-4" :
    userSettings.defaultModel === "api_2" ? "🟢 OpenAI GPT-3.5" :
    userSettings.defaultModel === "api_3" ? "🔵 Google Gemini Pro" :
    userSettings.defaultModel === "api_4" ? "🔵 Gemini 1.5 Flash" :
    userSettings.defaultModel === "api_5" ? "🟣 Claude 3 Haiku" :
    userSettings.defaultModel === "api_6" ? "🟣 Claude 3 Opus" :
    userSettings.defaultModel === "api_7" ? "🟡 Mistral AI" :
    userSettings.defaultModel === "api_8" ? "🦙 Local Ollama" :
    userSettings.defaultModel === "api_9" ? `🌐 OpenRouter (${userSettings.openrouterModel})` : "⚡ Rad AI Auto";

  const isLiveMode = status?.anyProviderLive ?? false;

  if (!mounted) return null;

  return (
    <div className="relative min-h-screen flex overflow-hidden bg-background select-none">
      {/* Background Hero Image with Blend */}
      <div 
        className="absolute inset-0 z-0 opacity-15 dark:opacity-25 pointer-events-none mix-blend-overlay bg-cover bg-center"
        style={{ backgroundImage: 'url(/hero-bg.jpg)' }}
      />

      {/* Sidebar Component */}
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        sessions={sessions}
        activeSessionId={activeSessionId}
        onSelectSession={handleSelectSession}
        onNewChat={() => handleNewChat()}
        onDeleteSession={handleDeleteSession}
        user={user}
        onOpenProfile={() => setProfileModalOpen(true)}
        onOpenSettings={() => setSettingsModalOpen(true)}
      />

      {/* Main Chat Content */}
      <div className="relative z-10 flex-1 flex flex-col h-screen overflow-hidden">
        {/* Top Navbar */}
        <header className="flex items-center justify-between p-3 sm:p-4 glass-card border-b border-border shadow-xs shrink-0">
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 rounded-xl hover:bg-black/5 dark:hover:bg-white/10 md:hidden text-text/80 transition-colors"
            >
              <Menu size={22} />
            </button>

            <div className="flex items-center gap-2">
              <h1 className="font-bold text-sm sm:text-base text-text truncate max-w-[140px] sm:max-w-xs">
                {activeSession?.title || "گفتگوی جدید"}
              </h1>
              <span 
                onClick={() => setSettingsModalOpen(true)}
                className="cursor-pointer text-[11px] bg-gradient-to-r from-primary/15 to-secondary/15 text-primary border border-primary/30 px-2.5 py-1 rounded-full font-semibold flex items-center gap-1 hover:bg-primary/25 transition-all shadow-2xs"
                title="تغییر مدل هوش‌مصنوعی"
              >
                <Sparkles size={12} className="text-secondary" />
                <span>{currentModelName}</span>
                <ChevronDown size={12} className="opacity-60" />
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1 sm:gap-2">
            {/* Honest live vs simulation indicator */}
            <span
              className={`hidden sm:flex items-center gap-1.5 text-[11px] px-2.5 py-1 rounded-full font-semibold border ${
                isLiveMode
                  ? "bg-green-500/10 text-green-500 border-green-500/30"
                  : "bg-amber-500/10 text-amber-500 border-amber-500/30"
              }`}
              title={isLiveMode ? "حداقل یک API واقعی متصل است" : "هیچ کلید API واقعی تنظیم نشده — پاسخ‌ها شبیه‌سازی می‌شوند"}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${isLiveMode ? "bg-green-500 animate-pulse" : "bg-amber-500"}`} />
              {isLiveMode ? "متصل به API واقعی" : "حالت آزمایشی"}
            </span>

            <button
              onClick={() => setSettingsModalOpen(true)}
              className="p-2 sm:p-2.5 rounded-xl hover:bg-black/5 dark:hover:bg-white/10 transition-colors text-text/70 hover:text-primary flex items-center gap-1 text-xs font-medium"
              title="تنظیمات چت و مدل‌ها"
            >
              <Settings size={18} />
              <span className="hidden sm:inline">تنظیمات</span>
            </button>

            <button
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="p-2 sm:p-2.5 rounded-xl hover:bg-black/5 dark:hover:bg-white/10 transition-colors text-text/70"
              title="تغییر تم"
            >
              {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
            </button>

            {user && (
              <div 
                onClick={() => setProfileModalOpen(true)}
                className="flex items-center gap-2 cursor-pointer p-1 rounded-full bg-primary/10 border border-primary/30 hover:border-primary/60 transition-all ml-1"
                title="حساب کاربری مینی‌اپ"
              >
                <img 
                  src={user.photoUrl || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80"} 
                  alt={user.firstName} 
                  className="w-7 h-7 sm:w-8 sm:h-8 rounded-full object-cover" 
                />
              </div>
            )}
          </div>
        </header>

        {/* Chat Messages Area */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 custom-scrollbar space-y-5 max-w-4xl mx-auto w-full">
          {messages.length <= 1 && !isLoading ? (
            /* Empty State & Suggestions */
            <div className="flex flex-col items-center justify-center my-auto py-8 sm:py-12 space-y-6 text-center max-w-2xl mx-auto">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-3xl overflow-hidden border-2 border-primary/40 shadow-xl shadow-primary/20 bg-primary/10 flex items-center justify-center animate-pulse">
                <img src="/rad-ai-logo.jpg" alt="Rad AI" className="w-full h-full object-cover" />
              </div>
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-text mb-2">
                  به پلتفرم چت هوشمند <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary">Rad AI v2.0</span> خوش آمدید!
                </h2>
                <p className="text-xs sm:text-sm text-text/70 leading-relaxed max-w-md mx-auto">
                  پشتیبانی از چند-API (OpenAI، Gemini، Claude و Llama) با قابلیت حافظه بلندمدت و یکپارچگی مینی‌اپ تلگرام. موضوعی را انتخاب کنید یا پیام خود را بنویسید:
                </p>
              </div>

              {/* Quick Prompt Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full pt-2">
                {QUICK_SUGGESTIONS.map((sug, idx) => (
                  <motion.div
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    key={idx}
                    onClick={() => handleSubmit(undefined, sug.text)}
                    className="p-3.5 sm:p-4 rounded-2xl glass-card border border-border/80 hover:border-primary/50 hover:bg-primary/5 cursor-pointer text-right transition-all group shadow-xs hover:shadow-md"
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-bold text-xs sm:text-sm text-text group-hover:text-primary transition-colors flex items-center gap-1.5">
                        <span>{sug.icon}</span>
                        <span>{sug.title}</span>
                      </span>
                      <span className="text-[10px] text-primary opacity-0 group-hover:opacity-100 transition-opacity font-semibold">ارسال ↵</span>
                    </div>
                    <p className="text-xs text-text/60 line-clamp-2 leading-relaxed">{sug.text}</p>
                  </motion.div>
                ))}
              </div>
            </div>
          ) : (
            /* Message Bubbles */
            <AnimatePresence>
              {messages.map((msg) => (
                <motion.div
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  key={msg.id}
                  className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`flex max-w-[88%] sm:max-w-[78%] gap-3 ${
                      msg.role === "user" ? "flex-row-reverse" : "flex-row"
                    }`}
                  >
                    <div className={`w-8 h-8 sm:w-10 sm:h-10 shrink-0 rounded-full flex items-center justify-center shadow-md ${
                      msg.role === "user" 
                        ? "bg-gradient-to-br from-primary to-accent text-white" 
                        : "bg-card border border-primary/30 text-primary overflow-hidden"
                    }`}>
                      {msg.role === "user" ? (
                        user && user.photoUrl ? (
                          <img src={user.photoUrl} alt={user.firstName} className="w-full h-full object-cover rounded-full" />
                        ) : (
                          <User size={18} />
                        )
                      ) : (
                        <img src="/rad-ai-logo.jpg" alt="Bot" className="w-full h-full object-cover" />
                      )}
                    </div>
                    
                    <div className="flex flex-col">
                      <div
                        className={`p-3.5 sm:p-4 rounded-2xl shadow-sm leading-relaxed relative group ${
                          msg.role === "user"
                            ? "bg-gradient-to-br from-primary to-accent text-white rounded-tr-sm"
                            : "glass-card text-text rounded-tl-sm border border-border/80"
                        }`}
                      >
                        <p className="whitespace-pre-wrap text-sm sm:text-base leading-7">{msg.content}</p>
                      </div>

                      {/* Message Footer Info (Model badge & Copy button) */}
                      <div className={`flex items-center gap-2 mt-1 px-1 text-[11px] text-text/50 ${msg.role === "user" ? "justify-end" : "justify-between"}`}>
                        {msg.role === "assistant" && msg.apiUsed && msg.apiUsed !== "system" && (
                          <span className="bg-black/5 dark:bg-white/5 border border-border/60 px-2 py-0.5 rounded-md text-[10px] font-medium flex items-center gap-1 text-secondary">
                            <Sparkles size={10} />
                            <span>{msg.apiUsed}</span>
                          </span>
                        )}
                        <div className="flex items-center gap-2 ml-auto">
                          {msg.createdAt && (
                            <span>
                              {new Intl.DateTimeFormat("fa-IR", {
                                hour: "2-digit",
                                minute: "2-digit",
                              }).format(new Date(msg.createdAt))}
                            </span>
                          )}
                          {msg.role === "assistant" && (
                            <button
                              onClick={() => copyToClipboard(msg.content, msg.id)}
                              className="p-1 rounded hover:bg-black/10 dark:hover:bg-white/10 text-text/60 hover:text-text transition-colors"
                              title="کپی متن"
                            >
                              {copiedId === msg.id ? <Check size={13} className="text-green-500" /> : <Copy size={13} />}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          )}

          {/* Typing Loading Indicator */}
          {isLoading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex justify-start"
            >
              <div className="flex gap-3 max-w-[80%]">
                <div className="w-8 h-8 sm:w-10 sm:h-10 shrink-0 rounded-full flex items-center justify-center bg-card border border-primary/30 overflow-hidden shadow-md">
                  <img src="/rad-ai-logo.jpg" alt="Bot" className="w-full h-full object-cover" />
                </div>
                <div className="p-4 rounded-2xl glass-card rounded-tl-sm flex items-center gap-2.5 border border-border/80">
                  <div className="w-2 h-2 rounded-full bg-primary animate-bounce [animation-delay:-0.3s]"></div>
                  <div className="w-2 h-2 rounded-full bg-secondary animate-bounce [animation-delay:-0.15s]"></div>
                  <div className="w-2 h-2 rounded-full bg-accent animate-bounce"></div>
                  <span className="text-xs text-text/60 mr-1">در حال پردازش هوشمند...</span>
                </div>
              </div>
            </motion.div>
          )}
          <div ref={messagesEndRef} />
        </main>

        {/* Input Bar */}
        <footer className="p-3 sm:p-4 shrink-0 max-w-4xl mx-auto w-full">
          <form
            onSubmit={(e) => handleSubmit(e)}
            className="flex items-center gap-2 p-2 sm:p-2.5 glass-card rounded-2xl shadow-xl border border-border/80 focus-within:border-primary/60 transition-all bg-card/90 backdrop-blur-xl"
          >
            <button
              type="button"
              onClick={() => {
                alert("شبیه‌سازی ویس (Voice Input) برای تلگرام مینی‌اپ فعال است. می‌توانید پیام صوتی ضبط کنید.");
              }}
              className="p-2.5 sm:p-3 rounded-xl hover:bg-black/5 dark:hover:bg-white/10 text-text/60 hover:text-primary transition-colors shrink-0"
              title="ورود صوتی (Voice Input)"
            >
              <Mic size={18} />
            </button>

            <button
              type="button"
              onClick={() => {
                alert("قابلیت آپلود فایل (تصویر، PDF یا متن) با محدودیت ۵ مگابایت برای پردازش با مدل‌های چندوجهی (Gemini/GPT-4) آماده است.");
              }}
              className="p-2.5 sm:p-3 rounded-xl hover:bg-black/5 dark:hover:bg-white/10 text-text/60 hover:text-secondary transition-colors shrink-0"
              title="پیوست فایل"
            >
              <Paperclip size={18} />
            </button>

            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="پیام خود را بنویسید یا از پیشنهادها انتخاب کنید..."
              className="flex-1 bg-transparent border-none outline-none px-2 py-2 text-text placeholder:text-text/40 text-sm sm:text-base w-full"
              disabled={isLoading}
            />

            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className="bg-gradient-to-r from-primary to-secondary hover:opacity-95 text-white p-3 sm:p-3.5 rounded-xl disabled:opacity-40 disabled:cursor-not-allowed transition-all hover:scale-105 active:scale-95 shadow-md shadow-primary/30 shrink-0"
              title="ارسال پیام"
            >
              <Send size={18} className={isLoading ? "animate-pulse" : ""} />
            </button>
          </form>
          <div className="flex items-center justify-between text-[11px] text-text/40 px-2 mt-2">
            <span>موتور فعال: {currentModelName}</span>
            <span>حافظه بلندمدت (PostgreSQL): {userSettings.memoryEnabled ? "فعال" : "غیرفعال"}</span>
          </div>
        </footer>
      </div>

      {/* Modals */}
      <ProfileModal
        isOpen={profileModalOpen}
        onClose={() => setProfileModalOpen(false)}
        user={user}
        onLogin={handleLogin}
        onLogout={handleLogout}
        telegramStatus={status?.telegram}
        isRealTelegram={isRealTelegram}
      />

      <SettingsModal
        isOpen={settingsModalOpen}
        onClose={() => setSettingsModalOpen(false)}
        userId={user?.id || null}
        currentSettings={userSettings}
        onSaveSettings={handleSaveSettings}
        providerStatus={status?.providers || []}
      />
    </div>
  );
}