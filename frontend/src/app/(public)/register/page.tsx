"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

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
import {
  registerFormSchema,
  type RegisterFormValues,
} from "@/lib/validations";

const KNOWN_FIELDS = ["name", "email", "password", "phone"] as const;

export default function RegisterPage() {
  const router = useRouter();
  const { redirecting } = useRedirectAuthenticated();
  const register = useRegister();

  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerFormSchema),
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
    <main className="flex flex-1 justify-center px-4 py-14 sm:py-20">
      <Card className="w-full max-w-sm border-0 bg-transparent">
        <CardHeader className="px-0 pt-0">
          <CardTitle className="font-display text-4xl font-bold uppercase">Buat akun</CardTitle>
          <CardDescription>Untuk memesan servis online dan melihat riwayat motor Anda.</CardDescription>
        </CardHeader>
        <Form {...form}>
          <form onSubmit={onSubmit}>
            <CardContent className="space-y-4 px-0">
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
            <CardFooter className="flex flex-col items-stretch gap-4 px-0">
              <Button type="submit" disabled={register.isPending}>
                {register.isPending ? "Memproses..." : "Daftar"}
              </Button>
              <p className="text-sm text-muted-foreground">
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
