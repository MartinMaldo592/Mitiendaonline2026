import { NextRequest, NextResponse } from 'next/server'
import twilio from 'twilio'

const currencyFormatter = new Intl.NumberFormat('es-PE', {
    style: 'currency',
    currency: 'PEN',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
})

// Twilio credentials from environment variables
const accountSid = process.env.TWILIO_ACCOUNT_SID
const authToken = process.env.TWILIO_AUTH_TOKEN
const twilioWhatsAppNumber = process.env.TWILIO_WHATSAPP_NUMBER // Format: whatsapp:+14155238886
const adminWhatsAppNumber = process.env.ADMIN_WHATSAPP_NUMBER // Format: whatsapp:+51982432561

export async function POST(request: NextRequest) {
    try {
        // Validate environment variables
        if (!accountSid || !authToken || !twilioWhatsAppNumber || !adminWhatsAppNumber) {
            console.error('Missing Twilio environment variables')
            return NextResponse.json(
                { error: 'Server configuration error' },
                { status: 500 }
            )
        }

        // Get order data from request body
        const body = await request.json()
        const { orderId, clientName, clientDni, clientPhone, address, items, total, panelLink } = body

        // Create the notification message
        let message = `🔔 *NUEVO PEDIDO #${orderId}* 🔔\n\n`
        message += `⏰ ${new Date().toLocaleString('es-PE')}\n\n`
        message += `👤 *Cliente:* ${clientName}\n`
        if (clientDni) {
            message += `🪪 *DNI:* ${clientDni}\n`
        }
        message += `📱 *Tel:* ${clientPhone}\n`
        message += `📍 *Dirección:* ${address}\n\n`
        message += `*PRODUCTOS:*\n`

        items.forEach((item: any) => {
            message += `• ${item.quantity}x ${item.nombre} (${currencyFormatter.format(Number(item.precio || 0) * Number(item.quantity || 0))})\n`
        })

        message += `\n💰 *TOTAL: ${currencyFormatter.format(Number(total || 0))}*\n`
        message += `\n🔗 Ver pedido: ${panelLink}`

        // Initialize Twilio client
        // Validate account SID prefix (Twilio account SIDs start with "AC")
        if (!accountSid.startsWith('AC')) {
            console.error('Invalid TWILIO_ACCOUNT_SID: must start with "AC"')
            return NextResponse.json(
                { error: 'Server configuration error: invalid TWILIO_ACCOUNT_SID' },
                { status: 500 }
            )
        }

        // Validate WhatsApp number formats: should start with "whatsapp:+"
        const invalidWhatsAppFormat = (n?: string) => !n || !n.startsWith('whatsapp:+')
        if (invalidWhatsAppFormat(twilioWhatsAppNumber) || invalidWhatsAppFormat(adminWhatsAppNumber)) {
            console.error('Invalid WhatsApp number format for TWILIO_WHATSAPP_NUMBER or ADMIN_WHATSAPP_NUMBER')
            return NextResponse.json(
                { error: 'Server configuration error: WhatsApp numbers must use format "whatsapp:+{country}{number}"' },
                { status: 500 }
            )
        }

        const client = twilio(accountSid, authToken)

        // Send WhatsApp message to admin
        const twilioMessage = await client.messages.create({
            body: message,
            from: twilioWhatsAppNumber,
            to: adminWhatsAppNumber
        })

        console.log('WhatsApp notification sent:', {
            sid: twilioMessage.sid,
            status: twilioMessage.status,
            to: twilioMessage.to,
            from: twilioMessage.from,
            errorCode: (twilioMessage as any).errorCode ?? null,
            errorMessage: (twilioMessage as any).errorMessage ?? null,
        })

        return NextResponse.json({
            success: true,
            messageId: twilioMessage.sid,
            status: twilioMessage.status,
            errorCode: (twilioMessage as any).errorCode ?? null,
            errorMessage: (twilioMessage as any).errorMessage ?? null,
            to: twilioMessage.to,
            from: twilioMessage.from
        })

    } catch (error: any) {
        console.error('Error sending WhatsApp notification:', error)
        return NextResponse.json(
            { error: error.message || 'Failed to send notification' },
            { status: 500 }
        )
    }
}
