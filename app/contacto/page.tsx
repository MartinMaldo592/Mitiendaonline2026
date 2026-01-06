
"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Mail, Phone, MapPin } from "lucide-react"

export default function ContactoPage() {
    const whatsappNumber = process.env.NEXT_PUBLIC_WHATSAPP_TIENDA || "51999999999"
    const defaultMessage = encodeURIComponent("Hola, quisiera información sobre sus productos.")

    return (
        <div className="container mx-auto px-4 py-10 max-w-5xl">
            <h1 className="text-3xl font-bold mb-8 text-center text-foreground">Contáctanos</h1>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Información de Contacto */}
                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">Información Directa</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center gap-3 text-muted-foreground">
                                <Phone className="h-5 w-5 text-primary" />
                                <span>+51 999 999 999</span>
                            </div>
                            <div className="flex items-center gap-3 text-muted-foreground">
                                <Mail className="h-5 w-5 text-primary" />
                                <span>contacto@tiendawhatsapp.pro</span>
                            </div>
                            <div className="flex items-center gap-3 text-muted-foreground">
                                <MapPin className="h-5 w-5 text-primary" />
                                <span>Av. Principal 123, Miraflores, Lima</span>
                            </div>
                        </CardContent>
                    </Card>

                    <div className="bg-card text-card-foreground p-6 rounded-xl border border-border">
                        <h3 className="font-semibold mb-2">¿Tienes una consulta urgente?</h3>
                        <p className="text-sm text-muted-foreground mb-4">
                            La forma más rápida de obtener respuesta es escribiéndonos directamente a nuestro WhatsApp de soporte.
                        </p>
                        <Button asChild className="w-full bg-green-600 hover:bg-green-700">
                            <a href={`https://api.whatsapp.com/send?phone=${whatsappNumber}&text=${defaultMessage}`}>Chat de Soporte WhatsApp</a>
                        </Button>
                    </div>
                </div>

                {/* Formulario */}
                <Card>
                    <CardHeader>
                        <CardTitle>Envíanos un Mensaje</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-foreground">Nombre Completo</label>
                                <Input placeholder="Tu nombre" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-foreground">Correo Electrónico</label>
                                <Input type="email" placeholder="tucorreo@ejemplo.com" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-foreground">Mensaje</label>
                                <Textarea placeholder="¿En qué podemos ayudarte?" className="min-h-[120px]" />
                            </div>
                            <Button className="w-full">Enviar Mensaje</Button>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
