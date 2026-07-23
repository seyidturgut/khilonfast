// GA4 buton/link tıklama takibi.
//
// TASARIM KURALI: Bu dosyadaki HİÇBİR fonksiyon hata fırlatmaz — bkz.
// ga4Ecommerce.ts'teki aynı kural. Analitik kodu asla siteyi bozmamalı.
//
// YÖNTEM: Tek bir delege edilmiş dinleyici (document üzerinde). Her butona
// ayrı kod eklenmez; sonradan eklenen butonlar da otomatik kapsanır.
//
// GÖNDERİLEN EVENT: `button_click`
//   button_text     — butonun görünen yazısı (ör. "Hemen Başlayın")
//   button_type     — 'button' | 'link'
//   button_location — butonun bulunduğu bölüm (ör. "header", "footer", "hero")
//   link_url        — link ise hedef adres
//   page_path       — tıklamanın yapıldığı sayfa
//
// DİKKAT: GA4'te bu parametrelerin RAPORLARDA görünmesi için Yönetici →
// Özel tanımlar bölümünden "özel boyut" olarak kaydedilmesi gerekir.
// Kaydedilmezse event sayısı görünür ama kırılım (hangi buton) görünmez.

type GtagFn = (...args: unknown[]) => void;

/** GA4 parametre değerleri için üst sınır (GA4 limiti 100 karakter). */
const MAX_LEN = 100;

/** Bu uzunluğa kadar olan metinler zaten bir buton etiketidir, ayıklamaya gerek yok. */
const SHORT_LABEL = 60;

function getGtag(): GtagFn | null {
    try {
        const g = (window as unknown as { gtag?: GtagFn }).gtag;
        return typeof g === 'function' ? g : null;
    } catch {
        return null;
    }
}

function clean(s: string | null | undefined): string {
    if (!s) return '';
    return s.replace(/\s+/g, ' ').trim().slice(0, MAX_LEN);
}

/** Tıklanan öğenin görünen etiketini bulur (yazı → aria-label → title → value). */
function labelOf(el: HTMLElement): string {
    // Kart bağlantıları tüm kart metnini birleştirir ("BaşlıkAçıklama açıklama…").
    // İçinde başlık varsa onu tercih et — rapor okunur olsun.
    try {
        const heading = clean(el.querySelector('h1, h2, h3, h4, h5, h6')?.textContent);
        if (heading) return heading;
    } catch {
        /* sorgu başarısızsa düz metne düş */
    }

    const raw = el.innerText || el.textContent || '';
    const text = clean(raw);

    // Kısa etiketler ("Hemen Başlayın", "Satın Al") olduğu gibi kullanılır.
    if (text && text.length <= SHORT_LABEL) return text;

    if (text) {
        // Uzun metin = kart/mega-menü öğesi: başlık + açıklama birleşmiş
        // ("Go To Market StratejisiPazara giriş ve büyüme planları").
        // Başlığı ayıkla: önce satır sonu, olmazsa İLK METİN DÜĞÜMÜ — bu projede
        // başlık ile açıklama ayrı <span>'lerde ve satır içi olduğu için
        // innerText satır sonu üretmiyor, tek güvenilir ayraç ilk metin düğümü.
        const firstLine = clean(raw.split('\n').map((s) => s.trim()).find(Boolean));
        if (firstLine && firstLine.length <= SHORT_LABEL) return firstLine;

        try {
            const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
            let node = walker.nextNode();
            while (node) {
                const chunk = clean(node.textContent);
                // 2 karakterden kısa parçalar ikon/ayraç artığıdır, atla
                if (chunk.length > 2) return chunk;
                node = walker.nextNode();
            }
        } catch {
            /* TreeWalker yoksa tüm metne düş */
        }
        return text;
    }
    const aria = clean(el.getAttribute('aria-label'));
    if (aria) return aria;
    const title = clean(el.getAttribute('title'));
    if (title) return title;
    const value = clean((el as HTMLInputElement).value);
    if (value) return value;

    // Yazısız görsel bağlantılar (logo, kart görseli) — img alt metni
    try {
        const img = el.querySelector('img');
        const alt = clean(img?.getAttribute('alt'));
        if (alt) return alt;
        // SVG ikonların erişilebilirlik başlığı
        const svgTitle = clean(el.querySelector('svg title')?.textContent);
        if (svgTitle) return svgTitle;
    } catch {
        /* sorgu başarısızsa alt seçeneklere düş */
    }

    // Yazısız ikon butonları (hamburger menü, kapat, sepet…) için sınıf adı ipucu
    const cls = clean(el.className && typeof el.className === 'string' ? el.className : '');
    if (cls) return `(ikon) ${cls}`;

    // Son çare: linkin hedefi — "(isimsiz)" müşteriye hiçbir şey anlatmaz,
    // "(link) /iletisim" en azından hangi öğe olduğunu gösterir.
    const href = clean(el.getAttribute('href'));
    return href ? `(link) ${href}` : '(isimsiz)';
}

