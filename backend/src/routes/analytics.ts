import { Router } from "express";
import { authMiddleware, AuthRequest } from "../middleware/auth.js";
import { firestore } from "../services/firebase.js";
import {
  getAnalyticsCache,
  setAnalyticsCache,
} from "../services/analyticsCache.js";

const router = Router();

router.get("/", authMiddleware, async (req: AuthRequest, res) => {
  try {
    const userId = req.userId!;

    // Check cache first
    const cached = getAnalyticsCache(userId);
    if (cached) {
      return res.json(cached);
    }

    // Get all snapshots
    const snapshotsSnapshot = await firestore
      .collection("snapshots")
      .where("userId", "==", userId)
      .get();

    if (snapshotsSnapshot.empty) {
      return res.json({
        totalWealth: 0,
        monthlyAvgSavings: 0,
        cagrTotal: 0,
        cagrYoY: 0,
        volatility: 0,
        runway: 0,
        volatilityAnnualized: 0,
        maxDrawdown: 0,
        absoluteChange: 0,
        lastMonthChange: 0,
        lastMonthChangePercent: 0,
        debtRatio: 0,
        monthlyHeatmapData: [],
        categoryBreakdown: [],
        projection: { optimistic: 0, realistic: 0, pessimistic: 0, months: 12 },
      });
    }

    // Batch-fetch all items for this user (1 query instead of N*M)
    const itemsSnapshot = await firestore
      .collection("items")
      .where("userId", "==", userId)
      .get();
    const itemsMap = new Map<string, any>();
    itemsSnapshot.docs.forEach((doc: any) => {
      itemsMap.set(doc.id, doc.data());
    });

    // Batch-fetch all snapshot entries for this user (1 query instead of N)
    const allEntriesSnapshot = await firestore
      .collection("snapshotEntries")
      .where("userId", "==", userId)
      .get();
    const entriesBySnapshotId = new Map<string, any[]>();
    allEntriesSnapshot.docs.forEach((entryDoc: any) => {
      const entryData = entryDoc.data();
      const snapshotId = entryData.snapshotId;
      if (!entriesBySnapshotId.has(snapshotId)) {
        entriesBySnapshotId.set(snapshotId, []);
      }
      entriesBySnapshotId.get(snapshotId)!.push({
        value: entryData.value,
        item: itemsMap.get(entryData.itemId) || null,
      });
    });

    // Build snapshots with entries resolved in-memory
    const snapshots = snapshotsSnapshot.docs
      .map((doc: any) => {
        const date = doc.data().date?.toDate
          ? doc.data().date.toDate()
          : new Date(doc.data().date);
        return {
          id: doc.id,
          ...doc.data(),
          date: date,
          entries: entriesBySnapshotId.get(doc.id) || [],
        };
      })
      .sort(
        (a: any, b: any) =>
          new Date(a.date).getTime() - new Date(b.date).getTime(),
      );

    // Calculate analytics
    const totalWealth = snapshots[snapshots.length - 1].totalValue;
    const values = snapshots.map((s: any) => s.totalValue);

    // Monthly average savings
    const monthlyAvgSavings = calculateMonthlyAvgSavings(snapshots);

    // CAGR
    const yearsTotal =
      (snapshots[snapshots.length - 1].date.getTime() -
        snapshots[0].date.getTime()) /
      (365.25 * 24 * 60 * 60 * 1000);
    const cagrTotal = calculateCAGR(
      snapshots[0].totalValue,
      totalWealth,
      yearsTotal,
    );

    // YoY CAGR (last 12 months)
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
    const yearSnapshots = snapshots.filter((s: any) => s.date >= oneYearAgo);
    const cagrYoY =
      yearSnapshots.length >= 2
        ? calculateCAGR(
            yearSnapshots[0].totalValue,
            yearSnapshots[yearSnapshots.length - 1].totalValue,
            1,
          )
        : 0;

    // Volatility
    const volatility = calculateVolatility(values);

    // Annualized volatility (percentage)
    const volatilityAnnualized = calculateAnnualizedVolatility(values);

    // Max drawdown (percentage)
    const maxDrawdown = calculateMaxDrawdown(values);

    // Runway (months of autonomy)
    const runway = monthlyAvgSavings > 0 ? totalWealth / monthlyAvgSavings : 0;

    // Absolute change (total € difference since first snapshot)
    const absoluteChange = totalWealth - snapshots[0].totalValue;

    // Last month change
    const lastMonthChange =
      snapshots.length >= 2
        ? snapshots[snapshots.length - 1].totalValue -
          snapshots[snapshots.length - 2].totalValue
        : 0;
    const lastMonthChangePercent =
      snapshots.length >= 2 && snapshots[snapshots.length - 2].totalValue !== 0
        ? (lastMonthChange / snapshots[snapshots.length - 2].totalValue) * 100
        : 0;

    // Debt ratio (sum of Debito+Finanziamento / totalWealth)
    let debtTotal = 0;

    // Category breakdown (from latest snapshot)
    const latestSnapshot = snapshots[snapshots.length - 1];
    const categoryBreakdown: any[] = [];

    if (latestSnapshot.entries) {
      const categoryTotals: Record<string, number> = {};

      // Group entries by category - usa il valore così com'è, senza applicare segno
      latestSnapshot.entries.forEach((entry: any) => {
        if (entry.item) {
          const category = entry.item.category;
          const value = entry.value;

          if (!categoryTotals[category]) {
            categoryTotals[category] = 0;
          }
          categoryTotals[category] += value;

          // Accumulate debt categories
          if (category === "Debito" || category === "Finanziamento") {
            debtTotal += Math.abs(value);
          }
        }
      });

      // Convert to array format
      Object.entries(categoryTotals).forEach(([category, value]) => {
        categoryBreakdown.push({
          categoryType: category,
          value: value,
          percentage: (value / totalWealth) * 100,
        });
      });
    }

    // Projections
    const projection = calculateProjections(totalWealth, monthlyAvgSavings, 12);

    const debtRatio = totalWealth > 0 ? (debtTotal / totalWealth) * 100 : 0;

    // Monthly heatmap data
    const monthlyHeatmapData = calculateMonthlyHeatmap(snapshots);

    const result = {
      totalWealth,
      monthlyAvgSavings,
      cagrTotal,
      cagrYoY,
      volatility,
      volatilityAnnualized,
      maxDrawdown,
      runway,
      absoluteChange,
      lastMonthChange,
      lastMonthChangePercent,
      debtRatio,
      monthlyHeatmapData,
      categoryBreakdown,
      projection,
    };

    // Store in cache
    setAnalyticsCache(userId, result);

    res.json(result);
  } catch (error) {
    console.error("Analytics error:", error);
    res.status(500).json({ error: "Failed to calculate analytics" });
  }
});

