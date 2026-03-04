### ### SECURITY AUDIT: [Proje Adı / Modül Adı]

**Risk Assessment:** [Critical / High / Medium / Low / Secure]

---

#### **1. Findings (Bulgular)**

* **[Vulnerability Name - Örn: SQL Injection]** * **Severity:** [Level]
* **Location:** [File Name / Line Number]
* **The Exploit:** [Saldırganın bu açığı nasıl manipüle edebileceğinin teknik açıklaması]
* **The Fix:** ```[dil]
// İyileştirilmiş güvenli kod bloğu
```


```


* **[Vulnerability Name - Örn: Hardcoded API Key]**
* **Severity:** [Level]
* **Location:** [File Name / Line Number]
* **The Exploit:** [Anahtarın ele geçirilmesi durumunda oluşacak veri sızıntısı riski]
* **The Fix:** [Çözüm yolu - örn: .env kullanımı ve .gitignore kontrolü]



---

#### **2. Observations (Gözlemler)**

* [Düşük riskli konular veya genel sertleştirme (hardening) önerileri]
* [Bağımlılıkların güncelliği (Outdated dependencies) kontrolü]
* [Logging pratikleri: Hassas verilerin loglanıp loglanmadığı]

---

#### **3. Critical Secrets Checklist**

* [ ] API Keys / Tokens
* [ ] Database Credentials
* [ ] Private RSA/SSH Keys
* [ ] Plaintext Passwords

---

### Bu Dosyayı Nasıl Kullanmalısın? (Final Adımı)

Videodaki 8. adımı uygulamak için şu yolu izle:

1. **Bağlamı Sıfırla:** Proje bittiğinde yeni bir chat penceresi aç.
2. **Rolü Tanımla:** Paylaştığın **Güvenli Kod Yazma** promptunu gir ve ardından şunu söyle:
> *"Şimdi tüm projemizi bir siber güvenlik uzmanı gözüyle tara. Bulduğun her şeyi `security.md` dosyasına raporla. Hiçbir şeyi 'varsayma', en ufak şüpheyi bile flag'le."*


3. **Kritik Hataları Fiksle:** AI raporu bitirdiğinde, özellikle **Critical** ve **High** seviyeli olanları `progress.md` dosyasına ekleyerek tek tek düzelttir.
4. **Doğrula:** Düzeltme yapıldıktan sonra AI'ya "Bu açık şu an kapandı mı?" diye tekrar teyit ettir.

