import { Suspense } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import ClientesData from './ClientesData'
import ClienteFormDialog from '@/components/panel/clientes/ClienteFormDialog'

function ClientesSkeleton() {
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
          <div className="h-16 w-full bg-muted animate-pulse rounded" />
          <div className="h-16 w-full bg-muted animate-pulse rounded" />
        </CardContent>
      </Card>
    </div>
  )
}

export default function ClientesPage() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">🏢 Clientes</h1>
          <p className="text-muted-foreground">
            Portafolio de retailers y sus marcas asociadas
          </p>
        </div>
        <ClienteFormDialog trigger="nuevo" />
      </div>

      <Suspense fallback={<ClientesSkeleton />}>
        <ClientesData />
      </Suspense>
    </div>
  )
}