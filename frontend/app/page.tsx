import { Heart, MapPin, Scan, Settings2, ShieldCheck } from 'lucide-react'
import Link from 'next/link'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

export const metadata = {
  title: 'Inicio | CeliAPP',
  description:
    'Tu compañero inteligente sin TACC. Escanea productos en tiempo real con inteligencia artificial conectada a la base de datos de ANMAT, encuentra comercios aptos y personaliza tu experiencia de accesibilidad.',
}

export default function Home() {
  return (
    <div className="flex-1 w-full bg-background text-foreground flex flex-col font-sans">
      {/* Hero Section */}
      <section className="relative overflow-hidden px-6 py-12 md:py-20 flex flex-col items-center text-center gap-6 bg-gradient-to-b from-blue-500/10 via-transparent to-transparent">
        <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight max-w-2xl bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400 bg-clip-text text-transparent leading-none py-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-lg">
          Tus compras sin TACC, más seguras que nunca.
        </h1>

        <p className="text-muted-foreground text-base md:text-lg max-w-lg leading-relaxed focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-lg">
          CeliAPP te ayuda a verificar alimentos aptos para celíacos al
          instante, ubicar locales verificados y navegar de forma accesible.
        </p>

        <div className="flex flex-wrap gap-3 justify-center mt-2">
          <Link
            id="hero-scan-cta"
            href="/scanner"
            className="group inline-flex items-center gap-2 px-5 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl shadow-lg shadow-blue-500/20 active:scale-98 transition-all text-sm md:text-base focus:outline-none focus-visible:ring-3 focus-visible:ring-blue-500"
          >
            <Scan className="w-5 h-5 group-hover:scale-110 transition-transform" />
            Abrir Escáner
          </Link>
          <Link
            id="hero-map-cta"
            href="/map"
            className="inline-flex items-center gap-2 px-5 py-3 bg-muted hover:bg-muted/80 text-foreground font-bold rounded-xl active:scale-98 transition-all text-sm md:text-base border border-border focus:outline-none focus-visible:ring-3 focus-visible:ring-ring"
          >
            <MapPin className="w-5 h-5" />
            Explorar Mapa
          </Link>
        </div>
      </section>

      {/* Features Section */}
      <section className="px-6 py-8 flex flex-col gap-6 max-w-4xl mx-auto w-full">
        <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight text-center md:text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-lg">
          Funcionalidades Clave
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1: Scanner */}
          <Card
            tabIndex={0}
            aria-label="Escáner de Góndola. Validación en tiempo real con Inteligencia Artificial. Apunta la cámara de tu celular a los productos. CeliAPP detectará los textos de la etiqueta y buscará en tiempo real contra los registros oficiales de la ANMAT si el producto es apto sin TACC."
            className="hover:scale-[1.02] hover:shadow-xl transition-all duration-300 border border-border bg-card/60 backdrop-blur-md flex flex-col justify-between focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <CardHeader>
              <div className="p-3 w-fit rounded-xl bg-green-500/10 text-green-600 dark:text-green-400 mb-2">
                <Scan className="w-6 h-6" />
              </div>
              <CardTitle className="text-xl font-bold">
                Escáner de Góndola
              </CardTitle>
              <CardDescription className="text-xs md:text-sm">
                Validación en tiempo real con Inteligencia Artificial.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <p className="text-muted-foreground text-sm leading-relaxed">
                Apunta la cámara de tu celular a los productos. CeliAPP
                detectará los textos de la etiqueta y buscará en tiempo real
                contra los registros oficiales de la ANMAT si el producto es
                apto sin TACC.
              </p>
              <Link
                id="feature-card-scan-link"
                href="/scanner"
                aria-label="Probar escáner de góndola"
                className="inline-flex items-center gap-1.5 text-blue-500 hover:text-blue-600 text-sm font-semibold tracking-wide group focus:outline-none focus-visible:underline"
              >
                Probar escáner
                <span className="group-hover:translate-x-0.5 transition-transform">
                  →
                </span>
              </Link>
            </CardContent>
          </Card>

          {/* Card 2: Map */}
          <Card
            tabIndex={0}
            aria-label="Locales Seguros. Encuentra comercios y restaurantes libres de gluten. Navega en el mapa interactivo para descubrir almacenes, dietéticas y restaurantes verificados. Puedes ver los detalles oficiales de cada local y agregarlos para colaborar con la comunidad."
            className="hover:scale-[1.02] hover:shadow-xl transition-all duration-300 border border-border bg-card/60 backdrop-blur-md flex flex-col justify-between focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <CardHeader>
              <div className="p-3 w-fit rounded-xl bg-orange-500/10 text-orange-600 dark:text-orange-400 mb-2">
                <MapPin className="w-6 h-6" />
              </div>
              <CardTitle className="text-xl font-bold">
                Locales Seguros
              </CardTitle>
              <CardDescription className="text-xs md:text-sm">
                Encuentra comercios y restaurantes libres de gluten.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <p className="text-muted-foreground text-sm leading-relaxed">
                Navega en el mapa interactivo para descubrir almacenes,
                dietéticas y restaurantes verificados. Puedes ver los detalles
                oficiales de cada local y agregarlos para colaborar con la
                comunidad.
              </p>
              <Link
                id="feature-card-map-link"
                href="/map"
                aria-label="Ver mapa de locales seguros"
                className="inline-flex items-center gap-1.5 text-blue-500 hover:text-blue-600 text-sm font-semibold tracking-wide group focus:outline-none focus-visible:underline"
              >
                Ver mapa
                <span className="group-hover:translate-x-0.5 transition-transform">
                  →
                </span>
              </Link>
            </CardContent>
          </Card>

          {/* Card 3: Accessibility */}
          <Card
            tabIndex={0}
            aria-label="Diseño Accesible. Personaliza la aplicación a tus necesidades visuales. CeliAPP está pensada para ser accesible. Adapta el tamaño del texto, activa el modo de Alto Contraste para una visibilidad perfecta bajo el sol o habilita la tipografía especial para Dislexia."
            className="hover:scale-[1.02] hover:shadow-xl transition-all duration-300 border border-border bg-card/60 backdrop-blur-md flex flex-col justify-between focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <CardHeader>
              <div className="p-3 w-fit rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 mb-2">
                <Settings2 className="w-6 h-6" />
              </div>
              <CardTitle className="text-xl font-bold">
                Diseño Accesible
              </CardTitle>
              <CardDescription className="text-xs md:text-sm">
                Personaliza la aplicación a tus necesidades visuales.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <p className="text-muted-foreground text-sm leading-relaxed">
                CeliAPP está pensada para ser accesible. Adapta el tamaño del
                texto, activa el modo de Alto Contraste para una visibilidad
                perfecta bajo el sol o habilita la tipografía especial para
                Dislexia.
              </p>
              <Link
                id="feature-card-settings-link"
                href="/settings"
                aria-label="Ajustar opciones de accesibilidad"
                className="inline-flex items-center gap-1.5 text-blue-500 hover:text-blue-600 text-sm font-semibold tracking-wide group focus:outline-none focus-visible:underline"
              >
                Ajustar accesibilidad
                <span className="group-hover:translate-x-0.5 transition-transform">
                  →
                </span>
              </Link>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Safety Info Box */}
      <section className="px-6 py-6 max-w-4xl mx-auto w-full">
        <div className="p-6 rounded-2xl border border-blue-500/20 bg-blue-500/5 flex flex-col md:flex-row items-center md:items-start gap-4">
          <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 shrink-0">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div className="flex flex-col gap-1.5 text-center md:text-left">
            <h3 className="font-bold text-base md:text-lg">
              Compromiso y Seguridad Alimentaria
            </h3>
            <p className="text-muted-foreground text-sm leading-relaxed">
              La base de datos del escáner sincroniza directamente con el
              listado oficial de la <strong>ANMAT</strong> (Administración
              Nacional de Medicamentos, Alimentos y Tecnología Médica). Sin
              embargo, siempre recomendamos verificar el sello oficial sin TACC
              en el envase físico del producto antes de consumirlo.
            </p>
          </div>
        </div>
      </section>

      {/* Footer info */}
      <footer className="mt-auto px-6 py-8 border-t border-border flex items-center justify-center gap-1.5 text-muted-foreground text-xs md:text-sm text-center">
        <span>CeliAPP — Hecho con</span>
        <Heart className="w-3.5 h-3.5 text-red-500 fill-red-500" />
        <span>para la comunidad libre de gluten.</span>
      </footer>
    </div>
  )
}
