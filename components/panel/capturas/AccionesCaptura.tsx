'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  MoreVertical,
  Pencil,
  Trash2,
  Ban,
  PlayCircle,
  Eye,
  AlertTriangle,
  XCircle,
  RotateCcw,
} from 'lucide-react'
import Link from 'next/link'

type AccionesCapturaProps = {
  capturaId: number
  estado: string
}

export default function AccionesCaptura({ capturaId, estado }: AccionesCapturaProps) {
  const router = useRouter()
  const supabase = createClient()

  const [openEliminar, setOpenEliminar] = useState(false)
  const [openParar, setOpenParar] = useState(false)
  const [openReactivar, setOpenReactivar] = useState(false)
  const [loading, setLoading] = useState(false)

  const puedeVer = estado === 'ejecutada'
  const puedeEditar = estado === 'pendiente'
  const puedeParar = estado === 'pendiente'
  const puedeReactivar = estado === 'cancelada'
  const puedeEliminar = estado !== 'ejecutada'

  // ============================================================
  // ACCIONES
  // ============================================================

  const handleEliminar = async () => {
    setLoading(true)
    const { error } = await supabase
      .from('capturas_programadas')
      .delete()
      .eq('id', capturaId)

    setLoading(false)
    setOpenEliminar(false)

    if (error) {
      alert('Error al eliminar: ' + error.message)
      return
    }

    window.location.reload()
  }

  const handleParar = async () => {
    setLoading(true)
    const { error } = await supabase
      .from('capturas_programadas')
      .update({ estado: 'cancelada' })
      .eq('id', capturaId)

    setLoading(false)
    setOpenParar(false)

    if (error) {
      alert('Error al cancelar: ' + error.message)
      return
    }

    window.location.reload()
  }

  const handleReactivar = async () => {
    setLoading(true)
    const { error } = await supabase
      .from('capturas_programadas')
      .update({ estado: 'pendiente' })
      .eq('id', capturaId)

    setLoading(false)
    setOpenReactivar(false)

    if (error) {
      alert('Error al reactivar: ' + error.message)
      return
    }

    window.location.reload()
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <MoreVertical className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          {puedeVer && (
            <DropdownMenuItem asChild>
              <Link
                href={`/capturas/${capturaId}`}
                className="flex items-center gap-2 cursor-pointer"
              >
                <Eye className="h-4 w-4" />
                Ver evidencia
              </Link>
            </DropdownMenuItem>
          )}

          {puedeEditar && (
            <DropdownMenuItem asChild>
              <Link
                href={`/capturas/${capturaId}/editar`}
                className="flex items-center gap-2 cursor-pointer"
              >
                <Pencil className="h-4 w-4" />
                Editar
              </Link>
            </DropdownMenuItem>
          )}

          {puedeParar && (
            <DropdownMenuItem
              className="flex items-center gap-2 cursor-pointer text-yellow-600 focus:text-yellow-600 focus:bg-yellow-500/10"
              onSelect={(e) => {
                e.preventDefault()
                setTimeout(() => setOpenParar(true), 250)
              }}
            >
              <Ban className="h-4 w-4" />
              Parar captura
            </DropdownMenuItem>
          )}

          {puedeReactivar && (
            <DropdownMenuItem
              className="flex items-center gap-2 cursor-pointer text-green-600 focus:text-green-600 focus:bg-green-500/10"
              onSelect={(e) => {
                e.preventDefault()
                setTimeout(() => setOpenReactivar(true), 250)
              }}
            >
              <PlayCircle className="h-4 w-4" />
              Reactivar
            </DropdownMenuItem>
          )}

          {puedeEliminar && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="flex items-center gap-2 text-red-600 focus:text-red-600 focus:bg-red-500/10 cursor-pointer"
                onSelect={(e) => {
                  e.preventDefault()
                  setTimeout(() => setOpenEliminar(true), 250)
                }}
              >
                <Trash2 className="h-4 w-4" />
                Eliminar
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* ============================================================ */}
      {/* DIALOG: PARAR */}
      {/* ============================================================ */}
      <AlertDialog open={openParar} onOpenChange={setOpenParar}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="rounded-full bg-yellow-500/20 p-2">
                <AlertTriangle className="h-5 w-5 text-yellow-600" />
              </div>
              <AlertDialogTitle className="text-lg">
                ¿Parar esta captura?
              </AlertDialogTitle>
            </div>
            <AlertDialogDescription className="text-sm">
              <span className="block">
                La captura quedará en estado <strong>Cancelada</strong> y no se
                ejecutará en el horario programado.
              </span>
              <span className="block mt-2 text-xs bg-yellow-500/10 border border-yellow-500/20 rounded-md p-2 text-yellow-700">
                💡 Podrás reactivarla en cualquier momento desde el menú.
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={loading}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleParar}
              disabled={loading}
              className="bg-yellow-600 hover:bg-yellow-700 text-white"
            >
              {loading ? 'Procesando...' : 'Sí, parar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ============================================================ */}
      {/* DIALOG: REACTIVAR */}
      {/* ============================================================ */}
      <AlertDialog open={openReactivar} onOpenChange={setOpenReactivar}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="rounded-full bg-green-500/20 p-2">
                <RotateCcw className="h-5 w-5 text-green-600" />
              </div>
              <AlertDialogTitle className="text-lg">
                ¿Reactivar esta captura?
              </AlertDialogTitle>
            </div>
            <AlertDialogDescription className="text-sm">
              <span className="block">
                La captura volverá al estado <strong>Pendiente</strong> y se
                ejecutará en su horario programado.
              </span>
              <span className="block mt-2 text-xs bg-green-500/10 border border-green-500/20 rounded-md p-2 text-green-700">
                💡 Asegúrate de que la fecha y hora sean correctas.
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={loading}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleReactivar}
              disabled={loading}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              {loading ? 'Procesando...' : 'Sí, reactivar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ============================================================ */}
      {/* DIALOG: ELIMINAR */}
      {/* ============================================================ */}
      <AlertDialog open={openEliminar} onOpenChange={setOpenEliminar}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="rounded-full bg-red-500/20 p-2">
                <XCircle className="h-5 w-5 text-red-600" />
              </div>
              <AlertDialogTitle className="text-lg">
                ¿Eliminar esta captura?
              </AlertDialogTitle>
            </div>
            <AlertDialogDescription className="text-sm">
              <span className="block">
                Esta acción <strong>no se puede deshacer</strong>. Se eliminará
                la captura programada y todo su historial de ejecuciones
                asociado.
              </span>
              <span className="block mt-2 text-xs bg-red-500/10 border border-red-500/20 rounded-md p-2 text-red-700">
                ⚠️ Las imágenes en S3 <strong>no</strong> se eliminan
                automáticamente.
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={loading}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleEliminar}
              disabled={loading}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {loading ? 'Eliminando...' : 'Sí, eliminar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}