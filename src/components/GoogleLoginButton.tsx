import { useEffect, useRef } from 'react'

declare global {
    interface Window {
        google?: any;
    }
}

interface GoogleLoginButtonProps {
    onCredential: (credential: string) => void;
}

export default function GoogleLoginButton({ onCredential }: GoogleLoginButtonProps) {
    const buttonRef = useRef<HTMLDivElement | null>(null);
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined;

    useEffect(() => {
        if (!clientId || !buttonRef.current) return;

        const existing = document.querySelector('script[data-google-gis="true"]');
        if (!existing) {
            const script = document.createElement('script');
            script.src = 'https://accounts.google.com/gsi/client';
            script.async = true;
            script.defer = true;
            script.dataset.googleGis = 'true';
            document.head.appendChild(script);
            script.onload = () => initGoogle();
        } else {
            initGoogle();
        }

        function initGoogle() {
            if (!window.google || !buttonRef.current) return;
            window.google.accounts.id.initialize({
                client_id: clientId,
                callback: (response: any) => {
                    if (response?.credential) {
                        onCredential(response.credential);
                    }
                }
            });
            window.google.accounts.id.renderButton(buttonRef.current, {
                type: 'standard',
                theme: 'outline',
                size: 'large',
                shape: 'pill',
                text: 'continue_with',
                width: 340
            });
        }
    }, [clientId, onCredential]);

    if (!clientId) {
        return (
            <button type="button" className="google-fallback" disabled>
                Google ile devam et (Client ID yok)
            </button>
        );
    }

    return <div ref={buttonRef} className="google-btn-host" />;
}
