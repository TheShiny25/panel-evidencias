import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { notFound } from 'next/navigation'
import AccionesCaptura from '@/components/panel/capturas/AccionesCaptura'

function formatearFecha(fecha: string) {
  const date = new Date(fecha + 'T00:00:00')
  return date.toLocaleDateString('es-PE', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  })
}

function EstadoBadge({ estado }: { estado: string }) {
  const config: Record<string, { label: string; className: string; icon: string }> = {
    pendiente: {
      label: 'Pendiente',
      className: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20',
      icon: '⏳',
    },
    ejecutada: {
      label: 'Ejecutada',
      className: 'bg-green-500/10 text-green-600 border-green-500/20',
      icon: '✅',
    },
    cancelada: {
      label: 'Cancelada',
      className: 'bg-red-500/10 text-red-600 border-red-500/20',
      icon: '❌',
    },
  }
  const c = config[estado] || config.pendiente
  return (
    <Badge variant="outline" className={c.className}>
      {c.icon} {c.label}
    </Badge>
  )
}

export default async function MarcaDetalleData({ id }: { id: string }) {
  const supabase = await createClient()

  // Cargar marca
  const { data: marca, error: marcaError } = await supabase
    .from('marcas')
    .select(`
      id,
      nombre,
      clientes ( id, nombre, pais )
    `)
    .eq('id', id)
    .single()

  if (marcaError || !marca) {
    notFound()
  }

  // Cargar capturas de esta marca
  const { data: capturas } = await supabase
    .from('capturas_programadas')
    .select(`
      id,
      fecha,
      hora,
      estado,
      descripcion,
      numero_slide,
      url,
      tipo_evidencia,
      formato
    `)
    .eq('marca_id', id)
    .order('fecha', { ascending: false })
    .order('hora', { ascending: false })

  // Cargar tipos de evidencia para el nombre
  const { data: tiposEvidencia } = await supabase
    .from('tipos_evidencia')
    .select('codigo, nombre, icono')
    .eq('activo', true)

  const mapaEvidencias = Object.fromEntries(
    (tiposEvidencia || []).map((t) => [t.codigo, t])
  )

  // Separar pendientes y ejecutadas
  const pendientes = (capturas || []).filter((c) => c.estado === 'pendiente')
  const ejecutadas = (capturas || []).filter((c) => c.estado === 'ejecutada')
  const canceladas = (capturas || []).filter((c) => c.estado === 'cancelada')

  return (
    <>
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link href="/clientes" className="hover:underline">
          🏢 Clientes
        </Link>
        <span>/</span>
        <Link
          href={`/clientes/${(marca.clientes as any)?.id}`}
          className="hover:underline"
        >
          {(marca.clientes as any)?.nombre}
        </Link>
        <span>/</span>
        <span>{marca.nombre}</span>
      </div>

      {/* Encabezado */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">🏷️ {marca.nombre}</h1>
          <p className="text-muted-foreground">
            Cliente: {(marca.clientes as any)?.nombre} · {capturas?.length || 0} capturas
          </p>
        </div>
        <Link href="/programar">
          <Button>+ Programar captura</Button>
        </Link>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Pendientes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {pendientes.length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Ejecutadas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {ejecutadas.length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Canceladas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {canceladas.length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Capturas */}
      {(!capturas || capturas.length === 0) ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            Esta marca no tiene capturas programadas.
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">📋 Capturas programadas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {capturas.map((captura: any) => {
              const evidenciaInfo = mapaEvidencias[captura.tipo_evidencia]
              const etiqueta = evidenciaInfo
                ? `${evidenciaInfo.icono} ${evidenciaInfo.nombre}`
                : captura.tipo_evidencia || 'Sin tipo'

              return (
                <div
                  key={captura.id}
                  className="flex items-center justify-between p-3 rounded-md bg-muted/40 hover:bg-muted/60 transition-colors"
                >
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    <span className="text-sm font-medium whitespace-nowrap">
                      📅 {formatearFecha(captura.fecha)}
                    </span>
                    <span className="font-mono text-sm text-muted-foreground whitespace-nowrap">
                      🕐 {captura.hora?.slice(0, 5)}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">
                        {etiqueta}
                        {captura.numero_slide && (
                          <span className="ml-2 text-xs text-blue-600">
                            · Slide {captura.numero_slide}
                          </span>
                        )}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {captura.url}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <EstadoBadge estado={captura.estado} />
                    <AccionesCaptura
                      capturaId={captura.id}
                      estado={captura.estado}
                    />
                  </div>
                </div>
              )
            })}
          </CardContent>
        </Card>
      )}
    </>
  )
}