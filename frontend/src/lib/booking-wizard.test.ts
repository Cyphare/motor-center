import { describe, expect, it } from "vitest";

import {
  WIZARD_STEPS,
  jakartaToday,
  serviceDateToIso,
  stepForFields,
} from "@/lib/booking-wizard";

describe("serviceDateToIso", () => {
  it("schedules a day at opening time in WIB", () => {
    expect(serviceDateToIso("2026-11-14")).toBe("2026-11-14T08:00:00+07:00");
  });

  it("rejects anything that is not YYYY-MM-DD", () => {
    expect(serviceDateToIso("")).toBeUndefined();
    expect(serviceDateToIso("14/11/2026")).toBeUndefined();
  });
});

describe("jakartaToday", () => {
  it("uses the Jakarta calendar day, not UTC", () => {
    // 20:00 UTC on the 12th is already 03:00 on the 13th in Jakarta.
    expect(jakartaToday(new Date("2026-11-12T20:00:00Z"))).toBe("2026-11-13");
  });
});

describe("stepForFields", () => {
  it("maps server field errors back to the step that owns them", () => {
    expect(WIZARD_STEPS[stepForFields(["plateNumber"])].id).toBe("motor");
    expect(WIZARD_STEPS[stepForFields(["complaint"])].id).toBe("jadwal");
    expect(WIZARD_STEPS[stepForFields(["unknown"])].id).toBe("konfirmasi");
  });

  it("covers every form field exactly once", () => {
    const fields = WIZARD_STEPS.flatMap((s) => s.fields as readonly string[]);
    expect([...fields].sort()).toEqual(
      ["complaint", "motorModel", "plateNumber", "serviceDate", "serviceId"].sort()
    );
  });
});
