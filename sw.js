// Defter — basit service worker (çevrimdışı çalışma için)
// Ana dosyaları önbelleğe alır; internet yokken de uygulama açılır.
// NOT: Tüm yollar GÖRELİ (başında / yok) — alt klasörde yayınlanabilsin diye.

var CACHE_ADI = "defter-v1";

// Önbelleğe alınacak ana dosyalar
var DOSYALAR = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./icon-192.png",
  "./icon-512.png",
  "./apple-touch-icon.png"
];

// Kurulumda dosyaları önbelleğe doldur
self.addEventListener("install", function (e) {
  e.waitUntil(
    caches.open(CACHE_ADI).then(function (cache) {
      return cache.addAll(DOSYALAR);
    })
  );
  self.skipWaiting();
});

// Yeni sürümde eski önbellekleri temizle
self.addEventListener("activate", function (e) {
  e.waitUntil(
    caches.keys().then(function (anahtarlar) {
      return Promise.all(
        anahtarlar.map(function (ad) {
          if (ad !== CACHE_ADI) return caches.delete(ad);
        })
      );
    })
  );
  self.clients.claim();
});

// İstekleri önce önbellekten karşıla, yoksa internetten al
self.addEventListener("fetch", function (e) {
  e.respondWith(
    caches.match(e.request).then(function (yanit) {
      return yanit || fetch(e.request);
    })
  );
});
