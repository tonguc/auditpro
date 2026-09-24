# Sayfa bazında tarayıcı kanıtı — TECH17

Durum: 13 Eylül 2026 parola korumalı yayına alındı; 39/39 QA geçti.
QA: `launch-readiness-2026-09-13T15-53-42-952Z.json`.
13 Eylül 2026 aktarım engeli, kullanıcının sürekli kaynak aktarımı ve deploy yetkilendirmesiyle çözüldü. Paket OVH sunucusuna aktarıldı; imajlar derlendi. Gerçek tarama ve yayın kontrolleri geçti.

Kontrast ve erişilebilir ad ölçümleri artık sayfa bazında tamamlanma durumunu
saklar. Beş ayrı ekran boyutu, değerlendirilebilir düğümler ve eksiksiz kaynak
yükleme olmadan sayfa Pass/Fail diye kesinleştirilmez; N/A ve belirsizlik nedeni
gösterilir. Sağlam sayfalardaki bulgular korunur. Eksik sayfaların öğe gözlemleri
silinmez, doğrulama gerektiği belirtilir.

Toplu puan eksik örneklem nedeniyle kapalı kalır. Sayfa sonuçları sitenin tamamına
genellenmez. Kontrast ve erişilebilir ad dışındaki yöntemler bu değişiklikle
kalibre edilmiş sayılmaz. Bir sayfaya atfedilemeyen WebSocket engeli varsa ilgili
tarayıcı bağlamının bütün sayfaları temkinli biçimde belirsiz kalır.

Regresyonlar: sağlam + kaynakları eksik sayfa, eksik ekran boyutu, tekrarlanan
ekran boyutunun eksik olanın yerine sayılmaması, toplu puanın kapalı tutulması.


Gerçek test: tech17-result.json. 60 HTML sayfası, 5 tarayıcı sayfası, 25 ölçüm; 63.9 saniye (tek koşu). Erişilebilir ad ölçümünde dört sayfa complete/Fail, blog incomplete-resources/N/A olarak korundu. Üç HTTP 500 ve 15 öğe gözlemi korundu. Toplu tarayıcı puanı kaynak eksikliği nedeniyle kapalıdır.

Yayındaki belirsizlik açıklaması, sayfa detayları, kaynak hata listesi, Türkçe/mobil ve apex/www parola/ödeme engelleri geçti. App/worker: 20260913-tech17. Rollback: pilot-images.before-tech17.yml. Yeni kanıtlar için analizi yeniden çalıştırın.
