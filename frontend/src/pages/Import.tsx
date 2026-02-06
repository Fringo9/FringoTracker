import { useState, useCallback } from "react";
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
  Divider,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
  Alert,
  CircularProgress,
} from "@mui/material";
import { Delete, Edit, Upload } from "@mui/icons-material";
import { useDropzone } from "react-dropzone";
import * as XLSX from "xlsx";
import api from "../services/api";
import { useNavigate } from "react-router-dom";
import { useCategories } from "../hooks/useCategories";

interface ImportEntry {
  excelName: string;
  itemName: string;
  itemId: string;
  category: string;
  value: number;
}

interface MappedSnapshot {
  date: string;
  entries: ImportEntry[];
}

export default function Import() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { categories: CATEGORIES } = useCategories();
  const [mappedSnapshots, setMappedSnapshots] = useState<MappedSnapshot[]>([]);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<{
    snapshotIdx: number;
    entryIdx: number;
  } | null>(null);
  const [editFormData, setEditFormData] = useState<ImportEntry | null>(null);

  const { data: items = [], isLoading: itemsLoading } = useQuery({
    queryKey: ["items"],
    queryFn: async () => {
      const response = await api.get("/items");
      return response.data || [];
    },
  });

  const importMutation = useMutation({
    mutationFn: async (snapshots: MappedSnapshot[]) => {
      for (const snapshot of snapshots) {
        await api.post("/snapshots", {
          date: snapshot.date,
          frequency: "monthly",
          entries: snapshot.entries.map((e) => ({
            itemId: e.itemId,
            value: e.value,
          })),
          totalValue: snapshot.entries.reduce((sum, e) => sum + e.value, 0),
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["snapshots"] });
      setMappedSnapshots([]);
      navigate("/snapshots");
    },
  });

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      acceptedFiles.forEach((file) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          try {
            const data = e.target?.result;
            if (typeof data === "string" || data instanceof ArrayBuffer) {
              const workbook = XLSX.read(data, { type: "binary" });
              const sheetName = workbook.SheetNames[0];
              const worksheet = workbook.Sheets[sheetName];
              const rows = XLSX.utils.sheet_to_json(worksheet);

              const newSnapshots: MappedSnapshot[] = [];

              (rows as any[]).forEach((row) => {
                const date = row.Data || row.Date;
                const excelName = row["Nome Voce"] || row["Item Name"] || "";
                const value = parseFloat(row.Valore || row.Value || 0);

                if (!date || !excelName || !value) return;

                let snapshot = newSnapshots.find(
                  (s) =>
                    new Date(s.date).toDateString() ===
                    new Date(date).toDateString(),
                );

                if (!snapshot) {
                  snapshot = {
                    date: new Date(date).toISOString().split("T")[0],
                    entries: [],
                  };
                  newSnapshots.push(snapshot);
                }

                const matchedItem = items.find(
                  (item: any) =>
                    item.name.toLowerCase() === excelName.toLowerCase(),
                );

                snapshot.entries.push({
                  excelName,
                  itemName: matchedItem?.name || "",
                  itemId: matchedItem?.id || "",
                  category: matchedItem?.category || CATEGORIES[0],
                  value,
                });
              });

              setMappedSnapshots((prev) => [...prev, ...newSnapshots]);
            }
          } catch (error) {
            console.error("Errore parsing file:", error);
            alert("Errore nel parsing del file Excel");
          }
        };
        reader.readAsArrayBuffer(file);
      });
    },
    [items],
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [
        ".xlsx",
      ],
      "application/vnd.ms-excel": [".xls"],
    },
  });

  const openEditDialog = (snapshotIdx: number, entryIdx: number) => {
    setEditingEntry({ snapshotIdx, entryIdx });
    setEditFormData({
      ...mappedSnapshots[snapshotIdx].entries[entryIdx],
    });
    setEditDialogOpen(true);
  };

  const handleSaveEdit = () => {
    if (!editingEntry || !editFormData) return;

    const newSnapshots = mappedSnapshots.map((s, sIdx) => {
      if (sIdx === editingEntry.snapshotIdx) {
        return {
          ...s,
          entries: s.entries.map((e, eIdx) => {
            if (eIdx === editingEntry.entryIdx) {
              return editFormData;
            }
            return e;
          }),
        };
      }
      return s;
    });

    setMappedSnapshots(newSnapshots);
    setEditDialogOpen(false);
    setEditingEntry(null);
    setEditFormData(null);
  };

  const handleDeleteEntry = (snapshotIdx: number, entryIdx: number) => {
    const newSnapshots = mappedSnapshots
      .map((s, sIdx) => {
        if (sIdx === snapshotIdx) {
          return {
            ...s,
            entries: s.entries.filter((_, eIdx) => eIdx !== entryIdx),
          };
        }
        return s;
      })
      .filter((s) => s.entries.length > 0);

    setMappedSnapshots(newSnapshots);
  };

  const handleDeleteSnapshot = (snapshotIdx: number) => {
    setMappedSnapshots((prev) => prev.filter((_, idx) => idx !== snapshotIdx));
  };

  if (itemsLoading) {
    return (
      <Container maxWidth="xl">
        <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl">
      <Box sx={{ py: 4 }}>
        <Typography variant="h4" gutterBottom>
          Importa Snapshot
        </Typography>
        <Typography color="text.secondary" mb={3}>
          Importa i tuoi snapshot da un file Excel
        </Typography>

        {/* Upload Area */}
        <Card
          {...getRootProps()}
          variant="outlined"
          sx={{
            borderRadius: 3,
            borderColor: isDragActive
              ? "primary.main"
              : "rgba(37, 99, 235, 0.12)",
            backgroundColor: isDragActive ? "rgba(37, 99, 235, 0.04)" : "#fff",
            p: 4,
            textAlign: "center",
            cursor: "pointer",
            transition: "all 0.2s ease",
            "&:hover": {
              borderColor: "primary.main",
              backgroundColor: "rgba(37, 99, 235, 0.04)",
            },
            mb: 4,
          }}
        >
          <input {...getInputProps()} />
          <Upload sx={{ fontSize: 48, color: "primary.main", mb: 2 }} />
          <Typography variant="h6" gutterBottom>
            {isDragActive
              ? "Rilascia il file qui"
              : "Trascina un file Excel qui o clicca per selezionare"}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Formati supportati: .xlsx, .xls
          </Typography>
        </Card>

        {/* Mapped Snapshots */}
        {mappedSnapshots.length > 0 && (
          <Box>
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                mb: 3,
              }}
            >
              <Typography variant="h6">
                Snapshot da importare ({mappedSnapshots.length})
              </Typography>
              <Button
                variant="contained"
                onClick={() => importMutation.mutate(mappedSnapshots)}
                disabled={importMutation.isPending}
              >
                {importMutation.isPending ? "Importazione..." : "Importa Tutto"}
              </Button>
            </Box>

            <Stack spacing={2}>
              {mappedSnapshots.map((snapshot, snapshotIdx) => (
                <Card
                  key={snapshotIdx}
                  variant="outlined"
                  sx={{
                    borderRadius: 3,
                    borderColor: "rgba(37, 99, 235, 0.12)",
                  }}
                >
                  <CardContent>
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        mb: 2,
                      }}
                    >
                      <Typography variant="h6">
                        {new Date(snapshot.date).toLocaleDateString("it-IT")}
                      </Typography>
                      <Button
                        size="small"
                        color="error"
                        onClick={() => handleDeleteSnapshot(snapshotIdx)}
                      >
                        Elimina Snapshot
                      </Button>
                    </Box>

                    <Divider sx={{ my: 2 }} />

                    <Stack spacing={1.5} divider={<Divider flexItem />}>
                      {snapshot.entries.map((entry, entryIdx) => (
                        <Card
                          key={entryIdx}
                          variant="outlined"
                          sx={{
                            borderRadius: 3,
                            borderColor: !entry.itemId
                              ? "rgba(245, 158, 11, 0.4)"
                              : "rgba(37, 99, 235, 0.12)",
                            backgroundColor: !entry.itemId
                              ? "rgba(245, 158, 11, 0.08)"
                              : "#fff",
                          }}
                        >
                          <CardContent sx={{ pb: 1.5 }}>
                            <Stack spacing={1.5}>
                              <Box
                                sx={{
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "space-between",
                                  gap: 2,
                                }}
                              >
                                <Box>
                                  <Typography variant="subtitle1" noWrap>
                                    {entry.excelName}
                                  </Typography>
                                  <Typography
                                    variant="body2"
                                    color="text.secondary"
                                  >
                                    Voce app: {entry.itemName || "Non mappata"}
                                  </Typography>
                                </Box>
                                {!entry.itemId && (
                                  <Chip
                                    label="Da mappare"
                                    color="warning"
                                    size="small"
                                    variant="outlined"
                                  />
                                )}
                              </Box>

                              <Stack
                                direction={{ xs: "column", md: "row" }}
                                spacing={2}
                                alignItems={{ xs: "stretch", md: "center" }}
                              >
                                <FormControl
                                  size="small"
                                  sx={{ minWidth: 180 }}
                                >
                                  <InputLabel>Categoria</InputLabel>
                                  <Select
                                    label="Categoria"
                                    value={entry.category}
                                    onChange={(e) => {
                                      const newCategory = e.target.value;
                                      const newSnapshots = mappedSnapshots.map(
                                        (s, sIdx) => {
                                          if (sIdx === snapshotIdx) {
                                            return {
                                              ...s,
                                              entries: s.entries.map(
                                                (en, eIdx) => {
                                                  if (eIdx === entryIdx) {
                                                    return {
                                                      ...en,
                                                      category: newCategory,
                                                    };
                                                  }
                                                  return en;
                                                },
                                              ),
                                            };
                                          }
                                          return s;
                                        },
                                      );
                                      setMappedSnapshots(newSnapshots);
                                    }}
                                  >
                                    {CATEGORIES.map((category) => (
                                      <MenuItem key={category} value={category}>
                                        {category}
                                      </MenuItem>
                                    ))}
                                  </Select>
                                </FormControl>

                                <Box sx={{ flexGrow: 1 }} />
                                <Typography
                                  variant="h6"
                                  sx={{ fontWeight: 700 }}
                                >
                                  {entry.value.toLocaleString("it-IT", {
                                    style: "currency",
                                    currency: "EUR",
                                  })}
                                </Typography>
                              </Stack>
                            </Stack>
                          </CardContent>
                          <CardActions sx={{ px: 2, pb: 2, pt: 0, gap: 0.5 }}>
                            <Button
                              size="small"
                              startIcon={<Edit fontSize="small" />}
                              onClick={() =>
                                openEditDialog(snapshotIdx, entryIdx)
                              }
                            >
                              Modifica
                            </Button>
                            <Button
                              size="small"
                              color="error"
                              startIcon={<Delete fontSize="small" />}
                              onClick={() =>
                                handleDeleteEntry(snapshotIdx, entryIdx)
                              }
                            >
                              Elimina
                            </Button>
                          </CardActions>
                        </Card>
                      ))}
                    </Stack>
                  </CardContent>
                </Card>
              ))}
            </Stack>
          </Box>
        )}

        {mappedSnapshots.length === 0 && (
          <Alert severity="info">
            Carica un file Excel per visualizzare gli snapshot da importare
          </Alert>
        )}

        {/* Edit Dialog */}
        <Dialog
          open={editDialogOpen}
          onClose={() => {
            setEditDialogOpen(false);
            setEditingEntry(null);
            setEditFormData(null);
          }}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>Modifica Voce</DialogTitle>
          <DialogContent
            sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 2 }}
          >
            <TextField
              label="Nome Excel"
              value={editFormData?.excelName || ""}
              onChange={(e) =>
                setEditFormData((prev) =>
                  prev ? { ...prev, excelName: e.target.value } : null,
                )
              }
              fullWidth
              disabled
            />
            <TextField
              label="Nome Voce"
              value={editFormData?.itemName || ""}
              onChange={(e) =>
                setEditFormData((prev) =>
                  prev ? { ...prev, itemName: e.target.value } : null,
                )
              }
              fullWidth
            />
            <FormControl fullWidth>
              <InputLabel>Categoria</InputLabel>
              <Select
                label="Categoria"
                value={editFormData?.category || ""}
                onChange={(e) =>
                  setEditFormData((prev) =>
                    prev ? { ...prev, category: e.target.value } : null,
                  )
                }
              >
                {CATEGORIES.map((category) => (
                  <MenuItem key={category} value={category}>
                    {category}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              label="Valore"
              type="number"
              value={editFormData?.value || ""}
              onChange={(e) =>
                setEditFormData((prev) =>
                  prev
                    ? { ...prev, value: parseFloat(e.target.value) || 0 }
                    : null,
                )
              }
              fullWidth
              inputProps={{ step: "0.01" }}
            />
          </DialogContent>
          <DialogActions>
            <Button
              onClick={() => {
                setEditDialogOpen(false);
                setEditingEntry(null);
                setEditFormData(null);
              }}
            >
              Annulla
            </Button>
            <Button variant="contained" onClick={handleSaveEdit}>
              Salva
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Container>
  );
}
