"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabaseClient"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { RefreshCw, Plus, Trash2, Pencil } from "lucide-react"

type CouponType = "porcentaje" | "monto"

type CouponRow = {
  id: number
  codigo: string
  tipo: CouponType
  valor: number
  activo: boolean
  min_total: number
  max_usos: number | null
  usos: number
  starts_at: string | null
  expires_at: string | null
  created_at: string
}

function toDateInputValue(iso: string | null) {
  if (!iso) return ""
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ""
  const yyyy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, "0")
  const dd = String(d.getDate()).padStart(2, "0")
  return `${yyyy}-${mm}-${dd}`
}

function toIsoStartOfDayOrNull(dateStr: string) {
  const v = String(dateStr || "").trim()
  if (!v) return null
  const d = new Date(`${v}T00:00:00.000`)
  if (Number.isNaN(d.getTime())) return null
  return d.toISOString()
}

function toIsoEndOfDayOrNull(dateStr: string) {
  const v = String(dateStr || "").trim()
  if (!v) return null
  const d = new Date(`${v}T23:59:59.999`)
  if (Number.isNaN(d.getTime())) return null
  return d.toISOString()
}

export default function CuponesAdminPage() {
  const router = useRouter()

  const [loading, setLoading] = useState(true)
  const [accessDenied, setAccessDenied] = useState(false)

  const [coupons, setCoupons] = useState<CouponRow[]>([])
  const [sheetOpen, setSheetOpen] = useState(false)
  const [saving, setSaving] = useState(false)

  const [editing, setEditing] = useState<CouponRow | null>(null)

  const [codigo, setCodigo] = useState("")
  const [tipo, setTipo] = useState<CouponType>("porcentaje")
  const [valor, setValor] = useState<string>("")
  const [activo, setActivo] = useState<"true" | "false">("true")
  const [minTotal, setMinTotal] = useState<string>("0")
  const [maxUsos, setMaxUsos] = useState<string>("")
  const [startsAt, setStartsAt] = useState<string>("")
  const [expiresAt, setExpiresAt] = useState<string>("")

  useEffect(() => {
    init()
  }, [])

  async function init() {
    setLoading(true)
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      router.push("/auth/login")
      return
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", session.user.id)
      .single()

    const role = profile?.role || "worker"
    if (role !== "admin") {
      setAccessDenied(true)
      setLoading(false)
      return
    }

    await fetchCoupons()
    setLoading(false)
  }

  async function fetchCoupons() {
    const { data, error } = await supabase
      .from("cupones")
      .select("*")
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching cupones:", error)
      setCoupons([])
      return
    }

    setCoupons((data as any[]) as CouponRow[])
  }

  function resetForm() {
    setEditing(null)
    setCodigo("")
    setTipo("porcentaje")
    setValor("")
    setActivo("true")
    setMinTotal("0")
    setMaxUsos("")
    setStartsAt("")
    setExpiresAt("")
  }

  function openCreate() {
    resetForm()
    setSheetOpen(true)
  }

  function openEdit(c: CouponRow) {
    setEditing(c)
    setCodigo(String(c.codigo || ""))
    setTipo((c.tipo as CouponType) || "porcentaje")
    setValor(String(c.valor ?? ""))
    setActivo(c.activo ? "true" : "false")
    setMinTotal(String(c.min_total ?? 0))
    setMaxUsos(c.max_usos == null ? "" : String(c.max_usos))
    setStartsAt(toDateInputValue(c.starts_at))
    setExpiresAt(toDateInputValue(c.expires_at))
    setSheetOpen(true)
  }

  async function handleSave() {
    const codigoNorm = codigo.trim().toUpperCase()
    if (!codigoNorm) {
      alert("Ingresa un código")
      return
    }

    const valorNum = Number(valor)
    if (!Number.isFinite(valorNum) || valorNum <= 0) {
      alert("Ingresa un valor válido")
      return
    }

    const minTotalNum = Number(minTotal)
    if (!Number.isFinite(minTotalNum) || minTotalNum < 0) {
      alert("Ingresa un mínimo total válido")
      return
    }

    const maxUsosNum = String(maxUsos || "").trim() ? Number(maxUsos) : null
    if (maxUsosNum != null && (!Number.isFinite(maxUsosNum) || maxUsosNum < 1)) {
      alert("Ingresa un máximo de usos válido")
      return
    }

    const payload: any = {
      codigo: codigoNorm,
      tipo,
      valor: valorNum,
      activo: activo === "true",
      min_total: minTotalNum,
      max_usos: maxUsosNum,
      starts_at: toIsoStartOfDayOrNull(startsAt),
      expires_at: toIsoEndOfDayOrNull(expiresAt),
    }

    setSaving(true)
    try {
      if (editing) {
        const { error } = await supabase
          .from("cupones")
          .update(payload)
          .eq("id", editing.id)

        if (error) throw error
      } else {
        const { error } = await supabase
          .from("cupones")
          .insert(payload)

        if (error) throw error
      }

      setSheetOpen(false)
      resetForm()
      await fetchCoupons()
      alert("Cupón guardado")
    } catch (err: any) {
      console.error("Error saving cupon:", err)
      alert(err?.message || "No se pudo guardar")
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(c: CouponRow) {
    if (!confirm(`Eliminar cupón ${c.codigo}?`)) return

    try {
      const { error } = await supabase.from("cupones").delete().eq("id", c.id)
      if (error) throw error
      await fetchCoupons()
    } catch (err: any) {
      console.error("Error deleting cupon:", err)
      alert(err?.message || "No se pudo eliminar")
    }
  }

  const resumen = useMemo(() => {
    const total = coupons.length
    const activos = coupons.filter((c) => c.activo).length
    return { total, activos }
  }, [coupons])

  if (loading) {
    return <div className="p-10">Cargando...</div>
  }

  if (accessDenied) {
    return (
      <div className="p-10">
        <h1 className="text-2xl font-bold">Acceso denegado</h1>
        <p className="text-muted-foreground mt-2">Solo administradores pueden gestionar cupones.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Cupones</h1>
          <p className="text-muted-foreground">Total: {resumen.total} | Activos: {resumen.activos}</p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" className="gap-2" onClick={fetchCoupons}>
            <RefreshCw className="h-4 w-4" /> Actualizar
          </Button>

          <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
            <SheetTrigger asChild>
              <Button className="gap-2" onClick={openCreate}>
                <Plus className="h-4 w-4" /> Nuevo
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[90%] sm:max-w-[420px]">
              <SheetHeader>
                <SheetTitle>{editing ? `Editar cupón` : "Nuevo cupón"}</SheetTitle>
              </SheetHeader>

              <div className="mt-4 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="codigo">Código</Label>
                  <Input
                    id="codigo"
                    value={codigo}
                    onChange={(e) => setCodigo(e.target.value)}
                    placeholder="PROMO10"
                    disabled={saving}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Tipo</Label>
                  <Select value={tipo} onValueChange={(v) => setTipo(v as CouponType)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="porcentaje">Porcentaje</SelectItem>
                      <SelectItem value="monto">Monto fijo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="valor">Valor</Label>
                  <Input
                    id="valor"
                    inputMode="decimal"
                    value={valor}
                    onChange={(e) => setValor(e.target.value)}
                    placeholder={tipo === "porcentaje" ? "10" : "15"}
                    disabled={saving}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Estado</Label>
                  <Select value={activo} onValueChange={(v) => setActivo(v as any)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="true">Activo</SelectItem>
                      <SelectItem value="false">Inactivo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="minTotal">Mínimo total</Label>
                    <Input
                      id="minTotal"
                      inputMode="decimal"
                      value={minTotal}
                      onChange={(e) => setMinTotal(e.target.value)}
                      disabled={saving}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="maxUsos">Máx usos</Label>
                    <Input
                      id="maxUsos"
                      inputMode="numeric"
                      value={maxUsos}
                      onChange={(e) => setMaxUsos(e.target.value)}
                      placeholder="(vacío = ilimitado)"
                      disabled={saving}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="startsAt">Inicio</Label>
                    <Input
                      id="startsAt"
                      type="date"
                      value={startsAt}
                      onChange={(e) => setStartsAt(e.target.value)}
                      disabled={saving}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="expiresAt">Expira</Label>
                    <Input
                      id="expiresAt"
                      type="date"
                      value={expiresAt}
                      onChange={(e) => setExpiresAt(e.target.value)}
                      disabled={saving}
                    />
                  </div>
                </div>

                <div className="pt-2">
                  <Button className="w-full" onClick={handleSave} disabled={saving}>
                    {saving ? "Guardando..." : "Guardar"}
                  </Button>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Listado</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Código</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Usos</TableHead>
                  <TableHead>Máx</TableHead>
                  <TableHead>Min</TableHead>
                  <TableHead>Inicio</TableHead>
                  <TableHead>Expira</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {coupons.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="font-medium">{c.codigo}</TableCell>
                    <TableCell>{c.tipo}</TableCell>
                    <TableCell>{String(c.valor)}</TableCell>
                    <TableCell>{c.activo ? "Activo" : "Inactivo"}</TableCell>
                    <TableCell>{c.usos}</TableCell>
                    <TableCell>{c.max_usos == null ? "∞" : c.max_usos}</TableCell>
                    <TableCell>{String(c.min_total ?? 0)}</TableCell>
                    <TableCell>{toDateInputValue(c.starts_at) || "-"}</TableCell>
                    <TableCell>{toDateInputValue(c.expires_at) || "-"}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button variant="outline" size="icon" onClick={() => openEdit(c)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="destructive" size="icon" onClick={() => handleDelete(c)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}

                {coupons.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={10} className="text-muted-foreground py-8 text-center">
                      No hay cupones.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
