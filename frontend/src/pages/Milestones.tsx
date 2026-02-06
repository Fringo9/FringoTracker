import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  Chip,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  Typography,
  MenuItem,
  IconButton,
  Alert,
  CircularProgress,
  Stack,
} from "@mui/material";
import { Add, Delete, Edit, Event } from "@mui/icons-material";
import api from "../services/api";

const EVENT_TYPES = [
  { value: "job_change", label: "Cambio lavoro" },
  { value: "purchase", label: "Acquisto" },
  { value: "investment", label: "Investimento" },
  { value: "debt_paid", label: "Debito estinto" },
  { value: "other", label: "Altro" },
];

interface MilestoneFormData {
  id?: string;
  date: string;
  title: string;
  description: string;
  eventType: string;
  icon?: string;
}

export default function Milestones() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState<MilestoneFormData>({
    date: "",
    title: "",
    description: "",
    eventType: "other",
  });

  const {
    data: milestones,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["milestones"],
    queryFn: async () => {
      const response = await api.get("/milestones");
      return response.data;
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (data: MilestoneFormData) => {
      if (data.id) {
        await api.put(`/milestones/${data.id}`, data);
      } else {
        await api.post("/milestones", data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["milestones"] });
      setDialogOpen(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/milestones/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["milestones"] });
    },
  });

  const handleOpenNew = () => {
    setFormData({
      date: "",
      title: "",
      description: "",
      eventType: "other",
    });
    setDialogOpen(true);
  };

  const handleOpenEdit = (row: any) => {
    setFormData({
      id: row.id,
      date: row.date ? row.date.slice(0, 10) : "",
      title: row.title || "",
      description: row.description || "",
      eventType: row.eventType || "other",
      icon: row.icon || "",
    });
    setDialogOpen(true);
  };

  const handleSave = () => {
    if (!formData.title || !formData.date) return;
    saveMutation.mutate(formData);
  };

  const sortedMilestones = useMemo(() => {
    if (!milestones || milestones.length === 0) return [];
    return [...milestones].sort(
      (a: any, b: any) =>
        new Date(b.date).getTime() - new Date(a.date).getTime(),
    );
  }, [milestones]);

  if (isLoading) {
    return (
      <Container maxWidth="xl">
        <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="xl">
        <Box sx={{ py: 4 }}>
          <Alert severity="error">Errore nel caricamento milestone</Alert>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl">
      <Box sx={{ py: 4 }}>
        <Stack
          direction={{ xs: "column", md: "row" }}
          alignItems={{ xs: "flex-start", md: "center" }}
          justifyContent="space-between"
          spacing={2}
          sx={{ mb: 3 }}
        >
          <Box>
            <Typography variant="h4" gutterBottom>
              Milestone
            </Typography>
            <Typography color="text.secondary">
              Eventi importanti che influenzano il patrimonio
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={handleOpenNew}
          >
            Nuova Milestone
          </Button>
        </Stack>

        {sortedMilestones.length === 0 ? (
          <Alert severity="info">
            Nessuna milestone trovata. Crea la prima milestone.
          </Alert>
        ) : (
          <Box
            sx={{
              display: "grid",
              gap: 2,
              gridTemplateColumns: {
                xs: "1fr",
                md: "repeat(2, 1fr)",
                lg: "repeat(3, 1fr)",
              },
            }}
          >
            {sortedMilestones.map((milestone: any) => {
              const eventLabel =
                EVENT_TYPES.find((t) => t.value === milestone.eventType)
                  ?.label || milestone.eventType;
              const dateLabel = milestone.date
                ? new Date(milestone.date).toLocaleDateString("it-IT")
                : "N/A";

              return (
                <Card
                  key={milestone.id}
                  variant="outlined"
                  sx={{
                    borderRadius: 3,
                    borderColor: "rgba(37, 99, 235, 0.12)",
                    background:
                      "linear-gradient(180deg, rgba(37,99,235,0.06) 0%, rgba(255,255,255,1) 60%)",
                  }}
                >
                  <CardContent>
                    <Box
                      sx={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        textAlign: "center",
                        mb: 2,
                      }}
                    >
                      <Box
                        sx={{
                          p: 1.5,
                          borderRadius: 3,
                          bgcolor: "primary.main",
                          color: "white",
                          mb: 2,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: "56px",
                        }}
                      >
                        <Event />
                      </Box>
                      <Box sx={{ width: "100%" }}>
                        <Typography
                          variant="h6"
                          noWrap
                          component="div"
                          sx={{ fontWeight: 700, mb: 0.5 }}
                        >
                          {milestone.title}
                        </Typography>
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{ mb: 1 }}
                        >
                          {dateLabel}
                        </Typography>
                        {milestone.description && (
                          <Typography
                            variant="body2"
                            color="text.secondary"
                            sx={{ mb: 2 }}
                          >
                            {milestone.description}
                          </Typography>
                        )}
                        <Chip
                          label={eventLabel}
                          color="primary"
                          variant="outlined"
                          size="small"
                        />
                      </Box>
                    </Box>
                  </CardContent>
                  <CardActions
                    sx={{
                      px: 2,
                      pb: 2,
                      pt: 0,
                      gap: 0.5,
                      justifyContent: "center",
                    }}
                  >
                    <Button
                      size="small"
                      startIcon={<Edit />}
                      onClick={() => handleOpenEdit(milestone)}
                    >
                      Modifica
                    </Button>
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => deleteMutation.mutate(milestone.id)}
                      title="Elimina"
                    >
                      <Delete />
                    </IconButton>
                  </CardActions>
                </Card>
              );
            })}
          </Box>
        )}

        <Dialog
          open={dialogOpen}
          onClose={() => setDialogOpen(false)}
          maxWidth="sm"
          fullWidth
          PaperProps={{
            sx: {
              borderRadius: 3,
              backgroundColor: "white",
              border: "1px solid rgba(37, 99, 235, 0.12)",
            },
          }}
        >
          <DialogTitle
            sx={{
              textAlign: "center",
              pt: 4,
              pb: 4,
              mb: 0,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 1.5,
            }}
          >
            <Box
              sx={{
                p: 1.5,
                borderRadius: 3,
                bgcolor: "primary.main",
                color: "white",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "56px",
              }}
            >
              <Event />
            </Box>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              {formData.id ? "Modifica Milestone" : "Nuova Milestone"}
            </Typography>
          </DialogTitle>
          <DialogContent
            sx={{
              display: "flex",
              flexDirection: "column",
              gap: 2,
              pt: 6,
              pb: 3,
              px: 3,
            }}
          >
            <TextField
              label="Data"
              type="date"
              value={formData.date}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, date: e.target.value }))
              }
              InputLabelProps={{ shrink: true }}
              fullWidth
            />
            <TextField
              label="Titolo"
              value={formData.title}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, title: e.target.value }))
              }
              fullWidth
            />
            <TextField
              label="Descrizione"
              value={formData.description}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  description: e.target.value,
                }))
              }
              fullWidth
              multiline
              minRows={3}
            />
            <TextField
              label="Tipo"
              select
              value={formData.eventType}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, eventType: e.target.value }))
              }
              fullWidth
            >
              {EVENT_TYPES.map((type) => (
                <MenuItem key={type.value} value={type.value}>
                  {type.label}
                </MenuItem>
              ))}
            </TextField>
          </DialogContent>
          <DialogActions
            sx={{
              gap: 1,
              p: 2,
              justifyContent: "flex-end",
            }}
          >
            <Button
              onClick={() => setDialogOpen(false)}
              variant="outlined"
              sx={{
                textTransform: "none",
                fontSize: "1rem",
                borderColor: "rgba(37, 99, 235, 0.3)",
                color: "text.primary",
                "&:hover": {
                  borderColor: "primary.main",
                  backgroundColor: "rgba(37, 99, 235, 0.05)",
                },
              }}
            >
              Annulla
            </Button>
            <Button
              variant="contained"
              onClick={handleSave}
              sx={{
                textTransform: "none",
                fontSize: "1rem",
              }}
            >
              Salva
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Container>
  );
}
