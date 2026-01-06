"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabaseClient"

type RoleGuardOptions = {
    allowedRoles: string[]
}

export function useRoleGuard({ allowedRoles }: RoleGuardOptions) {
    const router = useRouter()

    const [loading, setLoading] = useState(true)
    const [role, setRole] = useState<string | null>(null)
    const [accessDenied, setAccessDenied] = useState(false)

    useEffect(() => {
        let cancelled = false

        async function run() {
            setLoading(true)
            setAccessDenied(false)

            const { data: { session } } = await supabase.auth.getSession()

            if (!session) {
                router.push("/auth/login")
                return
            }

            const { data: profile } = await supabase
                .from("profiles")
                .select("role")
                .eq("id", session.user.id)
                .maybeSingle()

            const nextRole = String((profile as any)?.role || "worker")

            if (cancelled) return

            setRole(nextRole)

            if (!allowedRoles.includes(nextRole)) {
                setAccessDenied(true)
                setLoading(false)
                return
            }

            setLoading(false)
        }

        run()

        return () => {
            cancelled = true
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    return { loading, role, accessDenied }
}
