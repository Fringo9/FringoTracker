import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import {
  getAnalyticsCache,
  setAnalyticsCache,
  invalidateAnalyticsCache,
  clearAllAnalyticsCache,
} from "./analyticsCache.js";

describe("analyticsCache", () => {
  beforeEach(() => {
    clearAllAnalyticsCache();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns null for missing user", () => {
    expect(getAnalyticsCache("user1")).toBeNull();
  });

  it("stores and retrieves data", () => {
    const data = { totalWealth: 100000, monthlyAvgSavings: 2000 };
    setAnalyticsCache("user1", data);
    expect(getAnalyticsCache("user1")).toEqual(data);
  });

  it("isolates data per user", () => {
    setAnalyticsCache("user1", { wealth: 100 });
    setAnalyticsCache("user2", { wealth: 200 });

    expect(getAnalyticsCache("user1")).toEqual({ wealth: 100 });
    expect(getAnalyticsCache("user2")).toEqual({ wealth: 200 });
  });

  it("invalidates cache for a specific user", () => {
    setAnalyticsCache("user1", { wealth: 100 });
    setAnalyticsCache("user2", { wealth: 200 });

    invalidateAnalyticsCache("user1");

    expect(getAnalyticsCache("user1")).toBeNull();
    expect(getAnalyticsCache("user2")).toEqual({ wealth: 200 });
  });

  it("clears all cache entries", () => {
    setAnalyticsCache("user1", { wealth: 100 });
    setAnalyticsCache("user2", { wealth: 200 });

    clearAllAnalyticsCache();

    expect(getAnalyticsCache("user1")).toBeNull();
    expect(getAnalyticsCache("user2")).toBeNull();
  });

  it("returns null after TTL expires", () => {
    setAnalyticsCache("user1", { wealth: 100 });

    // Advance time past TTL (5 minutes)
    const original = Date.now;
    vi.spyOn(Date, "now").mockReturnValue(original() + 6 * 60 * 1000);

    expect(getAnalyticsCache("user1")).toBeNull();
  });

  it("returns data before TTL expires", () => {
    setAnalyticsCache("user1", { wealth: 100 });

    // Advance time within TTL (4 minutes)
    const now = Date.now();
    vi.spyOn(Date, "now").mockReturnValue(now + 4 * 60 * 1000);

    expect(getAnalyticsCache("user1")).toEqual({ wealth: 100 });
  });

  it("overwrites previous cache on re-set", () => {
    setAnalyticsCache("user1", { wealth: 100 });
    setAnalyticsCache("user1", { wealth: 300 });

    expect(getAnalyticsCache("user1")).toEqual({ wealth: 300 });
  });
});
