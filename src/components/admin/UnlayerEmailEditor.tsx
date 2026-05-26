import { useCallback, useEffect, useRef, useState, forwardRef, useImperativeHandle } from 'react';
import EmailEditor, { type EditorRef } from 'react-email-editor';

// ─── Merge tags (Unlayer toolbar { } picker) ──────────────────────────────────
export const KHILON_MERGE_TAGS = [
    { name: 'Ad',                value: '{{first_name}}',       sample: 'Ayşe' },
    { name: 'Soyad',             value: '{{last_name}}',        sample: 'Yılmaz' },
    { name: 'E-posta',           value: '{{email}}',            sample: 'ayse@example.com' },
    { name: 'Şirket',            value: '{{company}}',          sample: 'Acme A.Ş.' },
    { name: 'Hizmet Adı',        value: '{{service_name}}',     sample: 'Go-to-Market Paketi' },
    { name: 'Form Linki',        value: '{{form_link}}',        sample: 'https://khilonfast.com/onboarding?token=...' },
    { name: 'Sepet Linki',       value: '{{cart_link}}',        sample: 'https://khilonfast.com/odeme?cart=...' },
    { name: 'İletişim Linki',    value: '{{contact_link}}',     sample: 'https://khilonfast.com/iletisim' },
    { name: 'Giriş Linki',       value: '{{login_url}}',        sample: 'https://khilonfast.com/giris' },
    { name: 'Sipariş No',        value: '{{order_id}}',         sample: 'ORD-20240409' },
    { name: 'Listeden Çık',      value: '{{unsubscribe_link}}', sample: 'https://khilonfast.com/api/crm-public/unsubscribe?...' },
];

export const KHILON_EDITOR_OPTIONS = {
    displayMode: 'email' as const,
    locale: 'tr-TR',
    appearance: { theme: 'light' as const },
    features: {
        textEditor: { spellChecker: false, tables: true },
        mergeTags: true,
    },
    mergeTags: KHILON_MERGE_TAGS,
    fonts: {
        showDefaultFonts: true,
        customFonts: [
            { label: 'Inter Tight', value: "'Inter Tight', sans-serif", url: 'https://fonts.googleapis.com/css2?family=Inter+Tight:wght@400;500;600;700;800&display=swap' },
        ],
    },
    tools: {
        button: { enabled: true },
        divider: { enabled: true },
        image: { enabled: true },
        social: { enabled: true },
        text: { enabled: true },
        video: { enabled: false },
    },
};

// ─── HTML → Unlayer design wrapper (eski body_html'i Unlayer canvas'a yükle) ──
export function wrapHtmlAsDesign(html: string, preheaderText = ''): object {
    return {
        counters: { u_column: 1, u_row: 1, u_content_html: 1 },
        body: {
            rows: [{
                cells: [1],
                columns: [{
                    contents: [{
                        type: 'html',
                        values: { html, hideDesktop: false, hideMobile: false, containerPadding: '20px' }
                    }],
                    values: { backgroundColor: '', padding: '0px', border: {}, _meta: { htmlID: 'u_column_1', htmlClassNames: 'u_column' } }
                }],
                values: {
                    displayCondition: null,
                    columns: false,
                    backgroundColor: '',
                    columnsBackgroundColor: '',
                    backgroundImage: { url: '', fullWidth: true, repeat: false, center: true, cover: false },
                    padding: '0px',
                    hideDesktop: false,
                    hideMobile: false,
                    noStackMobile: false,
                    _meta: { htmlID: 'u_row_1', htmlClassNames: 'u_row' },
                    selectable: true, draggable: true, duplicatable: true, deletable: true,
                }
            }],
            values: {
                backgroundColor: '#ffffff',
                backgroundImage: { url: '', fullWidth: true, repeat: false, center: true, cover: false },
                contentWidth: '600px',
                fontFamily: { label: 'Arial', value: 'arial,helvetica,sans-serif' },
                preheaderText,
                linkStyle: { body: true, linkColor: '#1a3a52', linkHoverColor: '#0095ff', linkUnderline: true, linkHoverUnderline: true },
                _meta: { htmlID: 'u_body', htmlClassNames: 'u_body' }
            }
        },
        schemaVersion: 12,
    };
}

