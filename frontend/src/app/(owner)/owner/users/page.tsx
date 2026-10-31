"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Form } from "@/components/ui/form";
import { FormField } from "@/components/form-field";
import { PageHeader } from "@/components/page-header";
import { DataTable } from "@/components/data-table";
import { EmptyState } from "@/components/empty-state";
import { ErrorState } from "@/components/error-state";
import { TableSkeleton } from "@/components/loading-state";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { Badge } from "@/components/ui/badge";
import { RoleGuard } from "@/components/guards/role-guard";
import { useUsers } from "@/hooks/use-queries";
import { useCreateStaff, useToggleUserStatus } from "@/hooks/use-mutations";
import { applyApiFieldErrors } from "@/lib/form-errors";
import type { UserListQuery } from "@/services/users";
import type { User, UserRole } from "@/types/api";

const STAFF_ROLES = ["admin", "kasir", "mekanik", "pemilik"] as const;
const FILTER_ROLES: UserRole[] = [
  "admin",
  "kasir",
  "mekanik",
  "pemilik",
  "pelanggan",
];

const ANY = "__any__";
const PAGE_SIZE = 10;

// Mirrors backend/src/validations/user.validation.ts createStaffSchema.
const createStaffSchema = z.object({
  name: z.string().trim().min(2, "Nama minimal 2 karakter").max(100),
  email: z.string().trim().email("Format alamat email tidak valid"),
  password: z.string().min(6, "Kata sandi minimal 6 karakter"),
  role: z.enum(STAFF_ROLES, {
    message: "Peran harus salah satu dari: admin, kasir, mekanik, pemilik",
  }),
  phone: z.string().trim().min(8, "Nomor telepon minimal 8 karakter"),
});

type CreateStaffValues = z.infer<typeof createStaffSchema>;

const KNOWN_FIELDS = ["name", "email", "password", "role", "phone"] as const;

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

export default function OwnerUsersPage() {
  return (
    <RoleGuard allowedRoles={["admin"]}>
      <UsersManagement />
    </RoleGuard>
  );
}

