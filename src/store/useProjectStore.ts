import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { PlanSheet, CustomEquipmentType, CustomCableType } from '../types';

interface ProjectState {
  projectId: string | null;
  setProjectId: (id: string | null) => void;
  
  sheets: PlanSheet[];
  history: PlanSheet[][];
  historyIndex: number;
  
  setSheets: (updater: PlanSheet[] | ((prev: PlanSheet[]) => PlanSheet[])) => void;
  undo: () => void;
  redo: () => void;
  
  customEquipmentTypes: CustomEquipmentType[];
  setCustomEquipmentTypes: (types: CustomEquipmentType[]) => void;
  
  customCableTypes: CustomCableType[];
  setCustomCableTypes: (types: CustomCableType[]) => void;
}

export const useProjectStore = create<ProjectState>()(
  persist(
    (set, get) => ({
      projectId: null,
      setProjectId: (id) => set({ projectId: id }),
      
      sheets: [],
      history: [[]],
      historyIndex: 0,
      
      setSheets: (updater) => set((state) => {
        const nextSheets = typeof updater === 'function' ? updater(state.sheets) : updater;
        const newHistory = state.history.slice(0, state.historyIndex + 1);
        return {
          sheets: nextSheets,
          history: [...newHistory, nextSheets],
          historyIndex: newHistory.length,
        };
      }),
      
      undo: () => set((state) => {
        if (state.historyIndex > 0) {
          const newIndex = state.historyIndex - 1;
          return {
            historyIndex: newIndex,
            sheets: state.history[newIndex],
          };
        }
        return state;
      }),
      
      redo: () => set((state) => {
        if (state.historyIndex < state.history.length - 1) {
          const newIndex = state.historyIndex + 1;
          return {
            historyIndex: newIndex,
            sheets: state.history[newIndex],
          };
        }
        return state;
      }),
      
      customEquipmentTypes: [],
      setCustomEquipmentTypes: (types) => set({ customEquipmentTypes: types }),
      
      customCableTypes: [],
      setCustomCableTypes: (types) => set({ customCableTypes: types }),
    }),
    {
      name: 'voltplan-pro-unified-store',
      storage: createJSONStorage(() => localStorage),
      // Only persist certain fields
      partialize: (state) => ({
        projectId: state.projectId,
        sheets: state.sheets,
        customEquipmentTypes: state.customEquipmentTypes,
        customCableTypes: state.customCableTypes
      }),
    }
  )
);
