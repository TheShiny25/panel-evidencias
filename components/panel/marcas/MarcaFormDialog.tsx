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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Plus, Pencil } from 'lucide-react'

type MarcaFormDialogProps = {
  marcaId?: number
  clienteIdFijo?: number
  initialData?: {
    nombre?: string
    cliente_id?: number
  }
  trigger?: 'nuevo' | 'editar'
  /** Modo controlado: si se pasa, el diálogo NO renderiza su propio botón */
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

export default function MarcaFormDialog({
  marcaId,
  clienteIdFijo,
  initialData,
  trigger = 'nuevo',
  open: openProp,
  onOpenChange: onOpenChangeProp,
}: MarcaFormDialogProps) {
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

  const [clientes, setClientes] = useState<any[]>([])
  const [clienteId, setClienteId] = useState<string>(
    String(initialData?.cliente_id || clienteIdFijo || '')
  )
  const [nombre, setNombre] = useState(initialData?.nombre || '')

  useEffect(() => {
    const loadClientes = async () => {
      const { data } = await supabase
        .from('clientes')
        .select('id, nombre')
        .eq('activo', true)
        .order('nombre')
      setClientes(data || [])
    }
    if (open) loadClientes()
  }, [open, supabase])

  useEffect(() => {
    if (open) {
      setNombre(initialData?.nombre || '')
      setClienteId(String(initialData?.cliente_id || clienteIdFijo || ''))
      setError(null)
    }
  }, [open, initialData, clienteIdFijo])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    if (!nombre.trim()) {
      setError('El nombre es obligatorio')
      setLoading(false)
      return
    }

    if (!clienteId) {
      setError('Debes seleccionar un cliente')
      setLoading(false)
      return
    }

    const payload = {
      nombre: nombre.trim(),
      cliente_id: Number(clienteId),
    }

    let result
    if (marcaId) {
      result = await supabase.from('marcas').update(payload).eq('id', marcaId)
    } else {
      result = await supabase.from('marcas').insert(payload)
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
      {!isControlled && (
        <>
          {trigger === 'nuevo' ? (
            <Button onClick={() => setOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Nueva marca
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
              {marcaId ? '✏️ Editar Marca' : '➕ Nueva Marca'}
            </DialogTitle>
            <DialogDescription>
              {marcaId
                ? 'Modifica los datos de la marca'
                : 'Crea una nueva marca asociada a un cliente'}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="cliente">Cliente *</Label>
              <Select
                value={clienteId}
                onValueChange={setClienteId}
                disabled={!!clienteIdFijo}
              >
                <SelectTrigger id="cliente" className="w-full">
                  <SelectValue placeholder="Selecciona cliente" />
                </SelectTrigger>
                <SelectContent>
                  {clientes.map((c) => (
                    <SelectItem key={c.id} value={String(c.id)}>
                      {c.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="nombre">Nombre de la marca *</Label>
              <Input
                id="nombre"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="Ej: JBL, Samsung, LG"
                required
                autoFocus
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
                {loading ? 'Guardando...' : marcaId ? 'Guardar' : 'Crear'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}