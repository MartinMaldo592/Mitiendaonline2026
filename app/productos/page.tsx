"use client"

import { Suspense, useEffect, useMemo, useState } from "react"
import { supabase } from "@/lib/supabaseClient"
import { useCartStore } from "@/store/cart"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import {
    Sheet,
    SheetContent,
    SheetFooter,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { formatCurrency } from "@/lib/utils"
import { Database } from "@/types/database.types"
import { Filter, Minus, Plus, Search, ShoppingCart, X } from "lucide-react"
import { useRouter, useSearchParams } from "next/navigation"
import { ProductImageCarousel } from "@/components/product-image-carousel"

type Product = Database['public']['Tables']['productos']['Row']
type Category = Database['public']['Tables']['categorias']['Row']

type SortValue = 'name-asc' | 'name-desc' | 'price-asc' | 'price-desc' | 'newest'

export default function ProductosPage() {
    return (
        <Suspense fallback={<div className="p-6 text-muted-foreground">Cargando...</div>}>
            <ProductosPageContent />
        </Suspense>
    )
}

function ProductosPageContent() {
    const router = useRouter()
    const searchParams = useSearchParams()

    const [productos, setProductos] = useState<Product[]>([])
    const [categorias, setCategorias] = useState<Category[]>([])
    const [loading, setLoading] = useState(true)
    const [selectedCategory, setSelectedCategory] = useState<string>("all")
    const [searchQuery, setSearchQuery] = useState("")
    const [sort, setSort] = useState<SortValue>('name-asc')
    const [minPrice, setMinPrice] = useState<string>('')
    const [maxPrice, setMaxPrice] = useState<string>('')
    const [onlyInStock, setOnlyInStock] = useState<boolean>(false)
    const [filtersOpen, setFiltersOpen] = useState(false)
    const [draftCategory, setDraftCategory] = useState<string>('all')
    const [draftSort, setDraftSort] = useState<SortValue>('name-asc')
    const [draftMinPrice, setDraftMinPrice] = useState<string>('')
    const [draftMaxPrice, setDraftMaxPrice] = useState<string>('')
    const [draftOnlyInStock, setDraftOnlyInStock] = useState<boolean>(false)

    const { addItem, items, updateQuantity } = useCartStore()

    useEffect(() => {
        fetchData()
    }, [])

    async function fetchData() {
        setLoading(true)

        // Fetch products
        const { data: productosData } = await supabase
            .from('productos')
            .select('*')
            .order('created_at', { ascending: false })

        // Fetch categories
        const { data: categoriasData } = await supabase
            .from('categorias')
            .select('*')
            .order('nombre', { ascending: true })

        if (productosData) setProductos(productosData as Product[])
        if (categoriasData) setCategorias(categoriasData as Category[])

        setLoading(false)
    }

    function updateUrl(next: Record<string, string | undefined>, mode: 'push' | 'replace' = 'replace') {
        const params = new URLSearchParams(searchParams?.toString())
        for (const [key, value] of Object.entries(next)) {
            if (!value) {
                params.delete(key)
            } else {
                params.set(key, value)
            }
        }
        const qs = params.toString()
        const href = qs ? `/productos?${qs}` : '/productos'
        if (mode === 'push') {
            router.push(href)
        } else {
            router.replace(href)
        }
    }

    const appliedFromUrl = useMemo(() => {
        const cat = searchParams?.get('cat') ?? 'all'
        const q = searchParams?.get('q') ?? ''
        const s = (searchParams?.get('sort') ?? 'name-asc') as SortValue
        const min = searchParams?.get('min') ?? ''
        const max = searchParams?.get('max') ?? ''
        const stock = searchParams?.get('stock') === '1'
        return {
            cat,
            q,
            sort: (['name-asc', 'name-desc', 'price-asc', 'price-desc', 'newest'] as const).includes(s) ? s : 'name-asc',
            min,
            max,
            stock,
        }
    }, [searchParams])

    useEffect(() => {
        setSelectedCategory(appliedFromUrl.cat || 'all')
        setSearchQuery(appliedFromUrl.q || '')
        setSort(appliedFromUrl.sort)
        setMinPrice(appliedFromUrl.min || '')
        setMaxPrice(appliedFromUrl.max || '')
        setOnlyInStock(Boolean(appliedFromUrl.stock))
    }, [appliedFromUrl])

    useEffect(() => {
        const handle = setTimeout(() => {
            updateUrl({ q: searchQuery || undefined }, 'replace')
        }, 250)
        return () => clearTimeout(handle)
    }, [searchQuery])

    useEffect(() => {
        if (!filtersOpen) return
        setDraftCategory(selectedCategory)
        setDraftSort(sort)
        setDraftMinPrice(minPrice)
        setDraftMaxPrice(maxPrice)
        setDraftOnlyInStock(onlyInStock)
    }, [filtersOpen, selectedCategory, sort, minPrice, maxPrice, onlyInStock])

    function applyFilters(list: Product[], opts: { cat: string; q: string; min: string; max: string; stock: boolean }) {
        const q = (opts.q || '').trim().toLowerCase()
        const min = opts.min ? Number(opts.min) : null
        const max = opts.max ? Number(opts.max) : null

        return list.filter((producto) => {
            const matchesCategory = opts.cat === 'all' || producto.categoria_id?.toString() === opts.cat
            const matchesSearch = !q || producto.nombre.toLowerCase().includes(q)
            const matchesMin = min === null || producto.precio >= min
            const matchesMax = max === null || producto.precio <= max
            const matchesStock = !opts.stock || producto.stock > 0
            return matchesCategory && matchesSearch && matchesMin && matchesMax && matchesStock
        })
    }

    function applySort(list: Product[], sortValue: SortValue) {
        const next = [...list]
        if (sortValue === 'price-asc') next.sort((a, b) => a.precio - b.precio)
        if (sortValue === 'price-desc') next.sort((a, b) => b.precio - a.precio)
        if (sortValue === 'name-asc') next.sort((a, b) => a.nombre.localeCompare(b.nombre))
        if (sortValue === 'name-desc') next.sort((a, b) => b.nombre.localeCompare(a.nombre))
        if (sortValue === 'newest') next.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        return next
    }

    const filteredProducts = useMemo(() => {
        const list = applyFilters(productos, {
            cat: selectedCategory,
            q: searchQuery,
            min: minPrice,
            max: maxPrice,
            stock: onlyInStock,
        })
        return applySort(list, sort)
    }, [productos, selectedCategory, searchQuery, minPrice, maxPrice, onlyInStock, sort])

    const previewFilteredProducts = useMemo(() => {
        const list = applyFilters(productos, {
            cat: draftCategory,
            q: searchQuery,
            min: draftMinPrice,
            max: draftMaxPrice,
            stock: draftOnlyInStock,
        })
        return applySort(list, draftSort)
    }, [productos, draftCategory, searchQuery, draftMinPrice, draftMaxPrice, draftOnlyInStock, draftSort])

    const appliedBadges = useMemo(() => {
        const badges: { key: string; label: string; onClear: () => void }[] = []

        if (draftCategory !== 'all') {
            const catName = categorias.find((c) => c.id.toString() === draftCategory)?.nombre || 'Categoría'
            badges.push({
                key: 'cat',
                label: catName,
                onClear: () => setDraftCategory('all'),
            })
        }
        if (draftMinPrice) {
            badges.push({
                key: 'min',
                label: `Desde $${draftMinPrice}`,
                onClear: () => setDraftMinPrice(''),
            })
        }
        if (draftMaxPrice) {
            badges.push({
                key: 'max',
                label: `Hasta $${draftMaxPrice}`,
                onClear: () => setDraftMaxPrice(''),
            })
        }
        if (draftOnlyInStock) {
            badges.push({
                key: 'stock',
                label: 'Solo en stock',
                onClear: () => setDraftOnlyInStock(false),
            })
        }

        return badges
    }, [categorias, draftCategory, draftMinPrice, draftMaxPrice, draftOnlyInStock])

    const getItemQuantity = (productId: number) => {
        const item = items.find(i => i.id === productId)
        return item?.quantity || 0
    }

    return (
        <div className="min-h-screen bg-background">
            {/* Hero Section */}
            <div className="bg-gradient-to-r from-sidebar to-sidebar-primary text-sidebar-primary-foreground py-16">
                <div className="container mx-auto px-4 text-center">
                    <h1 className="text-4xl md:text-5xl font-bold mb-4">Nuestro Catálogo</h1>
                    <p className="text-muted-foreground max-w-2xl mx-auto">
                        Explora nuestra selección de productos. Agrega al carrito y realiza tu pedido por WhatsApp.
                    </p>
                </div>
            </div>

            <div className="container mx-auto px-4 py-8">
                {/* Filters */}
                <div className="bg-card rounded-xl shadow-sm border border-border p-4 mb-8">
                    <div className="flex flex-col md:flex-row gap-4">
                        {/* Search */}
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Buscar productos..."
                                className="pl-9"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>

                        <Sheet open={filtersOpen} onOpenChange={setFiltersOpen}>
                            <SheetTrigger asChild>
                                <Button variant="outline" className="gap-2">
                                    <Filter className="h-4 w-4" />
                                    Filtrar y ordenar
                                </Button>
                            </SheetTrigger>
                            <SheetContent side="right" className="p-0">
                                <SheetHeader className="border-b">
                                    <div className="flex items-center justify-between gap-3">
                                        <SheetTitle className="text-base tracking-wide">Filtrar y ordenar</SheetTitle>
                                        <Button
                                            type="button"
                                            variant="link"
                                            className="px-0"
                                            onClick={() => {
                                                setDraftCategory('all')
                                                setDraftSort('name-asc')
                                                setDraftMinPrice('')
                                                setDraftMaxPrice('')
                                                setDraftOnlyInStock(false)
                                            }}
                                        >
                                            Borrar todo
                                        </Button>
                                    </div>
                                </SheetHeader>

                                <div className="px-4 pb-4 space-y-6 overflow-y-auto">
                                    {appliedBadges.length > 0 && (
                                        <div className="pt-4">
                                            <div className="text-sm font-semibold mb-2">Filtros aplicados</div>
                                            <div className="flex flex-wrap gap-2">
                                                {appliedBadges.map((b) => (
                                                    <Badge key={b.key} variant="outline" className="rounded-md">
                                                        <button
                                                            type="button"
                                                            className="inline-flex items-center gap-2"
                                                            onClick={b.onClear}
                                                        >
                                                            <X className="h-3.5 w-3.5" />
                                                            <span>{b.label}</span>
                                                        </button>
                                                    </Badge>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    <div className="space-y-2 pt-4 border-t">
                                        <div className="text-sm font-semibold">Ordenar por</div>
                                        <Select value={draftSort} onValueChange={(v) => setDraftSort(v as SortValue)}>
                                            <SelectTrigger className="w-full">
                                                <SelectValue placeholder="Selecciona" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="name-asc">Nombre: A → Z</SelectItem>
                                                <SelectItem value="name-desc">Nombre: Z → A</SelectItem>
                                                <SelectItem value="price-asc">Precio: menor → mayor</SelectItem>
                                                <SelectItem value="price-desc">Precio: mayor → menor</SelectItem>
                                                <SelectItem value="newest">Más nuevos</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="space-y-2 pt-4 border-t">
                                        <div className="text-sm font-semibold">Categoría de producto</div>
                                        <Select value={draftCategory} onValueChange={setDraftCategory}>
                                            <SelectTrigger className="w-full">
                                                <SelectValue placeholder="Selecciona" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="all">Todos</SelectItem>
                                                {categorias.map((cat) => (
                                                    <SelectItem key={cat.id} value={cat.id.toString()}>
                                                        {cat.nombre}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="space-y-3 pt-4 border-t">
                                        <div className="text-sm font-semibold">Precio</div>
                                        <div className="grid grid-cols-2 gap-3">
                                            <div className="space-y-1">
                                                <div className="text-xs text-muted-foreground">Mínimo</div>
                                                <Input
                                                    inputMode="numeric"
                                                    placeholder="0"
                                                    value={draftMinPrice}
                                                    onChange={(e) => setDraftMinPrice(e.target.value.replace(/[^0-9.]/g, ''))}
                                                />
                                            </div>
                                            <div className="space-y-1">
                                                <div className="text-xs text-muted-foreground">Máximo</div>
                                                <Input
                                                    inputMode="numeric"
                                                    placeholder="9999"
                                                    value={draftMaxPrice}
                                                    onChange={(e) => setDraftMaxPrice(e.target.value.replace(/[^0-9.]/g, ''))}
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="pt-4 border-t">
                                        <button
                                            type="button"
                                            className="w-full flex items-center justify-between rounded-md border border-border px-3 py-2 text-sm"
                                            onClick={() => setDraftOnlyInStock((v) => !v)}
                                        >
                                            <span className="font-medium">Solo en stock</span>
                                            <span className={draftOnlyInStock ? 'text-primary font-semibold' : 'text-muted-foreground'}>
                                                {draftOnlyInStock ? 'Sí' : 'No'}
                                            </span>
                                        </button>
                                    </div>
                                </div>

                                <SheetFooter className="border-t">
                                    <div className="w-full space-y-2">
                                        <div className="text-sm text-muted-foreground">
                                            {previewFilteredProducts.length} artículos encontrados
                                        </div>
                                        <Button
                                            className="w-full"
                                            onClick={() => {
                                                setSelectedCategory(draftCategory)
                                                setSort(draftSort)
                                                setMinPrice(draftMinPrice)
                                                setMaxPrice(draftMaxPrice)
                                                setOnlyInStock(draftOnlyInStock)
                                                updateUrl(
                                                    {
                                                        cat: draftCategory !== 'all' ? draftCategory : undefined,
                                                        sort: draftSort !== 'name-asc' ? draftSort : undefined,
                                                        min: draftMinPrice || undefined,
                                                        max: draftMaxPrice || undefined,
                                                        stock: draftOnlyInStock ? '1' : undefined,
                                                    },
                                                    'push'
                                                )
                                                setFiltersOpen(false)
                                            }}
                                        >
                                            Aplicar
                                        </Button>
                                    </div>
                                </SheetFooter>
                            </SheetContent>
                        </Sheet>

                        {/* Category Filter */}
                        <div className="flex gap-2 flex-wrap">
                            <Button
                                variant={selectedCategory === "all" ? "default" : "outline"}
                                size="sm"
                                onClick={() => {
                                    setSelectedCategory("all")
                                    updateUrl({ cat: undefined }, 'replace')
                                }}
                            >
                                Todos
                            </Button>
                            {categorias.map(cat => (
                                <Button
                                    key={cat.id}
                                    variant={selectedCategory === cat.id.toString() ? "default" : "outline"}
                                    size="sm"
                                    onClick={() => {
                                        setSelectedCategory(cat.id.toString())
                                        updateUrl({ cat: cat.id.toString() }, 'replace')
                                    }}
                                >
                                    {cat.nombre}
                                </Button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Products Grid */}
                {loading ? (
                    <div className="text-center py-20">
                        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
                        <p className="text-muted-foreground">Cargando productos...</p>
                    </div>
                ) : filteredProducts.length === 0 ? (
                    <div className="text-center py-20">
                        <p className="text-muted-foreground text-lg">No se encontraron productos.</p>
                        {searchQuery && (
                            <Button variant="link" onClick={() => setSearchQuery("")}>
                                Limpiar búsqueda
                            </Button>
                        )}
                    </div>
                ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                        {filteredProducts.map((producto) => {
                            const quantity = getItemQuantity(producto.id)

                            return (
                                <div key={producto.id} className="bg-card rounded-xl shadow-sm border border-border overflow-hidden group hover:shadow-lg transition-all">
                                    {/* Image */}
                                    <div className="aspect-square bg-popover relative overflow-hidden">
                                        <Link href={`/productos/${producto.id}`} className="absolute inset-0">
                                            {((Array.isArray((producto as any).imagenes) && ((producto as any).imagenes as string[]).filter(Boolean).length > 0) || producto.imagen_url) ? (
                                                <ProductImageCarousel
                                                    images={
                                                        (Array.isArray((producto as any).imagenes)
                                                            ? (((producto as any).imagenes as string[]) || []).filter(Boolean).slice(0, 10)
                                                            : producto.imagen_url
                                                                ? [producto.imagen_url]
                                                                : [])
                                                    }
                                                    alt={producto.nombre}
                                                    className="group-hover:scale-105 transition-transform duration-300"
                                                    autoPlay
                                                    intervalMs={2500}
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                                                    Sin imagen
                                                </div>
                                            )}
                                        </Link>
                                        {producto.stock <= 0 && (
                                            <div className="absolute inset-0 bg-foreground/60 flex items-center justify-center">
                                                <span className="text-sidebar-primary-foreground font-bold">Agotado</span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Info */}
                                    <div className="p-4">
                                        <Link href={`/productos/${producto.id}`} className="hover:underline">
                                            <h3 className="font-semibold text-foreground mb-1 line-clamp-2">{producto.nombre}</h3>
                                        </Link>
                                        <p className="text-xl font-bold text-primary mb-3">{formatCurrency(producto.precio)}</p>

                                        {producto.stock > 0 ? (
                                            quantity === 0 ? (
                                                <Button
                                                    className="w-full gap-2"
                                                    onClick={() => addItem(producto)}
                                                >
                                                    <ShoppingCart className="h-4 w-4" />
                                                    Agregar
                                                </Button>
                                            ) : (
                                                <div className="flex items-center justify-between bg-popover rounded-lg p-1">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8"
                                                        onClick={() => updateQuantity(producto.id, quantity - 1)}
                                                    >
                                                        <Minus className="h-4 w-4" />
                                                    </Button>
                                                    <span className="font-bold">{quantity}</span>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8"
                                                        onClick={() => updateQuantity(producto.id, quantity + 1)}
                                                    >
                                                        <Plus className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            )
                                        ) : (
                                            <Button disabled className="w-full">
                                                Sin Stock
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                )}
            </div>
        </div>
    )
}
