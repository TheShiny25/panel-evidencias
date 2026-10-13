import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { notFound } from 'next/navigation'

// ============================================================
// UTILIDADES DE FECHA (formato 24 horas, hora Lima)
// ============================================================

const DIAS_SEMANA = [
  'domingo',
  'lunes',
  'martes',
  'miércoles',
  'jueves',
  'viernes',
  'sábado',
]

const DIAS_SEMANA_CORTOS = ['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb']

const MESES = [
  'enero',
  'febrero',
  'marzo',
  'abril',
  'mayo',
  'junio',
  'julio',
  'agosto',
  'septiembre',
  'octubre',
  'noviembre',
  'diciembre',
]

const MESES_CORTOS = [
  'ene',
  'feb',
  'mar',
  'abr',
  'may',
  'jun',
  'jul',
  'ago',
  'sep',
  'oct',
  'nov',
  'dic',
]

/**
 * Parseo robusto de timestamp UTC → componentes hora Lima (UTC-5)
 */
function parsearTimestampUTC(timestamp: string) {
  const match = timestamp.match(
    /(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2}):(\d{2})/
  )

  if (!match) {
    const d = new Date(timestamp)
    const limaMs = d.getTime() - 5 * 60 * 60 * 1000
    const lima = new Date(limaMs)
    return {
      anio: lima.getUTCFullYear(),
      mes: lima.getUTCMonth() + 1,
      dia: lima.getUTCDate(),
      hora: lima.getUTCHours(),
      minuto: lima.getUTCMinutes(),
      segundo: lima.getUTCSeconds(),
      diaSemana: lima.getUTCDay(),
    }
  }

  const [_, anioStr, mesStr, diaStr, horaStr, minStr, segStr] = match

  const utc = new Date(
    Date.UTC(
      Number(anioStr),
      Number(mesStr) - 1,
      Number(diaStr),
      Number(horaStr),
      Number(minStr),
      Number(segStr)
    )
  )

  const lima = new Date(utc.getTime() - 5 * 60 * 60 * 1000)

  return {
    anio: lima.getUTCFullYear(),
    mes: lima.getUTCMonth() + 1,
    dia: lima.getUTCDate(),
    hora: lima.getUTCHours(),
    minuto: lima.getUTCMinutes(),
    segundo: lima.getUTCSeconds(),
    diaSemana: lima.getUTCDay(),
  }
}

/**
 * Formato 24h: "jueves, 8 de octubre de 2026, 22:54"
 */
function formatearFechaHora(fecha: string, hora: string) {
  const [anio, mes, dia] = fecha.split('-').map(Number)
  const [hh, mm] = (hora || '00:00').split(':').map(Number)

  const diaSemana = new Date(anio, mes - 1, dia).getDay()

  return `${DIAS_SEMANA[diaSemana]}, ${dia} de ${
    MESES[mes - 1]
  } de ${anio}, ${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`
}

/**
 * Formato corto: "vie, 9 oct"
 */
function formatearFecha(fecha: string) {
  const [anio, mes, dia] = fecha.split('-').map(Number)
  const diaSemana = new Date(anio, mes - 1, dia).getDay()

  return `${DIAS_SEMANA_CORTOS[diaSemana]}, ${dia} ${MESES_CORTOS[mes - 1]}`
}

/**
 * Formato completo 24h: "jueves, 8 de octubre de 2026, 22:54:28"
 */
function formatearEjecucion(ejecutada_en: string) {
  const lima = parsearTimestampUTC(ejecutada_en)

  return `${DIAS_SEMANA[lima.diaSemana]}, ${lima.dia} de ${
    MESES[lima.mes - 1]
  } de ${lima.anio}, ${String(lima.hora).padStart(2, '0')}:${String(
    lima.minuto
  ).padStart(2, '0')}:${String(lima.segundo).padStart(2, '0')}`
}

/**
 * Formato compacto: "08/10/2026, 22:54:28"
 */
