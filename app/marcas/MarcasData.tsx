import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Tag, Building2, Camera, ArrowRight } from 'lucide-react'
import AccionesMarca from '@/components/panel/marcas/AccionesMarca'

export default async function MarcasData() {
  const supabase = await createClient()

  const { data: marcas, error } = await supabase
    .from('marcas')
    .select(`
      id,
      nombre,
      activo,
      clientes (
        id,
        nombre,
        pais
      ),
      capturas_programadas (
        id,
        estado,
        fecha,
        tipo_evidencia
      )
    `)
    .eq('activo', true)
    .order('nombre', { ascending: true })

  if (error) {
    console.error('Error cargando marcas:', error)
    return (
      <Card className="border-red-500/20 bg-red-500/5">
        <CardContent className="py-8 text-center text-red-600">
          Error al cargar marcas: {error.message}
        </CardContent>
      </Card>
    )
  }

  // Agrupar por cliente
  const agrupado = (marcas || []).reduce((acc: any, marca: any) => {
    const cliente = marca.clientes?.nombre || 'Sin cliente'
    if (!acc[cliente]) acc[cliente] = []
    acc[cliente].push(marca)
    return acc
  }, {})

  // KPIs globales
  const totalMarcas = marcas?.length || 0
  const totalCapturas =
    marcas?.reduce(
      (sum, m) => sum + (m.capturas_programadas?.length || 0),
      0
    ) || 0
  const totalPendientes =
    marcas?.reduce(
      (sum, m) =>
        sum +
        (m.capturas_programadas?.filter((c: any) => c.estado === 'pendiente')
          .length || 0),
      0
    ) || 0

  return (
    <>
      {/* KPIs con los mismos colores que Calendario/Historial */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Total Marcas → Azul */}
        <Card className="bg-gradient-to-br from-blue-500/10 to-blue-500/5 border-blue-500/20">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Total Marcas
                </p>
                <p className="text-3xl font-bold mt-1 text-blue-600">
                  {totalMarcas}
                </p>
              </div>
              <Tag className="h-8 w-8 text-blue-500/50" />
            </div>
          </CardContent>
        </Card>

        {/* Total Capturas → Verde */}
        <Card className="bg-gradient-to-br from-green-500/10 to-green-500/5 border-green-500/20">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Total Capturas
                </p>
                <p className="text-3xl font-bold mt-1 text-green-600">
                  {totalCapturas}
                </p>
              </div>
              <Camera className="h-8 w-8 text-green-500/50" />
            </div>
          </CardContent>
        </Card>

        {/* Pendientes → Amarillo */}
        <Card className="bg-gradient-to-br from-yellow-500/10 to-yellow-500/5 border-yellow-500/20">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Pendientes
                </p>
                <p className="text-3xl font-bold mt-1 text-yellow-600">
                  {totalPendientes}
                </p>
              </div>
              <div className="rounded-full bg-yellow-500/20 p-2">
                <span className="text-2xl">⏳</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {Object.keys(agrupado).length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">No hay marcas registradas.</p>
          </CardContent>
        </Card>
      ) : (
        Object.entries(agrupado).map(([cliente, marcasCliente]: [string, any]) => (
          <div key={cliente} className="space-y-3">
            {/* Header del cliente */}
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-semibold">🏢 {cliente}</h2>
              <Badge variant="secondary">
                {marcasCliente.length}{' '}
                {marcasCliente.length === 1 ? 'marca' : 'marcas'}
              </Badge>
            </div>

            {/* Grid de marcas */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {marcasCliente.map((marca: any) => {
                const totalCapturasMarca = marca.capturas_programadas?.length || 0
                const pendientes =
                  marca.capturas_programadas?.filter(
                    (c: any) => c.estado === 'pendiente'
                  ).length || 0
                const ejecutadas =
                  marca.capturas_programadas?.filter(
                    (c: any) => c.estado === 'ejecutada'
                  ).length || 0

                return (
                  <Card key={marca.id}>
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">
                          🏷️ {marca.nombre}
                        </CardTitle>
                        <div className="flex items-center gap-2">
                          <Link href={`/marcas/${marca.id}`}>
                            <Button
                              variant="outline"
                              size="sm"
                              className="gap-2"
                            >
                              Ver tareas
                              <ArrowRight className="h-3.5 w-3.5" />
                            </Button>
                          </Link>
                          <AccionesMarca
                            marcaId={marca.id}
                            marcaNombre={marca.nombre}
                            clienteId={marca.clientes?.id}
                          />
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {/* Contadores con colores coherentes */}
                      <div className="grid grid-cols-3 gap-2 text-center">
                        <div>
                          <p className="text-xs text-muted-foreground">Total</p>
                          <p className="text-lg font-bold">
                            {totalCapturasMarca}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">
                            ✅ Ejec.
                          </p>
                          <p className="text-lg font-bold text-green-600">
                            {ejecutadas}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">
                            ⏳ Pend.
                          </p>
                          <p className="text-lg font-bold text-yellow-600">
                            {pendientes}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </div>
        ))
      )}
    </>
  )
}