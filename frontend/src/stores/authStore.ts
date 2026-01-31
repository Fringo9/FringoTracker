import { create } from "zustand";
import { persist } from "zustand/middleware";

interface AuthState {
  isAuthenticated: boolean;
  user: { email: string } | null;
  token: string | null;
  encryptionKey: CryptoKey | null;
  login: (email: string, password: string, token: string) => Promise<void>;
  logout: () => void;
  setEncryptionKey: (key: CryptoKey) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      isAuthenticated: false,
      user: null,
      token: null,
      encryptionKey: null,
      login: async (email: string, password: string, token: string) => {
        // Deriva chiave di encryption dalla password
        const key = await deriveEncryptionKey(password, email);
        set({
          isAuthenticated: true,
          user: { email },
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
