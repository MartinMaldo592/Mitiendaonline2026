"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabaseClient"

type RoleGuardOptions = {
    allowedRoles: string[]
}

function isInvalidRefreshTokenError(err: unknown) {
    const msg = String((err as any)?.message || '')
    const lower = msg.toLowerCase()
    return lower.includes('invalid refresh token') || lower.includes('refresh token not found')
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

            let session: any = null
            try {
                const res = await supabase.auth.getSession()
                const err = (res as any)?.error
                if (err) throw err
                session = res?.data?.session ?? null
            } catch (err) {
                if (isInvalidRefreshTokenError(err)) {
                    try {
                        await supabase.auth.signOut()
                    } catch (e) {
                    }
                }
                router.replace("/auth/login")
                return
            }

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
