import Link from "next/link";

import { Button } from "@/components/ui/button";
import { ServiceCatalog } from "@/components/service-catalog";

export default function CatalogPage() {
  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-12">
      <div className="mb-8 space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight">Daftar Layanan</h1>
        <p className="max-w-2xl text-muted-foreground">
          Layanan servis yang tersedia di MotorCenter. Harga dan estimasi durasi
          bersifat perkiraan dan dapat disesuaikan setelah pemeriksaan.
        </p>
      </div>

      <ServiceCatalog />

      <div className="mt-10 flex flex-col items-center gap-2 rounded-lg border border-dashed p-6 text-center">
        <p className="text-sm text-muted-foreground">
          Ingin memesan servis online dan memantau statusnya?
        </p>
        <Button asChild>
          <Link href="/register">Daftar sebagai pelanggan</Link>
        </Button>
      </div>
    </main>
  );
}
