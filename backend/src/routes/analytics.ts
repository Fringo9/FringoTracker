import { Router } from "express";
import { authMiddleware, AuthRequest } from "../middleware/auth.js";
import { firestore } from "../services/firebase.js";

const router = Router();

router.get("/", authMiddleware, async (req: AuthRequest, res) => {
  try {
    const userId = req.userId!;

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
        runwayReal: 0,
        volatilityAnnualized: 0,
        maxDrawdown: 0,
        categoryBreakdown: [],
        projection: { optimistic: 0, realistic: 0, pessimistic: 0, months: 12 },
      });
    }

    const snapshots = snapshotsSnapshot.docs
      .map((doc: any) => {
        const date = doc.data().date?.toDate
          ? doc.data().date.toDate()
          : new Date(doc.data().date);
        return {
          id: doc.id,
          ...doc.data(),
          date: date,
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
    const runwayReal =
      monthlyAvgSavings !== 0 ? totalWealth / Math.abs(monthlyAvgSavings) : 0;

    // Category breakdown (from latest snapshot)
    const latestSnapshotId = snapshots[snapshots.length - 1].id;
    const categoriesSnapshot = await firestore
      .collection("categories")
      .where("snapshotId", "==", latestSnapshotId)
      .get();

    const categoryBreakdown = categoriesSnapshot.docs.map((doc: any) => {
      const data = doc.data();
      return {
        categoryType: data.categoryType,
        value: data.value,
        percentage: (data.value / totalWealth) * 100,
        change: 0, // TODO: Calculate vs previous
      };
    });

    // Projections
    const projection = calculateProjections(totalWealth, monthlyAvgSavings, 12);

    res.json({
      totalWealth,
      monthlyAvgSavings,
      cagrTotal,
      cagrYoY,
      volatility,
      volatilityAnnualized,
      maxDrawdown,
      runway,
      runwayReal,
      categoryBreakdown,
      projection,
    });
  } catch (error) {
    console.error("Analytics error:", error);
    res.status(500).json({ error: "Failed to calculate analytics" });
  }
});

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

export default router;
