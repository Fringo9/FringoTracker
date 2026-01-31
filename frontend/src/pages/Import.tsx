import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Box,
  Container,
  Typography,
  Paper,
  Button,
  Stepper,
  Step,
  StepLabel,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  LinearProgress,
  Chip,
} from "@mui/material";
import { Upload, CheckCircle, ErrorOutline } from "@mui/icons-material";
import { useDropzone } from "react-dropzone";
import { read, utils } from "xlsx";
import { PREDEFINED_CATEGORIES } from "../types";
import api from "../services/api";

interface ParsedData {
  date: string;
  categories: { [key: string]: number };
  total: number;
}

const MONTH_MAP: { [key: string]: number } = {
  gennaio: 0,
  gen: 0,
  febbraio: 1,
  feb: 1,
  marzo: 2,
  mar: 2,
  aprile: 3,
  apr: 3,
  maggio: 4,
  mag: 4,
  giugno: 5,
  giu: 5,
  luglio: 6,
  lug: 6,
  agosto: 7,
  ago: 7,
  settembre: 8,
  set: 8,
  ottobre: 9,
  ott: 9,
  novembre: 10,
  nov: 10,
  dicembre: 11,
  dic: 11,
};

export default function Import() {
  const [activeStep, setActiveStep] = useState(0);
  const [file, setFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<ParsedData[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [importResult, setImportResult] = useState<{
    success: number;
    failed: number;
  } | null>(null);

  const { data: categoryDefinitions } = useQuery({
    queryKey: ["category-definitions"],
    queryFn: async () => {
      const response = await api.get("/category-definitions");
      return response.data;
    },
  });

  const steps = ["Carica File", "Preview Dati", "Conferma Import"];

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [
        ".xlsx",
      ],
      "application/vnd.ms-excel": [".xls"],
    },
    maxFiles: 1,
    onDrop: (acceptedFiles) => {
      if (acceptedFiles.length > 0) {
        setFile(acceptedFiles[0]);
        parseExcel(acceptedFiles[0]);
      }
    },
  });

  const parseExcel = async (file: File) => {
    setLoading(true);
    setError("");

    try {
      const data = await file.arrayBuffer();
      const workbook = read(data);
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData: any[][] = utils.sheet_to_json(worksheet, {
        header: 1,
      });

      // Trova la riga delle intestazioni (quella con i mesi o date)
      let headerRowIndex = -1;
      for (let i = 0; i < Math.min(5, jsonData.length); i++) {
        const row = jsonData[i];
        const hasMonth = row.some((cell: any) => {
          // Check if it's a Date object (Excel converts "gen-24" to dates)
          if (cell instanceof Date || typeof cell === "number") {
            return true;
          }
          if (typeof cell !== "string") return false;
          const lowerCell = cell.toLowerCase().trim();
          // Check format "gen-24" or full month name
          const match = lowerCell.match(/^([a-z]+)-(\d{2})$/);
          if (match && match[1] in MONTH_MAP) return true;
          return lowerCell in MONTH_MAP;
        });
        if (hasMonth) {
          headerRowIndex = i;
          break;
        }
      }

      if (headerRowIndex === -1) {
        throw new Error(
          "Impossibile trovare la riga con i mesi nel file Excel",
        );
      }

      const headers = jsonData[headerRowIndex] as any[];
      const monthIndices: { month: number; col: number; year: number }[] = [];

      // Identifica le colonne dei mesi (date o stringhe)
      headers.forEach((header, index) => {
        let dateObj: Date | null = null;

        // Se è già un oggetto Date
        if (header instanceof Date) {
          dateObj = header;
        }
        // Se è un numero seriale Excel (giorni dal 1900-01-01)
        else if (typeof header === "number") {
          // Convert Excel serial number to Date
          const excelEpoch = new Date(1900, 0, 1);
          dateObj = new Date(
            excelEpoch.getTime() + (header - 2) * 24 * 60 * 60 * 1000,
          );
        }
        // Se è una stringa
        else if (typeof header === "string") {
          const lowerHeader = header.toLowerCase().trim();

          // Check format "gen-24", "mar-24" etc
          const match = lowerHeader.match(/^([a-z]+)-(\d{2})$/);
          if (match) {
            const [, monthAbbr, yearSuffix] = match;
            if (monthAbbr in MONTH_MAP) {
              const year = 2000 + parseInt(yearSuffix, 10);
              const month = MONTH_MAP[monthAbbr];
              monthIndices.push({ month, col: index, year });
            }
          }
          // Check full month name
          else if (lowerHeader in MONTH_MAP) {
            const month = MONTH_MAP[lowerHeader];
            monthIndices.push({
              month,
              col: index,
              year: new Date().getFullYear(),
            });
          }
        }

        // Se abbiamo una data, estraiamo mese e anno
        if (dateObj && !isNaN(dateObj.getTime())) {
          monthIndices.push({
            month: dateObj.getMonth(),
            col: index,
            year: dateObj.getFullYear(),
          });
        }
      });

      if (monthIndices.length === 0) {
        throw new Error("Nessun mese trovato nelle intestazioni");
      }

      // Estrai i dati per ogni mese
      const parsed: ParsedData[] = [];

      monthIndices.forEach(({ month, col, year }) => {
        const categories: { [key: string]: number } = {};
        let total = 0;

        // Leggi tutte le righe dopo l'intestazione
        for (
          let rowIndex = headerRowIndex + 1;
          rowIndex < jsonData.length;
          rowIndex++
        ) {
          const row = jsonData[rowIndex];
          const categoryName = row[0];

          if (!categoryName || typeof categoryName !== "string") continue;
          if (categoryName.toLowerCase() === "totale") {
            total = parseFloat(String(row[col] || 0).replace(",", ".")) || 0;
            break;
          }

          const value =
            parseFloat(String(row[col] || 0).replace(",", ".")) || 0;
          categories[categoryName.trim()] = value;
        }

        parsed.push({
          date: new Date(year, month, 1).toISOString(),
          categories,
          total,
        });
      });

      setParsedData(parsed);
      setActiveStep(1);
    } catch (err: any) {
      setError(err.message || "Errore durante il parsing del file");
    } finally {
      setLoading(false);
    }
  };

  const handleImport = async () => {
    setLoading(true);
    setError("");

    let success = 0;
    let failed = 0;

    try {
      for (const snapshot of parsedData) {
        try {
          // Mappa le categorie Excel alle categorie predefinite
          const categorySource =
            categoryDefinitions && categoryDefinitions.length > 0
              ? categoryDefinitions
              : PREDEFINED_CATEGORIES.map((cat) => ({
                  name: cat.name,
                  categoryType: cat.type,
                  sortOrder: cat.sortOrder,
                }));

          const mappedCategories = categorySource.map((predefCat: any) => {
            const excelValue = snapshot.categories[predefCat.name] ?? 0;
            return {
              name: predefCat.name,
              categoryType: predefCat.categoryType || predefCat.type,
              value: excelValue,
              sortOrder: predefCat.sortOrder,
            };
          });

          await api.post("/snapshots", {
            date: snapshot.date,
            frequency: "monthly",
            totalValue: snapshot.total,
            categories: mappedCategories,
          });

          success++;
        } catch (err) {
          console.error("Error importing snapshot:", err);
          failed++;
        }
      }

      setImportResult({ success, failed });
      setActiveStep(2);
    } catch (err: any) {
      setError(err.response?.data?.message || "Errore durante l'import");
    } finally {
      setLoading(false);
    }
  };

  const renderStepContent = () => {
    switch (activeStep) {
      case 0:
        return (
          <Box>
            <Paper
              {...getRootProps()}
              sx={{
                p: 6,
                textAlign: "center",
                border: "2px dashed",
                borderColor: isDragActive ? "primary.main" : "grey.300",
                bgcolor: isDragActive ? "action.hover" : "transparent",
                cursor: "pointer",
                "&:hover": {
                  borderColor: "primary.main",
                  bgcolor: "action.hover",
                },
              }}
            >
              <input {...getInputProps()} />
              <Upload sx={{ fontSize: 60, color: "primary.main", mb: 2 }} />
              <Typography variant="h6" gutterBottom>
                {isDragActive
                  ? "Rilascia il file qui"
                  : "Trascina il file Excel qui"}
              </Typography>
              <Typography color="text.secondary" mb={2}>
                oppure clicca per selezionare
              </Typography>
              <Button variant="outlined">Seleziona File</Button>
            </Paper>

            {file && (
              <Alert severity="info" sx={{ mt: 2 }}>
                File selezionato: {file.name}
              </Alert>
            )}
          </Box>
        );

      case 1:
        return (
          <Box>
            <Alert severity="info" sx={{ mb: 3 }}>
              Verranno importati {parsedData.length} snapshot mensili. Controlla
              i dati prima di procedere.
            </Alert>

            <TableContainer component={Paper} sx={{ maxHeight: 500 }}>
              <Table stickyHeader size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Data</TableCell>
                    <TableCell align="right">Totale</TableCell>
                    <TableCell align="right">Categorie</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {parsedData.map((data, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        {new Date(data.date).toLocaleDateString("it-IT", {
                          year: "numeric",
                          month: "long",
                        })}
                      </TableCell>
                      <TableCell align="right">
                        {data.total.toLocaleString("it-IT", {
                          style: "currency",
                          currency: "EUR",
                        })}
                      </TableCell>
                      <TableCell align="right">
                        <Chip
                          label={`${Object.keys(data.categories).length} categorie`}
                          size="small"
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            <Box sx={{ mt: 3, display: "flex", gap: 2 }}>
              <Button onClick={() => setActiveStep(0)}>Indietro</Button>
              <Button variant="contained" onClick={handleImport}>
                Conferma Import
              </Button>
            </Box>
          </Box>
        );

      case 2:
        return (
          <Box textAlign="center" py={4}>
            {importResult && importResult.success > 0 ? (
              <>
                <CheckCircle
                  sx={{ fontSize: 80, color: "success.main", mb: 2 }}
                />
                <Typography variant="h5" gutterBottom>
                  Import Completato!
                </Typography>
                <Typography color="text.secondary" mb={3}>
                  {importResult.success} snapshot importati con successo
                  {importResult.failed > 0 &&
                    ` (${importResult.failed} falliti)`}
                </Typography>
                <Button variant="contained" href="/snapshots">
                  Visualizza Snapshot
                </Button>
              </>
            ) : (
              <>
                <ErrorOutline
                  sx={{ fontSize: 80, color: "error.main", mb: 2 }}
                />
                <Typography variant="h5" gutterBottom>
                  Import Fallito
                </Typography>
                <Typography color="text.secondary" mb={3}>
                  Nessun dato è stato importato
                </Typography>
                <Button variant="outlined" onClick={() => setActiveStep(0)}>
                  Riprova
                </Button>
              </>
            )}
          </Box>
        );

      default:
        return null;
    }
  };

  return (
    <Container maxWidth="lg">
      <Box sx={{ py: 4 }}>
        <Typography variant="h4" gutterBottom>
          Import Dati da Excel
        </Typography>
        <Typography color="text.secondary" mb={4}>
          Importa i tuoi dati storici dal file Excel
        </Typography>

        <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {loading && <LinearProgress sx={{ mb: 3 }} />}

        {renderStepContent()}
      </Box>
    </Container>
  );
}
