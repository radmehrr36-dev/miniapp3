"use client";

import React from "react";
import { MessageSquare, Plus, Trash2, User, Settings, LogOut, Sparkles, ChevronRight, Menu, X, ShieldCheck } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface Session {
  id: number;
  title: string;
  modelUsed: string;
  updatedAt: string;
}

interface UserProfile {
  id: number;
  telegramId?: string;
  username: string;
  firstName: string;
  lastName: string;
  photoUrl: string;
  languageCode?: string;
}

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  sessions: Session[];
  activeSessionId: number | null;
  onSelectSession: (id: number) => void;
  onNewChat: () => void;
  onDeleteSession: (id: number, e: React.MouseEvent) => void;
  user: UserProfile | null;
  onOpenProfile: () => void;
  onOpenSettings: () => void;
}

export function Sidebar({
  isOpen,
  onClose,
  sessions,
  activeSessionId,
  onSelectSession,
  onNewChat,
  onDeleteSession,
  user,
  onOpenProfile,
  onOpenSettings,
}: SidebarProps) {
  const sidebarContent = (
    <div className="flex flex-col h-full bg-card/95 backdrop-blur-xl border-l border-border w-full p-4 select-none">
      {/* Header / Brand */}
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-border/50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl overflow-hidden border border-primary/50 shadow-md shadow-primary/20 bg-primary/10 flex items-center justify-center">
            <img src="/rad-ai-logo.jpg" alt="Rad AI" className="w-full h-full object-cover" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h2 className="font-bold text-base bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary">
                Rad AI
              </h2>
              <span className="text-[10px] bg-primary/20 text-primary px-1.5 py-0.5 rounded-full font-semibold">
                Mini App
              </span>
            </div>
            <p className="text-[11px] text-text/60">پلتفرم چند-API تلگرام</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 text-text/70 md:hidden"
        >
          <X size={20} />
        </button>
      </div>

      {/* New Chat Button */}
      <button
        onClick={onNewChat}
        className="flex items-center justify-center gap-2 w-full py-3 px-4 bg-gradient-to-r from-primary to-secondary hover:opacity-95 active:scale-[0.98] text-white rounded-xl font-medium shadow-lg shadow-primary/25 transition-all mb-4 group"
      >
        <Plus size={18} className="group-hover:rotate-90 transition-transform duration-300" />
        <span>گفتگوی جدید</span>
      </button>

      {/* Sessions List */}
      <div className="flex-1 overflow-y-auto custom-scrollbar pr-1 space-y-1.5 my-2">
        <div className="text-xs font-semibold text-text/50 px-2 mb-2 flex items-center gap-1.5">
          <MessageSquare size={13} />
          <span>تاریخچه چت‌ها</span>
        </div>
        {sessions.length === 0 ? (
          <div className="text-center py-8 px-4 border border-dashed border-border rounded-xl text-text/50 text-xs">
            هنوز گفتگویی ایجاد نکرده‌اید. دکمه «گفتگوی جدید» را بزنید!
          </div>
        ) : (
          sessions.map((session) => {
            const isActive = session.id === activeSessionId;
            return (
              <div
                key={session.id}
                onClick={() => onSelectSession(session.id)}
                className={`group flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all ${
                  isActive
                    ? "bg-primary/15 border border-primary/40 text-primary font-medium shadow-sm"
                    : "hover:bg-black/5 dark:hover:bg-white/5 text-text/80 border border-transparent"
                }`}
              >
                <div className="flex items-center gap-2.5 overflow-hidden flex-1">
                  <MessageSquare size={16} className={isActive ? "text-primary shrink-0" : "text-text/40 shrink-0"} />
                  <span className="text-sm truncate">{session.title || "گفتگوی بدون نام"}</span>
                </div>
                <button
                  onClick={(e) => onDeleteSession(session.id, e)}
                  className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-red-500/10 text-text/40 hover:text-red-500 rounded-lg transition-all shrink-0"
                  title="حذف گفتگو"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            );
          })
        )}
      </div>

      {/* Footer / User Profile & Settings */}
      <div className="mt-auto pt-3 border-t border-border/50 space-y-2">
        <button
          onClick={onOpenSettings}
          className="flex items-center gap-2.5 w-full p-2.5 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 text-text/80 transition-colors text-xs"
        >
          <Settings size={16} className="text-secondary" />
          <span>تنظیمات هوش مصنوعی و مدل‌ها</span>
        </button>

        {user ? (
          <div
            onClick={onOpenProfile}
            className="flex items-center justify-between p-2.5 rounded-xl bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 cursor-pointer transition-all border border-border/40"
          >
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div className="w-8 h-8 rounded-full overflow-hidden shrink-0 border border-primary/40 bg-primary/20 flex items-center justify-center font-bold text-xs text-primary">
                {user.photoUrl ? (
                  <img src={user.photoUrl} alt={user.firstName} className="w-full h-full object-cover" />
                ) : (
                  user.firstName?.[0] || "U"
                )}
              </div>
              <div className="overflow-hidden">
                <div className="flex items-center gap-1">
                  <span className="text-xs font-semibold text-text truncate">
                    {user.firstName} {user.lastName}
                  </span>
                  <span title="تایید تلگرام Mini App">
                    <ShieldCheck size={13} className="text-blue-500 shrink-0" />
                  </span>
                </div>
                <span className="text-[10px] text-text/50 block truncate">@{user.username}</span>
              </div>
            </div>
            <ChevronRight size={16} className="text-text/40 rotate-180 shrink-0" />
          </div>
        ) : (
          <button
            onClick={onOpenProfile}
            className="flex items-center justify-center gap-2 w-full p-2.5 rounded-xl bg-primary/10 hover:bg-primary/20 text-primary transition-all text-xs font-semibold"
          >
            <User size={16} />
            <span>ورود / ثبت‌نام حساب تلگرام</span>
          </button>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Drawer */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-xs md:hidden"
          />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed top-0 right-0 z-50 h-full md:hidden"
          >
            {sidebarContent}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Desktop Sidebar - اصلاح شده */}
      <div className="hidden md:block h-screen sticky top-0 overflow-y-auto border-l border-border bg-card/95 backdrop-blur-xl min-w-[280px] max-w-[320px] w-80 shrink-0">
        {sidebarContent}
      </div>
    </>
  );
}