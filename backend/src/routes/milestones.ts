import { Router } from "express";
import { authMiddleware, AuthRequest } from "../middleware/auth.js";
import { firestore } from "../services/firebase.js";
import {
  validateBody,
  createMilestoneSchema,
  updateMilestoneSchema,
} from "../validators/schemas.js";

const router = Router();

// Get all milestones
router.get("/", authMiddleware, async (req: AuthRequest, res) => {
  try {
    const userId = req.userId!;
    const snapshot = await firestore
      .collection("milestones")
      .where("userId", "==", userId)
      .get();

    const milestones = snapshot.docs
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
          new Date(a.date).getTime() - new Date(b.date).getTime(),
      );

    res.json(milestones);
  } catch (error) {
    console.error("Get milestones error:", error);
    res.status(500).json({ error: "Failed to fetch milestones" });
  }
});

// Create milestone
router.post(
  "/",
  authMiddleware,
  validateBody(createMilestoneSchema),
  async (req: AuthRequest, res) => {
    try {
      const userId = req.userId!;
      const { date, title, description, eventType, icon } = req.body;

      const milestoneData: any = {
        userId,
        date: new Date(date),
        title,
        description,
        eventType,
        icon: icon || null,
        createdAt: new Date(),
      };

      const milestoneRef = await firestore
        .collection("milestones")
        .add(milestoneData);

      res
        .status(201)
        .json({ id: milestoneRef.id, message: "Milestone created" });
    } catch (error) {
      console.error("Create milestone error:", error);
      res.status(500).json({ error: "Failed to create milestone" });
    }
  },
);

// Update milestone
router.put(
  "/:id",
  authMiddleware,
  validateBody(updateMilestoneSchema),
  async (req: AuthRequest, res) => {
    try {
      const userId = req.userId!;
      const milestoneId = req.params.id;
      const { date, title, description, eventType, icon } = req.body;

      const milestoneDoc = await firestore
        .collection("milestones")
        .doc(milestoneId)
        .get();

      if (!milestoneDoc.exists || milestoneDoc.data()?.userId !== userId) {
        return res.status(404).json({ error: "Milestone not found" });
      }

      const updateData: any = {
        date: date ? new Date(date) : milestoneDoc.data()?.date,
        title,
        description,
        eventType,
        icon: icon || null,
        updatedAt: new Date(),
      };

      await firestore
        .collection("milestones")
        .doc(milestoneId)
        .update(updateData);

      res.json({ message: "Milestone updated" });
    } catch (error) {
      console.error("Update milestone error:", error);
      res.status(500).json({ error: "Failed to update milestone" });
    }
  },
);

// Delete milestone
router.delete("/:id", authMiddleware, async (req: AuthRequest, res) => {
  try {
    const userId = req.userId!;
    const milestoneId = req.params.id;

    const milestoneDoc = await firestore
      .collection("milestones")
      .doc(milestoneId)
      .get();

    if (!milestoneDoc.exists || milestoneDoc.data()?.userId !== userId) {
      return res.status(404).json({ error: "Milestone not found" });
    }

    await firestore.collection("milestones").doc(milestoneId).delete();

    res.json({ message: "Milestone deleted" });
  } catch (error) {
    console.error("Delete milestone error:", error);
    res.status(500).json({ error: "Failed to delete milestone" });
  }
});

export default router;
