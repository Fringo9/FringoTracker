import { useState, useMemo, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  Chip,
  Container,
  TextField,
  Typography,
  Alert,
  List,
  ListItem,
  ListItemText,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  MenuItem,
  CircularProgress,
  Tabs,
  Tab,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from "@mui/material";
import {
  Add,
  Delete,
  Edit,
  ArrowUpward,
  ArrowDownward,
  DragIndicator,
  Inventory2,
  Category,
  ViewList,
  Save,
} from "@mui/icons-material";
import api from "../services/api";
import { useCategories } from "../hooks/useCategories";

interface ItemFormData {
  id?: string;
  name: string;
  category: string;
  sortOrder: number;
}

interface TemplateItem {
  itemId: string;
  itemName: string;
}

export default function Settings() {
  const { categories: CATEGORIES, categoryDefinitions, addCategory, deleteCategory, isAdding, isDeleting } = useCategories();
  const queryClient = useQueryClient();

  // Tab state
  const [activeTab, setActiveTab] = useState(0);

  // Ricarica template quando si torna alla pagina del template
  useEffect(() => {
    if (activeTab === 1) {
      refetchTemplate?.();
    }
  }, [activeTab]);

  // Items state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState<ItemFormData>({
    name: "",
    category: CATEGORIES[0] || "Liquidi",
    sortOrder: 1,
  });

  // Categories state
  const [openCategoryDialog, setOpenCategoryDialog] = useState(false);
  const [newCategory, setNewCategory] = useState("");
  const [categoryError, setCategoryError] = useState("");
  const [categorySuccess, setCategorySuccess] = useState("");

  // Template state
  const [templateItems, setTemplateItems] = useState<TemplateItem[]>([]);
  const [templateModified, setTemplateModified] = useState(false);
  const [templateSuccess, setTemplateSuccess] = useState("");

  // Items queries
  const {
    data: items = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ["items"],
    queryFn: async () => {
      const response = await api.get("/items");
      return response.data || [];
    },
  });
  // Fetch snapshot template
  const { data: templateData, refetch: refetchTemplate } = useQuery({
    queryKey: ["snapshotTemplate"],
    queryFn: async () => {
      const response = await api.get("/snapshot-template");
      return response.data;
    },
    staleTime: 0,
    gcTime: 0,
  });

  // Sincronizza templateItems quando i dati arrivano dal server
  useEffect(() => {
    if (templateData?.items) {
      setTemplateItems(templateData.items);
    }
  }, [templateData]);

  const saveMutation = useMutation({
    mutationFn: async (data: ItemFormData) => {
      if (data.id) {
        await api.put(`/items/${data.id}`, data);
      } else {
        await api.post("/items", data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["items"] });
      setDialogOpen(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/items/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["items"] });
    },
  });

  const reorderMutation = useMutation({
    mutationFn: async (itemsToReorder: { id: string; sortOrder: number }[]) => {
      await api.post("/items/reorder", itemsToReorder);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["items"] });
    },
  });

  // Items handlers
  const handleOpenNew = () => {
    const maxSort =
      items && items.length > 0
        ? Math.max(...items.map((c: any) => c.sortOrder || 0)) + 1
        : 1;
    setFormData({
      name: "",
      category: CATEGORIES[0] || "Liquidi",
      sortOrder: maxSort,
    });
    setDialogOpen(true);
  };

  const handleOpenEdit = (row: any) => {
    setFormData({
      id: row.id,
      name: row.name,
      category: row.category,
      sortOrder: row.sortOrder,
    });
    setDialogOpen(true);
  };

  const handleSave = () => {
    if (!formData.name) return;
    saveMutation.mutate(formData);
  };

  const moveItem = (id: string, direction: "up" | "down") => {
    if (!items || items.length === 0) return;

    const sorted = [...items].sort(
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

  // Categories handlers
  const handleAddCategory = async () => {
    setCategoryError("");
    setCategorySuccess("");

    if (!newCategory.trim()) {
      setCategoryError("Inserisci un nome per la categoria");
      return;
    }

    if (CATEGORIES.some((c) => c.toLowerCase() === newCategory.toLowerCase())) {
      setCategoryError("Questa categoria esiste già");
      return;
    }

    try {
      await addCategory(newCategory.trim());
      setCategorySuccess("Categoria aggiunta con successo");
      setNewCategory("");
      setOpenCategoryDialog(false);
    } catch (err) {
      setCategoryError("Errore durante l'aggiunta della categoria");
    }
  };

  // Template handlers
  const saveTemplateMutation = useMutation({
    mutationFn: async (items: TemplateItem[]) => {
      await api.post("/snapshot-template", { items });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["snapshotTemplate"] });
      setTemplateModified(false);
      setTemplateSuccess("Template salvato con successo!");
      setTimeout(() => setTemplateSuccess(""), 3000);
    },
  });

  const handleAddItemToTemplate = (item: any) => {
    const alreadyExists = templateItems.some((ti) => ti.itemId === item.id);
    if (!alreadyExists) {
      setTemplateItems([
        ...templateItems,
        { itemId: item.id, itemName: item.name },
      ]);
      setTemplateModified(true);
    }
  };

  const handleRemoveItemFromTemplate = (itemId: string) => {
    setTemplateItems(templateItems.filter((ti) => ti.itemId !== itemId));
    setTemplateModified(true);
  };

  const handleMoveTemplateItem = (index: number, direction: "up" | "down") => {
    const newIndex = direction === "up" ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= templateItems.length) return;

    const newItems = [...templateItems];
    [newItems[index], newItems[newIndex]] = [
      newItems[newIndex],
      newItems[index],
    ];
    setTemplateItems(newItems);
    setTemplateModified(true);
  };

  const handleSaveTemplate = () => {
    saveTemplateMutation.mutate(templateItems);
  };

  const handleDeleteCategory = async (category: string) => {
    // Find the category definition to get its ID
    const catDef = categoryDefinitions.find((c) => c.name === category);
    if (!catDef) {
      setCategoryError("Categoria non trovata");
      return;
    }

    try {
      await deleteCategory(catDef.id);
      setCategorySuccess("Categoria eliminata con successo");
    } catch (err) {
      setCategoryError("Errore durante l'eliminazione della categoria");
    }
  };

  const sortedItems = useMemo(() => {
    if (!items || items.length === 0) return [];
    return [...items].sort(
      (a: any, b: any) => (a.sortOrder || 0) - (b.sortOrder || 0),
    );
  }, [items]);

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
          <Alert severity="error">Errore nel caricamento dati</Alert>
        </Box>
      </Container>
    );
  }

  const hasItems = items && items.length > 0;

  return (
    <Container maxWidth="xl">
      <Box sx={{ py: 4 }}>
        <Typography variant="h4" gutterBottom>
          Impostazioni
        </Typography>
        <Typography color="text.secondary" mb={3}>
          Gestisci le voci, le categorie dei tuoi asset e il template delle
          snapshot
        </Typography>

        {/* Tabs */}
        <Box sx={{ borderBottom: 1, borderColor: "divider", mb: 3 }}>
          <Tabs
            value={activeTab}
            onChange={(e, newValue) => setActiveTab(newValue)}
          >
            <Tab label="Voci e Categorie" />
            <Tab label="Template Snapshot" />
          </Tabs>
        </Box>

        {/* Tab 1: Voci e Categorie */}
        {activeTab === 0 && (
          <>
            {/* Sezione Voci */}
            <Stack
              direction={{ xs: "column", md: "row" }}
              alignItems={{ xs: "flex-start", md: "center" }}
              justifyContent="space-between"
              spacing={2}
              sx={{ mb: 3 }}
            >
              <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                <Box
                  sx={{
                    p: 1,
                    borderRadius: 2,
                    bgcolor: "primary.main",
                    color: "white",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Inventory2 />
                </Box>
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 700 }}>Voci</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {sortedItems.length} voci configurate
                  </Typography>
                </Box>
              </Box>
              <Button
                startIcon={<Add />}
                variant="contained"
                onClick={handleOpenNew}
              >
                Nuova Voce
              </Button>
            </Stack>

            {!hasItems && (
              <Alert severity="info" sx={{ mb: 3 }}>
                Nessuna voce trovata. Crea una nuova voce per iniziare.
              </Alert>
            )}

            {hasItems && (
              <Card
                variant="outlined"
                sx={{
                  borderRadius: 3,
                  borderColor: "rgba(37, 99, 235, 0.12)",
                  mb: 4,
                  overflow: "hidden",
                }}
              >
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow
                        sx={{
                          background:
                            "linear-gradient(180deg, rgba(37,99,235,0.08) 0%, rgba(37,99,235,0.03) 100%)",
                        }}
                      >
                        <TableCell sx={{ fontWeight: 700, width: 60 }} align="center">
                          #
                        </TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>Voce</TableCell>
                        <TableCell sx={{ fontWeight: 700, width: 140 }}>Categoria</TableCell>
                        <TableCell sx={{ fontWeight: 700, width: 120 }} align="center">
                          Azioni
                        </TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {sortedItems.map((item: any, index: number) => (
                        <TableRow
                          key={item.id}
                          sx={{
                            "&:last-child td, &:last-child th": { border: 0 },
                            "&:hover": { bgcolor: "rgba(37, 99, 235, 0.04)" },
                          }}
                        >
                          <TableCell align="center">
                            <Chip
                              label={index + 1}
                              size="small"
                              color="primary"
                              variant="outlined"
                              sx={{ minWidth: 32 }}
                            />
                          </TableCell>
                          <TableCell>
                            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                              <Box
                                sx={{
                                  p: 0.75,
                                  borderRadius: 1.5,
                                  bgcolor: "primary.main",
                                  color: "white",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                }}
                              >
                                <Inventory2 fontSize="small" />
                              </Box>
                              <Typography variant="body1" sx={{ fontWeight: 600 }}>
                                {item.name}
                              </Typography>
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={item.category}
                              size="small"
                              color="primary"
                              variant="outlined"
                            />
                          </TableCell>
                          <TableCell align="center">
                            <Box sx={{ display: "flex", justifyContent: "center", gap: 0.5 }}>
                              <IconButton
                                size="small"
                                color="primary"
                                onClick={() => handleOpenEdit(item)}
                                title="Modifica"
                              >
                                <Edit fontSize="small" />
                              </IconButton>
                              <IconButton
                                size="small"
                                color="error"
                                onClick={() => deleteMutation.mutate(item.id)}
                                title="Elimina"
                              >
                                <Delete fontSize="small" />
                              </IconButton>
                            </Box>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Card>
            )}

            {/* Sezione Categorie */}
            <Stack
              direction={{ xs: "column", md: "row" }}
              alignItems={{ xs: "flex-start", md: "center" }}
              justifyContent="space-between"
              spacing={2}
              sx={{ mb: 3 }}
            >
              <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                <Box
                  sx={{
                    p: 1,
                    borderRadius: 2,
                    bgcolor: "secondary.main",
                    color: "white",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Category />
                </Box>
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 700 }}>Categorie</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {CATEGORIES.length} categorie disponibili
                  </Typography>
                </Box>
              </Box>
              <Button
                startIcon={<Add />}
                variant="contained"
                onClick={() => setOpenCategoryDialog(true)}
              >
                Aggiungi Categoria
              </Button>
            </Stack>

            {categoryError && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {categoryError}
              </Alert>
            )}
            {categorySuccess && (
              <Alert severity="success" sx={{ mb: 2 }}>
                {categorySuccess}
              </Alert>
            )}

            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1.5 }}>
              {CATEGORIES.map((category) => (
                <Chip
                  key={category}
                  label={category}
                  onDelete={() => handleDeleteCategory(category)}
                  deleteIcon={<Delete />}
                  variant="outlined"
                  sx={{
                    borderRadius: 2,
                    borderColor: "rgba(37, 99, 235, 0.2)",
                    px: 1,
                    py: 2.5,
                    fontSize: "0.9rem",
                    "& .MuiChip-deleteIcon": {
                      color: "error.light",
                      "&:hover": { color: "error.main" },
                    },
                  }}
                />
              ))}
            </Box>
          </>
        )}
      </Box>

      {/* Tab 2: Template Snapshot */}
      {activeTab === 1 && (
        <>
          {templateSuccess && (
            <Alert severity="success" sx={{ mb: 2 }}>
              {templateSuccess}
            </Alert>
          )}

          <Stack
            direction={{ xs: "column", md: "row" }}
            alignItems={{ xs: "flex-start", md: "center" }}
            justifyContent="space-between"
            spacing={2}
            sx={{ mb: 3 }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
              <Box
                sx={{
                  p: 1,
                  borderRadius: 2,
                  bgcolor: "info.main",
                  color: "white",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <ViewList />
              </Box>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                  Template Snapshot
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {templateItems.length} voci precaricate nel template
                </Typography>
              </Box>
            </Box>
            <Button
              variant="contained"
              startIcon={<Save />}
              onClick={handleSaveTemplate}
              disabled={!templateModified || saveTemplateMutation.isPending}
            >
              {saveTemplateMutation.isPending
                ? "Salvataggio..."
                : "Salva Template"}
            </Button>
          </Stack>

          <Typography color="text.secondary" variant="body2" sx={{ mb: 3 }}>
            Seleziona le voci che verranno precaricate ogni volta che crei una
            nuova snapshot. Trascina per riordinare.
          </Typography>

          {/* Elenco delle voci nel template */}
          {templateItems.length > 0 && (
            <Card
              variant="outlined"
              sx={{
                borderRadius: 3,
                borderColor: "rgba(37, 99, 235, 0.12)",
                mb: 4,
                overflow: "hidden",
              }}
            >
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow
                      sx={{
                        background:
                          "linear-gradient(180deg, rgba(37,99,235,0.08) 0%, rgba(37,99,235,0.03) 100%)",
                      }}
                    >
                      <TableCell sx={{ fontWeight: 700, width: 60 }} align="center">
                        #
                      </TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Voce</TableCell>
                      <TableCell sx={{ fontWeight: 700, width: 150 }} align="center">
                        Ordine
                      </TableCell>
                      <TableCell sx={{ fontWeight: 700, width: 60 }} align="center">
                        Rimuovi
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {templateItems.map((item, index) => (
                      <TableRow
                        key={item.itemId}
                        sx={{
                          "&:last-child td, &:last-child th": { border: 0 },
                          "&:hover": { bgcolor: "rgba(37, 99, 235, 0.04)" },
                        }}
                      >
                        <TableCell align="center">
                          <Chip
                            label={index + 1}
                            size="small"
                            color="info"
                            variant="outlined"
                            sx={{ minWidth: 32 }}
                          />
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                            <Box
                              sx={{
                                p: 0.75,
                                borderRadius: 1.5,
                                bgcolor: "info.main",
                                color: "white",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                              }}
                            >
                              <Inventory2 fontSize="small" />
                            </Box>
                            <Typography variant="body1" sx={{ fontWeight: 600 }}>
                              {item.itemName}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell align="center">
                          <Box sx={{ display: "flex", justifyContent: "center", gap: 0.5 }}>
                            <IconButton
                              size="small"
                              disabled={index === 0}
                              onClick={() => handleMoveTemplateItem(index, "up")}
                              title="Sposta su"
                            >
                              <ArrowUpward fontSize="small" />
                            </IconButton>
                            <IconButton
                              size="small"
                              disabled={index === templateItems.length - 1}
                              onClick={() => handleMoveTemplateItem(index, "down")}
                              title="Sposta giù"
                            >
                              <ArrowDownward fontSize="small" />
                            </IconButton>
                          </Box>
                        </TableCell>
                        <TableCell align="center">
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => handleRemoveItemFromTemplate(item.itemId)}
                            title="Rimuovi dal template"
                          >
                            <Delete fontSize="small" />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Card>
          )}

          {templateItems.length === 0 && (
            <Alert severity="info" sx={{ mb: 3 }}>
              Nessuna voce nel template. Aggiungi voci dal selettore qui sotto.
            </Alert>
          )}

          {/* Selettore per aggiungere voci */}
          {items?.filter(
            (item: any) =>
              !templateItems.find((ti) => ti.itemId === item.id),
          ).length > 0 && (
            <Card
              variant="outlined"
              sx={{
                borderRadius: 3,
                borderColor: "rgba(37, 99, 235, 0.12)",
              }}
            >
              <CardContent>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 2 }}>
                  <Box
                    sx={{
                      p: 1,
                      borderRadius: 2,
                      bgcolor: "success.main",
                      color: "white",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Add />
                  </Box>
                  <Box>
                    <Typography variant="h6" sx={{ fontWeight: 700 }}>
                      Aggiungi voci
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Clicca su una voce per aggiungerla al template
                    </Typography>
                  </Box>
                </Box>
                <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                  {items
                    ?.filter(
                      (item: any) =>
                        !templateItems.find((ti) => ti.itemId === item.id),
                    )
                    .map((item: any) => (
                      <Chip
                        key={item.id}
                        label={item.name}
                        onClick={() => handleAddItemToTemplate(item)}
                        icon={<Add />}
                        color="primary"
                        variant="outlined"
                        sx={{
                          borderRadius: 2,
                          px: 1,
                          py: 2.5,
                          fontSize: "0.9rem",
                        }}
                      />
                    ))}
                </Box>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* Dialog Voci */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)}>
        <DialogTitle>
          {formData.id ? "Modifica Voce" : "Nuova Voce"}
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
            label="Categoria"
            select
            value={formData.category}
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                category: e.target.value,
              }))
            }
            fullWidth
          >
            {CATEGORIES.map((category) => (
              <MenuItem key={category} value={category}>
                {category}
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

      {/* Dialog Categorie */}
      <Dialog
        open={openCategoryDialog}
        onClose={() => setOpenCategoryDialog(false)}
      >
        <DialogTitle>Aggiungi Categoria</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Nome Categoria"
            fullWidth
            value={newCategory}
            onChange={(e) => setNewCategory(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === "Enter") {
                handleAddCategory();
              }
            }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenCategoryDialog(false)}>Annulla</Button>
          <Button onClick={handleAddCategory} variant="contained">
            Aggiungi
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
