import { useEffect, useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Alert,
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  Chip,
  CircularProgress,
  Container,
  IconButton,
  Pagination,
  Stack,
  TextField,
  Typography,
  InputAdornment,
} from "@mui/material";
import { Add, Delete, Edit, Search, TrendingUp } from "@mui/icons-material";
import api from "../services/api";
import { formatCurrency } from "../utils/helpers";

const PAGE_SIZE = 9;

export default function Snapshots() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const {
    data: snapshots = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ["snapshots"],
    queryFn: async () => {
      const response = await api.get("/snapshots");
      return response.data || [];
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/snapshots/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["snapshots"] });
      queryClient.invalidateQueries({ queryKey: ["analytics"] });
      queryClient.invalidateQueries({ queryKey: ["snapshot"] });
    },
  });

  const handleDelete = async (id: string) => {
    if (confirm("Sei sicuro di voler eliminare questo snapshot?")) {
      await deleteMutation.mutateAsync(id);
    }
  };

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return snapshots;

    return snapshots.filter((snapshot: any) => {
      const dateLabel = snapshot.date
        ? new Date(snapshot.date).toLocaleDateString("it-IT", {
            day: "2-digit",
            month: "long",
            year: "numeric",
          })
        : "";
      const frequencyLabel =
        snapshot.frequency === "monthly" ? "Mensile" : "Settimanale";
      const totalLabel = formatCurrency(snapshot.totalValue || 0);

      return [
        dateLabel,
        frequencyLabel,
        totalLabel,
        String(snapshot.totalValue || 0),
      ]
        .join(" ")
        .toLowerCase()
        .includes(query);
    });
  }, [snapshots, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pagedSnapshots = filtered.slice(
    (page - 1) * PAGE_SIZE,
    page * PAGE_SIZE,
  );

  useEffect(() => {
    if (page > totalPages) {
      setPage(1);
    }
  }, [page, totalPages]);

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
          <Alert severity="error">Errore nel caricamento degli snapshot</Alert>
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
              Snapshot Patrimonio
            </Typography>
            <Typography color="text.secondary">
              Gestisci tutti i tuoi snapshot mensili e settimanali
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<Add />}
            href="/manual-snapshot"
          >
            Nuova Snapshot
          </Button>
        </Stack>

        <Stack direction={{ xs: "column", md: "row" }} spacing={2} mb={3}>
          <TextField
            placeholder="Cerca per data, frequenza o importo..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            fullWidth
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search fontSize="small" />
                </InputAdornment>
              ),
            }}
          />
          <Chip
            label={`${filtered.length} snapshot`}
            color="primary"
            variant="outlined"
            sx={{ alignSelf: "center" }}
          />
        </Stack>

        {filtered.length === 0 ? (
          <Alert severity="info">
            Nessuno snapshot trovato. Crea una nuova snapshot per iniziare.
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
            {pagedSnapshots.map((snapshot: any) => {
              const dateLabel = snapshot.date
                ? new Date(snapshot.date).toLocaleDateString("it-IT", {
                    day: "2-digit",
                    month: "long",
                    year: "numeric",
                  })
                : "N/A";
              const createdLabel = snapshot.createdAt
                ? new Date(snapshot.createdAt).toLocaleString("it-IT")
                : "N/A";
              const frequencyLabel =
                snapshot.frequency === "monthly" ? "Mensile" : "Settimanale";

              return (
                <Card
                  key={snapshot.id}
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
                          bgcolor: "info.main",
                          color: "white",
                          mb: 2,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: "56px",
                        }}
                      >
                        <TrendingUp />
                      </Box>
                      <Box sx={{ width: "100%" }}>
                        <Typography
                          variant="h6"
                          noWrap
                          component="div"
                          sx={{ fontWeight: 700, mb: 0.5 }}
                        >
                          {dateLabel}
                        </Typography>
                        <Typography
                          variant="h5"
                          sx={{ fontWeight: 700, mb: 0.5 }}
                        >
                          {formatCurrency(snapshot.totalValue || 0)}
                        </Typography>
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{ mb: 2 }}
                        >
                          Valore totale del patrimonio
                        </Typography>
                        <Chip
                          label={frequencyLabel}
                          color={
                            snapshot.frequency === "monthly"
                              ? "primary"
                              : "secondary"
                          }
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
                      gap: 1,
                      justifyContent: "center",
                    }}
                  >
                    <Button
                      size="small"
                      startIcon={<Edit />}
                      href={`/manual-snapshot/${snapshot.id}`}
                    >
                      Modifica
                    </Button>
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => handleDelete(snapshot.id)}
                      disabled={deleteMutation.isPending}
                      title="Elimina snapshot"
                    >
                      <Delete />
                    </IconButton>
                  </CardActions>
                </Card>
              );
            })}
          </Box>
        )}

        {filtered.length > PAGE_SIZE && (
          <Box sx={{ display: "flex", justifyContent: "center", mt: 3 }}>
            <Pagination
              count={totalPages}
              page={page}
              onChange={(_, value) => setPage(value)}
              color="primary"
              shape="rounded"
            />
          </Box>
        )}
      </Box>
    </Container>
  );
}
