'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

// ============================================================
// TIMEZONES
// ============================================================
const TIMEZONES = [
  { value: 'America/Lima', label: '(GMT-05:00) Lima, Perú' },
  { value: 'America/Bogota', label: '(GMT-05:00) Bogotá, Colombia' },
  { value: 'America/Mexico_City', label: '(GMT-06:00) Ciudad de México' },
  { value: 'America/Santiago', label: '(GMT-04:00) Santiago, Chile' },
  { value: 'America/Argentina/Buenos_Aires', label: '(GMT-03:00) Buenos Aires' },
  { value: 'America/Sao_Paulo', label: '(GMT-03:00) São Paulo, Brasil' },
  { value: 'America/Caracas', label: '(GMT-04:00) Caracas, Venezuela' },
  { value: 'America/Guayaquil', label: '(GMT-05:00) Quito, Ecuador' },
  { value: 'America/La_Paz', label: '(GMT-04:00) La Paz, Bolivia' },
  { value: 'America/Asuncion', label: '(GMT-04:00) Asunción, Paraguay' },
  { value: 'America/Montevideo', label: '(GMT-03:00) Montevideo, Uruguay' },
  { value: 'America/Panama', label: '(GMT-05:00) Panamá' },
  { value: 'America/Costa_Rica', label: '(GMT-06:00) San José, Costa Rica' },
  { value: 'Europe/Madrid', label: '(GMT+01:00) Madrid, España' },
]

type CapturaFormProps = {
  capturaId?: number
  initialData?: {
    marca_id?: number
    url?: string
    tipo_evidencia?: string
    fecha?: string
    hora?: string
    descripcion?: string
    formato?: string
    numero_slide?: number | null
    timezone?: string
  }
}

