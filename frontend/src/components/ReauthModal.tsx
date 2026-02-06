import { useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Typography,
  Alert,
  CircularProgress,
} from "@mui/material";
import { useAuthStore } from "../stores/authStore";

/**
 * Modal shown when the user is authenticated (token persisted)
 * but the encryption key was lost on page reload.
 * Asks for the password to re-derive the encryption key without full re-login.
 */
export default function ReauthModal() {
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const user = useAuthStore((state) => state.user);
  const rederiveKey = useAuthStore((state) => state.rederiveEncryptionKey);
  const logout = useAuthStore((state) => state.logout);

  const handleSubmit = async () => {
    if (!password.trim()) {
      setError("Inserisci la password");
      return;
    }

    setLoading(true);
    setError("");

    try {
      await rederiveKey(password);
    } catch (err) {
      setError("Errore nella derivazione della chiave. Riprova.");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSubmit();
    }
  };

  return (
    <Dialog open={true} maxWidth="xs" fullWidth>
      <DialogTitle>Sessione ripristinata</DialogTitle>
      <DialogContent>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          La tua sessione è stata ripristinata, ma la chiave di crittografia
          deve essere rigenerata. Inserisci la tua password per continuare.
        </Typography>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        <TextField
          label="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyDown={handleKeyDown}
          fullWidth
          autoFocus
          disabled={loading}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={handleLogout} disabled={loading}>
          Logout
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={loading}
          startIcon={loading ? <CircularProgress size={16} /> : undefined}
        >
          Conferma
        </Button>
      </DialogActions>
    </Dialog>
  );
}
