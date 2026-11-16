"use client";

import { Toaster } from "sonner";
import {
  AlertTriangle,
  CheckCircle2,
  Info,
  Loader2,
  XCircle,
} from "lucide-react";

/**
 * Premium, theme-aware toast notifications.
 * Used once in the root layout so every success/error/info message shares the
 * same refined visual language.
 */
export function PremiumToaster() {
  return (
    <Toaster
      position="top-center"
      theme="system"
      expand={false}
      closeButton
      duration={4200}
      gap={12}
      offset={20}
      icons={{
        success: <CheckCircle2 className="h-5 w-5" />,
        error: <XCircle className="h-5 w-5" />,
        warning: <AlertTriangle className="h-5 w-5" />,
        info: <Info className="h-5 w-5" />,
        loading: <Loader2 className="h-5 w-5 animate-spin" />,
      }}
      toastOptions={{
        unstyled: false,
        classNames: {
          toast:
            "group relative flex w-[min(92vw,420px)] items-start gap-3 rounded-2xl border border-stone-200/80 bg-white/95 px-4 py-3.5 pr-10 text-stone-900 shadow-[0_20px_55px_-18px_rgba(15,23,42,0.35)] backdrop-blur-xl transition-all dark:border-white/10 dark:bg-stone-950/92 dark:text-stone-50",
          title: "text-sm font-bold leading-snug tracking-tight",
          description:
            "mt-0.5 text-xs font-medium leading-relaxed text-stone-500 dark:text-stone-400",
          icon: "mt-0.5 shrink-0",
          closeButton:
            "absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full border border-stone-200/80 bg-white/80 text-stone-400 opacity-0 transition-all hover:bg-stone-100 hover:text-stone-700 group-hover:opacity-100 dark:border-white/10 dark:bg-white/5 dark:text-stone-500 dark:hover:bg-white/10 dark:hover:text-stone-200",
          actionButton:
            "rounded-full bg-stone-900 px-3 py-1 text-xs font-bold text-white dark:bg-white dark:text-stone-900",
          cancelButton:
            "rounded-full bg-stone-100 px-3 py-1 text-xs font-bold text-stone-700 dark:bg-white/10 dark:text-stone-200",
          success:
            "border-emerald-200/80 [&_[data-icon]]:text-emerald-600 dark:border-emerald-500/25 dark:[&_[data-icon]]:text-emerald-400",
          error:
            "border-rose-200/80 [&_[data-icon]]:text-rose-600 dark:border-rose-500/25 dark:[&_[data-icon]]:text-rose-400",
          warning:
            "border-amber-200/80 [&_[data-icon]]:text-amber-600 dark:border-amber-500/25 dark:[&_[data-icon]]:text-amber-400",
          info: "border-sky-200/80 [&_[data-icon]]:text-sky-600 dark:border-sky-500/25 dark:[&_[data-icon]]:text-sky-400",
          loading:
            "border-stone-200/80 [&_[data-icon]]:text-stone-500 dark:border-white/10 dark:[&_[data-icon]]:text-stone-300",
        },
      }}
    />
  );
}
