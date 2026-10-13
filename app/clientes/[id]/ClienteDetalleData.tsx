import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { notFound } from 'next/navigation'
import MarcaFormDialog from '@/components/panel/marcas/MarcaFormDialog'
import AccionesMarca from '@/components/panel/marcas/AccionesMarca'

export default async function ClienteDetalleData({ id }: { id: string }) {
  const supabase = await createClient()

  const { data: cliente, error } = await supabase
    .from('clientes')
    .select(`
      id,
      nombre,
      pais,
      marcas (
        id,
        nombre,
        implementaciones ( id, nombre, estado )
      )
    `)
    .eq('id', id)
    .single()

  if (error || !cliente) {
    notFound()
  }

  const totalImplementaciones =
    cliente.marcas?.reduce(
      (s: number, m: any) => s + (m.implementaciones?.length || 0),
      0
    ) || 0

  return (
    <>
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link href="/clientes" className="hover:underline">
          🏢 Clientes
        </Link>
        <span>/</span>
        <span>{cliente.nombre}</span>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">🏢 {cliente.nombre}</h1>
          <p className="text-muted-foreground">
            🌎 {cliente.pais || 'Sin país'} · {cliente.marcas?.length || 0} marcas ·{' '}
            {totalImplementaciones} implementaciones
          </p>
        </div>
        <MarcaFormDialog clienteIdFijo={Number(id)} trigger="nuevo" />
      </div>

      {(!cliente.marcas || cliente.marcas.length === 0) ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">
              Este cliente no tiene marcas registradas.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {cliente.marcas.map((marca: any) => {
            const totalImpl = marca.implementaciones?.length || 0
            const implementadas =
              marca.implementaciones?.filter(
                (i: any) => i.estado === 'implementado'
              ).length || 0
            const pendientes =
              marca.implementaciones?.filter(
                (i: any) => i.estado === 'pendiente'
              ).length || 0

            return (
              <Card key={marca.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">🏷️ {marca.nombre}</CardTitle>
                    <div className="flex items-center gap-2">
                      <Link href={`/marcas/${marca.id}`}>
                        <Button variant="outline" size="sm">
                          Ver tareas →
                        </Button>
                      </Link>
                      <AccionesMarca
                        marcaId={marca.id}
                        marcaNombre={marca.nombre}
                        clienteId={cliente.id}
                      />
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div>
                      <p className="text-xs text-muted-foreground">Total</p>
                      <p className="text-lg font-bold">{totalImpl}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">✅ Impl.</p>
                      <p className="text-lg font-bold text-green-600">
                        {implementadas}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">⏳ Pend.</p>
                      <p className="text-lg font-bold text-yellow-600">
                        {pendientes}
                      </p>
                    </div>
                  </div>

                  {totalImpl > 0 && (
                    <div className="flex flex-wrap gap-1 pt-2 border-t">
                      {marca.implementaciones.slice(0, 3).map((impl: any) => (
                        <Badge
                          key={impl.id}
                          variant="outline"
                          className="text-xs"
                        >
                          {impl.nombre}
                        </Badge>
                      ))}
                      {totalImpl > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{totalImpl - 3} más
                        </Badge>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </>
  )
}