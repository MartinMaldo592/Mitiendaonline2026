"use client"

import { useEffect, useMemo, useState } from "react"
import { usePathname } from "next/navigation"

import { Header } from "@/components/header"
import { FlyingProductImage } from "@/components/flying-product-image"
import { AnnouncementBar } from "@/components/announcement-bar"
import { Footer } from "@/components/footer"
import { supabase } from "@/lib/supabaseClient"

type LayoutShellProps = {
  children: React.ReactNode
}

export function LayoutShell({ children }: LayoutShellProps) {
  const pathname = usePathname()
  const isAdmin = pathname?.startsWith("/admin")
  const isAuth = pathname?.startsWith("/auth")
  const isOpenWa = pathname?.startsWith("/open-wa")

  const [announcementEnabled, setAnnouncementEnabled] = useState<boolean | null>(null)
  const [announcementIntervalMs, setAnnouncementIntervalMs] = useState(3500)
  const [announcementMessages, setAnnouncementMessages] = useState<string[] | undefined>(undefined)

  if (isAdmin || isAuth) {
    return <>{children}</>
  }

  useEffect(() => {
    let cancelled = false

      ; (async () => {
        const { data, error } = await supabase
          .from("announcement_bar")
          .select("enabled, interval_ms, messages")
          .eq("id", 1)
          .maybeSingle()

        if (cancelled) return
        if (error || !data) {
          setAnnouncementEnabled(true)
          return
        }

        setAnnouncementEnabled(Boolean((data as any).enabled))
        setAnnouncementIntervalMs(Number((data as any).interval_ms) || 3500)

        const msgs = Array.isArray((data as any).messages) ? ((data as any).messages as string[]) : []
        setAnnouncementMessages(msgs.length > 0 ? msgs : undefined)
      })()

    return () => {
      cancelled = true
    }
  }, [])

  const shouldShowAnnouncement = useMemo(() => {
    return announcementEnabled === true
  }, [announcementEnabled])

  const whatsappNumber = process.env.NEXT_PUBLIC_WHATSAPP_TIENDA || "51999999999"
  const defaultMessage = encodeURIComponent("Hola, quisiera información sobre sus productos.")
  const whatsappUrl = `https://api.whatsapp.com/send?phone=${encodeURIComponent(whatsappNumber)}&text=${defaultMessage}`

  return (
    <>
      <Header />
      <FlyingProductImage />
      {shouldShowAnnouncement && (
        <AnnouncementBar
          className="sticky top-16 z-40"
          intervalMs={announcementIntervalMs}
          messages={announcementMessages}
        />
      )}
      <div className="flex-1">{children}</div>
      <Footer />

      {!isOpenWa && (
        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Abrir chat de WhatsApp"
          className="fixed bottom-16 right-4 md:bottom-6 md:right-6 z-50 inline-flex h-14 w-14 items-center justify-center rounded-full bg-green-600 text-white shadow-lg transition-transform hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-2"
        >
          <svg
            viewBox="0 0 32 32"
            width="26"
            height="26"
            fill="currentColor"
            aria-hidden="true"
          >
            <path d="M19.11 17.22c-.27-.14-1.59-.78-1.84-.87-.25-.09-.43-.14-.61.14-.18.27-.7.86-.86 1.04-.16.18-.32.2-.59.07-.27-.14-1.15-.42-2.2-1.35-.81-.72-1.36-1.61-1.52-1.88-.16-.27-.02-.41.12-.55.12-.12.27-.32.41-.48.14-.16.18-.27.27-.45.09-.18.05-.34-.02-.48-.07-.14-.61-1.47-.84-2.01-.22-.53-.45-.46-.61-.47-.16-.01-.34-.01-.52-.01-.18 0-.48.07-.73.34-.25.27-.95.93-.95 2.27 0 1.34.98 2.64 1.11 2.82.14.18 1.93 2.95 4.69 4.13.66.28 1.17.45 1.57.58.66.21 1.26.18 1.73.11.53-.08 1.59-.65 1.82-1.28.23-.63.23-1.17.16-1.28-.07-.11-.25-.18-.52-.32z" />
            <path d="M16.03 2.67c-7.16 0-12.98 5.82-12.98 12.98 0 2.29.61 4.53 1.77 6.51L3 29.33l7.35-1.92c1.91 1.05 4.06 1.6 6.26 1.6h.01c7.16 0 12.98-5.82 12.98-12.98 0-3.47-1.35-6.73-3.8-9.18-2.45-2.45-5.71-3.8-9.18-3.8zm0 23.99h-.01c-1.95 0-3.86-.52-5.53-1.51l-.4-.24-4.36 1.14 1.16-4.25-.26-.43c-1.07-1.72-1.64-3.71-1.64-5.76 0-6.12 4.98-11.1 11.1-11.1 2.97 0 5.76 1.15 7.86 3.25 2.1 2.1 3.25 4.89 3.25 7.86 0 6.12-4.98 11.1-11.1 11.1z" />
          </svg>
        </a>
      )}
    </>
  )
}