// ─── Public component API ─────────────────────────────────────────────────────
export interface UnlayerEditorHandle {
    /** Mevcut canvas'tan { html, design } export et */
    export: () => Promise<{ html: string; design: object; variables: string[] }>;
    /** Manuel design yükle */
    loadDesign: (design: object) => void;
    /** body_html ile yükle (HTML wrapper kullanır) */
    loadHtml: (html: string, preheaderText?: string) => void;
    /** Editor hazır mı */
    isReady: () => boolean;
}

interface UnlayerEditorProps {
    /** Başlangıçta yüklenecek Unlayer design JSON (object, string ise parse edilir) */
    initialDesign?: object | string | null;
    /** design_json yoksa body_html'den wrap edilerek yüklenir */
    fallbackHtml?: string | null;
    preheaderText?: string;
    minHeight?: string;
    onReady?: () => void;
}

const UnlayerEmailEditor = forwardRef<UnlayerEditorHandle, UnlayerEditorProps>(
    function UnlayerEmailEditor({ initialDesign, fallbackHtml, preheaderText = '', minHeight = '100%', onReady }, ref) {
        const editorRef = useRef<EditorRef>(null);
        const [ready, setReady] = useState(false);
        const pending = useRef<object | null>(null);

        // initialDesign / fallbackHtml'den pending design hesapla
        useEffect(() => {
            let design: object | null = null;
            if (initialDesign) {
                if (typeof initialDesign === 'string') {
                    try { design = JSON.parse(initialDesign); } catch { design = null; }
                } else {
                    design = initialDesign;
                }
            }
            if (!design && fallbackHtml) {
                design = wrapHtmlAsDesign(fallbackHtml, preheaderText);
            }
            pending.current = design;
            // Editor zaten hazırsa anında yükle
            if (ready && pending.current && editorRef.current?.editor) {
                editorRef.current.editor.loadDesign(pending.current as never);
                pending.current = null;
            }
            // eslint-disable-next-line react-hooks/exhaustive-deps
        }, [initialDesign, fallbackHtml, preheaderText]);

        const handleReady = useCallback(() => {
            setReady(true);
            if (pending.current && editorRef.current?.editor) {
                editorRef.current.editor.loadDesign(pending.current as never);
                pending.current = null;
            }
            onReady?.();
        }, [onReady]);

        useImperativeHandle(ref, () => ({
            export: () => new Promise((resolve, reject) => {
                if (!editorRef.current?.editor) return reject(new Error('Editor hazır değil'));
                editorRef.current.editor.exportHtml(({ design, html }) => {
                    const matches = html.match(/\{\{(\w+)\}\}/g) ?? [];
                    const variables = [...new Set(matches.map(m => m.slice(2, -2)))];
                    resolve({ html, design, variables });
                });
            }),
            loadDesign: (design) => {
                if (editorRef.current?.editor) editorRef.current.editor.loadDesign(design as never);
                else pending.current = design;
            },
            loadHtml: (html, ph) => {
                const design = wrapHtmlAsDesign(html, ph || preheaderText);
                if (editorRef.current?.editor) editorRef.current.editor.loadDesign(design as never);
                else pending.current = design;
            },
            isReady: () => ready,
        }), [ready, preheaderText]);

        return (
            <EmailEditor
                ref={editorRef}
                onReady={handleReady}
                options={KHILON_EDITOR_OPTIONS as any}
                style={{ flex: 1 }}
                minHeight={minHeight}
            />
        );
    }
);

export default UnlayerEmailEditor;
