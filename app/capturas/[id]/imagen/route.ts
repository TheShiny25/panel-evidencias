import { NextRequest, NextResponse } from 'next/server'
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3'
import { createClient } from '@/lib/supabase/server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  const supabase = await createClient()

  const { data: log, error } = await supabase
    .from('execution_logs')
    .select('s3_key, mime_type')
    .eq('captura_id', id)
    .order('timestamp', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error || !log?.s3_key) {
    return NextResponse.json(
      { error: 'No hay log de ejecución para esta captura' },
      { status: 404 }
    )
  }

  const s3Client = new S3Client({
    region: process.env.AWS_REGION || 'us-east-1',
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
    },
  })

  try {
    const command = new GetObjectCommand({
      Bucket: process.env.AWS_BUCKET_NAME || '',
      Key: log.s3_key,
    })

    const response = await s3Client.send(command)

    if (!response.Body) {
      return NextResponse.json(
        { error: 'S3 no devolvió contenido' },
        { status: 500 }
      )
    }

    // Convertir el stream de S3 a un buffer
    const chunks: Uint8Array[] = []
    // @ts-ignore
    for await (const chunk of response.Body) {
      chunks.push(chunk)
    }
    const buffer = Buffer.concat(chunks)

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': log.mime_type || 'image/jpeg',
        'Cache-Control': 'public, max-age=3600',
        'Content-Length': buffer.length.toString(),
      },
    })
  } catch (err: any) {
    console.error('❌ Error obteniendo imagen de S3:', err)
    return NextResponse.json(
      { error: 'Error al obtener la captura desde S3', detalle: err.message },
      { status: 500 }
    )
  }
}