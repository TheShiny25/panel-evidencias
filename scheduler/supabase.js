import { createClient } from '@supabase/supabase-js'
import 'dotenv/config'

export const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
)

// ============================================================
// UTILIDAD: Fecha y hora en zona horaria de Lima
// ============================================================
function getFechaHoraLima() {
  const ahora = new Date()
  const opcionesTZ = { timeZone: 'America/Lima' }

  const fechaHoy = ahora.toLocaleDateString('en-CA', opcionesTZ) // "2026-10-09"

  const horaActual = ahora.toLocaleTimeString('en-GB', {
    ...opcionesTZ,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }) // "22:00"

  const hace30Min = new Date(ahora.getTime() - 30 * 60 * 1000)
  const horaHace30 = hace30Min.toLocaleTimeString('en-GB', {
    ...opcionesTZ,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }) // "21:30"

  return { fechaHoy, horaActual, horaHace30 }
}

// ============================================================
// OBTENER CAPTURAS PENDIENTES (con ventana de 30 min en hora Lima)
// ============================================================
export async function obtenerCapturasPendientes() {
  const { fechaHoy, horaActual, horaHace30 } = getFechaHoraLima()

  console.log(`🕐 Ventana (hora Lima): ${fechaHoy} de ${horaHace30} a ${horaActual}`)

  const { data, error } = await supabase
    .from('capturas_programadas')
    .select(`
      id,
      fecha,
      hora,
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
    .eq('estado', 'pendiente')
    .eq('fecha', fechaHoy)
    .gte('hora', horaHace30)
    .lte('hora', horaActual)
    .order('hora', { ascending: true })

  if (error) {
    console.error('❌ Error consultando Supabase:', error.message)
    return []
  }

  console.log(`📋 Capturas encontradas en la ventana: ${data?.length || 0}`)
  return data || []
}

// ============================================================
// MARCAR CAPTURA COMO EJECUTADA
// ============================================================
export async function marcarCapturaEjecutada(capturaId) {
  const { error } = await supabase
    .from('capturas_programadas')
    .update({
      estado: 'ejecutada',
      ejecutada_en: new Date().toISOString(),
    })
    .eq('id', capturaId)

  if (error) {
    console.error('❌ Error actualizando captura:', error.message)
  }
}

// ============================================================
// REGISTRAR EJECUCIÓN EN LOGS
// ============================================================
export async function registrarEjecucion({
  capturaId,
  status,
  s3Key,
  imageSize,
  mimeType,
  durationMs,
  errorMessage,
  sha256Hash,
}) {
  const { error } = await supabase.from('execution_logs').insert({
    captura_id: capturaId,
    status,
    s3_key: s3Key,
    image_size: imageSize,
    mime_type: mimeType,
    duration_ms: durationMs,
    error_message: errorMessage,
    sha256_hash: sha256Hash,
  })

  if (error) {
    console.error('❌ Error registrando ejecución:', error.message)
  }
}