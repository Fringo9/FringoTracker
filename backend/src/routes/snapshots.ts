import { Router } from "express";
import { authMiddleware, AuthRequest } from "../middleware/auth.js";
import { firestore } from "../services/firebase.js";
import { invalidateAnalyticsCache } from "../services/analyticsCache.js";
import {
  validateBody,
  createSnapshotSchema,
  updateSnapshotSchema,
} from "../validators/schemas.js";

const router = Router();

// Get snapshot summary (count + last date) - lightweight endpoint for Dashboard
router.get("/summary", authMiddleware, async (req: AuthRequest, res) => {
  try {
    const userId = req.userId!;
    const snapshotsRef = firestore.collection("snapshots");
    const snapshot = await snapshotsRef.where("userId", "==", userId).get();

    if (snapshot.empty) {
      return res.json({ count: 0, lastDate: null });
    }

    let lastDate: Date | null = null;
    snapshot.docs.forEach((doc: any) => {
      const data = doc.data();
      const date = data.date?.toDate ? data.date.toDate() : new Date(data.date);
      if (!lastDate || date > lastDate) {
        lastDate = date;
      }
    });

    res.json({
      count: snapshot.size,
      lastDate: lastDate ? (lastDate as Date).toISOString() : null,
    });
  } catch (error) {
    console.error("Get snapshot summary error:", error);
    res.status(500).json({ error: "Failed to fetch snapshot summary" });
  }
});

// Get latest snapshot values (for auto-fill in new snapshot creation)
router.get("/latest-values", authMiddleware, async (req: AuthRequest, res) => {
  try {
    const userId = req.userId!;

    // Get the most recent snapshot
    const snapshotsRef = firestore.collection("snapshots");
    const allSnapshots = await snapshotsRef.where("userId", "==", userId).get();

    if (allSnapshots.empty) {
      return res.json({ entries: [] });
    }

    // Find latest snapshot by date in-memory
    let latestDoc: any = null;
    let latestDate: Date | null = null;
    allSnapshots.docs.forEach((doc: any) => {
      const data = doc.data();
      const date = data.date?.toDate ? data.date.toDate() : new Date(data.date);
      if (!latestDate || date > latestDate) {
        latestDate = date;
        latestDoc = doc;
      }
    });

    if (!latestDoc) {
      return res.json({ entries: [] });
    }

    // Fetch entries for this snapshot
    const entriesSnapshot = await firestore
      .collection("snapshotEntries")
      .where("snapshotId", "==", latestDoc.id)
      .where("userId", "==", userId)
      .get();

    const entries = entriesSnapshot.docs.map((doc: any) => {
      const data = doc.data();
      return {
        itemId: data.itemId,
        value: data.value,
      };
    });

    res.json({ entries });
  } catch (error) {
    console.error("Get latest values error:", error);
    res.status(500).json({ error: "Failed to fetch latest snapshot values" });
  }
});

// Get all snapshots
router.get("/", authMiddleware, async (req: AuthRequest, res) => {
  try {
    const userId = req.userId!;
    const snapshotsRef = firestore.collection("snapshots");
    const snapshot = await snapshotsRef.where("userId", "==", userId).get();

    // Batch-fetch all items for this user (1 query instead of N*M)
    const itemsSnapshot = await firestore
      .collection("items")
      .where("userId", "==", userId)
      .get();
    const itemsMap = new Map<string, any>();
    itemsSnapshot.docs.forEach((doc: any) => {
      itemsMap.set(doc.id, { id: doc.id, ...doc.data() });
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
        id: entryDoc.id,
        ...entryData,
        item: itemsMap.get(entryData.itemId) || null,
      });
    });

    // Build snapshots with entries resolved in-memory
    const snapshots = snapshot.docs.map((doc: any) => {
      const data = doc.data();
      const date = data.date?.toDate ? data.date.toDate() : new Date(data.date);
      const createdAt = data.createdAt?.toDate
        ? data.createdAt.toDate()
        : new Date(data.createdAt);

      return {
        id: doc.id,
        ...data,
        date: date.toISOString(),
        createdAt: createdAt.toISOString(),
        entries: entriesBySnapshotId.get(doc.id) || [],
      };
    });

    // Sort by date descending
    snapshots.sort(
      (a: any, b: any) =>
        new Date(b.date).getTime() - new Date(a.date).getTime(),
    );

    res.json(snapshots);
  } catch (error) {
    console.error("Get snapshots error:", error);
    res.status(500).json({ error: "Failed to fetch snapshots" });
  }
});

