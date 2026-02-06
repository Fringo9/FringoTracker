import { Router } from "express";
import { authMiddleware, AuthRequest } from "../middleware/auth.js";
import { firestore } from "../services/firebase.js";
import {
  validateBody,
  createItemSchema,
  updateItemSchema,
  reorderSchema,
} from "../validators/schemas.js";

const router = Router();

// Get all items
router.get("/", authMiddleware, async (req: AuthRequest, res) => {
  try {
    const userId = req.userId!;
    const snapshot = await firestore
      .collection("items")
      .where("userId", "==", userId)
      .get();

    const items = snapshot.docs
      .map((doc: any) => ({ id: doc.id, ...doc.data() }))
      .sort((a: any, b: any) => (a.sortOrder || 0) - (b.sortOrder || 0));

    res.json(items);
  } catch (error) {
    console.error("Get items error:", error);
    res.status(500).json({ error: "Failed to fetch items" });
  }
});

// Create item
router.post(
  "/",
  authMiddleware,
  validateBody(createItemSchema),
  async (req: AuthRequest, res) => {
    try {
      const userId = req.userId!;
      const { name, category, sortOrder } = req.body;

      const itemData = {
        userId,
        name,
        category,
        sortOrder: sortOrder || 0,
        createdAt: new Date(),
      };

      const docRef = await firestore.collection("items").add(itemData);

      res.status(201).json({ id: docRef.id, ...itemData });
    } catch (error) {
      console.error("Create item error:", error);
      res.status(500).json({ error: "Failed to create item" });
    }
  },
);

// Update item
router.put(
  "/:id",
  authMiddleware,
  validateBody(updateItemSchema),
  async (req: AuthRequest, res) => {
    try {
      const userId = req.userId!;
      const itemId = req.params.id;
      const { name, category, sortOrder } = req.body;

      const itemDoc = await firestore.collection("items").doc(itemId).get();

      if (!itemDoc.exists || itemDoc.data()?.userId !== userId) {
        return res.status(404).json({ error: "Item not found" });
      }

      const updateData: any = { updatedAt: new Date() };

      if (name) updateData.name = name;
      if (category) updateData.category = category;
      if (sortOrder !== undefined) updateData.sortOrder = sortOrder;

      await firestore.collection("items").doc(itemId).update(updateData);

      res.json({ message: "Item updated" });
    } catch (error) {
      console.error("Update item error:", error);
      res.status(500).json({ error: "Failed to update item" });
    }
  },
);

// Delete item (with cascade protection)
router.delete("/:id", authMiddleware, async (req: AuthRequest, res) => {
  try {
    const userId = req.userId!;
    const itemId = req.params.id;

    const itemDoc = await firestore.collection("items").doc(itemId).get();

    if (!itemDoc.exists || itemDoc.data()?.userId !== userId) {
      return res.status(404).json({ error: "Item not found" });
    }

    // Check if item is used in any snapshot entry
    const entriesSnapshot = await firestore
      .collection("snapshotEntries")
      .where("itemId", "==", itemId)
      .limit(1)
      .get();

    if (!entriesSnapshot.empty) {
      return res.status(409).json({
        error:
          "Impossibile eliminare: questa voce è usata in uno o più snapshot. Rimuovila prima dagli snapshot.",
      });
    }

    await firestore.collection("items").doc(itemId).delete();

    res.json({ message: "Item deleted" });
  } catch (error) {
    console.error("Delete item error:", error);
    res.status(500).json({ error: "Failed to delete item" });
  }
});

// Reorder items (with ownership verification)
router.post(
  "/reorder",
  authMiddleware,
  validateBody(reorderSchema),
  async (req: AuthRequest, res) => {
    try {
      const userId = req.userId!;
      const items = req.body;

      // Verify ownership: fetch all user's items to build allowed ID set
      const userItemsSnapshot = await firestore
        .collection("items")
        .where("userId", "==", userId)
        .get();
      const ownedItemIds = new Set(
        userItemsSnapshot.docs.map((doc: any) => doc.id),
      );

      // Filter out any items that don't belong to this user
      const validItems = items.filter((item: any) => ownedItemIds.has(item.id));

      if (validItems.length !== items.length) {
        return res
          .status(403)
          .json({ error: "Some items do not belong to you" });
      }

      const batch = firestore.batch();
      validItems.forEach((item: any) => {
        const docRef = firestore.collection("items").doc(item.id);
        batch.update(docRef, {
          sortOrder: item.sortOrder,
          updatedAt: new Date(),
        });
      });

      await batch.commit();

      res.json({ message: "Items reordered" });
    } catch (error) {
      console.error("Reorder items error:", error);
      res.status(500).json({ error: "Failed to reorder items" });
    }
  },
);

export default router;
