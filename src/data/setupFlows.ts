export interface SetupStep {
  title: string
  description: string
}

export interface SetupPath {
  id: string
  label: string
  steps: SetupStep[]
  completionTitle: string
  completionDescription: string
}

export interface SetupFlow {
  path: string
  title: string
  subtitle: string
  purpose: string
  decisionQuestion: string
  videoUrl: string
  paths: SetupPath[]
}

export const setupFlows: SetupFlow[] = [
  {
    path: '/google-analytics-kurulum-akisi',
    title: 'Google Analytics Kurulum Akışı',
    subtitle:
      'Ziyaretçi verilerinin, hedef kitle davranışlarının ve dönüşüm metriklerinin takip edilmesi için Google Analytics entegrasyonu gereklidir.',
    purpose:
      'Web sitenizdeki kullanıcı davranışlarını ölçmek, dönüşümleri takip etmek ve pazarlama performansını veriye dayalı yönetmek için Google Analytics kurulumu yapılır.',
    decisionQuestion: 'Google Analytics hesabınız var mı?',
    videoUrl: 'https://player.vimeo.com/video/1128164075',
    paths: [
      {
        id: 'yes',
        label: 'EVET, HESABIM VAR',
        steps: [
          {
            title: 'Google Analytics hesabınıza giriş yapın',
            description: 'Hesap veya property seviyesinde Erişim Yönetimi alanına geçin.'
          },
          {
            title: 'Kullanıcı Ekle adımını açın',
            description: 'KhilonFast ekibinin e-posta adresini kullanıcı olarak ekleyin.'
          },
          {
            title: 'Gerekli erişim izinlerini verin',
            description: 'Analiz ve raporlama için gereken görüntüleme/yönetim yetkilerini tanımlayın.'
          }
        ],
        completionTitle: 'Kurulum Tamamlandı',
        completionDescription: 'KhilonFast, Google Analytics verilerinizi analiz etmeye başlayabilir.'
      },
      {
        id: 'no',
        label: 'HAYIR, HESABIM YOK',
        steps: [
          {
            title: 'KhilonFast sizin adınıza GA4 yapısını oluşturur',
            description: 'Uygun paket kapsamında Google Analytics hesabı ve property kurulumu yapılır.'
          },
          {
            title: 'GA4 Measurement ID paylaşılır',
            description: 'Kurulum için gerekli izleme kimliği tarafınıza iletilir.'
          },
          {
            title: 'GTM entegrasyonu tamamlanır',
            description: 'GA4 config tag Google Tag Manager üzerinden eklenerek veri akışı başlatılır.'
          }
        ],
        completionTitle: 'Kurulum Tamamlandı',
        completionDescription: 'Google Analytics altyapınız aktif hale gelir ve ölçümleme başlar.'
      }
    ]
  },
  {
    path: '/google-tag-manager-kurulum-akisi',
    title: 'Google Tag Manager Kurulum Akışı',
    subtitle:
      'Search Ads, Analytics ve Search Console gibi tüm pazarlama operasyonlarının sağlıklı ölçümlenmesi için GTM entegrasyonu zorunludur.',
    purpose:
      'Etiket yönetimini merkezi bir yapıdan yürütmek, dönüşüm takibi ve veri doğruluğunu sağlamak için Google Tag Manager kurulumu yapılır.',
    decisionQuestion: 'Google Tag Manager hesabınız var mı?',
    videoUrl: 'https://player.vimeo.com/video/1128163251',
    paths: [
      {
        id: 'yes',
        label: 'EVET, HESABIM VAR',
        steps: [
          {
            title: 'Google Tag Manager hesabınıza giriş yapın',
            description: 'Doğru container ve yönetici panelini açın.'
          },
          {
            title: 'Kullanıcı Ekle menüsüne gidin',
            description: 'analytics@khilon.com adresini yeni kullanıcı olarak ekleyin.'
          },
          {
            title: 'Yayın ve yönetim yetkilerini tanımlayın',
            description: 'Etiket kurulumlarının hızlı ve doğru ilerlemesi için gerekli izinleri verin.'
          }
        ],
        completionTitle: 'Kurulum Tamamlandı',
        completionDescription: 'KhilonFast, GTM üzerinden ölçüm ve etiket süreçlerini yönetebilir.'
      },
      {
        id: 'no',
        label: 'HAYIR, HESABIM YOK',
        steps: [
          {
            title: 'KhilonFast sizin adınıza GTM hesabı açar',
            description: 'Markanıza özel container yapısı oluşturulur.'
          },
          {
            title: 'Container kodları paylaşılır',
            description: 'Web sitenize yerleştirmeniz için head/body kod blokları iletilir.'
          },
          {
            title: 'İlk etiketler aktif edilir',
            description: 'GA4, reklam dönüşümleri ve temel izleme etiketleri kurulup test edilir.'
          }
        ],
        completionTitle: 'Kurulum Tamamlandı',
        completionDescription: 'GTM altyapınız aktif olur ve tüm pazarlama ölçümleri hazır hale gelir.'
      }
    ]
  },
  {
    path: '/linkedin-reklamlari-kurulum-akisi-khilonfast',
    title: 'LinkedIn Reklamları Kurulum Akışı',
    subtitle:
      'LinkedIn üzerinde B2B hedef kitlelere ulaşmak, lead üretimini başlatmak ve kampanyaları doğru yönetmek için hesap kurulumunun eksiksiz olması gerekir.',
    purpose:
      'LinkedIn Campaign Manager ve varsa Business Manager yapınızı KhilonFast erişimiyle doğru biçimde yapılandırmak için bu akış izlenir.',
    decisionQuestion: 'Mevcut LinkedIn altyapınız hangisine daha uygun?',
    videoUrl: 'https://player.vimeo.com/video/1128165568',
    paths: [
      {
        id: 'scenario-1',
        label: 'YENİ BAŞLANGIÇ',
        steps: [
          {
            title: 'LinkedIn şirket sayfası kontrol edilir',
            description: 'Markanız için güncel bir şirket sayfası oluşturulur veya doğrulanır.'
          },
          {
            title: 'Campaign Manager hesabı açılır',
            description: 'Reklam hesabı oluşturularak temel faturalama ayarları tamamlanır.'
          },
          {
            title: 'KhilonFast erişimi tanımlanır',
            description: 'Reklam yönetimi için gerekli ajans erişim yetkileri verilir.'
          }
        ],
        completionTitle: 'Kurulum Tamamlandı',
        completionDescription: 'LinkedIn reklamlarınızı yayınlamaya hazır yapı kurulmuş olur.'
      },
      {
        id: 'scenario-2',
        label: 'HESAP VAR, BM YOK',
        steps: [
          {
            title: 'Mevcut reklam hesabı doğrulanır',
            description: 'Campaign Manager erişimleri ve yönetici rolleri kontrol edilir.'
          },
          {
            title: 'Gerekirse Business Manager yapısı hazırlanır',
            description: 'Uzun vadeli ve güvenli ajans yönetimi için Business Manager kurgulanır.'
          },
          {
            title: 'KhilonFast Agency erişimi eklenir',
            description: 'Ajans ID bilgisiyle erişim daveti gönderilir ve yetkilendirme tamamlanır.'
          }
        ],
        completionTitle: 'Kurulum Tamamlandı',
        completionDescription: 'LinkedIn reklam yönetimi KhilonFast tarafından devralınabilir duruma gelir.'
      },
      {
        id: 'scenario-3',
        label: 'FULL BUSINESS MANAGER',
        steps: [
          {
            title: 'Business Manager paneline giriş yapın',
            description: 'LinkedIn Business Manager altında bağlı varlıkları açın.'
          },
          {
            title: 'KhilonFast Agency ID ekleyin',
            description: 'Business Manager üzerinden ajans erişimini güvenli şekilde tanımlayın.'
          },
          {
            title: 'Davet onay ve erişim aktivasyonunu tamamlayın',
            description: 'Davet onaylandıktan sonra kampanya yönetimi için tüm erişimler aktif olur.'
          }
        ],
        completionTitle: 'Kurulum Tamamlandı',
        completionDescription: 'KhilonFast, Business Manager üzerinden hesaplarınızı yönetmeye başlar.'
      }
    ]
  },
  {
    path: '/meta-facebook-instagram-reklamlari-kurulum-akisi',
    title: 'Meta (Facebook & Instagram) Reklamları Kurulum Akışı',
    subtitle:
      'Meta platformlarında reklam yayını, dönüşüm takibi ve hedefleme için Business Manager, reklam hesabı ve Pixel kurulumunun birlikte tamamlanması gerekir.',
    purpose:
      'Meta Business Manager, reklam hesabı, sayfa erişimi ve Pixel yapılandırmasını KhilonFast yönetimine uygun hale getirmek için bu akış kullanılır.',
    decisionQuestion: 'Business Manager ve reklam hesabınız hazır mı?',
    videoUrl: 'https://player.vimeo.com/video/1128166155',
    paths: [
      {
        id: 'yes',
        label: 'EVET, HAZIR',
        steps: [
          {
            title: 'Business Manager üzerinden erişim verin',
            description: 'İş Ayarları bölümünden KhilonFast Business ID bilgisini ekleyin.'
          },
          {
            title: 'Reklam hesabı ve sayfa izinlerini açın',
            description: 'Reklam yayınlama ve optimizasyon için gerekli rol izinlerini tanımlayın.'
          },
          {
            title: 'Meta Pixel erişimini tamamlayın',
            description: 'Dönüşüm ölçümü için mevcut Pixel varlığına erişimi aktif edin.'
          }
        ],
        completionTitle: 'Kurulum Tamamlandı',
        completionDescription: 'Meta reklam altyapınız KhilonFast yönetimine hazırdır.'
      },
      {
        id: 'no',
        label: 'HAYIR, HAZIR DEĞİL',
        steps: [
          {
            title: 'Business Manager oluşturulur',
            description: 'KhilonFast, markanıza uygun temel Meta işletme yapısını oluşturur.'
          },
          {
            title: 'Reklam hesabı ve sayfa bağlantısı kurulur',
            description: 'Reklam yayını için gerekli temel varlıklar birbiriyle ilişkilendirilir.'
          },
          {
            title: 'Meta Pixel kurulumu yapılır',
            description: 'Web siteniz için dönüşüm takibi sağlayacak Pixel oluşturulur ve aktif edilir.'
          }
        ],
        completionTitle: 'Kurulum Tamamlandı',
        completionDescription: 'Meta reklam operasyonları için gerekli tüm temel yapı hazırlanmış olur.'
      }
    ]
  },
  {
    path: '/search-ads-google-reklamlari-kurulum-akisi',
    title: 'Search Ads (Google Reklamları) Kurulum Akışı',
    subtitle:
      'KhilonFast reklam yönetimini başlatabilmek için Google Ads hesabınızın erişim yetkisi doğru şekilde tanımlanmalıdır.',
    purpose:
      'Google Ads üzerinde kampanya yönetimi ve dönüşüm optimizasyonu süreçlerini başlatmak için erişim ve izleme kurulumu yapılır.',
    decisionQuestion: 'Google Ads hesabınız var mı?',
    videoUrl: 'https://player.vimeo.com/video/1128161792',
    paths: [
      {
        id: 'yes',
        label: 'EVET, HESABIM VAR',
        steps: [
          {
            title: 'KhilonFast erişim talebi gönderir',
            description: 'Google Ads hesabınıza manager erişim daveti iletilir.'
          },
          {
            title: 'Erişim davetini onaylayın',
            description: 'Admin hesabınızla daveti kabul ederek yönetim yetkisini açın.'
          },
          {
            title: 'Dönüşüm ölçümü kontrol edilir',
            description: 'Kampanya performansının doğru ölçülmesi için temel conversion ayarları doğrulanır.'
          }
        ],
        completionTitle: 'Kurulum Tamamlandı',
        completionDescription: 'KhilonFast, Search Ads kampanyalarınızı yönetmeye hazırdır.'
      },
      {
        id: 'no',
        label: 'HAYIR, HESABIM YOK',
        steps: [
          {
            title: 'Yeni Google Ads hesabı oluşturulur',
            description: 'Marka bilgilerinize göre uygun hesap ve faturalama kurgusu hazırlanır.'
          },
          {
            title: 'İlk kampanya yapısı hazırlanır',
            description: 'Hedefleme ve anahtar kelime altyapısı başlangıç düzeyinde kurulur.'
          },
          {
            title: 'GTM ile dönüşüm takibi bağlanır',
            description: 'Reklam performans ölçümü için Google Tag Manager entegrasyonu aktif edilir.'
          }
        ],
        completionTitle: 'Kurulum Tamamlandı',
        completionDescription: 'Search Ads operasyonu için hesap ve ölçümleme altyapısı hazırdır.'
      }
    ]
  },
  {
    path: '/tiktok-kurulum-akisi',
    title: 'TikTok Kurulum Akışı',
    subtitle:
      'TikTok platformunda reklam yayını, dönüşüm takibi ve ajans yönetimi için Business Center, Ads Manager ve Pixel kurulumunun tamamlanması gerekir.',
    purpose:
      'Mevcut TikTok altyapınıza göre doğru senaryoyu seçerek KhilonFast erişimi ve reklam ölçümleme yapısını hızlıca aktif etmek amaçlanır.',
    decisionQuestion: 'Mevcut TikTok altyapınız hangisi?',
    videoUrl: 'https://player.vimeo.com/video/1128166698',
    paths: [
      {
        id: 'scenario-1',
        label: 'BC + ADS VAR',
        steps: [
          {
            title: 'Business Center hesabınıza giriş yapın',
            description: 'Admin yetkisiyle mevcut Business Center panelini açın.'
          },
          {
            title: 'KhilonFast agency erişimini tanımlayın',
            description: 'Agency ID üzerinden hesap erişim davetini gönderin.'
          },
          {
            title: 'Pixel erişimini doğrulayın',
            description: 'Dönüşüm takibi için Pixel varlığının yönetim izinlerini tamamlayın.'
          }
        ],
        completionTitle: 'Kurulum Tamamlandı',
        completionDescription: 'TikTok reklam altyapınız KhilonFast yönetimine hazırdır.'
      },
      {
        id: 'scenario-2',
        label: 'SADECE ADS VAR',
        steps: [
          {
            title: 'Ads Manager hesabına giriş yapın',
            description: 'Mevcut reklam hesabınızın yönetici erişimini doğrulayın.'
          },
          {
            title: 'Business Center yapısı eklenir',
            description: 'Kurumsal reklam yönetimi için Business Center kurgusu tamamlanır.'
          },
          {
            title: 'Ajans erişimi ve bağlantılar aktif edilir',
            description: 'KhilonFast erişimi tanımlanır, hesaplar birbiriyle ilişkilendirilir.'
          }
        ],
        completionTitle: 'Kurulum Tamamlandı',
        completionDescription: 'TikTok reklam operasyonu için kurumsal yönetim yapısı tamamlanır.'
      },
      {
        id: 'scenario-3',
        label: 'HİÇBİRİ YOK',
        steps: [
          {
            title: 'KhilonFast Business Center oluşturur',
            description: 'Markanız için sıfırdan profesyonel Business Center hesabı açılır.'
          },
          {
            title: 'Yeni Ads Manager hesabı açılır',
            description: 'Reklam yayını için gerekli hesap ve temel ayarlar yapılandırılır.'
          },
          {
            title: 'TikTok Pixel oluşturulup bağlanır',
            description: 'Web sitenizle dönüşüm takibi için Pixel kurulumu ve ilk testler tamamlanır.'
          }
        ],
        completionTitle: 'Kurulum Tamamlandı',
        completionDescription: 'TikTok reklamları için tüm teknik altyapı aktif hale gelir.'
      }
    ]
  }
]
