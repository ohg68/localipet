import { getLocale } from "@/lib/locale";
import { translations } from "@/lib/i18n";

export default async function Footer() {
    const locale = await getLocale();
    const t = translations[locale];

    return (
        <footer className="bg-white border-t border-gray-200 py-8 mt-auto">
            <div className="container">
                <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                    <div className="text-gray-500 text-sm">
                        {t.footer.copyright}
                    </div>
                    <div className="flex gap-6 text-sm text-gray-600">
                        <a href="#" className="hover:text-primary transition-colors">{t.footer.privacy}</a>
                        <a href="#" className="hover:text-primary transition-colors">{t.footer.terms}</a>
                        <a href="#" className="hover:text-primary transition-colors">{t.footer.contact}</a>
                    </div>
                </div>
            </div>
        </footer>
    );
}

