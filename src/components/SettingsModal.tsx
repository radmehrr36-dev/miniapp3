"use client";

import React, { useState, useEffect } from "react";
import { X, Settings, Sparkles, Sliders, MessageSquare, Database, Check, Bot } from "lucide-react";
import { motion } from "framer-motion";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: number | null;
  currentSettings: {
    systemPrompt: string;
    defaultModel: string;
    openrouterModel: string;
    temperature: string;
    memoryEnabled: boolean;
  };
  onSaveSettings: (settings: {
    systemPrompt: string;
    defaultModel: string;
    openrouterModel: string;
    temperature: string;
    memoryEnabled: boolean;
  }) => Promise<void>;
  providerStatus?: { id: string; name: string; live: boolean }[];
}

// ✅ لیست جدید مدل‌های واقعی OpenRouter
const AI_MODELS = [
  { 
    id: "openrouter/free", 
    name: "🌐 OpenRouter (Auto-Router)", 
    desc: "مسیریاب هوشمند رایگان - انتخاب خودکار بهترین مدل در دسترس",
    key: "" 
  },
  { 
    id: "nvidia/nemotron-3-ultra-550b-a55b:free", 
    name: "⚡ NVIDIA Nemotron 3 Ultra (550B)", 
    desc: "قوی‌ترین مدل رایگان برای حل مسائل پیچیده، تحلیل داده و استدلال",
    key: "" 
  },
  { 
    id: "openai/gpt-oss-120b:free", 
    name: "🧠 OpenAI GPT-OSS (120B)", 
    desc: "مدل متن‌باز قدرتمند با ۱۲۰ میلیارد پارامتر - مناسب برای کدنویسی و تحلیل",
    key: "" 
  },
  { 
    id: "openai/gpt-oss-20b:free", 
    name: "💡 OpenAI GPT-OSS (20B)", 
    desc: "نسخه سبک‌تر و سریع‌تر با ۲۰ میلیارد پارامتر - پاسخ‌های روزمره و سریع",
    key: "" 
  },
];

// ✅ PRESET‌ها (بدون تغییر)
const PROMPT_PRESETS = [
  { label: "دستیار صمیمی", text: "تو Rad AI هستی، یک دستیار هوشمند، دوستانه و مفید. پاسخ‌هایت را به زبان فارسی و با لحنی صمیمانه و گیرا بده." },
  { label: "برنامه‌نویس ارشد", text: "تو یک مهندس نرم‌افزار ارشد و متخصص Full-stack هستی. کدهای بهینه، مدرن و با توضیحات دقیق ارائه بده." },
  { label: "مترجم و ویراستار", text: "تو یک مترجم حرفه‌ای و ویراستار متون فارسی و انگلیسی هستی. متون را با حفظ لحن و با بالاترین کیفیت ترجمه یا بازنویسی کن." },
  { label: "مشاور کسب‌وکار", text: "تو یک مشاور استراتژیک کسب‌وکار و بازاریابی هستی. راهکارهای عملی، مبتنی بر داده و خلاقانه برای رشد ارائه بده." },
];

