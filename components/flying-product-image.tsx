"use client"

import { useEffect, useState } from "react"
import { useCartAnimationStore } from "@/features/cart/cart-animation" // Ensure this path is correct
import { createPortal } from "react-dom"

const ANIMATION_DURATION = 800 // ms

export function FlyingProductImage() {
    const animations = useCartAnimationStore((s) => s.animations)
    const cartButtonRef = useCartAnimationStore((s) => s.cartButtonRef)
    const removeAnimation = useCartAnimationStore((s) => s.removeAnimation)
    const triggerBump = useCartAnimationStore((s) => s.triggerBump)
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)
    }, [])

    if (!mounted) return null

    // Ensure we have a portal target (document.body)
    return createPortal(
        <>
            {animations.map((anim) => (
                <FlyingItem
                    key={anim.id}
                    item={anim}
                    targetRef={cartButtonRef}
                    onComplete={() => {
                        removeAnimation(anim.id)
                        triggerBump()
                    }}
                />
            ))}
        </>,
        document.body
    )
}

function FlyingItem({
    item,
    targetRef,
    onComplete,
}: {
    item: { id: string; src: string; startRect: DOMRect }
    targetRef: HTMLButtonElement | null
    onComplete: () => void
}) {
    const [style, setStyle] = useState<React.CSSProperties>({
        position: "fixed",
        left: item.startRect.left,
        top: item.startRect.top,
        width: item.startRect.width,
        height: item.startRect.height,
        opacity: 1,
        zIndex: 9999,
        pointerEvents: "none",
        transition: `all ${ANIMATION_DURATION}ms cubic-bezier(0.2, 0.8, 0.2, 1)`,
        borderRadius: "0.5rem",
        boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
    })

    useEffect(() => {
        // Trigger animation in next frame
        requestAnimationFrame(() => {
            if (!targetRef) {
                // If no target, just fade out or move up slightly
                setStyle((prev) => ({
                    ...prev,
                    opacity: 0,
                    transform: "translateY(-50px) scale(0.5)",
                }))
                return
            }

            const targetRect = targetRef.getBoundingClientRect()
            // Center of target
            const targetX = targetRect.left + targetRect.width / 2
            const targetY = targetRect.top + targetRect.height / 2

            // Center of start (to calculate translate)
            // Actually, easiest is just to set left/top/width/height to target values
            // But we want it to shrink into the icon.

            // Target size (small icon size)
            const targetSize = 24

            setStyle((prev) => ({
                ...prev,
                left: targetX - targetSize / 2,
                top: targetY - targetSize / 2,
                width: targetSize,
                height: targetSize,
                opacity: 0.5,
                borderRadius: "50%",
            }))
        })

        const timer = setTimeout(onComplete, ANIMATION_DURATION)
        return () => clearTimeout(timer)
    }, [targetRef, onComplete])

    return (
        <img
            src={item.src}
            alt=""
            style={style}
            className="object-cover border-2 border-white"
        />
    )
}
