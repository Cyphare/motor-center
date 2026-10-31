import { describe, expect, it } from "vitest";

import { decideGuard } from "@/lib/guard-decision";

describe("decideGuard", () => {
  it("allows (loading) while the session is not hydrated", () => {
    expect(
      decideGuard({ isHydrated: false, role: null, allowedRoles: ["admin"] })
    ).toEqual({ action: "allow" });
  });

  it("redirects unauthenticated users to /login", () => {
    expect(
      decideGuard({ isHydrated: true, role: null, allowedRoles: ["admin"] })
    ).toEqual({ action: "redirect", to: "/login" });
  });

  it("redirects wrong-role users to their own home", () => {
    expect(
      decideGuard({
        isHydrated: true,
        role: "mekanik",
        allowedRoles: ["admin", "kasir"],
      })
    ).toEqual({ action: "redirect", to: "/mekanik" });
  });

  it("sends pelanggan to /pelanggan when disallowed", () => {
    expect(
      decideGuard({
        isHydrated: true,
        role: "pelanggan",
        allowedRoles: ["admin"],
      })
    ).toEqual({ action: "redirect", to: "/pelanggan" });
  });

  it("allows an admin into the staff area", () => {
    expect(
      decideGuard({
        isHydrated: true,
        role: "admin",
        allowedRoles: ["kasir", "admin"],
      })
    ).toEqual({ action: "allow" });
  });

  it("allows an admin into the owner area (dual access)", () => {
    expect(
      decideGuard({
        isHydrated: true,
        role: "admin",
        allowedRoles: ["pemilik", "admin"],
      })
    ).toEqual({ action: "allow" });
  });
});
