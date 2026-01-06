"use client"

import { useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import { supabase } from "@/lib/supabaseClient"
import { AdminSidebar } from "@/components/admin/sidebar"
import { Loader2 } from "lucide-react"

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const router = useRouter()
    const pathname = usePathname()
    const [loading, setLoading] = useState(true)
    const [userRole, setUserRole] = useState<string | null>(null)
    const isTicketRoute = pathname?.includes('/admin/pedidos/') && pathname?.endsWith('/ticket')

    function isInvalidRefreshTokenError(err: unknown) {
        const msg = String((err as any)?.message || '')
        return (
            msg.toLowerCase().includes('invalid refresh token') ||
            msg.toLowerCase().includes('refresh token not found')
        )
    }

    useEffect(() => {
        checkAuth()
    }, [pathname])

    async function checkAuth() {
        let session: any = null
        try {
            const res = await supabase.auth.getSession()
            session = res?.data?.session ?? null
            const err = (res as any)?.error
            if (err) throw err
        } catch (err) {
            console.error('Error verificando sesión:', err)
            if (isInvalidRefreshTokenError(err)) {
                try {
                    await supabase.auth.signOut()
                } catch (e) {
                }
                alert('Tu sesión expiró o se dañó. Inicia sesión nuevamente.')
                router.replace('/auth/login')
                return
            }
            alert('No se pudo verificar tu sesión. Intenta nuevamente.')
            router.replace('/auth/login')
            return
        }

        if (!session) {
            router.push("/auth/login")
            return
        }

        const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', session.user.id)
            .single()

        if (profile) {
            setUserRole(profile.role)
        } else {
            setUserRole('worker')
        }

        setLoading(false)
    }

    if (loading) {
        return (
            <div className="h-screen w-full flex items-center justify-center bg-background">
                <div className="flex flex-col items-center gap-2">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <p className="text-sm text-muted-foreground">Verificando acceso...</p>
                </div>
            </div>
        )
    }

    if (isTicketRoute) {
        return <>{children}</>
    }

    return (
        <div className="flex h-screen bg-background">
            <AdminSidebar role={userRole || 'worker'} />
            <main className="flex-1 overflow-y-auto p-8 ml-64">
                <div className="max-w-7xl mx-auto">
                    {children}
                </div>
            </main>
        </div>
    )
}
