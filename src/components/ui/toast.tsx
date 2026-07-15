"use client";

import { createContext, useCallback, useContext, useState, type ReactNode } from "react";
import { CheckCircle, XCircle, AlertCircle, Info, X } from "lucide-react";
import { cn } from "@/lib/utils";

type ToastType = "success" | "error" | "warning" | "info";

interface Toast {
  id: number;
  type: ToastType;
  message: string;
}

interface ToastContextValue {
  toast: (type: ToastType, message: string) => void;
  confirm: (message: string) => Promise<boolean>;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}

const icons = {
  success: CheckCircle,
  error: XCircle,
  warning: AlertCircle,
  info: Info,
};

const colors = {
  success: "text-green-500",
  error: "text-red-500",
  warning: "text-amber-500",
  info: "text-blue-500",
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [confirmMsg, setConfirmMsg] = useState<string | null>(null);
  const [confirmResolve, setConfirmResolve] = useState<((v: boolean) => void) | null>(null);

  const toast = useCallback((type: ToastType, message: string) => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const confirm = useCallback((message: string) => {
    return new Promise<boolean>((resolve) => {
      setConfirmMsg(message);
      setConfirmResolve(() => resolve);
    });
  }, []);

  const resolveConfirm = (result: boolean) => {
    if (confirmResolve) confirmResolve(result);
    setConfirmMsg(null);
    setConfirmResolve(null);
  };

  return (
    <ToastContext.Provider value={{ toast, confirm }}>
      {children}

      {/* Toasts */}
      <div className="fixed bottom-4 left-4 z-[100] flex flex-col gap-2 max-w-sm">
        {toasts.map((t) => {
          const Icon = icons[t.type];
          return (
            <div
              key={t.id}
              className="flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-3 shadow-lg animate-fade-in"
            >
              <Icon className={cn("w-5 h-5 shrink-0", colors[t.type])} />
              <p className="text-sm text-foreground flex-1">{t.message}</p>
              <button
                onClick={() => setToasts((prev) => prev.filter((x) => x.id !== t.id))}
                className="text-muted-foreground hover:text-foreground shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          );
        })}
      </div>

      {/* Confirm dialog */}
      {confirmMsg && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="mx-4 max-w-sm rounded-2xl border border-border bg-card p-6 shadow-xl animate-fade-in">
            <div className="flex items-start gap-3 mb-4">
              <AlertCircle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
              <p className="text-sm text-foreground">{confirmMsg}</p>
            </div>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => resolveConfirm(false)}
                className="rounded-lg px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-muted transition-colors"
              >
                إلغاء
              </button>
              <button
                onClick={() => resolveConfirm(true)}
                className="rounded-lg bg-destructive px-4 py-2 text-sm font-medium text-white hover:opacity-90 transition-opacity"
              >
                تأكيد
              </button>
            </div>
          </div>
        </div>
      )}
    </ToastContext.Provider>
  );
}
