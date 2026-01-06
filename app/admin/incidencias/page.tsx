
"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { supabase } from "@/lib/supabaseClient"
import { useRoleGuard } from "@/lib/use-role-guard"
import { AccessDenied } from "@/components/admin/access-denied"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
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
import { AlertTriangle, RefreshCw, Trash2, UploadCloud, X } from "lucide-react"

const TIPOS = [
    "Devolución",
    "Queja",
    "Producto dañado",
    "Entrega tardía",
    "Otro",
] as const

type Tipo = (typeof TIPOS)[number]

type TipoFilter = Tipo | "all"

export default function IncidenciasPage() {
    const [loading, setLoading] = useState(true)
    const [creating, setCreating] = useState(false)
    const [uploading, setUploading] = useState(false)

    const guard = useRoleGuard({ allowedRoles: ["admin", "worker"] })

    const [userRole, setUserRole] = useState<string>("worker")

    const [pedidoId, setPedidoId] = useState<string>("")
    const [tipo, setTipo] = useState<Tipo>("Queja")
    const [comentario, setComentario] = useState("")
    const [fotos, setFotos] = useState<string[]>([])

    const [filterPedido, setFilterPedido] = useState("")
    const [filterTipo, setFilterTipo] = useState<TipoFilter>("all")

    const [incidencias, setIncidencias] = useState<any[]>([])
    const [pedidos, setPedidos] = useState<any[]>([])

    const fetchPedidos = useCallback(async () => {
        const { data, error } = await supabase
            .from('pedidos')
            .select('id, status, created_at, clientes (nombre, telefono)')
            .order('created_at', { ascending: false })
            .limit(200)

        if (error) {
            console.error('Error fetching pedidos:', error)
            setPedidos([])
        } else {
            setPedidos((data as any[]) || [])
        }
    }, [])

    const fetchIncidencias = useCallback(async () => {
        const { data, error } = await supabase
            .from("incidencias")
            .select(`*, pedidos (id, status, created_at, clientes (nombre, telefono))`)
            .order("created_at", { ascending: false })

        if (error) {
            console.error("Error fetching incidencias:", error)
            setIncidencias([])
        } else {
            setIncidencias((data as any[]) || [])
        }
    }, [])

    const refreshAll = useCallback(async () => {
        setLoading(true)
        await fetchPedidos()
        await fetchIncidencias()
        setLoading(false)
    }, [fetchIncidencias, fetchPedidos])

    useEffect(() => {
        if (guard.loading || guard.accessDenied) return
        setUserRole(String(guard.role || 'worker'))
        refreshAll()
    }, [guard.loading, guard.accessDenied, guard.role, refreshAll])

    const filtered = useMemo(() => {
        const pid = filterPedido.trim()
        return incidencias.filter((i) => {
            const matchesPedido = !pid || String(i.pedido_id || "").includes(pid)
            const matchesTipo = filterTipo === "all" || String(i.tipo || "") === filterTipo
            return matchesPedido && matchesTipo
        })
    }, [incidencias, filterPedido, filterTipo])

    async function handleCreate() {
        const pid = String(pedidoId || '').trim()
        if (!pid) {
            alert('Selecciona un pedido')
            return
        }
        if (!comentario.trim()) {
            alert("Ingresa un comentario")
            return
        }

        setCreating(true)
        try {
            const normalizedFotos = (fotos || []).map((x) => String(x || '').trim()).filter(Boolean).slice(0, 5)
            const mainFoto = normalizedFotos[0] || null

            const payload: any = {
                pedido_id: Number(pid),
                tipo,
                comentario: comentario.trim(),
                foto: mainFoto,
                fotos: normalizedFotos,
            }

            async function save(withFotos: boolean) {
                const p: any = { ...payload }
                if (!withFotos) delete p.fotos
                return supabase.from('incidencias').insert(p)
            }

            const first = await save(true)
            let error = first.error
            if (error && typeof (error as any).message === 'string' && (error as any).message.toLowerCase().includes('fotos')) {
                const second = await save(false)
                error = second.error
            }

            if (error) throw new Error((error as any).message)

            setPedidoId("")
            setTipo("Queja")
            setComentario("")
            setFotos([])

            await fetchIncidencias()
        } catch (err: any) {
            console.error("Error creating incidencia:", err)
            const code = String((err as any)?.code || '')
            const msg = String((err as any)?.message || '')
            const lower = msg.toLowerCase()
            if (
                code === '42501' ||
                lower.includes('permission denied') ||
                lower.includes('row level security') ||
                lower.includes('violates row-level security')
            ) {
                alert('No tienes permisos para realizar esta acción.')
            } else {
                alert('No se pudo crear la incidencia: ' + (msg || ''))
            }
        } finally {
            setCreating(false)
        }
    }

    async function handleDelete(id: number) {
        if (userRole !== "admin") return
        if (!confirm("¿Eliminar esta incidencia?")) return

        const { error } = await supabase
            .from("incidencias")
            .delete()
            .eq("id", id)

        if (error) {
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
                alert('Error al eliminar: ' + msg)
            }
            return
        }
        await fetchIncidencias()
    }

    if (guard.loading || loading) {
        return <div className="p-10">Cargando...</div>
    }

    if (guard.accessDenied) {
        return <AccessDenied />
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between gap-3">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Incidencias</h1>
                    <p className="text-gray-500">Gestiona reclamos, devoluciones y problemas de pedidos.</p>
                </div>
                <Button variant="outline" className="gap-2" onClick={refreshAll} disabled={loading}>
                    <RefreshCw className="h-4 w-4" /> Actualizar
                </Button>
            </div>

            <Card className="shadow-sm border-gray-200">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <AlertTriangle className="h-5 w-5 text-amber-600" /> Registrar incidencia
                    </CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <div className="text-sm text-muted-foreground">Pedido</div>
                        <Select value={pedidoId} onValueChange={setPedidoId}>
                            <SelectTrigger disabled={creating || uploading}>
                                <SelectValue placeholder="Selecciona un pedido" />
                            </SelectTrigger>
                            <SelectContent>
                                {pedidos.map((p) => (
                                    <SelectItem key={p.id} value={String(p.id)}>
                                        #{String(p.id).padStart(6, '0')} • {p.status} • {p.clientes?.nombre || '—'}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <div className="text-sm text-muted-foreground">Tipo</div>
                        <Select value={tipo} onValueChange={(v) => setTipo(v as Tipo)}>
                            <SelectTrigger disabled={creating || uploading}>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {TIPOS.map((t) => (
                                    <SelectItem key={t} value={t}>{t}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2 md:col-span-2">
                        <div className="text-sm text-muted-foreground">Comentario</div>
                        <Textarea
                            placeholder="Describe el problema (producto incorrecto, devolución, etc.)"
                            value={comentario}
                            onChange={(e) => setComentario(e.target.value)}
                            disabled={creating || uploading}
                        />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                        <div className="text-sm text-muted-foreground">Fotos (hasta 5)</div>
                        <div className="flex items-center gap-3">
                            <label className={`inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm font-medium ${uploading ? 'opacity-60' : 'cursor-pointer hover:bg-accent'}`}>
                                <UploadCloud className="h-4 w-4" />
                                {uploading ? 'Subiendo...' : 'Subir imágenes'}
                                <input
                                    type="file"
                                    accept="image/*"
                                    multiple
                                    className="hidden"
                                    disabled={creating || uploading || fotos.length >= 5}
                                    onChange={async (e) => {
                                        if (!e.target.files || e.target.files.length === 0) return
                                        try {
                                            setUploading(true)
                                            const files = Array.from(e.target.files)
                                            const remaining = Math.max(0, 5 - fotos.length)
                                            const toUpload = files.slice(0, remaining)

                                            const uploadedUrls: string[] = []
                                            for (const file of toUpload) {
                                                const fileExt = file.name.split('.').pop() || 'jpg'
                                                const fileName = `${Date.now()}-${Math.random().toString(16).slice(2)}.${fileExt}`
                                                const folder = pedidoId ? `incidencias/${pedidoId}` : 'incidencias'
                                                const filePath = `${folder}/${fileName}`

                                                const { error: uploadError } = await supabase.storage
                                                    .from('productos')
                                                    .upload(filePath, file)

                                                if (uploadError) throw uploadError

                                                const { data } = supabase.storage.from('productos').getPublicUrl(filePath)
                                                if (data?.publicUrl) uploadedUrls.push(data.publicUrl)
                                            }

                                            const next = [...fotos, ...uploadedUrls]
                                                .map((x) => String(x || '').trim())
                                                .filter(Boolean)
                                                .slice(0, 5)
                                            setFotos(next)
                                        } catch (err: any) {
                                            alert('Error subiendo imagen: ' + (err?.message || ''))
                                        } finally {
                                            setUploading(false)
                                            e.target.value = ''
                                        }
                                    }}
                                />
                            </label>

                            <div className="text-xs text-muted-foreground">{fotos.length}/5</div>
                        </div>

                        {fotos.length > 0 && (
                            <div className="grid grid-cols-5 gap-2">
                                {fotos.map((url) => (
                                    <div key={url} className="relative aspect-square rounded-md overflow-hidden border bg-popover">
                                        <img src={url} alt="Foto incidencia" className="h-full w-full object-cover" />
                                        <button
                                            type="button"
                                            className="absolute top-1 right-1 h-7 w-7 rounded-full bg-background/80 border flex items-center justify-center"
                                            onClick={() => setFotos((prev) => prev.filter((x) => x !== url))}
                                            disabled={creating || uploading}
                                            aria-label="Quitar"
                                        >
                                            <X className="h-4 w-4" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                    <div className="md:col-span-2">
                        <Button onClick={handleCreate} disabled={creating || uploading} className="w-full md:w-auto">
                            Registrar
                        </Button>
                    </div>
                </CardContent>
            </Card>

            <Card className="shadow-sm border-gray-200">
                <CardHeader>
                    <CardTitle>Listado</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div className="space-y-1">
                            <div className="text-sm text-muted-foreground">Filtrar por pedido</div>
                            <Input
                                inputMode="numeric"
                                placeholder="ID pedido"
                                value={filterPedido}
                                onChange={(e) => setFilterPedido(e.target.value.replace(/\D/g, ""))}
                            />
                        </div>
                        <div className="space-y-1">
                            <div className="text-sm text-muted-foreground">Tipo</div>
                            <Select value={filterTipo} onValueChange={(v) => setFilterTipo(v as TipoFilter)}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Todos" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Todos</SelectItem>
                                    {TIPOS.map((t) => (
                                        <SelectItem key={t} value={t}>{t}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl border overflow-hidden">
                        <Table>
                            <TableHeader className="bg-gray-50">
                                <TableRow>
                                    <TableHead>ID</TableHead>
                                    <TableHead>Pedido</TableHead>
                                    <TableHead>Tipo</TableHead>
                                    <TableHead>Cliente</TableHead>
                                    <TableHead>Fecha</TableHead>
                                    <TableHead className="text-right">Acciones</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="text-center py-10">Cargando...</TableCell>
                                    </TableRow>
                                ) : filtered.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="text-center py-10">No hay incidencias.</TableCell>
                                    </TableRow>
                                ) : (
                                    filtered.map((i) => (
                                        <TableRow key={i.id}>
                                            <TableCell className="font-mono">#{String(i.id).padStart(5, "0")}</TableCell>
                                            <TableCell>
                                                <Link href={`/admin/pedidos/${i.pedido_id}`} className="text-sm font-medium text-primary hover:underline">
                                                    #{String(i.pedido_id).padStart(6, "0")}
                                                </Link>
                                                <div className="text-xs text-muted-foreground">{i.pedidos?.status || ""}</div>
                                            </TableCell>
                                            <TableCell className="text-sm font-medium">{i.tipo || ""}</TableCell>
                                            <TableCell>
                                                <div className="text-sm">
                                                    <div className="font-medium">{i.pedidos?.clientes?.nombre || "—"}</div>
                                                    <div className="text-muted-foreground">{i.pedidos?.clientes?.telefono || ""}</div>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-sm text-muted-foreground">{new Date(i.created_at).toLocaleString()}</TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex justify-end gap-2">
                                                    {i.foto && (
                                                        <a
                                                            href={i.foto}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="text-sm font-medium text-primary hover:underline"
                                                        >
                                                            Foto
                                                        </a>
                                                    )}
                                                    {userRole === "admin" && (
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-8 w-8 hover:bg-red-50"
                                                            onClick={() => handleDelete(i.id)}
                                                        >
                                                            <Trash2 className="h-4 w-4 text-red-600" />
                                                        </Button>
                                                    )}
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
