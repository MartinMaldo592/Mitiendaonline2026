"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { supabase } from "@/lib/supabaseClient"
import { Button } from "@/components/ui/button"
import { formatCurrency } from "@/lib/utils"

export default function PedidoTicketPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string

  const [pedido, setPedido] = useState<any>(null)
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id) return
    fetchTicket()
  }, [id])

  async function fetchTicket() {
    setLoading(true)

    const { data: pedidoData, error } = await supabase
      .from("pedidos")
      .select(
        `
          *,
          clientes (*)
        `
      )
      .eq("id", id)
      .single()

    if (error) {
      setLoading(false)
      return
    }

    const { data: itemsData } = await supabase
      .from("pedido_items")
      .select(
        `
          *,
          productos (nombre, precio)
        `
      )
      .eq("pedido_id", id)

    setPedido(pedidoData)
    setItems(itemsData || [])
    setLoading(false)
  }

  if (loading) {
    return <div className="p-10 text-center">Cargando ticket...</div>
  }

  if (!pedido) {
    return <div className="p-10 text-center">Pedido no encontrado</div>
  }

  const subtotal = Number(pedido.subtotal ?? pedido.total)
  const descuento = Number(pedido.descuento ?? 0)
  const total = Number(pedido.total ?? 0)

  return (
    <div className="max-w-2xl mx-auto p-6 print:p-0">
      <div className="flex items-center justify-between gap-2 mb-6 print:hidden">
        <Button variant="outline" onClick={() => router.back()}>
          Volver
        </Button>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => window.print()}>
            Imprimir / Guardar PDF
          </Button>
        </div>
      </div>

      <div className="border border-border rounded-lg p-6 bg-card text-card-foreground print:border-0 print:rounded-none print:p-0">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold">Ticket de Pedido</h1>
            <p className="text-sm text-muted-foreground">
              #{String(pedido.id).padStart(6, "0")} • {new Date(pedido.created_at).toLocaleString()}
            </p>
          </div>
          <div className="text-right text-sm">
            <div className="font-medium">Estado</div>
            <div className="text-muted-foreground">{pedido.status}</div>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="border border-border rounded-md p-4">
            <div className="font-semibold">Cliente</div>
            <div className="text-sm mt-1">{pedido.clientes?.nombre || ""}</div>
            <div className="text-sm text-muted-foreground">DNI: {pedido.clientes?.dni || ""}</div>
            <div className="text-sm text-muted-foreground">{pedido.clientes?.telefono || ""}</div>
          </div>
          <div className="border border-border rounded-md p-4">
            <div className="font-semibold">Entrega</div>
            <div className="text-sm mt-1">{pedido.clientes?.direccion || ""}</div>
          </div>
        </div>

        <div className="mt-6">
          <div className="font-semibold mb-2">Productos</div>
          <div className="border border-border rounded-md overflow-hidden">
            <div className="grid grid-cols-12 gap-2 p-3 bg-popover text-sm font-medium">
              <div className="col-span-6">Producto</div>
              <div className="col-span-2 text-right">Cant.</div>
              <div className="col-span-2 text-right">Unit.</div>
              <div className="col-span-2 text-right">Importe</div>
            </div>
            {items.map((it) => {
              const unit = Number(it.productos?.precio ?? 0)
              const qty = Number(it.cantidad ?? 0)
              const line = unit * qty
              return (
                <div key={it.id} className="grid grid-cols-12 gap-2 p-3 border-t border-border text-sm">
                  <div className="col-span-6">{it.productos?.nombre || "Producto"}</div>
                  <div className="col-span-2 text-right">{qty}</div>
                  <div className="col-span-2 text-right">{formatCurrency(unit)}</div>
                  <div className="col-span-2 text-right">{formatCurrency(line)}</div>
                </div>
              )
            })}
          </div>
        </div>

        <div className="mt-6 border-t border-border pt-4 space-y-2">
          {pedido.cupon_codigo && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Cupón</span>
              <span className="font-medium">{pedido.cupon_codigo}</span>
            </div>
          )}
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Subtotal</span>
            <span className="font-medium">{formatCurrency(subtotal)}</span>
          </div>
          {descuento > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Descuento</span>
              <span className="font-medium">- {formatCurrency(descuento)}</span>
            </div>
          )}
          <div className="flex justify-between text-base font-bold">
            <span>Total</span>
            <span>{formatCurrency(total)}</span>
          </div>

          <div className="pt-3 text-xs text-muted-foreground">
            Pago: {pedido.pago_status}
          </div>
        </div>
      </div>
    </div>
  )
}
