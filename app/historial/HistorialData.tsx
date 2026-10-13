'use client'

import { useState, useEffect, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Search, Calendar, CheckCircle2, XCircle, Clock, Eye } from 'lucide-react'
import Link from 'next/link'

// ============================================================
// UTILIDADES
// ============================================================

function formatearFecha(fecha: string) {
  const date = new Date(fecha + 'T00:00:00')
  const hoy = new Date()
  hoy.setHours(0, 0, 0, 0)
  const ayer = new Date(hoy)
  ayer.setDate(ayer.getDate() - 1)
  const manana = new Date(hoy)
  manana.setDate(manana.getDate() + 1)

  if (date.getTime() === hoy.getTime()) return 'HOY'
  if (date.getTime() === ayer.getTime()) return 'AYER'
  if (date.getTime() === manana.getTime()) return 'MAÑANA'

  return date.toLocaleDateString('es-PE', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    timeZone: 'America/Lima',
  })
}

function formatearHora(hora: string) {
  return hora?.slice(0, 5) || '--:--'
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
    <Badge variant="outline" className={`text-xs ${c.className}`}>
      {c.icon} {c.label}
    </Badge>
  )
}

type FiltroFecha = 'todos' | 'hoy' | '7dias' | '30dias'

// ============================================================
// COMPONENTE PRINCIPAL
// ============================================================

