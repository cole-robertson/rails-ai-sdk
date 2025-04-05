import { create } from 'zustand';

interface BlockState {
  isVisible: boolean;
  toggleVisibility: () => void;
  setVisibility: (isVisible: boolean) => void;
}

export const useBlockSelector = create<BlockState>((set) => ({
  isVisible: false,
  toggleVisibility: () => set((state) => ({ isVisible: !state.isVisible })),
  setVisibility: (isVisible: boolean) => set({ isVisible }),
})); 