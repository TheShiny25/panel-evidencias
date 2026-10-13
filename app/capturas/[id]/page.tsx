import { Suspense } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import CapturaDetalleData from './CapturaDetalleData'

function CapturaDetalleSkeleton() {
  return (
    <div className="space-y-4">
      <div className="h-4 w-64 bg-muted animate-pulse rounded" />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <CardContent className="h-96 flex items-center justify-center">
              <div className="h-8 w-48 bg-muted animate-pulse rounded" />
            </CardContent>
          </Card>
        </div>
        <div>
          <Card>
            <CardContent className="h-96 flex items-center justify-center">
              <div className="h-6 w-32 bg-muted animate-pulse rounded" />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

async function CapturaDetalleWrapper({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  return <CapturaDetalleData id={id} />
}

export default function CapturaDetallePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <Suspense fallback={<CapturaDetalleSkeleton />}>
        <CapturaDetalleWrapper params={params} />
      </Suspense>
    </div>
  )
}