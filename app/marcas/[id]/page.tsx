import { Suspense } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import MarcaDetalleData from './MarcaDetalleData'

function MarcaDetalleSkeleton() {
  return (
    <div className="space-y-4">
      <div className="h-4 w-64 bg-muted animate-pulse rounded" />
      <div className="h-10 w-96 bg-muted animate-pulse rounded" />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardContent className="h-24 flex items-center justify-center">
              <div className="h-6 w-16 bg-muted animate-pulse rounded" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

async function MarcaDetalleWrapper({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  return <MarcaDetalleData id={id} />
}

export default function MarcaDetallePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <Suspense fallback={<MarcaDetalleSkeleton />}>
        <MarcaDetalleWrapper params={params} />
      </Suspense>
    </div>
  )
}