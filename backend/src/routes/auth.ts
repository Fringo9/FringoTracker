import { Router } from "express";
import crypto from "crypto";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { firestore } from "../services/firebase.js";
import { authMiddleware, AuthRequest } from "../middleware/auth.js";
import {
  validateBody,
  loginSchema,
  registerSchema,
  changePasswordSchema,
  requestResetSchema,
  resetPasswordSchema,
  updateProfileSchema,
} from "../validators/schemas.js";

const router = Router();
const JWT_SECRET =
  process.env.JWT_SECRET || "your-secret-key-change-in-production";

// Login
router.post("/login", validateBody(loginSchema), async (req, res) => {
  try {
    const { email, password } = req.body;

    // Get user from Firestore
    const usersRef = firestore.collection("users");
    const snapshot = await usersRef.where("email", "==", email).limit(1).get();

    if (snapshot.empty) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const userDoc = snapshot.docs[0];
    const user = userDoc.data();

    // Verify password
    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // Generate JWT
    const token = jwt.sign({ userId: userDoc.id }, JWT_SECRET, {
      expiresIn: "30d",
    });

    res.json({
      token,
      user: {
        id: userDoc.id,
        email: user.email,
        displayName: user.displayName || "",
        photoURL: user.photoURL || "",
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: "Login failed" });
  }
});

// Register (for initial setup only)
router.post("/register", validateBody(registerSchema), async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check if user exists
    const usersRef = firestore.collection("users");
    const existing = await usersRef.where("email", "==", email).limit(1).get();

    if (!existing.empty) {
      return res.status(400).json({ error: "User already exists" });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create user
    const userRef = await usersRef.add({
      email,
      passwordHash,
      createdAt: new Date(),
    });

    // Generate JWT
    const token = jwt.sign({ userId: userRef.id }, JWT_SECRET, {
      expiresIn: "30d",
    });

    res.status(201).json({
      token,
      user: { id: userRef.id, email, displayName: "", photoURL: "" },
    });
  } catch (error) {
    console.error("Register error:", error);
    res.status(500).json({ error: "Registration failed" });
  }
});

// Change password (authenticated)
router.post(
  "/change-password",
  authMiddleware,
  validateBody(changePasswordSchema),
  async (req: AuthRequest, res) => {
    try {
      const userId = req.userId!;
      const { currentPassword, newPassword } = req.body;

      const userDoc = await firestore.collection("users").doc(userId).get();
      if (!userDoc.exists) {
        return res.status(404).json({ error: "User not found" });
      }

      const user = userDoc.data();
      const isValid = await bcrypt.compare(currentPassword, user?.passwordHash);
      if (!isValid) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      const passwordHash = await bcrypt.hash(newPassword, 10);
      await firestore.collection("users").doc(userId).update({
        passwordHash,
        updatedAt: new Date(),
      });

      res.json({ message: "Password updated" });
    } catch (error) {
      console.error("Change password error:", error);
      res.status(500).json({ error: "Failed to change password" });
    }
  },
);

// Request password reset (returns token for now)
router.post(
  "/request-reset",
  validateBody(requestResetSchema),
  async (req, res) => {
    try {
      const { email } = req.body;

      const usersRef = firestore.collection("users");
      const snapshot = await usersRef
        .where("email", "==", email)
        .limit(1)
        .get();

      if (snapshot.empty) {
        return res.json({
          message: "If the user exists, a token was generated",
        });
      }

      const userDoc = snapshot.docs[0];
      const token = crypto.randomBytes(24).toString("hex");
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

      await firestore.collection("passwordResets").add({
        userId: userDoc.id,
        token,
        createdAt: new Date(),
        expiresAt,
        usedAt: null,
      });

      res.json({ message: "Reset token generated", token });
    } catch (error) {
      console.error("Request reset error:", error);
      res.status(500).json({ error: "Failed to request password reset" });
    }
  },
);

// Reset password using token
router.post(
  "/reset-password",
  validateBody(resetPasswordSchema),
  async (req, res) => {
    try {
      const { email, token, newPassword } = req.body;

      const usersRef = firestore.collection("users");
      const snapshot = await usersRef
        .where("email", "==", email)
        .limit(1)
        .get();

      if (snapshot.empty) {
        return res.status(404).json({ error: "User not found" });
      }

      const userDoc = snapshot.docs[0];

      const resetSnapshot = await firestore
        .collection("passwordResets")
        .where("userId", "==", userDoc.id)
        .where("token", "==", token)
        .where("usedAt", "==", null)
        .get();

      if (resetSnapshot.empty) {
        return res.status(400).json({ error: "Invalid reset token" });
      }

      const resetDoc = resetSnapshot.docs[0];
      const resetData = resetDoc.data();

      if (
        resetData.expiresAt?.toDate &&
        resetData.expiresAt.toDate() < new Date()
      ) {
        return res.status(400).json({ error: "Reset token expired" });
      }

      const passwordHash = await bcrypt.hash(newPassword, 10);
      await firestore.collection("users").doc(userDoc.id).update({
        passwordHash,
        updatedAt: new Date(),
      });

      await resetDoc.ref.update({ usedAt: new Date() });

      res.json({ message: "Password reset successful" });
    } catch (error) {
      console.error("Reset password error:", error);
      res.status(500).json({ error: "Failed to reset password" });
    }
  },
);

// Update profile (authenticated)
router.put(
  "/profile",
  authMiddleware,
  validateBody(updateProfileSchema),
  async (req: AuthRequest, res) => {
    try {
      const userId = req.userId!;
      const { displayName, photoURL } = req.body;

      await firestore.collection("users").doc(userId).update({
        displayName,
        photoURL,
        updatedAt: new Date(),
      });

      res.json({ displayName, photoURL });
    } catch (error) {
      console.error("Update profile error:", error);
      res.status(500).json({ error: "Failed to update profile" });
    }
  },
);

export default router;
