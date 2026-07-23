// Müşteriye sunulacak GA4 E-Ticaret Kurulum Raporu → PDF
// Kullanım: node scripts/ga4-rapor.mjs [cikti.pdf]
// HTML→PDF (puppeteer) tercih edildi: Türkçe karakterler (ş,ğ,ı,İ) ReportLab'ın
// varsayılan fontlarında bozulur; puppeteer Unicode'u sorunsuz işler.

import puppeteer from 'puppeteer'
import path from 'node:path'

const out = process.argv[2] || path.join(process.env.HOME, 'Desktop', 'KhilonFast_GA4_ETicaret_Raporu.pdf')
const bugun = new Date().toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })

const html = `<!doctype html><html lang="tr"><head><meta charset="utf-8">
<style>
  @page { size: A4; margin: 20mm 16mm; }
  * { box-sizing: border-box; }
  body { font-family: -apple-system, "Helvetica Neue", Arial, sans-serif; color:#1a1a1a; font-size:10.5pt; line-height:1.6; margin:0; }
  h1 { font-size:23pt; color:#1a3a52; margin:0 0 6px; letter-spacing:-0.5px; }
  h2 { font-size:13.5pt; color:#1a3a52; margin:26px 0 10px; padding-bottom:6px; border-bottom:2px solid #C5D63D; }
  h3 { font-size:11pt; color:#2d5570; margin:16px 0 6px; }
  p { margin:0 0 9px; }
  .kapak { border-left:5px solid #C5D63D; padding:14px 0 14px 16px; margin-bottom:6px; }
  .alt { color:#6a6a6a; font-size:9.5pt; margin-top:4px; }
  table { width:100%; border-collapse:collapse; margin:10px 0 14px; font-size:9.5pt; }
  th { background:#1a3a52; color:#fff; text-align:left; padding:7px 9px; font-weight:600; }
  td { padding:7px 9px; border-bottom:1px solid #e3e6e8; vertical-align:top; }
  tr:nth-child(even) td { background:#fafbfa; }
  code { background:#f1f3f2; padding:1px 5px; border-radius:3px; font-family:"SF Mono",Menlo,monospace; font-size:9pt; color:#1a3a52; }
  .ok { color:#2e7d32; font-weight:700; }
  .kutu { background:#f7faf0; border:1px solid #d8e4a8; border-radius:6px; padding:12px 14px; margin:12px 0; }
  .kutu-bilgi { background:#f4f7fa; border:1px solid #cfdde8; border-radius:6px; padding:12px 14px; margin:12px 0; }
  .kutu h3 { margin-top:0; }
  ul { margin:6px 0 10px; padding-left:20px; } li { margin-bottom:5px; }
  .ozet { display:flex; gap:10px; margin:14px 0; }
  .kart { flex:1; border:1px solid #e3e6e8; border-left:3px solid #C5D63D; border-radius:5px; padding:10px 12px; }
  .kart .rakam { font-size:17pt; font-weight:700; color:#1a3a52; display:block; }
  .kart .etiket { font-size:8.5pt; color:#6a6a6a; }
  footer { margin-top:28px; padding-top:10px; border-top:1px solid #e3e6e8; color:#8a8a8a; font-size:8.5pt; text-align:center; }
  /* Başlık ve tabloların sayfa ortasında kopmasını engelle */
  h2, h3 { break-after: avoid; page-break-after: avoid; }
  table, .kutu, .kutu-bilgi, .ozet { break-inside: avoid; page-break-inside: avoid; }
  tr { break-inside: avoid; page-break-inside: avoid; }
</style></head><body>

<div class="kapak">
  <h1>GA4 E-Ticaret Ölçümü</h1>
  <div style="font-size:12pt;color:#4a4a4a;">Kurulum ve Test Raporu — khilonfast.com</div>
  <div class="alt">Hazırlanma tarihi: ${bugun} &nbsp;•&nbsp; Google Analytics 4 mülkü: KhilonFast</div>
</div>

<h2>Özet</h2>
<p>khilonfast.com için Google Analytics 4 üzerinde <strong>e-ticaret ölçümü</strong> kurulmuş, test edilmiş ve
canlıya alınmıştır. Bu kurulumla artık ziyaretçilerin ürün inceleme aşamasından satın almaya kadar geçtiği
tüm adımlar ve <strong>elde edilen gelir</strong> ölçülebilmektedir.</p>

<div class="ozet">
  <div class="kart"><span class="rakam">6</span><span class="etiket">Ölçülen e-ticaret adımı</span></div>
  <div class="kart"><span class="rakam">5</span><span class="etiket">Kapsanan ödeme yöntemi</span></div>
  <div class="kart"><span class="rakam">100%</span><span class="etiket">Test başarı oranı</span></div>
</div>

<div class="kutu">
  <h3>Bu kurulum ne kazandırıyor?</h3>
  <ul>
    <li><strong>Gerçek gelir takibi:</strong> Hangi üründen ne kadar ciro elde edildiği GA4'te görünür.</li>
    <li><strong>Reklam performansı (ROAS):</strong> Meta/Instagram reklamlarından gelen ziyaretçilerin
        yaptığı satışlar doğru kaynağa atfedilir — hangi reklamın para kazandırdığı ölçülebilir.</li>
    <li><strong>Satış hunisi analizi:</strong> Ziyaretçilerin hangi adımda vazgeçtiği görülür
        (ürünü inceledi ama sepete atmadı / sepete attı ama ödemeye geçmedi gibi).</li>
  </ul>
</div>

<h2>GA4'te Oluşan Etkinlik (Event) Adları</h2>
<p>Aşağıdaki etkinlikler Google'ın standart e-ticaret şemasına birebir uygundur; GA4'ün hazır
raporlarında (Para Kazanma, Satın Alma Yolculuğu) otomatik olarak kullanılır.</p>

<table>
  <tr><th style="width:26%">Etkinlik Adı</th><th style="width:37%">Ne Zaman Oluşur</th><th>Ölçtüğü Şey</th></tr>
  <tr><td><code>view_item</code></td><td>Ziyaretçi bir hizmet, eğitim veya ürün sayfasını açtığında</td><td>Ürün ilgisi</td></tr>
  <tr><td><code>add_to_cart</code></td><td>Ürün sepete eklendiğinde</td><td>Satın alma niyeti</td></tr>
  <tr><td><code>remove_from_cart</code></td><td>Ürün sepetten çıkarıldığında</td><td>Vazgeçme sinyali</td></tr>
  <tr><td><code>view_cart</code></td><td>Sepet görüntülendiğinde</td><td>Sepet etkileşimi</td></tr>
  <tr><td><code>begin_checkout</code></td><td>Ödeme adımına geçildiğinde</td><td>Huninin son aşaması</td></tr>
  <tr><td><code>purchase</code></td><td>Ödeme tamamlandığında</td><td><strong>Gelir, ürün ve işlem bilgisi</strong></td></tr>
</table>

<p>Her etkinlik ürün bilgisini de taşır: ürün kodu, ürün adı, kategori, birim fiyat ve adet.
<code>purchase</code> ayrıca sipariş numarası, toplam tutar, KDV, para birimi ve varsa kupon kodunu içerir.</p>

<div class="kutu-bilgi">
  <h3>Not: <code>purchase</code> neden sunucu tarafından gönderiliyor?</h3>
  <p style="margin-bottom:0">Satışların bir kısmı ziyaretçi siteden ayrıldıktan <em>sonra</em> kesinleşiyor —
  örneğin <strong>havale ödemeleri yönetici onayıyla günler sonra</strong> tamamlanıyor, <strong>abonelik
  yenilemeleri</strong> ise arka planda otomatik gerçekleşiyor. Bu satışlar tarayıcı üzerinden ölçülseydi
  GA4'e <strong>hiç ulaşmayacaktı</strong>. Bu nedenle satın alma bilgisi doğrudan sunucudan, siparişin
  ödendiği kesinleştiği anda gönderilmektedir. Bu yöntem ayrıca reklam engelleyicilerden etkilenmez ve
  sayfa yenilendiğinde aynı satışın iki kez sayılmasını önler.</p>
</div>

<h2>Kapsanan Ödeme Yöntemleri</h2>
<p>Satın alma ölçümü, sitedeki <strong>tüm</strong> ödeme yollarını kapsayacak şekilde kurulmuştur:</p>
<table>
  <tr><th style="width:45%">Ödeme Yöntemi</th><th>Ölçüm Durumu</th></tr>
  <tr><td>Kredi / banka kartı</td><td class="ok">Ölçülüyor</td></tr>
  <tr><td>3D Secure ve Anında Havale</td><td class="ok">Ölçülüyor</td></tr>
  <tr><td>Kupon ile ücretsiz sipariş</td><td class="ok">Ölçülüyor</td></tr>
  <tr><td>Banka havalesi (yönetici onaylı)</td><td class="ok">Ölçülüyor</td></tr>
  <tr><td>Abonelik yenilemesi (otomatik)</td><td class="ok">Ölçülüyor</td></tr>
</table>

<h2>Test Sonuçları</h2>
<p>Kurulum canlıya alınmadan önce uçtan uca test edilmiştir. <strong>Tüm testler başarıyla geçmiştir.</strong></p>

<table>
  <tr><th style="width:6%">#</th><th style="width:42%">Test</th><th style="width:32%">Beklenen</th><th>Sonuç</th></tr>
  <tr><td>1</td><td>Veri yapısının Google şemasına uygunluğu<br><span class="alt">Google'ın resmî doğrulama servisi ile</span></td><td>Hata olmaması</td><td class="ok">Başarılı — 0 hata</td></tr>
  <tr><td>2</td><td>Gerçek bir siparişin GA4'e gönderilmesi</td><td>Başarılı iletim</td><td class="ok">Başarılı</td></tr>
  <tr><td>3</td><td><strong>Çift sayım koruması</strong><br><span class="alt">Aynı sipariş ikinci kez gönderilmeye çalışıldı</span></td><td>Tekrar gönderilmemesi</td><td class="ok">Başarılı — engellendi</td></tr>
  <tr><td>4</td><td>GA4 arayüzünde görünürlük</td><td>Etkinliğin raporlara düşmesi</td><td class="ok">Başarılı — görüntülendi</td></tr>
  <tr><td>5</td><td>Dönüşüm olarak sayılması</td><td>"Önemli faaliyet" kaydı</td><td class="ok">Başarılı</td></tr>
  <tr><td>6</td><td>Ürün bilgisi doğruluğu<br><span class="alt">Ad, kategori, tutar, para birimi</span></td><td>Verilerin eksiksiz olması</td><td class="ok">Başarılı</td></tr>
  <tr><td>7</td><td>Reklam kaynağı takibi (ROAS için)</td><td>Ziyaretçi kimliğinin okunması</td><td class="ok">Başarılı</td></tr>
</table>

<div class="kutu">
  <h3>Test detayı</h3>
  <p style="margin-bottom:0">Gerçek bir eğitim ürünü siparişi (5,00 ₺) test amacıyla GA4'e gönderilmiş;
  ürün adı, kategori, tutar ve para birimi bilgileriyle birlikte doğru şekilde kaydedildiği,
  ardından <strong>dönüşüm (satın alma) olarak sayıldığı</strong> GA4 arayüzünden teyit edilmiştir.</p>
</div>

<h2>Raporları Nerede Göreceksiniz?</h2>
<table>
  <tr><th style="width:38%">Rapor</th><th style="width:30%">GA4'teki Yeri</th><th>Ne Zaman Görünür</th></tr>
  <tr><td>Anlık satış takibi</td><td>Raporlar → Gerçek Zamanlı</td><td>Anında (son 30 dakika)</td></tr>
  <tr><td>Ciro, ürün ve işlem detayı</td><td>Raporlar → Para Kazanma → E-ticaret satın alma işlemleri</td><td>4–48 saat içinde</td></tr>
  <tr><td>Satış hunisi (nerede kaybediyoruz?)</td><td>Raporlar → Para Kazanma → Satın alma yolculuğu</td><td>4–48 saat içinde</td></tr>
  <tr><td>Reklam performansı (ROAS)</td><td>Raporlar → Edinme → Trafik edinme</td><td>4–48 saat içinde</td></tr>
</table>

<div class="kutu-bilgi">
  <p style="margin-bottom:0"><strong>Önemli:</strong> Google Analytics standart raporları veriyi
  <strong>4–48 saat</strong> gecikmeyle işler; bir satış hemen raporlarda görünmeyebilir, bu normaldir.
  Ayrıca GA4'ün "Son 28 gün" varsayılan tarih aralığı <strong>bugünü kapsamaz</strong> — güncel veriye
  bakarken tarih aralığını bugünü içerecek şekilde ayarlamanız gerekir.</p>
</div>

<h2>Sonuç</h2>
<p>GA4 e-ticaret ölçümü kurulmuş, tüm ödeme yöntemlerini kapsayacak şekilde yapılandırılmış, test edilmiş
ve canlı ortamda devreye alınmıştır. Bundan sonraki tüm satışlar otomatik olarak ölçülecek; ürün bazında
ciro, satış hunisi performansı ve reklam yatırım getirisi Google Analytics üzerinden takip edilebilecektir.</p>

<footer>khilonfast.com — GA4 E-Ticaret Kurulum ve Test Raporu — ${bugun}</footer>
</body></html>`

const browser = await puppeteer.launch({ headless: 'new' })
const page = await browser.newPage()
await page.setContent(html, { waitUntil: 'networkidle0' })
await page.pdf({
  path: out,
  format: 'A4',
  printBackground: true,
  displayHeaderFooter: true,
  headerTemplate: '<span></span>',
  footerTemplate: '<div style="width:100%;font-size:8pt;color:#9a9a9a;text-align:center;padding:0 16mm;">'
    + '<span class="pageNumber"></span> / <span class="totalPages"></span></div>',
  margin: { top: '20mm', bottom: '18mm', left: '16mm', right: '16mm' }
})
await browser.close()
console.log('PDF olusturuldu:', out)
