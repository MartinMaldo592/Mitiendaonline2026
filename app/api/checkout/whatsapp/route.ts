import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export const runtime = "nodejs"

function getEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const service = process.env.SUPABASE_SERVICE_ROLE_KEY
  return { url, service }
}

function normalizeDigits(v: unknown) {
  return String(v ?? "").replace(/\D/g, "")
}

function normalizeText(v: unknown) {
  return String(v ?? "").trim()
}

type CheckoutItemInput = {
  id: number
  quantity: number
  precio?: number
  nombre?: string
  producto_variante_id?: number | null
  variante_nombre?: string | null
}

export async function POST(req: Request) {
  try {
    const { url, service } = getEnv()
    if (!url || !service) {
      return NextResponse.json({ error: "Server env not configured" }, { status: 500 })
    }

    const body = await req.json()

    const name = normalizeText(body?.name)
    const phone = normalizeDigits(body?.phone)
    const dni = normalizeDigits(body?.dni).slice(0, 8)
    const address = normalizeText(body?.address)
    const reference = normalizeText(body?.reference)
    const locationLink = normalizeText(body?.locationLink)

    const couponCode = normalizeText(body?.couponCode) || null
    const discountRaw = Number(body?.discountAmount ?? 0)

    const itemsRaw = Array.isArray(body?.items) ? (body.items as any[]) : []
    const items: CheckoutItemInput[] = itemsRaw
      .map((it) => ({
        id: Number(it?.id ?? 0),
        quantity: Number(it?.quantity ?? 0),
        precio: it?.precio != null ? Number(it.precio) : undefined,
        nombre: it?.nombre != null ? String(it.nombre) : undefined,
        producto_variante_id: it?.producto_variante_id != null ? Number(it.producto_variante_id) : null,
        variante_nombre: it?.variante_nombre != null ? String(it.variante_nombre) : null,
      }))
      .filter((it) => Number.isFinite(it.id) && it.id > 0 && Number.isFinite(it.quantity) && it.quantity > 0)

    if (!name) return NextResponse.json({ error: "Nombre requerido" }, { status: 400 })
    if (!phone) return NextResponse.json({ error: "Teléfono requerido" }, { status: 400 })
    if (dni.length !== 8) return NextResponse.json({ error: "DNI inválido" }, { status: 400 })
    if (!address) return NextResponse.json({ error: "Dirección requerida" }, { status: 400 })
    if (items.length === 0) return NextResponse.json({ error: "Items inválidos" }, { status: 400 })

    const subtotal = Math.max(
      0,
      Math.round(
        items.reduce((acc, it) => {
          const unit = Number(it.precio ?? 0) || 0
          return acc + unit * (Number(it.quantity) || 0)
        }, 0) * 100
      ) / 100
    )

    const discountAmount = Math.max(0, Math.min(subtotal, Number.isFinite(discountRaw) ? discountRaw : 0))
    const total = Math.max(0, Math.round((subtotal - discountAmount) * 100) / 100)

    const direccionCompleta = `${address} ${reference ? `(Ref: ${reference})` : ""} ${locationLink ? `[Link: ${locationLink}]` : ""}`.trim()

    const supabaseAdmin = createClient(url, service)

    // A. Cliente
    let clienteId: number | null = null
    const { data: existingClients, error: existingClientsError } = await supabaseAdmin
      .from("clientes")
      .select("id")
      .eq("telefono", phone)
      .limit(1)

    if (existingClientsError) {
      return NextResponse.json({ error: existingClientsError.message }, { status: 400 })
    }

    if (existingClients && existingClients.length > 0) {
      clienteId = Number((existingClients as any)[0]?.id)
      const { error: updErr } = await supabaseAdmin
        .from("clientes")
        .update({ nombre: name, dni, direccion: direccionCompleta })
        .eq("id", clienteId)

      if (updErr) {
        return NextResponse.json({ error: updErr.message }, { status: 400 })
      }
    } else {
      const { data: newClient, error: clientError } = await supabaseAdmin
        .from("clientes")
        .insert({ nombre: name, telefono: phone, dni, direccion: direccionCompleta })
        .select()
        .single()

      if (clientError) {
        return NextResponse.json({ error: clientError.message }, { status: 400 })
      }

      clienteId = Number((newClient as any)?.id)
    }

    if (!clienteId) {
      return NextResponse.json({ error: "No se pudo crear cliente" }, { status: 500 })
    }

    // B. Pedido
    const insertPedidoFull = async () => {
      return supabaseAdmin
        .from("pedidos")
        .insert({
          cliente_id: clienteId,
          subtotal,
          descuento: discountAmount,
          cupon_codigo: couponCode,
          total,
          status: "Pendiente",
          pago_status: "Pago Contraentrega",
        })
        .select()
        .single()
    }

    const insertPedidoFallback = async () => {
      return supabaseAdmin
        .from("pedidos")
        .insert({
          cliente_id: clienteId,
          total,
          status: "Pendiente",
          pago_status: "Pago Contraentrega",
        })
        .select()
        .single()
    }

    const { data: pedidoFull, error: pedidoFullErr } = await insertPedidoFull()

    let pedido = pedidoFull as any

    if (pedidoFullErr) {
      if ((couponCode && couponCode.length > 0) || discountAmount > 0) {
        return NextResponse.json({ error: pedidoFullErr.message }, { status: 400 })
      }

      const { data: pedidoFallback, error: pedidoFallbackErr } = await insertPedidoFallback()
      if (pedidoFallbackErr) {
        return NextResponse.json({ error: pedidoFallbackErr.message }, { status: 400 })
      }
      pedido = pedidoFallback as any
    }

    const pedidoId = Number(pedido?.id ?? 0)
    if (!pedidoId) {
      return NextResponse.json({ error: "No se pudo crear pedido" }, { status: 500 })
    }

    // C. Items
    const orderItems = items.map((item) => ({
      pedido_id: pedidoId,
      producto_id: item.id,
      producto_variante_id: item.producto_variante_id ?? null,
      precio_unitario: Number(item.precio ?? 0) || 0,
      producto_nombre: item.nombre ? String(item.nombre) : null,
      variante_nombre: item.variante_nombre ? String(item.variante_nombre) : null,
      cantidad: Number(item.quantity) || 1,
    }))

    const { error: itemsError } = await supabaseAdmin.from("pedido_items").insert(orderItems)
    if (itemsError) {
      return NextResponse.json({ error: itemsError.message }, { status: 400 })
    }

    return NextResponse.json({
      ok: true,
      orderId: pedidoId,
      subtotal,
      descuento: discountAmount,
      total,
    })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Unknown error" }, { status: 500 })
  }
}
