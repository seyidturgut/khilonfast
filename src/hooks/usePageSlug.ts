import { useLocation } from 'react-router-dom';

export function usePageSlug(): string {
    const location = useLocation();
    return location.pathname
        .replace(/^\/en(\/|$)/, '')
        .replace(/^\/+/, '')
        .replace(/\/+$/, '');
}
