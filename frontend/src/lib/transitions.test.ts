import { describe, expect, it } from "vitest";

import { ALLOWED_TRANSITIONS } from "@/types/api";
import {
  canTransition,
  isTerminalStatus,
  nextStatuses,
} from "@/lib/transitions";

describe("ALLOWED_TRANSITIONS", () => {
  it("mirrors the backend status flow exactly, including Dibatalkan", () => {
    expect(ALLOWED_TRANSITIONS).toEqual({
      Antre: ["Diperiksa", "Dibatalkan"],
      Diperiksa: ["Dikerjakan"],
      Dikerjakan: ["Selesai"],
      Selesai: ["Diambil"],
      Diambil: [],
      Dibatalkan: [],
    });
  });
});

describe("canTransition", () => {
  it("allows documented forward transitions", () => {
    expect(canTransition("Antre", "Diperiksa")).toBe(true);
    expect(canTransition("Antre", "Dibatalkan")).toBe(true);
    expect(canTransition("Diperiksa", "Dikerjakan")).toBe(true);
    expect(canTransition("Dikerjakan", "Selesai")).toBe(true);
    expect(canTransition("Selesai", "Diambil")).toBe(true);
  });

  it("rejects skipping stages and backwards moves", () => {
    expect(canTransition("Antre", "Dikerjakan")).toBe(false);
    expect(canTransition("Diperiksa", "Selesai")).toBe(false);
    expect(canTransition("Dikerjakan", "Antre")).toBe(false);
  });

  it("rejects any transition from terminal states", () => {
    expect(canTransition("Diambil", "Selesai")).toBe(false);
    expect(canTransition("Dibatalkan", "Antre")).toBe(false);
  });
});

describe("nextStatuses / isTerminalStatus", () => {
  it("returns allowed next statuses", () => {
    expect(nextStatuses("Antre")).toEqual(["Diperiksa", "Dibatalkan"]);
    expect(nextStatuses("Selesai")).toEqual(["Diambil"]);
  });

  it("flags terminal statuses", () => {
    expect(isTerminalStatus("Diambil")).toBe(true);
    expect(isTerminalStatus("Dibatalkan")).toBe(true);
    expect(isTerminalStatus("Antre")).toBe(false);
  });
});
