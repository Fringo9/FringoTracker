import { createTheme, type Components, type Theme } from "@mui/material/styles";

// Type augmentation for MUI X DataGrid theme components
declare module "@mui/material/styles" {
  interface Components {
    MuiDataGrid?: Record<string, any>;
  }
}

export function getTheme(mode: "light" | "dark") {
  const isLight = mode === "light";

  return createTheme({
    palette: {
      mode,
      primary: {
        main: "#2563eb",
        light: "#60a5fa",
        dark: "#1d4ed8",
      },
      secondary: {
        main: "#0ea5e9",
        light: "#7dd3fc",
        dark: "#0284c7",
      },
      success: {
        main: "#2e7d32",
      },
      error: {
        main: "#d32f2f",
      },
      background: {
        default: isLight ? "#f1f7ff" : "#0f172a",
        paper: isLight ? "#ffffff" : "#1e293b",
      },
      info: {
        main: "#38bdf8",
      },
    },
    typography: {
      fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
      h1: {
        fontSize: "2.5rem",
        fontWeight: 500,
      },
      h2: {
        fontSize: "2rem",
        fontWeight: 500,
      },
      h3: {
        fontSize: "1.75rem",
        fontWeight: 500,
      },
      h4: {
        fontWeight: 600,
      },
      h6: {
        fontWeight: 600,
      },
    },
    shape: {
      borderRadius: 12,
    },
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          body: {
            background: isLight
              ? "linear-gradient(180deg, #f1f7ff 0%, #f8fbff 100%)"
              : "linear-gradient(180deg, #0f172a 0%, #1e293b 100%)",
          },
        },
      },
      MuiButton: {
        styleOverrides: {
          root: {
            textTransform: "none",
            borderRadius: 10,
            fontWeight: 600,
            transition: "transform 0.15s ease, box-shadow 0.2s ease",
            "&:hover": {
              transform: "translateY(-1px)",
              boxShadow: isLight
                ? "0 8px 18px rgba(37, 99, 235, 0.2)"
                : "0 8px 18px rgba(37, 99, 235, 0.35)",
            },
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            borderRadius: 16,
            boxShadow: isLight
              ? "0 10px 30px rgba(37, 99, 235, 0.08)"
              : "0 10px 30px rgba(0, 0, 0, 0.3)",
            border: isLight
              ? "1px solid rgba(37, 99, 235, 0.08)"
              : "1px solid rgba(255, 255, 255, 0.08)",
            transition: "transform 0.2s ease, box-shadow 0.2s ease",
            "&:hover": {
              transform: "translateY(-2px)",
              boxShadow: isLight
                ? "0 18px 38px rgba(37, 99, 235, 0.12)"
                : "0 18px 38px rgba(0, 0, 0, 0.4)",
            },
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            borderRadius: 16,
          },
        },
      },
      MuiAppBar: {
        styleOverrides: {
          root: {
            boxShadow: "none",
          },
        },
      },
      MuiDrawer: {
        styleOverrides: {
          paper: {
            borderRight: isLight
              ? "1px solid rgba(37, 99, 235, 0.1)"
              : "1px solid rgba(255, 255, 255, 0.08)",
            background: isLight ? "#f8fbff" : "#1e293b",
          },
        },
      },
      MuiListItemButton: {
        styleOverrides: {
          root: {
            borderRadius: 12,
            marginBottom: 4,
            paddingLeft: 12,
            paddingRight: 12,
            transition: "background-color 0.2s ease, transform 0.2s ease",
            "&:hover": {
              transform: "translateX(2px)",
            },
            "&.Mui-selected": {
              backgroundColor: isLight
                ? "rgba(37, 99, 235, 0.12)"
                : "rgba(37, 99, 235, 0.25)",
            },
            "&.Mui-selected:hover": {
              backgroundColor: isLight
                ? "rgba(37, 99, 235, 0.18)"
                : "rgba(37, 99, 235, 0.35)",
            },
          },
        },
      },
      MuiChip: {
        styleOverrides: {
          root: {
            borderRadius: 999,
          },
        },
      },
      MuiDataGrid: {
        styleOverrides: {
          root: {
            border: "none",
          },
          columnHeaders: {
            backgroundColor: isLight
              ? "rgba(37, 99, 235, 0.06)"
              : "rgba(37, 99, 235, 0.15)",
            borderBottom: isLight
              ? "1px solid rgba(37, 99, 235, 0.12)"
              : "1px solid rgba(255, 255, 255, 0.1)",
          },
          row: {
            borderBottom: isLight
              ? "1px solid rgba(37, 99, 235, 0.08)"
              : "1px solid rgba(255, 255, 255, 0.06)",
          },
        },
      },
      MuiDialogContent: {
        styleOverrides: {
          root: {
            paddingTop: "24px !important",
            paddingBottom: "24px !important",
            paddingLeft: "24px !important",
            paddingRight: "24px !important",
          },
        },
      },
    },
  });
}

// Default export for backward compat
export const theme = getTheme("light");
