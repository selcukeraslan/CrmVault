CRM EKİBİ İÇİN ORTAK VAULT

AÇILIŞ
index.html dosyasını güncel bir tarayıcıda açın.
Kurulum, sunucu, build adımı veya internet bağlantısı gerekmez.

PowerShell:
  Start-Process (Join-Path $env:USERPROFILE 'vault-ekip-sunumu\index.html')

Klasörü taşırken index.html, styles.css, app.js ve assets klasörünü
birlikte taşıyın. İki gerçek ekran görüntüsü assets içindedir.

DOSYAYA GÖMÜLÜ SUNUM
Varsayılan içerik, vault-sunumu-2026-10-27 (1).json yedeğinden alınmıştır.
11 slaytın metinleri, notları, sırası ve 5 ek görselin dosyaları ile
yerleşimleri index.html içine gömülüdür. Ziyaretçinin yedek yüklemesi
veya önceden tarayıcıda kayıt oluşturması gerekmez.

Statik yayın için index.html, app.js, styles.css ve assets klasörünü
birlikte yükleyin. JSON yedeğini ayrıca sunucuya koymak gerekmez.
Sunum hiçbir yükleme işlemini kendisi yapmaz.

Bu sürümün yerel düzenlemeleri ayrı bir kayıt alanında tutulur.
Önceki sürümün tarayıcı kayıtları silinmez ve yeni içeriği değiştirmez.
Düzenle düğmesi ziyaretçinin yalnızca kendi tarayıcısını değiştirir;
yayımlanan dosyaları veya diğer kişilerin gördüğü sunumu değiştirmez.

AKIŞ
1. Prompt Engineering
2. Model İçin Önemli Olan Tek Şey: Context
3. Compaction
4. Compact Sonrası Neler Sağ Çıktı
5. Günümüz Problemi
6. Çözüm; İkinci Beyin
7. Nerede İşe Yarıyor
8. Vault' un Avantajı
9. Ben nasıl kullanıyorum?
10. Çözüm nasıl kaydediliyor?
11. Ekipte nasıl kullanırız?

İçerik, kullanıcının CRM ekibine yazdığı maili ve yedekte yaptığı
düzenlemeleri içerir. Yedekteki metinler ve görsel yerleşimleri korunmuştur.
Önceki sürümdeki CrmWeb menü örneği kaldırılmıştır.

KULLANIM
- Sağ / sol ok veya Page Down / Page Up: bölüm değiştir.
- Home / End: ilk / son bölüm.
- Bölümler: istediğin bölüme doğrudan geç.
- Tab / Shift+Tab: kontroller arasında gezin.
- Enter / Space: odaktaki düğmeyi etkinleştir.
- Notlar: kısa bölüm notlarını aç. Esc: paneli kapat.
- Büyüt: gerçek ekran görüntüsünü aç. 2×: yakınlaştır.
- Yakınlaştırılmış görsel, kaydırılarak incelenebilir.
- Sağ üstteki simge: tam ekrana gir / çık.

DÜZENLEME
- Sol üstteki Düzenle düğmesi düzenleme panelini açar.
- Başlığı, üstteki bölüm adını ve maddeleri panelden değiştir.
- Maddeler alanında her satır bir madde olur. Enter veya + Satır ile ekle.
- Slayttaki kesik çizgili bir metne tıklamak, ilgili düzenleme alanını açar.
- Diyagram ve diğer yazılar bölümünden düğüm, seçenek ve görsel yazılarını
  değiştir. Etkileşimli örnekte önce değiştireceğin seçeneği seç; her
  seçeneğin yazıları ayrı saklanır.
- Bölüm notları alanındaki her satır da ayrı bir madde olur.
- + Yeni slayt, seçili slaydın arkasına başlık ve maddelerden oluşan bir
  slayt ekler. Yeni slaydın notları da düzenlenebilir.
- Yukarı / aşağı düğmeleri slaydın sunumdaki sırasını değiştirir.
- Sil, onaydan sonra seçili slaydı kaldırır. En az bir slayt kalmalıdır.
- Bitir, paneldeki kapatma düğmesi veya Esc ile sunuma dön.
- Düzenleme sırasında metin alanlarındaki ok tuşları imleci hareket ettirir;
  slaydı değiştirmez. Geri, İleri ve Bölümler düğmeleri çalışmaya devam eder.
- Kelime sayacı yalnızca uyarır; yazını kısaltmaz veya eklemeyi engellemez.
- Dosyadaki sunuma dön, onaydan sonra yerel düzenlemeleri kaldırır;
  dosyaya gömülü 11 slaytı ve görsellerini geri getirir.

GÖRSEL EKLEME VE YERLEŞTİRME
- Düzenle > + Görsel ekle ile PNG, JPG veya WebP dosyası seç.
  Birden fazla dosya seçebilir veya düzenleme açıkken slayda bırakabilirsin.
- Görseller seçili slayda eklenir; maddelerin yanına istediğin gibi yerleştir.
  Dosyalar yeniden sıkıştırılmaz, kesilmez veya bir servise gönderilmez.
- Yerleştirme sırasında sağ panel kapanır; gerçek sunum alanında çalışırsın.
- Görselin içinden tutup sürükle. Seçili görselin sağ alt tutamacından
  büyütüp küçült. En/boy oranı korunur ve görsel slayt alanında kalır.
