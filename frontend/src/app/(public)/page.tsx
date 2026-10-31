import Link from "next/link";
import {
  ClipboardList,
  Package,
  BarChart3,
  BellRing,
  ArrowRight,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const FEATURES = [
  {
    icon: ClipboardList,
    title: "Alur servis bertahap",
    description:
      "Pantau setiap tiket dari Antre, Diperiksa, Dikerjakan, Selesai, hingga Diambil secara real-time.",
  },
  {
    icon: Package,
    title: "Stok suku cadang otomatis",
    description:
      "Pemakaian suku cadang langsung memotong stok dan sistem memperingatkan saat persediaan menipis.",
  },
  {
    icon: BarChart3,
    title: "Laporan pendapatan",
    description:
      "Ringkasan harian dan bulanan pendapatan jasa serta suku cadang untuk pemilik bengkel.",
  },
  {
    icon: BellRing,
    title: "Notifikasi pelanggan",
    description:
      "Pemberitahuan otomatis ketika motor siap diambil, lengkap dengan struk servis PDF.",
  },
];

export default function LandingPage() {
  return (
    <main className="flex flex-1 flex-col">
      <section className="mx-auto flex w-full max-w-5xl flex-col items-center gap-6 px-6 py-20 text-center">
        <span className="rounded-full border px-3 py-1 text-xs font-medium text-muted-foreground">
          Manajemen Bengkel Motor Digital
        </span>
        <h1 className="max-w-2xl text-4xl font-semibold tracking-tight sm:text-5xl">
          Kelola servis, stok, dan pelanggan dalam satu sistem
        </h1>
        <p className="max-w-xl text-muted-foreground">
          MotorCenter menggantikan buku catatan manual dengan alur servis
          digital: status pengerjaan terpantau, pemakaian suku cadang tercatat,
          dan riwayat setiap kendaraan tersimpan rapi.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Button asChild size="lg">
            <Link href="/register">
              Daftar sebagai pelanggan
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link href="/catalog">Lihat daftar layanan</Link>
          </Button>
        </div>
        <p className="text-sm text-muted-foreground">
          Sudah punya akun?{" "}
          <Link href="/login" className="font-medium text-primary underline-offset-4 hover:underline">
            Masuk di sini
          </Link>
        </p>
      </section>

      <section className="border-t bg-muted/30">
        <div className="mx-auto grid w-full max-w-5xl gap-4 px-6 py-16 sm:grid-cols-2">
          {FEATURES.map((feature) => (
            <Card key={feature.title}>
              <CardHeader>
                <feature.icon className="h-6 w-6 text-primary" />
                <CardTitle className="mt-2">{feature.title}</CardTitle>
                <CardDescription>{feature.description}</CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      </section>

      <section className="mx-auto w-full max-w-5xl px-6 py-16">
        <Card>
          <CardHeader className="items-center text-center">
            <CardTitle className="text-2xl">Siap mendigitalkan bengkel Anda?</CardTitle>
            <CardDescription>
              Buat akun pelanggan untuk memesan servis online, atau hubungi staf
              bengkel untuk akses operasional.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            <Button asChild>
              <Link href="/register">Mulai sekarang</Link>
            </Button>
          </CardContent>
        </Card>
      </section>
    </main>
  );
}
