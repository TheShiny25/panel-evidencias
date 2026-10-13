import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Building2, Tag, Globe2, ArrowRight } from 'lucide-react'
import AccionesCliente from '@/components/panel/clientes/AccionesCliente'

export default async function ClientesData() {
  const supabase = await createClient()

  const { data: clientes, error } = await supabase
    .from('clientes')
    .select(`
      id,
      nombre,
      pais,
      activo,
      marcas (
        id,
        nombre
      )
    `)
    .eq('activo', true)
    .order('nombre', { ascending: true })

  if (error) {
    console.error('Error cargando clientes:', error)
    return (
      <Card className="border-red-500/20 bg-red-500/5">
        <CardContent className="py-8 text-center text-red-600">
          Error al cargar clientes: {error.message}
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      {/* KPIs con los mismos colores que Calendario/Historial */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Total Clientes → Azul */}
        <Card className="bg-gradient-to-br from-blue-500/10 to-blue-500/5 border-blue-500/20">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Total Clientes
                </p>
                <p className="text-3xl font-bold mt-1 text-blue-600">
                  {clientes?.length || 0}
                </p>
              </div>
              <Building2 className="h-8 w-8 text-blue-500/50" />
            </div>
          </CardContent>
        </Card>

        {/* Total Marcas → Verde */}
        <Card className="bg-gradient-to-br from-green-500/10 to-green-500/5 border-green-500/20">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Total Marcas
                </p>
                <p className="text-3xl font-bold mt-1 text-green-600">
                  {clientes?.reduce(
                    (sum, c) => sum + (c.marcas?.length || 0),
                    0
                  ) || 0}
                </p>
              </div>
              <Tag className="h-8 w-8 text-green-500/50" />
            </div>
          </CardContent>
        </Card>

        {/* Países → Amarillo */}
        <Card className="bg-gradient-to-br from-yellow-500/10 to-yellow-500/5 border-yellow-500/20">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Países
                </p>
                <p className="text-3xl font-bold mt-1 text-yellow-600">
                  {new Set(clientes?.map((c) => c.pais).filter(Boolean)).size ||
                    0}
                </p>
              </div>
              <Globe2 className="h-8 w-8 text-yellow-500/50" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Listado */}
      {!clientes || clientes.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">
              No hay clientes registrados. Crea el primero con el botón de
              arriba.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {clientes.map((cliente) => {
            const totalMarcas = cliente.marcas?.length || 0

            return (
              <Card key={cliente.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg">
                        🏢 {cliente.nombre}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground mt-1">
                        🌎 {cliente.pais || 'Sin país'} · {totalMarcas}{' '}
                        {totalMarcas === 1 ? 'marca' : 'marcas'}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Link href={`/clientes/${cliente.id}`}>
                        <Button variant="outline" size="sm" className="gap-2">
                          Ver marcas
                          <ArrowRight className="h-3.5 w-3.5" />
                        </Button>
                      </Link>
                      <AccionesCliente
                        clienteId={cliente.id}
                        clienteNombre={cliente.nombre}
                        clientePais={cliente.pais}
                      />
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {totalMarcas === 0 ? (
                    <p className="text-sm text-muted-foreground italic">
                      Sin marcas registradas
                    </p>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {cliente.marcas.map((marca: any) => (
                        <Badge key={marca.id} variant="secondary">
                          🏷️ {marca.nombre}
                        </Badge>
                      ))}
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