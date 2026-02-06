import { useState } from "react";
import {
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Container,
  TextField,
  Typography,
  Alert,
} from "@mui/material";
import { PhotoCamera } from "@mui/icons-material";
import api from "../services/api";
import { useAuthStore } from "../stores/authStore";

export default function Profile() {
  const { user, updateProfile } = useAuthStore((state) => ({
    user: state.user,
    updateProfile: state.updateProfile,
  }));

  const [displayName, setDisplayName] = useState(user?.displayName || "");
  const [photoURL, setPhotoURL] = useState(user?.photoURL || "");
  const [profileError, setProfileError] = useState("");
  const [profileSuccess, setProfileSuccess] = useState("");

  const [profileLoading, setProfileLoading] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const handleProfileUpdate = async () => {
    setProfileError("");
    setProfileSuccess("");

    if (!displayName.trim()) {
      setProfileError("Inserisci un nome utente");
      return;
    }

    try {
      setProfileLoading(true);
      await updateProfile(displayName.trim(), photoURL.trim());
      setProfileSuccess("Profilo aggiornato con successo");
    } catch (err: any) {
      setProfileError(
        err.response?.data?.error ||
          "Errore durante l'aggiornamento del profilo",
      );
    } finally {
      setProfileLoading(false);
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        setProfileError("L'immagine deve essere inferiore a 2MB");
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setPhotoURL(result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async () => {
    setError("");
    setSuccess("");

    if (!currentPassword || !newPassword) {
      setError("Inserisci la password corrente e la nuova password");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Le nuove password non corrispondono");
      return;
    }

    try {
      setLoading(true);
      await api.post("/auth/change-password", {
        currentPassword,
        newPassword,
      });
      setSuccess("Password aggiornata con successo");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      setError(
        err.response?.data?.error || "Errore durante il cambio password",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="sm">
      <Box sx={{ py: 4 }}>
        <Typography variant="h4" gutterBottom>
          Profilo
        </Typography>
        <Typography color="text.secondary" mb={3}>
          Gestisci il tuo profilo e la password
        </Typography>

        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Informazioni Profilo
            </Typography>

            {profileError && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {profileError}
              </Alert>
            )}
            {profileSuccess && (
              <Alert severity="success" sx={{ mb: 2 }}>
                {profileSuccess}
              </Alert>
            )}

            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 2,
                mb: 3,
              }}
            >
              <Avatar
                src={photoURL}
                alt={displayName}
                sx={{ width: 100, height: 100 }}
              >
                {!photoURL && displayName[0]?.toUpperCase()}
              </Avatar>
              <input
                accept="image/*"
                style={{ display: "none" }}
                id="photo-upload"
                type="file"
                onChange={handleFileChange}
              />
              <label htmlFor="photo-upload">
                <Button
                  variant="outlined"
                  component="span"
                  startIcon={<PhotoCamera />}
                >
                  Carica Immagine
                </Button>
              </label>
            </Box>

            <TextField
              label="Nome Utente"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              fullWidth
              sx={{ mb: 2 }}
            />

            <Button
              variant="contained"
              onClick={handleProfileUpdate}
              fullWidth
              disabled={profileLoading}
            >
              {profileLoading ? "Salvataggio..." : "Salva Profilo"}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardContent sx={{ display: "grid", gap: 2 }}>
            <Typography variant="h6" gutterBottom>
              Cambio Password
            </Typography>

            {error && <Alert severity="error">{error}</Alert>}
            {success && <Alert severity="success">{success}</Alert>}

            <TextField
              label="Password Corrente"
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              fullWidth
            />
            <TextField
              label="Nuova Password"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              fullWidth
            />
            <TextField
              label="Conferma Nuova Password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              fullWidth
            />

            <Button
              variant="contained"
              onClick={handleSubmit}
              disabled={loading}
            >
              Aggiorna Password
            </Button>
          </CardContent>
        </Card>
      </Box>
    </Container>
  );
}
