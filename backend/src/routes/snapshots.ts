import { Router } from "express";
import { authMiddleware, AuthRequest } from "../middleware/auth.js";
import { firestore } from "../services/firebase.js";

const router = Router();

// Get all snapshots
router.get("/", authMiddleware, async (req: AuthRequest, res) => {
  try {
    const userId = req.userId!;
    const snapshotsRef = firestore.collection("snapshots");
    const snapshot = await snapshotsRef.where("userId", "==", userId).get();

    const snapshots = snapshot.docs
      .map((doc: any) => {
        const data = doc.data();
        const date = data.date?.toDate
          ? data.date.toDate()
          : new Date(data.date);
        const createdAt = data.createdAt?.toDate
          ? data.createdAt.toDate()
          : new Date(data.createdAt);
        return {
          id: doc.id,
          ...data,
          date: date.toISOString(),
          createdAt: createdAt.toISOString(),
        };
      })
      .sort(
        (a: any, b: any) =>
          new Date(b.date).getTime() - new Date(a.date).getTime(),
      );

    res.json(snapshots);
  } catch (error) {
    console.error("Get snapshots error:", error);
    res.status(500).json({ error: "Failed to fetch snapshots" });
  }
});

// Create snapshot
router.post("/", authMiddleware, async (req: AuthRequest, res) => {
  try {
    const userId = req.userId!;
    const { date, frequency, totalValue, categories, encryptedData } = req.body;

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

    // Add categories
    const batch = firestore.batch();
    categories.forEach((category: any) => {
      const catRef = firestore.collection("categories").doc();
      const categoryData: any = {
        userId,
        snapshotId: snapshotRef.id,
        name: category.name,
        categoryType: category.categoryType,
        value: category.value,
        sortOrder: category.sortOrder,
        createdAt: new Date(),
      };

      // Only add encryptedData if it's not undefined
      if (category.encryptedData !== undefined) {
        categoryData.encryptedData = category.encryptedData;
      }

      batch.set(catRef, categoryData);
    });
    await batch.commit();

    res.status(201).json({ id: snapshotRef.id, message: "Snapshot created" });
  } catch (error) {
    console.error("Create snapshot error:", error);
    res.status(500).json({ error: "Failed to create snapshot" });
  }
});

// Update snapshot
router.put("/:id", authMiddleware, async (req: AuthRequest, res) => {
  try {
    const userId = req.userId!;
    const snapshotId = req.params.id;
    const { date, frequency, totalValue } = req.body;

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

    await firestore.collection("snapshots").doc(snapshotId).update(updateData);

    res.json({ message: "Snapshot updated" });
  } catch (error) {
    console.error("Update snapshot error:", error);
    res.status(500).json({ error: "Failed to update snapshot" });
  }
});

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

    // Delete categories
    const categoriesSnapshot = await firestore
      .collection("categories")
      .where("snapshotId", "==", snapshotId)
      .get();

    const batch = firestore.batch();
    categoriesSnapshot.docs.forEach((doc) => {
      batch.delete(doc.ref);
    });
    batch.delete(snapshotDoc.ref);
    await batch.commit();

    res.json({ message: "Snapshot deleted" });
  } catch (error) {
    console.error("Delete snapshot error:", error);
    res.status(500).json({ error: "Failed to delete snapshot" });
  }
});

export default router;