/**
 * Butonun sayfadaki yerini bulur. Önce elle işaretlenmiş `data-track-section`,
 * sonra en yakın anlamlı kapsayıcı (header/footer/nav/section id'si).
 */
function locationOf(el: HTMLElement): string {
    try {
        const marked = el.closest('[data-track-section]');
        if (marked) return clean(marked.getAttribute('data-track-section'));

        const container = el.closest('header, footer, nav, section, [id]');
        if (!container) return 'sayfa';

        const tag = container.tagName.toLowerCase();
        if (tag === 'header') return 'header';
        if (tag === 'footer') return 'footer';
        if (tag === 'nav') return 'menu';

        const id = clean(container.getAttribute('id'));
        if (id) return id;

        const cls = clean((container as HTMLElement).className);
        return cls ? cls.split(' ')[0] : tag;
    } catch {
        return 'sayfa';
    }
}

/**
 * Delege edilmiş tıklama dinleyicisini kurar. Dönen fonksiyon dinleyiciyi kaldırır.
 * Admin paneli takip edilmez (iç kullanım, analitiği kirletir).
 */
export function installButtonClickTracking(): () => void {
    if (typeof document === 'undefined') return () => { };

    const onClick = (ev: MouseEvent) => {
        try {
            if (window.location.pathname.startsWith('/admin')) return;

            const target = ev.target as HTMLElement | null;
            if (!target || typeof target.closest !== 'function') return;

            const el = target.closest<HTMLElement>(
                'button, a, [role="button"], input[type="submit"], input[type="button"]'
            );
            if (!el) return;

            // Sadece takip edilmesi istenmeyen öğeler (ör. dil değiştirici sürekli
            // tıklanır) `data-no-track` ile hariç bırakılabilir.
            if (el.closest('[data-no-track]')) return;

            const isLink = el.tagName.toLowerCase() === 'a';
            const href = isLink ? clean(el.getAttribute('href')) : '';

            const payload: Record<string, string> = {
                button_text: labelOf(el),
                button_type: isLink ? 'link' : 'button',
                button_location: locationOf(el),
                page_path: clean(window.location.pathname + window.location.search)
            };
            if (href) payload.link_url = href;

            const gtag = getGtag();
            if (gtag) gtag('event', 'button_click', payload);

            // GTM köprüsü — Meta/LinkedIn tarafında da kullanılabilsin diye
            // (page_view köprüsüyle aynı desen, bkz. App.tsx).
            try {
                const w = window as unknown as { dataLayer?: unknown[] };
                w.dataLayer = w.dataLayer || [];
                w.dataLayer.push({ event: 'spa_button_click', ...payload });
            } catch {
                /* dataLayer yoksa sessizce geç */
            }
        } catch {
            /* analitik asla siteyi bozmamalı */
        }
    };

    // capture: true — alt öğe olayı durdursa bile (stopPropagation) yakalarız.
    document.addEventListener('click', onClick, true);
    return () => document.removeEventListener('click', onClick, true);
}
