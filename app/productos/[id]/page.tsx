"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { supabase } from "@/lib/supabaseClient"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { formatCurrency } from "@/lib/utils"
import { ProductImageCarousel } from "@/components/product-image-carousel"
import { useCartStore } from "@/store/cart"
import { ArrowLeft, Minus, Plus, ShoppingCart } from "lucide-react"

export default function ProductoDetallePage() {
    const params = useParams()
    const router = useRouter()
    const id = params.id as string

    const [loading, setLoading] = useState(true)
    const [producto, setProducto] = useState<any>(null)

    const { addItem, items, updateQuantity } = useCartStore()

    const quantity = useMemo(() => {
        const pid = Number(id)
        const found = items.find((it) => it.id === pid)
        return found?.quantity || 0
    }, [items, id])

    useEffect(() => {
        if (!id) return
        fetchProducto()
    }, [id])

    async function fetchProducto() {
        setLoading(true)

        const numericId = Number(id)
        if (!numericId) {
            setProducto(null)
            setLoading(false)
            return
        }

        const { data, error } = await supabase
            .from("productos")
            .select(`*, categorias (nombre)`)
            .eq("id", numericId)
            .single()

        if (error) {
            console.error("Error fetching producto:", error)
            setProducto(null)
        } else {
            setProducto(data)
        }

        setLoading(false)
    }

    const images = useMemo(() => {
        const arr = Array.isArray(producto?.imagenes) ? (producto.imagenes as string[]) : []
        const clean = (arr || []).filter(Boolean).slice(0, 10)
        if (clean.length > 0) return clean
        return producto?.imagen_url ? [producto.imagen_url] : []
    }, [producto])

    if (loading) {
        return <div className="p-10 text-center text-muted-foreground">Cargando producto...</div>
    }

    if (!producto) {
        return (
            <div className="space-y-4">
                <Button variant="ghost" className="gap-2" onClick={() => router.push("/productos")}
                >
                    <ArrowLeft className="h-4 w-4" /> Volver
                </Button>
                <div className="bg-white rounded-xl shadow-sm border p-8 text-center">
                    <p className="text-lg font-semibold">Producto no encontrado</p>
                    <p className="text-sm text-muted-foreground mt-1">Puede que haya sido eliminado o no exista.</p>
                </div>
            </div>
        )
    }

    const inStock = Number(producto.stock || 0) > 0

    return (
        <div className="space-y-6 max-w-5xl mx-auto">
            <div className="flex items-center justify-between gap-3">
                <Button variant="ghost" className="gap-2" asChild>
                    <Link href="/productos">
                        <ArrowLeft className="h-4 w-4" /> Volver a productos
                    </Link>
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="overflow-hidden shadow-sm border">
                    <div className="aspect-square bg-popover relative group">
                        {images.length > 0 ? (
                            <ProductImageCarousel images={images} alt={producto.nombre} />
                        ) : (
                            <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
                                Sin imagen
                            </div>
                        )}
                        {!inStock && (
                            <div className="absolute inset-0 bg-foreground/60 flex items-center justify-center">
                                <span className="text-sidebar-primary-foreground font-bold">Agotado</span>
                            </div>
                        )}
                    </div>
                </Card>

                <div className="space-y-4">
                    <Card className="shadow-sm border">
                        <CardContent className="p-6 space-y-3">
                            <div className="space-y-1">
                                <h1 className="text-2xl md:text-3xl font-bold text-gray-900">{producto.nombre}</h1>
                                <div className="text-sm text-muted-foreground">
                                    {producto.categorias?.nombre ? (
                                        <span>Categoría: {producto.categorias.nombre}</span>
                                    ) : (
                                        <span>Categoría: —</span>
                                    )}
                                </div>
                            </div>

                            <div className="flex items-center justify-between gap-3">
                                <div>
                                    <div className="text-sm text-muted-foreground">Precio</div>
                                    <div className="text-3xl font-extrabold text-primary">{formatCurrency(producto.precio)}</div>
                                </div>
                                <div className="text-right">
                                    <div className="text-sm text-muted-foreground">Stock</div>
                                    <div className={`text-sm font-semibold ${inStock ? 'text-green-700' : 'text-red-700'}`}>
                                        {inStock ? `${producto.stock} disponibles` : 'Sin stock'}
                                    </div>
                                </div>
                            </div>

                            {inStock ? (
                                quantity === 0 ? (
                                    <Button
                                        className="w-full gap-2 h-11"
                                        onClick={() => addItem(producto)}
                                    >
                                        <ShoppingCart className="h-4 w-4" /> Agregar al carrito
                                    </Button>
                                ) : (
                                    <div className="w-full flex items-center justify-between bg-popover rounded-lg p-2">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-10 w-10"
                                            onClick={() => updateQuantity(Number(producto.id), quantity - 1)}
                                        >
                                            <Minus className="h-4 w-4" />
                                        </Button>
                                        <div className="text-center">
                                            <div className="text-xs text-muted-foreground">Cantidad</div>
                                            <div className="text-lg font-bold">{quantity}</div>
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-10 w-10"
                                            onClick={() => updateQuantity(Number(producto.id), quantity + 1)}
                                        >
                                            <Plus className="h-4 w-4" />
                                        </Button>
                                    </div>
                                )
                            ) : (
                                <Button disabled className="w-full h-11">
                                    Sin stock
                                </Button>
                            )}

                            <div className="pt-2 text-xs text-muted-foreground">
                                ID: #{String(producto.id).padStart(6, "0")} • {new Date(producto.created_at).toLocaleString()}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}
