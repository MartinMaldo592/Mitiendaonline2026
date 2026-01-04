"use client"

import React, { useEffect, useState } from 'react'

export default function OpenWaPageClient() {
  const [phone, setPhone] = useState('')
  const [text, setText] = useState('')

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    setPhone(params.get('phone') || '')
    setText(params.get('text') || '')
  }, [])

  const whatsappWeb = `https://web.whatsapp.com/send?phone=${encodeURIComponent(phone)}&text=${encodeURIComponent(text)}`
  const apiWhatsApp = `https://api.whatsapp.com/send?phone=${encodeURIComponent(phone)}&text=${encodeURIComponent(text)}`
  const appLink = `whatsapp://send?phone=${encodeURIComponent(phone)}&text=${encodeURIComponent(text)}`

  const [triedApp, setTriedApp] = useState(false)

  useEffect(() => {
    // Intentar abrir la aplicación nativa en móviles.
    // Ejecutamos esto solo una vez al cargar la página.
    if (!phone) return

    // Solo intentar si estamos en un entorno móvil (simple UA check)
    const isMobile = /Mobi|Android|iPhone|iPad|iPod|Windows Phone/i.test(navigator.userAgent)
    if (!isMobile) return

    // Intento de abrir la app nativa. Algunos navegadores ignoran redirecciones
    // a esquemas personalizados si no hay interacción, pero dado que esta pestaña
    // se abrió desde una interacción del usuario debería funcionar en la mayoría.
    try {
      // Primero asignamos el esquema whatsapp://
      window.location.href = appLink
      setTriedApp(true)

      // Si tras 800ms seguimos en esta página, navegamos al enlace web como fallback.
      setTimeout(() => {
        // Si la app no abrió (seguimos aquí), redirigimos al API web.
        window.location.href = apiWhatsApp
      }, 800)
    } catch (err) {
      // Fallback: nada, el usuario puede usar los botones.
      console.warn('Error al intentar abrir la app nativa:', err)
    }
  }, [phone])

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, fontFamily: 'system-ui, -apple-system, Segoe UI, Roboto' }}>
      <div style={{ maxWidth: 680, width: '100%', textAlign: 'center' }}>
        <h1 style={{ margin: 0, fontSize: 20, marginBottom: 8 }}>Chatea en WhatsApp</h1>
        <p style={{ color: '#444', marginTop: 0 }}>Pulsa una opción para abrir tu chat preferido. La tienda quedará abierta en la otra pestaña.</p>

        {triedApp && (
          <p style={{ color: '#444', marginTop: 0, fontSize: 12 }}>
            Intentando abrir la aplicación de WhatsApp...
          </p>
        )}

        <textarea readOnly value={text} style={{ width: '100%', minHeight: 120, marginTop: 12, padding: 12, borderRadius: 8, border: '1px solid #e6e6e6', resize: 'vertical' }} />

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 18 }}>
          <a href={appLink} style={{ display: 'inline-block', padding: '12px 16px', background: '#25D366', color: '#fff', borderRadius: 999, textDecoration: 'none', fontWeight: 600 }}>Abrir en la aplicación</a>
          <a href={apiWhatsApp} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-block', padding: '12px 16px', background: '#fff', color: '#111', borderRadius: 999, border: '1px solid #ddd', textDecoration: 'none', fontWeight: 600 }}>Continuar en WhatsApp Web</a>
          <a href={whatsappWeb} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-block', padding: '12px 16px', background: '#fff', color: '#111', borderRadius: 999, border: '1px solid #ddd', textDecoration: 'none', fontWeight: 600 }}>Abrir web.whatsapp.com</a>
        </div>

        <div style={{ marginTop: 18 }}>
          <a href="/" style={{ color: '#111', textDecoration: 'underline' }}>Volver a la tienda</a>
        </div>
      </div>
    </div>
  )
}
