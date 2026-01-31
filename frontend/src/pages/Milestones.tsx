import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Box,
  Button,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  Typography,
  MenuItem,
  IconButton,
  Paper,
  Alert,
  CircularProgress,
} from "@mui/material";
import { DataGrid, GridColDef } from "@mui/x-data-grid";
import { Add, Delete, Edit } from "@mui/icons-material";
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

  const columns: GridColDef[] = useMemo(
    () => [
      {
        field: "date",
        headerName: "Data",
        width: 140,
        valueFormatter: (params) => {
          const value = params.value;
          return value ? new Date(value).toLocaleDateString("it-IT") : "N/A";
        },
      },
      { field: "title", headerName: "Titolo", flex: 1, minWidth: 180 },
      {
        field: "eventType",
        headerName: "Tipo",
        width: 160,
        valueFormatter: (params) => {
          const value = params.value as string;
          return EVENT_TYPES.find((t) => t.value === value)?.label || value;
        },
      },
      {
        field: "description",
        headerName: "Descrizione",
        flex: 1,
        minWidth: 220,
      },
      {
        field: "actions",
        headerName: "Azioni",
        width: 120,
        sortable: false,
        renderCell: (params) => (
          <Box>
            <IconButton size="small" onClick={() => handleOpenEdit(params.row)}>
              <Edit />
            </IconButton>
            <IconButton
              size="small"
              color="error"
              onClick={() => deleteMutation.mutate(params.row.id)}
            >
              <Delete />
            </IconButton>
          </Box>
        ),
      },
    ],
    [deleteMutation],
  );

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
        <Box sx={{ display: "flex", justifyContent: "space-between", mb: 3 }}>
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
        </Box>

        <Paper sx={{ height: 600, width: "100%" }}>
          <DataGrid
            rows={milestones || []}
            columns={columns}
            pageSizeOptions={[10, 25, 50]}
            disableRowSelectionOnClick
            initialState={{
              pagination: { paginationModel: { pageSize: 25 } },
              sorting: { sortModel: [{ field: "date", sort: "desc" }] },
            }}
          />
        </Paper>

        <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)}>
          <DialogTitle>
            {formData.id ? "Modifica Milestone" : "Nuova Milestone"}
          </DialogTitle>
          <DialogContent sx={{ display: "grid", gap: 2, pt: 2 }}>
            <TextField
              label="Data"
              type="date"
              value={formData.date}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, date: e.target.value }))
              }
              InputLabelProps={{ shrink: true }}
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
            >
              {EVENT_TYPES.map((type) => (
                <MenuItem key={type.value} value={type.value}>
                  {type.label}
                </MenuItem>
              ))}
            </TextField>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDialogOpen(false)}>Annulla</Button>
            <Button variant="contained" onClick={handleSave}>
              Salva
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Container>
  );
}
