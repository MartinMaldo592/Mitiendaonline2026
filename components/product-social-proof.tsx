"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { supabase } from "@/lib/supabaseClient"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Star } from "lucide-react"

type ReviewRow = {
  id: number
  rating: number
  title: string | null
  body: string
  customer_name: string | null
  customer_city: string | null
  verified: boolean
  created_at: string
  photo_urls: string[] | null
}

type QuestionRow = {
  id: number
  question: string
  asker_name: string | null
  created_at: string
  product_answers?: { id: number; answer: string; answered_by: string | null; created_at: string }[]
}

function Stars({ value }: { value: number }) {
  const v = Math.max(0, Math.min(5, Math.round(value)))
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={"h-4 w-4 " + (i < v ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground")}
        />
      ))}
    </div>
  )
}

export function ProductSocialProof({ productId, section = 'all' }: { productId: number; section?: 'reviews' | 'questions' | 'all' }) {
  const [loading, setLoading] = useState(true)
  const [reviews, setReviews] = useState<ReviewRow[]>([])
  const [questions, setQuestions] = useState<QuestionRow[]>([])

  // ... (keep state exactly as is)

  const [showReviewForm, setShowReviewForm] = useState(false)
  const [showQuestionForm, setShowQuestionForm] = useState(false)

  const [reviewRating, setReviewRating] = useState(5)
  const [reviewTitle, setReviewTitle] = useState("")
  const [reviewBody, setReviewBody] = useState("")
  const [reviewName, setReviewName] = useState("")
  const [reviewCity, setReviewCity] = useState("")
  const [reviewOrderId, setReviewOrderId] = useState("")
  const [reviewDni, setReviewDni] = useState("")
  const [reviewPhone, setReviewPhone] = useState("")
  const [reviewFiles, setReviewFiles] = useState<File[]>([])
  const [sendingReview, setSendingReview] = useState(false)
  const [reviewSent, setReviewSent] = useState<string | null>(null)

  const [qText, setQText] = useState("")
  const [qName, setQName] = useState("")
  const [qPhone, setQPhone] = useState("")
  const [sendingQ, setSendingQ] = useState(false)
  const [qSent, setQSent] = useState<string | null>(null)

  const refetch = useRef<(() => Promise<void>) | null>(null)

  const stats = useMemo(() => {
    const count = reviews.length
    const avg = count === 0 ? 0 : reviews.reduce((acc, r) => acc + Number(r.rating || 0), 0) / count
    return { count, avg }
  }, [reviews])

  useEffect(() => {
    let cancelled = false

    async function load() {
      setLoading(true)

      // Only fetch what we need if we wanted to optimize, but typically fetching both is fine as they are related.
      // However, if section is specific, arguably we could only fetch that table.
      // For simplicity and avoiding large logic changes, we fetch both.
      const [reviewsRes, questionsRes] = await Promise.all([
        supabase
          .from("product_reviews")
          .select("id, rating, title, body, customer_name, customer_city, verified, created_at, photo_urls")
          .eq("product_id", productId)
          .eq("approved", true)
          .order("created_at", { ascending: false })
          .limit(20),
        supabase
          .from("product_questions")
          .select("id, question, asker_name, created_at, product_answers(id, answer, answered_by, created_at)")
          .eq("product_id", productId)
          .eq("published", true)
          .order("created_at", { ascending: false })
          .limit(30),
      ])

      if (cancelled) return

      setReviews((reviewsRes.data as any[]) as ReviewRow[] || [])
      setQuestions((questionsRes.data as any[]) as QuestionRow[] || [])
      setLoading(false)
    }

    refetch.current = load
    load()

    return () => {
      cancelled = true
    }
  }, [productId])

  // ... (keep submit functions exactly as is)

  async function submitReview() {
    if (!reviewBody.trim() || reviewBody.trim().length < 10) {
      setReviewSent("Escribe una reseña más larga")
      return
    }

    setSendingReview(true)
    setReviewSent(null)

    try {
      const fd = new FormData()
      fd.set("productId", String(productId))
      fd.set("rating", String(reviewRating))
      fd.set("title", reviewTitle)
      fd.set("body", reviewBody)
      fd.set("customerName", reviewName)
      fd.set("customerCity", reviewCity)
      fd.set("orderId", reviewOrderId)
      fd.set("dni", reviewDni)
      fd.set("phone", reviewPhone)

      reviewFiles.slice(0, 3).forEach((f) => fd.append("photos", f))

      const res = await fetch("/api/reviews/submit", {
        method: "POST",
        body: fd,
      })

      const json = await res.json().catch(() => null)
      if (!res.ok) {
        throw new Error(String(json?.error || "No se pudo enviar la reseña"))
      }

      setReviewTitle("")
      setReviewBody("")
      setReviewFiles([])

      const verified = Boolean(json?.verified)
      setReviewSent(
        verified
          ? "Reseña enviada. Se marcará como comprador verificado cuando sea aprobada."
          : "Reseña enviada. Se publicará cuando sea aprobada."
      )

      setShowReviewForm(false)

      await refetch.current?.()
    } catch (e: any) {
      setReviewSent(e?.message || "Error enviando reseña")
    } finally {
      setSendingReview(false)
    }
  }

  async function submitQuestion() {
    if (!qText.trim() || qText.trim().length < 8) {
      setQSent("Escribe una pregunta más específica")
      return
    }

    setSendingQ(true)
    setQSent(null)

    try {
      const res = await fetch("/api/questions/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, question: qText, askerName: qName, askerPhone: qPhone }),
      })

      const json = await res.json().catch(() => null)
      if (!res.ok) {
        throw new Error(String(json?.error || "No se pudo enviar la pregunta"))
      }

      setQText("")
      setQSent("Pregunta enviada. Se publicará cuando sea respondida/aprobada.")

      setShowQuestionForm(false)
    } catch (e: any) {
      setQSent(e?.message || "Error enviando pregunta")
    } finally {
      setSendingQ(false)
    }
  }

  const showReviews = section === 'all' || section === 'reviews'
  const showQuestions = section === 'all' || section === 'questions'

  return (
    <div className="space-y-6">
      {showReviews && (
        <div className="space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="text-lg font-bold">Reseñas</div>
              <div className="mt-1 flex items-center gap-2 text-sm">
                <Stars value={stats.avg} />
                <span className="text-muted-foreground">
                  {stats.count > 0 ? `${stats.avg.toFixed(1)} (${stats.count} reseñas)` : "Aún no hay reseñas"}
                </span>
              </div>
            </div>
            <Badge variant="secondary">Sin cuenta</Badge>
          </div>

          {loading ? (
            <div className="text-sm text-muted-foreground">Cargando reseñas...</div>
          ) : reviews.length === 0 ? (
            <div className="text-sm text-muted-foreground">Sé el primero en dejar una reseña.</div>
          ) : (
            <div className="space-y-4">
              {reviews.map((r) => (
                <div key={r.id} className="rounded-xl border bg-card p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Stars value={r.rating} />
                        {r.verified ? <Badge>Comprador verificado</Badge> : <Badge variant="outline">Cliente</Badge>}
                      </div>
                      <div className="text-sm font-semibold">{r.title || "Reseña"}</div>
                      <div className="text-sm text-muted-foreground whitespace-pre-line">{r.body}</div>
                    </div>
                    <div className="text-xs text-muted-foreground text-right">
                      <div>{r.customer_name || ""}</div>
                      <div>{r.customer_city || ""}</div>
                      <div>{new Date(r.created_at).toLocaleDateString()}</div>
                    </div>
                  </div>

                  {Array.isArray(r.photo_urls) && r.photo_urls.length > 0 ? (
                    <div className="mt-3 flex gap-2 overflow-x-auto">
                      {r.photo_urls.slice(0, 6).map((u, idx) => (
                        <img
                          key={idx}
                          src={u}
                          alt="Foto del cliente"
                          className="h-20 w-20 rounded-lg border object-cover"
                          loading="lazy"
                        />
                      ))}
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          )}

          <div className="pt-2 border-t space-y-3">
            <div className="flex items-center justify-between gap-3">
              <div className="text-sm font-semibold">Dejar una reseña</div>
              {!showReviewForm ? (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setReviewSent(null)
                    setShowReviewForm(true)
                  }}
                >
                  Añadir reseña
                </Button>
              ) : (
                <Button type="button" variant="outline" onClick={() => setShowReviewForm(false)}>
                  Cancelar
                </Button>
              )}
            </div>

            {reviewSent ? <div className="text-sm text-muted-foreground">{reviewSent}</div> : null}

            {showReviewForm ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  {Array.from({ length: 5 }).map((_, i) => {
                    const v = i + 1
                    const active = v <= reviewRating
                    return (
                      <button
                        key={v}
                        type="button"
                        onClick={() => setReviewRating(v)}
                        className="rounded-md p-1"
                        aria-label={`Puntaje ${v}`}
                      >
                        <Star
                          className={
                            "h-5 w-5 " + (active ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground")
                          }
                        />
                      </button>
                    )
                  })}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label>Tu nombre (opcional)</Label>
                    <Input value={reviewName} onChange={(e) => setReviewName(e.target.value)} placeholder="Ej: Juan" />
                  </div>
                  <div className="space-y-1">
                    <Label>Ciudad (opcional)</Label>
                    <Input value={reviewCity} onChange={(e) => setReviewCity(e.target.value)} placeholder="Ej: Lima" />
                  </div>
                  <div className="space-y-1 md:col-span-2">
                    <Label>Título (opcional)</Label>
                    <Input
                      value={reviewTitle}
                      onChange={(e) => setReviewTitle(e.target.value)}
                      placeholder="Ej: Excelente calidad"
                    />
                  </div>
                  <div className="space-y-1 md:col-span-2">
                    <Label>Tu reseña</Label>
                    <Textarea
                      value={reviewBody}
                      onChange={(e) => setReviewBody(e.target.value)}
                      placeholder="Cuéntanos tu experiencia..."
                    />
                  </div>
                </div>

                <div className="rounded-xl border bg-popover p-4 space-y-2">
                  <div className="text-sm font-semibold">Comprador verificado (opcional)</div>
                  <div className="text-xs text-muted-foreground">
                    Si tienes tu número de pedido, ingrésalo junto con tu DNI y teléfono para marcar la reseña como verificada.
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="space-y-1">
                      <Label>Pedido ID</Label>
                      <Input value={reviewOrderId} onChange={(e) => setReviewOrderId(e.target.value)} placeholder="Ej: 123" />
                    </div>
                    <div className="space-y-1">
                      <Label>DNI</Label>
                      <Input value={reviewDni} onChange={(e) => setReviewDni(e.target.value)} placeholder="12345678" />
                    </div>
                    <div className="space-y-1">
                      <Label>Teléfono</Label>
                      <Input value={reviewPhone} onChange={(e) => setReviewPhone(e.target.value)} placeholder="999999999" />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Fotos (opcional, máx 3)</Label>
                  <Input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={(e) => {
                      const list = Array.from(e.target.files || [])
                      setReviewFiles(list.slice(0, 3))
                    }}
                  />
                  <div className="text-xs text-muted-foreground">Las fotos se subirán cuando envíes la reseña.</div>
                </div>

                <Button type="button" onClick={submitReview} disabled={sendingReview} className="w-full md:w-auto">
                  {sendingReview ? "Enviando..." : "Enviar reseña"}
                </Button>
              </div>
            ) : null}
          </div>
        </div>
      )
      }

      {
        showQuestions && (
          <div className="space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-lg font-bold">Preguntas y respuestas</div>
                <div className="text-sm text-muted-foreground">Resuelve dudas antes de comprar</div>
              </div>
              <Badge variant="secondary">Sin cuenta</Badge>
            </div>

            {loading ? (
              <div className="text-sm text-muted-foreground">Cargando preguntas...</div>
            ) : questions.length === 0 ? (
              <div className="text-sm text-muted-foreground">Aún no hay preguntas publicadas.</div>
            ) : (
              <div className="space-y-3">
                {questions.map((q) => (
                  <div key={q.id} className="rounded-xl border bg-card p-4">
                    <div className="text-sm font-semibold">{q.question}</div>
                    <div className="mt-1 text-xs text-muted-foreground">
                      {q.asker_name ? `Por ${q.asker_name} • ` : ""}{new Date(q.created_at).toLocaleDateString()}
                    </div>

                    {Array.isArray(q.product_answers) && q.product_answers.length > 0 ? (
                      <div className="mt-3 rounded-lg bg-popover p-3">
                        <div className="text-xs font-semibold">Respuesta</div>
                        <div className="text-sm text-muted-foreground whitespace-pre-line">{q.product_answers[0].answer}</div>
                      </div>
                    ) : null}
                  </div>
                ))}
              </div>
            )}

            <div className="pt-2 border-t space-y-3">
              <div className="flex items-center justify-between gap-3">
                <div className="text-sm font-semibold">Hacer una pregunta</div>
                {!showQuestionForm ? (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setQSent(null)
                      setShowQuestionForm(true)
                    }}
                  >
                    Hacer una pregunta
                  </Button>
                ) : (
                  <Button type="button" variant="outline" onClick={() => setShowQuestionForm(false)}>
                    Cancelar
                  </Button>
                )}
              </div>

              {qSent ? <div className="text-sm text-muted-foreground">{qSent}</div> : null}

              {showQuestionForm ? (
                <div className="space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label>Tu nombre (opcional)</Label>
                      <Input value={qName} onChange={(e) => setQName(e.target.value)} placeholder="Ej: Ana" />
                    </div>
                    <div className="space-y-1">
                      <Label>Teléfono (opcional)</Label>
                      <Input value={qPhone} onChange={(e) => setQPhone(e.target.value)} placeholder="999999999" />
                    </div>
                    <div className="space-y-1 md:col-span-2">
                      <Label>Pregunta</Label>
                      <Textarea
                        value={qText}
                        onChange={(e) => setQText(e.target.value)}
                        placeholder="Ej: ¿Qué talla recomiendas?"
                      />
                    </div>
                  </div>

                  <Button type="button" onClick={submitQuestion} disabled={sendingQ} className="w-full md:w-auto">
                    {sendingQ ? "Enviando..." : "Enviar pregunta"}
                  </Button>
                </div>
              ) : null}
            </div>
          </div>
        )
      }
    </div >
  )
}
