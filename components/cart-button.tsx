"use client"

import { useCartAnimationStore } from "@/features/cart/cart-animation"
import { Button } from "@/components/ui/button"
import { ShoppingCart, Trash2, Plus, Minus, Image as ImageIcon, CheckCircle } from "lucide-react"
import { useCartStore } from "@/features/cart"
import { useEffect, useState } from "react"
import { CheckoutForm } from "@/components/checkout-form"
import { formatCurrency } from "@/lib/utils"
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
    SheetClose,
} from "@/components/ui/sheet"

export function CartButton() {
    // Use state to avoid hydration mismatch with persisted store
    const [mounted, setMounted] = useState(false)
    const [view, setView] = useState<'cart' | 'checkout' | 'success'>('cart')
    const [successToastOpen, setSuccessToastOpen] = useState(false)
    const [successOrderId, setSuccessOrderId] = useState<string | null>(null)

    const registerCartButton = useCartAnimationStore((s) => s.registerCartButton)
    const bumpTimestamp = useCartAnimationStore((s) => s.bumpTimestamp)
    const [isBumping, setIsBumping] = useState(false)

    useEffect(() => {
        if (!bumpTimestamp) return
        setIsBumping(true)
        const t = setTimeout(() => setIsBumping(false), 300)
        return () => clearTimeout(t)
    }, [bumpTimestamp])

    const items = useCartStore((state) => state.items)
    const removeItem = useCartStore((state) => state.removeItem)
    const updateQuantity = useCartStore((state) => state.updateQuantity)
    const clearCart = useCartStore((state) => state.clearCart)
    const total = useCartStore((state) => state.total)

    useEffect(() => {
        setMounted(true)

        const readCookie = (name: string) => {
            try {
                const value = `; ${document.cookie}`
                const parts = value.split(`; ${name}=`)
                if (parts.length < 2) return null
                return parts.pop()!.split(';').shift() || null
            } catch (err) {
                return null
            }
        }

        const deleteCookie = (name: string) => {
            try {
                const isHttps = typeof window !== 'undefined' && window.location.protocol === 'https:'
                document.cookie = `${name}=; Max-Age=0; Path=/; SameSite=Lax${isHttps ? '; Secure' : ''}`
            } catch (err) {
            }
        }

        const consumeSuccessMarker = () => {
            try {
                const raw = localStorage.getItem('blama_last_order_success')
                const cookieRaw = raw ? null : readCookie('blama_last_order_success')
                const source = raw ?? (cookieRaw ? decodeURIComponent(cookieRaw) : null)
                if (!source) return

                const parsed = JSON.parse(source)
                const orderId = parsed?.orderId ? String(parsed.orderId) : null
                const ts = Number(parsed?.ts || 0)
                const isFresh = ts > 0 && Date.now() - ts < 1000 * 60 * 30 // 30 min
                if (!isFresh) {
                    localStorage.removeItem('blama_last_order_success')
                    deleteCookie('blama_last_order_success')
                    return
                }

                clearCart()
                try {
                    localStorage.removeItem('cart-storage')
                } catch (err) {
                }
                setView('success')
                setSuccessOrderId(orderId)
                setSuccessToastOpen(true)
                localStorage.removeItem('blama_last_order_success')
                deleteCookie('blama_last_order_success')
            } catch (err) {
            }
        }

        consumeSuccessMarker()

        const onPageShow = () => consumeSuccessMarker()
        const onFocus = () => consumeSuccessMarker()
        const onVisibility = () => {
            if (document.visibilityState === 'visible') consumeSuccessMarker()
        }

        window.addEventListener('pageshow', onPageShow)
        window.addEventListener('focus', onFocus)
        document.addEventListener('visibilitychange', onVisibility)
        return () => {
            window.removeEventListener('pageshow', onPageShow)
            window.removeEventListener('focus', onFocus)
            document.removeEventListener('visibilitychange', onVisibility)
        }
    }, [])

    useEffect(() => {
        if (!successToastOpen) return
        const id = window.setTimeout(() => {
            setSuccessToastOpen(false)
        }, 6500)
        return () => window.clearTimeout(id)
    }, [successToastOpen])

    const totalItems = mounted ? items.reduce((sum, item) => sum + item.quantity, 0) : 0

    const handleOpenChange = (open: boolean) => {
        if (!open) {
            // Reset view when closing, unless we are in success (optional)
            setTimeout(() => setView('cart'), 300)
        }
    }

    const handleComplete = () => {
        clearCart()
        try {
            localStorage.removeItem('cart-storage')
        } catch (err) {
        }
        setView('success')
        setSuccessOrderId(null)
        setSuccessToastOpen(true)
    }

    const handleContinueShopping = () => {
        setView('cart')
    }

    return (

        <>
            {successToastOpen && (
                <div className="fixed inset-x-0 bottom-4 z-50 flex justify-center px-4">
                    <div className="w-full max-w-md rounded-xl border border-border bg-card shadow-lg p-4">
                        <div className="flex items-start gap-3">
                            <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center text-green-700">
                                <CheckCircle className="h-6 w-6" />
                            </div>
                            <div className="flex-1">
                                <div className="font-semibold text-foreground">¡Pedido confirmado!</div>
                                <div className="text-sm text-muted-foreground">
                                    {successOrderId ? `Pedido #${successOrderId}` : 'Tu pedido se registró correctamente.'}
                                </div>
                            </div>
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setSuccessToastOpen(false)}>
                                ✕
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            <Sheet onOpenChange={handleOpenChange}>
                <SheetTrigger asChild>
                    <Button variant="ghost" className={`relative hover:bg-popover flex items-center gap-2 px-3 h-10 rounded-full border border-border shadow-sm transition-all hover:shadow-md active:scale-95 ${isBumping ? 'scale-110 bg-accent text-accent-foreground ring-2 ring-primary duration-100' : 'duration-300'}`}>
                        <div className="relative" ref={(el) => registerCartButton(el as any)}>
                            <ShoppingCart className="h-5 w-5" />
                            {totalItems > 0 && (
                                <span className="absolute -top-2 -right-2 h-4 w-4 bg-red-600 rounded-full text-[10px] font-bold text-white flex items-center justify-center animate-in zoom-in ring-2 ring-ring">
                                    {totalItems}
                                </span>
                            )}
                        </div>
                        <span className="font-bold text-sm text-foreground mr-1">Carrito</span>
                    </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-[90%] sm:max-w-[400px] flex flex-col p-0">

                    <SheetHeader className="sr-only">
                        <SheetTitle>Carrito</SheetTitle>
                    </SheetHeader>

                    {/* VIEW: SUCCESS */}
                    {view === 'success' && (
                        <div className="flex flex-col items-center justify-center h-full space-y-6 text-center animate-in fade-in zoom-in duration-300 p-6">
                            <div className="h-24 w-24 bg-green-100 rounded-full flex items-center justify-center text-green-600 shadow-inner">
                                <CheckCircle className="h-12 w-12" />
                            </div>
                            <div className="space-y-2">
                                <h3 className="text-2xl font-bold text-gray-900">¡Pedido Confirmado!</h3>
                                <p className="text-gray-500 max-w-[250px] mx-auto text-sm leading-relaxed">
                                    Tu pedido se registró correctamente. Ahora se abrirá WhatsApp para finalizar la confirmación. ¡Gracias por tu preferencia!
                                </p>
                            </div>

                            <SheetClose asChild>
                                <Button
                                    className="w-full max-w-[200px] bg-black hover:bg-gray-800"
                                    onClick={handleContinueShopping}
                                >
                                    Seguir Comprando
                                </Button>
                            </SheetClose>
                        </div>
                    )}

                    {/* VIEW: CHECKOUT FORM */}
                    {view === 'checkout' && (
                        <CheckoutForm
                            items={items}
                            total={total}
                            onBack={() => setView('cart')}
                            onComplete={handleComplete}
                        />
                    )}

                    {/* VIEW: CART LIST (Default) */}
                    {view === 'cart' && (
                        <>
                            <SheetHeader className="p-4 border-b">
                                <SheetTitle className="flex items-center gap-2">
                                    <ShoppingCart className="h-5 w-5" />
                                    Mi Carrito ({totalItems})
                                </SheetTitle>
                            </SheetHeader>

                            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                                {!mounted ? (
                                    <p className="text-center text-muted-foreground mt-10">Cargando...</p>
                                ) : items.length === 0 ? (
                                    <div className="text-center mt-10 space-y-2">
                                        <p className="text-4xl">🛒</p>
                                        <p className="text-muted-foreground font-medium">Tu carrito está vacío</p>
                                        <p className="text-sm text-muted-foreground">Agrega productos para comenzar.</p>
                                    </div>
                                ) : (
                                    items.map((item) => (
                                        <div key={`${item.id}-${item.producto_variante_id ?? 'base'}`} className="flex gap-3 bg-card p-2 rounded-lg border border-border shadow-sm">
                                            <div className="h-20 w-20 bg-popover rounded-md overflow-hidden flex-shrink-0">
                                                {item.imagen_url ? (
                                                    <img src={item.imagen_url} alt={item.nombre} className="h-full w-full object-cover" />
                                                ) : (
                                                    <div className="h-full w-full flex items-center justify-center text-gray-400">
                                                        <ImageIcon className="h-6 w-6" />
                                                    </div>
                                                )}
                                            </div>

                                            <div className="flex-1 flex flex-col justify-between">
                                                <div>
                                                    <h4 className="font-semibold text-sm line-clamp-1">{item.nombre}</h4>
                                                    {item.variante_nombre && (
                                                        <p className="text-xs text-muted-foreground">{item.variante_nombre}</p>
                                                    )}
                                                    <p className="text-xs text-muted-foreground">Unitario: {formatCurrency(item.precio)}</p>
                                                </div>

                                                <div className="flex justify-between items-end">
                                                    <div className="flex items-center gap-2 border border-border rounded-md p-1 h-8">
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-6 w-6"
                                                            onClick={() => updateQuantity(item.id, item.quantity - 1, item.producto_variante_id ?? null)}
                                                            disabled={item.quantity <= 1}
                                                        >
                                                            <Minus className="h-3 w-3" />
                                                        </Button>
                                                        <span className="text-xs font-medium w-4 text-center">{item.quantity}</span>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-6 w-6"
                                                            onClick={() => updateQuantity(item.id, item.quantity + 1, item.producto_variante_id ?? null)}
                                                        >
                                                            <Plus className="h-3 w-3" />
                                                        </Button>
                                                    </div>

                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
                                                        onClick={() => removeItem(item.id, item.producto_variante_id ?? null)}
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>

                            {items.length > 0 && (
                                <div className="p-4 border-t border-border bg-popover space-y-4">
                                    <div className="flex justify-between items-center text-lg font-bold">
                                        <span>Total:</span>
                                        <span>{formatCurrency(total)}</span>
                                    </div>
                                    <Button
                                        onClick={() => setView('checkout')}
                                        className="w-full h-12 text-base font-bold bg-primary text-primary-foreground hover:bg-primary/90"
                                    >
                                        Ir a Completar Datos
                                    </Button>
                                </div>
                            )}
                        </>
                    )}
                </SheetContent>
            </Sheet>
        </>
    )
}
