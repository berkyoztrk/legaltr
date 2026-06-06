/* ==========================================================================
   1. AYARLAR VE YAPILANDIRMA
   ========================================================================== */
const DISCORD_WEBHOOK_URL = "https://discord.com/api/webhooks/1512829512738537573/V6KHVJ8bmYuRKHkgaTpTCqbiUt2OeHEuTQEWNFjT_hQdm79MyWjOKqeOdiIvM3BTVxuL";
const ADMIN_USER = "admin";
const ADMIN_PASS = "6161"; // İstediğin panel şifresi

// Vercel üzerinde çalıştığı için API yolları otomatik algılanır
const API_PERSONEL = "/api/personel";
const API_GALERI = "/api/galeri";

function isAdminLoggedIn() {
    return sessionStorage.getItem("lspd_admin") === "true";
}

/* ==========================================================================
   2. YETKİLİ GİRİŞ SİSTEMİ (LOGIN)
   ========================================================================== */
const loginForm = document.getElementById('login-form');
if (loginForm) {
    loginForm.addEventListener('submit', function(e) {
        e.preventDefault();
        const girilenUser = document.getElementById('username').value;
        const girilenPass = document.getElementById('password').value;

        if (girilenUser === ADMIN_USER && girilenPass === ADMIN_PASS) {
            sessionStorage.setItem("lspd_admin", "true");
            alert("Giriş Başarılı! Yönetim paneli aktif hale getirildi.");
            window.location.href = "index.html";
        } else {
            alert("Hatalı kullanıcı adı veya şifre!");
        }
    });
}

/* ==========================================================================
   3. PERSONEL YÖNETİMİ (BULUT VERİTABANI BAĞLANTILI)
   ========================================================================== */
const personelPanel = document.getElementById('admin-personel-panel');
const personelForm = document.getElementById('personel-form');
const personelListesi = document.getElementById('personel-listesi');
const logoutPersonel = document.getElementById('btn-logout-personel');

if (personelListesi) {
    if (isAdminLoggedIn() && personelPanel) {
        personelPanel.classList.remove('hidden');
    }

    async function personelleriListele() {
        personelListesi.innerHTML = "<p style='color:var(--gold);'>Personeller veritabanından çekiliyor...</p>";
        
        try {
            const res = await fetch(API_PERSONEL);
            const personeller = await res.json();
            
            personelListesi.innerHTML = "";

            if(personeller.length === 0) {
                personelListesi.innerHTML = "<p>Departmana kayıtlı personel bulunmamaktadır.</p>";
                return;
            }

            personeller.forEach(p => {
                const kart = document.createElement('div');
                kart.className = 'personel-card';
                kart.innerHTML = `
                    <img src="${p.foto}" onerror="this.src='https://via.placeholder.com/150'" alt="LSPD">
                    <h4>${p.isim}</h4>
                    ${isAdminLoggedIn() ? `<button class="btn-delete" onclick="personelSil(${p.id})">Sil</button>` : ''}
                `;
                personelListesi.appendChild(kart);
            });
        } catch (err) {
            personelListesi.innerHTML = "<p>Veri çekme hatası oluştu.</p>";
        }
    }

    if (personelForm) {
        personelForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            const isim = document.getElementById('p-isim').value;
            const foto = document.getElementById('p-foto').value;
            
            const res = await fetch(API_PERSONEL);
            let personeller = await res.json();
            
            personeller.push({ id: Date.now(), isim: isim, foto: foto });
            
            await fetch(API_PERSONEL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ personeller })
            });

            personelForm.reset();
            personelleriListele();
        });
    }

    window.personelSil = async function(id) {
        if (confirm("Bu personeli silmek istediğinize emin misiniz?")) {
            const res = await fetch(API_PERSONEL);
            let personeller = await res.json();
            
            personeller = personeller.filter(p => p.id !== id);
            
            await fetch(API_PERSONEL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ personeller })
            });
            personelleriListele();
        }
    };

    if (logoutPersonel) {
        logoutPersonel.addEventListener('click', function() {
            sessionStorage.removeItem("lspd_admin");
            window.location.reload();
        });
    }

    personelleriListele();
}

/* ==========================================================================
   4. GALERİ YÖNETİMİ (BULUT VERİTABANI BAĞLANTILI)
   ========================================================================== */
const galeriPanel = document.getElementById('admin-galeri-panel');
const galeriForm = document.getElementById('galeri-form');
const galeriListesi = document.getElementById('galeri-listesi');
const logoutGaleri = document.getElementById('btn-logout-galeri');

