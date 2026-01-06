"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { ProductForm } from "@/components/admin/product-form"
import { ArrowLeft } from "lucide-react"
import { useRoleGuard } from "@/lib/use-role-guard"
import { AccessDenied } from "@/components/admin/access-denied"

export default function NuevoProductoPage() {
    const router = useRouter()
    const guard = useRoleGuard({ allowedRoles: ['admin'] })

    if (guard.accessDenied) return <AccessDenied />

    if (guard.loading) {
        return <div className="p-6 text-muted-foreground">Cargando...</div>
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
                    <h1 className="text-3xl font-bold text-gray-900">Nuevo Producto</h1>
                    <p className="text-gray-500">Completa la información del producto.</p>
                </div>
                <div />
            </div>

            <Card className="bg-white rounded-xl shadow-sm border">
                <CardContent className="p-6">
                    <ProductForm
                        onSuccess={() => router.push('/admin/productos')}
                        onCancel={() => router.push('/admin/productos')}
                    />
                </CardContent>
            </Card>
        </div>
    )
}
