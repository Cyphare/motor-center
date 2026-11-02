// Navigation link definitions for the authenticated areas. Kept as plain data
// (separate from presentation) so destinations can be unit-tested.
//
// Invariant: links shown inside an authenticated area must stay within that
// area. The pelanggan "Layanan" link in particular must NOT point at the
// public /catalog surface, otherwise clicking it swaps the authenticated
// layout for the logged-out public layout and the user appears logged out.

export interface NavLink {
  href: string;
  label: string;
}

export const PELANGGAN_NAV_LINKS: NavLink[] = [
  { href: "/pelanggan", label: "Servis Saya" },
  { href: "/pelanggan/baru", label: "Pesan Servis" },
  { href: "/pelanggan/layanan", label: "Layanan" },
  { href: "/pelanggan/profil", label: "Profil" },
];
