import { Suspense } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import MarcasData from './MarcasData'
import MarcaFormDialog from '@/components/panel/marcas/MarcaFormDialog'

function MarcasSkeleton() {
  return (
    <Card>
      <CardContent className="py-8 space-y-3">
        <div className="h-16 w-full bg-muted animate-pulse rounded" />
        <div className="h-16 w-full bg-muted animate-pulse rounded" />
      </CardContent>
    </Card>
  )
}

export default function MarcasPage() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">🏷️ Marcas</h1>
          <p className="text-muted-foreground">
            Todas las marcas registradas por cliente
          </p>
        </div>
        <MarcaFormDialog trigger="nuevo" />
      </div>

      <Suspense fallback={<MarcasSkeleton />}>
        <MarcasData />
      </Suspense>
    </div>
  )
}