export default function HistorialData() {
  const supabase = useMemo(() => createClient(), [])

  const [loading, setLoading] = useState(true)
  const [capturas, setCapturas] = useState<any[]>([])
  const [mapaEvidencias, setMapaEvidencias] = useState<Record<string, any>>({})

  const [filtroCliente, setFiltroCliente] = useState<string>('todos')
  const [filtroMarca, setFiltroMarca] = useState<string>('todos')
  const [filtroEstado, setFiltroEstado] = useState<string>('todos')
  const [filtroFecha, setFiltroFecha] = useState<FiltroFecha>('todos')
  const [busqueda, setBusqueda] = useState<string>('')

  const [pagina, setPagina] = useState(1)
  const itemsPorPagina = 10

  useEffect(() => {
    let isMounted = true

    const loadData = async () => {
      const [capturasRes, tiposRes] = await Promise.all([
        supabase
          .from('capturas_programadas')
          .select(`
            id,
            fecha,
            hora,
            estado,
            descripcion,
            formato,
            numero_slide,
            url,
            tipo_evidencia,
            marcas (
              id,
              nombre,
              clientes ( id, nombre )
            )
          `)
          .order('fecha', { ascending: false })
          .order('hora', { ascending: false })
          .limit(500),
        supabase
          .from('tipos_evidencia')
          .select('codigo, nombre, icono')
          .eq('activo', true),
      ])

      if (!isMounted) return

      setCapturas(capturasRes.data || [])
      setMapaEvidencias(
        Object.fromEntries((tiposRes.data || []).map((t) => [t.codigo, t]))
      )
      setLoading(false)
    }
    loadData()

    return () => {
      isMounted = false
    }
  }, [supabase])

  const extraerDatos = (captura: any) => {
    if (captura.marcas) {
      const evInfo = mapaEvidencias[captura.tipo_evidencia]
      return {
        clienteId: captura.marcas.clientes?.id,
        clienteNombre: captura.marcas.clientes?.nombre || 'Sin cliente',
        marcaId: captura.marcas.id,
        marcaNombre: captura.marcas.nombre || 'Sin marca',
        evidenciaNombre: evInfo
          ? `${evInfo.icono} ${evInfo.nombre}`
          : captura.tipo_evidencia || 'Sin tipo',
        url: captura.url || '',
      }
    }
    return {
      clienteId: null,
      clienteNombre: 'Sin cliente',
      marcaId: null,
      marcaNombre: 'Sin marca',
      evidenciaNombre: captura.tipo_evidencia || 'Sin tipo',
      url: captura.url || '',
    }
  }

  const clientes = useMemo(() => {
    const set = new Map<number, string>()
    capturas.forEach((c) => {
      const { clienteId, clienteNombre } = extraerDatos(c)
      if (clienteId && clienteNombre !== 'Sin cliente') {
        set.set(clienteId, clienteNombre)
      }
    })
    return Array.from(set.entries()).sort((a, b) => a[1].localeCompare(b[1]))
  }, [capturas, mapaEvidencias])

  const marcas = useMemo(() => {
    const set = new Map<number, string>()
    capturas.forEach((c) => {
      const { clienteId, marcaId, marcaNombre } = extraerDatos(c)
      if (marcaId && marcaNombre !== 'Sin marca') {
        if (filtroCliente === 'todos' || String(clienteId) === filtroCliente) {
          set.set(marcaId, marcaNombre)
        }
      }
    })
    return Array.from(set.entries()).sort((a, b) => a[1].localeCompare(b[1]))
  }, [capturas, filtroCliente, mapaEvidencias])

  const capturasFiltradas = useMemo(() => {
    const hoy = new Date()
    hoy.setHours(0, 0, 0, 0)

    return capturas.filter((c) => {
      const { clienteId, marcaId, evidenciaNombre, url } = extraerDatos(c)

      if (filtroCliente !== 'todos' && String(clienteId) !== filtroCliente)
        return false
      if (filtroMarca !== 'todos' && String(marcaId) !== filtroMarca) return false
      if (filtroEstado !== 'todos' && c.estado !== filtroEstado) return false

      if (filtroFecha !== 'todos') {
        const fechaCaptura = new Date(c.fecha + 'T00:00:00')
        const diffDias = Math.floor(
          (hoy.getTime() - fechaCaptura.getTime()) / (1000 * 60 * 60 * 24)
        )
        if (filtroFecha === 'hoy' && diffDias !== 0) return false
        if (filtroFecha === '7dias' && diffDias > 7) return false
        if (filtroFecha === '30dias' && diffDias > 30) return false
      }

      if (busqueda) {
        const q = busqueda.toLowerCase()
        if (
          !evidenciaNombre.toLowerCase().includes(q) &&
          !url.toLowerCase().includes(q) &&
          !c.marcas?.nombre?.toLowerCase().includes(q) &&
          !c.marcas?.clientes?.nombre?.toLowerCase().includes(q)
        ) {
          return false
        }
      }
      return true
    })
  }, [
    capturas,
    filtroCliente,
    filtroMarca,
    filtroEstado,
    filtroFecha,
    busqueda,
    mapaEvidencias,
  ])

  const total = capturas.length
  const pendientes = capturas.filter((c) => c.estado === 'pendiente').length
  const ejecutadas = capturas.filter((c) => c.estado === 'ejecutada').length
  const canceladas = capturas.filter((c) => c.estado === 'cancelada').length

  const totalPaginas = Math.ceil(capturasFiltradas.length / itemsPorPagina)
  const capturasPaginadas = capturasFiltradas.slice(
    (pagina - 1) * itemsPorPagina,
    pagina * itemsPorPagina
  )

  useEffect(() => {
    setPagina(1)
  }, [filtroCliente, filtroMarca, filtroEstado, filtroFecha, busqueda])

  if (loading) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground">
          Cargando historial...
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-blue-500/10 to-blue-500/5 border-blue-500/20">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Total
                </p>
                <p className="text-3xl font-bold mt-1">{total}</p>
              </div>
              <Calendar className="h-8 w-8 text-blue-500/50" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-500/10 to-green-500/5 border-green-500/20">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Ejecutadas
                </p>
                <p className="text-3xl font-bold mt-1 text-green-600">
                  {ejecutadas}
                </p>
              </div>
              <CheckCircle2 className="h-8 w-8 text-green-500/50" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-yellow-500/10 to-yellow-500/5 border-yellow-500/20">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Pendientes
                </p>
                <p className="text-3xl font-bold mt-1 text-yellow-600">
                  {pendientes}
                </p>
              </div>
              <Clock className="h-8 w-8 text-yellow-500/50" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-red-500/10 to-red-500/5 border-red-500/20">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Canceladas
                </p>
                <p className="text-3xl font-bold mt-1 text-red-600">
                  {canceladas}
                </p>
              </div>
              <XCircle className="h-8 w-8 text-red-500/50" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="pt-6 space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-medium text-muted-foreground mr-2">
              Período:
            </span>
            {(['todos', 'hoy', '7dias', '30dias'] as FiltroFecha[]).map((f) => (
              <Button
                key={f}
                variant={filtroFecha === f ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFiltroFecha(f)}
              >
                {f === 'todos' && 'Todo'}
                {f === 'hoy' && 'Hoy'}
                {f === '7dias' && 'Últimos 7 días'}
                {f === '30dias' && 'Últimos 30 días'}
              </Button>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <Select value={filtroCliente} onValueChange={setFiltroCliente}>
              <SelectTrigger>
                <SelectValue placeholder="Cliente" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos los clientes</SelectItem>
                {clientes.map(([id, nombre]) => (
                  <SelectItem key={id} value={String(id)}>
                    {nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filtroMarca} onValueChange={setFiltroMarca}>
              <SelectTrigger>
                <SelectValue placeholder="Marca" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todas las marcas</SelectItem>
                {marcas.map(([id, nombre]) => (
                  <SelectItem key={id} value={String(id)}>
                    {nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filtroEstado} onValueChange={setFiltroEstado}>
              <SelectTrigger>
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos los estados</SelectItem>
                <SelectItem value="pendiente">⏳ Pendientes</SelectItem>
                <SelectItem value="ejecutada">✅ Ejecutadas</SelectItem>
                <SelectItem value="cancelada">❌ Canceladas</SelectItem>
              </SelectContent>
            </Select>

            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Resultados */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">
          {capturasFiltradas.length} capturas
          {capturasFiltradas.length !== capturas.length && (
            <span className="text-sm font-normal text-muted-foreground ml-2">
              (de {capturas.length} totales)
            </span>
          )}
        </h2>
        {(filtroCliente !== 'todos' ||
          filtroMarca !== 'todos' ||
          filtroEstado !== 'todos' ||
          filtroFecha !== 'todos' ||
          busqueda) && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setFiltroCliente('todos')
              setFiltroMarca('todos')
              setFiltroEstado('todos')
              setFiltroFecha('todos')
              setBusqueda('')
            }}
          >
            Limpiar filtros
          </Button>
        )}
      </div>

      {/* VISTA DE LISTA (compacta) */}
      {capturasPaginadas.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            No hay capturas que coincidan con los filtros.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-1">
          {capturasPaginadas.map((cap: any) => {
            const datos = extraerDatos(cap)
            const rango = formatearFecha(cap.fecha)

            return (
              <Link key={cap.id} href={`/capturas/${cap.id}`}>
                <Card className="hover:border-primary/40 transition-all cursor-pointer group">
                  <CardContent className="p-0">
                    <div className="flex items-center gap-4 p-2">
                      {/* Thumbnail pequeño */}
                      <div className="w-24 h-16 rounded-md overflow-hidden bg-muted/30 flex-shrink-0">
                        {cap.estado === 'ejecutada' ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={`/capturas/${cap.id}/imagen`}
                            alt=""
                            className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform"
                            loading="lazy"
                          />
                        ) : (
                          <div className="flex items-center justify-center h-full">
                            <span className="text-2xl">
                              {cap.estado === 'pendiente' ? '⏳' : '❌'}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Fecha y hora */}
                      <div className="w-28 flex-shrink-0">
                        <p className="text-sm font-semibold">{rango}</p>
                        <p className="text-xs text-muted-foreground font-mono">
                          {formatearHora(cap.hora)}
                        </p>
                      </div>

                      {/* Evidencia */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {datos.evidenciaNombre}
                          {cap.numero_slide && (
                            <span className="ml-2 text-xs text-blue-600">
                              · Slide {cap.numero_slide}
                            </span>
                          )}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          🏢 {datos.clienteNombre} · 🏷️ {datos.marcaNombre}
                        </p>
                      </div>

                      {/* Estado */}
                      <div className="flex-shrink-0">
                        <EstadoBadge estado={cap.estado} />
                      </div>

                      {/* Ver */}
                      <div className="flex-shrink-0 pr-2">
                        <Eye className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            )
          })}
        </div>
      )}

      {/* Paginación */}
      {totalPaginas > 1 && (
        <div className="flex items-center justify-center gap-2 pt-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPagina((p) => Math.max(1, p - 1))}
            disabled={pagina === 1}
          >
            ← Anterior
          </Button>
          <span className="text-sm text-muted-foreground px-4">
            Página {pagina} de {totalPaginas}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPagina((p) => Math.min(totalPaginas, p + 1))}
            disabled={pagina === totalPaginas}
          >
            Siguiente →
          </Button>
        </div>
      )}
    </>
  )
}