// ✅ کامپوننت اصلی با export صحیح
export function SettingsModal({
  isOpen,
  onClose,
  userId,
  currentSettings,
  onSaveSettings,
  providerStatus = [],
}: SettingsModalProps) {
  const [defaultModel, setDefaultModel] = useState(currentSettings.defaultModel || "openrouter/free");
  const [openrouterModel, setOpenrouterModel] = useState(currentSettings.openrouterModel || "openrouter/free");
  const [systemPrompt, setSystemPrompt] = useState(currentSettings.systemPrompt || PROMPT_PRESETS[0].text);
  const [temperature, setTemperature] = useState(currentSettings.temperature || "0.7");
  const [memoryEnabled, setMemoryEnabled] = useState(currentSettings.memoryEnabled ?? true);
  const [loading, setLoading] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const liveKeys = new Set(providerStatus.filter((p) => p.live).map((p) => p.id));

  useEffect(() => {
    if (isOpen) {
      setDefaultModel(currentSettings.defaultModel || "openrouter/free");
      setOpenrouterModel(currentSettings.openrouterModel || "openrouter/free");
      setSystemPrompt(currentSettings.systemPrompt || PROMPT_PRESETS[0].text);
      setTemperature(currentSettings.temperature || "0.7");
      setMemoryEnabled(currentSettings.memoryEnabled ?? true);
      setSavedSuccess(false);
    }
  }, [isOpen, currentSettings]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSaveSettings({
        defaultModel,
        openrouterModel,
        systemPrompt,
        temperature,
        memoryEnabled,
      });
      setSavedSuccess(true);
      setTimeout(() => {
        setSavedSuccess(false);
        onClose();
      }, 1000);
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
        className="bg-card w-full max-w-xl rounded-2xl shadow-2xl border border-border overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-border bg-gradient-to-r from-primary/10 to-accent/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-secondary/20 border border-secondary/40 flex items-center justify-center text-secondary">
              <Settings size={20} />
            </div>
            <div>
              <h3 className="font-bold text-base sm:text-lg text-text">
                تنظیمات هوش مصنوعی و مدل چت
              </h3>
              <p className="text-xs text-text/60">سفارشی‌سازی رفتار، مدل فعال و حافظه گفتگوها</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-black/5 dark:hover:bg-white/10 text-text/60">
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 overflow-y-auto space-y-6 custom-scrollbar flex-1">
          {/* Model Selection */}
          <div className="space-y-3">
            <label className="font-semibold text-sm text-text flex items-center gap-2">
              <Bot size={16} className="text-primary" />
              <span>انتخاب مدل هوش‌مصنوعی پیش‌فرض (AI Model)</span>
            </label>
            <div className="space-y-2 max-h-56 overflow-y-auto custom-scrollbar pr-1">
              {AI_MODELS.map((model) => {
                const isSelected = defaultModel === model.id;
                return (
                  <div
                    key={model.id}
                    onClick={() => setDefaultModel(model.id)}
                    className={`p-3 rounded-xl border cursor-pointer transition-all flex items-start justify-between ${
                      isSelected
                        ? "bg-primary/15 border-primary shadow-sm text-text"
                        : "bg-black/5 dark:bg-white/5 border-border hover:border-text/30 text-text/80"
                    }`}
                  >
                    <div className="flex-1">
                      <div className="font-bold text-xs sm:text-sm flex items-center gap-2 flex-wrap">
                        <span>{model.name}</span>
                        {isSelected && <span className="text-[10px] bg-primary text-white px-1.5 py-0.5 rounded-md font-semibold">فعال</span>}
                      </div>
                      <p className="text-[11px] text-text/60 mt-1">{model.desc}</p>
                    </div>
                    <div className={`w-5 h-5 rounded-full border flex items-center justify-center mt-0.5 shrink-0 ${isSelected ? "border-primary bg-primary text-white" : "border-border"}`}>
                      {isSelected && <Check size={12} />}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* System Prompt */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="font-semibold text-sm text-text flex items-center gap-2">
                <MessageSquare size={16} className="text-secondary" />
                <span>دستورالعمل سیستم (System Prompt & Persona)</span>
              </label>
            </div>
            <p className="text-xs text-text/60">
              این متن شخصیت و نحوه پاسخ‌گویی هوش‌مصنوعی را به طور کامل تعیین می‌کند:
            </p>
            
            <div className="flex flex-wrap gap-1.5 pb-1">
              {PROMPT_PRESETS.map((preset) => (
                <button
                  type="button"
                  key={preset.label}
                  onClick={() => setSystemPrompt(preset.text)}
                  className="px-2.5 py-1 rounded-lg bg-black/5 dark:bg-white/5 hover:bg-primary/10 hover:text-primary border border-border text-[11px] font-medium transition-all"
                >
                  ⚡ {preset.label}
                </button>
              ))}
            </div>

            <textarea
              rows={3}
              value={systemPrompt}
              onChange={(e) => setSystemPrompt(e.target.value)}
              className="w-full p-3 rounded-xl bg-black/5 dark:bg-white/5 border border-border text-sm text-text focus:outline-none focus:border-primary transition-colors leading-relaxed"
              placeholder="مثلا: تو یک دستیار مهربان هستی..."
            />
          </div>

          {/* Temperature */}
          <div className="space-y-3 p-4 rounded-xl bg-black/5 dark:bg-white/5 border border-border">
            <div className="flex items-center justify-between">
              <label className="font-semibold text-sm text-text flex items-center gap-2">
                <Sliders size={16} className="text-accent" />
                <span>دمای خلاقیت (Temperature): {temperature}</span>
              </label>
              <span className="text-xs px-2 py-0.5 rounded-md bg-accent/20 text-accent font-medium">
                {parseFloat(temperature) < 0.4 ? "دقیق و تحلیلی" : parseFloat(temperature) > 0.8 ? "بسیار خلاق و متنوع" : "متوازن و طبیعی"}
              </span>
            </div>
            <input
              type="range"
              min="0.0"
              max="1.0"
              step="0.1"
              value={temperature}
              onChange={(e) => setTemperature(e.target.value)}
              className="w-full accent-primary cursor-pointer h-2 bg-border rounded-lg"
            />
            <div className="flex justify-between text-[10px] text-text/50">
              <span>0.0 (دقیق و منطقی)</span>
              <span>0.5 (تعادل)</span>
              <span>1.0 (حداکثر خلاقیت)</span>
            </div>
          </div>

          {/* Memory Toggle */}
          <div className="flex items-center justify-between p-4 rounded-xl bg-black/5 dark:bg-white/5 border border-border">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center text-primary">
                <Database size={16} />
              </div>
              <div>
                <span className="font-semibold text-sm text-text block">حافظه بلندمدت هیبریدی (Long-Term Memory)</span>
                <span className="text-xs text-text/60">ذخیره خودکار تاریخچه در دیتابیس و یادآوری در گفتگوها</span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setMemoryEnabled(!memoryEnabled)}
              className={`w-12 h-6 rounded-full transition-colors relative p-1 flex items-center ${
                memoryEnabled ? "bg-primary" : "bg-border"
              }`}
            >
              <div
                className={`w-4 h-4 rounded-full bg-white transition-transform ${
                  memoryEnabled ? "-translate-x-6" : "translate-x-0"
                }`}
              />
            </button>
          </div>

          {/* Buttons */}
          <div className="pt-2 flex gap-3">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-3 px-6 bg-gradient-to-r from-primary to-secondary hover:opacity-95 text-white rounded-xl text-sm font-bold shadow-lg shadow-primary/25 transition-all flex items-center justify-center gap-2"
            >
              {loading ? (
                <span>در حال ذخیره...</span>
              ) : savedSuccess ? (
                <>
                  <Check size={18} />
                  <span>تنظیمات ذخیره شد!</span>
                </>
              ) : (
                <span>ذخیره و اعمال تنظیمات</span>
              )}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="py-3 px-5 bg-black/5 dark:bg-white/10 hover:bg-black/10 text-text rounded-xl text-sm font-medium"
            >
              انصراف
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

// ✅ export پیش‌فرض برای جلوگیری از خطا
export default SettingsModal;