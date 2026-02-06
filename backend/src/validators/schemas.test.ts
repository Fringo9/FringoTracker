import { describe, it, expect } from "vitest";
import {
  loginSchema,
  registerSchema,
  changePasswordSchema,
  requestResetSchema,
  resetPasswordSchema,
  createSnapshotSchema,
  updateSnapshotSchema,
  createItemSchema,
  updateItemSchema,
  reorderSchema,
  createMilestoneSchema,
  updateMilestoneSchema,
  createCategoryDefinitionSchema,
  bulkCategoryDefinitionsSchema,
} from "./schemas.js";

// === Auth Schemas ===

describe("loginSchema", () => {
  it("accepts valid credentials", () => {
    const result = loginSchema.safeParse({
      email: "test@example.com",
      password: "mypassword",
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid email", () => {
    const result = loginSchema.safeParse({
      email: "not-an-email",
      password: "mypassword",
    });
    expect(result.success).toBe(false);
  });

  it("rejects empty password", () => {
    const result = loginSchema.safeParse({
      email: "test@example.com",
      password: "",
    });
    expect(result.success).toBe(false);
  });

  it("rejects missing fields", () => {
    expect(loginSchema.safeParse({}).success).toBe(false);
    expect(loginSchema.safeParse({ email: "test@example.com" }).success).toBe(
      false,
    );
  });
});

describe("registerSchema", () => {
  it("accepts valid registration", () => {
    const result = registerSchema.safeParse({
      email: "new@example.com",
      password: "securepass123",
    });
    expect(result.success).toBe(true);
  });

  it("rejects password shorter than 8 chars", () => {
    const result = registerSchema.safeParse({
      email: "new@example.com",
      password: "short",
    });
    expect(result.success).toBe(false);
  });

  it("rejects password longer than 128 chars", () => {
    const result = registerSchema.safeParse({
      email: "new@example.com",
      password: "a".repeat(129),
    });
    expect(result.success).toBe(false);
  });
});

describe("changePasswordSchema", () => {
  it("accepts valid change", () => {
    const result = changePasswordSchema.safeParse({
      currentPassword: "oldpass123",
      newPassword: "newpass123",
    });
    expect(result.success).toBe(true);
  });

  it("rejects short new password", () => {
    const result = changePasswordSchema.safeParse({
      currentPassword: "oldpass",
      newPassword: "short",
    });
    expect(result.success).toBe(false);
  });
});

describe("requestResetSchema", () => {
  it("accepts valid email", () => {
    expect(
      requestResetSchema.safeParse({ email: "user@test.com" }).success,
    ).toBe(true);
  });

  it("rejects invalid email", () => {
    expect(requestResetSchema.safeParse({ email: "bad" }).success).toBe(false);
  });
});

describe("resetPasswordSchema", () => {
  it("accepts valid reset", () => {
    const result = resetPasswordSchema.safeParse({
      email: "user@test.com",
      token: "abc123",
      newPassword: "newpass123",
    });
    expect(result.success).toBe(true);
  });

  it("rejects missing token", () => {
    const result = resetPasswordSchema.safeParse({
      email: "user@test.com",
      newPassword: "newpass123",
    });
    expect(result.success).toBe(false);
  });
});

// === Snapshot Schemas ===

describe("createSnapshotSchema", () => {
  const valid = {
    date: "2024-01-15",
    frequency: "monthly",
    totalValue: 10000,
    entries: [{ itemId: "item1", value: 5000 }],
  };

  it("accepts valid snapshot", () => {
    expect(createSnapshotSchema.safeParse(valid).success).toBe(true);
  });

  it("rejects empty entries", () => {
    expect(
      createSnapshotSchema.safeParse({ ...valid, entries: [] }).success,
    ).toBe(false);
  });

  it("rejects invalid frequency", () => {
    expect(
      createSnapshotSchema.safeParse({ ...valid, frequency: "daily" }).success,
    ).toBe(false);
  });

  it("rejects missing date", () => {
    const { date, ...rest } = valid;
    expect(createSnapshotSchema.safeParse(rest).success).toBe(false);
  });
});

describe("updateSnapshotSchema", () => {
  it("accepts partial updates", () => {
    expect(updateSnapshotSchema.safeParse({ totalValue: 20000 }).success).toBe(
      true,
    );
  });

  it("accepts empty object", () => {
    expect(updateSnapshotSchema.safeParse({}).success).toBe(true);
  });
});

// === Item Schemas ===

describe("createItemSchema", () => {
  it("accepts valid item with standard category", () => {
    const result = createItemSchema.safeParse({
      name: "Conto corrente",
      category: "Banca",
    });
    expect(result.success).toBe(true);
  });

  it("accepts custom category", () => {
    const result = createItemSchema.safeParse({
      name: "Crypto wallet",
      category: "Crypto",
    });
    expect(result.success).toBe(true);
  });

  it("rejects empty name", () => {
    expect(
      createItemSchema.safeParse({ name: "", category: "Banca" }).success,
    ).toBe(false);
  });

  it("rejects empty category", () => {
    expect(
      createItemSchema.safeParse({ name: "Test", category: "" }).success,
    ).toBe(false);
  });

  it("rejects category longer than 50 chars", () => {
    expect(
      createItemSchema.safeParse({
        name: "Test",
        category: "a".repeat(51),
      }).success,
    ).toBe(false);
  });
});

describe("updateItemSchema", () => {
  it("accepts partial update", () => {
    expect(updateItemSchema.safeParse({ name: "Updated" }).success).toBe(true);
  });

  it("accepts empty object", () => {
    expect(updateItemSchema.safeParse({}).success).toBe(true);
  });
});

describe("reorderSchema", () => {
  it("accepts valid reorder array", () => {
    const result = reorderSchema.safeParse([
      { id: "a", sortOrder: 0 },
      { id: "b", sortOrder: 1 },
    ]);
    expect(result.success).toBe(true);
  });

  it("rejects items without id", () => {
    const result = reorderSchema.safeParse([{ id: "", sortOrder: 0 }]);
    expect(result.success).toBe(false);
  });
});

// === Milestone Schemas ===

describe("createMilestoneSchema", () => {
  const valid = {
    date: "2024-06-01",
    title: "Promozione",
    description: "Nuovo ruolo",
    eventType: "job_change",
  };

  it("accepts valid milestone", () => {
    expect(createMilestoneSchema.safeParse(valid).success).toBe(true);
  });

  it("rejects invalid eventType", () => {
    expect(
      createMilestoneSchema.safeParse({ ...valid, eventType: "unknown" })
        .success,
    ).toBe(false);
  });

  it("rejects missing title", () => {
    const { title, ...rest } = valid;
    expect(createMilestoneSchema.safeParse(rest).success).toBe(false);
  });

  it("defaults description to empty string", () => {
    const { description, ...rest } = valid;
    const result = createMilestoneSchema.safeParse(rest);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.description).toBe("");
    }
  });
});

