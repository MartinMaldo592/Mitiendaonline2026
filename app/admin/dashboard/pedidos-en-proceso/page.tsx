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
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
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

const PROCESS_STATUSES = ["Confirmado", "Preparando", "Enviado"] as const

type ProcessStatus = (typeof PROCESS_STATUSES)[number]

type StatusFilter = ProcessStatus | "all"

export default function DashboardPedidosEnProcesoPage() {
    const router = useRouter()
    const [loading, setLoading] = useState(true)

    const guard = useRoleGuard({ allowedRoles: ["admin"] })

    const [statusFilter, setStatusFilter] = useState<StatusFilter>("all")
    const [from, setFrom] = useState<string>(new Date().toISOString().slice(0, 10))
    const [to, setTo] = useState<string>(new Date().toISOString().slice(0, 10))

    const [pedidos, setPedidos] = useState<any[]>([])

    const fetchPedidosEnProceso = useCallback(async (params: { status: StatusFilter; from: string; to: string }) => {
        setLoading(true)

        const fromIso = params.from ? `${params.from}T00:00:00.000Z` : undefined
        const toIso = params.to ? `${params.to}T23:59:59.999Z` : undefined

        let query = supabase
            .from("pedidos")
            .select(`id, total, status, created_at, asignado_a, clientes (nombre, telefono, dni)`)
            .in("status", PROCESS_STATUSES as unknown as string[])
            .order("created_at", { ascending: false })

        if (params.status !== "all") query = query.eq("status", params.status)
        if (fromIso) query = query.gte("created_at", fromIso)
        if (toIso) query = query.lte("created_at", toIso)

        const { data, error } = await query

        if (error) {
            console.error("Error fetching pedidos en proceso:", error)
            setPedidos([])
        } else {
            setPedidos((data as any[]) || [])
        }

        setLoading(false)
    }, [])

    useEffect(() => {
        if (guard.loading || guard.accessDenied) return
        fetchPedidosEnProceso({ status: "all", from, to })
    }, [guard.loading, guard.accessDenied, fetchPedidosEnProceso, from, to])

    const resumen = useMemo(() => {
        const count = pedidos.length
        const total = pedidos.reduce((sum, p) => sum + (Number(p.total) || 0), 0)
        const ticket = count > 0 ? total / count : 0

        const byStatus = new Map<string, number>()
        for (const st of PROCESS_STATUSES) byStatus.set(st, 0)
        for (const p of pedidos) {
            const st = String(p.status || "")
            if (byStatus.has(st)) byStatus.set(st, (byStatus.get(st) || 0) + 1)
        }

        return {
            count,
            total,
            ticket,
            confirmado: byStatus.get("Confirmado") || 0,
            preparando: byStatus.get("Preparando") || 0,
            enviado: byStatus.get("Enviado") || 0,
        }
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
                    <h1 className="text-3xl font-bold text-gray-900">Pedidos en Proceso</h1>
                    <p className="text-gray-500">Confirmado / Preparando / Enviado</p>
                </div>
                <Button
                    variant="outline"
                    className="gap-2"
                    onClick={() => fetchPedidosEnProceso({ status: statusFilter, from, to })}
                    disabled={loading}
                >
                    <RefreshCw className="h-4 w-4" /> Actualizar
                </Button>
            </div>

            <Card className="shadow-sm border-gray-200">
                <CardHeader>
                    <CardTitle>Filtros</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-4 gap-3 md:items-end">
                    <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">Estado</p>
                        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as StatusFilter)}>
                            <SelectTrigger>
                                <SelectValue placeholder="Todos" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Todos</SelectItem>
                                <SelectItem value="Confirmado">Confirmado</SelectItem>
                                <SelectItem value="Preparando">Preparando</SelectItem>
                                <SelectItem value="Enviado">Enviado</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">Desde</p>
                        <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
                    </div>
                    <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">Hasta</p>
                        <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
                    </div>
                    <Button onClick={() => fetchPedidosEnProceso({ status: statusFilter, from, to })} disabled={loading}>
                        Aplicar
                    </Button>
                </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="shadow-sm border-gray-200">
                    <CardContent className="p-5">
                        <p className="text-sm text-muted-foreground">Total</p>
                        <p className="text-2xl font-bold">{resumen.count}</p>
                    </CardContent>
                </Card>
                <Card className="shadow-sm border-gray-200">
                    <CardContent className="p-5">
                        <p className="text-sm text-muted-foreground">Total (S/)</p>
                        <p className="text-2xl font-bold">{formatCurrency(resumen.total)}</p>
                    </CardContent>
                </Card>
                <Card className="shadow-sm border-gray-200">
                    <CardContent className="p-5">
                        <p className="text-sm text-muted-foreground">Ticket promedio</p>
                        <p className="text-2xl font-bold">{formatCurrency(resumen.ticket)}</p>
                    </CardContent>
                </Card>
                <Card className="shadow-sm border-gray-200">
                    <CardContent className="p-5">
                        <p className="text-sm text-muted-foreground">Por estado</p>
                        <p className="text-sm font-semibold text-gray-900">Confirmado: {resumen.confirmado}</p>
                        <p className="text-sm font-semibold text-gray-900">Preparando: {resumen.preparando}</p>
                        <p className="text-sm font-semibold text-gray-900">Enviado: {resumen.enviado}</p>
                    </CardContent>
                </Card>
            </div>

            <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
                <Table>
                    <TableHeader className="bg-gray-50">
                        <TableRow>
                            <TableHead>Pedido</TableHead>
                            <TableHead>Fecha</TableHead>
                            <TableHead>Estado</TableHead>
                            <TableHead>Cliente</TableHead>
                            <TableHead>Total</TableHead>
                            <TableHead className="text-right">Detalle</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center py-10">Cargando...</TableCell>
                            </TableRow>
                        ) : pedidos.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center py-10">No hay pedidos en proceso con estos filtros.</TableCell>
                            </TableRow>
                        ) : (
                            pedidos.map((p) => (
                                <TableRow key={p.id}>
                                    <TableCell className="font-medium">#{String(p.id).padStart(6, "0")}</TableCell>
                                    <TableCell className="text-sm text-muted-foreground">{new Date(p.created_at).toLocaleString()}</TableCell>
                                    <TableCell>
                                        <span className="px-2 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-700">
                                            {p.status}
                                        </span>
                                    </TableCell>
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
