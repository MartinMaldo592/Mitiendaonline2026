"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabaseClient"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { ArrowLeft, RefreshCw } from "lucide-react"
import { formatCurrency } from "@/lib/utils"

export default function DashboardPedidosPendientesPage() {
    const router = useRouter()
    const [loading, setLoading] = useState(true)
    const [accessDenied, setAccessDenied] = useState(false)
    const [pedidos, setPedidos] = useState<any[]>([])

    useEffect(() => {
        checkAccessAndFetch()
    }, [])

    async function checkAccessAndFetch() {
        setLoading(true)
        const { data: { session } } = await supabase.auth.getSession()
        if (!session) {
            router.push("/auth/login")
            return
        }

        const { data: profile } = await supabase
            .from("profiles")
            .select("role")
            .eq("id", session.user.id)
            .single()

        const role = profile?.role || "worker"
        if (role !== "admin") {
            setAccessDenied(true)
            setLoading(false)
            return
        }

        await fetchPendientes()
    }

    async function fetchPendientes() {
        setLoading(true)

        const { data, error } = await supabase
            .from("pedidos")
            .select(`id, total, status, created_at, clientes (nombre, telefono, dni)`)
            .eq("status", "Pendiente")
            .order("created_at", { ascending: false })

        if (error) {
            console.error("Error fetching pendientes:", error)
            setPedidos([])
        } else {
            setPedidos((data as any[]) || [])
        }

        setLoading(false)
    }

    const resumen = useMemo(() => {
        const count = pedidos.length
        const total = pedidos.reduce((sum, p) => sum + (Number(p.total) || 0), 0)
        return { count, total }
    }, [pedidos])

    if (accessDenied) {
        return (
            <div className="space-y-4">
                <div className="flex items-center gap-3">
                    <Button variant="ghost" size="icon" onClick={() => router.push("/admin/dashboard")}
                    >
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold">Acceso restringido</h1>
                        <p className="text-sm text-muted-foreground">Solo administradores pueden ver esta sección.</p>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-3">
                <Button variant="ghost" size="icon" onClick={() => router.push("/admin/dashboard")}
                >
                    <ArrowLeft className="h-5 w-5" />
                </Button>
                <div className="flex-1">
                    <h1 className="text-3xl font-bold text-gray-900">Pedidos Pendientes</h1>
                    <p className="text-gray-500">Pedidos que aún no han sido confirmados.</p>
                </div>
                <Button variant="outline" className="gap-2" onClick={fetchPendientes} disabled={loading}>
                    <RefreshCw className="h-4 w-4" /> Actualizar
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="shadow-sm border-gray-200">
                    <CardContent className="p-5">
                        <p className="text-sm text-muted-foreground">Cantidad</p>
                        <p className="text-2xl font-bold">{resumen.count}</p>
                    </CardContent>
                </Card>
                <Card className="shadow-sm border-gray-200">
                    <CardContent className="p-5">
                        <p className="text-sm text-muted-foreground">Total en pendientes</p>
                        <p className="text-2xl font-bold">{formatCurrency(resumen.total)}</p>
                    </CardContent>
                </Card>
            </div>

            <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
                <Table>
                    <TableHeader className="bg-gray-50">
                        <TableRow>
                            <TableHead>Pedido</TableHead>
                            <TableHead>Fecha</TableHead>
                            <TableHead>Cliente</TableHead>
                            <TableHead>Total</TableHead>
                            <TableHead className="text-right">Detalle</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center py-10">Cargando...</TableCell>
                            </TableRow>
                        ) : pedidos.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center py-10">No hay pedidos pendientes.</TableCell>
                            </TableRow>
                        ) : (
                            pedidos.map((p) => (
                                <TableRow key={p.id}>
                                    <TableCell className="font-medium">#{String(p.id).padStart(6, "0")}</TableCell>
                                    <TableCell className="text-sm text-muted-foreground">{new Date(p.created_at).toLocaleString()}</TableCell>
                                    <TableCell>
                                        <div className="text-sm">
                                            <p className="font-medium">{p.clientes?.nombre || "—"}</p>
                                            <p className="text-muted-foreground">{p.clientes?.telefono || ""}</p>
                                            <p className="text-muted-foreground">DNI: {p.clientes?.dni || "—"}</p>
                                        </div>
                                    </TableCell>
                                    <TableCell className="font-semibold">{formatCurrency(p.total)}</TableCell>
                                    <TableCell className="text-right">
                                        <Link href={`/admin/pedidos/${p.id}`} className="text-sm font-medium text-primary hover:underline">
                                            Ver
                                        </Link>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    )
}
