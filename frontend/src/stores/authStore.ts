import { create } from "zustand";
import { persist } from "zustand/middleware";
import api from "../services/api";

interface AuthState {
  isAuthenticated: boolean;
  user: { email: string; displayName?: string; photoURL?: string } | null;
  token: string | null;
  encryptionKey: CryptoKey | null;
  login: (
    email: string,
    password: string,
    token: string,
    displayName?: string,
    photoURL?: string,
  ) => Promise<void>;
  logout: () => void;
  setEncryptionKey: (key: CryptoKey) => void;
  rederiveEncryptionKey: (password: string) => Promise<void>;
  updateProfile: (displayName: string, photoURL: string) => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      isAuthenticated: false,
      user: null,
      token: null,
      encryptionKey: null,
      login: async (
        email: string,
        password: string,
        token: string,
        displayName?: string,
        photoURL?: string,
      ) => {
        // Deriva chiave di encryption dalla password
        const key = await deriveEncryptionKey(password, email);
        set({
          isAuthenticated: true,
          user: {
            email,
            displayName: displayName || "",
            photoURL: photoURL || "",
          },
          token,
          encryptionKey: key,
        });
      },
      logout: () => {
        set({
          isAuthenticated: false,
          user: null,
          token: null,
          encryptionKey: null,
        });
      },
      setEncryptionKey: (key: CryptoKey) => {
        set({ encryptionKey: key });
      },
      rederiveEncryptionKey: async (password: string) => {
        const state = useAuthStore.getState();
        if (!state.user?.email) {
          throw new Error("No user email available for key derivation");
        }
        const key = await deriveEncryptionKey(password, state.user.email);
        set({ encryptionKey: key });
      },
      updateProfile: async (displayName: string, photoURL: string) => {
        const response = await api.put("/auth/profile", {
          displayName,
          photoURL,
        });
        const data = response.data;
        set((state) => ({
          user: state.user
            ? {
                ...state.user,
                displayName: data.displayName,
                photoURL: data.photoURL,
              }
            : null,
        }));
      },
    }),
    {
      name: "auth-storage",
      partialize: (state) => ({
        isAuthenticated: state.isAuthenticated,
        user: state.user,
        token: state.token,
        // Non persistiamo la encryptionKey per sicurezza
      }),
    },
  ),
);

async function deriveEncryptionKey(
  password: string,
  salt: string,
): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const passwordBuffer = encoder.encode(password);
  const saltBuffer = encoder.encode(salt);

  // Importa password come chiave
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    passwordBuffer,
    "PBKDF2",
    false,
    ["deriveBits", "deriveKey"],
  );

  // Deriva chiave AES usando PBKDF2
  const key = await crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: saltBuffer,
      iterations: 100000,
      hash: "SHA-256",
    },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    true,
    ["encrypt", "decrypt"],
  );

  return key;
}
