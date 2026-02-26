import Link from "next/link";
import { ArrowRight, ShieldCheck, QrCode, MessageSquare, Heart, MapPin, Smartphone, Zap } from "lucide-react";
import { auth } from "@/auth";
import ShortCodeSearch from "@/components/ShortCodeSearch";

export default async function Home() {
  const session = await auth();

  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-white pt-16 pb-24 lg:pt-32 lg:pb-40">
        <div className="container relative z-10">
          <div className="flex flex-col lg:flex-row items-center gap-16">
            <div className="flex-1 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-bold mb-6 animate-in slide-in-from-top-4 duration-500">
                <Zap className="w-4 h-4" />
                <span>La seguridad de tu mascota, reinventada</span>
              </div>
              <h1 className="text-5xl lg:text-7xl font-black text-gray-900 tracking-tight leading-[1.1] mb-6 animate-in slide-in-from-left-4 duration-700">
                Tu mejor amigo, <br />
                <span className="text-primary italic">siempre protegido.</span>
              </h1>
              <p className="text-xl text-gray-500 mb-10 max-w-xl leading-relaxed mx-auto lg:mx-0 animate-in slide-in-from-left-8 duration-700">
                Localipet utiliza tecnología de códigos QR inteligentes para asegurar que tu mascota siempre tenga una forma de volver a casa. Registro médico, avisos de extravío y más.
              </p>
              <div className="flex flex-col sm:flex-row items-center gap-4 justify-center lg:justify-start animate-in slide-in-from-bottom-4 duration-700">
                {session ? (
                  <Link href="/dashboard" className="btn-primary py-4 px-8 text-lg shadow-2xl shadow-primary/30 hover:scale-105 active:scale-95 transition-all">
                    Ir a mi Dashboard
                    <ArrowRight className="w-5 h-5" />
                  </Link>
                ) : (
                  <>
                    <Link href="/register" className="btn-primary py-4 px-8 text-lg shadow-2xl shadow-primary/30 hover:scale-105 active:scale-95 transition-all">
                      Comenzar Gratis
                      <ArrowRight className="w-5 h-5" />
                    </Link>
                    <Link href="/login" className="px-8 py-4 text-lg font-bold text-gray-600 hover:text-primary transition-colors">
                      Iniciar Sesión
                    </Link>
                  </>
                )}
              </div>
            </div>
            <div className="flex-1 relative animate-in zoom-in duration-1000">
              <div className="absolute -inset-4 bg-primary/20 rounded-[3rem] blur-3xl -z-10 rotate-3"></div>
              <div className="card p-2 rounded-[2.5rem] shadow-2xl rotate-2 hover:rotate-0 transition-transform duration-500">
                <img
                  src="/hero_pet.png"
                  alt="Pet with QR tag"
                  className="rounded-[2.2rem] w-full shadow-inner"
                />
              </div>
              {/* Floating Element 1 */}
              <div className="absolute -bottom-6 -left-6 bg-white p-4 rounded-2xl shadow-2xl flex items-center gap-3 animate-bounce duration-[3000ms]">
                <div className="bg-green-500 p-2 rounded-full text-white">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase text-gray-400">Estado</p>
                  <p className="text-sm font-bold text-gray-900">Protegido</p>
                </div>
              </div>
              {/* Floating Element 2 */}
              <div className="absolute top-10 -right-6 bg-white p-4 rounded-2xl shadow-2xl flex items-center gap-3 animate-pulse">
                <div className="bg-rose-500 p-2 rounded-full text-white">
                  <MapPin className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase text-gray-400">Alerta</p>
                  <p className="text-sm font-bold text-gray-900">Escaneo Reciente</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      ...
      {/* Search Section */}
      <section className="relative z-20 -mt-12 mb-12">
        <div className="container max-w-3xl">
          <ShortCodeSearch />
        </div>
      </section>
      ...
      {/* Features Section */}
      <section className="bg-gray-50 py-24">
        <div className="container">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-black text-gray-900 mb-4">Todo lo que necesitas para su cuidado</h2>
            <p className="text-gray-500 font-medium max-w-2xl mx-auto italic">Más que un simple código QR, una plataforma completa para la vida de tu mascota.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                icon: QrCode,
                title: "ID Digital Inteligente",
                desc: "Genera un código QR único para cada mascota. Cualquier persona con un smartphone puede ayudarte a encontrarla.",
                color: "text-blue-500",
                bg: "bg-blue-50"
              },
              {
                icon: MessageSquare,
                title: "Mensajería Directa",
                desc: "Recibe avisos inmediatos cuando alguien encuentre a tu mascota, con ubicación GPS opcional.",
                color: "text-rose-500",
                bg: "bg-rose-50"
              },
              {
                icon: Heart,
                title: "Historial de Salud",
                desc: "Lleva el control de vacunas, peso y citas veterinarias en un solo lugar accesible desde cualquier parte.",
                color: "text-emerald-500",
                bg: "bg-emerald-50"
              },
              {
                icon: Smartphone,
                title: "Sin Aplicaciones",
                desc: "Funciona directamente en el navegador de cualquier teléfono. Sin descargas pesadas ni registros complicados.",
                color: "text-indigo-500",
                bg: "bg-indigo-50"
              }
            ].map((feature, i) => (
              <div key={i} className="card p-8 hover:shadow-xl transition-all group hover:bg-white border-transparent hover:border-gray-100">
                <div className={`${feature.bg} ${feature.color} w-12 h-12 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                  <feature.icon className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">{feature.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed font-medium">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-primary relative overflow-hidden">
        <div className="absolute top-0 right-0 opacity-10">
          <QrCode className="w-96 h-96 -mr-20 -mt-20" />
        </div>
        <div className="container relative z-10 text-center text-white">
          <h2 className="text-4xl lg:text-5xl font-black mb-6 tracking-tight">Únete a la familia Localipet</h2>
          <p className="text-xl text-white/80 mb-10 max-w-2xl mx-auto font-medium">
            Cientos de mascotas ya están protegidas. No esperes a una emergencia para comenzar a cuidarlos de verdad.
          </p>
          <div className="flex flex-col sm:flex-row items-center gap-4 justify-center">
            <Link href="/register" className="bg-white text-primary px-10 py-4 rounded-xl font-black text-lg shadow-xl hover:bg-gray-100 transition-colors">
              Registrarme ahora
            </Link>
            <Link href="/about" className="px-8 py-4 font-bold text-white hover:text-white/80 transition-colors border border-white/20 rounded-xl">
              ¿Cómo funciona?
            </Link>
          </div>
        </div>
      </section>

      {/* Simple Footer */}
      <footer className="py-12 border-t border-gray-100 bg-white">
        <div className="container flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="bg-primary p-1.5 rounded-lg">
              <Heart className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-black text-gray-900 italic tracking-tighter">Localipet</span>
          </div>
          <div className="flex gap-8 text-sm font-bold text-gray-400">
            <Link href="#" className="hover:text-primary transition-colors">Privacidad</Link>
            <Link href="#" className="hover:text-primary transition-colors">Términos</Link>
            <Link href="#" className="hover:text-primary transition-colors">Contacto</Link>
          </div>
          <p className="text-xs font-bold text-gray-400">© 2026 Localipet. Hecho con amor para tus mascotas.</p>
        </div>
      </footer>
    </div>
  );
}
