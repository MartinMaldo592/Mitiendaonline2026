"use client"

import { useState } from "react"
import { useLoadScript } from "@react-google-maps/api"
import usePlacesAutocomplete, {
    getGeocode,
    getLatLng,
} from "use-places-autocomplete"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ArrowLeft, Loader2, MapPin } from "lucide-react"
import { supabase } from "@/lib/supabaseClient"
import { formatCurrency } from "@/lib/utils"

// Define libraries array outside component to prevent re-renders
const libraries: ("places")[] = ["places"];

interface CheckoutFormProps {
    items: any[]
    total: number
    onBack: () => void
    onComplete: () => void
}

export function CheckoutForm({ items, total, onBack, onComplete }: CheckoutFormProps) {
    const { isLoaded } = useLoadScript({
        googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "",
        libraries: libraries,
    })

    if (!isLoaded) {
        return (
            <div className="flex flex-col items-center justify-center h-48 space-y-4">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">Cargando mapa...</p>
            </div>
        )
    }

    return <FormContent items={items} total={total} onBack={onBack} onComplete={onComplete} />
}


function FormContent({ items, total, onBack, onComplete }: CheckoutFormProps) {
    const [name, setName] = useState("")
    const [phone, setPhone] = useState("")
    const [dni, setDni] = useState("")
    const [dniError, setDniError] = useState("")
    const [reference, setReference] = useState("")
    const [locationLink, setLocationLink] = useState("")
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [waPromptOpen, setWaPromptOpen] = useState(false)
    const [waUrl, setWaUrl] = useState<string | null>(null)
    const [couponCode, setCouponCode] = useState("")
    const [couponDiscount, setCouponDiscount] = useState(0)
    const [couponApplying, setCouponApplying] = useState(false)
    const [couponError, setCouponError] = useState("")
    const [couponApplied, setCouponApplied] = useState(false)

    const {
        ready,
        value,
        setValue,
        suggestions: { status, data },
        clearSuggestions,
    } = usePlacesAutocomplete({
        requestOptions: {
            componentRestrictions: { country: "pe" },
        },
    })

    const handleSelect = async (address: string) => {
        setValue(address, false)
        clearSuggestions()

        try {
            const results = await getGeocode({ address })
            const { lat, lng } = await getLatLng(results[0])
            setLocationLink(`https://www.google.com/maps/?q=${lat},${lng}`)
        } catch (error) {
            console.error("Error: ", error)
        }
    }

    const validateCoupon = async (rawCode: string, subtotal: number) => {
        const code = rawCode.trim()
        if (!code) {
            return { descuento: 0, codigo: null as string | null }
        }

        const { data, error } = await supabase
            .from('cupones')
            .select('*')
            .ilike('codigo', code)
            .limit(1)
            .maybeSingle()

        if (error) throw new Error(error.message)
        if (!data) throw new Error('Cupón inválido')
        if (!data.activo) throw new Error('Cupón inactivo')
        if (Number(subtotal) < Number(data.min_total || 0)) throw new Error('El cupón no aplica para este total')

        const now = new Date()
        if (data.starts_at) {
            const starts = new Date(data.starts_at)
            if (now < starts) throw new Error('El cupón aún no está disponible')
        }
        if (data.expires_at) {
            const expires = new Date(data.expires_at)
            if (now > expires) throw new Error('El cupón expiró')
        }
        if (data.max_usos != null && data.usos != null && Number(data.usos) >= Number(data.max_usos)) {
            throw new Error('El cupón ya alcanzó el máximo de usos')
        }

        let descuento = 0
        const valor = Number(data.valor) || 0

        if (data.tipo === 'porcentaje') {
            descuento = subtotal * (valor / 100)
        } else {
            descuento = valor
        }

        descuento = Math.max(0, Math.min(subtotal, Math.round(descuento * 100) / 100))

        return { descuento, codigo: data.codigo as string }
    }

    const subtotalAmount = Number(total) || 0
    const discountAmount = Math.max(0, Math.min(subtotalAmount, Number(couponDiscount) || 0))
    const totalToPay = Math.max(0, Math.round((subtotalAmount - discountAmount) * 100) / 100)

    const isCouponRelatedError = (message: string) => {
        const m = String(message || '').toLowerCase()
        return (
            m.includes('cupón') ||
            m.includes('cupon') ||
            m.includes('agotado') ||
            m.includes('expir') ||
            m.includes('inval') ||
            m.includes('no aplica') ||
            m.includes('aún no')
        )
    }

    function isInAppBrowser() {
        const ua = String(navigator?.userAgent || '')
        const uaLower = ua.toLowerCase()

        if (uaLower.includes('fban') || uaLower.includes('fbav')) return true
        if (uaLower.includes('instagram')) return true
        if (uaLower.includes('tiktok')) return true
        if (uaLower.includes('snapchat')) return true
        if (uaLower.includes('pinterest')) return true
        if (uaLower.includes('linkedinapp')) return true
        if (uaLower.includes('wv') || uaLower.includes('; wv')) return true
        if (uaLower.includes('webview')) return true
        return false
    }

    const handleApplyCoupon = async () => {
        setCouponError("")
        setCouponApplying(true)
        setCouponApplied(false)
        try {
            const res = await validateCoupon(couponCode, subtotalAmount)
            setCouponDiscount(res.descuento)
            setCouponApplied(res.descuento > 0)
        } catch (err: any) {
            setCouponDiscount(0)
            setCouponApplied(false)
            setCouponError(err?.message || 'No se pudo aplicar el cupón')
        } finally {
            setCouponApplying(false)
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsSubmitting(true)

        setCouponError("")
        setDniError("")

        const normalizedDni = String(dni || '').replace(/\D/g, '').slice(0, 8)
        if (normalizedDni.length !== 8) {
            setDniError('El DNI debe tener 8 dígitos')
            setIsSubmitting(false)
            return
        }

        let appliedCouponCode: string | null = null
        let appliedDiscount = discountAmount
        if (couponCode.trim()) {
            try {
                const res = await validateCoupon(couponCode, subtotalAmount)
                appliedCouponCode = res.codigo
                appliedDiscount = res.descuento
            } catch (err: any) {
                setCouponError(err?.message || 'Cupón inválido')
                setIsSubmitting(false)
                return
            }
        }

        const finalDiscount = Math.max(0, Math.min(subtotalAmount, Number(appliedDiscount) || 0))
        const finalTotal = Math.max(0, Math.round((subtotalAmount - finalDiscount) * 100) / 100)

        // Construimos el mensaje del pedido SYNCRONAMENTE usando los datos del formulario
        // y los items disponibles. De esta forma podemos abrir la URL de WhatsApp
        // en una nueva pestaña inmediatamente (evento de usuario) y evitar bloqueos.
        let messageClientePreview = `¡Hola! Soy ${name || 'Cliente'}. Quiero confirmar mi pedido: 🛍️\n`;
        messageClientePreview += `*DATOS DE ENVÍO*:\n`;
        messageClientePreview += `Cliente: ${name}\n`;
        messageClientePreview += `DNI: ${normalizedDni}\n`;
        messageClientePreview += `Teléfono: ${phone}\n`;
        messageClientePreview += `Dirección: ${value || ''}\n`;
        if (reference) messageClientePreview += `Referencia: ${reference}\n`;
        if (locationLink) messageClientePreview += `Ubicación: ${locationLink}\n`;
        messageClientePreview += `\n*DETALLE DEL PEDIDO:*\n`;
        items.forEach(item => {
            messageClientePreview += `• ${item.quantity} x ${item.nombre} - ${formatCurrency(item.precio * item.quantity)}\n`;
        })
        if (finalDiscount > 0 && appliedCouponCode) {
            messageClientePreview += `\n*SUBTOTAL: ${formatCurrency(subtotalAmount)}*`;
            messageClientePreview += `\n*CUPÓN (${appliedCouponCode}): -${formatCurrency(finalDiscount)}*`;
        }
        messageClientePreview += `\n*TOTAL: ${formatCurrency(finalTotal)}*`;

        const phoneNumberClienteInit = process.env.NEXT_PUBLIC_WHATSAPP_TIENDA || "982432561";

        // Abrimos WhatsApp DIRECTO por API (sin páginas intermedias) en una pestaña nueva
        // para que la tienda no se cierre.
        // Pre-abrimos la pestaña en blanco durante el click del usuario para minimizar bloqueos.
        const inApp = isInAppBrowser()
        let popup: Window | null = null
        if (!inApp) {
            popup = window.open('about:blank', '_blank')
            if (popup) {
                try {
                    ;(popup as any).opener = null
                } catch (err) {
                }
            }
        }


        try {
            // A. Cliente
            let clienteId: number;
            const { data: existingClients, error: existingClientsError } = await supabase
                .from('clientes')
                .select('id')
                .eq('telefono', phone)
                .limit(1)

            if (existingClientsError) throw new Error(existingClientsError.message)

            const direccionCompleta = `${value} ${reference ? `(Ref: ${reference})` : ''} ${locationLink ? `[Link: ${locationLink}]` : ''}`.trim()

            if (existingClients && existingClients.length > 0) {
                clienteId = existingClients[0].id
                const { error: updErr } = await supabase
                    .from('clientes')
                    .update({ nombre: name, dni: normalizedDni, direccion: direccionCompleta })
                    .eq('id', clienteId)
                if (updErr) throw new Error(updErr.message)
            } else {
                const { data: newClient, error: clientError } = await supabase
                    .from('clientes')
                    .insert({ nombre: name, telefono: phone, dni: normalizedDni, direccion: direccionCompleta })
                    .select()
                    .single()

                if (clientError) throw new Error(clientError.message)
                clienteId = newClient.id
            }

            // B. Pedido
            let newOrder: any = null
            const { data: orderWithCoupon, error: orderWithCouponError } = await supabase
                .from('pedidos')
                .insert({
                    cliente_id: clienteId,
                    subtotal: subtotalAmount,
                    descuento: finalDiscount,
                    cupon_codigo: appliedCouponCode,
                    total: finalTotal,
                    status: 'Pendiente',
                    pago_status: 'Pago Contraentrega'
                })
                .select()
                .single()

            if (orderWithCouponError) {
                // Si el cliente ingresó cupón, NO hacemos fallback: debe fallar para no crear pedidos inconsistentes.
                if (appliedCouponCode || finalDiscount > 0) {
                    throw new Error(orderWithCouponError.message)
                }
                const { data: orderFallback, error: orderFallbackError } = await supabase
                    .from('pedidos')
                    .insert({ cliente_id: clienteId, total: finalTotal, status: 'Pendiente', pago_status: 'Pago Contraentrega' })
                    .select()
                    .single()

                if (orderFallbackError) throw new Error(orderFallbackError.message)
                newOrder = orderFallback
            } else {
                newOrder = orderWithCoupon
            }

            // C. Items
            const orderItems = items.map(item => ({
                pedido_id: newOrder.id,
                producto_id: item.id,
                producto_variante_id: (item as any).producto_variante_id ?? null,
                precio_unitario: Number((item as any).precio ?? 0),
                producto_nombre: String((item as any).nombre ?? ''),
                variante_nombre: (item as any).variante_nombre ?? null,
                cantidad: item.quantity
            }))

            const { error: itemsError } = await supabase.from('pedido_items').insert(orderItems)
            if (itemsError) throw new Error(itemsError.message)

            // E. WhatsApp mensaje al cliente
            const phoneNumberCliente = process.env.NEXT_PUBLIC_WHATSAPP_TIENDA || "982432561"
            const orderIdFormatted = newOrder.id.toString().padStart(6, '0')

            let messageCliente = `¡Hola! Soy ${name}. Quiero confirmar mi pedido: 🛍️\n`
            messageCliente += `📋 *Pedido #${orderIdFormatted}*\n\n`
            messageCliente += `*DATOS DE ENVÍO* 📦\n`
            messageCliente += `👤 *Cliente:* ${name}\n`
            messageCliente += `🪪 *DNI:* ${normalizedDni}\n`
            messageCliente += `📱 *Teléfono:* ${phone}\n`
            messageCliente += `📍 *Dirección:* ${value}\n`
            if (reference) messageCliente += `🏠 *Referencia:* ${reference}\n`
            if (locationLink) messageCliente += `🗺️ *Ubicación:* ${locationLink}\n`

            messageCliente += `\n--------------------------------\n\n`
            messageCliente += `*DETALLE DEL PEDIDO:*\n`
            items.forEach(item => {
                const vName = (item as any).variante_nombre ? ` (${String((item as any).variante_nombre)})` : ''
                messageCliente += `• ${item.quantity} x ${item.nombre}${vName}\n   Sub: ${formatCurrency(item.precio * item.quantity)}\n`
            })
            messageCliente += `\n--------------------------------\n`
            if (finalDiscount > 0 && appliedCouponCode) {
                messageCliente += `💵 *SUBTOTAL: ${formatCurrency(subtotalAmount)}*\n`
                messageCliente += `🏷️ *CUPÓN (${appliedCouponCode}): -${formatCurrency(finalDiscount)}*\n`
            }
            messageCliente += `💰 *TOTAL A PAGAR: ${formatCurrency(finalTotal)}*`

            // F. ⭐ NOTIFICACIÓN AUTOMÁTICA AL ADMIN (Twilio)
            try {
                const notifyRes = await fetch('/api/notify-admin', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        orderId: orderIdFormatted,
                        clientName: name,
                        clientDni: normalizedDni,
                        clientPhone: phone,
                        address: `${value} ${reference ? `(Ref: ${reference})` : ''}`,
                        items: items,
                        total: finalTotal,
                        panelLink: `${window.location.origin}/admin/pedidos/${newOrder.id}`
                    })
                })
                let notifyJson: any = null
                try {
                    notifyJson = await notifyRes.json()
                } catch (err) {
                    notifyJson = null
                }
                if (!notifyRes.ok) {
                    console.error('Admin notification failed:', notifyRes.status, notifyJson)
                } else {
                    console.log('Admin notification response:', notifyJson)
                }
            } catch (notifyError) {
                // No bloqueamos el flujo si falla la notificación
                console.error('Error sending admin notification:', notifyError)
            }

            // G. Preparar enlace de WhatsApp final (incluye id de pedido).
            const urlCliente = `https://api.whatsapp.com/send/?phone=${encodeURIComponent(phoneNumberCliente)}&text=${encodeURIComponent(messageCliente)}&type=phone_number&app_absent=0`

            try {
                localStorage.setItem(
                    'blama_last_order_success',
                    JSON.stringify({ orderId: orderIdFormatted, ts: Date.now() })
                )
            } catch (err) {
            }

            onComplete()

            try {
                if (inApp) {
                    window.location.href = urlCliente
                } else if (popup && !popup.closed) {
                    popup.location.href = urlCliente
                } else {
                    const opened = window.open(urlCliente, '_blank')
                    if (!opened) {
                        setWaUrl(urlCliente)
                        setWaPromptOpen(true)
                    }
                }
            } catch (err) {
                setWaUrl(urlCliente)
                setWaPromptOpen(true)
            }

        } catch (error: any) {
            console.error("Error al procesar:", error)

            const msg = String(error?.message || '')
            if (isCouponRelatedError(msg)) {
                setCouponDiscount(0)
                setCouponApplied(false)
                setCouponError(
                    `El cupón ya no está disponible o no es válido en este momento. ` +
                    `Vuelve a intentar aplicar el cupón o usa otro.\n\nDetalle: ${msg}`
                )
            } else {
                alert("Error al procesar el pedido: " + msg)
            }
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <>
        <form onSubmit={handleSubmit} className="flex flex-col h-full">
                <div className="p-4 border-b flex items-center gap-2 bg-popover">
                    <Button type="button" variant="ghost" size="icon" onClick={onBack} disabled={isSubmitting} className="h-8 w-8 hover:bg-popover/80">
                    <ArrowLeft className="h-4 w-4" />
                </Button>
                    <h3 className="font-semibold text-foreground">Datos de Envío</h3>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="name">Nombre Completo</Label>
                    <Input id="name" required placeholder="Juan Pérez" value={name} onChange={(e) => setName(e.target.value)} disabled={isSubmitting} />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="phone">Celular</Label>
                    <Input id="phone" required type="tel" placeholder="999 999 999" value={phone} onChange={(e) => setPhone(e.target.value)} disabled={isSubmitting} />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="dni">DNI</Label>
                    <Input
                        id="dni"
                        required
                        inputMode="numeric"
                        pattern="[0-9]{8}"
                        minLength={8}
                        maxLength={8}
                        placeholder="12345678"
                        value={dni}
                        onChange={(e) => {
                            const next = e.target.value.replace(/\D/g, '').slice(0, 8)
                            setDni(next)
                            if (dniError) setDniError("")
                        }}
                        onInvalid={(e) => {
                            e.currentTarget.setCustomValidity('Ingresa un DNI válido de 8 dígitos')
                        }}
                        onInput={(e) => {
                            e.currentTarget.setCustomValidity('')
                        }}
                        disabled={isSubmitting}
                    />
                    {dniError && <p className="text-xs text-destructive">{dniError}</p>}
                </div>

                <div className="space-y-2 relative">
                    <Label htmlFor="address">Dirección (Google Maps)</Label>
                    <div className="relative">
                        <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                            id="address"
                            value={value}
                            onChange={(e) => setValue(e.target.value)}
                            disabled={!ready || isSubmitting}
                            placeholder="Escribe tu dirección..."
                            className="pl-9"
                            autoComplete="off"
                        />
                    </div>
                    {status === "OK" && (
                        <ul className="absolute z-10 w-full bg-card border border-border rounded-md shadow-lg mt-1 max-h-60 overflow-auto">
                            {data.map(({ place_id, description }) => (
                                <li key={place_id} onClick={() => handleSelect(description)} className="px-4 py-2 hover:bg-popover cursor-pointer text-sm text-muted-foreground">
                                    {description}
                                </li>
                            ))}
                        </ul>
                    )}
                </div>

                <div className="space-y-2">
                    <Label htmlFor="reference">Referencia (Opcional)</Label>
                    <Input id="reference" placeholder="Frente al parque, casa azul..." value={reference} onChange={(e) => setReference(e.target.value)} disabled={isSubmitting} />
                </div>

                {!process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY && (
                    <div className="text-xs text-amber-600 bg-amber-50 p-2 rounded">⚠️ Nota: Autocompletado deshabilitado. Falta API Key.</div>
                )}
            </div>

            <div className="p-4 border-t mt-auto bg-popover">
                <div className="space-y-3 mb-4">
                    <div className="space-y-2">
                        <Label htmlFor="coupon">Cupón de descuento (Opcional)</Label>
                        <div className="flex gap-2">
                            <Input
                                id="coupon"
                                placeholder="Ej: PROMO10"
                                value={couponCode}
                                onChange={(e) => {
                                    setCouponCode(e.target.value)
                                    setCouponApplied(false)
                                    setCouponError("")
                                }}
                                disabled={isSubmitting}
                            />
                            <Button type="button" variant="outline" onClick={handleApplyCoupon} disabled={isSubmitting || couponApplying}>
                                {couponApplying ? <Loader2 className="h-4 w-4 animate-spin" /> : "Aplicar"}
                            </Button>
                        </div>
                        {couponError && (
                            <p className="text-xs text-destructive">{couponError}</p>
                        )}
                        {couponApplied && !couponError && (
                            <p className="text-xs text-green-600">Cupón aplicado</p>
                        )}
                    </div>

                    <div className="text-sm font-medium space-y-1">
                        <div className="flex justify-between items-center">
                            <span>Subtotal:</span>
                            <span>{formatCurrency(subtotalAmount)}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span>Descuento:</span>
                            <span>-{formatCurrency(discountAmount)}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span>Total a Pagar:</span>
                            <span className="text-lg font-bold">{formatCurrency(totalToPay)}</span>
                        </div>
                    </div>
                </div>
                <Button type="submit" className="w-full bg-green-600 hover:bg-green-700 h-12 text-base font-bold" disabled={isSubmitting}>
                    {isSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Procesando...</> : "Confirmar Pedido en WhatsApp"}
                </Button>
            </div>
        </form>
        {waPromptOpen && waUrl && (
            <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-4">
                <div className="w-full max-w-xl bg-card border border-border rounded-lg shadow-lg p-4">
                    <h3 className="text-lg font-semibold text-foreground">Abrir WhatsApp</h3>
                    <p className="text-sm text-muted-foreground mt-2">Pulsa el botón para abrir tu pedido en WhatsApp.</p>
                    <div className="mt-4 flex gap-3">
                        <a href={waUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center px-4 py-2 bg-green-600 text-white rounded-md">Abrir WhatsApp</a>
                        <button onClick={() => { setWaPromptOpen(false); setWaUrl(null) }} className="px-4 py-2 border border-border rounded-md">Cerrar</button>
                    </div>
                </div>
            </div>
        )}
        </>
    )
}
