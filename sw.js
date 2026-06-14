// Defter — service worker (çevrimdışı çalışma + güvenilir güncelleme)
// Strateji: ÖNCE AĞ, sonra önbellek (network-first).
//   - Çevrimiçiyken her zaman en güncel dosya ağdan gelir (yeni sürüm hemen görünür).
//   - Ağ yoksa önbellekten verilir (çevrimdışı çalışma korunur).
// NOT: Tüm yollar GÖRELİ (başında / yok) — alt klasörde yayınlanabilsin diye.

// Önbellek adı SÜRÜMLÜ: yeni sürüm yayınlarken numarayı artır (v2 -> v3 ...).
// Böylece activate'te eski sürümlü önbellekler silinir.
var CACHE_NAME = "defter-v2";

// Çevrimdışı açılış için önbelleğe alınacak ana dosyalar
var DOSYALAR = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./icon-192.png",
  "./icon-512.png",
  "./apple-touch-icon.png"
];

// Kurulumda dosyaları önbelleğe doldur ve beklemeden devreye gir
self.addEventListener("install", function (e) {
  e.waitUntil(
    caches.open(CACHE_NAME).then(function (cache) {
      return cache.addAll(DOSYALAR);
    })
  );
  self.skipWaiting(); // yeni sürüm beklemeden etkin olsun
});

// Etkinleşince eski sürümlü önbellekleri sil ve açık sayfaları hemen devral
self.addEventListener("activate", function (e) {
  e.waitUntil(
    caches.keys().then(function (anahtarlar) {
      return Promise.all(
        anahtarlar.map(function (ad) {
          if (ad !== CACHE_NAME) return caches.delete(ad);
        })
      );
    }).then(function () {
      return self.clients.claim(); // mevcut sekmeleri yeni SW'ye bağla
    })
  );
});

// ÖNCE AĞ, sonra önbellek:
//  - Ağdan başarıyla gelirse: yanıtı önbelleğe tazele ve kullanıcıya ver.
//  - Ağ başarısızsa (çevrimdışı): önbellekten ver.
self.addEventListener("fetch", function (e) {
  // Yalnızca GET istekleri önbelleklenir
  if (e.request.method !== "GET") return;

  e.respondWith(
    fetch(e.request)
      .then(function (yanit) {
        // Geçerli yanıtı önbelleğe yaz (kopyasını), sonra döndür
        var kopya = yanit.clone();
        caches.open(CACHE_NAME).then(function (cache) {
          cache.put(e.request, kopya);
        });
        return yanit;
      })
      .catch(function () {
        // Ağ yoksa önbellekten karşıla (yoksa tarayıcı kendi hatasını verir)
        return caches.match(e.request);
      })
  );
});
