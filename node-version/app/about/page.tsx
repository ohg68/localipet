import Link from "next/link";
import {
    QrCode,
    Smartphone,
    MapPin,
    Bell,
    ShieldCheck,
    Heart,
    ArrowRight,
    UserPlus,
    CheckCircle2
} from "lucide-react";

export default function AboutPage() {
    return (
        <div className="flex flex-col min-h-screen bg-white">
            {/* Hero Section */}
            <section className="relative py-20 overflow-hidden bg-gray-50">
                <div className="absolute top-0 right-0 w-1/3 h-full opacity-5 pointer-events-none">
                    <QrCode className="w-full h-full -mr-20" />
                </div>
                <div className="container relative z-10">
                    <div className="max-w-3xl mx-auto text-center">
                        <h1 className="text-5xl lg:text-6xl font-black text-gray-900 tracking-tight leading-tight mb-6">
                            ¿Cómo funciona <span className="text-primary italic">Localipet?</span>
                        </h1>
                        <p className="text-xl text-gray-500 font-medium leading-relaxed mb-10">
                            Hemos reinventado la forma de proteger a tus mascotas. Unimos tecnología, rapidez y cuidado en una sola plataforma diseñada para tu tranquilidad.
                        </p>
                        <div className="flex justify-center gap-4">
                            <Link href="/register" className="btn-primary py-4 px-8 text-lg font-bold shadow-xl shadow-primary/20 hover:scale-105 transition-transform">
                                Proteger a mi mascota
                                <ArrowRight className="w-5 h-5" />
                            </Link>
                        </div>
                    </div>
                </div>
            </section>

            {/* Main Illustration Section */}
            <section className="py-16">
                <div className="container">
                    <div className="bg-white rounded-[3rem] shadow-2xl overflow-hidden border border-gray-100 flex flex-col lg:flex-row items-center">
                        <div className="lg:w-1/2 p-8 lg:p-16">
                            <img
                                src="/how-it-works-es.png"
                                alt="Ilustración Cómo funciona Localipet"
                                className="w-full h-auto rounded-2xl shadow-inner"
                            />
                        </div>
                        <div className="lg:w-1/2 p-8 lg:p-16 bg-gray-50/50 self-stretch flex flex-col justify-center">
                            <h2 className="text-3xl font-black text-gray-900 mb-8 tracking-tight">El poder de un simple escaneo</h2>
                            <div className="space-y-6">
                                {[
                                    {
                                        icon: Smartphone,
                                        title: "Escaneo universal",
                                        desc: "Cualquier persona con un teléfono inteligente puede escanear el tag QR. No se requiere descargar ninguna aplicación extra."
                                    },
                                    {
                                        icon: MapPin,
                                        title: "Geolocalización instantánea",
                                        desc: "Cuando alguien escanea el tag, el sistema solicita permiso para compartir su ubicación GPS en tiempo real."
                                    },
                                    {
                                        icon: Bell,
                                        title: "Alertas inmediatas",
                                        desc: "Recibes una notificación instantánea vía WhatsApp/Email con la ubicación exacta donde se encontró tu mascota."
                                    }
                                ].map((item, i) => (
                                    <div key={i} className="flex gap-4">
                                        <div className="bg-white p-3 rounded-xl shadow-sm text-primary flex-shrink-0 h-fit">
                                            <item.icon className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-gray-900 mb-1">{item.title}</h3>
                                            <p className="text-gray-500 text-sm font-medium leading-relaxed">{item.desc}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Step by Step Section */}
            <section className="py-24">
                <div className="container">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl font-black text-gray-900 mb-4">Tu ruta hacia la tranquilidad</h2>
                        <p className="text-gray-500 font-medium max-w-2xl mx-auto">En solo 4 pasos, tu mascota estará protegida por la red más avanzada de identificación.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 relative">
                        {/* Connecting line for desktop */}
                        <div className="hidden lg:block absolute top-12 left-0 w-full h-0.5 bg-gray-100 -z-10"></div>

                        {[
                            {
                                step: "01",
                                icon: UserPlus,
                                title: "Registra el perfil",
                                desc: "Crea una cuenta gratuita y añade a todas tus mascotas con sus datos y fotos."
                            },
                            {
                                step: "02",
                                icon: QrCode,
                                title: "Activa el Tag",
                                desc: "Escanea la placa QR física o genera una digital para vincularla al perfil de tu mascota."
                            },
                            {
                                step: "03",
                                icon: MapPin,
                                title: "Masilla Inteligente",
                                desc: "Si tu mascota se extravía, activa el 'Modo Perdido' para recibir alertas prioritarias."
                            },
                            {
                                step: "04",
                                icon: Heart,
                                title: "Reencuentro Feliz",
                                desc: "Usa nuestra mensajería segura para coordinar la entrega con quien encontró a tu mascota."
                            }
                        ].map((step, i) => (
                            <div key={i} className="flex flex-col items-center text-center group">
                                <div className="bg-white border-4 border-gray-50 w-24 h-24 rounded-full flex items-center justify-center mb-6 shadow-xl group-hover:border-primary/20 group-hover:scale-110 transition-all duration-300 relative">
                                    <span className="absolute -top-2 -right-2 bg-primary text-white text-xs font-black px-2 py-1 rounded-full">{step.step}</span>
                                    <step.icon className="w-10 h-10 text-primary" />
                                </div>
                                <h3 className="text-xl font-bold text-gray-900 mb-3">{step.title}</h3>
                                <p className="text-sm text-gray-500 font-medium leading-relaxed">{step.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Features Grid */}
            <section className="py-24 bg-gray-900 text-white rounded-[4rem] mx-4 mb-12 overflow-hidden relative">
                <div className="absolute top-0 right-0 w-96 h-96 bg-primary/20 blur-[100px] rounded-full -mr-48 -mt-48"></div>
                <div className="container relative z-10">
                    <div className="flex flex-col lg:flex-row items-end justify-between mb-16 gap-8">
                        <div className="max-w-2xl">
                            <h2 className="text-4xl lg:text-5xl font-black mb-6 tracking-tight">Diseñado para la vida real</h2>
                            <p className="text-gray-400 text-lg font-medium leading-relaxed italic">
                                No solo se trata de un código, se trata de la seguridad de quienes más amas.
                            </p>
                        </div>
                        <div className="hidden lg:flex gap-4">
                            <div className="bg-white/10 p-4 rounded-2xl backdrop-blur-md border border-white/10 flex items-center gap-3">
                                <CheckCircle2 className="text-primary w-6 h-6" />
                                <span className="font-bold">100% Privado</span>
                            </div>
                            <div className="bg-white/10 p-4 rounded-2xl backdrop-blur-md border border-white/10 flex items-center gap-3">
                                <CheckCircle2 className="text-primary w-6 h-6" />
                                <span className="font-bold">24/7 Disponible</span>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {[
                            {
                                title: "Privacidad Controlada",
                                desc: "Tú decides qué datos mostrar públicamente. Tu información de contacto solo se revela bajo tus términos.",
                                icon: ShieldCheck
                            },
                            {
                                title: "Historial Médico",
                                desc: "Guarda vacunas, alergias y notas médicas importantes que un veterinario o buscador pueda ver en emergencia.",
                                icon: Heart
                            },
                            {
                                title: "Tecnología Web",
                                desc: "Sin instalaciones lentas. Localipet corre perfectamente en el navegador de cualquier teléfono Android o iPhone.",
                                icon: Smartphone
                            }
                        ].map((card, i) => (
                            <div key={i} className="bg-white/5 p-10 rounded-[2.5rem] border border-white/10 hover:bg-white/10 transition-colors">
                                <div className="bg-primary/20 p-4 rounded-2xl w-fit mb-8">
                                    <card.icon className="w-8 h-8 text-primary" />
                                </div>
                                <h3 className="text-2xl font-bold mb-4">{card.title}</h3>
                                <p className="text-gray-400 font-medium leading-relaxed">{card.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Final CTA */}
            <section className="py-24 text-center">
                <div className="container">
                    <div className="max-w-3xl mx-auto">
                        <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-black mb-8">
                            <Heart className="w-4 h-4" />
                            <span>Protege su felicidad hoy mismo</span>
                        </div>
                        <h2 className="text-4xl lg:text-5xl font-black text-gray-900 mb-8 tracking-tight">¿Listo para unirte a la familia?</h2>
                        <p className="text-xl text-gray-500 font-medium mb-12">
                            No esperes a un imprevisto. El mejor cuidado es la prevención constante.
                        </p>
                        <div className="flex flex-col sm:flex-row justify-center gap-4">
                            <Link href="/register" className="btn-primary py-5 px-10 text-xl font-black shadow-2xl shadow-primary/30 hover:scale-105 active:scale-95 transition-all">
                                Registrar mi mascota ahora
                            </Link>
                            <Link href="/login" className="px-10 py-5 text-xl font-bold text-gray-600 hover:text-primary transition-colors">
                                Tengo una cuenta
                            </Link>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}