export default function CapturaForm({ capturaId, initialData }: CapturaFormProps) {
  const router = useRouter()
  const supabase = createClient()

  const [loading, setLoading] = useState(false)
  const [loadingData, setLoadingData] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Datos para selects
  const [clientes, setClientes] = useState<any[]>([])
  const [marcas, setMarcas] = useState<any[]>([])
  const [tiposEvidencia, setTiposEvidencia] = useState<any[]>([])

  // Valores del formulario
  const [clienteId, setClienteId] = useState<string>('')
  const [marcaId, setMarcaId] = useState<string>('')
  const [tipoEvidencia, setTipoEvidencia] = useState<string>('')
  const [url, setUrl] = useState<string>('')
  const [fecha, setFecha] = useState<string>('')
  const [hora, setHora] = useState<string>('')
  const [timezone, setTimezone] = useState<string>('America/Lima')
  const [descripcion, setDescripcion] = useState<string>('')
  const [formato, setFormato] = useState<string>('jpg')
  const [numeroSlide, setNumeroSlide] = useState<number | null>(null)

  // Cargar clientes y tipos de evidencia
  useEffect(() => {
    const loadInicial = async () => {
      const [clientesRes, tiposRes] = await Promise.all([
        supabase
          .from('clientes')
          .select('id, nombre')
          .eq('activo', true)
          .order('nombre'),
        supabase
          .from('tipos_evidencia')
          .select('codigo, nombre, icono, orden, requiere_input_slide, config')
          .eq('activo', true)
          .order('orden', { ascending: true }),
      ])

      setClientes(clientesRes.data || [])
      setTiposEvidencia(tiposRes.data || [])

      if (!capturaId && tiposRes.data && tiposRes.data.length > 0) {
        setTipoEvidencia(tiposRes.data[0].codigo)
      }

      setLoadingData(false)
    }
    loadInicial()
  }, [supabase, capturaId])

  // Cargar marcas cuando cambia el cliente
  useEffect(() => {
    if (!clienteId) {
      setMarcas([])
      return
    }
    const loadMarcas = async () => {
      const { data } = await supabase
        .from('marcas')
        .select('id, nombre')
        .eq('cliente_id', clienteId)
        .eq('activo', true)
        .order('nombre')
      setMarcas(data || [])
    }
    loadMarcas()
  }, [clienteId, supabase])

  // Cargar datos en modo edición
  useEffect(() => {
    if (!capturaId || !initialData) {
      // Modo creación
      const hoy = new Date().toLocaleDateString('en-CA', {
        timeZone: 'America/Lima',
      })
      setFecha(hoy)
      setHora('08:00')
      setTimezone('America/Lima')
      return
    }

    const loadCaptura = async () => {
      const { data } = await supabase
        .from('capturas_programadas')
        .select(`
          id,
          marca_id,
          url,
          tipo_evidencia,
          fecha,
          hora,
          timezone,
          descripcion,
          formato,
          numero_slide,
          marcas ( cliente_id )
        `)
        .eq('id', capturaId)
        .single()

      if (data) {
        // ⚠️ ORDEN CRÍTICO:
        // 1. Primero clienteId (esto dispara la carga de marcas en el otro useEffect)
        setClienteId(String((data.marcas as any)?.cliente_id || ''))
        // 2. Otros campos
        setTipoEvidencia(data.tipo_evidencia || '')
        setUrl(data.url || '')
        setFecha(data.fecha || '')
        setHora(data.hora?.slice(0, 5) || '')
        setTimezone(data.timezone || 'America/Lima')
        setDescripcion(data.descripcion || '')
        setFormato(data.formato || 'jpg')
        setNumeroSlide(data.numero_slide ?? null)
        // 3. marcaId al final (después de que las marcas estén cargadas)
        //    Lo dejamos en un estado pendiente hasta que marcas estén listas
        if (data.marca_id) {
          setMarcaIdPendiente(String(data.marca_id))
        }
      }
    }
    loadCaptura()
  }, [capturaId, initialData, supabase])

  // ⚠️ NUEVO: Estado para "marca pendiente" mientras se cargan las opciones
  const [marcaIdPendiente, setMarcaIdPendiente] = useState<string>('')

  // ⚠️ NUEVO: Cuando las marcas estén cargadas y haya un marcaIdPendiente, aplicarlo
  useEffect(() => {
    if (marcaIdPendiente && marcas.length > 0) {
      const existe = marcas.some((m) => String(m.id) === marcaIdPendiente)
      if (existe) {
        setMarcaId(marcaIdPendiente)
        setMarcaIdPendiente('')
      }
    }
  }, [marcas, marcaIdPendiente])

  const tipoEvidenciaActual = tiposEvidencia.find(
    (t) => t.codigo === tipoEvidencia
  )
  const requiereInputSlide = tipoEvidenciaActual?.requiere_input_slide === true

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    if (!marcaId || !tipoEvidencia || !url || !fecha || !hora) {
      setError('Marca, tipo de evidencia, enlace, fecha y hora son obligatorios')
      setLoading(false)
      return
    }

    if (requiereInputSlide && (!numeroSlide || numeroSlide < 1)) {
      setError('Debes indicar la posición del slide')
      setLoading(false)
      return
    }

    const payload = {
      marca_id: Number(marcaId),
      url,
      tipo_evidencia: tipoEvidencia,
      fecha,
      hora,
      timezone,
      descripcion: descripcion || null,
      formato,
      numero_slide: requiereInputSlide ? numeroSlide : null,
    }

    let result
    if (capturaId) {
      result = await supabase
        .from('capturas_programadas')
        .update(payload)
        .eq('id', capturaId)
    } else {
      result = await supabase
        .from('capturas_programadas')
        .insert({ ...payload, estado: 'pendiente' })
    }

    setLoading(false)

    if (result.error) {
      setError(result.error.message)
      return
    }

    router.push('/')
    router.refresh()
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {capturaId ? '✏️ Editar Captura' : '📝 Programar Nueva Captura'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* 1 y 2: Cliente + Marca */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="cliente">1. Cliente *</Label>
              <Select value={clienteId} onValueChange={setClienteId}>
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
              <Label htmlFor="marca">2. Marca *</Label>
              <Select
                value={marcaId}
                onValueChange={setMarcaId}
                disabled={!clienteId || marcas.length === 0}
              >
                <SelectTrigger id="marca" className="w-full">
                  <SelectValue
                    placeholder={
                      !clienteId
                        ? 'Selecciona cliente primero'
                        : marcas.length === 0
                        ? 'Cargando marcas...'
                        : 'Selecciona marca'
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {marcas.map((m) => (
                    <SelectItem key={m.id} value={String(m.id)}>
                      {m.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* 3: Tipo de evidencia */}
          <div className="space-y-2">
            <Label htmlFor="tipoEvidencia">3. Tipo de evidencia *</Label>
            <Select value={tipoEvidencia} onValueChange={setTipoEvidencia}>
              <SelectTrigger id="tipoEvidencia" className="w-full">
                <SelectValue placeholder="Selecciona tipo de evidencia" />
              </SelectTrigger>
              <SelectContent>
                {tiposEvidencia.map((tipo) => (
                  <SelectItem key={tipo.codigo} value={tipo.codigo}>
                    {tipo.icono} {tipo.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Input de slide */}
          {requiereInputSlide && (
            <div className="space-y-2 rounded-md border border-blue-500/20 bg-blue-500/5 p-4">
              <Label htmlFor="numeroSlide" className="text-blue-600 font-semibold">
                🎯 Posición del slide *
              </Label>
              <Input
                id="numeroSlide"
                type="number"
                min="1"
                max="20"
                value={numeroSlide ?? ''}
                onChange={(e) =>
                  setNumeroSlide(e.target.value ? Number(e.target.value) : null)
                }
                placeholder="Ej: 5"
                className="max-w-xs"
                required={requiereInputSlide}
              />
            </div>
          )}

          {/* 4: URL */}
          <div className="space-y-2">
            <Label htmlFor="url">4. Enlace a capturar *</Label>
            <Input
              id="url"
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://simple.ripley.com.pe/marca/jbl"
              required
            />
          </div>

          {/* 5: Fecha, Hora y Timezone */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="fecha">5. Fecha *</Label>
              <Input
                id="fecha"
                type="date"
                value={fecha}
                onChange={(e) => setFecha(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="hora">Hora *</Label>
              <Input
                id="hora"
                type="time"
                value={hora}
                onChange={(e) => setHora(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="timezone">Zona horaria</Label>
              <Select value={timezone} onValueChange={setTimezone}>
                <SelectTrigger id="timezone" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TIMEZONES.map((tz) => (
                    <SelectItem key={tz.value} value={tz.value}>
                      {tz.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* 6: Descripción */}
          <div className="space-y-2">
            <Label htmlFor="descripcion">6. Descripción (opcional)</Label>
            <Textarea
              id="descripcion"
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              placeholder="Ej: Verificación previa al Cyber Days"
              rows={3}
            />
          </div>

          {/* 7: Formato */}
          <div className="space-y-2">
            <Label htmlFor="formato">7. Formato de imagen</Label>
            <Select value={formato} onValueChange={setFormato}>
              <SelectTrigger id="formato" className="max-w-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="jpg">JPG (recomendado)</SelectItem>
                <SelectItem value="png">PNG (mayor calidad)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {error && (
            <div className="p-3 rounded-md bg-red-500/10 border border-red-500/20 text-red-600 text-sm">
              {error}
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading
                ? 'Guardando...'
                : capturaId
                ? 'Guardar cambios'
                : 'Programar captura'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}