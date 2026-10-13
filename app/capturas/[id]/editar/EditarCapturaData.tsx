import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import CapturaForm from '@/components/panel/capturas/CapturaForm'

export default async function EditarCapturaData({ id }: { id: string }) {
  const supabase = await createClient()

  const { data: captura, error } = await supabase
    .from('capturas_programadas')
    .select(`
      id,
      marca_id,
      url,
      tipo_evidencia,
      fecha,
      hora,
      descripcion,
      formato,
      numero_slide,
      estado
    `)
    .eq('id', id)
    .single()

  if (error || !captura) {
    notFound()
  }

  if (captura.estado === 'ejecutada') {
    return (
      <div className="p-6 rounded-md bg-yellow-500/10 border border-yellow-500/20 text-yellow-600">
        ⚠️ Esta captura ya fue ejecutada y no se puede editar.
      </div>
    )
  }

  return (
    <CapturaForm
      capturaId={captura.id}
      initialData={{
        marca_id: captura.marca_id,
        url: captura.url,
        tipo_evidencia: captura.tipo_evidencia,
        fecha: captura.fecha,
        hora: captura.hora,
        descripcion: captura.descripcion || '',
        formato: captura.formato || 'jpg',
        numero_slide: captura.numero_slide,
      }}
    />
  )
}