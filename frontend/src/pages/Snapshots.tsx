import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Box,
  Container,
  Typography,
  Paper,
  Button,
  IconButton,
  CircularProgress,
  Alert,
  Chip,
  TextField,
} from "@mui/material";
import { DataGrid, GridColDef } from "@mui/x-data-grid";
import { Add, Delete } from "@mui/icons-material";
import api from "../services/api";
import { formatCurrency } from "../utils/helpers";

export default function Snapshots() {
  const queryClient = useQueryClient();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const {
    data: snapshots,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["snapshots"],
    queryFn: async () => {
      const response = await api.get("/snapshots");
      return response.data;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/snapshots/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["snapshots"] });
      queryClient.invalidateQueries({ queryKey: ["analytics"] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (payload: { id: string; data: any }) => {
      await api.put(`/snapshots/${payload.id}`, payload.data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["snapshots"] });
      queryClient.invalidateQueries({ queryKey: ["analytics"] });
    },
  });

  const handleDelete = async (id: string) => {
    if (confirm("Sei sicuro di voler eliminare questo snapshot?")) {
      await deleteMutation.mutateAsync(id);
    }
  };

  const columns: GridColDef[] = [
    {
      field: "date",
      headerName: "Data",
      width: 150,
      editable: true,
      renderEditCell: (params) => (
        <TextField
          type="date"
          value={params.value ? String(params.value).slice(0, 10) : ""}
          onChange={(event) =>
            params.api.setEditCellValue({
              id: params.id,
              field: params.field,
              value: event.target.value,
            })
          }
          size="small"
        />
      ),
      valueFormatter: (value) => {
        if (!value) return "N/A";
        return new Date(value).toLocaleDateString("it-IT", {
          year: "numeric",
          month: "long",
        });
      },
    },
    {
      field: "frequency",
      headerName: "Frequenza",
      width: 130,
      editable: true,
      type: "singleSelect",
      valueOptions: [
        { value: "monthly", label: "Mensile" },
        { value: "weekly", label: "Settimanale" },
      ],
      renderCell: (params) => (
        <Chip
          label={params.value === "monthly" ? "Mensile" : "Settimanale"}
          size="small"
          color={params.value === "monthly" ? "primary" : "secondary"}
        />
      ),
    },
    {
      field: "totalValue",
      headerName: "Valore Totale",
      width: 180,
      editable: true,
      valueFormatter: (value) =>
        typeof value === "number" ? formatCurrency(value) : "N/A",
    },
    {
      field: "createdAt",
      headerName: "Creato il",
      width: 180,
      valueFormatter: (value) => {
        if (!value) return "N/A";
        return new Date(value).toLocaleString("it-IT");
      },
    },
    {
      field: "actions",
      headerName: "Azioni",
      width: 100,
      sortable: false,
      renderCell: (params) => (
        <IconButton
          size="small"
          color="error"
          onClick={() => handleDelete(params.row.id)}
          disabled={deleteMutation.isPending}
        >
          <Delete />
        </IconButton>
      ),
    },
  ];

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
        <Box sx={{ display: "flex", justifyContent: "space-between", mb: 3 }}>
          <Box>
            <Typography variant="h4" gutterBottom>
              Snapshot Patrimonio
            </Typography>
            <Typography color="text.secondary">
              Gestisci tutti i tuoi snapshot mensili e settimanali
            </Typography>
          </Box>
          <Button variant="contained" startIcon={<Add />} href="/import">
            Nuovo Snapshot
          </Button>
        </Box>

        <Paper sx={{ height: 600, width: "100%" }}>
          <DataGrid
            rows={snapshots || []}
            columns={columns}
            pageSizeOptions={[10, 25, 50]}
            checkboxSelection
            disableRowSelectionOnClick
            onRowSelectionModelChange={(newSelection) => {
              setSelectedIds(newSelection as string[]);
            }}
            onCellEditCommit={async (params) => {
              const { id, field, value } = params;
              const data: any = {};
              if (field === "date") {
                data.date = new Date(value as any).toISOString();
              } else if (field === "totalValue") {
                data.totalValue = Number(value);
              } else if (field === "frequency") {
                data.frequency = value;
              }

              if (Object.keys(data).length > 0) {
                await updateMutation.mutateAsync({ id: String(id), data });
              }
            }}
            initialState={{
              pagination: { paginationModel: { pageSize: 25 } },
              sorting: {
                sortModel: [{ field: "date", sort: "desc" }],
              },
            }}
          />
        </Paper>

        {selectedIds.length > 0 && (
          <Alert severity="info" sx={{ mt: 2 }}>
            {selectedIds.length} snapshot selezionati
          </Alert>
        )}
      </Box>
    </Container>
  );
}
