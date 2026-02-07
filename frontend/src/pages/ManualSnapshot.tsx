import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Box,
  Container,
  Typography,
  Button,
  Card,
  CardContent,
  Stack,
  Divider,
  TextField,
  Autocomplete,
  CircularProgress,
  Alert,
  Grid,
  IconButton,
  Chip,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Select,
  FormControl,
  InputLabel,
} from "@mui/material";
import {
  Delete,
  Add as AddIcon,
  ClearAll as ClearAllIcon,
} from "@mui/icons-material";
import api from "../services/api";
import { formatCurrency } from "../utils/helpers";
import { useCategories } from "../hooks/useCategories";
import { usePrivacyStore } from "../stores/privacyStore";

interface Item {
  id: string;
  name: string;
  category: string;
  sortOrder?: number;
}

interface RowData {
  id: string;
  itemId: string | null;
  itemName: string | null;
  category: string | null;
  value: string;
}

export default function ManualSnapshot() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { id: snapshotId } = useParams<{ id?: string }>();
  const { categories: CATEGORIES } = useCategories();
  const isObscured = usePrivacyStore((state) => state.isObscured);
  const categoryDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );

  // Debounced category update
  const debouncedCategoryUpdate = useCallback(
    (itemId: string, newCategory: string) => {
      if (categoryDebounceRef.current) {
        clearTimeout(categoryDebounceRef.current);
      }
      categoryDebounceRef.current = setTimeout(() => {
        api
          .put(`/items/${itemId}`, { category: newCategory })
          .then(() => {
            queryClient.invalidateQueries({ queryKey: ["items"] });
          })
          .catch((err) => {
            console.error("Errore aggiornando categoria:", err);
            setValidationError(
              "Errore durante l'aggiornamento della categoria",
            );
          });
      }, 500);
    },
    [queryClient],
  );

  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [frequency, setFrequency] = useState("monthly");
  const [rows, setRows] = useState<RowData[]>([
    { id: "1", itemId: null, itemName: null, category: null, value: "" },
  ]);
  const [rowCounter, setRowCounter] = useState(2);
  const [successMessage, setSuccessMessage] = useState("");
  const [validationError, setValidationError] = useState("");
  const [openNewItemDialog, setOpenNewItemDialog] = useState(false);
  const [newItemName, setNewItemName] = useState("");
  const [newItemCategory, setNewItemCategory] = useState("");
  const isEditMode = !!snapshotId;

  // Fetch items
  const {
    data: items = [],
    isLoading: loadingItems,
    refetch: refetchItems,
  } = useQuery({
    queryKey: ["items"],
    queryFn: async () => {
      const response = await api.get("/items");
      return response.data || [];
    },
  });

  // Fetch snapshot template
  const { data: templateData } = useQuery({
    queryKey: ["snapshotTemplate"],
    queryFn: async () => {
      const response = await api.get("/snapshot-template");
      return response.data;
    },
    enabled: !isEditMode, // Solo quando crei una nuova snapshot
  });

  // Fetch latest snapshot values for auto-fill
  const { data: latestValues, isFetched: latestValuesFetched } = useQuery({
    queryKey: ["latestSnapshotValues"],
    queryFn: async () => {
      const response = await api.get("/snapshots/latest-values");
      return response.data;
    },
    enabled: !isEditMode,
  });

  // Fetch snapshot if in edit mode
  const { data: snapshotToEdit, isLoading: loadingSnapshot } = useQuery({
    queryKey: ["snapshot", snapshotId],
    queryFn: async () => {
      if (!snapshotId) return null;
      const response = await api.get(`/snapshots/${snapshotId}`);
      return response.data;
    },
    enabled: !!snapshotId,
  });

  // Initialize rows from template if creating new snapshot (with auto-fill from latest values)
  useEffect(() => {
    // Wait until latestValues query has completed before initializing rows
    if (
      !isEditMode &&
      templateData?.items &&
      templateData.items.length > 0 &&
      latestValuesFetched
    ) {
      // Build a map of latest values by itemId
      const latestValuesMap = new Map<string, number>();
      if (latestValues?.entries) {
        latestValues.entries.forEach((entry: any) => {
          latestValuesMap.set(entry.itemId, entry.value);
        });
      }

      const templateRows = templateData.items.map((item: any, idx: number) => {
        const lastValue = latestValuesMap.get(item.itemId);
        return {
          id: String(idx),
          itemId: item.itemId,
          itemName: item.itemName,
          category:
            items.find((i: any) => i.id === item.itemId)?.category || null,
          value: lastValue !== undefined ? String(lastValue) : "",
        };
      });

      if (templateRows.length > 0) {
        setRows(templateRows);
        setRowCounter(templateRows.length + 1);
      }
    }
  }, [templateData, isEditMode, items, latestValues, latestValuesFetched]);

  // Clear all values (reset to template without pre-fill)
  const handleClearValues = () => {
    setRows(rows.map((row) => ({ ...row, value: "" })));
  };

  // Initialize rows from snapshot data if editing
  useEffect(() => {
    if (snapshotToEdit && isEditMode) {
      setDate(new Date(snapshotToEdit.date).toISOString().split("T")[0]);
      setFrequency(snapshotToEdit.frequency);

      const editRows = snapshotToEdit.entries?.map(
        (entry: any, idx: number) => ({
          id: String(idx),
          itemId: entry.itemId,
          itemName: entry.item?.name,
          category: entry.item?.category,
          value: String(entry.value),
        }),
      ) || [
        { id: "1", itemId: null, itemName: null, category: null, value: "" },
      ];

      setRows(editRows);
      setRowCounter(editRows.length + 1);
    }
  }, [snapshotToEdit, isEditMode]);

  // Create item mutation
  const createItemMutation = useMutation({
    mutationFn: async (payload: any) => {
      return await api.post("/items", payload);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["items"] });
      refetchItems();
      // Auto-select the new item in the active row
      if (rows.length > 0) {
        const lastRow = rows[rows.length - 1];
        handleUpdateRow(lastRow.id, "itemId", data.data.id);
      }
      setOpenNewItemDialog(false);
      setNewItemName("");
      setNewItemCategory("");
    },
  });

  // Create snapshot mutation
  const createMutation = useMutation({
    mutationFn: async (payload: any) => {
      await api.post("/snapshots", payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["snapshots"] });
      queryClient.invalidateQueries({ queryKey: ["analytics"] });
      queryClient.invalidateQueries({ queryKey: ["snapshot"] });
      setSuccessMessage("Snapshot creato con successo!");
      setTimeout(() => {
        navigate("/snapshots");
      }, 1500);
    },
  });

  // Update snapshot mutation
  const updateMutation = useMutation({
    mutationFn: async (payload: any) => {
      await api.put(`/snapshots/${snapshotId}`, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["snapshots"] });
      queryClient.invalidateQueries({ queryKey: ["analytics"] });
      queryClient.invalidateQueries({ queryKey: ["snapshot"] });
      setSuccessMessage("Snapshot aggiornato con successo!");
      setTimeout(() => {
        navigate("/snapshots");
      }, 1500);
    },
  });

  // Calculate total - usa il valore così com'è, senza logica di segno per categoria
  const total = useMemo(() => {
    return rows.reduce((sum, row) => {
      const value = parseFloat(row.value) || 0;
      return sum + value;
    }, 0);
  }, [rows]);

  // Add new row
  const handleAddRow = () => {
    const newId = String(rowCounter);
    setRows([
      ...rows,
      {
        id: newId,
        itemId: null,
        itemName: null,
        category: null,
        value: "",
      },
    ]);
    setRowCounter(rowCounter + 1);
  };

  // Delete row
  const handleDeleteRow = (id: string) => {
    if (rows.length > 1) {
      setRows(rows.filter((row) => row.id !== id));
    }
  };

  // Update row field
  const handleUpdateRow = (
    id: string,
    field: "itemId" | "itemName" | "category" | "value",
    value: any,
  ) => {
    setRows(
      rows.map((row) => {
        if (row.id === id) {
          if (field === "itemId" && value) {
            const selectedItem = items.find((i: any) => i.id === value);
            return {
              ...row,
              itemId: value,
              itemName: selectedItem?.name,
              category: selectedItem?.category,
            };
          }
          return { ...row, [field]: value };
        }
        return row;
      }),
    );
  };

  // Auto-add new row on blur
  const handleRowBlur = (id: string) => {
    const lastRow = rows[rows.length - 1];
    if (id === lastRow.id && rows.length < 20) {
      const isLastRowComplete = lastRow.itemId && lastRow.value;
      if (isLastRowComplete) {
        handleAddRow();
      }
    }
  };

  // Submit
  const handleSubmit = async () => {
    setValidationError("");

    const validRows = rows.filter((row) => row.itemId && row.value);

    if (validRows.length === 0) {
      setValidationError("Aggiungi almeno una voce completa");
      return;
    }

    const incompleteRows = rows.filter((row) => {
      const hasAnyData = row.itemId || row.value;
      const isComplete = row.itemId && row.value;
      return hasAnyData && !isComplete;
    });

    if (incompleteRows.length > 0) {
      setValidationError(
        `Completa tutte le righe. ${incompleteRows.length} riga/he incompleta/e`,
      );
      return;
    }

    const entries = validRows.map((row) => ({
      itemId: row.itemId!,
      value: parseFloat(row.value),
    }));

    try {
      if (isEditMode) {
        await updateMutation.mutateAsync({
          date,
          frequency,
          totalValue: total,
          entries,
        });
      } else {
        await createMutation.mutateAsync({
          date,
          frequency,
          totalValue: total,
          entries,
        });
      }
    } catch (error) {
      console.error("Error saving snapshot:", error);
      setValidationError("Errore durante il salvataggio dello snapshot");
    }
  };

  // Handle create new item
  const handleCreateNewItem = async () => {
    if (!newItemName || !newItemCategory) {
      setValidationError("Compila tutti i campi della voce");
      return;
    }

    try {
      await createItemMutation.mutateAsync({
        name: newItemName,
        category: newItemCategory,
      });
    } catch (error) {
      setValidationError("Errore durante la creazione della voce");
    }
  };

  if (loadingItems || (isEditMode && loadingSnapshot)) {
    return (
      <Container maxWidth="md">
        <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="md">
      <Box sx={{ py: 4 }}>
        <Typography variant="h4" gutterBottom>
          {isEditMode ? "Modifica Snapshot" : "Inserisci Snapshot Manuale"}
        </Typography>
        <Typography color="text.secondary" sx={{ mb: 3 }}>
          {isEditMode
            ? "Modifica i dati del tuo snapshot"
            : "Crea un nuovo snapshot inserendo manualmente le tue voci"}
        </Typography>

        {successMessage && (
          <Alert severity="success" sx={{ mb: 3 }}>
            {successMessage}
          </Alert>
        )}

        {validationError && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {validationError}
          </Alert>
        )}

        <Card
          variant="outlined"
          sx={{
            mb: 3,
            borderRadius: 3,
            borderColor: "rgba(37, 99, 235, 0.12)",
          }}
        >
          <CardContent>
            <Grid container spacing={2} sx={{ mb: 3 }}>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Data"
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  select
                  label="Frequenza"
                  value={frequency}
                  onChange={(e) => setFrequency(e.target.value)}
                  fullWidth
                >
                  <MenuItem value="monthly">Mensile</MenuItem>
                  <MenuItem value="weekly">Settimanale</MenuItem>
                </TextField>
              </Grid>
            </Grid>

            <Stack spacing={2} sx={{ mb: 3 }} divider={<Divider flexItem />}>
              {rows.map((row) => (
                <Card
                  key={row.id}
                  variant="outlined"
                  sx={{
                    borderRadius: 3,
                    borderColor: "rgba(37, 99, 235, 0.12)",
                  }}
                >
                  <CardContent>
                    <Stack spacing={2}>
                      <Autocomplete
                        options={items}
                        getOptionLabel={(item: any) => item.name}
                        value={
                          items.find((i: any) => i.id === row.itemId) || null
                        }
                        onChange={(_, value) => {
                          handleUpdateRow(row.id, "itemId", value?.id);
                        }}
                        onBlur={() => handleRowBlur(row.id)}
                        freeSolo
                        renderInput={(params) => (
                          <TextField
                            {...params}
                            label="Voce"
                            placeholder="Seleziona o crea voce"
                            size="small"
                          />
                        )}
                        noOptionsText={
                          <Button
                            size="small"
                            onClick={() => setOpenNewItemDialog(true)}
                            sx={{ width: "100%" }}
                          >
                            + Crea nuova voce
                          </Button>
                        }
                      />

                      <Stack
                        direction={{ xs: "column", md: "row" }}
                        spacing={2}
                        alignItems={{ xs: "stretch", md: "center" }}
                      >
                        {row.itemId ? (
                          <FormControl size="small" sx={{ minWidth: 200 }}>
                            <InputLabel>Categoria</InputLabel>
                            <Select
                              label="Categoria"
                              value={row.category || ""}
                              onChange={(e) => {
                                const newCategory = e.target.value;
                                handleUpdateRow(
                                  row.id,
                                  "category",
                                  newCategory,
                                );

                                // Debounced save to backend
                                if (row.itemId) {
                                  debouncedCategoryUpdate(
                                    row.itemId,
                                    newCategory,
                                  );
                                }
                              }}
                            >
                              {CATEGORIES.map((cat) => (
                                <MenuItem key={cat} value={cat}>
                                  {cat}
                                </MenuItem>
                              ))}
                            </Select>
                          </FormControl>
                        ) : (
                          <Chip label="Seleziona voce" variant="outlined" />
                        )}

                        <TextField
                          type="number"
                          label="Valore"
                          value={row.value}
                          onChange={(e) =>
                            handleUpdateRow(row.id, "value", e.target.value)
                          }
                          onBlur={() => handleRowBlur(row.id)}
                          size="small"
                          placeholder="0"
                          sx={{ maxWidth: 160 }}
                        />
                        <Box sx={{ flexGrow: 1 }} />
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleDeleteRow(row.id)}
                          disabled={rows.length === 1}
                          title="Rimuovi"
                        >
                          <Delete fontSize="small" />
                        </IconButton>
                      </Stack>
                    </Stack>
                  </CardContent>
                </Card>
              ))}
            </Stack>

            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                mb: 3,
              }}
            >
              <Stack direction="row" spacing={1}>
                <Button
                  variant="outlined"
                  startIcon={<AddIcon />}
                  onClick={handleAddRow}
                >
                  Aggiungi Voce
                </Button>
                {!isEditMode && (
                  <Button
                    variant="outlined"
                    color="secondary"
                    startIcon={<ClearAllIcon />}
                    onClick={handleClearValues}
                    size="small"
                  >
                    Svuota valori
                  </Button>
                )}
              </Stack>
              <Card sx={{ bgcolor: "action.hover" }}>
                <CardContent sx={{ py: 1, px: 2, "&:last-child": { pb: 1 } }}>
                  <Typography variant="subtitle2">
                    Totale: <strong>{formatCurrency(total, isObscured)}</strong>
                  </Typography>
                </CardContent>
              </Card>
            </Box>

            <Box sx={{ display: "flex", gap: 2, justifyContent: "flex-end" }}>
              <Button variant="outlined" onClick={() => navigate("/snapshots")}>
                Annulla
              </Button>
              <Button
                variant="contained"
                onClick={handleSubmit}
                disabled={createMutation.isPending || updateMutation.isPending}
              >
                {isEditMode ? "Aggiorna" : "Crea"} Snapshot
              </Button>
            </Box>
          </CardContent>
        </Card>
      </Box>

      {/* Dialog per creare nuova voce */}
      <Dialog
        open={openNewItemDialog}
        onClose={() => setOpenNewItemDialog(false)}
      >
        <DialogTitle>Crea Nuova Voce</DialogTitle>
        <DialogContent sx={{ pt: 2, minWidth: 400 }}>
          <TextField
            fullWidth
            label="Nome voce"
            value={newItemName}
            onChange={(e) => setNewItemName(e.target.value)}
            sx={{ mb: 2 }}
          />
          <FormControl fullWidth>
            <InputLabel>Categoria</InputLabel>
            <Select
              value={newItemCategory}
              onChange={(e) => setNewItemCategory(e.target.value)}
              label="Categoria"
            >
              {CATEGORIES.map((cat) => (
                <MenuItem key={cat} value={cat}>
                  {cat}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenNewItemDialog(false)}>Annulla</Button>
          <Button
            onClick={handleCreateNewItem}
            variant="contained"
            disabled={createItemMutation.isPending}
          >
            Crea
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
