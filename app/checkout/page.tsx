"use client"

import { CheckoutForm } from "@/components/checkout-form"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { useCartStore } from "@/store/cart"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"

export default function CheckoutPage() {
    const router = useRouter()

    const items = useCartStore((s) => s.items)
    const total = useCartStore((s) => s.total)
    const clearCart = useCartStore((s) => s.clearCart)

    if (!items || items.length === 0) {
        return (
            <div className="max-w-3xl mx-auto p-4 space-y-4">
                <Button variant="ghost" className="gap-2" asChild>
                    <Link href="/productos">
                        <ArrowLeft className="h-4 w-4" /> Volver a productos
                    </Link>
                </Button>

                <Card className="shadow-sm border">
                    <CardContent className="p-6 text-center space-y-2">
                        <div className="text-lg font-bold text-foreground">Tu carrito está vacío</div>
                        <div className="text-sm text-muted-foreground">
                            Agrega productos al carrito para continuar con la compra.
                        </div>
                        <Button asChild className="mt-2">
                            <Link href="/productos">Ver productos</Link>
                        </Button>
                    </CardContent>
                </Card>
            </div>
        )
    }

    return (
        <div className="max-w-3xl mx-auto p-4">
            <CheckoutForm
                items={items}
                total={total}
                onBack={() => router.back()}
                onComplete={() => {
                    clearCart()
                    router.push("/")
                }}
            />
        </div>
    )
}
