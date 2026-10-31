import Link from "next/link";

import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-6 p-10 text-center">
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight">MotorCenter</h1>
        <p className="max-w-md text-muted-foreground">
          Sistem manajemen bengkel motor: alur servis, stok suku cadang, dan
          laporan dalam satu tempat.
        </p>
      </div>
      <Button asChild>
        <Link href="/login">Masuk</Link>
      </Button>
    </main>
  );
}
