'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
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
import {
  ChevronDown,
  ChevronRight,
  Calendar,
  CheckCircle2,
  Clock,
  Search,
  Loader2,
} from 'lucide-react'
import AccionesCaptura from '@/components/panel/capturas/AccionesCaptura'

// ============================================================
// UTILIDADES
// ============================================================

function formatearFecha(fecha: string) {
  const date = new Date(fecha + 'T00:00:00')
  const hoy = new Date()
  hoy.setHours(0, 0, 0, 0)
  const manana = new Date(hoy)
  manana.setDate(manana.getDate() + 1)

  if (date.getTime() === hoy.getTime()) return 'HOY'
  if (date.getTime() === manana.getTime()) return 'MAÑANA'

  return date.toLocaleDateString('es-PE', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'America/Lima',
  })
}

function formatearHora(hora: string) {
  return hora?.slice(0, 5) || '--:--'
}

function getHoyLima(): string {
  return new Date().toLocaleDateString('en-CA', {
    timeZone: 'America/Lima',
  })
}

function getMananaLima(): string {
  return new Date(Date.now() + 86400000).toLocaleDateString('en-CA', {
    timeZone: 'America/Lima',
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
    <Badge variant="outline" className={`text-xs ${c.className}`}>
      {c.icon} {c.label}
    </Badge>
  )
}

type TabActivo = 'proximos' | 'hoy' | 'todos'

// ============================================================
// COMPONENTE PRINCIPAL
// ============================================================

export default function CalendarioData() {
  const supabase = useMemo(() => createClient(), [])

  const [loading, setLoading] = useState(true)
  const [capturas, setCapturas] = useState<any[]>([])
  const [mapaEvidencias, setMapaEvidencias] = useState<Record<string, any>>({})

  // Filtros
  const [tabActivo, setTabActivo] = useState<TabActivo>('proximos')
  const [filtroCliente, setFiltroCliente] = useState<string>('todos')
  const [filtroMarca, setFiltroMarca] = useState<string>('todos')
  const [filtroEstado, setFiltroEstado] = useState<string>('todos')
  const [busqueda, setBusqueda] = useState<string>('')

  // Fechas colapsables
  const [fechasExpandidas, setFechasExpandidas] = useState<Set<string>>(new Set())

  // Cargar TODAS las capturas (incluye canceladas)
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
            formato,
            numero_slide,
            url,
            tipo_evidencia,
            marca_id,
            marcas (
              id,
              nombre,
              cliente_id,
              clientes ( id, nombre )
            )
          `)
          .order('fecha', { ascending: true })
          .order('hora', { ascending: true })
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

  const extraerDatos = useCallback(
    (captura: any) => {
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
    },
    [mapaEvidencias]
  )

  const clientes = useMemo(() => {
    const set = new Map<number, string>()
    capturas.forEach((c) => {
      const { clienteId, clienteNombre } = extraerDatos(c)
      if (clienteId && clienteNombre !== 'Sin cliente') {
        set.set(clienteId, clienteNombre)
      }
    })
    return Array.from(set.entries()).sort((a, b) => a[1].localeCompare(b[1]))
  }, [capturas, extraerDatos])

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
  }, [capturas, filtroCliente, extraerDatos])

  const capturasFiltradas = useMemo(() => {
    const hoy = getHoyLima()
    const busquedaLower = busqueda.toLowerCase()

    return capturas.filter((c) => {
      // Tab filter
      if (tabActivo === 'hoy' && c.fecha !== hoy) return false
      if (tabActivo === 'proximos' && c.fecha < hoy) return false

      // Filtro de estado
      if (filtroEstado !== 'todos' && c.estado !== filtroEstado) return false

      // Filtros cliente/marca
      if (filtroCliente !== 'todos' || filtroMarca !== 'todos') {
        const { clienteId, marcaId } = extraerDatos(c)
        if (filtroCliente !== 'todos' && String(clienteId) !== filtroCliente)
          return false
        if (filtroMarca !== 'todos' && String(marcaId) !== filtroMarca)
          return false
      }

      // Búsqueda
      if (busquedaLower) {
        const { evidenciaNombre, url, clienteNombre, marcaNombre } =
          extraerDatos(c)
        if (
          !evidenciaNombre.toLowerCase().includes(busquedaLower) &&
          !url.toLowerCase().includes(busquedaLower) &&
          !clienteNombre.toLowerCase().includes(busquedaLower) &&
          !marcaNombre.toLowerCase().includes(busquedaLower)
        ) {
          return false
        }
      }
      return true
    })
  }, [
    capturas,
    tabActivo,
    filtroCliente,
    filtroMarca,
    filtroEstado,
    busqueda,
    extraerDatos,
  ])

  const agrupado = useMemo(() => {
    return capturasFiltradas.reduce((acc: any, captura: any) => {
      const fecha = captura.fecha
      if (!acc[fecha]) acc[fecha] = []
      acc[fecha].push(captura)
      return acc
    }, {})
  }, [capturasFiltradas])

  const fechas = useMemo(() => Object.keys(agrupado).sort(), [agrupado])

  useEffect(() => {
    if (fechas.length > 0 && fechasExpandidas.size === 0) {
      const hoy = getHoyLima()
      const manana = getMananaLima()
      const inicial = new Set<string>()
      if (agrupado[hoy]) inicial.add(hoy)
      if (agrupado[manana]) inicial.add(manana)
      setFechasExpandidas(inicial)
    }
  }, [fechas.length, agrupado])

  const toggleFecha = useCallback((fecha: string) => {
    setFechasExpandidas((prev) => {
      const nuevas = new Set(prev)
      if (nuevas.has(fecha)) {
        nuevas.delete(fecha)
      } else {
        nuevas.add(fecha)
      }
      return nuevas
    })
  }, [])

  const expandirTodas = useCallback(() => {
    setFechasExpandidas(new Set(fechas))
  }, [fechas])

  const colapsarTodas = useCallback(() => {
    setFechasExpandidas(new Set())
  }, [])

  const hoy = getHoyLima()
  const totalHoy = useMemo(
    () => capturas.filter((c) => c.fecha === hoy).length,
    [capturas, hoy]
  )
  const totalPendientes = useMemo(
    () => capturas.filter((c) => c.estado === 'pendiente').length,
    [capturas]
  )
  const totalEjecutadas = useMemo(
    () => capturas.filter((c) => c.estado === 'ejecutada').length,
    [capturas]
  )

  if (loading) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <div className="flex items-center justify-center gap-2 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span>Cargando capturas programadas...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      {/* KPIs */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-blue-500/10 to-blue-500/5 border-blue-500/20">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Hoy
                </p>
                <p className="text-3xl font-bold mt-1">{totalHoy}</p>
              </div>
              <Calendar className="h-8 w-8 text-blue-500/50" />
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
                  {totalPendientes}
                </p>
              </div>
              <Clock className="h-8 w-8 text-yellow-500/50" />
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
                  {totalEjecutadas}
                </p>
              </div>
              <CheckCircle2 className="h-8 w-8 text-green-500/50" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs + Filtros */}
      <Card>
        <CardContent className="pt-6 space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant={tabActivo === 'proximos' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setTabActivo('proximos')}
            >
              📅 Próximos
            </Button>
            <Button
              variant={tabActivo === 'hoy' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setTabActivo('hoy')}
            >
              ⏰ Hoy ({totalHoy})
            </Button>
            <Button
              variant={tabActivo === 'todos' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setTabActivo('todos')}
            >
              📋 Todos
            </Button>

            <div className="flex-1" />

            <Button variant="ghost" size="sm" onClick={expandirTodas}>
              Expandir todo
            </Button>
            <Button variant="ghost" size="sm" onClick={colapsarTodas}>
              Colapsar todo
            </Button>
          </div>

          {/* Filtros: 4 columnas */}
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
          {fechas.length} fechas con capturas programadas
        </h2>
        {(filtroCliente !== 'todos' ||
          filtroMarca !== 'todos' ||
          filtroEstado !== 'todos' ||
          busqueda) && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setFiltroCliente('todos')
              setFiltroMarca('todos')
              setFiltroEstado('todos')
              setBusqueda('')
            }}
          >
            Limpiar filtros
          </Button>
        )}
      </div>

      {fechas.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            No hay capturas programadas que coincidan con los filtros.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {fechas.map((fecha) => {
            const capturasFecha = agrupado[fecha] || []
            const expandida = fechasExpandidas.has(fecha)

            const pendientes = capturasFecha.filter(
              (c: any) => c.estado === 'pendiente'
            ).length
            const ejecutadas = capturasFecha.filter(
              (c: any) => c.estado === 'ejecutada'
            ).length
            const canceladas = capturasFecha.filter(
              (c: any) => c.estado === 'cancelada'
            ).length

            return (
              <Card key={fecha} className="overflow-hidden">
                <button
                  onClick={() => toggleFecha(fecha)}
                  className="w-full flex items-center justify-between p-4 hover:bg-muted/30 transition-colors text-left"
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    {expandida ? (
                      <ChevronDown className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                    ) : (
                      <ChevronRight className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                    )}
                    <div className="flex items-center gap-3 flex-wrap">
                      <h3 className="font-semibold">
                        📅 {formatearFecha(fecha)}
                      </h3>
                      <Badge variant="secondary">
                        {capturasFecha.length} capturas
                      </Badge>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    {pendientes > 0 && (
                      <Badge
                        variant="outline"
                        className="bg-yellow-500/10 text-yellow-600 border-yellow-500/20"
                      >
                        ⏳ {pendientes}
                      </Badge>
                    )}
                    {ejecutadas > 0 && (
                      <Badge
                        variant="outline"
                        className="bg-green-500/10 text-green-600 border-green-500/20"
                      >
                        ✅ {ejecutadas}
                      </Badge>
                    )}
                    {canceladas > 0 && (
                      <Badge
                        variant="outline"
                        className="bg-red-500/10 text-red-600 border-red-500/20"
                      >
                        ❌ {canceladas}
                      </Badge>
                    )}
                  </div>
                </button>

                {expandida && (
                  <CardContent className="pt-0 pb-4">
                    <div className="border-t pt-4">
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
                        {capturasFecha.map((captura: any) => {
                          const datos = extraerDatos(captura)
                          return (
                            <div
                              key={captura.id}
                              className="flex items-center justify-between p-3 rounded-md bg-muted/30 hover:bg-muted/50 transition-colors"
                            >
                              <div className="flex items-center gap-3 flex-1 min-w-0">
                                <span className="font-mono text-sm text-muted-foreground whitespace-nowrap font-semibold">
                                  {formatearHora(captura.hora)}
                                </span>
                                <div className="min-w-0 flex-1">
                                  <p className="text-sm font-medium truncate">
                                    {datos.evidenciaNombre}
                                    {captura.numero_slide && (
                                      <span className="ml-2 text-xs text-blue-600">
                                        · Slide {captura.numero_slide}
                                      </span>
                                    )}
                                  </p>
                                  <p className="text-xs text-muted-foreground truncate">
                                    {datos.clienteNombre} · {datos.marcaNombre}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2 flex-shrink-0">
                                <EstadoBadge estado={captura.estado} />
                                <AccionesCaptura
                                  capturaId={captura.id}
                                  estado={captura.estado}
                                />
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  </CardContent>
                )}
              </Card>
            )
          })}
        </div>
      )}
    </>
  )
}