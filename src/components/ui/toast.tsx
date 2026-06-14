"use client";

import { createContext, useContext, useState, useCallback } from "react";
import { cn } from "@/lib/utils";
import { CheckCircle2, XCircle, AlertTriangle, X } from "lucide-react";

type ToastType = "success" | "error" | "warning";

interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextType {
  toast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType>({ toast: () => {} });

export function useToast() {
  return useContext(ToastContext);
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((message: string, type: ToastType = "success") => {
    const id = Math.random().toString(36).slice(2);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ toast: addToast }}>
      {children}
      {/* Toast Container */}
      <div className="fixed bottom-4 right-4 z-[100] space-y-2 max-w-sm">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={cn(
              "flex items-center gap-2.5 rounded-lg border px-4 py-3 shadow-elevated animate-in slide-in-from-bottom-2",
              t.type === "success" && "bg-emerald-50 border-emerald-200 text-emerald-800",
              t.type === "error" && "bg-red-50 border-red-200 text-red-800",
              t.type === "warning" && "bg-amber-50 border-amber-200 text-amber-800"
            )}
          >
            {t.type === "success" && <CheckCircle2 className="h-4 w-4 flex-shrink-0" />}
            {t.type === "error" && <XCircle className="h-4 w-4 flex-shrink-0" />}
            {t.type === "warning" && <AlertTriangle className="h-4 w-4 flex-shrink-0" />}
            <span className="text-sm font-medium flex-1">{t.message}</span>
            <button onClick={() => removeToast(t.id)} className="text-current opacity-50 hover:opacity-100">
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
