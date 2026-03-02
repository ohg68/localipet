export type Locale = "es" | "pt";

export const translations = {
    es: {
        hero: {
            badge: "La seguridad de tu mascota, reinventada",
            title: "Tu mejor amigo,",
            titleAccent: "siempre protegido.",
            description: "Localipet utiliza tecnología de códigos QR inteligentes para asegurar que tu mascota siempre tenga una forma de volver a casa. Registro médico, avisos de extravío y más.",
            ctaDashboard: "Ir a mi Dashboard",
            ctaRegister: "Comenzar Gratis",
            ctaLogin: "Iniciar Sesión",
        },
        nav: {
            lostPets: "Mascotas Perdidas",
            howItWorks: "¿Cómo funciona?",
            home: "Inicio",
            pets: "Mascotas",
            notifications: "Avisos",
            clinics: "Clínicas",
            vetErp: "Vet ERP",
            admin: "Admin",
            login: "Entrar",
            register: "Registrarse"
        },
        features: {
            title: "Todo lo que necesitas para su cuidado",
            subtitle: "Más que un simple código QR, una plataforma completa para la vida de tu mascota.",
            items: [
                {
                    title: "ID Digital Inteligente",
                    desc: "Genera un código QR único para cada mascota. Cualquier persona con un smartphone puede ayudarte a encontrarla.",
                },
                {
                    title: "Mensajería Directa",
                    desc: "Recibe avisos inmediatos cuando alguien encuentre a tu mascota, con ubicación GPS opcional.",
                },
                {
                    title: "Historial de Salud",
                    desc: "Lleva el control de vacunas, peso y citas veterinarias en un solo lugar accesible desde cualquier parte.",
                },
                {
                    title: "Sin Aplicaciones",
                    desc: "Funciona directamente en el navegador de cualquier teléfono. Sin descargas pesadas ni registros complicados.",
                }
            ]
        },
        cta: {
            title: "Únete a la familia Localipet",
            description: "Cientos de mascotas ya están protegidas. No esperes a una emergencia para comenzar a cuidarlos de verdad.",
            register: "Registrarme ahora",
            howItWorks: "¿Cómo funciona?",
        },
        footer: {
            copyright: "© 2026 Localipet. Hecho con amor para tus mascotas.",
            privacy: "Privacidad",
            terms: "Términos",
            contact: "Contacto",
        },
        scan: {
            lost: "¡MASCOTA EXTRAVIADA!",
            lostDesc: "Su dueño la está buscando intensamente. Por favor, ayuda a que regrese a casa.",
            species: "Especie",
            breed: "Raza",
            ownerContact: "Contacto del Dueño",
            callNow: "Llamar Ahora",
            medicalInfo: "Información Médica Importante",
            poweredBy: "Impulsado por Localipet",
            mestizo: "Mestizo",
            dog: "Perro",
            cat: "Gato"
        },
        dashboard: {
            greeting: "Hola,",
            stats: {
                pets: "Mascotas",
                scans: "Escaneos (7d)",
                messages: "Mensajes",
                shared: "Compartidos"
            },
            summary: "Tienes {count} {animal} en tu cuenta.",
            summaryAnimalSin: "mascota registrada",
            summaryAnimalPlu: "mascotas registradas",
            addNew: "Añadir nueva mascota",
            recentPets: "Mascotas Recientes",
            viewAll: "Ver todas",
            noPets: "No tienes mascotas registradas aún.",
            startNow: "Comenzar ahora",
            statusLost: "Extraviado",
            noBreed: "Sin raza",
            newMessages: "¡Nuevos Mensajes!",
            newMessagesDesc: "Tienes {count} mensajes nuevos de personas que han escaneado a tus mascotas.",
            checkInbox: "Revisar Bandeja",
            securityTips: "Consejos de Seguridad",
            tips: [
                "Mantén siempre actualizado el ID del Microchip en la ficha de tu mascota.",
                "Si sales de viaje, marca a tu mascota como 'Preventivo' para alertas rápidas.",
                "Verifica que tu teléfono de contacto esté al día en tu perfil."
            ],
            proTitle: "Localipet PRO",
            proDesc: "Accede a geolocalización avanzada, historial médico completo y más funciones premium.",
            knowMore: "Saber más"
        },
        auth: {
            titleLogin: "Identidad Localipet",
            subtitleLogin: "Gestiona la seguridad de tus mejores amigos.",
            labelEmail: "Correo electrónico",
            labelPass: "Contraseña",
            btnLogin: "Entrar al Ecosistema",
            noAccount: "¿No tienes cuenta?",
            btnRegister: "Unete Gratis",
            titleRegister: "Protege a tu mascota hoy",
            subtitleRegister: "Crea tu cuenta y digitaliza su seguridad en segundos.",
            labelName: "Nombre completo",
            btnCreate: "Crear Identidad Digital"
        },
        lostPets: {
            badge: "Emergencia Comunitaria",
            title: "Mascotas Extraviadas",
            description: "Ayúdanos a que estos compañeros vuelvan a casa. Si has visto a alguno de ellos, por favor contacta a sus dueños o escanea su código QR si es posible.",
            searchPlaceholder: "Buscar por nombre, especie o ciudad...",
            filter: "Filtrar",
            noLost: "No hay reportes de mascotas extraviadas en este momento.",
            noLostTitle: "¡Buenas noticias!",
            lookingFor: "Se busca",
            since: "Desde",
            lastSeen: "Última vez visto:",
            none: "Desconocido",
            noDescription: "Sin descripción adicional",
            viewProfile: "Ver Ficha"
        },
        about: {
            title: "¿Cómo funciona Localipet?",
            subtitle: "Hemos reinventado la forma de proteger a tus mascotas. Unimos tecnología, rapidez y cuidado en una sola plataforma diseñada para tu tranquilidad.",
            cta: "Proteger a mi mascota",
            powerTitle: "El poder de un simple escaneo",
            steps: [
                {
                    title: "Escaneo universal",
                    desc: "Cualquier persona con un teléfono inteligente puede escanear el tag QR. No se requiere descargar ninguna aplicación extra."
                },
                {
                    title: "Geolocalización instantánea",
                    desc: "Cuando alguien escanea el tag, el sistema solicita permiso para compartir su ubicación GPS en tiempo real."
                },
                {
                    title: "Alertas inmediatas",
                    desc: "Recibes una notificación instantánea vía WhatsApp/Email con la ubicación exacta donde se encontró tu mascota."
                }
            ],
            routeTitle: "Tu ruta hacia la tranquilidad",
            routeSubtitle: "En solo 4 pasos, tu mascota estará protegida por la red más avanzada de identificación.",
            routeItems: [
                { title: "Registra el perfil", desc: "Crea una cuenta gratuita y añade a todas tus mascotas con sus datos y fotos." },
                { title: "Activa el Tag", desc: "Escanea la placa QR física o genera una digital para vincularla al perfil de tu mascota." },
                { title: "Modo Emergencia", desc: "Si tu mascota se extravía, activa el 'Modo Perdido' para recibir alertas prioritarias." },
                { title: "Reencuentro Feliz", desc: "Usa nuestra mensajería segura para coordinar la entrega con quien encontró a tu mascota." }
            ],
            designTitle: "Diseñado para la vida real",
            designSubtitle: "No solo se trata de un código, se trata de la seguridad de quienes más amas.",
            designCards: [
                { title: "Privacidad Controlada", desc: "Tú decides qué datos mostrar públicamente. Tu información de contacto solo se revela bajo tus términos." },
                { title: "Historial Médico", desc: "Guarda vacunas, alergias y notas médicas importantes que un veterinario o buscador pueda ver en emergencia." },
                { title: "Tecnología Web", desc: "Sin instalaciones lentas. Localipet corre perfectamente en el navegador de cualquier teléfono Android o iPhone." }
            ],
            finalTitle: "¿Listo para unirte a la familia?",
            finalSubtitle: "No esperes a un imprevisto. El mejor cuidado es la prevención constante.",
            finalBtn: "Registrar mi mascota ahora",
            haveAccount: "Tengo una cuenta"
        }
    },
    pt: {
        hero: {
            badge: "A segurança do seu animal de estimação, reinventada",
            title: "O seu melhor amigo,",
            titleAccent: "sempre protegido.",
            description: "A Localipet utiliza tecnologia de códigos QR inteligentes para garantir que o seu animal tenha sempre uma forma de voltar para casa. Registro médico, avisos de perda e muito mais.",
            ctaDashboard: "Ir para o meu Painel",
            ctaRegister: "Começar Grátis",
            ctaLogin: "Iniciar Sessão",
        },
        nav: {
            lostPets: "Animais Perdidos",
            howItWorks: "Como funciona?",
            home: "Início",
            pets: "Animais",
            notifications: "Avisos",
            clinics: "Clínicas",
            vetErp: "Vet ERP",
            admin: "Admin",
            login: "Entrar",
            register: "Registar-se"
        },
        features: {
            title: "Tudo o que precisa para o seu cuidado",
            subtitle: "Mais do que um simples código QR, uma plataforma completa para a vida do seu animal.",
            items: [
                {
                    title: "ID Digital Inteligente",
                    desc: "Gere um código QR único para cada animal. Qualquer pessoa com um smartphone pode ajudar a encontrá-lo.",
                },
                {
                    title: "Mensagens Diretas",
                    desc: "Receba avisos imediatos quando alguém encontrar o seu animal, com localização GPS opcional.",
                },
                {
                    title: "Histórico de Saúde",
                    desc: "Mantenha o controle de vacinas, peso e consultas veterinárias num único local acessível de qualquer parte.",
                },
                {
                    title: "Sem Aplicações",
                    desc: "Funciona diretamente no navegador de qualquer telemóvel/celular. Sem downloads pesados nem registros complicados.",
                }
            ]
        },
        cta: {
            title: "Junte-se à família Localipet",
            description: "Centenas de animais já estão protegidos. Não espere por uma emergência para começar a cuidar deles de verdade.",
            register: "Registar-me agora",
            howItWorks: "Como funciona?",
        },
        footer: {
            copyright: "© 2026 Localipet. Feito com amor para os seus animais.",
            privacy: "Privacidade",
            terms: "Termos",
            contact: "Contacto",
        },
        scan: {
            lost: "ANIMAL PERDIDO!",
            lostDesc: "O seu tutor está à procura dele intensamente. Por favor, ajude-o a regressar a casa.",
            species: "Espécie",
            breed: "Raça",
            ownerContact: "Contacto do Tutor",
            callNow: "Ligar Agora",
            medicalInfo: "Informação Médica Importante",
            poweredBy: "Desenvolvido por Localipet",
            mestizo: "Sem Raça Definida",
            dog: "Cão",
            cat: "Gato"
        },
        dashboard: {
            greeting: "Olá,",
            stats: {
                pets: "Animais",
                scans: "Leituras (7d)",
                messages: "Mensagens",
                shared: "Partilhados"
            },
            summary: "Você tem {count} {animal} na sua conta.",
            summaryAnimalSin: "animal registrado",
            summaryAnimalPlu: "animais registrados",
            addNew: "Adicionar novo animal",
            recentPets: "Animais Recentes",
            viewAll: "Ver todos",
            noPets: "Ainda não tem animais registrados.",
            startNow: "Começar agora",
            statusLost: "Perdido",
            noBreed: "Sem raça",
            newMessages: "Novas Mensagens!",
            newMessagesDesc: "Tem {count} novas mensagens de pessoas que leram o QR dos seus animais.",
            checkInbox: "Ver Mensagens",
            securityTips: "Dicas de Segurança",
            tips: [
                "Mantenha sempre atualizado o ID do Microchip na ficha do seu animal.",
                "Se for viajar, marque o seu animal como 'Preventivo' para alertas rápidos.",
                "Verifique se o seu telefone de contacto está atualizado no seu perfil."
            ],
            proTitle: "Localipet PRO",
            proDesc: "Tenha acesso a geolocalização avançada, histórico médico completo e mais funções premium.",
            knowMore: "Saber mais"
        },
        auth: {
            titleLogin: "Identidade Localipet",
            subtitleLogin: "Faça a gestão da segurança dos seus melhores amigos.",
            labelEmail: "E-mail",
            labelPass: "Palavra-passe/Senha",
            btnLogin: "Entrar no Ecossistema",
            noAccount: "Não tem conta?",
            btnRegister: "Junte-se Grátis",
            titleRegister: "Proteja o seu animal hoje",
            subtitleRegister: "Crie a sua conta e digitalize a sua segurança em segundos.",
            labelName: "Nome completo",
            btnCreate: "Criar Identidad Digital"
        },
        lostPets: {
            badge: "Emergência Comunitária",
            title: "Animais Perdidos",
            description: "Ajude-nos a fazer com que estes companheiros voltem para casa. Se viu algum deles, por favor contacte os tutores ou leia o código QR se for possível.",
            searchPlaceholder: "Procurar por nome, espécie ou cidade...",
            filter: "Filtrar",
            noLost: "Não existem relatos de animais perdidos neste momento.",
            noLostTitle: "Boas notícias!",
            lookingFor: "Procura-se",
            since: "Desde",
            lastSeen: "Visto pela última vez:",
            none: "Desconocido",
            noDescription: "Sem descrição adicional",
            viewProfile: "Ver Ficha"
        },
        about: {
            title: "Como funciona a Localipet?",
            subtitle: "Reinventámos a forma de proteger os seus animais de estimação. Unimos tecnologia, rapidez e cuidado numa única plataforma desenhada para a sua tranquilidade.",
            cta: "Proteger o meu animal",
            powerTitle: "O poder de uma simples leitura",
            steps: [
                {
                    title: "Leitura universal",
                    desc: "Qualquer pessoa com um smartphone pode ler o tag QR. Não é necessário descarregar nenhuma aplicação extra."
                },
                {
                    title: "Geolocalização instantânea",
                    desc: "Quando alguém lê o tag, o sistema solicita permissão para partilhar a sua localização GPS em tempo real."
                },
                {
                    title: "Alertas imediatos",
                    desc: "Recebe uma notificação instantânea via WhatsApp/E-mail com a localização exacta onde o seu animal foi encontrado."
                }
            ],
            routeTitle: "O seu caminho para a tranquilidade",
            routeSubtitle: "Em apenas 4 passos, o seu animal estará protegido pela rede de identificação mais avançada.",
            routeItems: [
                { title: "Registe o perfil", desc: "Crie uma conta gratuita e adicione todos os seus animais com os seus dados e fotos." },
                { title: "Ative o Tag", desc: "Leia a placa QR física ou gere uma digital para a ligar ao perfil do seu animal." },
                { title: "Modo Emergência", desc: "Se o seu animal se perder, ative o 'Modo Perdido' para receber alertas prioritários." },
                { title: "Reencontro Feliz", desc: "Use as nossas mensagens seguras para coordenar a entrega com quem encontrou o seu animal." }
            ],
            designTitle: "Desenhado para a vida real",
            designSubtitle: "Não se trata apenas de um código, trata-se da segurança de quem mais ama.",
            designCards: [
                { title: "Privacidade Controlada", desc: "Você decide quais os dados a mostrar publicamente. A sua informação de contacto só é revelada sob os seus termos." },
                { title: "Histórico Médico", desc: "Guarde vacinas, alergias e notas médicas importantes que um veterinário ou quem o encontrar possa ver em emergência." },
                { title: "Tecnologia Web", desc: "Sem instalações lentas. A Localipet funciona perfeitamente no navegador de qualquer telemóvel Android ou iPhone." }
            ],
            finalTitle: "Pronto para se juntar à família?",
            finalSubtitle: "Não espere por um imprevisto. O melhor cuidado é a prevenção constante.",
            finalBtn: "Registar o meu animal agora",
            haveAccount: "Tenho uma conta"
        }
    }
};
