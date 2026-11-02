"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { KeyRound, UserCheck } from "lucide-react";

import { Badge } from "@/components/ui/badge";
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
import { PageHeader } from "@/components/page-header";
import { useAuth } from "@/hooks/use-auth";
import { useChangePassword, useUpdateProfile } from "@/hooks/use-mutations";
import { applyApiFieldErrors } from "@/lib/form-errors";
import {
  changePasswordFormSchema,
  updateProfileFormSchema,
  type ChangePasswordFormValues,
  type UpdateProfileFormValues,
} from "@/lib/validations";
import type { UserRole } from "@/types/api";

const PROFILE_KNOWN_FIELDS = ["name", "phone"] as const;
const PASSWORD_KNOWN_FIELDS = ["oldPassword", "newPassword"] as const;

function roleLabel(role: UserRole): string {
  const labels: Record<UserRole, string> = {
    admin: "Admin",
    kasir: "Kasir",
    mekanik: "Mekanik",
    pemilik: "Pemilik",
    pelanggan: "Pelanggan",
  };
  return labels[role];
}

export function AccountSettings() {
  const router = useRouter();
  const { user, isHydrated } = useAuth();
  const updateProfile = useUpdateProfile();
  const changePassword = useChangePassword();

  const profileForm = useForm<UpdateProfileFormValues>({
    resolver: zodResolver(updateProfileFormSchema),
    defaultValues: {
      name: user?.name ?? "",
      phone: user?.phone ?? "",
    },
  });

  const passwordForm = useForm<ChangePasswordFormValues>({
    resolver: zodResolver(changePasswordFormSchema),
    defaultValues: {
      oldPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  React.useEffect(() => {
    if (user) {
      profileForm.reset({
        name: user.name,
        phone: user.phone,
      });
    }
  }, [user, profileForm]);

  if (!isHydrated || !user) {
    return <LoadingState label="Memuat profil..." className="flex-1" />;
  }

  const onProfileSubmit = profileForm.handleSubmit((values) => {
    updateProfile.mutate(
      {
        name: values.name.trim(),
        phone: values.phone.trim(),
      },
      {
        onError: (error) => {
          applyApiFieldErrors(error, profileForm.setError, PROFILE_KNOWN_FIELDS);
        },
      }
    );
  });

  const onPasswordSubmit = passwordForm.handleSubmit((values) => {
    changePassword.mutate(
      {
        oldPassword: values.oldPassword,
        newPassword: values.newPassword,
      },
      {
        onSuccess: () => {
          passwordForm.reset();
          router.replace("/login");
        },
        onError: (error) => {
          applyApiFieldErrors(
            error,
            passwordForm.setError,
            PASSWORD_KNOWN_FIELDS
          );
        },
      }
    );
  });

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-6 py-10">
      <PageHeader
        title="Profil & Keamanan Akun"
        description="Perbarui nama, nomor telepon, atau kata sandi akun MotorCenter Anda."
        actions={<Badge variant="outline">{roleLabel(user.role)}</Badge>}
      />

      <div className="mt-8 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <UserCheck className="h-5 w-5 text-primary" />
              Informasi Profil
            </CardTitle>
            <CardDescription>
              Terdaftar dengan email <span className="font-medium text-foreground">{user.email}</span>
            </CardDescription>
          </CardHeader>
          <Form {...profileForm}>
            <form onSubmit={onProfileSubmit}>
              <CardContent className="space-y-4">
                <FormField
                  control={profileForm.control}
                  name="name"
                  label="Nama lengkap"
                  placeholder="Nama lengkap Anda"
                />
                <FormField
                  control={profileForm.control}
                  name="phone"
                  label="Nomor telepon"
                  placeholder="08xxxxxxxxxx"
                />
              </CardContent>
              <CardFooter className="flex justify-end">
                <Button type="submit" disabled={updateProfile.isPending}>
                  {updateProfile.isPending ? "Menyimpan..." : "Simpan Profil"}
                </Button>
              </CardFooter>
            </form>
          </Form>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <KeyRound className="h-5 w-5 text-primary" />
              Ubah Kata Sandi
            </CardTitle>
            <CardDescription>
              Demi keamanan, seluruh sesi aktif akan diakhiri setelah kata sandi
              diubah dan Anda perlu masuk kembali.
            </CardDescription>
          </CardHeader>
          <Form {...passwordForm}>
            <form onSubmit={onPasswordSubmit}>
              <CardContent className="space-y-4">
                <FormField
                  control={passwordForm.control}
                  name="oldPassword"
                  label="Kata sandi saat ini"
                  type="password"
                  placeholder="••••••••"
                />
                <FormField
                  control={passwordForm.control}
                  name="newPassword"
                  label="Kata sandi baru"
                  type="password"
                  placeholder="Minimal 6 karakter"
                />
                <FormField
                  control={passwordForm.control}
                  name="confirmPassword"
                  label="Konfirmasi kata sandi baru"
                  type="password"
                  placeholder="Ulangi kata sandi baru"
                />
              </CardContent>
              <CardFooter className="flex justify-end">
                <Button type="submit" disabled={changePassword.isPending}>
                  {changePassword.isPending
                    ? "Memperbarui..."
                    : "Perbarui Kata Sandi"}
                </Button>
              </CardFooter>
            </form>
          </Form>
        </Card>
      </div>
    </main>
  );
}
