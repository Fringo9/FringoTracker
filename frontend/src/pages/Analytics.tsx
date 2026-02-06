import React, { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Box,
  Container,
  Typography,
  Grid,
  CircularProgress,
  Alert,
  Card,
  CardContent,
  Button,
  ToggleButton,
  ToggleButtonGroup,
  Stack,
  Tooltip as MuiTooltip,
  IconButton,
} from "@mui/material";
import {
  LineChart,
  Line,
  AreaChart,
  Area,
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
import {
  TrendingUp,
  ShowChart,
  Bolt,
  CalendarMonth,
  TrendingDown,
  CompareArrows,
  SwapVert,
  TrendingFlat,
  Balance,
  Close as CloseIcon,
} from "@mui/icons-material";
import api from "../services/api";
import { formatCurrency } from "../utils/helpers";

const COLORS = [
  "#2563eb",
  "#38bdf8",
  "#0ea5e9",
  "#60a5fa",
  "#93c5fd",
  "#1d4ed8",
  "#0284c7",
];

export default function Analytics() {
  const [range, setRange] = useState("all");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const { data: analytics, isLoading: loadingAnalytics } = useQuery({
    queryKey: ["analytics"],
    queryFn: async () => {
      const response = await api.get("/analytics");
      return response.data;
    },
    staleTime: 60_000,
  });

  const { data: snapshots, isLoading: loadingSnapshots } = useQuery({
    queryKey: ["snapshots"],
    queryFn: async () => {
      const response = await api.get("/snapshots");
      return response.data;
    },
    staleTime: 60_000,
  });

  const { data: milestones, isLoading: loadingMilestones } = useQuery({
    queryKey: ["milestones"],
    queryFn: async () => {
      const response = await api.get("/milestones");
      return response.data;
    },
    staleTime: 300_000,
  });

  const { data: categoryHistory } = useQuery({
    queryKey: ["categoryHistory"],
    queryFn: async () => {
      const response = await api.get("/analytics/category-history");
      return response.data;
    },
    staleTime: 60_000,
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

  const milestoneLines = useMemo(() => {
    if (filteredSnapshots.length < 1) return [];

    const startDate = new Date(filteredSnapshots[0].date);
    startDate.setHours(0, 0, 0, 0);
    const endDate = new Date(
      filteredSnapshots[filteredSnapshots.length - 1].date,
    );
    endDate.setHours(23, 59, 59, 999);

    return safeMilestones
      .filter((milestone: any) => {
        const mDate = new Date(milestone.date);
        mDate.setHours(0, 0, 0, 0);
        return mDate >= startDate && mDate <= endDate;
      })
      .map((milestone: any) => ({
        date: new Date(milestone.date).toISOString(),
        title: milestone.title,
      }));
  }, [safeMilestones, filteredSnapshots]);

  const timelineData = useMemo(() => {
    const data: Array<{
      dataIndex: number;
      date: string;
      timestamp: number;
      label: string;
      valore: any;
      isMilestone?: boolean;
      milestoneTitle?: string;
    }> = filteredSnapshots.map((snapshot: any, idx: number) => ({
      dataIndex: idx,
      date: new Date(snapshot.date).toISOString(),
      timestamp: new Date(snapshot.date).getTime(),
      label: new Date(snapshot.date).toLocaleDateString("it-IT", {
        month: "short",
        year: "2-digit",
      }),
      valore: snapshot.totalValue,
    }));

    // Aggiungi milestone come dati virtuali per la ReferenceLine
    milestoneLines.forEach((milestone: any) => {
      data.push({
        dataIndex: -1,
        date: milestone.date,
        timestamp: new Date(milestone.date).getTime(),
        label: new Date(milestone.date).toLocaleDateString("it-IT", {
          month: "short",
          year: "2-digit",
        }),
        valore: null,
        isMilestone: true,
        milestoneTitle: milestone.title,
      });
    });

    // Sort by timestamp
    data.sort((a, b) => a.timestamp - b.timestamp);

    return data;
  }, [filteredSnapshots, milestoneLines]);

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

  const categoryChartData = useMemo(() => {
    if (!selectedCategory || !categoryHistory) return [];
    return categoryHistory
      .filter((point: any) => point.categories[selectedCategory] !== undefined)
      .map((point: any) => ({
        date: point.date,
        label: new Date(point.date).toLocaleDateString("it-IT", {
          month: "short",
          year: "2-digit",
        }),
        value: point.categories[selectedCategory] || 0,
      }));
  }, [selectedCategory, categoryHistory]);

  // Prepara dati per pie chart categorie
  const categoryData = useMemo(
    () =>
      analytics?.categoryBreakdown?.map((cat: any) => ({
        name: cat.categoryType,
        value: cat.value,
        percentage: cat.percentage,
      })) || [],
    [analytics],
  );

  const selectedCategoryColor = useMemo(() => {
    if (!selectedCategory) return COLORS[0];
    const idx = categoryData.findIndex((c: any) => c.name === selectedCategory);
    return COLORS[idx >= 0 ? idx % COLORS.length : 0];
  }, [selectedCategory, categoryData]);

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

  // Dati proiezioni
  const projectionData = [
    { scenario: "Ottimistico", valore: analytics.projection?.optimistic || 0 },
    { scenario: "Realistico", valore: analytics.projection?.realistic || 0 },
    {
      scenario: "Pessimistico",
      valore: analytics.projection?.pessimistic || 0,
    },
  ];

  return (
    <Container maxWidth="xl">
      <Box sx={{ py: 4 }}>
        <Stack
          direction={{ xs: "column", md: "row" }}
          alignItems={{ xs: "flex-start", md: "center" }}
          justifyContent="space-between"
          spacing={2}
          sx={{ mb: 4 }}
        >
          <Box>
            <Typography variant="h4" gutterBottom>
              Analytics
            </Typography>
            <Typography color="text.secondary">
              Analisi dettagliata dell'andamento del tuo patrimonio
            </Typography>
          </Box>
        </Stack>

        {/* Grafico principale - Timeline patrimonio */}
        <Card
          variant="outlined"
          sx={{
            p: 0,
            mb: 3,
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
                flexDirection: { xs: "column", md: "row" },
                justifyContent: "space-between",
                gap: 2,
                mb: 2,
              }}
            >
              <Typography variant="h6">
                Andamento Patrimonio nel Tempo
              </Typography>
              <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
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
                    stroke="#2563eb"
                    strokeWidth={3}
                    dot={{ r: 4 }}
                    activeDot={{ r: 6 }}
                    name="Patrimonio"
                    connectNulls={true}
                  />
                  {timelineData
                    .map((item: any, index: number) => {
                      if (!item.isMilestone) return null;
                      return (
                        <ReferenceLine
                          key={`milestone-${index}`}
                          x={item.date}
                          stroke="#f59e0b"
                          strokeWidth={2}
                          strokeDasharray="5 5"
                          label={{
                            value: item.milestoneTitle,
                            position: "top",
                            fill: "#f59e0b",
                            fontSize: 11,
                            fontWeight: "bold",
                            offset: 10,
                          }}
                        />
                      );
                    })
                    .filter((el: any) => el !== null)}
                </LineChart>
              </ResponsiveContainer>
            </Box>

            {/* Legenda milestone */}
            {milestoneLines.length > 0 && (
              <Box
                sx={{
                  mt: 2,
                  p: 2,
                  backgroundColor: "rgba(245, 158, 11, 0.08)",
                  borderRadius: 2,
                }}
              >
                <Typography
                  variant="subtitle2"
                  sx={{ fontWeight: "bold", mb: 1 }}
                >
                  📍 Milestone ({milestoneLines.length}):
                </Typography>
                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2 }}>
                  {milestoneLines.map((milestone: any, idx: number) => (
                    <Box
                      key={idx}
                      sx={{ display: "flex", alignItems: "center", gap: 1 }}
                    >
                      <Box
                        sx={{
                          width: 16,
                          height: 2,
                          backgroundColor: "#f59e0b",
                          borderRadius: 1,
                        }}
                      />
                      <Typography variant="caption">
                        {new Date(milestone.date).toLocaleDateString("it-IT")}:{" "}
                        {milestone.title}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              </Box>
            )}
          </CardContent>
        </Card>

        <Grid container spacing={3}>
          {/* Pie Chart - Breakdown categorie */}
          <Grid item xs={12} md={6}>
            <Card
              variant="outlined"
              sx={{
                borderRadius: 3,
                borderColor: "rgba(37, 99, 235, 0.12)",
                background:
                  "linear-gradient(180deg, rgba(37,99,235,0.06) 0%, rgba(255,255,255,1) 60%)",
                height: "100%",
              }}
            >
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ fontWeight: 700 }}>
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
                            onClick={() => setSelectedCategory(entry.name)}
                            style={{ cursor: "pointer" }}
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
              </CardContent>
            </Card>
          </Grid>

          {/* Proiezioni future */}
          <Grid item xs={12} md={6}>
            <Card
              variant="outlined"
              sx={{
                borderRadius: 3,
                borderColor: "rgba(37, 99, 235, 0.12)",
                background:
                  "linear-gradient(180deg, rgba(37,99,235,0.06) 0%, rgba(255,255,255,1) 60%)",
                height: "100%",
              }}
            >
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ fontWeight: 700 }}>
                  Proiezioni Future (12 mesi)
                </Typography>
                <Box sx={{ mt: 2, display: "flex", flexDirection: "column", gap: 2 }}>
                  {projectionData.map((proj, index) => {
                    const scenarioColors = ["success.main", "info.main", "warning.main"];
                    const scenarioIcons = [<TrendingUp key="up" />, <ShowChart key="show" />, <TrendingDown key="down" />];
                    return (
                      <Box
                        key={index}
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          gap: 2,
                          p: 2,
                          borderRadius: 3,
                          border: "1px solid rgba(37, 99, 235, 0.12)",
                          bgcolor: "background.paper",
                        }}
                      >
                        <Box
                          sx={{
                            p: 1,
                            borderRadius: 2,
                            bgcolor: scenarioColors[index % scenarioColors.length],
                            color: "white",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            minWidth: 40,
                            minHeight: 40,
                          }}
                        >
                          {scenarioIcons[index % scenarioIcons.length]}
                        </Box>
                        <Box sx={{ flex: 1 }}>
                          <Typography variant="subtitle2" color="text.secondary">
                            {proj.scenario}
                          </Typography>
                          <Typography variant="h6" sx={{ fontWeight: 700 }}>
                            {formatCurrency(proj.valore)}
                          </Typography>
                        </Box>
                      </Box>
                    );
                  })}
                </Box>
                <Alert severity="info" sx={{ mt: 2, borderRadius: 2 }}>
                  Basato su risparmio medio mensile:{" "}
                  {formatCurrency(analytics.monthlyAvgSavings)}
                </Alert>
              </CardContent>
            </Card>
          </Grid>

          {/* Storico categoria selezionata */}
          {selectedCategory && categoryChartData.length > 0 && (
            <Grid item xs={12}>
              <Card
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
                      justifyContent: "space-between",
                      alignItems: "center",
                      mb: 2,
                    }}
                  >
                    <Typography variant="h6" sx={{ fontWeight: 700 }}>
                      Storico: {selectedCategory}
                    </Typography>
                    <IconButton
                      size="small"
                      onClick={() => setSelectedCategory(null)}
                    >
                      <CloseIcon />
                    </IconButton>
                  </Box>
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={categoryChartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="label" />
                      <YAxis
                        tickFormatter={(value) =>
                          `€${(value / 1000).toFixed(0)}k`
                        }
                      />
                      <Tooltip
                        formatter={(value: any) => formatCurrency(value)}
                        labelFormatter={(_: any, payload: any) =>
                          payload?.[0]?.payload?.date
                            ? new Date(
                                payload[0].payload.date,
                              ).toLocaleDateString("it-IT", {
                                month: "long",
                                year: "numeric",
                              })
                            : ""
                        }
                      />
                      <Area
                        type="monotone"
                        dataKey="value"
                        stroke={selectedCategoryColor}
                        fill={selectedCategoryColor}
                        fillOpacity={0.15}
                        strokeWidth={2}
                        name={selectedCategory}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </Grid>
          )}

          {/* Heatmap mensile */}
          <Grid item xs={12}>
            <Card
              variant="outlined"
              sx={{
                borderRadius: 3,
                borderColor: "rgba(37, 99, 235, 0.12)",
                background:
                  "linear-gradient(180deg, rgba(37,99,235,0.06) 0%, rgba(255,255,255,1) 60%)",
              }}
            >
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ fontWeight: 700 }}>
                  Heatmap Variazioni Mensili
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Variazioni del patrimonio mese per mese. Verde = crescita, Rosso = calo.
                </Typography>
                {(() => {
                  const heatmap: Array<{ year: number; month: number; change: number; changePercent: number }> =
                    analytics.monthlyHeatmapData || [];
                  if (heatmap.length === 0) {
                    return (
                      <Alert severity="info">
                        Servono almeno 2 snapshot per generare la heatmap
                      </Alert>
                    );
                  }

                  const years = [...new Set(heatmap.map((h) => h.year))].sort();
                  const MONTHS = [
                    "Gen", "Feb", "Mar", "Apr", "Mag", "Giu",
                    "Lug", "Ago", "Set", "Ott", "Nov", "Dic",
                  ];

                  // Build lookup
                  const lookup = new Map<string, { change: number; changePercent: number }>();
                  let maxAbs = 0;
                  heatmap.forEach((h) => {
                    lookup.set(`${h.year}-${h.month}`, { change: h.change, changePercent: h.changePercent });
                    if (Math.abs(h.change) > maxAbs) maxAbs = Math.abs(h.change);
                  });

                  const getColor = (change: number) => {
                    if (maxAbs === 0) return "rgba(200,200,200,0.3)";
                    const intensity = Math.min(Math.abs(change) / maxAbs, 1);
                    if (change > 0) return `rgba(34,197,94,${0.15 + intensity * 0.7})`;
                    if (change < 0) return `rgba(239,68,68,${0.15 + intensity * 0.7})`;
                    return "rgba(200,200,200,0.3)";
                  };

                  return (
                    <Box sx={{ overflowX: "auto" }}>
                      <Box sx={{ display: "grid", gridTemplateColumns: `60px repeat(12, 1fr)`, gap: 0.5, minWidth: 600 }}>
                        {/* Header row */}
                        <Box />
                        {MONTHS.map((m) => (
                          <Typography
                            key={m}
                            variant="caption"
                            sx={{ textAlign: "center", fontWeight: 600, color: "text.secondary" }}
                          >
                            {m}
                          </Typography>
                        ))}

                        {/* Data rows */}
                        {years.map((year) => (
                          <React.Fragment key={year}>
                            <Typography
                              key={`label-${year}`}
                              variant="caption"
                              sx={{ fontWeight: 700, display: "flex", alignItems: "center" }}
                            >
                              {year}
                            </Typography>
                            {Array.from({ length: 12 }, (_, monthIdx) => {
                              const data = lookup.get(`${year}-${monthIdx}`);
                              return (
                                <MuiTooltip
                                  key={`${year}-${monthIdx}`}
                                  title={
                                    data
                                      ? `${MONTHS[monthIdx]} ${year}: ${formatCurrency(data.change)} (${data.changePercent.toFixed(2)}%)`
                                      : `${MONTHS[monthIdx]} ${year}: Nessun dato`
                                  }
                                  arrow
                                  placement="top"
                                >
                                  <Box
                                    sx={{
                                      height: 40,
                                      borderRadius: 1,
                                      bgcolor: data ? getColor(data.change) : "rgba(200,200,200,0.1)",
                                      border: "1px solid",
                                      borderColor: data ? "transparent" : "rgba(200,200,200,0.3)",
                                      display: "flex",
                                      alignItems: "center",
                                      justifyContent: "center",
                                      cursor: "default",
                                      transition: "transform 0.1s",
                                      "&:hover": { transform: "scale(1.08)", zIndex: 1 },
                                    }}
                                  >
                                    {data && (
                                      <Typography
                                        variant="caption"
                                        sx={{
                                          fontSize: "0.65rem",
                                          fontWeight: 600,
                                          color: Math.abs(data.change) / maxAbs > 0.5 ? "white" : "text.primary",
                                        }}
                                      >
                                        {data.changePercent >= 0 ? "+" : ""}
                                        {data.changePercent.toFixed(1)}%
                                      </Typography>
                                    )}
                                  </Box>
                                </MuiTooltip>
                              );
                            })}
                          </React.Fragment>
                        ))}
                      </Box>

                      {/* Legend */}
                      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 2, mt: 2 }}>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                          <Box sx={{ width: 16, height: 16, borderRadius: 0.5, bgcolor: "rgba(239,68,68,0.7)" }} />
                          <Typography variant="caption">Calo</Typography>
                        </Box>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                          <Box sx={{ width: 16, height: 16, borderRadius: 0.5, bgcolor: "rgba(200,200,200,0.3)" }} />
                          <Typography variant="caption">Invariato</Typography>
                        </Box>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                          <Box sx={{ width: 16, height: 16, borderRadius: 0.5, bgcolor: "rgba(34,197,94,0.7)" }} />
                          <Typography variant="caption">Crescita</Typography>
                        </Box>
                      </Box>
                    </Box>
                  );
                })()}
              </CardContent>
            </Card>
          </Grid>

          {/* Statistiche aggiuntive */}
          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 700 }}>
              Metriche di Crescita
            </Typography>
            <Grid container spacing={2}>
                  <Grid item xs={12} sm={6} md={3}>
                    <Card
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
                            <TrendingUp />
                          </Box>
                          <Typography
                            variant="subtitle2"
                            color="text.secondary"
                          >
                            Crescita Totale
                          </Typography>
                          <Typography
                            variant="h5"
                            sx={{ fontWeight: 700, my: 1 }}
                          >
                            {analytics.cagrTotal.toFixed(2)}%
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            CAGR composto dall'inizio del tracking
                          </Typography>
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <Card
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
                            <ShowChart />
                          </Box>
                          <Typography
                            variant="subtitle2"
                            color="text.secondary"
                          >
                            Crescita Annuale
                          </Typography>
                          <Typography
                            variant="h5"
                            sx={{ fontWeight: 700, my: 1 }}
                          >
                            {analytics.cagrYoY.toFixed(2)}%
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            CAGR calcolato sugli ultimi 12 mesi
                          </Typography>
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <Card
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
                          }}
                        >
                          <Box
                            sx={{
                              p: 1.5,
                              borderRadius: 3,
                              bgcolor: (analytics.absoluteChange ?? 0) >= 0 ? "success.main" : "error.main",
                              color: "white",
                              mb: 2,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontSize: "56px",
                            }}
                          >
                            <SwapVert />
                          </Box>
                          <Typography
                            variant="subtitle2"
                            color="text.secondary"
                          >
                            Variazione Assoluta
                          </Typography>
                          <Typography
                            variant="h5"
                            sx={{ fontWeight: 700, my: 1 }}
                          >
                            {formatCurrency(analytics.absoluteChange ?? 0)}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Differenza in € dal primo snapshot ad oggi
                          </Typography>
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <Card
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
                          }}
                        >
                          <Box
                            sx={{
                              p: 1.5,
                              borderRadius: 3,
                              bgcolor: (analytics.lastMonthChange ?? 0) >= 0 ? "success.main" : "error.main",
                              color: "white",
                              mb: 2,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontSize: "56px",
                            }}
                          >
                            <TrendingFlat />
                          </Box>
                          <Typography
                            variant="subtitle2"
                            color="text.secondary"
                          >
                            Variazione Ultimo Mese
                          </Typography>
                          <Typography
                            variant="h5"
                            sx={{ fontWeight: 700, my: 1 }}
                          >
                            {formatCurrency(analytics.lastMonthChange ?? 0)}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Variazione percentuale {Number(analytics.lastMonthChangePercent ?? 0).toFixed(2)}%
                          </Typography>
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <Card
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
                          }}
                        >
                          <Box
                            sx={{
                              p: 1.5,
                              borderRadius: 3,
                              bgcolor: "secondary.main",
                              color: "white",
                              mb: 2,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontSize: "56px",
                            }}
                          >
                            <Bolt />
                          </Box>
                          <Typography
                            variant="subtitle2"
                            color="text.secondary"
                          >
                            Volatilità Annualizzata
                          </Typography>
                          <Typography
                            variant="h5"
                            sx={{ fontWeight: 700, my: 1 }}
                          >
                            {Number(
                              analytics.volatilityAnnualized || 0,
                            ).toFixed(2)}
                            %
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Oscillazione annua dei rendimenti mensili
                          </Typography>
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <Card
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
                          }}
                        >
                          <Box
                            sx={{
                              p: 1.5,
                              borderRadius: 3,
                              bgcolor: "error.main",
                              color: "white",
                              mb: 2,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontSize: "56px",
                            }}
                          >
                            <CalendarMonth />
                          </Box>
                          <Typography
                            variant="subtitle2"
                            color="text.secondary"
                          >
                            Autonomia
                          </Typography>
                          <Typography
                            variant="h5"
                            sx={{ fontWeight: 700, my: 1 }}
                          >
                            {Math.round(analytics.runway)} mesi
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Mesi di autonomia
                          </Typography>
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <Card
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
                          }}
                        >
                          <Box
                            sx={{
                              p: 1.5,
                              borderRadius: 3,
                              bgcolor: "error.main",
                              color: "white",
                              mb: 2,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontSize: "56px",
                            }}
                          >
                            <TrendingDown />
                          </Box>
                          <Typography
                            variant="subtitle2"
                            color="text.secondary"
                          >
                            Max Drawdown
                          </Typography>
                          <Typography
                            variant="h5"
                            sx={{ fontWeight: 700, my: 1 }}
                          >
                            {Number(analytics.maxDrawdown || 0).toFixed(2)}%
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Perdita massima dal picco al minimo storico
                          </Typography>
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <Card
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
                          }}
                        >
                          <Box
                            sx={{
                              p: 1.5,
                              borderRadius: 3,
                              bgcolor: (analytics.debtRatio ?? 0) > 30 ? "error.main" : "success.main",
                              color: "white",
                              mb: 2,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontSize: "56px",
                            }}
                          >
                            <Balance />
                          </Box>
                          <Typography
                            variant="subtitle2"
                            color="text.secondary"
                          >
                            Rapporto Debito/Patrimonio
                          </Typography>
                          <Typography
                            variant="h5"
                            sx={{ fontWeight: 700, my: 1 }}
                          >
                            {Number(analytics.debtRatio || 0).toFixed(2)}%
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Sotto 30% è considerato sano
                          </Typography>
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <Card
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
                            <CompareArrows />
                          </Box>
                          <Typography
                            variant="subtitle2"
                            color="text.secondary"
                          >
                            Confronto YoY
                          </Typography>
                          <Typography
                            variant="h5"
                            sx={{ fontWeight: 700, my: 1 }}
                          >
                            {yoyComparison !== null
                              ? `${yoyComparison.toFixed(2)}%`
                              : "N/A"}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Patrimonio attuale vs 12 mesi fa in %
                          </Typography>
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
            </Grid>
          </Grid>
        </Grid>
      </Box>
    </Container>
  );
}
