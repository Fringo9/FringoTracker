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
import {
  Add,
  Delete,
  Edit,
  ArrowUpward,
  ArrowDownward,
} from "@mui/icons-material";
import api from "../services/api";
import { CategoryType, PREDEFINED_CATEGORIES } from "../types";

const CATEGORY_TYPES = [
  { value: CategoryType.WALLET, label: "Portafoglio" },
  { value: CategoryType.BANK, label: "Banca" },
  { value: CategoryType.INVESTMENT, label: "Investimenti" },
  { value: CategoryType.DEBT, label: "Debiti" },
  { value: CategoryType.CREDIT, label: "Crediti" },
  { value: CategoryType.SHARED, label: "Condivise" },
  { value: CategoryType.OTHER, label: "Altro" },
];

interface CategoryFormData {
  id?: string;
  name: string;
  categoryType: CategoryType;
  sortOrder: number;
}

export default function Categories() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState<CategoryFormData>({
    name: "",
    categoryType: CategoryType.WALLET,
    sortOrder: 1,
  });

  const {
    data: categories,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["category-definitions"],
    queryFn: async () => {
      const response = await api.get("/category-definitions");
      return response.data;
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (data: CategoryFormData) => {
      await api.post("/category-definitions/bulk", [data]);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["category-definitions"] });
      setDialogOpen(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/category-definitions/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["category-definitions"] });
    },
  });

  const reorderMutation = useMutation({
    mutationFn: async (items: { id: string; sortOrder: number }[]) => {
      await api.post("/category-definitions/reorder", items);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["category-definitions"] });
    },
  });

  const seedMutation = useMutation({
    mutationFn: async () => {
      const payload = PREDEFINED_CATEGORIES.map((cat) => ({
        name: cat.name,
        categoryType: cat.type,
        sortOrder: cat.sortOrder,
      }));
      await api.post("/category-definitions/bulk", payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["category-definitions"] });
    },
  });

  const handleOpenNew = () => {
    const maxSort =
      categories && categories.length > 0
        ? Math.max(...categories.map((c: any) => c.sortOrder || 0)) + 1
        : 1;
    setFormData({
      name: "",
      categoryType: CategoryType.WALLET,
      sortOrder: maxSort,
    });
    setDialogOpen(true);
  };

  const handleOpenEdit = (row: any) => {
    setFormData({
      id: row.id,
      name: row.name,
      categoryType: row.categoryType,
      sortOrder: row.sortOrder,
    });
    setDialogOpen(true);
  };

  const handleSave = () => {
    if (!formData.name) return;
    saveMutation.mutate(formData);
  };

  const moveCategory = (id: string, direction: "up" | "down") => {
    if (!categories || categories.length === 0) return;

    const sorted = [...categories].sort(
      (a: any, b: any) => (a.sortOrder || 0) - (b.sortOrder || 0),
    );
    const index = sorted.findIndex((c: any) => c.id === id);
    const swapIndex = direction === "up" ? index - 1 : index + 1;

    if (index === -1 || swapIndex < 0 || swapIndex >= sorted.length) return;

    const current = sorted[index];
    const target = sorted[swapIndex];

    const updated = sorted.map((item: any) => {
      if (item.id === current.id) {
        return { ...item, sortOrder: target.sortOrder };
      }
      if (item.id === target.id) {
        return { ...item, sortOrder: current.sortOrder };
      }
      return item;
    });

    reorderMutation.mutate(
      updated.map((item: any) => ({ id: item.id, sortOrder: item.sortOrder })),
    );
  };

  const columns: GridColDef[] = useMemo(
    () => [
      { field: "name", headerName: "Nome", flex: 1, minWidth: 200 },
      {
        field: "categoryType",
        headerName: "Tipo",
        width: 160,
        valueFormatter: (params) => {
          const value = params.value as string;
          return CATEGORY_TYPES.find((t) => t.value === value)?.label || value;
        },
      },
      {
        field: "sortOrder",
        headerName: "Ordine",
        width: 120,
      },
      {
        field: "actions",
        headerName: "Azioni",
        width: 160,
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
            <IconButton
              size="small"
              onClick={() => moveCategory(params.row.id, "up")}
            >
              <ArrowUpward fontSize="inherit" />
            </IconButton>
            <IconButton
              size="small"
              onClick={() => moveCategory(params.row.id, "down")}
            >
              <ArrowDownward fontSize="inherit" />
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
          <Alert severity="error">Errore nel caricamento categorie</Alert>
        </Box>
      </Container>
    );
  }

  const hasCategories = categories && categories.length > 0;

  return (
    <Container maxWidth="xl">
      <Box sx={{ py: 4 }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", mb: 3 }}>
          <Box>
            <Typography variant="h4" gutterBottom>
              Categorie
            </Typography>
            <Typography color="text.secondary">
              Gestisci e riordina le categorie predefinite
            </Typography>
          </Box>
          <Box sx={{ display: "flex", gap: 2 }}>
            {!hasCategories && (
              <Button variant="outlined" onClick={() => seedMutation.mutate()}>
                Inizializza categorie
              </Button>
            )}
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={handleOpenNew}
            >
              Nuova Categoria
            </Button>
          </Box>
        </Box>

        {!hasCategories && (
          <Alert severity="info" sx={{ mb: 2 }}>
            Nessuna categoria trovata. Puoi inizializzare le 21 categorie
            predefinite o crearne di nuove.
          </Alert>
        )}

        <Paper sx={{ height: 600, width: "100%" }}>
          <DataGrid
            rows={categories || []}
            columns={columns}
            pageSizeOptions={[10, 25, 50]}
            disableRowSelectionOnClick
            initialState={{
              pagination: { paginationModel: { pageSize: 25 } },
              sorting: { sortModel: [{ field: "sortOrder", sort: "asc" }] },
            }}
          />
        </Paper>

        <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)}>
          <DialogTitle>
            {formData.id ? "Modifica Categoria" : "Nuova Categoria"}
          </DialogTitle>
          <DialogContent sx={{ display: "grid", gap: 2, pt: 2 }}>
            <TextField
              label="Nome"
              value={formData.name}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, name: e.target.value }))
              }
              fullWidth
            />
            <TextField
              label="Tipo"
              select
              value={formData.categoryType}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  categoryType: e.target.value as CategoryType,
                }))
              }
            >
              {CATEGORY_TYPES.map((type) => (
                <MenuItem key={type.value} value={type.value}>
                  {type.label}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              label="Ordine"
              type="number"
              value={formData.sortOrder}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  sortOrder: Number(e.target.value),
                }))
              }
              fullWidth
            />
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
