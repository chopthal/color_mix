/* 키즈 놀이터 PWA 서비스 워커 (스코프: 루트 전체)
 * - install: sw-precache.js 목록 전체 precache
 * - activate: 이전 버전 캐시 삭제
 * - fetch: 동일 출처 GET cache-first(+ignoreSearch), 네트워크 성공 시 캐시 갱신
 */
importScripts('sw-precache.js');

var VERSION = self.PRECACHE_VERSION || 'v1';
var CACHE_NAME = 'kids-precache-' + VERSION;

// 서버가 .html → 301 리다이렉트(예: `npx serve` cleanUrls)를 주면 응답이
// redirected로 표시되고, 그 응답을 내비게이션에 돌려주면 브라우저가 실패할 수 있다.
// 본문을 새 Response로 감싸 redirected 플래그를 제거해 원래 URL 키로 저장한다.
function normalizeRedirected(url, response) {
  return response.arrayBuffer().then(function (buffer) {
    var headers = {};
    response.headers.forEach(function (value, key) {
      if (/^(content-length|content-encoding|transfer-encoding|connection|keep-alive)$/i.test(key)) {
        return;
      }
      headers[key] = value;
    });
    return new Response(buffer, {
      status: response.status,
      statusText: response.statusText,
      headers: headers,
    });
  });
}

function precacheOne(cache, url) {
  return fetch(url).then(function (response) {
    if (!response.ok) return;
    if (response.redirected) {
      return normalizeRedirected(url, response).then(function (clean) {
        return cache.put(url, clean);
      });
    }
    return cache.put(url, response);
  });
}

self.addEventListener('install', function (event) {
  event.waitUntil(
    caches.open(CACHE_NAME).then(function (cache) {
      var urls = self.PRECACHE || [];
      return Promise.all(urls.map(function (url) {
        return precacheOne(cache, url);
      }));
    }).then(function () {
      return self.skipWaiting();
    })
  );
});

self.addEventListener('activate', function (event) {
  event.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.map(function (key) {
        if (key !== CACHE_NAME) return caches.delete(key);
      }));
    }).then(function () {
      return self.clients.claim();
    })
  );
});

function fetchAndCache(request) {
  return fetch(request).then(function (response) {
    // 성공한 동일 출처 응답만 다음 접속을 위해 캐시에 보관
    if (response && response.status === 200 && response.type === 'basic') {
      var copy = response.clone();
      caches.open(CACHE_NAME).then(function (cache) {
        cache.put(request, copy);
      });
    }
    return response;
  });
}

self.addEventListener('fetch', function (event) {
  var request = event.request;
  if (request.method !== 'GET') return;

  var url;
  try {
    url = new URL(request.url);
  } catch (e) {
    return;
  }
  // 동일 출처만 처리 (글꼴 등 외부 의존은 이미 로컬 자체 호스팅으로 제거)
  if (url.origin !== self.location.origin) return;

  event.respondWith(
    caches.match(request, { ignoreSearch: true }).then(function (cached) {
      if (cached) return cached;

      // 디렉터리형 내비게이션(/games/xxx/)은 캐시된 index.html로 응답
      if (request.mode === 'navigate' && url.pathname.endsWith('/')) {
        var idxUrl = new URL(url.pathname + 'index.html', url.origin).href;
        return caches.match(idxUrl, { ignoreSearch: true }).then(function (idx) {
          if (idx) return idx;
          return fetchAndCache(request);
        });
      }

      return fetchAndCache(request);
    })
  );
});
