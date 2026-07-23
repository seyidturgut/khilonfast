// Müşteriye sunulacak GA4 Buton Tıklama Ölçümü Raporu → PDF
// Kullanım: node scripts/ga4-buton-rapor.mjs [cikti.pdf]
// HTML→PDF (puppeteer): Türkçe karakterler (ş,ğ,ı,İ) ReportLab fontlarında bozulur.

import puppeteer from 'puppeteer'
import path from 'node:path'

const out = process.argv[2] || path.join(process.env.HOME, 'Desktop', 'KhilonFast_Buton_Tiklama_Olcumu_Raporu.pdf')
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
  .kutu h3, .kutu-bilgi h3 { margin-top:0; }
  ul { margin:6px 0 10px; padding-left:20px; } li { margin-bottom:5px; }
  .ozet { display:flex; gap:10px; margin:14px 0; }
  .kart { flex:1; border:1px solid #e3e6e8; border-left:3px solid #C5D63D; border-radius:5px; padding:10px 12px; }
  .kart .rakam { font-size:17pt; font-weight:700; color:#1a3a52; display:block; }
  .kart .etiket { font-size:8.5pt; color:#6a6a6a; }
  footer { margin-top:28px; padding-top:10px; border-top:1px solid #e3e6e8; color:#8a8a8a; font-size:8.5pt; text-align:center; }
  h2, h3 { break-after: avoid; page-break-after: avoid; }
  /* Kutular bütün kalsın; TABLOLAR bölünebilsin (aksi halde tablo bir sonraki
     sayfaya atlayıp önceki sayfanın altında büyük boşluk bırakıyor). Satırların
     kendisi bölünmez, başlık satırı her sayfada tekrarlanır. */
  .kutu, .kutu-bilgi, .ozet { break-inside: avoid; page-break-inside: avoid; }
  tr { break-inside: avoid; page-break-inside: avoid; }
  thead { display: table-header-group; }
</style></head><body>

<div class="kapak">
  <h1>Buton Tıklama Ölçümü</h1>
  <div style="font-size:12pt;color:#4a4a4a;">Kurulum ve Test Raporu — khilonfast.com</div>
  <div class="alt">Hazırlanma tarihi: ${bugun} &nbsp;•&nbsp; Google Analytics 4 mülkü: KhilonFast</div>
</div>

<h2>Özet</h2>
<p>khilonfast.com üzerinde <strong>buton ve bağlantı tıklamalarının ölçümü</strong> kurulmuş, test edilmiş ve
canlıya alınmıştır. Artık ziyaretçilerin <strong>hangi sayfada, sayfanın neresindeki, hangi butona</strong>
tıkladığı Google Analytics 4 üzerinden raporlanabilmektedir.</p>

<div class="ozet">
  <div class="kart"><span class="rakam">86 / 86</span><span class="etiket">Kapsanan tıklanabilir öğe</span></div>
  <div class="kart"><span class="rakam">5</span><span class="etiket">Kaydedilen bilgi alanı</span></div>
  <div class="kart"><span class="rakam">Canlı</span><span class="etiket">Doğrulanmış durum</span></div>
</div>

<div class="kutu">
  <h3>Bu ölçüm ne kazandırıyor?</h3>
  <ul>
    <li><strong>Hangi çağrı işe yarıyor:</strong> "Hemen Başlayın", "Satın Al", "Teklif Alın" gibi
        butonlardan hangisinin gerçekten tıklandığı görülür; işe yaramayan metinler değiştirilebilir.</li>
    <li><strong>Sayfanın neresi çalışıyor:</strong> Aynı buton sayfanın üstünde mi altında mı daha çok
        tıklanıyor — yerleşim kararları tahminle değil veriyle verilir.</li>
    <li><strong>Menü kullanımı:</strong> Üst menüdeki hangi hizmet ve eğitim başlıklarının ilgi çektiği,
        hangilerinin hiç tıklanmadığı ortaya çıkar.</li>
    <li><strong>Kayıp noktaların tespiti:</strong> Sayfa çok görüntülenip butonu hiç tıklanmıyorsa,
        sorun trafikte değil sayfanın kendisindedir.</li>
  </ul>
</div>

<h2>Kaydedilen Bilgiler</h2>
<p>Her tıklamada GA4'e <code>button_click</code> adında bir etkinlik gönderilir. Etkinlikle birlikte
aşağıdaki bilgiler kaydedilir:</p>

<table>
  <tr><th style="width:24%">Bilgi</th><th style="width:34%">Ne anlama geliyor</th><th>Örnek</th></tr>
  <tr><td><code>button_text</code><br><span class="alt">Buton Metni</span></td>
      <td>Tıklanan butonun üzerindeki yazı</td><td>Satın Al</td></tr>
  <tr><td><code>button_location</code><br><span class="alt">Buton Konumu</span></td>
      <td>Butonun sayfadaki bölümü</td><td>header, footer, menü, ürün başlığı</td></tr>
  <tr><td><code>page_path</code><br><span class="alt">Sayfa Yolu</span></td>
      <td>Tıklamanın yapıldığı sayfa</td><td>/egitimler</td></tr>
  <tr><td><code>button_type</code></td>
      <td>Buton mu, bağlantı mı</td><td>button / link</td></tr>
  <tr><td><code>link_url</code></td>
      <td>Bağlantıysa yönlendirdiği adres</td><td>/hizmetlerimiz/go-to-market-stratejisi</td></tr>
</table>

<h2>Canlı Ortamdan Gerçek Kayıt Örnekleri</h2>
<p>Aşağıdaki satırlar, yayına alındıktan sonra canlı sitede yapılan doğrulama tıklamalarının
GA4'e gönderilen gerçek içerikleridir.</p>

<table>
  <tr><th style="width:32%">Buton Metni</th><th style="width:20%">Konum</th><th>Sayfa</th></tr>
  <tr><td>Satın Al</td><td>Ürün başlığı</td><td>/egitimler/odeme-sistemlerinde-buyume-odakli-pazarlama-egitimi</td></tr>
  <tr><td>Go To Market Stratejisi</td><td>Menü</td><td>/egitimler</td></tr>
  <tr><td>khilonfast <span class="alt">(logo)</span></td><td>Header</td><td>/</td></tr>
  <tr><td>LinkedIn</td><td>Footer</td><td>/</td></tr>
  <tr><td>TR / EN <span class="alt">(dil değiştirme)</span></td><td>Header</td><td>/</td></tr>
</table>

<h2>Kapsam</h2>
<p>Ölçüm, sitenin tamamında tek bir merkezi yapıyla çalışır. Her butona ayrı ayrı kod eklenmemiştir;
bu sayede <strong>ileride eklenecek yeni sayfa ve butonlar da ek bir işlem gerekmeden otomatik olarak
ölçülmeye başlar</strong>.</p>

<h3>Ölçülenler</h3>
<ul>
  <li>Tüm butonlar, bağlantılar ve form gönderme düğmeleri</li>
  <li>Üst menü ve açılır mega menü başlıkları</li>
  <li>Yazısız görsel öğeler: logo, sepet ikonu, mobil menü düğmesi</li>
  <li>Footer bağlantıları ve sosyal medya ikonları</li>
</ul>
<p>Ana sayfada yapılan sayımda, sayfadaki <strong>86 tıklanabilir öğenin 86'sı</strong> kapsanmıştır.</p>

<h3>Ölçülmeyenler ve nedeni</h3>
<table>
  <tr><th style="width:34%">Kapsam dışı</th><th>Neden</th></tr>
  <tr><td>Yönetim paneli (admin)</td>
      <td>Bilinçli tercih. Ekip içi kullanım, ziyaretçi verisini kirletmemesi için hariç tutuldu.</td></tr>
  <tr><td>Video oynatıcı içindeki tıklamalar</td>
      <td>YouTube/Vimeo videoları farklı bir alan adından yüklenir; tarayıcılar güvenlik gereği bu
          içeriğe erişime izin vermez. Video izleme ölçümü ayrı bir çalışma konusudur.</td></tr>
  <tr><td>Açılır pencerelerin arka planı</td>
      <td>"Dışına tıklayınca kapat" işlevi görür, gerçek bir buton değildir; raporda anlamsız
          kayıt oluşturmaması için dışarıda bırakılmıştır.</td></tr>
</table>

<h2>GA4'te Nasıl İncelenir?</h2>
<p>Verinin "hangi butona" kırılımıyla görünebilmesi için GA4 tarafında üç <strong>özel boyut</strong>
tanımlanmıştır (Yönetici → Özel tanımlar):</p>

<table>
  <tr><th style="width:34%">GA4'teki adı</th><th style="width:34%">Etkinlik parametresi</th><th>Kapsam</th></tr>
  <tr><td>Buton Metni</td><td><code>button_text</code></td><td>Etkinlik</td></tr>
  <tr><td>Buton Konumu</td><td><code>button_location</code></td><td>Etkinlik</td></tr>
  <tr><td>Sayfa Yolu</td><td><code>page_path</code></td><td>Etkinlik</td></tr>
</table>

<p>İnceleme yolu: <strong>Raporlar → Etkileşim → Etkinlikler → <code>button_click</code></strong>.
Daha ayrıntılı kırılım için <strong>Keşfet (Explore)</strong> bölümünde boyut olarak "Buton Metni" ve
"Buton Konumu", metrik olarak "Etkinlik sayısı" seçilerek serbest tablo oluşturulabilir.</p>

<div class="kutu-bilgi">
  <h3>Raporlarda veri ne zaman görünür?</h3>
  <p style="margin-bottom:0">Google Analytics 4'te <strong>gerçek zamanlı</strong> rapor özel boyutları göstermez;
  bu kırılımlar yalnızca standart raporlarda yer alır ve Google'ın veri işleme süresi nedeniyle
  <strong>4–48 saat</strong> gecikmeyle görünür. Ayrıca özel boyutlar <strong>tanımlandıkları andan sonraki</strong>
  veriye uygulanır, geçmişe dönük işlemez. Rapor tarih aralığı seçilirken, GA4'ün varsayılan
  "Son 28 gün" seçeneğinin <strong>bugünü kapsamadığı</strong> unutulmamalıdır.</p>
</div>

<h2>Test ve Doğrulama</h2>
<table>
  <tr><th style="width:52%">Yapılan kontrol</th><th>Sonuç</th></tr>
  <tr><td>Yayındaki sürümün doğruluğu</td><td class="ok">Doğrulandı</td></tr>
  <tr><td>Canlı sitede gerçek tıklama denemesi (menü, logo, footer, dil, "Satın Al")</td><td class="ok">Tümü doğru kaydedildi</td></tr>
  <tr><td>Etkinliğin GA4'e ulaşması (gerçek zamanlı rapor)</td><td class="ok">Ulaşıyor — ilk 30 dakikada 15 tıklama</td></tr>
  <tr><td>Özel boyut tanımlarının doğruluğu</td><td class="ok">Üçü de doğru, etkinlik kapsamlı</td></tr>
  <tr><td>Sayfa hatası / yavaşlama kontrolü</td><td class="ok">Hata yok</td></tr>
</table>

<div class="kutu">
  <h3>Not: ölçüm siteyi yavaşlatmaz, hata riski taşımaz</h3>
  <p style="margin-bottom:0">Ölçüm kodu, sitedeki her butona ayrı kod eklemek yerine tek bir merkezi
  dinleyici ile çalışır; bu nedenle sayfa yükleme süresine etkisi yok denecek düzeydedir. Ayrıca kod
  tümüyle korumalı yazılmıştır: analitik tarafında bir aksaklık oluşsa dahi sitenin çalışmasını
  etkilemez, ziyaretçi hiçbir hata görmez.</p>
</div>

<h2>Öneriler</h2>
<ul>
  <li><strong>İlk iki hafta gözlem yapılması:</strong> Yeterli veri biriktikten sonra en çok ve en az
      tıklanan butonlar listelenerek metin ve yerleşim iyileştirmeleri planlanabilir.</li>
  <li><strong>Dönüşümle birleştirme:</strong> Buton tıklamaları, hâlihazırda ölçülen satın alma
      etkinlikleriyle birlikte incelenerek hangi butonun gerçekten satışa dönüştüğü tespit edilebilir.</li>
  <li><strong>Anahtar butonların işaretlenmesi:</strong> Öncelikli görülen butonlar GA4'te
      "anahtar etkinlik" olarak tanımlanarak reklam platformlarında hedef olarak kullanılabilir.</li>
</ul>

<footer>khilonfast.com — Buton Tıklama Ölçümü Kurulum ve Test Raporu • ${bugun}</footer>
</body></html>`

const browser = await puppeteer.launch()
const page = await browser.newPage()
await page.setContent(html, { waitUntil: 'networkidle0' })
await page.pdf({ path: out, format: 'A4', printBackground: true })
await browser.close()
console.log('PDF olusturuldu:', out)
