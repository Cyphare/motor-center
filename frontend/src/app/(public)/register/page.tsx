"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Form } from "@/components/ui/form";
import { FormField } from "@/components/form-field";
import { LoadingState } from "@/components/loading-state";
import { useRegister } from "@/hooks/use-mutations";
import { useRedirectAuthenticated } from "@/hooks/use-redirect-authenticated";
import { applyApiFieldErrors } from "@/lib/form-errors";

// Mirrors backend/src/validations/auth.validation.ts registerSchema.
const registerSchema = z.object({
  name: z
    .string()
    .min(2, "Nama minimal 2 karakter")
    .max(100, "Nama maksimal 100 karakter"),
  email: z.string().min(1, "Email wajib diisi").email("Format alamat email tidak valid"),
  password: z.string().min(6, "Kata sandi minimal 6 karakter"),
  phone: z.string().min(8, "Nomor telepon minimal 8 digit"),
});

type RegisterValues = z.infer<typeof registerSchema>;

const KNOWN_FIELDS = ["name", "email", "password", "phone"] as const;

export default function RegisterPage() {
  const router = useRouter();
  const { redirecting } = useRedirectAuthenticated();
  const register = useRegister();

  const form = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { name: "", email: "", password: "", phone: "" },
  });

  const onSubmit = form.handleSubmit((values) => {
    register.mutate(values, {
      onSuccess: () => {
        // Backend always assigns the role `pelanggan`.
        router.replace("/pelanggan");
      },
      onError: (error) => {
        applyApiFieldErrors(error, form.setError, KNOWN_FIELDS);
      },
    });
  });

  if (redirecting) {
    return <LoadingState label="Mengalihkan..." />;
  }

  return (
    <main className="flex flex-1 items-center justify-center p-6">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl">Daftar akun pelanggan</CardTitle>
          <CardDescription>
            Buat akun untuk memesan servis online dan memantau riwayat kendaraan
            Anda.
          </CardDescription>
        </CardHeader>
        <Form {...form}>
          <form onSubmit={onSubmit}>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                label="Nama lengkap"
                placeholder="Nama Anda"
              />
              <FormField
                control={form.control}
                name="email"
                label="Email"
                type="email"
                placeholder="nama@email.com"
              />
              <FormField
                control={form.control}
                name="phone"
                label="Nomor telepon"
                placeholder="08xxxxxxxxxx"
              />
              <FormField
                control={form.control}
                name="password"
                label="Kata sandi"
                type="password"
                placeholder="Minimal 6 karakter"
              />
            </CardContent>
            <CardFooter className="flex flex-col items-stretch gap-4">
              <Button type="submit" disabled={register.isPending}>
                {register.isPending ? "Memproses..." : "Daftar"}
              </Button>
              <p className="text-center text-sm text-muted-foreground">
                Sudah punya akun?{" "}
                <Link
                  href="/login"
                  className="font-medium text-primary underline-offset-4 hover:underline"
                >
                  Masuk di sini
                </Link>
              </p>
            </CardFooter>
          </form>
        </Form>
      </Card>
    </main>
  );
}
