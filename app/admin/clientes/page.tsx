
"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabaseClient"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Search, MapPin, Phone, History } from "lucide-react"

export default function ClientesPage() {
    const [clientes, setClientes] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchClientes()
    }, [])

    async function fetchClientes() {
        setLoading(true)
        const { data } = await supabase
            .from('clientes')
            .select('*')
            .order('id', { ascending: false }) // Más recientes primero
        if (data) setClientes(data)
        setLoading(false)
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Clientes</h1>
                    <p className="text-gray-500">Base de datos de tus compradores.</p>
                </div>
            </div>

            <div className="flex gap-2 bg-white p-4 rounded-xl shadow-sm border">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input placeholder="Buscar por nombre, teléfono o DNI..." className="pl-9 border-gray-200" />
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
                <Table>
                    <TableHeader className="bg-gray-50">
                        <TableRow>
                            <TableHead>Nombre</TableHead>
                            <TableHead>Contacto</TableHead>
                            <TableHead>Dirección Registrada</TableHead>
                            <TableHead className="text-right">Historial</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={4} className="text-center py-10">Cargando...</TableCell>
                            </TableRow>
                        ) : clientes.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={4} className="text-center py-10">No hay clientes aún.</TableCell>
                            </TableRow>
                        ) : (
                            clientes.map((cliente) => (
                                <TableRow key={cliente.id}>
                                    <TableCell className="font-bold text-gray-800">{cliente.nombre}</TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2 text-sm text-gray-600">
                                            <Phone className="h-3 w-3" /> {cliente.telefono}
                                        </div>
                                        <div className="text-xs text-gray-500 mt-1">DNI: {cliente.dni || '—'}</div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-start gap-2 text-sm text-gray-500 max-w-[300px]">
                                            <MapPin className="h-3 w-3 mt-1 flex-shrink-0" />
                                            <span className="line-clamp-2">{cliente.direccion || 'Sin dirección'}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Button variant="outline" size="sm" className="gap-2">
                                            <History className="h-3 w-3" /> Ver Pedidos
                                        </Button>
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
