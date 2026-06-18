"use client";
import { useEffect, useState } from "react";
import { UserCog, Shield } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getUsers, updateUserRole, type UserWithRole } from "@/lib/api/users";
import { useAuthStore } from "@/lib/stores/auth-store";
import { isSuperAdmin } from "@/lib/utils/role-guard";
import { ROLE_LABELS } from "@/lib/constants/roles";
import type { Role } from "@/types";
import RouteGuard from "@/components/RouteGuard";

export default function UsersPage() {
  return (
    <RouteGuard allowedRoles={["SUPER_ADMIN"]}>
      <UsersPageContent />
    </RouteGuard>
  );
}

function UsersPageContent() {
  const { role: currentRole } = useAuthStore();
  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);

  const isSA = currentRole && isSuperAdmin(currentRole);

  useEffect(() => {
    if (!isSA) return;
    loadUsers();
  }, [isSA]);

  async function loadUsers() {
    setLoading(true);
    try {
      const data = await getUsers();
      setUsers(data);
    } catch {
      // handle error
    } finally {
      setLoading(false);
    }
  }

  async function handleRoleChange(userId: string, newRole: Role) {
    if (!isSA) return;
    setUpdating(userId);
    try {
      const updated = await updateUserRole(userId, newRole);
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? updated : u))
      );
    } catch {
      alert("Gagal mengubah role");
    } finally {
      setUpdating(null);
    }
  }

  if (!isSA) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Shield className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-lg font-medium">Akses Ditolak</p>
          <p className="text-sm text-muted-foreground">
            Hanya Super Admin yang dapat mengakses halaman ini
          </p>
        </CardContent>
      </Card>
    );
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-64" />
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-20 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <UserCog className="h-6 w-6 text-primary" />
          Kelola User
        </h1>
        <p className="text-muted-foreground">
          Lihat dan ubah role pengguna sistem
        </p>
      </div>

      {users.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <UserCog className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium">Belum ada user</p>
            <p className="text-sm text-muted-foreground">
              User akan muncul setelah ada yang mendaftar
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {users.map((user) => (
            <Card key={user.id}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-start gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 font-bold text-primary">
                      {user.full_name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="font-semibold">{user.full_name}</h3>
                      <p className="text-sm text-muted-foreground">{user.email}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className="text-xs">
                          NIM: {user.nim}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Select
                      value={user.role}
                      onValueChange={(v) => handleRoleChange(user.id, v as Role)}
                      disabled={updating === user.id}
                    >
                      <SelectTrigger className="w-[160px]">
                        <SelectValue placeholder="Pilih role" />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(ROLE_LABELS).map(([role, label]) => (
                          <SelectItem key={role} value={role}>
                            {label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Badge
                      variant={
                        user.role === "SUPER_ADMIN"
                          ? "destructive"
                          : user.role === "KURIKULUM" || user.role === "SEKRETARIS"
                          ? "default"
                          : "secondary"
                      }
                    >
                      {ROLE_LABELS[user.role]}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
