import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface AuditLog {
  id: string;
  timestamp: string;
  action: string;
  details: any;
  status: 'success' | 'failed' | 'denied';
}

interface AuditState {
  logs: AuditLog[];
  logAction: (action: string, details: any, status: 'success' | 'failed' | 'denied') => void;
  clearLogs: () => void;
}

export const useAuditStore = create<AuditState>()(
  persist(
    (set) => ({
      logs: [],
      logAction: (action, details, status) => set((state) => ({
        logs: [
          {
            id: Math.random().toString(36).substring(2, 9),
            timestamp: new Date().toISOString(),
            action,
            details,
            status
          },
          ...state.logs
        ].slice(0, 500) // Keep last 500 logs
      })),
      clearLogs: () => set({ logs: [] })
    }),
    {
      name: 'iris-audit-storage'
    }
  )
);
