
"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Plus, Image as ImageIcon } from "lucide-react"
import { formatCurrency } from "@/lib/utils"
import { Database } from "@/types/database.types"
import { useCartStore } from "@/store/cart"
import { useState } from "react"
import { ProductImageCarousel } from "@/components/product-image-carousel"

type Product = Database['public']['Tables']['productos']['Row']

interface ProductCardProps {
    product: Product
}

export function ProductCard({ product }: ProductCardProps) {
    const addItem = useCartStore((state) => state.addItem)
    const [isAdded, setIsAdded] = useState(false)

    const images = (
        (Array.isArray((product as any).imagenes) ? ((product as any).imagenes as string[]) : [])
            .filter(Boolean)
            .slice(0, 10)
    )
    const fallbackImages = images.length > 0 ? images : product.imagen_url ? [product.imagen_url] : []

    const handleAddToCart = () => {
        addItem(product)

        // Feedback visual simple
        setIsAdded(true)
        setTimeout(() => setIsAdded(false), 1000)
    }

    return (
        <Card className="group overflow-hidden border-none shadow-sm hover:shadow-md transition-all duration-300 bg-card flex flex-col rounded-xl">
            <Link href={`/productos/${product.id}`} className="block">
                <div className="aspect-square bg-popover relative overflow-hidden">
                    {fallbackImages.length > 0 ? (
                        <ProductImageCarousel
                            images={fallbackImages}
                            alt={product.nombre}
                            className="group-hover:scale-105 transition-transform duration-300"
                            autoPlay
                            intervalMs={2500}
                        />
                    ) : (
                        <div className="absolute inset-0 flex items-center justify-center text-muted-foreground group-hover:scale-110 transition-transform duration-300">
                            <ImageIcon className="h-10 w-10 opacity-50" />
                        </div>
                    )}
                    {/* Quick Action Overlay */}
                    <div className="absolute inset-0 bg-foreground/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
            </Link>

            <CardContent className="p-3 flex-1 flex flex-col justify-between">
                <div>
                    <Link href={`/productos/${product.id}`} className="hover:underline">
                        <h4 className="font-medium text-sm line-clamp-2 leading-tight mb-1 text-gray-700">{product.nombre}</h4>
                    </Link>
                </div>
                <div className="mt-1">
                    <p className="text-lg font-bold text-foreground">{formatCurrency(product.precio)}</p>
                </div>
            </CardContent>

            <CardFooter className="p-3 pt-0">
                <Button
                    onClick={handleAddToCart}
                    className={`w-full h-9 font-semibold rounded-lg transition-all shadow-sm flex items-center justify-center gap-2 ${isAdded ? 'bg-green-600 hover:bg-green-700' : 'bg-primary text-primary-foreground hover:bg-primary/90'}`}
                >
                    {isAdded ? (
                        <span>¡Agregado!</span>
                    ) : (
                        <>
                            <Plus className="h-4 w-4" />
                            <span>Agregar</span>
                        </>
                    )}
                </Button>
            </CardFooter>
        </Card>
    )
}
