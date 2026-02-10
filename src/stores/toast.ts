import { atom } from 'nanostores';

export type ToastType = 'info' | 'success' | 'warning' | 'error' | 'loading';

export interface Toast {
    id: string;
    message: string;
    type: ToastType;
    duration?: number; // ms, if 0 or undefined, stays until closed or replaced
    progress?: number; // 0-100, if present, shows progress bar
}

export const toasts = atom<Toast[]>([]);

export const addToast = (toast: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).substring(2, 9);
    const newToast = { ...toast, id };
    toasts.set([...toasts.get(), newToast]);

    if (toast.duration && toast.duration > 0) {
        setTimeout(() => removeToast(id), toast.duration);
    }
    return id;
};

export const updateToast = (id: string, updates: Partial<Toast>) => {
    const current = toasts.get();
    const idx = current.findIndex(t => t.id === id);
    if (idx !== -1) {
        const updated = [...current];
        updated[idx] = { ...updated[idx], ...updates };
        toasts.set(updated);
    }
};

export const removeToast = (id: string) => {
    toasts.set(toasts.get().filter(t => t.id !== id));
};
