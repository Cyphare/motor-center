import Link from "next/link";

import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/page-header";
import { ServiceCatalog } from "@/components/service-catalog";

export default function CatalogPage() {
  return (
    <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-10 sm:px-6">
      <PageHeader
        title="Harga layanan"
        description="Harga perkiraan. Biaya akhir ditentukan setelah motor diperiksa."
        actions={
          <Button asChild size="sm">
            <Link href="/register">Pesan servis</Link>
          </Button>
        }
      />
      <ServiceCatalog className="mt-6" />
    </main>
  );
}
