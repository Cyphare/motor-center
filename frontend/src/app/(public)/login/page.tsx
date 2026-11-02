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
import { useLogin } from "@/hooks/use-mutations";
import { useRedirectAuthenticated } from "@/hooks/use-redirect-authenticated";
import { applyApiFieldErrors } from "@/lib/form-errors";
import { homeForRole } from "@/lib/roles";
import { loginFormSchema, type LoginFormValues } from "@/lib/validations";

export default function LoginPage() {
  const router = useRouter();
  const { redirecting } = useRedirectAuthenticated();
  const login = useLogin();

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginFormSchema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = form.handleSubmit((values) => {
    login.mutate(values, {
      onSuccess: (result) => {
        router.replace(homeForRole(result.user.role));
      },
      onError: (error) => {
        applyApiFieldErrors(error, form.setError, ["email", "password"]);
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
          <CardTitle className="text-2xl">Masuk</CardTitle>
          <CardDescription>
            Masuk ke akun MotorCenter Anda untuk melanjutkan.
          </CardDescription>
        </CardHeader>
        <Form {...form}>
          <form onSubmit={onSubmit}>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                label="Email"
                type="email"
                placeholder="nama@email.com"
              />
              <FormField
                control={form.control}
                name="password"
                label="Kata sandi"
                type="password"
                placeholder="••••••••"
              />
            </CardContent>
            <CardFooter className="flex flex-col items-stretch gap-4">
              <Button type="submit" disabled={login.isPending}>
                {login.isPending ? "Memproses..." : "Masuk"}
              </Button>
              <p className="text-center text-sm text-muted-foreground">
                Belum punya akun?{" "}
                <Link
                  href="/register"
                  className="font-medium text-primary underline-offset-4 hover:underline"
                >
                  Daftar di sini
                </Link>
              </p>
            </CardFooter>
          </form>
        </Form>
      </Card>
    </main>
  );
}
