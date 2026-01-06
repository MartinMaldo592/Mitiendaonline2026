"use client"

import { usePathname } from "next/navigation"
import { useRoleGuard } from "@/lib/use-role-guard"
import { AccessDenied } from "@/components/admin/access-denied"
import { AdminSidebar } from "@/components/admin/sidebar"
import { Loader2 } from "lucide-react"

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const pathname = usePathname()
    const guard = useRoleGuard({ allowedRoles: ["admin", "worker"] })
    const isTicketRoute = pathname?.includes('/admin/pedidos/') && pathname?.endsWith('/ticket')

    if (guard.loading) {
        return (
            <div className="h-screen w-full flex items-center justify-center bg-background">
                <div className="flex flex-col items-center gap-2">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <p className="text-sm text-muted-foreground">Verificando acceso...</p>
                </div>
            </div>
        )
    }

    if (guard.accessDenied) {
        return <AccessDenied />
    }

    if (isTicketRoute) {
        return <>{children}</>
    }

    return (
        <div className="flex h-screen bg-background">
            <AdminSidebar role={guard.role || 'worker'} />
            <main className="flex-1 overflow-y-auto p-8 ml-64">
                <div className="max-w-7xl mx-auto">
                    {children}
                </div>
            </main>
        </div>
    )
}