describe("updateMilestoneSchema", () => {
  it("accepts partial update", () => {
    expect(
      updateMilestoneSchema.safeParse({ title: "New Title" }).success,
    ).toBe(true);
  });

  it("accepts empty object", () => {
    expect(updateMilestoneSchema.safeParse({}).success).toBe(true);
  });
});

// === Category Definition Schemas ===

describe("createCategoryDefinitionSchema", () => {
  it("accepts valid category", () => {
    const result = createCategoryDefinitionSchema.safeParse({
      name: "Crypto",
      categoryType: "Crypto",
    });
    expect(result.success).toBe(true);
  });

  it("rejects empty name", () => {
    expect(
      createCategoryDefinitionSchema.safeParse({
        name: "",
        categoryType: "Crypto",
      }).success,
    ).toBe(false);
  });

  it("rejects name longer than 50 chars", () => {
    expect(
      createCategoryDefinitionSchema.safeParse({
        name: "a".repeat(51),
        categoryType: "Test",
      }).success,
    ).toBe(false);
  });
});

describe("bulkCategoryDefinitionsSchema", () => {
  it("accepts array of categories", () => {
    const result = bulkCategoryDefinitionsSchema.safeParse([
      { name: "Banca", categoryType: "Banca", sortOrder: 0 },
      { name: "Crypto", categoryType: "Crypto", sortOrder: 1 },
    ]);
    expect(result.success).toBe(true);
  });

  it("rejects items with missing name", () => {
    const result = bulkCategoryDefinitionsSchema.safeParse([
      { categoryType: "Banca", sortOrder: 0 },
    ]);
    expect(result.success).toBe(false);
  });
});
