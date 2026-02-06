import express from "express";
import cors from "cors";
import helmet from "helmet";
import dotenv from "dotenv";
import rateLimit from "express-rate-limit";
import authRoutes from "./routes/auth.js";
import snapshotRoutes from "./routes/snapshots.js";
import snapshotTemplateRoutes from "./routes/snapshotTemplate.js";
import analyticsRoutes from "./routes/analytics.js";
import importRoutes from "./routes/import.js";
import milestoneRoutes from "./routes/milestones.js";
import categoryDefinitionRoutes from "./routes/categoryDefinitions.js";
import itemRoutes from "./routes/items.js";
import { errorHandler } from "./middleware/errorHandler.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(helmet());

// Rate limiting
const globalLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100, // 100 requests per minute per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests, please try again later." },
});

const authLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // 10 requests per minute per IP (brute-force protection)
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: "Too many authentication attempts, please try again later.",
  },
});

app.use(globalLimiter);

// CORS configuration - allow both dev ports
const allowedOrigins = [
  "http://localhost:3000",
  "http://localhost:3001",
  process.env.FRONTEND_URL,
].filter((x): x is string => Boolean(x));

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  }),
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use("/api/auth", authLimiter, authRoutes);
app.use("/api/snapshots", snapshotRoutes);
app.use("/api/snapshot-template", snapshotTemplateRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/import", importRoutes);
app.use("/api/milestones", milestoneRoutes);
app.use("/api/category-definitions", categoryDefinitionRoutes);
app.use("/api/items", itemRoutes);

// Health check
app.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Error handling
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
