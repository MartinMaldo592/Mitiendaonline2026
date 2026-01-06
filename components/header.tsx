"use client"

import Link from 'next/link'
import { CartButton } from "@/components/cart-button"
import { Menu } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ThemeToggle } from "@/components/theme-toggle"
import { useEffect, useState } from "react"
import { usePathname } from "next/navigation"
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet"

export function Header() {
    const pathname = usePathname()
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

    useEffect(() => {
        setMobileMenuOpen(false)
    }, [pathname])

    return (
        <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md shadow-sm border-b">
            <div className="container mx-auto px-4 h-16 flex items-center justify-between">

                {/* Mobile Menu Trigger & Logo */}
                <div className="flex items-center gap-2 md:gap-4">
                    <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                        <SheetTrigger asChild>
                            <Button variant="ghost" size="icon" className="md:hidden">
                                <Menu className="h-6 w-6" />
                            </Button>
                        </SheetTrigger>
                        <SheetContent
                            side="left"
                            className="w-[300px]"
                            onInteractOutside={() => setMobileMenuOpen(false)}
                            onEscapeKeyDown={() => setMobileMenuOpen(false)}
                        >
                            <SheetHeader className="sr-only">
                                <SheetTitle>Menú</SheetTitle>
                            </SheetHeader>
                            <nav className="flex flex-col gap-4 mt-8">
                                <Link href="/" className="text-lg font-medium hover:text-primary" onClick={() => setMobileMenuOpen(false)}>Inicio</Link>
                                <Link href="/productos" className="text-lg font-medium hover:text-primary" onClick={() => setMobileMenuOpen(false)}>Catálogo</Link>
                                <Link href="/nosotros" className="text-lg font-medium hover:text-primary" onClick={() => setMobileMenuOpen(false)}>Quiénes Somos</Link>
                                <Link href="/contacto" className="text-lg font-medium hover:text-primary" onClick={() => setMobileMenuOpen(false)}>Contacto</Link>
                            </nav>
                        </SheetContent>
                    </Sheet>

                    <Link href="/" className="text-xl font-extrabold tracking-tight text-primary">
                        Blama Shop
                    </Link>
                </div>

                {/* Desktop Navigation */}
                <nav className="hidden md:flex gap-6 text-sm font-medium text-muted-foreground">
                    <Link href="/" className="hover:text-primary transition-colors">Inicio</Link>
                    <Link href="/productos" className="hover:text-primary transition-colors">Catálogo</Link>
                    <Link href="/nosotros" className="hover:text-primary transition-colors">Quiénes Somos</Link>
                    <Link href="/contacto" className="hover:text-primary transition-colors">Contacto</Link>
                </nav>

                {/* Cart Action */}
                <div className="flex items-center gap-2">
                    <ThemeToggle />
                    <CartButton />
                </div>
            </div>
        </header>
    )
}
