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
  SwapVert,
  TrendingFlat,
  Balance,
} from "@mui/icons-material";
import api from "../services/api";
import { formatCurrency, formatPercentage } from "../utils/helpers";

const TOOLTIPS = {
  totalWealth:
    "Il valore complessivo di tutti i tuoi beni (conti bancari, investimenti, immobili, contanti) meno i debiti. Rappresenta la tua situazione patrimoniale netta attuale.",
  monthlyAvgSavings:
    "La differenza media di patrimonio mese su mese, calcolata dal primo al più recente snapshot. Un valore positivo indica che stai accumulando ricchezza.",
  cagrTotal:
    "Tasso di crescita annuo composto (CAGR) del tuo patrimonio dall'inizio del tracking. Permette di confrontare la tua crescita con benchmark come l'inflazione.",
  cagrYoY:
    "Tasso di crescita annuo composto calcolato sugli ultimi 12 mesi. Utile per capire se il trend recente è migliorato o peggiorato rispetto alla media storica.",
  volatilityAnnualized:
    "Misura quanto i rendimenti mensili del tuo patrimonio variano nel corso dell'anno. Una volatilità alta indica oscillazioni significative; una bassa indica stabilità.",
  maxDrawdown:
    "La perdita percentuale massima subita dal punto più alto al punto più basso del patrimonio. Indica il peggior scenario storico che hai attraversato.",
  runway:
    "Il numero di mesi durante i quali potresti mantenere il tuo stile di vita attuale usando solo il patrimonio, al ritmo di risparmio medio corrente.",
  absoluteChange:
    "La variazione in euro del tuo patrimonio dal primo snapshot registrato ad oggi. Mostra quanto hai guadagnato o perso in termini assoluti.",
  lastMonthChange:
    "La variazione del patrimonio nell'ultimo mese, sia in euro che in percentuale. Ti dice se il mese più recente è stato positivo o negativo.",
  debtRatio:
    "Il rapporto tra i tuoi debiti (Debito + Finanziamento) e il patrimonio totale. Un valore sotto il 30% è generalmente considerato sano per le finanze personali.",
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
    staleTime: 60_000,
  });

  const { data: snapshotSummary } = useQuery({
    queryKey: ["snapshotsSummary"],
    queryFn: async () => {
      const response = await api.get("/snapshots/summary");
      return response.data;
    },
    staleTime: 60_000,
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
      value: formatCurrency(analytics?.totalWealth ?? 0),
      icon: <AccountBalance />,
      color: "primary.main",
      tooltipKey: "totalWealth",
    },
    {
      title: "Risparmio Medio Mensile",
      value: formatCurrency(analytics?.monthlyAvgSavings ?? 0),
      icon: <Savings />,
      color: "success.main",
      tooltipKey: "monthlyAvgSavings",
    },
    {
      title: "Variazione Assoluta",
      value: formatCurrency(analytics?.absoluteChange ?? 0),
      icon: <SwapVert />,
      color:
        (analytics?.absoluteChange ?? 0) >= 0 ? "success.main" : "error.main",
      tooltipKey: "absoluteChange",
    },
    {
      title: "Variazione Ultimo Mese",
      value: `${formatCurrency(analytics?.lastMonthChange ?? 0)} (${formatPercentage(analytics?.lastMonthChangePercent ?? 0)})`,
      icon: <TrendingFlat />,
      color:
        (analytics?.lastMonthChange ?? 0) >= 0 ? "success.main" : "error.main",
      tooltipKey: "lastMonthChange",
    },
    {
      title: "CAGR Totale",
      value: formatPercentage(analytics?.cagrTotal ?? 0),
      icon: <TrendingUp />,
      color: "info.main",
      tooltipKey: "cagrTotal",
    },
    {
      title: "CAGR Ultimo Anno",
      value: formatPercentage(analytics?.cagrYoY ?? 0),
      icon: <ShowChart />,
      color: "secondary.main",
      tooltipKey: "cagrYoY",
    },
    {
      title: "Volatilità Annualizzata",
      value: formatPercentage(analytics?.volatilityAnnualized ?? 0),
      icon: <Timeline />,
      color: "warning.main",
      tooltipKey: "volatilityAnnualized",
    },
    {
      title: "Max Drawdown",
      value: formatPercentage(analytics?.maxDrawdown ?? 0),
      icon: <ShowChart />,
      color: "error.main",
      tooltipKey: "maxDrawdown",
    },
    {
      title: "Runway (Mesi)",
      value: Math.round(analytics?.runway ?? 0),
      icon: <CalendarMonth />,
      color: "warning.main",
      tooltipKey: "runway",
    },
    {
      title: "Rapporto Debito/Patrimonio",
      value: formatPercentage(analytics?.debtRatio ?? 0),
      icon: <Balance />,
      color: (analytics?.debtRatio ?? 0) > 30 ? "error.main" : "success.main",
      tooltipKey: "debtRatio",
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
                      mb: 2,
                    }}
                  >
                    <Box
                      sx={{
                        p: 1.5,
                        borderRadius: 3,
                        bgcolor: `${metric.color}20`,
                        color: metric.color,
                        mb: 2,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "56px",
                      }}
                    >
                      {metric.icon}
                    </Box>
                    <Box sx={{ width: "100%" }}>
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: 1,
                          mb: 1,
                        }}
                      >
                        <Typography variant="body2" color="text.secondary">
                          {metric.title}
                        </Typography>
                        <Tooltip
                          title={
                            TOOLTIPS[metric.tooltipKey as keyof typeof TOOLTIPS]
                          }
                          placement="top"
                          arrow
                        >
                          <IconButton size="small" sx={{ p: 0 }}>
                            <HelpOutline sx={{ fontSize: 16 }} />
                          </IconButton>
                        </Tooltip>
                      </Box>
                      <Typography variant="h4" sx={{ fontWeight: 700 }}>
                        {metric.value}
                      </Typography>
                    </Box>
                  </Box>
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
              <Card
                variant="outlined"
                sx={{
                  borderRadius: 3,
                  borderColor: "rgba(37, 99, 235, 0.12)",
                  background:
                    "linear-gradient(135deg, rgba(14,165,233,0.12) 0%, rgba(255,255,255,1) 55%)",
                }}
              >
                <CardContent>
                  <Typography
                    variant="subtitle2"
                    color="text.secondary"
                    gutterBottom
                  >
                    Snapshot Totali
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 700 }}>
                    {snapshotSummary?.count ?? 0}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={6}>
              <Card
                variant="outlined"
                sx={{
                  borderRadius: 3,
                  borderColor: "rgba(37, 99, 235, 0.12)",
                  background:
                    "linear-gradient(135deg, rgba(37,99,235,0.12) 0%, rgba(255,255,255,1) 55%)",
                }}
              >
                <CardContent>
                  <Typography
                    variant="subtitle2"
                    color="text.secondary"
                    gutterBottom
                  >
                    Ultimo Aggiornamento
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: 600 }}>
                    {snapshotSummary?.lastDate
                      ? new Date(snapshotSummary.lastDate).toLocaleDateString(
                          "it-IT",
                        )
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