// Get single snapshot by ID
router.get("/:id", authMiddleware, async (req: AuthRequest, res) => {
  try {
    const userId = req.userId!;
    const snapshotId = req.params.id;

    const snapshotDoc = await firestore
      .collection("snapshots")
      .doc(snapshotId)
      .get();

    if (!snapshotDoc.exists || snapshotDoc.data()?.userId !== userId) {
      return res.status(404).json({ error: "Snapshot not found" });
    }

    const data = snapshotDoc.data()!;
    const date = data.date?.toDate ? data.date.toDate() : new Date(data.date);
    const createdAt = data.createdAt?.toDate
      ? data.createdAt.toDate()
      : new Date(data.createdAt);

    // Fetch entries for this snapshot
    const entriesSnapshot = await firestore
      .collection("snapshotEntries")
      .where("snapshotId", "==", snapshotId)
      .get();

    // Batch-fetch items referenced by entries
    const itemIds = new Set<string>();
    entriesSnapshot.docs.forEach((doc: any) => {
      if (doc.data().itemId) itemIds.add(doc.data().itemId);
    });

    const itemsMap = new Map<string, any>();
    if (itemIds.size > 0) {
      const itemsSnapshot = await firestore
        .collection("items")
        .where("userId", "==", userId)
        .get();
      itemsSnapshot.docs.forEach((doc: any) => {
        itemsMap.set(doc.id, { id: doc.id, ...doc.data() });
      });
    }

    const entries = entriesSnapshot.docs.map((entryDoc: any) => {
      const entryData = entryDoc.data();
      return {
        id: entryDoc.id,
        ...entryData,
        item: itemsMap.get(entryData.itemId) || null,
      };
    });

    res.json({
      id: snapshotDoc.id,
      ...data,
      date: date.toISOString(),
      createdAt: createdAt.toISOString(),
      entries,
    });
  } catch (error) {
    console.error("Get snapshot error:", error);
    res.status(500).json({ error: "Failed to fetch snapshot" });
  }
});

// Create snapshot
router.post(
  "/",
  authMiddleware,
  validateBody(createSnapshotSchema),
  async (req: AuthRequest, res) => {
    try {
      const userId = req.userId!;
      const { date, frequency, totalValue, entries, encryptedData } = req.body;

      const snapshotData: any = {
        userId,
        date: new Date(date),
        frequency,
        totalValue,
        createdAt: new Date(),
      };

      // Only add encryptedData if it's not undefined
      if (encryptedData !== undefined) {
        snapshotData.encryptedData = encryptedData;
      }

      const snapshotRef = await firestore
        .collection("snapshots")
        .add(snapshotData);

      // Add entries (item values for this snapshot)
      const batch = firestore.batch();
      entries.forEach((entry: any) => {
        const entryRef = firestore.collection("snapshotEntries").doc();
        const entryData: any = {
          userId,
          snapshotId: snapshotRef.id,
          itemId: entry.itemId,
          value: entry.value,
          createdAt: new Date(),
        };

        // Only add encryptedData if it's not undefined
        if (entry.encryptedData !== undefined) {
          entryData.encryptedData = entry.encryptedData;
        }

        batch.set(entryRef, entryData);
      });
      await batch.commit();

      // Invalidate analytics cache for this user
      invalidateAnalyticsCache(userId);

      res.status(201).json({ id: snapshotRef.id, message: "Snapshot created" });
    } catch (error) {
      console.error("Create snapshot error:", error);
      res.status(500).json({ error: "Failed to create snapshot" });
    }
  },
);

