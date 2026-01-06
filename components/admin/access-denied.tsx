"use client"

import { Button } from "@/components/ui/button"
import { ShieldAlert } from "lucide-react"
import { useRouter } from "next/navigation"

interface AccessDeniedProps {
    title?: string
    message?: string
}

export function AccessDenied({
    title = "Acceso Restringido",
    message = "No tienes permisos para acceder a esta sección. Esta sección está disponible solo para administradores.",
}: AccessDeniedProps) {
    const router = useRouter()

    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
            <div className="h-20 w-20 bg-red-100 rounded-full flex items-center justify-center mb-6">
                <ShieldAlert className="h-10 w-10 text-red-500" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">{title}</h1>
            <p className="text-gray-500 max-w-md mb-6">{message}</p>
            <Button onClick={() => router.push('/admin/dashboard')}>
                Volver al Dashboard
            </Button>
        </div>
    )
}
