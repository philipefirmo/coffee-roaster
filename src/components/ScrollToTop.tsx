import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export default function ScrollToTop() {
    const { pathname } = useLocation();

    useEffect(() => {
        // Tenta encontrar o container principal de scroll (geralmente body ou main)
        const mainElement = document.querySelector('main');

        // Scrolla window e main para garantir
        window.scrollTo(0, 0);
        if (mainElement) {
            mainElement.scrollTo(0, 0);
        }
    }, [pathname]);

    return null;
}
