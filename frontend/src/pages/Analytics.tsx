import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Box,
  Container,
  Typography,
  Paper,
  Grid,
  CircularProgress,
  Alert,
  Card,
  CardContent,
  Button,
  ToggleButton,
  ToggleButtonGroup,
} from "@mui/material";
import {
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import api from "../services/api";
import { formatCurrency } from "../utils/helpers";

const COLORS = [
  "#1976d2",
  "#9c27b0",
  "#2e7d32",
  "#ed6c02",
  "#d32f2f",
  "#0288d1",
  "#7b1fa2",
];

export default function Analytics() {
  const [range, setRange] = useState("all");

  const { data: analytics, isLoading: loadingAnalytics } = useQuery({
    queryKey: ["analytics"],
    queryFn: async () => {
      const response = await api.get("/analytics");
      return response.data;
    },
  });

  const { data: snapshots, isLoading: loadingSnapshots } = useQuery({
    queryKey: ["snapshots"],
    queryFn: async () => {
      const response = await api.get("/snapshots");
      return response.data;
    },
  });

  const { data: milestones, isLoading: loadingMilestones } = useQuery({
    queryKey: ["milestones"],
    queryFn: async () => {
      const response = await api.get("/milestones");
      return response.data;
    },
  });

  const safeSnapshots = Array.isArray(snapshots) ? snapshots : [];
  const safeMilestones = Array.isArray(milestones) ? milestones : [];

  const filteredSnapshots = useMemo(() => {
    const sorted = [...safeSnapshots].sort(
      (a: any, b: any) =>
        new Date(a.date).getTime() - new Date(b.date).getTime(),
    );

    if (range === "all") return sorted;

    const latest = sorted[sorted.length - 1];
    if (!latest) return sorted;

    const months = Number(range);
    const cutoff = new Date(latest.date);
    cutoff.setMonth(cutoff.getMonth() - months);

    return sorted.filter((s: any) => new Date(s.date) >= cutoff);
  }, [safeSnapshots, range]);

  const timelineData = filteredSnapshots.map((snapshot: any) => ({
    date: new Date(snapshot.date).toISOString(),
    label: new Date(snapshot.date).toLocaleDateString("it-IT", {
      month: "short",
      year: "2-digit",
    }),
    valore: snapshot.totalValue,
  }));

  const milestoneLines = safeMilestones.map((milestone: any) => ({
    date: new Date(milestone.date).toISOString(),
    title: milestone.title,
  }));

  const yoyComparison = useMemo(() => {
    if (filteredSnapshots.length < 2) return null;
    const latest = filteredSnapshots[filteredSnapshots.length - 1];
    const targetDate = new Date(latest.date);
    targetDate.setFullYear(targetDate.getFullYear() - 1);

    let closest: any = null;
    let minDiff = Number.POSITIVE_INFINITY;
    filteredSnapshots.forEach((snap: any) => {
      const diff = Math.abs(
        new Date(snap.date).getTime() - targetDate.getTime(),
      );
      if (diff < minDiff) {
        minDiff = diff;
        closest = snap;
      }
    });

    if (!closest || closest.totalValue === 0) return null;
    return (
      ((latest.totalValue - closest.totalValue) / closest.totalValue) * 100
    );
  }, [filteredSnapshots]);

  if (loadingAnalytics || loadingSnapshots || loadingMilestones) {
    return (
      <Container maxWidth="xl">
        <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  if (!analytics || !snapshots) {
    return (
      <Container maxWidth="xl">
        <Box sx={{ py: 4 }}>
          <Alert severity="error">
            Errore nel caricamento dei dati analytics
          </Alert>
        </Box>
      </Container>
    );
  }

  const handleExportTimelineCsv = () => {
    if (!timelineData.length) return;
    const header = "date,valore";
    const rows = timelineData
      .map((row) => `${row.date},${row.valore}`)
      .join("\n");
    const blob = new Blob([`${header}\n${rows}`], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "timeline.csv";
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleExportTimelineSvg = () => {
    const container = document.getElementById("timeline-chart");
    if (!container) return;
    const svg = container.querySelector("svg");
    if (!svg) return;
    const serializer = new XMLSerializer();
    const source = serializer.serializeToString(svg);
    const blob = new Blob([source], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "timeline.svg";
    link.click();
    URL.revokeObjectURL(url);
  };

  // Prepara dati per pie chart categorie - traduzione tipi
  const categoryTypeLabels: Record<string, string> = {
    Assets: "Asset",
    Liabilities: "Passività",
  };

  const categoryData =
    analytics.categoryBreakdown?.map((cat: any) => ({
      name: categoryTypeLabels[cat.categoryType] || cat.categoryType,
      value: cat.value,
      percentage: cat.percentage,
    })) || [];

  // Dati proiezioni
  const projectionData = [
    {
      scenario: "Pessimistico",
      valore: analytics.projection?.pessimistic || 0,
    },
    { scenario: "Realistico", valore: analytics.projection?.realistic || 0 },
    { scenario: "Ottimistico", valore: analytics.projection?.optimistic || 0 },
  ];

  return (
    <Container maxWidth="xl">
      <Box sx={{ py: 4 }}>
        <Typography variant="h4" gutterBottom>
          Analytics
        </Typography>
        <Typography color="text.secondary" mb={4}>
          Analisi dettagliata dell'andamento del tuo patrimonio
        </Typography>

        {/* Grafico principale - Timeline patrimonio */}
        <Paper sx={{ p: 3, mb: 3 }}>
          <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}>
            <Typography variant="h6">Andamento Patrimonio nel Tempo</Typography>
            <Box sx={{ display: "flex", gap: 2 }}>
              <ToggleButtonGroup
                size="small"
                value={range}
                exclusive
                onChange={(_, value) => value && setRange(value)}
              >
                <ToggleButton value="6">6M</ToggleButton>
                <ToggleButton value="12">12M</ToggleButton>
                <ToggleButton value="24">24M</ToggleButton>
                <ToggleButton value="all">All</ToggleButton>
              </ToggleButtonGroup>
              <Button size="small" onClick={handleExportTimelineCsv}>
                Export CSV
              </Button>
              <Button size="small" onClick={handleExportTimelineSvg}>
                Export SVG
              </Button>
            </Box>
          </Box>
          <Box id="timeline-chart">
            <ResponsiveContainer width="100%" height={400}>
              <LineChart data={timelineData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="date"
                  tickFormatter={(value) =>
                    new Date(value).toLocaleDateString("it-IT", {
                      month: "short",
                      year: "2-digit",
                    })
                  }
                />
                <YAxis
                  tickFormatter={(value) => `€${(value / 1000).toFixed(0)}k`}
                />
                <Tooltip
                  formatter={(value: any) => formatCurrency(value)}
                  labelFormatter={(label: any) =>
                    new Date(label).toLocaleDateString("it-IT", {
                      month: "long",
                      year: "numeric",
                    })
                  }
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="valore"
                  stroke="#1976d2"
                  strokeWidth={3}
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                  name="Patrimonio"
                />
                {milestoneLines.map((milestone: any, index: number) => (
                  <ReferenceLine
                    key={`${milestone.date}-${index}`}
                    x={milestone.date}
                    stroke="#9c27b0"
                    strokeDasharray="3 3"
                    label={{
                      value: milestone.title,
                      position: "top",
                      fill: "#9c27b0",
                      fontSize: 10,
                    }}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </Box>
        </Paper>

        <Grid container spacing={3}>
          {/* Pie Chart - Breakdown categorie */}
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3, height: 450 }}>
              <Typography variant="h6" gutterBottom>
                Distribuzione per Categoria
              </Typography>
              {categoryData.length > 0 ? (
                <ResponsiveContainer width="100%" height={350}>
                  <PieChart>
                    <Pie
                      data={categoryData}
                      cx="50%"
                      cy="40%"
                      labelLine={false}
                      label={false}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {categoryData.map((entry: any, index: number) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={COLORS[index % COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value: any) => formatCurrency(value)}
                    />
                    <Legend
                      verticalAlign="bottom"
                      height={36}
                      formatter={(value: any, entry: any) =>
                        `${entry.payload.name}: ${entry.payload.percentage.toFixed(1)}%`
                      }
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <Alert severity="info">
                  Nessun dato disponibile per la distribuzione
                </Alert>
              )}
            </Paper>
          </Grid>

          {/* Proiezioni future */}
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3, height: 450 }}>
              <Typography variant="h6" gutterBottom>
                Proiezioni Future (12 mesi)
              </Typography>
              <Box sx={{ mt: 4 }}>
                {projectionData.map((proj, index) => (
                  <Card key={index} sx={{ mb: 2 }}>
                    <CardContent>
                      <Typography variant="subtitle2" color="text.secondary">
                        {proj.scenario}
                      </Typography>
                      <Typography variant="h5">
                        {formatCurrency(proj.valore)}
                      </Typography>
                    </CardContent>
                  </Card>
                ))}
              </Box>
              <Alert severity="info" sx={{ mt: 2 }}>
                Basato su risparmio medio mensile:{" "}
                {formatCurrency(analytics.monthlyAvgSavings)}
              </Alert>
            </Paper>
          </Grid>

          {/* Statistiche aggiuntive */}
          <Grid item xs={12}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Metriche di Crescita
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6} md={3}>
                  <Card>
                    <CardContent>
                      <Typography variant="subtitle2" color="text.secondary">
                        Crescita Totale
                      </Typography>
                      <Typography variant="h6">
                        {analytics.cagrTotal.toFixed(2)}%
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        CAGR dall'inizio
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Card>
                    <CardContent>
                      <Typography variant="subtitle2" color="text.secondary">
                        Crescita Annuale
                      </Typography>
                      <Typography variant="h6">
                        {analytics.cagrYoY.toFixed(2)}%
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Ultimi 12 mesi
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Card>
                    <CardContent>
                      <Typography variant="subtitle2" color="text.secondary">
                        Volatilità
                      </Typography>
                      <Typography variant="h6">
                        {formatCurrency(analytics.volatility)}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Deviazione standard
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Card>
                    <CardContent>
                      <Typography variant="subtitle2" color="text.secondary">
                        Volatilità Annualizzata
                      </Typography>
                      <Typography variant="h6">
                        {Number(analytics.volatilityAnnualized || 0).toFixed(2)}
                        %
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Rendimenti mensili
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Card>
                    <CardContent>
                      <Typography variant="subtitle2" color="text.secondary">
                        Autonomia
                      </Typography>
                      <Typography variant="h6">
                        {Math.round(analytics.runway)} mesi
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Runway finanziario
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Card>
                    <CardContent>
                      <Typography variant="subtitle2" color="text.secondary">
                        Max Drawdown
                      </Typography>
                      <Typography variant="h6">
                        {Number(analytics.maxDrawdown || 0).toFixed(2)}%
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Da picco a minimo
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Card>
                    <CardContent>
                      <Typography variant="subtitle2" color="text.secondary">
                        Runway Reale
                      </Typography>
                      <Typography variant="h6">
                        {Math.round(analytics.runwayReal || 0)} mesi
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Anche con risparmio negativo
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Card>
                    <CardContent>
                      <Typography variant="subtitle2" color="text.secondary">
                        Confronto YoY
                      </Typography>
                      <Typography variant="h6">
                        {yoyComparison !== null
                          ? `${yoyComparison.toFixed(2)}%`
                          : "N/A"}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Ultimo vs 12 mesi fa
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            </Paper>
          </Grid>
        </Grid>
      </Box>
    </Container>
  );
}
