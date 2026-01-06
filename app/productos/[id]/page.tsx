import type { Metadata } from "next"
import { createClient } from "@supabase/supabase-js"
import ProductoDetalleClient from "./producto-detalle-client"

function parseProductId(raw: string) {
    const direct = Number(raw)
    if (Number.isFinite(direct) && direct > 0) return direct
    const match = String(raw).match(/(\d+)(?:\D*)$/)
    if (match && match[1]) return Number(match[1])
    return 0
}

async function fetchProductForMeta(id: number) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    if (!supabaseUrl || !supabaseAnonKey) return null

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
        auth: { persistSession: false },
    })

    const { data, error } = await supabase
        .from("productos")
        .select("id, nombre, descripcion, imagen_url, imagenes")
        .eq("id", id)
        .maybeSingle()

    if (error) return null
    return data
}

function buildDescription(p: any) {
    const raw = String(p?.descripcion || "").trim()
    const safe = raw.replace(/\s+/g, " ").slice(0, 160)
    if (safe) return safe
    return "Compra online con entrega rápida y compra segura."
}

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
    const id = parseProductId(params.id)
    if (!id) {
        return {
            title: "Producto",
            description: "Detalle de producto",
        }
    }

    const product = await fetchProductForMeta(id)
    if (!product) {
        return {
            title: "Producto",
            description: "Detalle de producto",
        }
    }

    const title = String((product as any).nombre || "Producto")
    const description = buildDescription(product)
    const imgs = Array.isArray((product as any).imagenes) ? ((product as any).imagenes as string[]).filter(Boolean) : []
    const primaryImage = imgs[0] || String((product as any).imagen_url || "")

    return {
        title,
        description,
        openGraph: {
            title,
            description,
            images: primaryImage ? [{ url: primaryImage }] : [],
        },
        twitter: {
            card: "summary_large_image",
            title,
            description,
            images: primaryImage ? [primaryImage] : [],
        },
    }
}

export default function ProductoDetallePage() {
    return <ProductoDetalleClient />
}
