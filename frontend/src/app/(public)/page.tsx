import Link from "next/link";

import { Button } from "@/components/ui/button";
import { PlateNumber } from "@/components/plate-number";
import { ServiceCatalog } from "@/components/service-catalog";
import { StatusStepper } from "@/components/status-stepper";

const STEPS = [
  {
    title: "Pesan dari HP",
    body: "Isi plat nomor, tipe motor, dan keluhan. Pilih layanan kalau sudah tahu, atau biarkan mekanik yang menilai.",
  },
  {
    title: "Bawa motornya",
    body: "Sebutkan nomor tiket di kasir. Mekanik memeriksa dulu, lalu mengerjakan. Suku cadang yang dipakai tercatat di tiket.",
  },
  {
    title: "Ambil saat selesai",
    body: "Kami kirim email begitu motor siap. Bayar di kasir, struknya bisa diunduh dari akun Anda.",
  },
];

export default function LandingPage() {
  return (
    <main className="flex flex-1 flex-col">
      <section className="border-b">
        <div className="mx-auto grid w-full max-w-6xl gap-12 px-4 py-14 sm:px-6 lg:grid-cols-[1.1fr_1fr] lg:items-center lg:py-20">
          <div>
            <h1 className="text-5xl font-bold uppercase leading-[0.95] tracking-tight sm:text-6xl">
              Servis motor
              <br />
              tanpa nunggu
              <br />
              <span className="text-primary">di bengkel.</span>
            </h1>
            <p className="mt-6 max-w-md text-lg text-muted-foreground">
              Pesan dari HP, datang sesuai jadwal, dan lihat motor Anda sedang
              di tahap mana, dari antre sampai siap diambil.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Button asChild size="lg">
                <Link href="/register">Pesan servis</Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href="#harga">Lihat harga</Link>
              </Button>
              <Link
                href="/login"
                className="text-sm font-medium underline underline-offset-4 hover:text-primary"
              >
                Sudah punya akun? Masuk
              </Link>
            </div>
          </div>

          <figure className="border-2 border-foreground bg-card">
            <figcaption className="flex items-center justify-between border-b-2 border-foreground px-4 py-2 font-display text-sm font-bold uppercase tracking-wider">
              <span>Tiket MC-20261110-0002</span>
              <span className="text-muted-foreground">Contoh</span>
            </figcaption>
            <div className="space-y-5 p-4 sm:p-5">
              <div className="flex flex-wrap items-center gap-3">
                <PlateNumber plate="B 4567 KZZ" size="lg" />
                <div>
                  <p className="font-semibold">Yamaha Aerox 155</p>
                  <p className="text-sm text-muted-foreground">
                    Ganti oli &amp; tune up
                  </p>
                </div>
              </div>
              <StatusStepper status="Dikerjakan" />
              <dl className="grid grid-cols-2 gap-x-4 gap-y-3 border-t pt-4 text-sm">
                <div>
                  <dt className="text-xs uppercase tracking-wider text-muted-foreground">
                    Mekanik
                  </dt>
                  <dd className="font-medium">Budi Santoso</dd>
                </div>
                <div>
                  <dt className="text-xs uppercase tracking-wider text-muted-foreground">
                    Masuk tahap ini
                  </dt>
                  <dd className="font-medium tabular-nums">10:42 WIB</dd>
                </div>
                <div className="col-span-2">
                  <dt className="text-xs uppercase tracking-wider text-muted-foreground">
                    Catatan mekanik
                  </dt>
                  <dd>Oli lama sudah dikuras, sedang penggantian filter udara.</dd>
                </div>
              </dl>
            </div>
          </figure>
        </div>
      </section>

      <section id="harga" className="scroll-mt-20 border-b">
        <div className="mx-auto w-full max-w-6xl px-4 py-14 sm:px-6">
          <div className="mb-6 flex flex-wrap items-end justify-between gap-2">
            <h2 className="text-3xl font-bold uppercase tracking-tight">
              Harga layanan
            </h2>
            <Link
              href="/catalog"
              className="text-sm font-medium underline underline-offset-4 hover:text-primary"
            >
              Semua layanan
            </Link>
          </div>
          <ServiceCatalog limit={6} />
          <p className="mt-3 text-xs text-muted-foreground">
            Harga perkiraan. Biaya akhir ditentukan setelah motor diperiksa,
            termasuk suku cadang yang dipakai.
          </p>
        </div>
      </section>

      <section>
        <div className="mx-auto w-full max-w-6xl px-4 py-14 sm:px-6">
          <h2 className="mb-8 text-3xl font-bold uppercase tracking-tight">
            Cara servis
          </h2>
          <ol className="grid gap-8 md:grid-cols-3">
            {STEPS.map((step, index) => (
              <li key={step.title} className="border-t-2 border-foreground pt-4">
                <span className="font-display text-5xl font-bold leading-none text-primary">
                  {index + 1}
                </span>
                <h3 className="mt-3 text-xl font-bold">{step.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{step.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <footer className="mt-auto border-t">
        <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-2 px-4 py-6 text-sm text-muted-foreground sm:px-6">
          <span>© {new Date().getFullYear()} MotorCenter</span>
          <Link href="/login" className="hover:text-foreground">
            Masuk staf
          </Link>
        </div>
      </footer>
    </main>
  );
}
