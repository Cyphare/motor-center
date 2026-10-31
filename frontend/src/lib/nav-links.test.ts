import { describe, expect, it } from "vitest";

import { PELANGGAN_NAV_LINKS } from "@/lib/nav-links";

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
});
