import { firestore } from "./firebase.js";
import bcrypt from "bcrypt";

const DEMO_EMAIL = "demo@fringotracker.it";
const DEMO_PASSWORD = "DemoFringo2026!";
const DEMO_DISPLAY_NAME = "Utente Demo";

// Default categories
const DEFAULT_CATEGORIES = [
  "Liquidi",
  "Banca",
  "Credito",
  "Investimenti",
  "Portafoglio",
  "Debito",
  "Finanziamento",
  "Condivise",
];

// Demo items definition
const DEMO_ITEMS = [
  { name: "Conto Corrente Principale", category: "Banca" },
  { name: "Conto Deposito", category: "Banca" },
  { name: "ETF Azionario Globale", category: "Investimenti" },
  { name: "ETF Obbligazionario", category: "Investimenti" },
  { name: "Crypto (BTC/ETH)", category: "Investimenti" },
  { name: "Contanti", category: "Liquidi" },
  { name: "Fondo Pensione", category: "Portafoglio" },
  { name: "Prestito Auto", category: "Finanziamento" },
  { name: "Carta di Credito", category: "Credito" },
  { name: "Conto Cointestato", category: "Condivise" },
];

// Generate 12 quarterly snapshots over 36 months
// Timeline: Q1 2023 → Q4 2025 (12 snapshots)
function generateSnapshotData(): {
  date: Date;
  values: Record<string, number>;
}[] {
  const snapshots: { date: Date; values: Record<string, number> }[] = [];

  // Base values (starting ~Q1 2023)
  const baseValues: Record<string, number> = {
    "Conto Corrente Principale": 4200,
    "Conto Deposito": 2000,
    "ETF Azionario Globale": 3500,
    "ETF Obbligazionario": 2000,
    "Crypto (BTC/ETH)": 800,
    Contanti: 350,
    "Fondo Pensione": 8200,
    "Prestito Auto": -7500,
    "Carta di Credito": -400,
    "Conto Cointestato": 1500,
  };

  // Growth trends per quarter (multipliers and deltas)
  const trends: Record<string, { growth: number; noise: number }> = {
    "Conto Corrente Principale": { growth: 1.02, noise: 500 },
    "Conto Deposito": { growth: 1.015, noise: 200 },
    "ETF Azionario Globale": { growth: 1.06, noise: 800 },
    "ETF Obbligazionario": { growth: 1.02, noise: 150 },
    "Crypto (BTC/ETH)": { growth: 1.08, noise: 600 },
    Contanti: { growth: 1.0, noise: 150 },
    "Fondo Pensione": { growth: 1.035, noise: 200 },
    "Prestito Auto": { growth: 0.88, noise: 50 }, // Reducing debt
    "Carta di Credito": { growth: 0.9, noise: 200 },
    "Conto Cointestato": { growth: 1.025, noise: 300 },
  };

  // Seeded random for reproducibility
  let seed = 42;
  function seededRandom(): number {
    seed = (seed * 16807 + 0) % 2147483647;
    return (seed - 1) / 2147483646;
  }

  const current = { ...baseValues };

  for (let q = 0; q < 12; q++) {
    // Quarter dates: end of Mar, Jun, Sep, Dec for 2023, 2024, 2025
    const year = 2023 + Math.floor(q / 4);
    const monthIndex = [2, 5, 8, 11][q % 4]; // Mar, Jun, Sep, Dec
    const lastDay = new Date(year, monthIndex + 1, 0).getDate();
    const date = new Date(year, monthIndex, lastDay);

    const values: Record<string, number> = {};

    for (const [name, base] of Object.entries(current)) {
      const trend = trends[name];
      // Apply growth
      let val = base * trend.growth;
      // Add noise
      val += (seededRandom() - 0.5) * 2 * trend.noise;

      // Special events
      // Q3 2023 (q=2): Job change - boost savings
      if (q === 2 && name === "Conto Corrente Principale") val += 1500;
      // Q1 2024 (q=4): Start ETF investing
      if (q === 4 && name === "ETF Azionario Globale") val += 3000;
      // Q4 2025 (q=11): Car loan paid off
      if (q >= 10 && name === "Prestito Auto") val = Math.min(val, -200);
      if (q === 11 && name === "Prestito Auto") val = 0;

      // Round to 2 decimals
      val = Math.round(val * 100) / 100;

      // Keep debt items negative, others positive
      if (name === "Prestito Auto" && val > 0 && q < 11) val = -Math.abs(val);
      if (name === "Carta di Credito" && val > 0) val = -Math.abs(val);

      values[name] = val;
      current[name] = val;
    }

    snapshots.push({ date, values });
  }

  return snapshots;
}

