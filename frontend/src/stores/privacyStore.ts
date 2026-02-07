import { create } from "zustand";
import { persist } from "zustand/middleware";

interface PrivacyState {
  isObscured: boolean;
  toggleObscured: () => void;
}

export const usePrivacyStore = create<PrivacyState>()(
  persist(
    (set) => ({
      isObscured: false,
      toggleObscured: () => set((state) => ({ isObscured: !state.isObscured })),
    }),
    {
      name: "privacy-storage",
    },
  ),
);
