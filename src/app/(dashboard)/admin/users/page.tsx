import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { format } from "date-fns"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { ShieldIcon, UserIcon, EyeIcon } from "lucide-react"

const roleConfig: Record<string, { label: string; className: string; Icon: React.ComponentType<{ className?: string }> }> = {
  ADMIN: {
    label: "Admin",
    className: "bg-red-100 text-red-800 border-red-200",
    Icon: ShieldIcon,
  },
  PM: {
    label: "PM",
    className: "bg-blue-100 text-blue-800 border-blue-200",
    Icon: UserIcon,
  },
  VIEWER: {
    label: "Viewer",
    className: "bg-gray-100 text-gray-700 border-gray-200",
    Icon: EyeIcon,
  },
}

export default async function AdminUsersPage() {
  const session = await auth()
  const user = session?.user as { role?: string } | undefined

  if (user?.role !== "ADMIN") {
    redirect("/")
  }

  const users = await prisma.user.findMany({
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
    },
  })

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Users</h1>
        <p className="text-muted-foreground text-sm mt-1">
          {users.length} user{users.length !== 1 ? "s" : ""}
        </p>
      </div>

      <div className="rounded-xl border border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Joined</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((u) => {
              const initials = u.name
                ? u.name
                    .split(" ")
                    .map((n: string) => n[0])
                    .join("")
                    .toUpperCase()
                    .slice(0, 2)
                : (u.email?.[0] ?? "?").toUpperCase()

              const roleInfo = roleConfig[u.role] ?? roleConfig.VIEWER
              const { Icon } = roleInfo

              return (
                <TableRow key={u.id}>
                  <TableCell>
                    <div className="flex items-center gap-2.5">
                      <Avatar size="sm">
                        <AvatarFallback>{initials}</AvatarFallback>
                      </Avatar>
                      <span className="font-medium text-sm">
                        {u.name ?? "—"}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {u.email}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={roleInfo.className}>
                      <Icon className="size-3" />
                      {roleInfo.label}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                    {format(new Date(u.createdAt), "MMM d, yyyy")}
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
