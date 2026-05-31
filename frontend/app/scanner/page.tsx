import ScannerPage from '@/components/camera/scanner-page'

export const metadata = {
  title: 'Scanner de Productos',
}

export default function Scanner() {
  return (
    <>
      <header className="shrink-0">
        <h1 className="text-2xl font-bold tracking-tight">
          Scanner de Productos
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Apuntá la cámara a los productos en la góndola
        </p>
      </header>
      <ScannerPage />
    </>
  )
}
