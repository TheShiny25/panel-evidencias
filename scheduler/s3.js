import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import crypto from 'crypto'
import 'dotenv/config'

const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
})

export function construirS3Key(captura, formato = 'jpg') {
  const limpiar = (str) =>
    (str || 'sin-nombre')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '')

  const basePath = process.env.AWS_BASE_PATH || 'minisitios/capturas-adv'
  const cliente = limpiar(captura.marcas?.clientes?.nombre)
  const marca = limpiar(captura.marcas?.nombre)
  const tipoEvi = limpiar(captura.tipo_evidencia || 'sin-evidencia')
  const horaCorta = captura.hora.slice(0, 5).replace(':', '-')

  return `${basePath}/${cliente}/${marca}/${captura.fecha}_${horaCorta}_${tipoEvi}.${formato}`
}

export async function subirAS3(buffer, s3Key, mimeType) {
  const sha256 = crypto.createHash('sha256').update(buffer).digest('hex')

  await s3Client.send(
    new PutObjectCommand({
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: s3Key,
      Body: buffer,
      ContentType: mimeType,
      Metadata: {
        sha256,
        'uploaded-at': new Date().toISOString(),
      },
    })
  )

  return { s3Key, sha256 }
}