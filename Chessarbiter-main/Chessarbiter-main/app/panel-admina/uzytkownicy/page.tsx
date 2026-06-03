import { UserRole } from "@prisma/client";
import { UserRoleActions } from "@/components/admin/user-role-actions";
import { DeleteUserButton } from "@/components/admin/delete-user-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { PageShell } from "@/components/layout/page-shell";
import { requireAdmin } from "@/lib/permissions";
import { prisma } from "@/lib/db/prisma";

export const dynamic = "force-dynamic";

export default async function AdminUsersPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  await requireAdmin();
  const params = await searchParams;
  const q = typeof params.q === "string" ? params.q.trim() : "";
  const role = typeof params.role === "string" ? params.role : "";

  const users = await prisma.user.findMany({
    where: {
      deletedAt: null,
      ...(role ? { role: role as UserRole } : {}),
      ...(q
        ? {
            OR: [
              { email: { contains: q, mode: "insensitive" } },
              { name: { contains: q, mode: "insensitive" } }
            ]
          }
        : {})
    },
    orderBy: [{ role: "asc" }, { createdAt: "desc" }],
    select: { id: true, email: true, name: true, role: true, createdAt: true }
  });

  return (
    <PageShell title="Użytkownicy" description="Nadaj lub odbierz rolę sędziego. Konto administratora jest chronione.">
      <Card>
        <CardHeader>
          <CardTitle>Konta</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="mb-4 grid gap-3 md:grid-cols-[1fr_180px_auto]">
            <Input name="q" placeholder="Szukaj po e-mailu lub nazwie" defaultValue={q} />
            <select name="role" defaultValue={role} className="rounded-md border bg-white px-3 py-2 text-sm">
              <option value="">Wszystkie role</option>
              <option value="ADMIN">Administrator</option>
              <option value="ARBITER">Sędzia</option>
              <option value="PLAYER">Zawodnik</option>
            </select>
            <Button>Szukaj</Button>
          </form>

          <div className="hidden overflow-x-auto md:block">
            <table className="w-full text-left text-sm">
              <thead className="border-b text-slate-500">
                <tr>
                  <th className="py-2 pr-3">Użytkownik</th>
                  <th className="py-2 pr-3">Rola</th>
                  <th className="py-2 pr-3">Utworzono</th>
                  <th className="py-2 pr-3">Akcje</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id} className="border-b last:border-0">
                    <td className="py-3 pr-3">
                      <p className="font-medium">{user.email}</p>
                      <p className="text-slate-500">{user.name ?? "Bez nazwy"}</p>
                    </td>
                    <td className="py-3 pr-3">
                      <RoleBadge role={user.role} />
                    </td>
                    <td className="py-3 pr-3">{new Intl.DateTimeFormat("pl-PL").format(user.createdAt)}</td>
                    <td className="py-3 pr-3 space-y-2">
                      <UserRoleActions userId={user.id} role={user.role} />
                      <DeleteUserButton userId={user.id} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="grid gap-3 md:hidden">
            {users.map((user) => (
              <div key={user.id} className="rounded-lg border p-4">
                <div className="mb-3 flex items-start justify-between gap-3">
                  <div>
                    <p className="font-medium">{user.email}</p>
                    <p className="text-sm text-slate-500">{user.name ?? "Bez nazwy"}</p>
                  </div>
                  <RoleBadge role={user.role} />
                </div>
                <p className="mb-3 text-xs text-slate-500">Utworzono: {new Intl.DateTimeFormat("pl-PL").format(user.createdAt)}</p>
                <div className="space-y-2">
                  <UserRoleActions userId={user.id} role={user.role} />
                  <DeleteUserButton userId={user.id} />
                </div>
              </div>
            ))}
          </div>

          {users.length === 0 ? <p className="rounded-lg border border-dashed p-6 text-center text-slate-600">Nie znaleziono użytkowników.</p> : null}
        </CardContent>
      </Card>
    </PageShell>
  );
}

function RoleBadge({ role }: { role: UserRole }) {
  return <Badge variant={role === "ADMIN" ? "warning" : role === "ARBITER" ? "success" : "muted"}>{roleLabel(role)}</Badge>;
}

function roleLabel(role: string) {
  if (role === "ADMIN") {
    return "Administrator";
  }
  if (role === "ARBITER") {
    return "Sędzia";
  }
  return "Zawodnik";
}
