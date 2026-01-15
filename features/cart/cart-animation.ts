
import { create } from 'zustand'

export interface AnimationItem {
  id: string
  src: string
  startRect: DOMRect
}

interface CartAnimationState {
  cartButtonRef: HTMLButtonElement | null
  animations: AnimationItem[]
  bumpTimestamp: number
  registerCartButton: (ref: HTMLButtonElement | null) => void
  startAnimation: (src: string, startRect: DOMRect) => void
  removeAnimation: (id: string) => void
  triggerBump: () => void
}

export const useCartAnimationStore = create<CartAnimationState>((set) => ({
  cartButtonRef: null,
  animations: [],
  bumpTimestamp: 0,
  registerCartButton: (ref) => set({ cartButtonRef: ref }),
  startAnimation: (src, startRect) => {
    const id = Math.random().toString(36).substring(7)
    set((state) => ({
      animations: [...state.animations, { id, src, startRect }],
    }))
  },
  removeAnimation: (id) =>
    set((state) => ({
      animations: state.animations.filter((a) => a.id !== id),
    })),
  triggerBump: () => set({ bumpTimestamp: Date.now() }),
}))
