import CapturaForm from '@/components/panel/capturas/CapturaForm'

export default function ProgramarPage() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">📝 Programar Captura</h1>
        <p className="text-muted-foreground">
          Crea una nueva captura programada para una implementación
        </p>
      </div>

      <div className="max-w-3xl">
        <CapturaForm />
      </div>
    </div>
  )
}