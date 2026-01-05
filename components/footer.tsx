
import Link from 'next/link'
import { Facebook, Instagram, Twitter } from 'lucide-react'

export function Footer() {
    return (
        <footer className="bg-sidebar text-sidebar-foreground py-10 mt-auto">
            <div className="container mx-auto px-4 grid grid-cols-1 md:grid-cols-4 gap-8">
                {/* Brand */}
                <div className="space-y-4">
                    <h3 className="text-xl font-bold text-sidebar-primary-foreground">Blama Shop</h3>
                    <p className="text-sm text-muted-foreground">
                        La mejor experiencia de compra online con atención personalizada vía WhatsApp.
                    </p>
                </div>

                {/* Links Rápidos */}
                <div className="space-y-4">
                    <h4 className="text-sidebar-primary-foreground font-semibold">Enlaces Rápidos</h4>
                    <ul className="space-y-2 text-sm">
                        <li><Link href="/" className="hover:text-sidebar-primary-foreground transition-colors">Inicio</Link></li>
                        <li><Link href="/productos" className="hover:text-sidebar-primary-foreground transition-colors">Catálogo</Link></li>
                        <li><Link href="/nosotros" className="hover:text-sidebar-primary-foreground transition-colors">Quiénes Somos</Link></li>
                        <li><Link href="/contacto" className="hover:text-sidebar-primary-foreground transition-colors">Contáctanos</Link></li>
                    </ul>
                </div>

                {/* Legal */}
                <div className="space-y-4">
                    <h4 className="text-sidebar-primary-foreground font-semibold">Legal</h4>
                    <ul className="space-y-2 text-sm">
                        <li><Link href="/terminos" className="hover:text-sidebar-primary-foreground transition-colors">Términos y Condiciones</Link></li>
                        <li><Link href="/privacidad" className="hover:text-sidebar-primary-foreground transition-colors">Política de Privacidad</Link></li>
                        <li><Link href="/envios" className="hover:text-sidebar-primary-foreground transition-colors">Política de Envíos</Link></li>
                    </ul>
                </div>

                {/* Redes */}
                <div className="space-y-4">
                    <h4 className="text-sidebar-primary-foreground font-semibold">Síguenos</h4>
                    <div className="flex gap-4">
                        <a href="#" className="hover:text-sidebar-primary-foreground transition-colors"><Facebook className="h-5 w-5" /></a>
                        <a href="#" className="hover:text-sidebar-primary-foreground transition-colors"><Instagram className="h-5 w-5" /></a>
                        <a href="#" className="hover:text-sidebar-primary-foreground transition-colors"><Twitter className="h-5 w-5" /></a>
                    </div>
                </div>
            </div>
            <div className="border-t border-border mt-8 pt-8 text-center text-xs text-muted-foreground">
                © {new Date().getFullYear()} Blama Shop. Todos los derechos reservados.
            </div>
        </footer>
    )
}
