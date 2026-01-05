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

export default function DashboardStockBajoPage() {
    const router = useRouter()
    const [loading, setLoading] = useState(true)
    const [accessDenied, setAccessDenied] = useState(false)
    const [threshold, setThreshold] = useState<number>(5)
    const [productos, setProductos] = useState<any[]>([])

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

        await fetchStockBajo(5)
    }

    async function fetchStockBajo(th: number) {
        setLoading(true)
        setThreshold(th)

        const { data, error } = await supabase
            .from("productos")
            .select("id, nombre, precio, stock, imagen_url")
            .lt("stock", th)
            .order("stock", { ascending: true })

        if (error) {
            console.error("Error fetching stock bajo:", error)
            setProductos([])
        } else {
            setProductos((data as any[]) || [])
        }

        setLoading(false)
    }

    const resumen = useMemo(() => {
        const count = productos.length
        const sinStock = productos.filter((p) => (Number(p.stock) || 0) <= 0).length
        const valor = productos.reduce((sum, p) => sum + (Number(p.precio) || 0) * (Number(p.stock) || 0), 0)
        return { count, sinStock, valor }
    }, [productos])

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
                    <h1 className="text-3xl font-bold text-gray-900">Stock Bajo</h1>
                    <p className="text-gray-500">Productos con stock menor a {threshold}.</p>
                </div>
                <Button variant="outline" className="gap-2" onClick={() => fetchStockBajo(threshold)} disabled={loading}>
                    <RefreshCw className="h-4 w-4" /> Actualizar
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="shadow-sm border-gray-200">
                    <CardContent className="p-5">
                        <p className="text-sm text-muted-foreground">Productos en riesgo</p>
                        <p className="text-2xl font-bold">{resumen.count}</p>
                    </CardContent>
                </Card>
                <Card className="shadow-sm border-gray-200">
                    <CardContent className="p-5">
                        <p className="text-sm text-muted-foreground">Sin stock</p>
                        <p className="text-2xl font-bold">{resumen.sinStock}</p>
                    </CardContent>
                </Card>
                <Card className="shadow-sm border-gray-200">
                    <CardContent className="p-5">
                        <p className="text-sm text-muted-foreground">Valor aprox. del stock en riesgo</p>
                        <p className="text-2xl font-bold">{formatCurrency(resumen.valor)}</p>
                    </CardContent>
                </Card>
            </div>

            <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
                <Table>
                    <TableHeader className="bg-gray-50">
                        <TableRow>
                            <TableHead>Producto</TableHead>
                            <TableHead>Precio</TableHead>
                            <TableHead>Stock</TableHead>
                            <TableHead className="text-right">Ir a Inventario</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={4} className="text-center py-10">Cargando...</TableCell>
                            </TableRow>
                        ) : productos.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={4} className="text-center py-10">No hay productos con stock bajo.</TableCell>
                            </TableRow>
                        ) : (
                            productos.map((p) => (
                                <TableRow key={p.id}>
                                    <TableCell>
                                        <div className="flex items-center gap-3">
                                            <div className="h-10 w-10 bg-gray-100 rounded-md overflow-hidden flex items-center justify-center">
                                                {p.imagen_url ? (
                                                    <img src={p.imagen_url} alt={p.nombre} className="h-full w-full object-cover" />
                                                ) : (
                                                    <div className="h-full w-full" />
                                                )}
                                            </div>
                                            <div>
                                                <p className="font-medium">{p.nombre}</p>
                                                <p className="text-xs text-muted-foreground">#{p.id}</p>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell className="font-semibold">{formatCurrency(p.precio)}</TableCell>
                                    <TableCell>
                                        <span className={`px-2 py-1 rounded-full text-xs font-bold ${p.stock > 0 ? 'bg-orange-100 text-orange-700' : 'bg-red-100 text-red-700'}`}>
                                            {p.stock} un.
                                        </span>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Link href="/admin/productos" className="text-sm font-medium text-primary hover:underline">
                                            Ver inventario
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
