import { describe, expect, it } from "vitest";

import {
  ALLOWED_STATUS_TRANSITIONS as BACKEND_TRANSITIONS,
  SERVICE_STATUS as BACKEND_SERVICE_STATUS,
} from "../../../backend/src/constants";
import { ALLOWED_TRANSITIONS, SERVICE_STATUS_FLOW } from "@/types/api";
import { STATUS_META } from "@/lib/status-meta";
import { formatPlate } from "@/components/plate-number";

describe("frontend/backend status parity", () => {
  it("transition map matches backend constants exactly", () => {
    expect(ALLOWED_TRANSITIONS).toEqual(BACKEND_TRANSITIONS);
  });

  it("has display metadata for every backend status", () => {
    const backendStatuses = Object.values(BACKEND_SERVICE_STATUS).sort();
    expect(Object.keys(STATUS_META).sort()).toEqual(backendStatuses);
  });

  it("flow covers every non-cancel status in order", () => {
    expect(SERVICE_STATUS_FLOW).toEqual([
      "Antre",
      "Diperiksa",
      "Dikerjakan",
      "Selesai",
      "Diambil",
    ]);
  });
});

describe("formatPlate", () => {
  it("uppercases and collapses whitespace", () => {
    expect(formatPlate("  b 1234   xyz ")).toBe("B 1234 XYZ");
  });
});
