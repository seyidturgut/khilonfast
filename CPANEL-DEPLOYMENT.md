# cPanel Deployment Talimatları

## 1. Production Build Alma

Projenizi cPanel'e yüklemeden önce production build'ini oluşturmanız gerekiyor:

```bash
npm run build
```

Bu komut `dist/` klasöründe optimize edilmiş dosyalarınızı oluşturacaktır.

## 2. Build Dosyalarını Kontrol Etme

Build tamamlandıktan sonra `dist/` klasörünüzde şu dosyalar olacak:
- `index.html` - Ana HTML dosyası
- `assets/` - CSS, JS ve diğer asset dosyaları

## 3. cPanel'e Yükleme

### Yöntem 1: File Manager (Önerilen)
1. cPanel'e giriş yapın
2. **File Manager**'a tıklayın
3. `public_html` klasörüne gidin
4. `dist/` klasöründeki **TÜM** dosyaları seçin
5. cPanel File Manager'a sürükleyin veya Upload butonunu kullanın
6. Dosyaların tamamını yükleyin

### Yöntem 2: FTP
1. FileZilla veya başka bir FTP client kullanın
2. cPanel FTP bilgilerinizle bağlanın
3. `public_html` klasörüne gidin
4. `dist/` klasöründeki tüm içeriği buraya yükleyin

## 4. .htaccess Dosyası Oluşturma (ÖNEMLİ!)

React SPA (Single Page Application) olduğu için routing'in çalışması için `public_html` klasöründe `.htaccess` dosyası oluşturun:

```apache
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /
  RewriteRule ^index\.html$ - [L]
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule . /index.html [L]
</IfModule>
```

## 5. Önemli Notlar

- ✅ Her kod değişikliğinde `npm run build` komutunu tekrar çalıştırın
- ✅ Sadece `dist/` klasöründeki dosyaları yükleyin, kaynak kodları (`src/`, `node_modules/` vs.) yüklemeyin
- ✅ SSL sertifikası kullanıyorsanız, cPanel'de otomatik yönlendirme aktif edin
- ✅ Cache sorunları için hard refresh yapın (Ctrl + Shift + R)

## 6. Test Etme

1. Sitenizin URL'ini açın (örn: https://khilonfast.com)
2. Tüm bölümlerin düzgün yüklendiğini kontrol edin
3. Form gönderimini test edin
4. Mobil responsive tasarımı kontrol edin

## Hızlı Deployment Script (Opsiyonel)

İsterseniz şu komutu kullanarak build alıp dosyaları hazır hale getirebilirsiniz:

```bash
# Build al
npm run build

# Zip oluştur (FTP yerine)
cd dist
zip -r ../khilonfast-build.zip .
cd ..
```

Sonra `khilonfast-build.zip` dosyasını cPanel'e yükleyip extract edin.
