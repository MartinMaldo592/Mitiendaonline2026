"use client"

import { useCallback, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabaseClient"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useRoleGuard } from "@/lib/use-role-guard"
import { AccessDenied } from "@/components/admin/access-denied"

export default function UsuariosPage() {
  const router = useRouter()

  const [loading, setLoading] = useState(true)

  const guard = useRoleGuard({ allowedRoles: ["admin"] })

  const [profiles, setProfiles] = useState<any[]>([])

  const [email, setEmail] = useState("")
  const [nombre, setNombre] = useState("")
  const [password, setPassword] = useState("")
  const [creating, setCreating] = useState(false)

  const fetchProfiles = useCallback(async () => {
    const { data } = await supabase
      .from("profiles")
      .select("id, email, nombre, role, created_at")
      .order("created_at", { ascending: false })

    setProfiles(data || [])
  }, [])

  useEffect(() => {
    if (guard.loading || guard.accessDenied) return

    ;(async () => {
      setLoading(true)
      await fetchProfiles()
      setLoading(false)
    })()
  }, [guard.loading, guard.accessDenied, fetchProfiles])

  async function handleCreateWorker() {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      router.push("/auth/login")
      return
    }

    setCreating(true)
    try {
      const res = await fetch("/api/admin/create-worker", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          email,
          nombre,
          password: password || null,
        }),
      })

      const json = await res.json()
      if (!res.ok) {
        alert(json?.error || "Error")
        return
      }

      if (json?.generatedPassword) {
        alert(`Worker creado. Contraseña generada: ${json.generatedPassword}`)
      } else {
        alert("Worker creado")
      }

      setEmail("")
      setNombre("")
      setPassword("")
      await fetchProfiles()
    } catch (e: any) {
      alert(e?.message || "Error")
    } finally {
      setCreating(false)
    }
  }

  if (guard.loading || loading) {
    return <div className="p-10">Cargando...</div>
  }

  if (guard.accessDenied) {
    return <AccessDenied message="Solo administradores pueden gestionar usuarios." />
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Usuarios</h1>
          <p className="text-muted-foreground">Crea trabajadores y revisa perfiles.</p>
        </div>
        <Button variant="outline" onClick={fetchProfiles}>Actualizar</Button>
      </div>

      <div className="bg-card border border-border rounded-xl p-6 space-y-4">
        <h2 className="text-lg font-semibold">Crear worker</h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="worker@tienda.com" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="nombre">Nombre</Label>
            <Input id="nombre" value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Nombre del trabajador" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Contraseña (opcional)</Label>
            <Input id="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Si lo dejas vacío se genera" />
          </div>
        </div>

        <div className="flex justify-end">
          <Button onClick={handleCreateWorker} disabled={creating || !email.trim()}>
            {creating ? "Creando..." : "Crear"}
          </Button>
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-border">
          <h2 className="text-lg font-semibold">Perfiles</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-popover">
              <tr>
                <th className="text-left p-3">Email</th>
                <th className="text-left p-3">Nombre</th>
                <th className="text-left p-3">Rol</th>
                <th className="text-left p-3">Creado</th>
              </tr>
            </thead>
            <tbody>
              {profiles.map((p) => (
                <tr key={p.id} className="border-t border-border">
                  <td className="p-3">{p.email || ""}</td>
                  <td className="p-3">{p.nombre || ""}</td>
                  <td className="p-3">{p.role || ""}</td>
                  <td className="p-3">{p.created_at ? new Date(p.created_at).toLocaleString() : ""}</td>
                </tr>
              ))}
              {profiles.length === 0 && (
                <tr>
                  <td className="p-6 text-muted-foreground" colSpan={4}>No hay perfiles.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
