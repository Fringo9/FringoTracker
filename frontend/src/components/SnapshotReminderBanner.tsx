import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Alert, AlertTitle, Button, Collapse } from "@mui/material";
import { NotificationsActive as NotificationsIcon } from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

const DISMISS_KEY_PREFIX = "snapshot-reminder-dismissed-";

function getCurrentMonthKey(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

function getMonthLabel(): string {
  return new Date().toLocaleDateString("it-IT", {
    month: "long",
    year: "numeric",
  });
}

export default function SnapshotReminderBanner() {
  const navigate = useNavigate();
  const monthKey = getCurrentMonthKey();
  const dismissKey = `${DISMISS_KEY_PREFIX}${monthKey}`;

  const [dismissed, setDismissed] = useState(() => {
    return sessionStorage.getItem(dismissKey) === "true";
  });

  const { data: summary } = useQuery({
    queryKey: ["snapshotsSummary"],
    queryFn: async () => {
      const response = await api.get("/snapshots/summary");
      return response.data;
    },
    staleTime: 60_000,
  });

  const handleDismiss = () => {
    sessionStorage.setItem(dismissKey, "true");
    setDismissed(true);
  };

  const handleNavigate = () => {
    navigate("/manual-snapshot");
  };

  // Determine if we need to show the banner
  if (dismissed) return null;
  if (!summary) return null;

  // Check if there's already a snapshot for the current month
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();

  if (summary.lastDate) {
    const lastDate = new Date(summary.lastDate);
    if (
      lastDate.getFullYear() === currentYear &&
      lastDate.getMonth() === currentMonth
    ) {
      // Already have a snapshot this month
      return null;
    }
  }

  return (
    <Collapse in={!dismissed}>
      <Alert
        severity="info"
        icon={<NotificationsIcon />}
        onClose={handleDismiss}
        action={
          <Button
            color="inherit"
            size="small"
            onClick={handleNavigate}
            sx={{ fontWeight: 600 }}
          >
            Compila ora
          </Button>
        }
        sx={{
          mb: 2,
          borderRadius: 2,
          "& .MuiAlert-action": {
            alignItems: "center",
          },
        }}
      >
        <AlertTitle sx={{ fontWeight: 700, mb: 0 }}>
          Promemoria Snapshot
        </AlertTitle>
        Non hai ancora inserito lo snapshot di{" "}
        <strong>{getMonthLabel()}</strong>!
      </Alert>
    </Collapse>
  );
}
