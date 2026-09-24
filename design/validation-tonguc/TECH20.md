# Canonical hedef ve yönlendirme kanıtları — TECH20

Tamamlanan kaynak isteklerinde HTTP yönlendirme adımları URL/durum/hedef olarak
saklanır ve canonical detaylarında gösterilir. Önceden taranmış son URL'den
alınan önbellek kanıtı için gözlemlenmemiş yönlendirme geçmişi uydurulmaz.
İstek tamamlanamazsa tam zincir kaydı garanti edilmez; mevcut unavailable
koruması sürer. HTTP yönlendirmesi ile hedefin başka canonical bildirmesi ayrıdır.

Hedefin kendi canonical URL'si, bozuk/çelişkili bildirimi ve doğrudan kaynak
sayfaya geri işaret etmesi yapılandırılmış kanıta dönüştürüldü. Yalnızca bir
hedef düzeyi incelenir; keyfi uzun canonical grafiği/döngüsü çözülmez. Farklı
alan veya farklı URL tek başına hata sayılmaz. t5 puan dışı kalır; içerik
eşdeğerliği ve Google'ın seçtiği canonical bu sürümle doğrulanmış değildir.

Aynı erişilemeyen hedef için atılan hata tarama süresince önbelleğe alınır;
sonraki sayfalar yeniden istek atıp bütçeyi tüketmez veya budget diye yanlış
sınıflanmaz. Başarılı ve status=0 sonuçlar önceki gibi önbelleğe alınır.

Regresyonlar: 301 geçmişi, kaynak sayfaya dönen canonical, çelişkili hedef
canonical, ortak erişilemeyen hedefin tek istekte tutulması; önceki bütçe,
HTTP hata, PDF, öz canonical ve noindex ayrımları korunur.

QA: 39/39 geçti; launch-readiness-2026-09-13T19-40-19-555Z.json. Yayın doğrulaması geçti.

13 Eylül 2026 TECH20 parola korumalı yayında. Gerçek test tech20-result.json: 60 sayfa, 60 canonical kaydı; 3 hedefte yönlendirme ve 3 kayıtlı HTTP geçmişi. Önceki üç HTTP 500 korundu. 66.9 saniye tek koşudur, yük testi değildir.
Hosted 301 adım detayı, canonical 404, robots/noindex kanıtları, Türkçe/mobil ve apex/www parola/ödeme engelleri geçti. App/worker 20260913-tech20; geri dönüş pilot-images.before-tech20.yml. Yeni kanıtlar için analiz yeniden çalıştırılmalı.
