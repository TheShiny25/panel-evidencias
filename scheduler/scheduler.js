import 'dotenv/config'
import {
  obtenerCapturasPendientes,
  marcarCapturaEjecutada,
  registrarEjecucion,
} from './supabase.js'
import { capturarURL } from './playwright.js'
import { subirAS3, construirS3Key } from './s3.js'

async function main() {
  console.log('🚀 Iniciando scheduler...')
  const inicio = Date.now()

  const capturas = await obtenerCapturasPendientes()

  if (capturas.length === 0) {
    console.log('⏭️  No hay capturas pendientes en esta ventana.')
    process.exit(0)
  }

  console.log(`📸 Ejecutando ${capturas.length} capturas...\n`)

  let exitos = 0
  let errores = 0
  let sinPopup = 0

  for (const captura of capturas) {
    const marca = captura.marcas
    const cliente = marca?.clientes

    console.log(`────────────────────────────────────────`)
    console.log(`📌 ${cliente?.nombre} · ${marca?.nombre}`)
    console.log(`   URL: ${captura.url}`)
    console.log(`   Evidencia: ${captura.tipo_evidencia}`)
    console.log(`   Hora: ${captura.hora}`)
    if (captura.numero_slide) {
      console.log(`   Slide: ${captura.numero_slide}`)
    }

    try {
      const { buffer, mimeType, durationMs, popupVisible } = await capturarURL(
        {
          url: captura.url,
          tipo_evidencia: captura.tipo_evidencia,
        },
        {
          formato: captura.formato || 'jpg',
          numeroSlide: captura.numero_slide || null,
        }
      )

      console.log(
        `   ✅ Captura OK (${(buffer.length / 1024).toFixed(1)} KB, ${durationMs}ms)`
      )

      // Avisar si era popup y no apareció
      const esPopup = captura.tipo_evidencia === 'popup_invasivo'
      if (esPopup && !popupVisible) {
        console.log(`   ⚠️  Popup NO apareció (pero la captura se guarda igual)`)
        sinPopup++
      }

      const s3Key = construirS3Key(captura, captura.formato || 'jpg')
      const { sha256 } = await subirAS3(buffer, s3Key, mimeType)

      console.log(`   📦 Subido a S3: ${s3Key}`)
      console.log(`   🔒 SHA-256: ${sha256.slice(0, 16)}...`)

      // Guardar como éxito (aunque el popup no haya aparecido)
      await registrarEjecucion({
        capturaId: captura.id,
        status: 'success',
        s3Key,
        imageSize: buffer.length,
        mimeType,
        durationMs,
        sha256Hash: sha256,
      })

      await marcarCapturaEjecutada(captura.id)
      exitos++
    } catch (error) {
      console.error(`   ❌ Error: ${error.message}`)

      await registrarEjecucion({
        capturaId: captura.id,
        status: 'error',
        errorMessage: error.message,
      })
      errores++
    }

    // Pausa entre capturas
    await new Promise((r) => setTimeout(r, 2000))
  }

  const duracionTotal = ((Date.now() - inicio) / 1000).toFixed(1)
  console.log(`\n────────────────────────────────────────`)
  console.log(`✅ Exitosas: ${exitos}`)
  if (sinPopup > 0) {
    console.log(`⚠️  Sin popup (guardadas igual): ${sinPopup}`)
  }
  console.log(`❌ Fallidas: ${errores}`)
  console.log(`⏱️  Duración total: ${duracionTotal}s`)
}

main().catch((err) => {
  console.error('❌ Error fatal:', err)
  process.exit(1)
})