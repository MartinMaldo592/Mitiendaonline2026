"use client"

import { useEffect, useMemo, useState } from "react"
import Image from "next/image"
import { cn } from "@/lib/utils"
import { ChevronLeft, ChevronRight } from "lucide-react"

interface ProductImageCarouselProps {
  images: string[]
  alt: string
  className?: string
  autoPlay?: boolean
  intervalMs?: number
  showControls?: boolean
  priority?: boolean
  sizes?: string
}

export function ProductImageCarousel({
  images,
  alt,
  className,
  autoPlay = false,
  intervalMs = 2500,
  showControls = true,
  priority = false,
  sizes,
}: ProductImageCarouselProps) {
  const cleanImages = useMemo(() => {
    const unique: string[] = []
    for (const img of images || []) {
      const v = String(img || "").trim()
      if (!v) continue
      if (!unique.includes(v)) unique.push(v)
      if (unique.length >= 10) break
    }
    return unique
  }, [images])

  const [index, setIndex] = useState(0)
  const [prevIndex, setPrevIndex] = useState<number | null>(null)

  useEffect(() => {
    setIndex(0)
    setPrevIndex(null)
  }, [cleanImages.join("|")])

  useEffect(() => {
    if (!autoPlay) return
    if (cleanImages.length <= 1) return

    const id = window.setInterval(() => {
      setIndex((prev) => {
        setPrevIndex(prev)
        return (prev + 1) % cleanImages.length
      })
    }, intervalMs)

    return () => window.clearInterval(id)
  }, [autoPlay, cleanImages.length, intervalMs])

  if (cleanImages.length === 0) return null

  const prev = () =>
    setIndex((i) => {
      setPrevIndex(i)
      return (i - 1 + cleanImages.length) % cleanImages.length
    })
  const next = () =>
    setIndex((i) => {
      setPrevIndex(i)
      return (i + 1) % cleanImages.length
    })

  const activeSrc = cleanImages[index] || ""
  const prevSrc = prevIndex != null ? cleanImages[prevIndex] || "" : ""
  const showPrev = prevSrc && prevSrc !== activeSrc

  return (
    <div className={cn("relative h-full w-full overflow-hidden", className)}>
      {showPrev ? (
        <Image
          key={`prev-${prevSrc}`}
          src={prevSrc}
          alt={alt}
          fill
          className="absolute inset-0 object-cover opacity-0 transition-opacity duration-500"
          sizes={sizes || "(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"}
          draggable={false}
        />
      ) : null}

      {activeSrc ? (
        <Image
          key={`active-${activeSrc}`}
          src={activeSrc}
          alt={alt}
          fill
          className="absolute inset-0 object-cover opacity-100 transition-opacity duration-500"
          priority={priority && index === 0}
          sizes={sizes || "(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"}
          draggable={false}
        />
      ) : null}

      {showControls && cleanImages.length > 1 && (
        <>
          <button
            type="button"
            aria-label="Imagen anterior"
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              prev()
            }}
            className="absolute left-2 top-1/2 -translate-y-1/2 h-9 w-9 rounded-full bg-background/70 backdrop-blur border border-border flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>

          <button
            type="button"
            aria-label="Imagen siguiente"
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              next()
            }}
            className="absolute right-2 top-1/2 -translate-y-1/2 h-9 w-9 rounded-full bg-background/70 backdrop-blur border border-border flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <ChevronRight className="h-5 w-5" />
          </button>

          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
            {cleanImages.map((_, dotIndex) => (
              <button
                key={dotIndex}
                type="button"
                aria-label={`Ir a imagen ${dotIndex + 1}`}
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  setPrevIndex(index)
                  setIndex(dotIndex)
                }}
                className={cn(
                  "h-1.5 w-1.5 rounded-full",
                  dotIndex === index ? "bg-primary" : "bg-foreground/30"
                )}
              />
            ))}
          </div>
        </>
      )}
    </div>
  )
}
