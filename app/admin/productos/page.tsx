"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { supabase } from "@/lib/supabaseClient"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useRoleGuard } from "@/lib/use-role-guard"
import { AccessDenied } from "@/components/admin/access-denied"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"

import { formatCurrency } from "@/lib/utils"

import { Plus, Search, Edit, Trash2, Image as ImageIcon } from "lucide-react"

export default function ProductosPage() {
    const router = useRouter()
    const [productos, setProductos] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    const guard = useRoleGuard({ allowedRoles: ['admin'] })

    useEffect(() => {
        if (guard.loading || guard.accessDenied) return
        fetchProductos()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [guard.loading, guard.accessDenied])

    async function fetchProductos() {
        setLoading(true)
        const { data } = await supabase
            .from('productos')
            .select('*')
            .order('id', { ascending: true })
        if (data) setProductos(data)
        setLoading(false)
    }

    const handleDelete = async (id: number) => {
        if (!confirm("¿Estás seguro de que deseas eliminar este producto?")) return

        const { error } = await supabase.from('productos').delete().eq('id', id)

        if (error) {
            alert("Error al eliminar: " + error.message)
        } else {
            fetchProductos()
        }
    }

    if (guard.accessDenied) return <AccessDenied />

    if (guard.loading) {
        return <div className="p-6 text-muted-foreground">Cargando...</div>
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Productos</h1>
                    <p className="text-gray-500">Administra el inventario de tu tienda.</p>
                </div>

                <Button asChild className="bg-black text-white gap-2 hover:bg-gray-800">
                    <Link href="/admin/productos/nuevo">
                        <Plus className="h-4 w-4" /> Nuevo Producto
                    </Link>
                </Button>
            </div>

            <div className="flex gap-2 bg-white p-4 rounded-xl shadow-sm border">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input placeholder="Buscar produto..." className="pl-9 border-gray-200" />
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
                <Table>
                    <TableHeader className="bg-gray-50">
                        <TableRow>
                            <TableHead className="w-[80px]">Imagen</TableHead>
                            <TableHead>Nombre</TableHead>
                            <TableHead>Precio</TableHead>
                            <TableHead>Stock</TableHead>
                            <TableHead className="text-right">Acciones</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center py-10">Cargando...</TableCell>
                            </TableRow>
                        ) : productos.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center py-10">No hay productos.</TableCell>
                            </TableRow>
                        ) : (
                            productos.map((producto) => (
                                <TableRow key={producto.id}>
                                    <TableCell>
                                        <div className="h-10 w-10 bg-gray-100 rounded-md overflow-hidden flex items-center justify-center">
                                            {producto.imagen_url ? (
                                                <img src={producto.imagen_url} alt={producto.nombre} className="h-full w-full object-cover" />
                                            ) : (
                                                <ImageIcon className="h-4 w-4 text-gray-400" />
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell className="font-medium">{producto.nombre}</TableCell>
                                    <TableCell>
                                        <div className="flex items-baseline gap-2">
                                            <span className="font-semibold">{formatCurrency(producto.precio)}</span>
                                            {producto.precio_antes != null && Number(producto.precio_antes) > Number(producto.precio) && (
                                                <span className="text-xs text-gray-500 line-through">{formatCurrency(producto.precio_antes)}</span>
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <span className={`px-2 py-1 rounded-full text-xs font-bold ${producto.stock > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                            {producto.stock} un.
                                        </span>
                                    </TableCell>
                                    <TableCell className="text-right space-x-2">
                                        <Button asChild variant="ghost" size="icon" className="h-8 w-8 hover:bg-gray-100">
                                            <Link href={`/admin/productos/${producto.id}/editar`} aria-label="Editar">
                                                <Edit className="h-4 w-4 text-gray-600" />
                                            </Link>
                                        </Button>
                                        <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-red-50" onClick={() => handleDelete(producto.id)}>
                                            <Trash2 className="h-4 w-4 text-red-500" />
                                        </Button>
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