if (galeriListesi) {
    if (isAdminLoggedIn() && galeriPanel) {
        galeriPanel.classList.remove('hidden');
    }

    async function galeriyiListele() {
        galeriListesi.innerHTML = "<p style='color:var(--gold);'>Galeri yükleniyor...</p>";
        
        try {
            const res = await fetch(API_GALERI);
            const medyaListesi = await res.json();
            
            galeriListesi.innerHTML = "";

            if(medyaListesi.length === 0) {
                galeriListesi.innerHTML = "<p>Galeride henüz medya yok.</p>";
                return;
            }

            medyaListesi.forEach(m => {
                const item = document.createElement('div');
                item.className = 'galeri-item';
                
                let medyaEtiketi = "";
                if (m.tip === "foto") {
                    medyaEtiketi = `<img src="${m.url}" alt="LSPD Medya">`;
                } else if (m.tip === "video") {
                    let videoUrl = m.url;
                    if (videoUrl.includes("watch?v=")) {
                        videoUrl = videoUrl.replace("watch?v=", "embed/");
                    }
                    medyaEtiketi = `<iframe src="${videoUrl}" frameborder="0" allowfullscreen></iframe>`;
                }

                item.innerHTML = `
                    ${medyaEtiketi}
                    ${isAdminLoggedIn() ? `<button class="btn-delete" onclick="medyaSil(${m.id})">Kaldır</button>` : ''}
                `;
                galeriListesi.appendChild(item);
            });
        } catch (err) {
            galeriListesi.innerHTML = "<p>Galeri yüklenirken bir hata oluştu.</p>";
        }
    }

    if (galeriForm) {
        galeriForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            const tip = document.getElementById('medya-tipi').value;
            const url = document.getElementById('medya-url').value;

            const res = await fetch(API_GALERI);
            let galeri = await res.json();

            galeri.push({ id: Date.now(), tip: tip, url: url });

            await fetch(API_GALERI, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ galeri })
            });

            galeriForm.reset();
            galeriyiListele();
        });
    }

    window.medyaSil = async function(id) {
        if (confirm("Bu medyayı silmek istediğinize emin misiniz?")) {
            const res = await fetch(API_GALERI);
            let galeri = await res.json();
            
            galeri = galeri.filter(m => m.id !== id);
            
            await fetch(API_GALERI, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ galeri })
            });
            galeriyiListele();
        }
    };

    if (logoutGaleri) {
        logoutGaleri.addEventListener('click', function() {
            sessionStorage.removeItem("lspd_admin");
            window.location.reload();
        });
    }

    galeriyiListele();
}

/* ==========================================================================
   5. BAŞVURU FORMU GÖNDERİMİ (DISCORD WEBHOOK)
   ========================================================================== */
const basvuruFormu = document.getElementById('lspd-basvuru-formu');
if (basvuruFormu) {
    basvuruFormu.addEventListener('submit', function(e) {
        e.preventDefault();

        const oocAd = document.getElementById('ooc-ad').value;
        const oocYas = document.getElementById('ooc-yas').value;
        const oocGecmis = document.getElementById('ooc-gecmis').value;
        const oocDc = document.getElementById('ooc-dc').value;
        const icAd = document.getElementById('ic-ad').value;
        const icSabika = document.getElementById('ic-sabika').value;
        const icFto = document.getElementById('ic-fto').value;
        const icPit = document.getElementById('ic-pit').value;
        const icPullover = document.getElementById('ic-pullover').value;
        const icSenaryo = document.getElementById('ic-senaryo').value;
        const icFraw = document.getElementById('ic-fark').value;

        const discordVerisi = {
            embeds: [{
                title: "🚨 YENİ LSPD BAŞVURUSU 🚨",
                color: 1920984,
                fields: [
                    { name: "--- OOC BILGILER ---", value: `**Ad/Yaş:** ${oocAd} / ${oocYas}\n**Discord:** ${oocDc}\n**Geçmiş:** ${oocGecmis}` },
                    { name: "--- IC BILGILER ---", value: `**Karakter:** ${icAd}\n**Sabıka:** ${icSabika}` },
                    { name: "FTO Nedir?", value: icFto },
                    { name: "Pit & Ram?", value: icPit },
                    { name: "Pullover?", value: icPullover },
                    { name: "Senaryo Yaklaşımı", value: icSenaryo },
                    { name: "Farkı Nedir?", value: icFraw }
                ],
                timestamp: new Date()
            }]
        };

        fetch(DISCORD_WEBHOOK_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(discordVerisi)
        }).then(res => {
            if(res.ok) {
                alert("Başvurunuz başarıyla iletildi!");
                basvuruFormu.reset();
            }
        });
    });
}