"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabaseClient"
import { LayoutDashboard, ShoppingBag, Package, Users, AlertCircle, LogOut, Percent } from "lucide-react"

interface AdminSidebarProps {
    role: string
}

export function AdminSidebar({ role }: AdminSidebarProps) {
    const router = useRouter()

    const handleLogout = async () => {
        await supabase.auth.signOut()
        router.push("/auth/login")
    }

    // Define menu items with role restrictions
    const menuItems = [
        { href: "/admin/dashboard", icon: LayoutDashboard, label: "Dashboard", roles: ["admin", "worker"] },
        { href: "/admin/pedidos", icon: ShoppingBag, label: "Pedidos", roles: ["admin", "worker"] },
        { href: "/admin/productos", icon: Package, label: "Productos", roles: ["admin"] }, // Solo admin
        { href: "/admin/clientes", icon: Users, label: "Clientes", roles: ["admin"] }, // Solo admin
        { href: "/admin/cupones", icon: Percent, label: "Cupones", roles: ["admin"] },
        { href: "/admin/usuarios", icon: Users, label: "Usuarios", roles: ["admin"] },
        { href: "/admin/incidencias", icon: AlertCircle, label: "Incidencias", roles: ["admin", "worker"] },
    ]

    // Filter menu items based on user role
    const visibleMenuItems = menuItems.filter(item => item.roles.includes(role))

    return (
        <div className="w-64 bg-sidebar min-h-screen text-sidebar-foreground flex flex-col fixed left-0 top-0">
            <div className="p-6 border-b border-border">
                <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
                    CRM Pro
                </h2>
                <p className="text-xs text-muted-foreground mt-1">
                    {role === 'admin' ? 'Panel de Administración' : 'Panel de Trabajador'}
                </p>
            </div>

            <nav className="flex-1 p-4 space-y-2">
                {visibleMenuItems.map((item) => (
                    <Link
                        key={item.href}
                        href={item.href}
                        className="flex items-center gap-3 px-4 py-3 text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground rounded-xl transition-all"
                    >
                        <item.icon className="h-5 w-5" />
                        <span>{item.label}</span>
                    </Link>
                ))}
            </nav>

            {/* Role Badge */}
            <div className="px-4 pb-2">
                <div className={`px-3 py-2 rounded-lg text-xs font-medium text-center ${role === 'admin'
                        ? 'bg-accent/10 text-accent-foreground border border-border'
                        : 'bg-accent/10 text-accent-foreground border border-border'
                    }`}>
                    {role === 'admin' ? '👑 Administrador' : '👤 Trabajador'}
                </div>
            </div>

            <div className="p-4 border-t border-border">
                <button
                    onClick={handleLogout}
                    className="flex items-center gap-3 px-4 py-3 w-full text-destructive hover:bg-destructive/10 rounded-xl transition-all"
                >
                    <LogOut className="h-5 w-5" />
                    <span>Cerrar Sesión</span>
                </button>
            </div>
        </div>
    )
}