function UsersManagement() {
  const [role, setRole] = React.useState<string>(ANY);
  const [isActive, setIsActive] = React.useState<string>(ANY);
  const [search, setSearch] = React.useState("");
  const [page, setPage] = React.useState(1);
  const [createOpen, setCreateOpen] = React.useState(false);
  const [toggleTarget, setToggleTarget] = React.useState<User | null>(null);

  const toggleStatus = useToggleUserStatus();

  const query: UserListQuery = React.useMemo(() => {
    const q: UserListQuery = { page, limit: PAGE_SIZE };
    if (role !== ANY) q.role = role as UserRole;
    if (isActive !== ANY) q.isActive = isActive === "true";
    if (search.trim()) q.search = search.trim();
    return q;
  }, [page, role, isActive, search]);

  const { data, isLoading, isError, error, refetch } = useUsers(query);
  const users = data?.data ?? [];
  const pagination = data?.pagination;

  function resetToFirstPage<T>(setter: (value: T) => void) {
    return (value: T) => {
      setter(value);
      setPage(1);
    };
  }

  function handleConfirmToggle() {
    if (!toggleTarget) return;
    toggleStatus.mutate(
      { id: toggleTarget._id, isActive: !toggleTarget.isActive },
      { onSuccess: () => setToggleTarget(null) }
    );
  }

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-10">
      <PageHeader
        title="Manajemen Pengguna"
        description="Buat akun staf, cari pengguna, dan aktif/nonaktifkan akun."
        actions={
          <Button size="sm" onClick={() => setCreateOpen(true)}>
            <Plus className="mr-1 h-4 w-4" />
            Staf Baru
          </Button>
        }
      />

      <Card className="mt-6">
        <CardContent className="grid gap-4 pt-6 sm:grid-cols-3">
          <div className="space-y-2">
            <Label>Peran</Label>
            <Select value={role} onValueChange={resetToFirstPage(setRole)}>
              <SelectTrigger>
                <SelectValue placeholder="Semua peran" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ANY}>Semua peran</SelectItem>
                {FILTER_ROLES.map((item) => (
                  <SelectItem key={item} value={item}>
                    {roleLabel(item)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Status</Label>
            <Select
              value={isActive}
              onValueChange={resetToFirstPage(setIsActive)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Semua status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ANY}>Semua status</SelectItem>
                <SelectItem value="true">Aktif</SelectItem>
                <SelectItem value="false">Nonaktif</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="search">Cari</Label>
            <Input
              id="search"
              value={search}
              onChange={(event) =>
                resetToFirstPage(setSearch)(event.target.value)
              }
              placeholder="Nama, email, atau telepon"
            />
          </div>
        </CardContent>
      </Card>

      <div className="mt-6">
        {isLoading ? (
          <TableSkeleton rows={5} columns={5} />
        ) : isError ? (
          <ErrorState
            message={error instanceof Error ? error.message : undefined}
            onRetry={() => refetch()}
          />
        ) : users.length === 0 ? (
          <EmptyState
            title="Tidak ada pengguna"
            description="Belum ada pengguna yang cocok dengan filter ini."
          />
        ) : (
          <DataTable<User>
            columns={[
              { key: "name", header: "Nama", cell: (user) => user.name },
              {
                key: "email",
                header: "Email",
                cell: (user) => (
                  <span className="text-muted-foreground">{user.email}</span>
                ),
              },
              {
                key: "role",
                header: "Peran",
                cell: (user) => (
                  <Badge variant="outline">{roleLabel(user.role)}</Badge>
                ),
              },
              {
                key: "isActive",
                header: "Status",
                cell: (user) =>
                  user.isActive ? (
                    <Badge
                      variant="outline"
                      className="border-emerald-200 bg-emerald-50 text-emerald-700"
                    >
                      Aktif
                    </Badge>
                  ) : (
                    <Badge
                      variant="outline"
                      className="border-slate-200 bg-slate-100 text-slate-600"
                    >
                      Nonaktif
                    </Badge>
                  ),
              },
              {
                key: "actions",
                header: "",
                className: "text-right",
                cell: (user) => (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setToggleTarget(user)}
                  >
                    {user.isActive ? "Nonaktifkan" : "Aktifkan"}
                  </Button>
                ),
              },
            ]}
            rows={users}
            getRowId={(user) => user._id}
          />
        )}
      </div>

      {pagination && pagination.totalPages > 1 && (
        <div className="mt-6 flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Halaman {pagination.page} dari {pagination.totalPages} &middot;{" "}
            {pagination.total} pengguna
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={pagination.page <= 1}
              onClick={() => setPage((current) => Math.max(1, current - 1))}
            >
              Sebelumnya
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={pagination.page >= pagination.totalPages}
              onClick={() => setPage((current) => current + 1)}
            >
              Berikutnya
            </Button>
          </div>
        </div>
      )}

      <CreateStaffDialog open={createOpen} onOpenChange={setCreateOpen} />
      <ConfirmDialog
        open={Boolean(toggleTarget)}
        onOpenChange={(value) => !value && setToggleTarget(null)}
        title={
          toggleTarget?.isActive
            ? "Nonaktifkan pengguna?"
            : "Aktifkan pengguna?"
        }
        description={
          toggleTarget
            ? `Akun ${toggleTarget.name} akan ${
                toggleTarget.isActive ? "dinonaktifkan" : "diaktifkan"
              }.`
            : undefined
        }
        confirmLabel={toggleTarget?.isActive ? "Nonaktifkan" : "Aktifkan"}
        destructive={toggleTarget?.isActive ?? false}
        loading={toggleStatus.isPending}
        onConfirm={handleConfirmToggle}
      />
    </main>
  );
}

function CreateStaffDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const createStaff = useCreateStaff();
  const form = useForm<CreateStaffValues>({
    resolver: zodResolver(createStaffSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      role: "kasir",
      phone: "",
    },
  });

  React.useEffect(() => {
    if (open) form.reset();
  }, [open, form]);

  const onSubmit = form.handleSubmit((values) => {
    createStaff.mutate(
      {
        name: values.name.trim(),
        email: values.email.trim(),
        password: values.password,
        role: values.role,
        phone: values.phone.trim(),
      },
      {
        onSuccess: () => onOpenChange(false),
        onError: (error) =>
          applyApiFieldErrors(error, form.setError, KNOWN_FIELDS),
      }
    );
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Akun Staf Baru</DialogTitle>
          <DialogDescription>
            Buat akun untuk admin, kasir, mekanik, atau pemilik.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={onSubmit} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              label="Nama lengkap"
              placeholder="Budi Santoso"
            />
            <FormField
              control={form.control}
              name="email"
              label="Email"
              type="email"
              placeholder="budi@motorcenter.id"
            />
            <FormField
              control={form.control}
              name="password"
              label="Kata sandi"
              type="password"
              placeholder="Minimal 6 karakter"
            />
            <FormField
              control={form.control}
              name="role"
              label="Peran"
              render={(field) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih peran" />
                  </SelectTrigger>
                  <SelectContent>
                    {STAFF_ROLES.map((item) => (
                      <SelectItem key={item} value={item}>
                        {roleLabel(item)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            <FormField
              control={form.control}
              name="phone"
              label="Nomor telepon"
              placeholder="081234567890"
            />
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={createStaff.isPending}
              >
                Batal
              </Button>
              <Button type="submit" disabled={createStaff.isPending}>
                {createStaff.isPending ? "Menyimpan..." : "Simpan"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