// Demo milestones
const DEMO_MILESTONES = [
  {
    date: new Date(2023, 2, 15), // Mar 2023
    title: "Inizio tracking patrimonio",
    description:
      "Ho iniziato a tracciare il mio patrimonio con FringoTracker per avere una visione chiara della mia situazione finanziaria.",
    eventType: "other" as const,
  },
  {
    date: new Date(2023, 8, 1), // Sep 2023
    title: "Cambio lavoro — aumento stipendio",
    description:
      "Nuovo ruolo con un aumento del 20%. Più capacità di risparmio mensile.",
    eventType: "job_change" as const,
  },
  {
    date: new Date(2024, 2, 10), // Mar 2024
    title: "Primo investimento in ETF",
    description:
      "Investiti €3.000 in un ETF azionario globale. Inizio di una strategia di investimento passivo.",
    eventType: "investment" as const,
  },
  {
    date: new Date(2025, 11, 1), // Dec 2025
    title: "Estinzione prestito auto",
    description: "Ultimo pagamento del prestito auto. €0 di debito residuo!",
    eventType: "debt_paid" as const,
  },
];

/**
 * Delete all demo user data from Firestore
 */
export async function deleteDemoData(userId: string): Promise<void> {
  const collections = [
    "items",
    "snapshots",
    "snapshotEntries",
    "milestones",
    "categoryDefinitions",
  ];

  for (const collName of collections) {
    const snap = await firestore
      .collection(collName)
      .where("userId", "==", userId)
      .get();

    if (!snap.empty) {
      const batch = firestore.batch();
      snap.docs.forEach((doc) => batch.delete(doc.ref));
      await batch.commit();
    }
  }

  // Delete snapshot template (doc id = userId)
  const templateRef = firestore.collection("snapshotTemplates").doc(userId);
  const templateDoc = await templateRef.get();
  if (templateDoc.exists) {
    await templateRef.delete();
  }
}

/**
 * Seed demo data for the given user
 */
export async function seedDemoData(userId: string): Promise<void> {
  const now = new Date();

  // 1. Seed categories
  for (let i = 0; i < DEFAULT_CATEGORIES.length; i++) {
    await firestore.collection("categoryDefinitions").add({
      userId,
      name: DEFAULT_CATEGORIES[i],
      categoryType: "default",
      sortOrder: i,
      createdAt: now,
    });
  }

  // 2. Seed items and collect their IDs
  const itemIdMap = new Map<string, string>(); // name -> firestoreId
  for (let i = 0; i < DEMO_ITEMS.length; i++) {
    const ref = await firestore.collection("items").add({
      userId,
      name: DEMO_ITEMS[i].name,
      category: DEMO_ITEMS[i].category,
      sortOrder: i,
      createdAt: now,
    });
    itemIdMap.set(DEMO_ITEMS[i].name, ref.id);
  }

  // 3. Seed snapshots with entries
  const snapshotData = generateSnapshotData();
  for (const snap of snapshotData) {
    const totalValue = Object.values(snap.values).reduce((a, b) => a + b, 0);
    const totalRounded = Math.round(totalValue * 100) / 100;

    const snapshotRef = await firestore.collection("snapshots").add({
      userId,
      date: snap.date,
      frequency: "monthly",
      totalValue: totalRounded,
      createdAt: now,
    });

    // Create entries for this snapshot
    for (const [itemName, value] of Object.entries(snap.values)) {
      const itemId = itemIdMap.get(itemName);
      if (itemId) {
        await firestore.collection("snapshotEntries").add({
          userId,
          snapshotId: snapshotRef.id,
          itemId,
          value,
          createdAt: now,
        });
      }
    }
  }

  // 4. Seed milestones
  for (const milestone of DEMO_MILESTONES) {
    await firestore.collection("milestones").add({
      userId,
      date: milestone.date,
      title: milestone.title,
      description: milestone.description,
      eventType: milestone.eventType,
      createdAt: now,
    });
  }

  // 5. Seed snapshot template (all items)
  const templateItems = DEMO_ITEMS.map((item) => ({
    itemId: itemIdMap.get(item.name)!,
    itemName: item.name,
  }));

  await firestore.collection("snapshotTemplates").doc(userId).set({
    items: templateItems,
    updatedAt: now,
  });
}

/**
 * Create or reset the demo user account and return login data
 */
export async function setupDemoAccount(): Promise<{
  userId: string;
  email: string;
  token: string;
}> {
  const usersRef = firestore.collection("users");
  const existing = await usersRef
    .where("email", "==", DEMO_EMAIL)
    .limit(1)
    .get();

  let userId: string;

  if (!existing.empty) {
    // Demo user exists — reset their data
    userId = existing.docs[0].id;
    await deleteDemoData(userId);

    // Update password hash (in case it changed)
    const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);
    await usersRef.doc(userId).update({
      passwordHash,
      displayName: DEMO_DISPLAY_NAME,
      updatedAt: new Date(),
    });
  } else {
    // Create new demo user
    const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);
    const ref = await usersRef.add({
      email: DEMO_EMAIL,
      passwordHash,
      displayName: DEMO_DISPLAY_NAME,
      photoURL: "",
      createdAt: new Date(),
    });
    userId = ref.id;
  }

  // Seed demo data
  await seedDemoData(userId);

  return { userId, email: DEMO_EMAIL, token: "" }; // token will be set by the route
}

export { DEMO_EMAIL, DEMO_PASSWORD };
