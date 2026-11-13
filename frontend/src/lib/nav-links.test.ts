import { describe, expect, it } from "vitest";

import type { UserRole } from "@/types/api";
import {
  MEKANIK_NAV_LINKS,
  PELANGGAN_NAV_LINKS,
  activeHref,
  backofficeNavFor,
  backofficeProfileHref,
} from "@/lib/nav-links";
import { AREA_ROLES } from "@/lib/roles";

function areaOf(href: string): string {
  return `/${href.split("/")[1]}`;
}

function canEnter(role: UserRole, href: string): boolean {
  return AREA_ROLES[areaOf(href)]?.includes(role) ?? false;
}

const BACKOFFICE_ROLES: UserRole[] = ["admin", "kasir", "pemilik"];

describe("backofficeNavFor", () => {
  it.each(BACKOFFICE_ROLES)(
    "only links %s to areas that role may enter",
    (role) => {
      const hrefs = backofficeNavFor(role).flatMap((g) =>
        g.links.map((l) => l.href)
      );
      expect(hrefs.length).toBeGreaterThan(0);
      for (const href of hrefs) {
        expect(canEnter(role, href)).toBe(true);
      }
      expect(canEnter(role, backofficeProfileHref(role))).toBe(true);
    }
  );

  it("hides reports and admin from kasir", () => {
    const labels = backofficeNavFor("kasir").map((g) => g.label);
    expect(labels).toEqual(["Operasional", "Master Data"]);
  });

  it("shows only reports to pemilik", () => {
    const labels = backofficeNavFor("pemilik").map((g) => g.label);
    expect(labels).toEqual(["Laporan"]);
  });

  it("shows every group to admin", () => {
    const labels = backofficeNavFor("admin").map((g) => g.label);
    expect(labels).toEqual(["Operasional", "Master Data", "Laporan", "Admin"]);
  });
});

describe("MEKANIK_NAV_LINKS", () => {
  it("stays inside the mekanik area", () => {
    for (const link of MEKANIK_NAV_LINKS) {
      expect(canEnter("mekanik", link.href)).toBe(true);
    }
  });
});

describe("activeHref", () => {
  const hrefs = ["/staff", "/staff/baru", "/staff/parts"];

  it("matches the exact page", () => {
    expect(activeHref("/staff/parts", hrefs)).toBe("/staff/parts");
  });

  it("highlights the parent list for a detail page", () => {
    expect(activeHref("/staff/abc123", hrefs)).toBe("/staff");
  });

  it("does not match on a partial segment", () => {
    expect(activeHref("/staffing", hrefs)).toBeUndefined();
  });
});

describe("PELANGGAN_NAV_LINKS", () => {
  it("keeps every link inside the authenticated pelanggan area", () => {
    for (const link of PELANGGAN_NAV_LINKS) {
      expect(link.href.startsWith("/pelanggan")).toBe(true);
    }
  });

  it("points the Layanan link at the authenticated services view, not the public catalog", () => {
    const layanan = PELANGGAN_NAV_LINKS.find((l) => l.label === "Layanan");
    expect(layanan).toBeDefined();
    expect(layanan?.href).toBe("/pelanggan/layanan");
    expect(layanan?.href).not.toBe("/catalog");
  });

  it("exposes the Profil link inside the pelanggan area", () => {
    const profil = PELANGGAN_NAV_LINKS.find((l) => l.label === "Profil");
    expect(profil).toBeDefined();
    expect(profil?.href).toBe("/pelanggan/profil");
  });
});
