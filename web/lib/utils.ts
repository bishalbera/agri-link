// lib/utils.ts
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format currency in Indian Rupees
 */
export function formatINR(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Format weight in kg or quintals
 */
export function formatWeight(kg: number): string {
  if (kg >= 100) {
    const quintals = kg / 100;
    return `${quintals.toFixed(1)} quintals`;
  }
  return `${kg} kg`;
}

/**
 * Calculate total value
 */
export function calculateTotal(quantityKg: number, pricePerQuintal: number): number {
  return (quantityKg / 100) * pricePerQuintal;
}

/**
 * Get status color classes
 */
export function getStatusColor(status: "NORMAL" | "WARNING" | "CRISIS"): {
  bg: string;
  text: string;
  border: string;
  icon: string;
} {
  switch (status) {
    case "CRISIS":
      return {
        bg: "bg-red-50",
        text: "text-red-800",
        border: "border-red-200",
        icon: "🚨",
      };
    case "WARNING":
      return {
        bg: "bg-amber-50",
        text: "text-amber-800",
        border: "border-amber-200",
        icon: "⚠️",
      };
    case "NORMAL":
    default:
      return {
        bg: "bg-green-50",
        text: "text-green-800",
        border: "border-green-200",
        icon: "✅",
      };
  }
}

/**
 * Translations (simple i18n)
 */
export const translations = {
  en: {
    appName: "Agri-Link",
    tagline: "Your Crop, Fair Price",
    sellNow: "Sell Now",
    dashboard: "Dashboard",
    status: {
      NORMAL: "Normal Market",
      WARNING: "Price Alert",
      CRISIS: "Crisis Mode",
    },
    quality: {
      A: "Premium Grade",
      B: "Standard Grade",
      C: "Processing Grade",
    },
    messages: {
      analyzing: "Analyzing your crop...",
      negotiating: "AI agents negotiating with buyers...",
      arranging: "Arranging logistics...",
      complete: "Sale completed!",
      crisisActivated: "Crisis Shield Activated!",
      crisisMessage: "Market prices have crashed. Finding alternative buyers.",
    },
  },
  hi: {
    appName: "एग्री-लिंक",
    tagline: "आपकी फसल, सही दाम",
    sellNow: "अभी बेचें",
    dashboard: "डैशबोर्ड",
    status: {
      NORMAL: "सामान्य बाज़ार",
      WARNING: "मूल्य चेतावनी",
      CRISIS: "संकट मोड",
    },
    quality: {
      A: "प्रीमियम ग्रेड",
      B: "मानक ग्रेड",
      C: "प्रसंस्करण ग्रेड",
    },
    messages: {
      analyzing: "आपकी फसल का विश्लेषण...",
      negotiating: "AI खरीदारों से बातचीत कर रहा है...",
      arranging: "लॉजिस्टिक्स की व्यवस्था...",
      complete: "बिक्री पूरी!",
      crisisActivated: "संकट शील्ड सक्रिय!",
      crisisMessage: "बाज़ार की कीमतें गिर गई हैं। वैकल्पिक खरीदार खोज रहे हैं।",
    },
  },
};

export type Language = keyof typeof translations;
export type TranslationKey = keyof typeof translations.en;

/**
 * Get translation
 */
export function t(key: string, lang: Language = "en"): string {
  const keys = key.split(".");
  let value: unknown = translations[lang];
  
  for (const k of keys) {
    if (value && typeof value === "object" && k in value) {
      value = (value as Record<string, unknown>)[k];
    } else {
      return key;
    }
  }
  
  return typeof value === "string" ? value : key;
}

/**
 * Generate unique ID
 */
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Delay utility for animations
 */
export function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
