"use client";

import { useState, useCallback } from "react";

type ToastProps = {
  title?: string;
  description?: string;
  variant?: "default" | "destructive";
  duration?: number;
};

type Toast = ToastProps & {
  id: string;
};

// Create a single instance of the toast state
let toasts: Toast[] = [];
let listeners: Function[] = [];

// Function to notify all listeners of state changes
const notifyListeners = () => {
  listeners.forEach((listener) => listener(toasts));
};

export function useToast() {
  const [state, setState] = useState<Toast[]>(toasts);

  // Register this component as a listener
  useCallback(() => {
    const listener = (newToasts: Toast[]) => {
      setState([...newToasts]);
    };

    listeners.push(listener);
    return () => {
      listeners = listeners.filter((l) => l !== listener);
    };
  }, []);

  const toast = useCallback(
    ({
      title,
      description,
      variant = "default",
      duration = 3000,
    }: ToastProps) => {
      const id = Math.random().toString(36).substring(2, 9);
      const newToast = { id, title, description, variant, duration };

      toasts = [...toasts, newToast];
      notifyListeners();

      // Auto-dismiss
      setTimeout(() => {
        dismiss(id);
      }, duration);

      return id;
    },
    [],
  );

  const dismiss = useCallback((id: string) => {
    toasts = toasts.filter((t) => t.id !== id);
    notifyListeners();
  }, []);

  return { toast, dismiss, toasts: state };
}
