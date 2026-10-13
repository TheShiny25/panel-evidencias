import { Suspense } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import HistorialData from './HistorialData'

function HistorialSkeleton() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardContent className="h-24 flex items-center justify-center">
              <div className="h-6 w-16 bg-muted animate-pulse rounded" />
            </CardContent>
          </Card>
        ))}
      </div>
      <Card>
        <CardContent className="py-8 space-y-3">
          <div className="h-12 w-full bg-muted animate-pulse rounded" />
          <div className="h-12 w-full bg-muted animate-pulse rounded" />
          <div className="h-12 w-full bg-muted animate-pulse rounded" />
        </CardContent>
      </Card>
    </div>
  )
}

export default function HistorialPage() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">📜 Historial General</h1>
          <p className="text-muted-foreground">
            Registro completo de capturas programadas y ejecutadas
          </p>
        </div>
      </div>

      <Suspense fallback={<HistorialSkeleton />}>
        <HistorialData />
      </Suspense>
    </div>
  )
}