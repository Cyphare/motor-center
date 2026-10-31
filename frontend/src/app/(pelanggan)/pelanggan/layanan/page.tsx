"use client";

import Link from "next/link";

import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/page-header";
import { ServiceCatalog } from "@/components/service-catalog";

export default function PelangganLayananPage() {
  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-10">
      <PageHeader
        title="Layanan"
        description="Layanan servis yang tersedia di MotorCenter. Harga dan estimasi durasi bersifat perkiraan dan dapat disesuaikan setelah pemeriksaan."
        actions={
          <Button asChild size="sm">
            <Link href="/pelanggan/baru">Pesan Servis</Link>
          </Button>
        }
      />

      <div className="mt-8">
        <ServiceCatalog />
      </div>
    </main>
  );
}
