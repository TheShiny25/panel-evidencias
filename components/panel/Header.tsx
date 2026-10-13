'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'

const navItems = [
  { href: '/', label: 'Calendario', icon: '📅' },
  { href: '/clientes', label: 'Clientes', icon: '🏢' },
  { href: '/marcas', label: 'Marcas', icon: '🏷️' },
  { href: '/historial', label: 'Historial', icon: '📜' },
]

export default function Header() {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const [userEmail, setUserEmail] = useState<string | undefined>()

  // ✅ Ocultar el Header en las páginas de autenticación
  const isAuthPage = pathname?.startsWith('/auth')

  // ✅ Obtener el email del usuario en el cliente
  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUserEmail(user?.email)
    }
    getUser()
  }, [supabase.auth])

  // ✅ Si estamos en login/signup, no renderizar nada
  if (isAuthPage) return null

  // ✅ Cerrar sesión y redirigir al login
  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/auth/login')
    router.refresh()
  }

  return (
    <header className="border-b bg-background">
      <div className="flex h-16 items-center justify-between px-6">
        {/* Logo / Marca */}
        <div className="flex items-center gap-2">
          <span className="text-xl">📸</span>
          <span className="font-semibold">Panel de Evidencias</span>
        </div>

        {/* Navegación principal */}
        <nav className="flex items-center gap-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                }`}
              >
                <span>{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            )
          })}
        </nav>

        {/* Usuario y logout */}
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground">{userEmail}</span>
          <Button variant="outline" size="sm" onClick={handleLogout}>
            Salir
          </Button>
        </div>
      </div>
    </header>
  )
}