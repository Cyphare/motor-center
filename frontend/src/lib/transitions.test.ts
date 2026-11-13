import { describe, expect, it } from "vitest";

import { ALLOWED_TRANSITIONS } from "@/types/api";
import {
  canAssignMechanic,
  canTransition,
  isTerminalStatus,
  nextStatuses,
  nextStatusesForRole,
} from "@/lib/transitions";

describe("ALLOWED_TRANSITIONS", () => {
  it("mirrors the backend status flow exactly, including Dibatalkan", () => {
    expect(ALLOWED_TRANSITIONS).toEqual({
      Antre: ["Diperiksa", "Dibatalkan"],
      Diperiksa: ["Dikerjakan", "Dibatalkan"],
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

describe("nextStatusesForRole", () => {
  it("grants admin and kasir every legal transition including cancellation and checkout", () => {
    for (const role of ["admin", "kasir"] as const) {
      expect(nextStatusesForRole("Antre", role)).toEqual([
        "Diperiksa",
        "Dibatalkan",
      ]);
      expect(nextStatusesForRole("Selesai", role)).toEqual(["Diambil"]);
    }
  });

  it("restricts mekanik to sequential active-work transitions (no Dibatalkan or Diambil)", () => {
    expect(nextStatusesForRole("Antre", "mekanik")).toEqual(["Diperiksa"]);
    expect(nextStatusesForRole("Diperiksa", "mekanik")).toEqual(["Dikerjakan"]);
    expect(nextStatusesForRole("Dikerjakan", "mekanik")).toEqual(["Selesai"]);
    expect(nextStatusesForRole("Selesai", "mekanik")).toEqual([]);
    expect(nextStatusesForRole("Diambil", "mekanik")).toEqual([]);
    expect(nextStatusesForRole("Dibatalkan", "mekanik")).toEqual([]);
  });

  it("disallows status updates for pemilik and pelanggan", () => {
    expect(nextStatusesForRole("Antre", "pemilik")).toEqual([]);
    expect(nextStatusesForRole("Antre", "pelanggan")).toEqual([]);
  });
});

describe("canAssignMechanic", () => {
  it("allows assigning while the ticket is still in progress", () => {
    expect(canAssignMechanic("Antre")).toBe(true);
    expect(canAssignMechanic("Diperiksa")).toBe(true);
    expect(canAssignMechanic("Dikerjakan")).toBe(true);
  });

  it("disallows assigning once the ticket is finished, picked up, or canceled", () => {
    expect(canAssignMechanic("Selesai")).toBe(false);
    expect(canAssignMechanic("Diambil")).toBe(false);
    expect(canAssignMechanic("Dibatalkan")).toBe(false);
  });
});

describe("cancel from Diperiksa (backend SRS alignment)", () => {
  it("lets admin/kasir cancel while the ticket is being inspected", () => {
    expect(nextStatusesForRole("Diperiksa", "kasir")).toEqual([
      "Dikerjakan",
      "Dibatalkan",
    ]);
  });
  it("still keeps cancel away from mekanik", () => {
    expect(nextStatusesForRole("Diperiksa", "mekanik")).toEqual(["Dikerjakan"]);
  });
});
