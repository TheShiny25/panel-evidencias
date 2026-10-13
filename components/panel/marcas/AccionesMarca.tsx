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
import { MoreVertical, Pencil, Trash2 } from 'lucide-react'
import MarcaFormDialog from './MarcaFormDialog'

type AccionesMarcaProps = {
  marcaId: number
  marcaNombre: string
  clienteId: number
}

export default function AccionesMarca({
  marcaId,
  marcaNombre,
  clienteId,
}: AccionesMarcaProps) {
  const router = useRouter()
  const supabase = createClient()

  const [openEditar, setOpenEditar] = useState(false)
  const [openEliminar, setOpenEliminar] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleEliminar = async () => {
    setLoading(true)
    const { error } = await supabase.from('marcas').delete().eq('id', marcaId)

    setLoading(false)
    setOpenEliminar(false)

    if (error) {
      alert('Error al eliminar: ' + error.message)
      return
    }

    router.refresh()
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <MoreVertical className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem
            className="flex items-center gap-2 cursor-pointer"
            onSelect={(e) => {
              e.preventDefault()
              setOpenEditar(true)
            }}
          >
            <Pencil className="h-4 w-4" />
            Editar
          </DropdownMenuItem>

          <DropdownMenuItem
            className="flex items-center gap-2 text-red-600 cursor-pointer"
            onSelect={(e) => {
              e.preventDefault()
              setOpenEliminar(true)
            }}
          >
            <Trash2 className="h-4 w-4" />
            Eliminar
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Diálogo editar (controlado) */}
      <MarcaFormDialog
        marcaId={marcaId}
        initialData={{ nombre: marcaNombre, cliente_id: clienteId }}
        open={openEditar}
        onOpenChange={setOpenEditar}
      />

      {/* Diálogo eliminar */}
      <AlertDialog open={openEliminar} onOpenChange={setOpenEliminar}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              ¿Eliminar marca &quot;{marcaNombre}&quot;?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminarán también todas las
              capturas asociadas a esta marca.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={loading}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleEliminar}
              disabled={loading}
              className="bg-red-600 hover:bg-red-700"
            >
              {loading ? 'Eliminando...' : 'Sí, eliminar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}