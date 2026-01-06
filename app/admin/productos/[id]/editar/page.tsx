"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { supabase } from "@/lib/supabaseClient"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { ProductForm } from "@/components/admin/product-form"
import { ArrowLeft } from "lucide-react"
import { useRoleGuard } from "@/lib/use-role-guard"
import { AccessDenied } from "@/components/admin/access-denied"

export default function EditarProductoPage() {
    const router = useRouter()
    const params = useParams()
    const id = params.id as string

    const guard = useRoleGuard({ allowedRoles: ['admin'] })

    const [loading, setLoading] = useState(true)
    const [producto, setProducto] = useState<any>(null)

    useEffect(() => {
        if (guard.loading || guard.accessDenied) return
        loadProducto()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id, guard.loading, guard.accessDenied])

    async function loadProducto() {
        setLoading(true)

        const numericId = Number(id)
        if (!numericId) {
            setProducto(null)
            setLoading(false)
            return
        }

        const { data, error } = await supabase
            .from('productos')
            .select('*')
            .eq('id', numericId)
            .single()

        if (error) {
            setProducto(null)
        } else {
            setProducto(data)
        }

        setLoading(false)
    }

    if (guard.accessDenied) return <AccessDenied />

    if (guard.loading) {
        return <div className="p-6 text-muted-foreground">Cargando...</div>
    }

    if (loading) {
        return <div className="p-6 text-muted-foreground">Cargando...</div>
    }

    if (!producto) {
        return (
            <div className="space-y-4">
                <Button variant="ghost" className="gap-2" asChild>
                    <Link href="/admin/productos">
                        <ArrowLeft className="h-4 w-4" /> Volver
                    </Link>
                </Button>
                <Card className="bg-white rounded-xl shadow-sm border">
                    <CardContent className="p-6">
                        <div className="text-lg font-bold text-gray-900">Producto no encontrado</div>
                        <div className="text-sm text-gray-500">Puede que haya sido eliminado o no exista.</div>
                    </CardContent>
                </Card>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between gap-3">
                <Button variant="ghost" className="gap-2" asChild>
                    <Link href="/admin/productos">
                        <ArrowLeft className="h-4 w-4" /> Volver
                    </Link>
                </Button>
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Editar Producto</h1>
                    <p className="text-gray-500">Actualiza la información del producto.</p>
                </div>
                <div />
            </div>

            <Card className="bg-white rounded-xl shadow-sm border">
                <CardContent className="p-6">
                    <ProductForm
                        productToEdit={producto}
                        onSuccess={() => router.push('/admin/productos')}
                        onCancel={() => router.push('/admin/productos')}
                    />
                </CardContent>
            </Card>
        </div>
    )
}