// Category history over time
router.get(
  "/category-history",
  authMiddleware,
  async (req: AuthRequest, res) => {
    try {
      const userId = req.userId!;

      const snapshotsSnapshot = await firestore
        .collection("snapshots")
        .where("userId", "==", userId)
        .get();

      if (snapshotsSnapshot.empty) {
        return res.json([]);
      }

      const itemsSnapshot = await firestore
        .collection("items")
        .where("userId", "==", userId)
        .get();
      const itemsMap = new Map<string, any>();
      itemsSnapshot.docs.forEach((doc: any) => {
        itemsMap.set(doc.id, doc.data());
      });

      const allEntriesSnapshot = await firestore
        .collection("snapshotEntries")
        .where("userId", "==", userId)
        .get();
      const entriesBySnapshotId = new Map<string, any[]>();
      allEntriesSnapshot.docs.forEach((entryDoc: any) => {
        const entryData = entryDoc.data();
        const snapshotId = entryData.snapshotId;
        if (!entriesBySnapshotId.has(snapshotId)) {
          entriesBySnapshotId.set(snapshotId, []);
        }
        entriesBySnapshotId.get(snapshotId)!.push({
          value: entryData.value,
          item: itemsMap.get(entryData.itemId) || null,
        });
      });

      const snapshots = snapshotsSnapshot.docs
        .map((doc: any) => {
          const date = doc.data().date?.toDate
            ? doc.data().date.toDate()
            : new Date(doc.data().date);
          return {
            id: doc.id,
            date,
            entries: entriesBySnapshotId.get(doc.id) || [],
          };
        })
        .sort(
          (a: any, b: any) =>
            new Date(a.date).getTime() - new Date(b.date).getTime(),
        );

      // Build per-snapshot category totals
      const result = snapshots.map((snap: any) => {
        const categoryTotals: Record<string, number> = {};
        snap.entries.forEach((entry: any) => {
          if (entry.item) {
            const cat = entry.item.category;
            categoryTotals[cat] = (categoryTotals[cat] || 0) + entry.value;
          }
        });
        return {
          date: snap.date.toISOString(),
          categories: categoryTotals,
        };
      });

      res.json(result);
    } catch (error) {
      console.error("Category history error:", error);
      res.status(500).json({ error: "Failed to fetch category history" });
    }
  },
);

