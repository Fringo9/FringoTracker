import { Component, ErrorInfo, ReactNode } from "react";
import { Box, Typography, Button, Container, Alert } from "@mui/material";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  handleReload = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <Container maxWidth="sm">
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              minHeight: "100vh",
              gap: 3,
              textAlign: "center",
            }}
          >
            <Typography variant="h4" gutterBottom>
              Qualcosa è andato storto
            </Typography>
            <Alert severity="error" sx={{ maxWidth: 500, width: "100%" }}>
              {this.state.error?.message ||
                "Errore imprevisto nell'applicazione"}
            </Alert>
            <Typography color="text.secondary">
              Prova a ricaricare la pagina. Se il problema persiste, contatta il
              supporto.
            </Typography>
            <Button
              variant="contained"
              onClick={this.handleReload}
              size="large"
            >
              Ricarica Pagina
            </Button>
          </Box>
        </Container>
      );
    }

    return this.props.children;
  }
}