function formatearEjecucionCompacta(ejecutada_en: string) {
  const lima = parsearTimestampUTC(ejecutada_en)

  return `${String(lima.dia).padStart(2, '0')}/${String(lima.mes).padStart(
    2,
    '0'
  )}/${lima.anio}, ${String(lima.hora).padStart(2, '0')}:${String(
    lima.minuto
  ).padStart(2, '0')}:${String(lima.segundo).padStart(2, '0')}`
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

export default async function CapturaDetalleData({ id }: { id: string }) {
  const supabase = await createClient()

  const { data: captura, error } = await supabase
    .from('capturas_programadas')
    .select(`
      id,
      fecha,
      hora,
      estado,
      descripcion,
      ejecutada_en,
      formato,
      numero_slide,
      url,
      tipo_evidencia,
      timezone,
      marcas (
        id,
        nombre,
        clientes (
          id,
          nombre,
          pais
        )
      )
    `)
    .eq('id', id)
    .single()

  if (error || !captura) {
    notFound()
  }

  const { data: tipoEvidenciaInfo } = await supabase
    .from('tipos_evidencia')
    .select('codigo, nombre, icono')
    .eq('codigo', captura.tipo_evidencia)
    .maybeSingle()

  const { data: log } = await supabase
    .from('execution_logs')
    .select('*')
    .eq('captura_id', id)
    .order('timestamp', { ascending: false })
    .limit(1)
    .maybeSingle()

  const { data: historial } = await supabase
    .from('capturas_programadas')
    .select(`
      id,
      fecha,
      hora,
      estado,
      ejecutada_en,
      tipo_evidencia,
      numero_slide
    `)
    .eq('marca_id', captura.marcas?.id)
    .neq('id', id)
    .order('fecha', { ascending: false })
    .order('hora', { ascending: false })
    .limit(5)

  const marca = captura.marcas as any
  const cliente = marca?.clientes

  const etiquetaEvidencia = tipoEvidenciaInfo
    ? `${tipoEvidenciaInfo.icono} ${tipoEvidenciaInfo.nombre}`
    : captura.tipo_evidencia || 'Sin tipo'

  const imageUrl = log?.s3_key ? `/capturas/${captura.id}/imagen` : null

  return (
    <>
      {/* Breadcrumb */}
      <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
        <Link href="/clientes" className="hover:underline">
          🏢 Clientes
        </Link>
        <span>/</span>
        <Link href={`/clientes/${cliente?.id}`} className="hover:underline">
          {cliente?.nombre || 'Sin cliente'}
        </Link>
        <span>/</span>
        <Link href={`/marcas/${marca?.id}`} className="hover:underline">
          {marca?.nombre || 'Sin marca'}
        </Link>
        <span>/</span>
        <span>{etiquetaEvidencia}</span>
      </div>

      {/* Encabezado */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">📸 Detalle de Captura</h1>
          <p className="text-muted-foreground">
            {cliente?.nombre} · {marca?.nombre} · {etiquetaEvidencia}
            {captura.numero_slide && ` · Slide ${captura.numero_slide}`}
          </p>
        </div>
        <EstadoBadge estado={captura.estado} />
      </div>

      {/* Layout: imagen + panel de metadatos */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Visor de imagen */}
        <div className="lg:col-span-2 space-y-3">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">🖼️ Evidencia capturada</CardTitle>
                {imageUrl && (
                  <a
                    href={imageUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-blue-500 hover:underline"
                  >
                    Abrir en nueva pestaña ↗
                  </a>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {captura.estado === 'pendiente' ? (
                <div className="flex flex-col items-center justify-center py-20 text-center space-y-3 bg-muted/30 rounded-md">
                  <span className="text-5xl">⏳</span>
                  <p className="text-muted-foreground">
                    Esta captura aún no se ha ejecutado.
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Programada para{' '}
                    {formatearFechaHora(captura.fecha, captura.hora)}
                  </p>
                </div>
              ) : imageUrl ? (
                <div className="space-y-3">
                  <div
                    className="relative rounded-md border bg-muted/20 overflow-y-auto overflow-x-hidden"
                    style={{ maxHeight: '600px' }}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={imageUrl}
                      alt={`Evidencia de ${etiquetaEvidencia}`}
                      className="w-full h-auto block"
                    />
                  </div>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>
                      🕐 Ejecutada:{' '}
                      {log?.timestamp
                        ? formatearEjecucionCompacta(log.timestamp)
                        : 'Sin fecha de ejecución'}{' '}
                      <span className="ml-1 text-[10px] uppercase tracking-wider opacity-60">
                        (hora Lima)
                      </span>
                    </span>
                    {log?.image_size && (
                      <span>📦 {(log.image_size / 1024).toFixed(1)} KB</span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground text-center">
                    💡 Usa la barra de scroll del visor para recorrer la imagen
                    completa
                  </p>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-20 text-center space-y-3 bg-muted/30 rounded-md">
                  <span className="text-5xl">🔍</span>
                  <p className="text-muted-foreground">
                    No se encontró la imagen de la evidencia.
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Estado: {captura.estado}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Panel de metadatos */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">📋 Información</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div>
                <p className="text-muted-foreground">Cliente</p>
                <p className="font-medium">{cliente?.nombre || '-'}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Marca</p>
                <p className="font-medium">{marca?.nombre || '-'}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Tipo de evidencia</p>
                <p className="font-medium">{etiquetaEvidencia}</p>
              </div>
              {captura.numero_slide && (
                <div>
                  <p className="text-muted-foreground">Posición del slide</p>
                  <p className="font-medium">Slide {captura.numero_slide}</p>
                </div>
              )}
              <div>
                <p className="text-muted-foreground">URL verificada</p>
                <a
                  href={captura.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-blue-500 hover:underline break-all"
                >
                  {captura.url}
                </a>
              </div>
              <div>
                <p className="text-muted-foreground">Programada</p>
                <p className="font-medium">
                  {formatearFechaHora(captura.fecha, captura.hora)}
                </p>
              </div>
              {captura.ejecutada_en && (
                <div>
                  <p className="text-muted-foreground">Ejecutada</p>
                  <p className="font-medium">
                    {formatearEjecucion(captura.ejecutada_en)}
                  </p>
                </div>
              )}
              {captura.descripcion && (
                <div>
                  <p className="text-muted-foreground">Descripción</p>
                  <p className="font-medium">{captura.descripcion}</p>
                </div>
              )}
              {log?.sha256_hash && (
                <div>
                  <p className="text-muted-foreground">SHA-256</p>
                  <p className="font-mono text-xs break-all">
                    {log.sha256_hash}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6 space-y-2">
              {imageUrl && (
                <a
                  href={imageUrl}
                  download={`evidencia_${captura.id}.${captura.formato || 'jpg'}`}
                  className="block"
                >
                  <Button variant="outline" className="w-full">
                    📥 Descargar evidencia
                  </Button>
                </a>
              )}
              <Link href={`/marcas/${marca?.id}`} className="block">
                <Button variant="ghost" className="w-full">
                  ← Volver a {marca?.nombre || 'la marca'}
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Historial */}
      {historial && historial.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">📜 Historial de capturas</h2>
            <Link
              href={`/marcas/${marca?.id}`}
              className="text-sm text-blue-500 hover:underline"
            >
              Ver todas →
            </Link>
          </div>
          <Card>
            <CardContent className="pt-6 space-y-2">
              {historial.map((h: any) => {
                const etiqueta = h.tipo_evidencia || 'Sin tipo'

                return (
                  <Link key={h.id} href={`/capturas/${h.id}`}>
                    <div className="flex items-center justify-between p-3 rounded-md hover:bg-muted/50 transition-colors">
                      <div className="flex items-center gap-4 flex-1 min-w-0">
                        <span className="text-sm font-medium whitespace-nowrap">
                          📅 {formatearFecha(h.fecha)}
                        </span>
                        <span className="font-mono text-sm text-muted-foreground whitespace-nowrap">
                          🕐 {h.hora?.slice(0, 5)}
                        </span>
                        <span className="text-sm font-medium truncate">
                          {etiqueta}
                        </span>
                        {h.numero_slide && (
                          <span className="text-xs text-blue-600 whitespace-nowrap">
                            · Slide {h.numero_slide}
                          </span>
                        )}
                      </div>
                      <EstadoBadge estado={h.estado} />
                    </div>
                  </Link>
                )
              })}
            </CardContent>
          </Card>
        </div>
      )}
    </>
  )
}