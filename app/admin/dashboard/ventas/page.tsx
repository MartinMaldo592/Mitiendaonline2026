"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabaseClient"
import { useRoleGuard } from "@/lib/use-role-guard"
import { AccessDenied } from "@/components/admin/access-denied"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { formatCurrency } from "@/lib/utils"
import { ArrowLeft, RefreshCw } from "lucide-react"

export default function DashboardVentasPage() {
    const router = useRouter()
    const [loading, setLoading] = useState(true)

    const guard = useRoleGuard({ allowedRoles: ["admin"] })

    const [initialized, setInitialized] = useState(false)
    const [from, setFrom] = useState<string>(new Date().toISOString().slice(0, 10))
    const [to, setTo] = useState<string>(new Date().toISOString().slice(0, 10))
    const [pedidos, setPedidos] = useState<any[]>([])

    const fetchVentas = useCallback(async () => {
        setLoading(true)

        const fromIso = from ? `${from}T00:00:00.000Z` : undefined
        const toIso = to ? `${to}T23:59:59.999Z` : undefined

        let query = supabase
            .from("pedidos")
            .select(`id, total, status, created_at, clientes (nombre, telefono, dni)`)
            .eq("status", "Entregado")
            .order("created_at", { ascending: false })

        if (fromIso) query = query.gte("created_at", fromIso)
        if (toIso) query = query.lte("created_at", toIso)

        const { data, error } = await query

        if (error) {
            console.error("Error fetching ventas:", error)
            setPedidos([])
        } else {
            setPedidos((data as any[]) || [])
        }

        setLoading(false)
    }, [from, to])

    useEffect(() => {
        if (guard.loading || guard.accessDenied) return
        if (initialized) return

        ;(async () => {
            await fetchVentas()
            setInitialized(true)
        })()
    }, [guard.loading, guard.accessDenied, initialized, fetchVentas])

    const resumen = useMemo(() => {
        const total = pedidos.reduce((sum, p) => sum + (Number(p.total) || 0), 0)
        const count = pedidos.length
        const avg = count > 0 ? total / count : 0
        return { total, count, avg }
    }, [pedidos])

    if (guard.loading) {
        return <div className="p-10">Cargando...</div>
    }

    if (guard.accessDenied) {
        return <AccessDenied message="Solo administradores pueden ver esta sección." />
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-3">
                <Button variant="ghost" size="icon" onClick={() => router.push("/admin/dashboard")}
                >
                    <ArrowLeft className="h-5 w-5" />
                </Button>
                <div className="flex-1">
                    <h1 className="text-3xl font-bold text-gray-900">Ventas (Entregado)</h1>
                    <p className="text-gray-500">Ventas reales: solo pedidos marcados como “Entregado”.</p>
                </div>
                <Button variant="outline" className="gap-2" onClick={fetchVentas} disabled={loading}>
                    <RefreshCw className="h-4 w-4" /> Actualizar
                </Button>
            </div>

            <Card className="shadow-sm border-gray-200">
                <CardHeader>
                    <CardTitle>Rango de fechas</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col md:flex-row gap-3 md:items-end">
                    <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">Desde</p>
                        <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
                    </div>
                    <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">Hasta</p>
                        <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
                    </div>
                    <Button className="md:ml-auto" onClick={fetchVentas} disabled={loading}>Aplicar</Button>
                </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="shadow-sm border-gray-200">
                    <CardContent className="p-5">
                        <p className="text-sm text-muted-foreground">Total vendido</p>
                        <p className="text-2xl font-bold">{formatCurrency(resumen.total)}</p>
                    </CardContent>
                </Card>
                <Card className="shadow-sm border-gray-200">
                    <CardContent className="p-5">
                        <p className="text-sm text-muted-foreground">Cantidad de ventas</p>
                        <p className="text-2xl font-bold">{resumen.count}</p>
                    </CardContent>
                </Card>
                <Card className="shadow-sm border-gray-200">
                    <CardContent className="p-5">
                        <p className="text-sm text-muted-foreground">Ticket promedio</p>
                        <p className="text-2xl font-bold">{formatCurrency(resumen.avg)}</p>
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
                                <TableCell colSpan={5} className="text-center py-10">No hay ventas en ese rango.</TableCell>
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
