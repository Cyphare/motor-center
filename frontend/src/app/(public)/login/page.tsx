"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
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
    <main className="flex flex-1 justify-center px-4 py-14 sm:py-20">
      <Card className="w-full max-w-sm border-0 bg-transparent">
        <CardHeader className="px-0 pt-0">
          <CardTitle className="font-display text-4xl font-bold uppercase">Masuk</CardTitle>
          
        </CardHeader>
        <Form {...form}>
          <form onSubmit={onSubmit}>
            <CardContent className="space-y-4 px-0">
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
            <CardFooter className="flex flex-col items-stretch gap-4 px-0">
              <Button type="submit" disabled={login.isPending}>
                {login.isPending ? "Memproses..." : "Masuk"}
              </Button>
              <p className="text-sm text-muted-foreground">
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
