
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { Database } from '@/types/database.types'

type Product = Database['public']['Tables']['productos']['Row']

export type ProductVariant = Database['public']['Tables']['producto_variantes']['Row']

interface CartItem extends Product {
    quantity: number
    producto_variante_id?: number | null
    variante_nombre?: string | null
}

interface CartState {
    items: CartItem[]
    addItem: (product: Product, variant?: ProductVariant | null) => void
    removeItem: (productId: number, variantId?: number | null) => void
    updateQuantity: (productId: number, quantity: number, variantId?: number | null) => void
    clearCart: () => void
    total: number
}

export const useCartStore = create<CartState>()(
    persist(
        (set, get) => ({
            items: [],
            total: 0,
            addItem: (product, variant) => {
                set((state) => {
                    const items = state.items
                    const variantId = variant?.id ?? null
                    const existingItem = items.find((item) => item.id === product.id && (item.producto_variante_id ?? null) === variantId)

                    const effectivePrice = Number(variant?.precio ?? product.precio)
                    const effectivePriceBefore = (variant?.precio_antes ?? (product as any).precio_antes ?? null) as number | null
                    const varianteNombre = variant?.etiqueta ?? null

                    const nextItems = existingItem
                        ? items.map((item) =>
                            item.id === product.id && (item.producto_variante_id ?? null) === variantId
                                ? { ...item, quantity: item.quantity + 1 }
                                : item
                        )
                        : [
                            ...items,
                            {
                                ...product,
                                precio: effectivePrice,
                                precio_antes: effectivePriceBefore,
                                producto_variante_id: variantId,
                                variante_nombre: varianteNombre,
                                quantity: 1,
                            },
                        ]

                    const total = nextItems.reduce((sum, item) => sum + (item.precio * item.quantity), 0)
                    return { items: nextItems, total }
                })
            },
            removeItem: (productId, variantId) => {
                const v = variantId ?? null
                set((state) => {
                    const nextItems = state.items.filter((item) => !(item.id === productId && (item.producto_variante_id ?? null) === v))
                    const total = nextItems.reduce((sum, item) => sum + (item.precio * item.quantity), 0)
                    return { items: nextItems, total }
                })
            },
            updateQuantity: (productId, quantity, variantId) => {
                const v = variantId ?? null
                if (quantity <= 0) {
                    get().removeItem(productId, v)
                    return
                }
                set((state) => {
                    const nextItems = state.items.map((item) =>
                        item.id === productId && (item.producto_variante_id ?? null) === v ? { ...item, quantity } : item
                    )
                    const total = nextItems.reduce((sum, item) => sum + (item.precio * item.quantity), 0)
                    return { items: nextItems, total }
                })
            },
            clearCart: () => set({ items: [], total: 0 }),
        }),
        {
            name: 'cart-storage',
        }
    )
)
