# khilonfast - Modern React Website

Modern, premium tasarımlı kurumsal web sitesi. React + TypeScript + Vite ile geliştirilmiştir.

## 🚀 Özellikler

- ⚡ **Vite** - Hızlı development ve build
- ⚛️ **React 18** + **TypeScript** - Modern ve güvenli kod
- 🎨 **Modern Tasarım** - Glassmorphism, gradientler, animasyonlar
- 📱 **Responsive** - Tüm cihazlarda mükemmel görünüm
- 🌙 **Dark Theme** - Premium karanlık tema
- ✨ **Animations** - Smooth geçişler ve hover efektleri

## 📦 Kurulum

```bash
# Bağımlılıkları yükle
npm install

# Development server başlat
npm run dev

# Production build al
npm run build

# Build'i önizle
npm run preview
```

## 🌐 Development

Development server otomatik olarak http://localhost:5173 adresinde açılacaktır.

## 📁 Proje Yapısı

```
web2026/
├── src/
│   ├── components/        # React componentleri
│   │   ├── Hero.tsx      # Ana başlık bölümü
│   │   ├── Services.tsx  # Hizmetler
│   │   ├── Features.tsx  # Özellikler
│   │   └── Contact.tsx   # İletişim formu
│   ├── App.tsx           # Ana uygulama
│   ├── main.tsx          # Entry point
│   └── index.css         # Global CSS
├── public/               # Statik dosyalar
├── backup/              # Eski HTML dosyaları
└── dist/                # Build çıktısı (oluşturulacak)
```

## 🎨 Tasarım Sistemi

- **Renkler**: Gradient primary (indigo-pink), accent (amber-red)
- **Tipografi**: Inter font family
- **Animasyonlar**: Fade in, float, pulse
- **Efektler**: Glassmorphism, backdrop blur

## 🚢 Deployment (cPanel)

Detaylı talimatlar için [CPANEL-DEPLOYMENT.md](./CPANEL-DEPLOYMENT.md) dosyasına bakın.

Kısaca:
1. `npm run build` - Build al
2. `dist/` klasöründeki dosyaları cPanel `public_html` klasörüne yükle
3. `.htaccess` dosyasını oluştur (routing için)

## 🛠️ Teknolojiler

- React 18.3.1
- TypeScript 5.6.2
- Vite 6.0.3
- Vanilla CSS (Modern CSS özellikleri)

## 📞 İletişim

Website: https://khilonfast.com
Email: info@khilonfast.com

---

© 2026 khilonfast. Tüm hakları saklıdır.
