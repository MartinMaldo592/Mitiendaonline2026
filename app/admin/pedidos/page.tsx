"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabaseClient"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { formatCurrency } from "@/lib/utils"
import { Eye, Search, Filter, UserPlus, RefreshCw, User } from "lucide-react"
import Link from "next/link"

interface PedidosPageProps {
    userRole?: string
    userId?: string
}

export default function PedidosPage() {
    const [pedidos, setPedidos] = useState<any[]>([])
    const [workers, setWorkers] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [userRole, setUserRole] = useState<string>('worker')
    const [userId, setUserId] = useState<string>('')
    const [filterWorker, setFilterWorker] = useState<string>('all')

    function csvEscape(value: unknown) {
        const str = String(value ?? '')
        if (/[\n\r,\"]/g.test(str)) {
            return '"' + str.replace(/\"/g, '""') + '"'
        }
        return str
    }

    function downloadCsv(rows: Record<string, unknown>[], filename: string) {
        const headers = rows.length > 0 ? Object.keys(rows[0]) : []
        const csv =
            '\ufeff' +
            [
                headers.join(','),
                ...rows.map((row) => headers.map((h) => csvEscape(row[h])).join(',')),
            ].join('\n')

        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = filename
        document.body.appendChild(a)
        a.click()
        a.remove()
        URL.revokeObjectURL(url)
    }

    function handleExportCsv() {
        const rows = filteredPedidos.map((p) => ({
            id: p.id,
            fecha: p.created_at,
            cliente: p.clientes?.nombre || '',
            telefono: p.clientes?.telefono || '',
            dni: p.clientes?.dni || '',
            total: p.total,
            status: p.status,
            pago_status: p.pago_status,
            cupon_codigo: p.cupon_codigo || '',
            descuento: p.descuento ?? '',
            subtotal: p.subtotal ?? '',
            asignado_a: p.asignado_a || '',
        }))

        const today = new Date().toISOString().slice(0, 10)
        downloadCsv(rows, `pedidos-${today}.csv`)
    }

    useEffect(() => {
        initPage()
    }, [])

    async function initPage() {
        // Get current user and role
        const { data: { session } } = await supabase.auth.getSession()
        if (!session) return

        setUserId(session.user.id)

        const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', session.user.id)
            .single()

        const role = profile?.role || 'worker'
        setUserRole(role)

        // Fetch workers list (for admin filter/assignment)
        if (role === 'admin') {
            const { data: workersData } = await supabase
                .from('profiles')
                .select('id, email, nombre, role')
                .eq('role', 'worker')
            if (workersData) setWorkers(workersData)
        }

        await fetchPedidos(role, session.user.id)
    }

    async function fetchPedidos(role: string, currentUserId: string) {
        setLoading(true)

        try {
            // Base query - without the foreign key join that may not exist yet
            let query = supabase
                .from('pedidos')
                .select(`
                    *,
                    clientes (nombre, telefono, dni)
                `)
                .order('created_at', { ascending: false })

            // Workers only see orders assigned to them
            if (role === 'worker') {
                query = query.eq('asignado_a', currentUserId)
            }

            const { data, error } = await query

            if (error) {
                console.error("Error fetching pedidos:", error)
                // If asignado_a column doesn't exist, try without it
                if (error.message.includes('asignado_a')) {
                    const { data: fallbackData } = await supabase
                        .from('pedidos')
                        .select(`*, clientes (nombre, telefono, dni)`)
                        .order('created_at', { ascending: false })
                    if (fallbackData) setPedidos(fallbackData)
                }
            } else if (data) {
                // Fetch worker profiles separately if delegation is enabled
                const pedidosWithWorkers = await Promise.all(data.map(async (pedido) => {
                    if (pedido.asignado_a) {
                        const { data: workerProfile } = await supabase
                            .from('profiles')
                            .select('id, email, nombre')
                            .eq('id', pedido.asignado_a)
                            .single()
                        return { ...pedido, asignado_perfil: workerProfile }
                    }
                    return { ...pedido, asignado_perfil: null }
                }))
                setPedidos(pedidosWithWorkers)
            }
        } catch (err) {
            console.error("Error in fetchPedidos:", err)
        }

        setLoading(false)
    }

    async function handleAssignWorker(pedidoId: number, workerId: string) {
        const assignValue = workerId === 'unassigned' ? null : workerId

        const { error } = await supabase
            .from('pedidos')
            .update({
                asignado_a: assignValue,
                fecha_asignacion: assignValue ? new Date().toISOString() : null
            })
            .eq('id', pedidoId)

        if (!error) {
            // Refresh list
            fetchPedidos(userRole, userId)
        } else {
            const code = String((error as any)?.code || '')
            const msg = String((error as any)?.message || '')
            const lower = msg.toLowerCase()
            if (
                code === '42501' ||
                lower.includes('permission denied') ||
                lower.includes('row level security') ||
                lower.includes('violates row-level security')
            ) {
                alert('No tienes permisos para realizar esta acción.')
            } else {
                alert('Error al asignar: ' + msg)
            }
        }
    }

    // Filter pedidos for admin view
    const filteredPedidos = userRole === 'admin' && filterWorker !== 'all'
        ? pedidos.filter(p => {
            if (filterWorker === 'unassigned') return !p.asignado_a
            return p.asignado_a === filterWorker
        })
        : pedidos

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">
                        {userRole === 'admin' ? 'Gestión de Pedidos' : 'Mis Pedidos Asignados'}
                    </h1>
                    <p className="text-gray-500">
                        {userRole === 'admin'
                            ? 'Administra y delega órdenes a tu equipo.'
                            : 'Pedidos que te han sido delegados.'}
                    </p>
                </div>
                <div className="flex gap-2">
                    {userRole === 'admin' && (
                        <Button variant="outline" className="gap-2" onClick={handleExportCsv}>
                            Exportar CSV
                        </Button>
                    )}
                    <Button variant="outline" className="gap-2" onClick={() => fetchPedidos(userRole, userId)}>
                        <RefreshCw className="h-4 w-4" /> Actualizar
                    </Button>
                </div>
            </div>

            {/* Admin Filters */}
            {userRole === 'admin' && (
                <div className="flex gap-4 bg-white p-4 rounded-xl shadow-sm border">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                        <Input placeholder="Buscar por cliente, ID o teléfono..." className="pl-9 border-gray-200" />
                    </div>
                    <Select value={filterWorker} onValueChange={setFilterWorker}>
                        <SelectTrigger className="w-[200px]">
                            <SelectValue placeholder="Filtrar por trabajador" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Todos los pedidos</SelectItem>
                            <SelectItem value="unassigned">Sin asignar</SelectItem>
                            {workers.map(w => (
                                <SelectItem key={w.id} value={w.id}>
                                    {w.nombre || w.email}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            )}

            {/* Empty State for Workers */}
            {userRole === 'worker' && pedidos.length === 0 && !loading && (
                <div className="bg-white rounded-xl shadow-sm border p-12 text-center">
                    <div className="h-16 w-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <User className="h-8 w-8 text-gray-400" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">Sin pedidos asignados</h3>
                    <p className="text-gray-500 max-w-md mx-auto">
                        Aún no tienes pedidos delegados. El administrador te asignará pedidos cuando sea necesario.
                    </p>
                </div>
            )}

            {/* Table */}
            {(userRole === 'admin' || pedidos.length > 0) && (
                <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
                    <Table>
                        <TableHeader className="bg-gray-50">
                            <TableRow>
                                <TableHead className="w-[100px]">ID</TableHead>
                                <TableHead>Cliente</TableHead>
                                <TableHead>Fecha</TableHead>
                                <TableHead>Total</TableHead>
                                <TableHead>Estado</TableHead>
                                {userRole === 'admin' && <TableHead>Asignado a</TableHead>}
                                <TableHead className="text-right">Acciones</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={userRole === 'admin' ? 7 : 6} className="text-center py-10">
                                        Cargando pedidos...
                                    </TableCell>
                                </TableRow>
                            ) : filteredPedidos.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={userRole === 'admin' ? 7 : 6} className="text-center py-10">
                                        No hay pedidos {filterWorker !== 'all' ? 'con este filtro' : ''}.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredPedidos.map((pedido) => (
                                    <TableRow key={pedido.id}>
                                        <TableCell className="font-mono font-medium">#{pedido.id.toString().padStart(6, '0')}</TableCell>
                                        <TableCell>
                                            <div className="font-medium">{pedido.clientes?.nombre || 'Anónimo'}</div>
                                            <div className="text-xs text-gray-500">{pedido.clientes?.telefono}</div>
                                            <div className="text-xs text-gray-500">DNI: {pedido.clientes?.dni || '—'}</div>
                                        </TableCell>
                                        <TableCell>{new Date(pedido.created_at).toLocaleDateString()}</TableCell>
                                        <TableCell className="font-bold">{formatCurrency(pedido.total)}</TableCell>
                                        <TableCell>
                                            <StatusBadge status={pedido.status} />
                                        </TableCell>
                                        {userRole === 'admin' && (
                                            <TableCell>
                                                <Select
                                                    value={pedido.asignado_a || 'unassigned'}
                                                    onValueChange={(val) => handleAssignWorker(pedido.id, val)}
                                                >
                                                    <SelectTrigger className="w-[160px] h-8 text-xs">
                                                        <SelectValue>
                                                            {pedido.asignado_perfil?.nombre || pedido.asignado_perfil?.email || (
                                                                <span className="text-orange-600 flex items-center gap-1">
                                                                    <UserPlus className="h-3 w-3" /> Sin asignar
                                                                </span>
                                                            )}
                                                        </SelectValue>
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="unassigned">
                                                            <span className="text-gray-500">Sin asignar</span>
                                                        </SelectItem>
                                                        {workers.map((w) => (
                                                            <SelectItem key={w.id} value={w.id}>
                                                                {w.nombre || w.email}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </TableCell>
                                        )}
                                        <TableCell className="text-right">
                                            <Link href={`/admin/pedidos/${pedido.id}`}>
                                                <Button variant="ghost" size="icon">
                                                    <Eye className="h-4 w-4 text-gray-500" />
                                                </Button>
                                            </Link>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>
            )}
        </div>
    )
}

function StatusBadge({ status }: { status: string }) {
    const styles: any = {
        'Pendiente': 'bg-yellow-100 text-yellow-800 border-yellow-200',
        'Confirmado': 'bg-blue-100 text-blue-800 border-blue-200',
        'Preparando': 'bg-purple-100 text-purple-800 border-purple-200',
        'Enviado': 'bg-indigo-100 text-indigo-800 border-indigo-200',
        'Entregado': 'bg-green-100 text-green-800 border-green-200',
        'Fallido': 'bg-red-100 text-red-800 border-red-200',
    }
    return (
        <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${styles[status] || 'bg-gray-100'}`}>
            {status}
        </span>
    )
}
