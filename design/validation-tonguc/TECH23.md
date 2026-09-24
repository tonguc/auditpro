# TECH23 — yapılandırılmış veri ve pilot doğrulaması

13 Eylül 2026 UTC / 14 Eylül Türkiye. Sürüm etiketi 20260913-tech23.

Tek bir bozuk JSON-LD bloğu artık ilgisiz Organization, FAQPage ve LocalBusiness
kontrollerinin tamamını Fail yapmıyor. Her kaynak sayfa için blok numarası,
JSON ayrıştırma durumu ve bildirilen türler saklanıp TR/EN raporda açılabiliyor.
10.000 düğüm sınırında inceleme tamamlandı iddiası üretilmiyor. Tür yokluğu
otomatik hata değil. JSON-LD bağlam çözümleme, zorunlu alanlar, Microdata/RDFa,
anlamsal uygunluk ve zengin sonuç doğrulaması bu paketin kapsamı dışında.

QA: 39/39, launch-readiness-2026-09-13T20-54-05-359Z.json.
Kontrollü klinik/mağaza/yazılım/yayın örneklerinde 16 başlık/meta kararı:
0 yanlış alarm, 0 kaçırılan eksiklik. Bu küçük matris saha doğruluk oranı veya
her kontrolün uçtan uca kalibrasyonu değildir. Schema yanlış alarm ve sınır
regresyonları da geçti; puana uygun kontrol listesi halen sekiz kontroldür.

Gerçek API taraması: 60 HTML sayfa, 297 JSON-LD bloğu; ayrıştırma hatası ve
inceleme sınırı yok. Bu anlamsal doğruluk anlamına gelmez. 69,6 saniye;
24/25 viewport tamamlandı, contact/tablet eksik kaldı. Üç mevcut HTTP 500
kaybolmadı. Kaynak: tech23-result.json.

İzole PostgreSQL entegrasyonu geçti. Sekiz eşzamanlı claim talebinden tek biri
tek işi aldı; güncel heartbeat tekrar sahiplenilmedi; eski heartbeat yeniden
sahiplenildi. Bağlantı havuzu iki: sekiz talep sekiz DB oturumu demek değildir.

Geri yükleme: canlı yedeği ağsız geçici PostgreSQL 17 içine yüklendi. 10 migration,
19 tablo; COPY satırlarının sıralamadan bağımsız SHA-256 karşılaştırmasında 274
satır eşleşti. Geçici konteyner kaldırıldı. Üretim tabloları değiştirilmedi.
İlk denemenin PostgreSQL geçici başlangıç sunucusu yarışı TCP hazır olma kontrolüyle
düzeltildi. Yedek sunucuda backups/povlex-tech23-restore.sql konumunda tutulur;
bu test OVH otomatik yedeğinden komple VPS geri dönüş testi değildir.

AI kapsamı/maliyet sınırları: ../AI-PILOT-SCOPE.md. Ücretli servis açılmadı.
TECH23 parola korumalı yayında. İngilizce schema blok kanıtı, mevcut Türkçe
başlık/öğe detayları, mobil taşma, apex/www doğru-yanlış parola ve ödeme engelleri
geçti. App/worker 20260913-tech23; rollback pilot-images.before-tech23.yml.

İki eşzamanlı beş sayfalık API analizi 73,9 ve 74,6 saniyede HTTP 200 verdi;
her biri 25 viewport tamamladı. tech23-load.json. Bu tek, sınırlı koşu sürdürülen
yük, p95 kapasite, çoklu müşteri izolasyonu veya arıza altında yük testi değildir.
Yeni schema kanıtı için kayıtlı eski analizi yeniden çalıştırmak gerekir.
