export default function Footer() {
    return (
        <footer className="bg-white border-t border-gray-200 py-8 mt-auto">
            <div className="container">
                <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                    <div className="text-gray-500 text-sm">
                        © {new Date().getFullYear()} Localipet. Todos los derechos reservados.
                    </div>
                    <div className="flex gap-6 text-sm text-gray-600">
                        <a href="#" className="hover:text-primary transition-colors">Privacidad</a>
                        <a href="#" className="hover:text-primary transition-colors">Términos</a>
                        <a href="#" className="hover:text-primary transition-colors">Contacto</a>
                    </div>
                </div>
            </div>
        </footer>
    );
}
