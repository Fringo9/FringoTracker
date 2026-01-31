import express from "express";
import cors from "cors";
import helmet from "helmet";
import dotenv from "dotenv";
import authRoutes from "./routes/auth.js";
import snapshotRoutes from "./routes/snapshots.js";
import analyticsRoutes from "./routes/analytics.js";
import importRoutes from "./routes/import.js";
import milestoneRoutes from "./routes/milestones.js";
import categoryDefinitionRoutes from "./routes/categoryDefinitions.js";
import { errorHandler } from "./middleware/errorHandler.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(helmet());
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    credentials: true,
  }),
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/snapshots", snapshotRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/import", importRoutes);
app.use("/api/milestones", milestoneRoutes);
app.use("/api/category-definitions", categoryDefinitionRoutes);

// Health check
app.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Error handling
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
