import { chromium } from 'playwright'
import 'dotenv/config'
import { supabase } from './supabase.js'

let cacheTipos = null
let cacheTimestamp = 0
const CACHE_TTL = 5 * 60 * 1000

async function obtenerTiposEvidencia() {
  const ahora = Date.now()
  if (cacheTipos && ahora - cacheTimestamp < CACHE_TTL) {
    return cacheTipos
  }

  const { data, error } = await supabase
    .from('tipos_evidencia')
    .select('codigo, config, requiere_input_slide')
    .eq('activo', true)

  if (error) {
    console.error('❌ Error cargando tipos de evidencia:', error.message)
    return {}
  }

  cacheTipos = Object.fromEntries(data.map((t) => [t.codigo, t.config]))
  cacheTimestamp = ahora
  return cacheTipos
}

export async function capturarURL(implementacion, opciones = {}) {
  const { formato = 'jpg', numeroSlide: numeroSlideFromCaller = null } = opciones
  const inicio = Date.now()

  const tipos = await obtenerTiposEvidencia()
  const tipoCodigo = implementacion.tipo_evidencia || 'slider'
  const config = tipos[tipoCodigo] || tipos['slider'] || {}

  const viewportWidth = config.screenshotWidth ?? 1920
  const viewportHeight = config.screenshotHeight ?? 1080
  const bloquearBarilliance = config.bloquearBarilliance ?? true
  const scrollBehavior = config.scrollBehavior ?? 'steps'
  const waitAfterLoad = config.waitAfterLoad ?? 3000
  const intentarMostrarPopup = config.intentarMostrarPopup ?? false

  const numeroSlide =
    numeroSlideFromCaller !== null
      ? numeroSlideFromCaller
      : config.numeroSlide ?? null

  const tieneSliderConfig = numeroSlide !== null && numeroSlide > 0

  const fullPage =
    config.fullPage !== undefined
      ? config.fullPage
      : tieneSliderConfig
      ? false
      : true

  const isHeadless = process.env.HEADLESS !== 'false'

  const browser = await chromium.launch({
    headless: isHeadless,
    args: [
      '--disable-blink-features=AutomationControlled',
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
    ],
  })

  const context = await browser.newContext({
    viewport: { width: viewportWidth, height: viewportHeight },
    userAgent:
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    locale: 'es-PE',
    timezoneId: 'America/Lima',
  })

  const page = await context.newPage()

  let popupVisible = false

  page.on('console', (msg) => {
    const text = msg.text()
    if (
      text.includes('[slider]') ||
      text.includes('[popup]') ||
      text.includes('[bombas]') ||
      text.includes('slide[') ||
      text.includes('bullet[') ||
      text.includes('DIAGNÓSTICO') ||
      text.includes('═')
    ) {
      console.log(text)
    }
  })

  try {
    // 1. Bloquear Barilliance (solo si la config lo pide)
    if (bloquearBarilliance) {
      await page.route('**/*barilliance*', (route) => route.abort())
    }

    console.log(`   🌐 Navegando a ${implementacion.url}...`)
    await page.goto(implementacion.url, {
      waitUntil: 'domcontentloaded',
      timeout: 60000,
    })

    // 2. Filtro CSS para popups invasivos (solo si bloqueamos)
    // ⚠️ NO inyectar si bloquearBarilliance = false
    if (bloquearBarilliance) {
      await page.addStyleTag({
        content: `
          [id*="cbar_"], [class*="cbar_"], 
          div[id*="barilliance"], div[class*="popup"] {
            display: none !important;
            visibility: hidden !important;
            opacity: 0 !important;
            pointer-events: none !important;
          }
        `,
      })
    }

    // 3. Scroll (solo si NO hay slide)
    if (!tieneSliderConfig) {
      if (scrollBehavior === 'steps') {
        console.log(`   📜 Haciendo scroll escalonado...`)
        await page.evaluate(async () => {
          await new Promise((resolve) => {
            let totalHeight = 0
            const distance = 300
            const timer = setInterval(() => {
              window.scrollBy(0, distance)
              totalHeight += distance
              if (totalHeight >= document.body.scrollHeight) {
                clearInterval(timer)
                resolve()
              }
            }, 200)
          })
        })
        await page.waitForTimeout(5000)
      } else if (scrollBehavior === 'bottom') {
        console.log(`   📜 Scroll al final...`)
        await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
        await page.waitForTimeout(5000)
      } else if (scrollBehavior === 'half') {
        console.log(`   📜 Scroll a la mitad...`)
        await page.evaluate(() =>
          window.scrollTo(0, document.body.scrollHeight / 2)
        )
        await page.waitForTimeout(5000)
      } else {
        await page.waitForTimeout(5000)
      }
    } else {
      console.log(
        `   ⏭️  Saltando scroll (se posicionará el slide directamente)`
      )
      await page.waitForTimeout(5000)
    }

    // 4. Forzar carga de imágenes
    await page.evaluate(() => {
      document.querySelectorAll('img').forEach((img) => {
        img.setAttribute('loading', 'eager')
        if (img.dataset.src) {
          img.src = img.dataset.src
        }
      })
    })

    // 5. Volver arriba
    await page.evaluate(() => window.scrollTo(0, 0))
    await page.waitForTimeout(2000)

    // ============================================================
    // 6. POSICIONAR SLIDE (si aplica)
    // ============================================================
    if (tieneSliderConfig) {
      console.log(`   🎯 Posicionando slide ${numeroSlide}...`)

      await page.evaluate((num) => {
        const targetIndex = num - 1

        console.log('════════════════════════════════════════')
        console.log(
          `[slider] Buscando slide índice ${targetIndex} (usuario pidió ${num})`
        )
        console.log('════════════════════════════════════════')

        for (let i = 1; i < 99999; i++) clearInterval(i)
        for (let i = 1; i < 99999; i++) clearTimeout(i)

        const swiperEl = document.querySelector('.swiper, .swiper-container')
        if (swiperEl && swiperEl.swiper) {
          try {
            swiperEl.swiper.autoplay?.stop()
            swiperEl.swiper.disable()
          } catch (e) {}
        }

        document.getElementById('slider-force-style')?.remove()
        const style = document.createElement('style')
        style.id = 'slider-force-style'
        style.textContent = `
          .home-banner-slide:not(.slider-target-active) {
            display: none !important;
            visibility: hidden !important;
            opacity: 0 !important;
          }
          .home-banner-slide.slider-target-active {
            display: block !important;
            visibility: visible !important;
            opacity: 1 !important;
          }
        `
        document.head.appendChild(style)

        const allSlides = Array.from(
          document.querySelectorAll('.home-banner-slide')
        )
        console.log(`[slider] Total slides: ${allSlides.length}`)

        allSlides.forEach((slide, i) => {
          if (i === targetIndex) {
            slide.classList.add('slider-target-active')
            slide.classList.remove('home-banner-slide--hidden')
          } else {
            slide.classList.remove('slider-target-active')
            slide.classList.add('home-banner-slide--hidden')
          }
        })

        const allBullets = Array.from(
          document.querySelectorAll('.home-banner-bullet')
        )
        allBullets.forEach((bullet, i) => {
          if (i === targetIndex) {
            bullet.classList.add('home-banner-bullet--active')
          } else {
            bullet.classList.remove('home-banner-bullet--active')
          }
        })

        const track = document.querySelector('.home-banner-track')
        if (track) {
          track.style.transform = 'translate3d(0px, 0px, 0px)'
          track.style.transition = 'none'
        }
      }, numeroSlide)

      await page.waitForTimeout(2000)
    }

    // ============================================================
    // 7. DETECTAR POPUP DE BOMBAS DE NAVEGACIÓN (SOLO ESPERAR)
    // ============================================================
    if (intentarMostrarPopup) {
      console.log(`   🎯 Esperando al popup de bombas (automático)...`)

      // 7.1 Esperar pasivamente. Barilliance dispara solo.
      console.log(`   ⏳ Esperando ${waitAfterLoad / 1000}s al popup...`)

      // Esperamos en tramos para poder diagnosticar
      const pasos = Math.floor(waitAfterLoad / 5000)
      for (let i = 0; i < pasos; i++) {
        await page.waitForTimeout(5000)

        const estado = await page.evaluate(() => {
          // Busca el contenedor por varios criterios
          const elByRule = document.querySelector('[rule_id]')
          const elByPop = document.querySelector('[id^="cbar_POP"]')
          const elByIframe = document.querySelector('[id^="cbar_iframe_"]')
          const elByWdes = document.querySelector('[id^="cbar-wdes-popup-"]')

          const describe = (el) => {
            if (!el) return null
            const rect = el.getBoundingClientRect()
            const style = window.getComputedStyle(el)
            return {
              id: el.id,
              rule_id: el.getAttribute('rule_id') || '-',
              offsetHeight: el.offsetHeight,
              offsetWidth: el.offsetWidth,
              rectHeight: Math.round(rect.height),
              rectWidth: Math.round(rect.width),
              visibility: style.visibility,
              display: style.display,
              opacity: style.opacity,
            }
          }

          return {
            byRule: describe(elByRule),
            byPop: describe(elByPop),
            byIframe: describe(elByIframe),
            byWdes: describe(elByWdes),
          }
        })

        const encontrado =
          estado.byRule ||
          estado.byPop ||
          estado.byIframe ||
          estado.byWdes

        if (encontrado) {
          console.log(`[bombas] Detectado en espera:`)
          console.log(`   id="${encontrado.id}" rule_id="${encontrado.rule_id}"`)
          console.log(`   offset=${encontrado.offsetWidth}x${encontrado.offsetHeight}`)
          console.log(`   rect=${encontrado.rectWidth}x${encontrado.rectHeight}`)
          console.log(`   visibility=${encontrado.visibility} display=${encontrado.display} opacity=${encontrado.opacity}`)

          // Considerar visible si:
          // - tiene offset > 0, O
          // - rect > 0, O
          // - está declarado (existe el elemento)
          if (
            encontrado.offsetHeight > 0 ||
            encontrado.rectHeight > 0 ||
            encontrado.id
          ) {
            popupVisible = true
            break
          }
        } else {
          console.log(`[bombas] ⏳ Sin rastro de cbar todavía... (${(i + 1) * 5}s)`)
        }
      }

      console.log(
        `   ${popupVisible ? '✅' : '⚠️'} Popup ${popupVisible ? 'detectado' : 'NO detectado'}`
      )

      // 7.2 Espera final para que la animación de slide-in termine
      await page.waitForTimeout(3000)

      // 7.3 Debug final del DOM
      const debugFinal = await page.evaluate(() => {
        const all = Array.from(document.querySelectorAll('*'))
        return all
          .filter(
            (el) =>
              (el.id && el.id.toLowerCase().includes('cbar')) ||
              el.hasAttribute('rule_id')
          )
          .map((el) => ({
            id: el.id || '-',
            rule_id: el.getAttribute('rule_id') || '-',
            h: el.offsetHeight,
            w: el.offsetWidth,
          }))
      })
      console.log(`   🔍 Elementos cbar en DOM al final:`)
      if (debugFinal.length === 0) {
        console.log(`      (ninguno)`)
      } else {
        debugFinal.forEach((el) => {
          console.log(`      #${el.id} rule_id=${el.rule_id} ${el.w}x${el.h}px`)
        })
      }
    } else if (waitAfterLoad > 0) {
      await page.waitForTimeout(waitAfterLoad)
    }

    // ============================================================
    // 8. CAPTURA FINAL
    // ============================================================
    console.log(`   📸 Tomando captura (fullPage: ${fullPage})...`)
    const buffer = await page.screenshot({
      fullPage,
      type: formato === 'png' ? 'png' : 'jpeg',
      quality: formato === 'png' ? undefined : 80,
    })

    const durationMs = Date.now() - inicio
    const mimeType = formato === 'png' ? 'image/png' : 'image/jpeg'

    return {
      buffer,
      mimeType,
      durationMs,
      requestId: null,
      popupVisible,
    }
  } finally {
    await browser.close()
  }
}