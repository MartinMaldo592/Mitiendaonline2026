
"use client"

import { useCallback, useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { supabase } from "@/lib/supabaseClient"
import { useRoleGuard } from "@/lib/use-role-guard"
import { AccessDenied } from "@/components/admin/access-denied"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { ArrowLeft, MapPin, Phone, User, Calendar, CreditCard, Save, UserCheck } from "lucide-react"
import { formatCurrency } from "@/lib/utils"

export default function PedidoDetallePage() {
    const params = useParams()
    const router = useRouter()
    const id = params.id as string

    const guard = useRoleGuard({ allowedRoles: ["admin", "worker"] })

    const [pedido, setPedido] = useState<any>(null)
    const [items, setItems] = useState<any[]>([])
    const [workers, setWorkers] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [updating, setUpdating] = useState(false)
    const [status, setStatus] = useState("")
    const [assignedTo, setAssignedTo] = useState<string>("unassigned")
    const [userRole, setUserRole] = useState<string>('worker')

    function showPermissionAlertIfNeeded(error: any, fallbackMessage: string) {
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
            return true
        }

        alert(fallbackMessage + msg)
        return false
    }

    const fetchPedido = useCallback(async () => {
        setLoading(true)

        const { data: pedidoData, error } = await supabase
            .from('pedidos')
            .select(`
                *,
                clientes (*)
            `)
            .eq('id', id)
            .single()

        if (error) {
            console.error("Error fetching pedido:", error)
            setLoading(false)
            return
        }

        let asignadoPerfil = null
        if (pedidoData.asignado_a) {
            const { data: workerProfile } = await supabase
                .from('profiles')
                .select('id, email, nombre')
                .eq('id', pedidoData.asignado_a)
                .single()
            asignadoPerfil = workerProfile
        }

        setPedido({ ...pedidoData, asignado_perfil: asignadoPerfil })
        setStatus(pedidoData.status)
        setAssignedTo(pedidoData.asignado_a || "unassigned")

        const { data: itemsData } = await supabase
            .from('pedido_items')
            .select(`
                *,
                productos (nombre, precio, imagen_url)
            `)
            .eq('pedido_id', id)

        if (itemsData) setItems(itemsData)

        setLoading(false)
    }, [id])

    useEffect(() => {
        if (!id) return
        if (guard.loading || guard.accessDenied) return

        const role = String(guard.role || 'worker')
        setUserRole(role)

        ;(async () => {
            if (role === 'admin') {
                const { data: workersData } = await supabase
                    .from('profiles')
                    .select('id, email, nombre')
                    .eq('role', 'worker')
                if (workersData) setWorkers(workersData)
            } else {
                setWorkers([])
            }

            await fetchPedido()
        })()
    }, [id, guard.loading, guard.accessDenied, guard.role, fetchPedido])

    async function handleAssignWorker(workerId: string) {
        const assignValue = workerId === 'unassigned' ? null : workerId

        const { error } = await supabase
            .from('pedidos')
            .update({
                asignado_a: assignValue,
                fecha_asignacion: assignValue ? new Date().toISOString() : null
            })
            .eq('id', id)

        if (!error) {
            setAssignedTo(workerId)
            fetchPedido()
        } else {
            showPermissionAlertIfNeeded(error, 'Error al asignar: ')
        }
    }

    async function handleUpdateStatus() {
        setUpdating(true)
        console.log("Updating status to:", status)

        // Si el admin confirma el pedido, descontamos stock una sola vez.
        // Esto evita descontar cuando el cliente solo "crea" el pedido.
        if (status === 'Confirmado' && !pedido?.stock_descontado) {
            try {
                const { data: itemsData, error: itemsError } = await supabase
                    .from('pedido_items')
                    .select('producto_id, producto_variante_id, cantidad')
                    .eq('pedido_id', id)

                if (itemsError) throw itemsError

                const safeItems = (itemsData || []).filter((it: any) => it.producto_id)

                for (const it of safeItems) {
                    const productoId = Number(it.producto_id)
                    const varianteId = it.producto_variante_id != null ? Number(it.producto_variante_id) : null
                    const qty = Number(it.cantidad || 0)
                    if (!productoId || qty <= 0) continue

                    if (varianteId) {
                        const { data: variante, error: varError } = await supabase
                            .from('producto_variantes')
                            .select('stock')
                            .eq('id', varianteId)
                            .single()

                        if (varError) throw varError

                        const currentStock = Number((variante as any)?.stock ?? 0)
                        const newStock = Math.max(0, currentStock - qty)

                        const { error: updError } = await supabase
                            .from('producto_variantes')
                            .update({ stock: newStock })
                            .eq('id', varianteId)

                        if (updError) throw updError
                    } else {
                        const { data: producto, error: prodError } = await supabase
                            .from('productos')
                            .select('stock')
                            .eq('id', productoId)
                            .single()

                        if (prodError) throw prodError

                        const currentStock = Number((producto as any)?.stock ?? 0)
                        const newStock = Math.max(0, currentStock - qty)

                        const { error: updError } = await supabase
                            .from('productos')
                            .update({ stock: newStock })
                            .eq('id', productoId)

                        if (updError) throw updError
                    }
                }

                const { error: markError } = await supabase
                    .from('pedidos')
                    .update({ stock_descontado: true })
                    .eq('id', id)

                if (markError) throw markError
            } catch (err: any) {
                console.error('Error descontando stock:', err)
                const showed = showPermissionAlertIfNeeded(err, 'No se pudo descontar el stock. Verifica el inventario y vuelve a intentar.\n')
                if (!showed && !String(err?.message || '')) {
                    alert('No se pudo descontar el stock. Verifica el inventario y vuelve a intentar.')
                }
                setUpdating(false)
                return
            }
        }

        const { error } = await supabase
            .from('pedidos')
            .update({ status: status })
            .eq('id', id)

        if (!error) {
            alert("Estado actualizado correctamente")
            fetchPedido() // Refresh
        } else {
            console.error("Error updating status:", error)
            showPermissionAlertIfNeeded(error, 'Error al actualizar: ')
        }
        setUpdating(false)
    }

    if (guard.loading) return <div className="p-10">Cargando...</div>
    if (guard.accessDenied) return <AccessDenied />

    if (loading) return <div className="p-10 text-center">Cargando pedido...</div>
    if (!pedido) return <div className="p-10 text-center">Pedido no encontrado</div>

    return (
        <div className="space-y-6 max-w-5xl mx-auto">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => router.back()}>
                    <ArrowLeft className="h-5 w-5" />
                </Button>
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        Pedido #{pedido.id.toString().padStart(6, '0')}
                        <StatusBadge status={pedido.status} />
                    </h1>
                    <p className="text-gray-500 text-sm">
                        Realizado el {new Date(pedido.created_at).toLocaleString()}
                    </p>
                </div>
                <div className="ml-auto flex gap-2 items-center">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => router.push(`/admin/pedidos/${id}/ticket`)}
                    >
                        Descargar ticket
                    </Button>

                    <div className="flex gap-2 items-center bg-white p-2 rounded-lg border shadow-sm">
                    <span className="text-sm font-medium">Estado:</span>
                    <Select value={status} onValueChange={setStatus}>
                        <SelectTrigger className="w-[180px]">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="Pendiente">Pendiente</SelectItem>
                            <SelectItem value="Confirmado">Confirmado</SelectItem>
                            <SelectItem value="Preparando">Preparando</SelectItem>
                            <SelectItem value="Enviado">Enviado</SelectItem>
                            <SelectItem value="Entregado">Entregado</SelectItem>
                            <SelectItem value="Fallido">Fallido / Cancelado</SelectItem>
                        </SelectContent>
                    </Select>
                    <Button size="sm" onClick={handleUpdateStatus} disabled={updating || status === pedido.status}>
                        <Save className="h-4 w-4 mr-2" />
                        Guardar
                    </Button>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

                {/* Left Column: Items */}
                <div className="md:col-span-2 space-y-6">
                    <div className="bg-white rounded-xl shadow-sm border p-6">
                        <h2 className="font-semibold text-lg mb-4 flex items-center gap-2">
                            <ShoppingBagIcon className="h-5 w-5" /> Productos
                        </h2>
                        <div className="space-y-4">
                            {items.map((item) => (
                                <div key={item.id} className="flex gap-4 items-center border-b pb-4 last:border-0 last:pb-0">
                                    <div className="h-16 w-16 bg-gray-100 rounded-md overflow-hidden flex-shrink-0">
                                        {item.productos?.imagen_url ? (
                                            <img src={item.productos.imagen_url} className="h-full w-full object-cover" />
                                        ) : (
                                            <div className="h-full w-full flex items-center justify-center text-gray-400 text-xs">Sin img</div>
                                        )}
                                    </div>
                                    <div className="flex-1">
                                        <p className="font-medium">{item.productos?.nombre || 'Producto eliminado'}</p>
                                        <p className="text-sm text-gray-500">Cantidad: {item.cantidad}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-medium">{formatCurrency((item.productos?.precio || 0) * (item.cantidad || 0))}</p>
                                        <p className="text-xs text-gray-400">{formatCurrency(item.productos?.precio || 0)} c/u</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="mt-6 pt-4 border-t flex justify-between items-center text-lg font-bold">
                            <span>Total</span>
                            <span>{formatCurrency(pedido.total)}</span>
                        </div>
                    </div>
                </div>

                {/* Right Column: Customer Info */}
                <div className="space-y-6">
                    <div className="bg-white rounded-xl shadow-sm border p-6 space-y-4">
                        <h2 className="font-semibold text-lg mb-2 flex items-center gap-2">
                            <User className="h-5 w-5" /> Cliente
                        </h2>
                        <div className="space-y-3">
                            <div>
                                <p className="text-sm text-gray-500">Nombre</p>
                                <p className="font-medium">{pedido.clientes?.nombre}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">DNI</p>
                                <p className="font-medium">{pedido.clientes?.dni || '—'}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Teléfono</p>
                                <div className="flex items-center gap-2">
                                    <Phone className="h-4 w-4 text-gray-400" />
                                    <a href={`tel:${pedido.clientes?.telefono}`} className="font-medium text-blue-600 hover:underline">
                                        {pedido.clientes?.telefono}
                                    </a>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm border p-6 space-y-4">
                        <h2 className="font-semibold text-lg mb-2 flex items-center gap-2">
                            <MapPin className="h-5 w-5" /> Envío
                        </h2>
                        <div>
                            <p className="text-sm text-gray-500">Dirección</p>
                            <p className="font-medium text-sm mt-1">{pedido.clientes?.direccion}</p>
                        </div>
                        <Button variant="outline" className="w-full text-xs" onClick={() => window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(pedido.clientes?.direccion)}`, '_blank')}>
                            Ver en Google Maps
                        </Button>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm border p-6 space-y-4">
                        <h2 className="font-semibold text-lg mb-2 flex items-center gap-2">
                            <CreditCard className="h-5 w-5" /> Pago
                        </h2>
                        <Badge variant="secondary" className="text-sm py-1 px-3 w-full justify-center">
                            {pedido.pago_status}
                        </Badge>
                    </div>

                    {/* Worker Assignment - Admin Only */}
                    {userRole === 'admin' && (
                        <div className="bg-white rounded-xl shadow-sm border p-6 space-y-4">
                            <h2 className="font-semibold text-lg mb-2 flex items-center gap-2">
                                <UserCheck className="h-5 w-5" /> Asignación
                            </h2>
                            <div>
                                <p className="text-sm text-gray-500 mb-2">Trabajador asignado</p>
                                <Select value={assignedTo} onValueChange={handleAssignWorker}>
                                    <SelectTrigger>
                                        <SelectValue>
                                            {pedido.asignado_perfil?.nombre || pedido.asignado_perfil?.email || (
                                                <span className="text-orange-600">Sin asignar</span>
                                            )}
                                        </SelectValue>
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="unassigned">
                                            <span className="text-gray-500">Sin asignar</span>
                                        </SelectItem>
                                        {workers.map(w => (
                                            <SelectItem key={w.id} value={w.id}>
                                                {w.nombre || w.email}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            {pedido.fecha_asignacion && (
                                <p className="text-xs text-gray-400">
                                    Asignado el {new Date(pedido.fecha_asignacion).toLocaleString()}
                                </p>
                            )}
                        </div>
                    )}

                    {/* Show assigned worker for workers (read-only) */}
                    {userRole === 'worker' && pedido.asignado_perfil && (
                        <div className="bg-blue-50 rounded-xl border border-blue-200 p-4">
                            <p className="text-xs text-blue-600 font-medium">Este pedido te fue asignado</p>
                            {pedido.fecha_asignacion && (
                                <p className="text-xs text-blue-500 mt-1">
                                    {new Date(pedido.fecha_asignacion).toLocaleString()}
                                </p>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

function StatusBadge({ status }: { status: string }) {
    const styles: any = {
        'Pendiente': 'bg-yellow-100 text-yellow-800 border-yellow-200',
        'Confirmado': 'bg-blue-100 text-blue-800 border-blue-200',
        'Entregado': 'bg-green-100 text-green-800 border-green-200',
        'Cancelado': 'bg-red-100 text-red-800 border-red-200',
    }
    return (
        <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${styles[status] || 'bg-gray-100'}`}>
            {status}
        </span>
    )
}

function ShoppingBagIcon({ className }: any) {
    return <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" /><path d="M3 6h18" /><path d="M16 10a4 4 0 0 1-8 0" /></svg>
}
