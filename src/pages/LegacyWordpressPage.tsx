import { useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';

type LegacyManifestPage = {
  path: string;
  source: string;
  file: string;
};

type LegacyManifest = {
  generatedAt: string;
  base: string;
  pages: LegacyManifestPage[];
  failed?: Array<{ path: string; source: string; error: string }>;
};

function normalizePath(pathname: string) {
  if (pathname.length > 1 && pathname.endsWith('/')) {
    return pathname.slice(0, -1);
  }
  return pathname || '/';
}

export default function LegacyWordpressPage() {
  const location = useLocation();
  const normalizedPath = useMemo(() => normalizePath(location.pathname), [location.pathname]);
  const [loading, setLoading] = useState(true);
  const [filePath, setFilePath] = useState<string | null>(null);
  const [sourceUrl, setSourceUrl] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setFilePath(null);
      setSourceUrl(null);

      try {
        const response = await fetch('/legacy-pages/manifest.json');
        if (!response.ok) {
          throw new Error('Manifest yüklenemedi');
        }

        const manifest = (await response.json()) as LegacyManifest;
        const page = manifest.pages.find((item) => item.path === normalizedPath);

        if (!cancelled && page) {
          setFilePath(`/legacy-pages/pages/${page.file}`);
          setSourceUrl(page.source);
        }
      } catch (error) {
        console.error('Legacy page load error:', error);
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [normalizedPath]);

  if (loading) {
    return <div style={{ padding: '64px', textAlign: 'center' }}>İçerik yükleniyor...</div>;
  }

  if (!filePath) {
    return (
      <div style={{ padding: '64px', textAlign: 'center' }}>
        <h1 style={{ marginBottom: '12px' }}>404</h1>
        <p style={{ marginBottom: '16px' }}>Sayfa bulunamadı.</p>
        <a href="https://khilonfast.com/" target="_blank" rel="noreferrer">
          Canlı siteye git
        </a>
      </div>
    );
  }

  return (
    <div style={{ width: '100%', minHeight: '100vh' }}>
      <iframe
        src={filePath}
        title={`Legacy: ${normalizedPath}`}
        style={{ width: '100%', height: '100vh', border: '0', display: 'block' }}
      />
      {sourceUrl && (
        <div style={{ padding: '8px 16px', fontSize: '12px', opacity: 0.75 }}>
          Kaynak: <a href={sourceUrl} target="_blank" rel="noreferrer">{sourceUrl}</a>
        </div>
      )}
    </div>
  );
}
