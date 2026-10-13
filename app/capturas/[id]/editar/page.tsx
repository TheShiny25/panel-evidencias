import { Suspense } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import EditarCapturaData from './EditarCapturaData'

function EditarSkeleton() {
  return (
    <Card>
      <CardContent className="py-8 space-y-3">
        <div className="h-6 w-48 bg-muted animate-pulse rounded" />
        <div className="h-10 w-full bg-muted animate-pulse rounded" />
        <div className="h-10 w-full bg-muted animate-pulse rounded" />
      </CardContent>
    </Card>
  )
}

async function EditarWrapper({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  return <EditarCapturaData id={id} />
}

export default function EditarCapturaPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">✏️ Editar Captura</h1>
        <p className="text-muted-foreground">
          Modifica la programación de esta captura
        </p>
      </div>

      <div className="max-w-3xl">
        <Suspense fallback={<EditarSkeleton />}>
          <EditarWrapper params={params} />
        </Suspense>
      </div>
    </div>
  )
}