function calculateMonthlyAvgSavings(snapshots: any[]): number {
  if (snapshots.length < 2) return 0;

  const first = snapshots[0];
  const last = snapshots[snapshots.length - 1];
  const months =
    (last.date.getTime() - first.date.getTime()) /
    (30.44 * 24 * 60 * 60 * 1000);

  if (months === 0) return 0;
  return (last.totalValue - first.totalValue) / months;
}

function calculateCAGR(
  startValue: number,
  endValue: number,
  years: number,
): number {
  if (startValue <= 0 || endValue <= 0 || years <= 0) return 0;
  return (Math.pow(endValue / startValue, 1 / years) - 1) * 100;
}

function calculateVolatility(values: number[]): number {
  if (values.length < 2) return 0;

  const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
  const squaredDiffs = values.map((val) => Math.pow(val - mean, 2));
  const variance =
    squaredDiffs.reduce((sum, val) => sum + val, 0) / values.length;

  return Math.sqrt(variance);
}

function calculateAnnualizedVolatility(values: number[]): number {
  if (values.length < 2) return 0;

  const returns: number[] = [];
  for (let i = 1; i < values.length; i++) {
    const prev = values[i - 1];
    const curr = values[i];
    if (prev > 0) {
      returns.push((curr - prev) / prev);
    }
  }

  if (returns.length < 2) return 0;

  const mean = returns.reduce((sum, val) => sum + val, 0) / returns.length;
  const squaredDiffs = returns.map((val) => Math.pow(val - mean, 2));
  const variance =
    squaredDiffs.reduce((sum, val) => sum + val, 0) / returns.length;
  const stdDev = Math.sqrt(variance);

  return stdDev * Math.sqrt(12) * 100;
}

function calculateMaxDrawdown(values: number[]): number {
  if (values.length < 2) return 0;

  let peak = values[0];
  let maxDrawdown = 0;

  values.forEach((value) => {
    if (value > peak) {
      peak = value;
    }
    const drawdown = (value - peak) / peak;
    if (drawdown < maxDrawdown) {
      maxDrawdown = drawdown;
    }
  });

  return maxDrawdown * 100;
}

function calculateProjections(
  currentValue: number,
  monthlyGrowth: number,
  months: number,
) {
  const baseProjection = currentValue + monthlyGrowth * months;
  return {
    optimistic: currentValue > 0 ? baseProjection * 1.2 : 0,
    realistic: currentValue > 0 ? baseProjection : 0,
    pessimistic: currentValue > 0 ? baseProjection * 0.8 : 0,
    months,
  };
}

function calculateMonthlyHeatmap(snapshots: any[]): Array<{
  year: number;
  month: number;
  change: number;
  changePercent: number;
}> {
  if (snapshots.length < 2) return [];

  // Group snapshots by year-month, pick the last one per month
  const monthlyMap = new Map<string, number>();
  snapshots.forEach((s: any) => {
    const d = new Date(s.date);
    const key = `${d.getFullYear()}-${d.getMonth()}`;
    monthlyMap.set(key, s.totalValue);
  });

  const sortedKeys = [...monthlyMap.keys()].sort((a, b) => {
    const [ay, am] = a.split("-").map(Number);
    const [by, bm] = b.split("-").map(Number);
    return ay !== by ? ay - by : am - bm;
  });

  const result: Array<{
    year: number;
    month: number;
    change: number;
    changePercent: number;
  }> = [];
  for (let i = 1; i < sortedKeys.length; i++) {
    const prev = monthlyMap.get(sortedKeys[i - 1])!;
    const curr = monthlyMap.get(sortedKeys[i])!;
    const [year, month] = sortedKeys[i].split("-").map(Number);
    const change = curr - prev;
    const changePercent = prev !== 0 ? (change / prev) * 100 : 0;
    result.push({ year, month, change, changePercent });
  }

  return result;
}

export default router;
