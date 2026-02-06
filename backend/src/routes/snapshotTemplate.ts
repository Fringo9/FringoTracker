import { Router } from "express";
import { authMiddleware, AuthRequest } from "../middleware/auth.js";
import { firestore } from "../services/firebase.js";

const router = Router();

// Get snapshot template
router.get("/", authMiddleware, async (req: AuthRequest, res) => {
  try {
    const userId = req.userId!;
    const templateDoc = await firestore
      .collection("snapshotTemplates")
      .doc(userId)
      .get();

    if (!templateDoc.exists) {
      return res.json({ items: [] });
    }

    const data = templateDoc.data();
    res.json({ items: data?.items || [] });
  } catch (error) {
    console.error("Get snapshot template error:", error);
    res.status(500).json({ error: "Failed to fetch snapshot template" });
  }
});

// Save snapshot template
router.post("/", authMiddleware, async (req: AuthRequest, res) => {
  try {
    const userId = req.userId!;
    const { items } = req.body;

    if (!Array.isArray(items)) {
      return res.status(400).json({ error: "Items must be an array" });
    }

    // Validate items
    for (const item of items) {
      if (!item.itemId || !item.itemName) {
        return res
          .status(400)
          .json({ error: "Each item must have itemId and itemName" });
      }
    }

    await firestore.collection("snapshotTemplates").doc(userId).set({
      items,
      updatedAt: new Date(),
    });

    res.json({ message: "Template saved successfully", items });
  } catch (error) {
    console.error("Save snapshot template error:", error);
    res.status(500).json({ error: "Failed to save snapshot template" });
  }
});

export default router;
