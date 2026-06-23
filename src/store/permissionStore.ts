import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface Permission {
  id: string;
  name: string;
  description: string;
  granted: boolean;
  expiresAt?: string | null;
}

interface PermissionState {
  permissions: Permission[];
  requestPermission: (id: string, name: string, description: string) => Promise<boolean>;
  revokePermission: (id: string) => void;
  checkPermission: (id: string) => boolean;
  
  // Pending request state for UI dialog
  pendingRequest: {
    id: string;
    name: string;
    description: string;
    resolve: (granted: boolean) => void;
  } | null;
  resolvePendingRequest: (granted: boolean) => void;
  
  isAutomationActive: boolean;
  setAutomationActive: (active: boolean) => void;
}

export const usePermissionStore = create<PermissionState>()(
  persist(
    (set, get) => ({
      permissions: [
        { id: 'camera', name: 'Camera Access', description: 'Allow IRIS to view your camera feed.', granted: false },
        { id: 'screen', name: 'Screen Share', description: 'Allow IRIS to view your screen.', granted: false },
        { id: 'shell', name: 'Shell Execution', description: 'Allow IRIS to run terminal commands.', granted: false },
        { id: 'automation', name: 'OS Automation', description: 'Allow IRIS to control keyboard, mouse, and apps.', granted: false },
        { id: 'screenshot', name: 'Screenshots', description: 'Allow IRIS to take screenshots of your display.', granted: false },
      ],
      pendingRequest: null,
      
      requestPermission: (id, name, description) => {
        const state = get();
        const existing = state.permissions.find(p => p.id === id);
        
        if (existing && existing.granted) {
          // Check expiration? Let's just say true if granted
          return Promise.resolve(true);
        }
        
        // Add if not exists
        if (!existing) {
          set(s => ({
            permissions: [...s.permissions, { id, name, description, granted: false }]
          }));
        }
        
        return new Promise<boolean>((resolve) => {
           set({ 
             pendingRequest: { id, name, description, resolve }
           });
        });
      },
      
      revokePermission: (id) => {
        set(state => ({
          permissions: state.permissions.map(p => p.id === id ? { ...p, granted: false } : p)
        }));
      },
      
      checkPermission: (id) => {
        const p = get().permissions.find(p => p.id === id);
        return p ? p.granted : false;
      },
      
      resolvePendingRequest: (granted) => {
        const state = get();
        if (state.pendingRequest) {
          const { id } = state.pendingRequest;
          state.pendingRequest.resolve(granted);
          
          set(s => ({
            pendingRequest: null,
            permissions: s.permissions.map(p => p.id === id ? { ...p, granted } : p)
          }));
        }
      },
      
      isAutomationActive: false,
      setAutomationActive: (active) => set({ isAutomationActive: active })
    }),
    {
      name: 'iris-permissions-storage',
      partialize: (state) => ({ permissions: state.permissions }), // Only persist permissions array
    }
  )
);
