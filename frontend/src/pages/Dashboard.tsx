import { useQuery } from "@tanstack/react-query";
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  CircularProgress,
  Alert,
  Tooltip,
  IconButton,
} from "@mui/material";
import {
  TrendingUp,
  AccountBalance,
  Savings,
  Timeline,
  ShowChart,
  CalendarMonth,
  HelpOutline,
} from "@mui/icons-material";
import api from "../services/api";
import { formatCurrency, formatPercentage } from "../utils/helpers";

const TOOLTIPS = {
  totalWealth:
    "Valore totale del tuo patrimonio calcolato dall'ultimo snapshot",
  monthlyAvgSavings:
    "Media mensile dei tuoi risparmi calcolata da inizio tracking",
  cagrTotal:
    "Tasso di crescita annualizzato composto da inizio tracking (CAGR)",
  cagrYoY: "Tasso di crescita annualizzato degli ultimi 12 mesi",
  volatility: "Deviazione standard del tuo patrimonio nel tempo",
  volatilityAnnualized:
    "Volatilità annualizzata calcolata sui rendimenti mensili",
  maxDrawdown: "Massimo drawdown percentuale rispetto ai picchi storici",
  runway:
    "Numero di mesi di autonomia finanziaria al tasso di risparmio attuale",
  runwayReal: "Autonomia finanziaria calcolata anche con risparmio negativo",
};

export default function Dashboard() {
  const {
    data: analytics,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["analytics"],
    queryFn: async () => {
      const response = await api.get("/analytics");
      return response.data;
    },
  });

  const { data: snapshots } = useQuery({
    queryKey: ["snapshots"],
    queryFn: async () => {
      const response = await api.get("/snapshots");
      return response.data;
    },
  });

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
          <Alert severity="error">Errore nel caricamento dei dati</Alert>
        </Box>
      </Container>
    );
  }

  const metrics = [
    {
      title: "Patrimonio Totale",
      value: formatCurrency(analytics?.totalWealth || 0),
      icon: <AccountBalance />,
      color: "primary.main",
      tooltipKey: "totalWealth",
    },
    {
      title: "Risparmio Medio Mensile",
      value: formatCurrency(analytics?.monthlyAvgSavings || 0),
      icon: <Savings />,
      color: "success.main",
      tooltipKey: "monthlyAvgSavings",
    },
    {
      title: "CAGR Totale",
      value: formatPercentage(analytics?.cagrTotal || 0),
      icon: <TrendingUp />,
      color: "info.main",
      tooltipKey: "cagrTotal",
    },
    {
      title: "CAGR Ultimo Anno",
      value: formatPercentage(analytics?.cagrYoY || 0),
      icon: <ShowChart />,
      color: "secondary.main",
      tooltipKey: "cagrYoY",
    },
    {
      title: "Volatilità",
      value: formatCurrency(analytics?.volatility || 0),
      icon: <Timeline />,
      color: "warning.main",
      tooltipKey: "volatility",
    },
    {
      title: "Volatilità Annualizzata",
      value: formatPercentage(analytics?.volatilityAnnualized || 0),
      icon: <Timeline />,
      color: "warning.main",
      tooltipKey: "volatilityAnnualized",
    },
    {
      title: "Max Drawdown",
      value: formatPercentage(analytics?.maxDrawdown || 0),
      icon: <ShowChart />,
      color: "error.main",
      tooltipKey: "maxDrawdown",
    },
    {
      title: "Runway (Mesi)",
      value: Math.round(analytics?.runway || 0),
      icon: <CalendarMonth />,
      color: "error.main",
      tooltipKey: "runway",
    },
    {
      title: "Runway Reale (Mesi)",
      value: Math.round(analytics?.runwayReal || 0),
      icon: <CalendarMonth />,
      color: "error.main",
      tooltipKey: "runwayReal",
    },
  ];

  return (
    <Container maxWidth="xl">
      <Box sx={{ py: 4 }}>
        <Typography variant="h4" gutterBottom>
          Dashboard
        </Typography>
        <Typography color="text.secondary" mb={4}>
          Panoramica del tuo patrimonio personale
        </Typography>

        <Grid container spacing={3}>
          {metrics.map((metric, index) => (
            <Grid item xs={12} sm={6} md={4} key={index}>
              <Card>
                <CardContent>
                  <Box
                    sx={{ display: "flex", alignItems: "flex-start", mb: 2 }}
                  >
                    <Box
                      sx={{
                        p: 1,
                        borderRadius: 2,
                        bgcolor: `${metric.color}15`,
                        color: metric.color,
                        mr: 2,
                      }}
                    >
                      {metric.icon}
                    </Box>
                    <Box sx={{ flex: 1 }}>
                      <Box
                        sx={{ display: "flex", alignItems: "center", gap: 1 }}
                      >
                        <Typography variant="body2" color="text.secondary">
                          {metric.title}
                        </Typography>
                        <Tooltip
                          title={
                            TOOLTIPS[metric.tooltipKey as keyof typeof TOOLTIPS]
                          }
                        >
                          <IconButton size="small" sx={{ p: 0 }}>
                            <HelpOutline sx={{ fontSize: 16 }} />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </Box>
                  </Box>
                  <Typography variant="h4">{metric.value}</Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        <Box sx={{ mt: 4 }}>
          <Typography variant="h6" gutterBottom>
            Statistiche Rapide
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography
                    variant="subtitle2"
                    color="text.secondary"
                    gutterBottom
                  >
                    Snapshot Totali
                  </Typography>
                  <Typography variant="h5">{snapshots?.length || 0}</Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography
                    variant="subtitle2"
                    color="text.secondary"
                    gutterBottom
                  >
                    Ultimo Aggiornamento
                  </Typography>
                  <Typography variant="h6">
                    {snapshots?.[0]?.date
                      ? new Date(snapshots[0].date).toLocaleDateString("it-IT")
                      : "N/A"}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Box>
      </Box>
    </Container>
  );
}