// Update snapshot
router.put(
  "/:id",
  authMiddleware,
  validateBody(updateSnapshotSchema),
  async (req: AuthRequest, res) => {
    try {
      const userId = req.userId!;
      const snapshotId = req.params.id;
      const { date, frequency, totalValue, entries } = req.body;

      const snapshotDoc = await firestore
        .collection("snapshots")
        .doc(snapshotId)
        .get();
      if (!snapshotDoc.exists || snapshotDoc.data()?.userId !== userId) {
        return res.status(404).json({ error: "Snapshot not found" });
      }

      const updateData: any = {
        updatedAt: new Date(),
      };

      if (date) updateData.date = new Date(date);
      if (frequency) updateData.frequency = frequency;
      if (typeof totalValue === "number") updateData.totalValue = totalValue;

      await firestore
        .collection("snapshots")
        .doc(snapshotId)
        .update(updateData);

      // Update entries if provided — handle batch size limit (max 500 ops per batch)
      if (entries && Array.isArray(entries)) {
        // Delete old entries
        const oldEntriesSnapshot = await firestore
          .collection("snapshotEntries")
          .where("snapshotId", "==", snapshotId)
          .get();

        const allOps: Array<{ type: "delete" | "set"; ref: any; data?: any }> =
          [];

        oldEntriesSnapshot.docs.forEach((doc) => {
          allOps.push({ type: "delete", ref: doc.ref });
        });

        entries.forEach((entry: any) => {
          const entryRef = firestore.collection("snapshotEntries").doc();
          allOps.push({
            type: "set",
            ref: entryRef,
            data: {
              userId,
              snapshotId,
              itemId: entry.itemId,
              value: entry.value,
              createdAt: new Date(),
            },
          });
        });

        // Split into batches of 499 max
        const BATCH_LIMIT = 499;
        for (let i = 0; i < allOps.length; i += BATCH_LIMIT) {
          const chunk = allOps.slice(i, i + BATCH_LIMIT);
          const batch = firestore.batch();
          chunk.forEach((op) => {
            if (op.type === "delete") {
              batch.delete(op.ref);
            } else {
              batch.set(op.ref, op.data);
            }
          });
          await batch.commit();
        }
      }

      // Invalidate analytics cache for this user
      invalidateAnalyticsCache(userId);

      res.json({ message: "Snapshot updated" });
    } catch (error) {
      console.error("Update snapshot error:", error);
      res.status(500).json({ error: "Failed to update snapshot" });
    }
  },
);

// Delete snapshot
router.delete("/:id", authMiddleware, async (req: AuthRequest, res) => {
  try {
    const userId = req.userId!;
    const snapshotId = req.params.id;

    // Verify ownership
    const snapshotDoc = await firestore
      .collection("snapshots")
      .doc(snapshotId)
      .get();
    if (!snapshotDoc.exists || snapshotDoc.data()?.userId !== userId) {
      return res.status(404).json({ error: "Snapshot not found" });
    }

    // Delete entries
    const entriesSnapshot = await firestore
      .collection("snapshotEntries")
      .where("snapshotId", "==", snapshotId)
      .get();

    const batch = firestore.batch();
    entriesSnapshot.docs.forEach((doc) => {
      batch.delete(doc.ref);
    });
    batch.delete(snapshotDoc.ref);
    await batch.commit();

    // Invalidate analytics cache for this user
    invalidateAnalyticsCache(userId);

    res.json({ message: "Snapshot deleted" });
  } catch (error) {
    console.error("Delete snapshot error:", error);
    res.status(500).json({ error: "Failed to delete snapshot" });
  }
});

export default router;
