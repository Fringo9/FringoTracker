import { Router } from "express";
import { authMiddleware, AuthRequest } from "../middleware/auth.js";
import { firestore } from "../services/firebase.js";
import {
  validateBody,
  createCategoryDefinitionSchema,
  updateCategoryDefinitionSchema,
  bulkCategoryDefinitionsSchema,
  reorderSchema,
} from "../validators/schemas.js";

const router = Router();

// Get all category definitions
router.get("/", authMiddleware, async (req: AuthRequest, res) => {
  try {
    const userId = req.userId!;
    const snapshot = await firestore
      .collection("categoryDefinitions")
      .where("userId", "==", userId)
      .get();

    const categories = snapshot.docs
      .map((doc: any) => ({ id: doc.id, ...doc.data() }))
      .sort((a: any, b: any) => (a.sortOrder || 0) - (b.sortOrder || 0));

    res.json(categories);
  } catch (error) {
    console.error("Get category definitions error:", error);
    res.status(500).json({ error: "Failed to fetch category definitions" });
  }
});

// Bulk create or update category definitions
router.post(
  "/bulk",
  authMiddleware,
  validateBody(bulkCategoryDefinitionsSchema),
  async (req: AuthRequest, res) => {
    try {
      const userId = req.userId!;
      const categories = req.body;

      const batch = firestore.batch();

      categories.forEach((category: any) => {
        const docRef = category.id
          ? firestore.collection("categoryDefinitions").doc(category.id)
          : firestore.collection("categoryDefinitions").doc();

        const data: any = {
          userId,
          name: category.name,
          categoryType: category.categoryType,
          sortOrder: category.sortOrder,
          updatedAt: new Date(),
        };

        if (!category.id) {
          data.createdAt = new Date();
        }

        batch.set(docRef, data, { merge: true });
      });

      await batch.commit();

      res.json({ message: "Category definitions saved" });
    } catch (error) {
      console.error("Bulk category definitions error:", error);
      res.status(500).json({ error: "Failed to save category definitions" });
    }
  },
);

// Update category definition
router.put(
  "/:id",
  authMiddleware,
  validateBody(updateCategoryDefinitionSchema),
  async (req: AuthRequest, res) => {
    try {
      const userId = req.userId!;
      const categoryId = req.params.id;
      const { name, categoryType, sortOrder } = req.body;

      const categoryDoc = await firestore
        .collection("categoryDefinitions")
        .doc(categoryId)
        .get();

      if (!categoryDoc.exists || categoryDoc.data()?.userId !== userId) {
        return res.status(404).json({ error: "Category definition not found" });
      }

      await firestore.collection("categoryDefinitions").doc(categoryId).update({
        name,
        categoryType,
        sortOrder,
        updatedAt: new Date(),
      });

      res.json({ message: "Category definition updated" });
    } catch (error) {
      console.error("Update category definition error:", error);
      res.status(500).json({ error: "Failed to update category definition" });
    }
  },
);

// Reorder category definitions
router.post(
  "/reorder",
  authMiddleware,
  validateBody(reorderSchema),
  async (req: AuthRequest, res) => {
    try {
      const userId = req.userId!;
      const items = req.body;

      const batch = firestore.batch();
      items.forEach((item: any) => {
        if (!item.id) return;
        const docRef = firestore.collection("categoryDefinitions").doc(item.id);
        batch.update(docRef, {
          userId,
          sortOrder: item.sortOrder,
          updatedAt: new Date(),
        });
      });

      await batch.commit();

      res.json({ message: "Category order updated" });
    } catch (error) {
      console.error("Reorder category definitions error:", error);
      res.status(500).json({ error: "Failed to reorder category definitions" });
    }
  },
);

// Delete category definition
router.delete("/:id", authMiddleware, async (req: AuthRequest, res) => {
  try {
    const userId = req.userId!;
    const categoryId = req.params.id;

    const categoryDoc = await firestore
      .collection("categoryDefinitions")
      .doc(categoryId)
      .get();

    if (!categoryDoc.exists || categoryDoc.data()?.userId !== userId) {
      return res.status(404).json({ error: "Category definition not found" });
    }

    // Check if any items use this category
    const categoryData = categoryDoc.data()!;
    const itemsUsingCategory = await firestore
      .collection("items")
      .where("userId", "==", userId)
      .where("category", "==", categoryData.name)
      .limit(1)
      .get();

    if (!itemsUsingCategory.empty) {
      return res.status(400).json({
        error:
          "Impossibile eliminare: questa categoria è utilizzata da una o più voci. Riassegna prima le voci ad un'altra categoria.",
      });
    }

    await firestore.collection("categoryDefinitions").doc(categoryId).delete();

    res.json({ message: "Category definition deleted" });
  } catch (error) {
    console.error("Delete category definition error:", error);
    res.status(500).json({ error: "Failed to delete category definition" });
  }
});

export default router;
