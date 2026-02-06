import { useState } from "react";
import {
  Box,
  Button,
  Container,
  Paper,
  TextField,
  Typography,
  Alert,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
} from "@mui/material";
import { useAuthStore } from "../stores/authStore";
import api from "../services/api";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [resetPassword, setResetPassword] = useState("");
  const [resetStatus, setResetStatus] = useState("");
  const login = useAuthStore((state) => state.login);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const endpoint = isRegistering ? "/auth/register" : "/auth/login";
      const response = await api.post(endpoint, { email, password });
      const { token, user } = response.data;

      await login(email, password, token, user?.displayName, user?.photoURL);
    } catch (err: any) {
      const action = isRegistering ? "registrazione" : "login";
      setError(err.response?.data?.message || `Errore durante il ${action}`);
    } finally {
      setLoading(false);
    }
  };

  const handleRequestReset = async () => {
    setResetStatus("");
    try {
      const response = await api.post("/auth/request-reset", {
        email: resetEmail,
      });
      setResetToken(response.data.token || "");
      setResetStatus("Token generato. Inserisci la nuova password.");
    } catch (err: any) {
      setResetStatus(
        err.response?.data?.error || "Errore durante la richiesta reset",
      );
    }
  };

  const handleResetPassword = async () => {
    setResetStatus("");
    try {
      await api.post("/auth/reset-password", {
        email: resetEmail,
        token: resetToken,
        newPassword: resetPassword,
      });
      setResetStatus("Password resettata con successo");
      setResetOpen(false);
    } catch (err: any) {
      setResetStatus(
        err.response?.data?.error || "Errore durante il reset password",
      );
    }
  };

  return (
    <>
      <Box
        sx={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background:
            "radial-gradient(circle at top, rgba(37,99,235,0.18), transparent 45%), linear-gradient(180deg, #f1f7ff 0%, #f8fbff 60%, #ffffff 100%)",
          px: 2,
        }}
      >
        <Container maxWidth="sm">
          <Paper
            elevation={0}
            sx={{
              p: { xs: 3, sm: 4 },
              width: "100%",
              borderRadius: 4,
              border: "1px solid rgba(37, 99, 235, 0.12)",
              boxShadow: "0 20px 40px rgba(37, 99, 235, 0.15)",
              background: "rgba(255,255,255,0.92)",
              backdropFilter: "blur(6px)",
            }}
          >
            <Typography variant="h4" component="h1" gutterBottom align="center">
              Fringo Tracker
            </Typography>
            <Typography
              variant="body2"
              color="text.secondary"
              align="center"
              mb={3}
            >
              Gestione Patrimonio Personale
            </Typography>

            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}

            <form onSubmit={handleSubmit}>
              <TextField
                fullWidth
                label="Email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                margin="normal"
                required
                autoFocus
              />
              <TextField
                fullWidth
                label="Password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                margin="normal"
                required
              />
              <Button
                type="submit"
                fullWidth
                variant="contained"
                size="large"
                disabled={loading}
                sx={{ mt: 3, py: 1.2 }}
              >
                {loading
                  ? isRegistering
                    ? "Registrazione..."
                    : "Accesso..."
                  : isRegistering
                    ? "Registrati"
                    : "Accedi"}
              </Button>
              <Button
                fullWidth
                variant="text"
                sx={{ mt: 1 }}
                onClick={() => {
                  setIsRegistering(!isRegistering);
                  setError("");
                }}
              >
                {isRegistering
                  ? "Hai già un account? Accedi"
                  : "Non hai un account? Registrati"}
              </Button>
              {!isRegistering && (
                <Button
                  fullWidth
                  variant="text"
                  sx={{ mt: 1 }}
                  onClick={() => setResetOpen(true)}
                >
                  Password dimenticata?
                </Button>
              )}
            </form>
          </Paper>
        </Container>
      </Box>

      <Dialog open={resetOpen} onClose={() => setResetOpen(false)}>
        <DialogTitle>Reset Password</DialogTitle>
        <DialogContent sx={{ display: "grid", gap: 2, pt: 2 }}>
          {resetStatus && <Alert severity="info">{resetStatus}</Alert>}
          <TextField
            label="Email"
            type="email"
            value={resetEmail}
            onChange={(e) => setResetEmail(e.target.value)}
            fullWidth
          />
          <TextField
            label="Token"
            value={resetToken}
            onChange={(e) => setResetToken(e.target.value)}
            fullWidth
          />
          <TextField
            label="Nuova Password"
            type="password"
            value={resetPassword}
            onChange={(e) => setResetPassword(e.target.value)}
            fullWidth
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setResetOpen(false)}>Chiudi</Button>
          <Button onClick={handleRequestReset}>Richiedi Token</Button>
          <Button variant="contained" onClick={handleResetPassword}>
            Reset Password
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
