'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Plus, Pencil } from 'lucide-react'

type ClienteFormDialogProps = {
  clienteId?: number
  initialData?: {
    nombre?: string
    pais?: string
  }
  trigger?: 'nuevo' | 'editar'
  /** Modo controlado: si se pasa, el diálogo NO renderiza su propio botón */
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

export default function ClienteFormDialog({
  clienteId,
  initialData,
  trigger = 'nuevo',
  open: openProp,
  onOpenChange: onOpenChangeProp,
}: ClienteFormDialogProps) {
  const router = useRouter()
  const supabase = createClient()

  const isControlled = openProp !== undefined

  const [openInternal, setOpenInternal] = useState(false)
  const open = isControlled ? openProp : openInternal

  const setOpen = (value: boolean) => {
    if (isControlled) {
      onOpenChangeProp?.(value)
    } else {
      setOpenInternal(value)
    }
  }

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [nombre, setNombre] = useState(initialData?.nombre || '')
  const [pais, setPais] = useState(initialData?.pais || 'Perú')

  useEffect(() => {
    if (open) {
      setNombre(initialData?.nombre || '')
      setPais(initialData?.pais || 'Perú')
      setError(null)
    }
  }, [open, initialData])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    if (!nombre.trim()) {
      setError('El nombre es obligatorio')
      setLoading(false)
      return
    }

    const payload = {
      nombre: nombre.trim(),
      pais: pais.trim() || null,
    }

    let result
    if (clienteId) {
      result = await supabase
        .from('clientes')
        .update(payload)
        .eq('id', clienteId)
    } else {
      result = await supabase.from('clientes').insert(payload)
    }

    setLoading(false)

    if (result.error) {
      setError(result.error.message)
      return
    }

    setOpen(false)
    router.refresh()
  }

  return (
    <>
      {/* Botón trigger (solo si NO es controlado) */}
      {!isControlled && (
        <>
          {trigger === 'nuevo' ? (
            <Button onClick={() => setOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Nuevo cliente
            </Button>
          ) : (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => setOpen(true)}
            >
              <Pencil className="h-4 w-4" />
            </Button>
          )}
        </>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {clienteId ? '✏️ Editar Cliente' : '➕ Nuevo Cliente'}
            </DialogTitle>
            <DialogDescription>
              {clienteId
                ? 'Modifica los datos del cliente'
                : 'Crea un nuevo cliente (retailer) en el sistema'}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="nombre">Nombre *</Label>
              <Input
                id="nombre"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="Ej: Ripley Perú"
                required
                autoFocus
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="pais">País</Label>
              <Input
                id="pais"
                value={pais}
                onChange={(e) => setPais(e.target.value)}
                placeholder="Ej: Perú"
              />
            </div>

            {error && (
              <div className="p-3 rounded-md bg-red-500/10 border border-red-500/20 text-red-600 text-sm">
                {error}
              </div>
            )}

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={loading}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? 'Guardando...' : clienteId ? 'Guardar' : 'Crear'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}