- Panele dön ile yazılara ve görsel ayarlarına dön; Bitir ile sunumu göster.
- Eklenen görseller listesinden görsel seçebilir, açıklamasını ve genişliğini
  değiştirebilir, öne getirebilir veya onaylayarak kaldırabilirsin.
- Görsel odaktayken ok tuşları taşır; + / - boyutlandırır. Shift daha büyük
  adım kullanır. Köşe tutamacı odaktayken oklar da boyutlandırır.
- Sürüklerken Esc o hareketi iptal eder. Yerleştirme sırasında Esc panele döner.
- Sunum modunda eklenen görsele tıklayarak büyütme penceresini açabilirsin.
- Konumlar slayt alanına oranlıdır. Ekran değişince görselin oranı ve sınırları
  korunur; yerleştirmeyi sunumu yapacağın ekran boyutunda kontrol et.
- Bu araç eklediğin görseller içindir. İlk sunumdaki iki ekran görüntüsü ve
  etkileşimli diyagramlar mevcut düzenlerini korur.

KAYIT VE YEDEK
Metinler ve görsel konumları bu tarayıcının yerel kaydına yazılır.
Sonradan eklenen görsel dosyaları, metin kaydının küçük kotasını doldurmaması
için tarayıcının yerel görsel deposunda (IndexedDB) saklanır.
Dosyaya gömülü görseller doğrudan index.html içinden açılır; bunları
göstermek için tarayıcı deposuna yazmak gerekmez.
Sürükleme ve boyutlandırma, fareyi/parmağı bıraktığında kaydolur.
Aynı tarayıcıda ve aynı dosya konumunda yeniden açınca geri yüklenir.
Ctrl+S, düzenleme açıkken aynı yerel kaydı tekrar yapar.
Kaydetme başarısız olursa panelde hata gösterilir; sekmeyi kapatmadan
Yedek indir ile veriyi koru.

Bu kayıt index.html, app.js veya styles.css dosyalarını değiştirmez.
Tarayıcı verileri silinirse, farklı profil kullanılırsa veya klasör
taşınırsa kayıt gelmeyebilir. Önemli düzenlemelerden sonra yedek indir.

Yedek indir, metinleri, notları, slayt sırasını, eklenen görsel dosyalarını
ve yerleşimlerini tek JSON dosyasına kaydeder.
Başka bilgisayarda kullanmak için sunum klasörünü ve JSON yedeğini taşı;
index.html açıldıktan sonra Düzenle > Yedek yükle ile dosyayı seç.
Yedek yükleme, onaydan sonra mevcut sunumun yerini alır. Geçersiz dosya
reddedilir ve mevcut içerik değiştirilmez. Eklenen görseller yedeğe dahildir;
ilk sunumdaki iki görsel için assets klasörünü de koru.
Önceki metin düzenleyicisinin kayıtları ve JSON yedekleri desteklenir.
Görselli yeni yedekleri bu güncel sunum dosyalarıyla aç.
Tarayıcının görsel deposu silinirse dosyaları görselli yedekten geri yükle.
Eksik görsel bulunan sunum, tam bir görselli yedekmiş gibi dışa aktarılmaz.

Aynı dosyayı iki sekmede düzenleme. Başka sekmede kayıt değişirse uyarı
gösterilir ve bu sekmenin üzerine yazması durdurulur. Önce bu sekmenin
yedeğini indir, ardından sayfayı yenile veya istediğin yedeği yükle.
Yedekler de sunumdaki iç teknik bilgileri içerir; yalnızca yetkili
kişilerle ve kurumun onaylı kanallarıyla paylaş.

ETKİLEŞİMLER
- Avantajlar: analiz, geliştirme veya hata çözümü örneğini seç.
- Mevcut kullanım: gerçek agent ekranındaki üç adımı sırayla seç.
- Çözümün kaydı: ilk çözüm ve sonraki benzer iş arasında geçiş yap.

KAPSAM
Ekran görüntüleri kullanıcının sağladığı dosyalardır.
Agent örneği CRM/ITTP notundan Neo hata notuna, oradan IspBSTemp.cs
dosyasına geçişi gösterir. Bu görsel bir hata çözümünün tamamlandığını
göstermez. Sunum agent veya servis çalıştırmaz.

Çözüm kaydı ve ortak kullanım diyagramları, mailde anlatılan işleyişin
temsili gösterimidir. Ekip paylaşımı planlanan adımdır; burada gerçek
senkronizasyon veya agent entegrasyonu yapılmaz.

Zaman/token tasarrufu için ölçülmüş bir oran verilmez.
Detay panelindeki yaklaşık $4 bilgisi maildeki ilk tahmindir; güncel
Obsidian Sync fiyatı ve ortak vault kapsamı ayrıca doğrulanmalıdır.

Sunum dış API, MCP, CDN, harici font veya backend kullanmaz.
Not paneli geniş ekranda sağda, dar ekranda içerik örtülmeden altta açılır.
Dar ekranda metin küçültülmek yerine bölüm kaydırılabilir.
Editör geniş ekranda sağda, dar ekranda altta açılır. Dar ve kısa ekranda
düzenlemeye yer açmak için slayt önizlemesi geçici olarak gizlenir;
Bitir veya Yerleştir düğmesiyle tekrar görünür.
Sistemin azaltılmış hareket tercihi desteklenir.

Yalnızca yetkili iç ekiple ve kurumun onaylı paylaşım kanallarıyla paylaşın.
