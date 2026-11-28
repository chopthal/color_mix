/* 키즈 놀이터 PWA 서비스 워커 (스코프: 루트 전체)
 * - install: sw-precache.js 목록 전체 precache
 * - activate: 이전 버전 캐시 삭제
 * - fetch: 페이지 이동(navigate)은 network-first(3초 초과·오프라인 시 캐시),
 *          그 외 동일 출처 GET은 cache-first(+ignoreSearch), 네트워크 성공 시 캐시 갱신
 */
importScripts('sw-precache.js');

var VERSION = self.PRECACHE_VERSION || 'v1';
var CACHE_NAME = 'kids-precache-' + VERSION;
var NAV_TIMEOUT_MS = 3000;

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

  // 페이지(HTML) 이동은 network-first: 배포 직후에도 새 로비·게임 목록이 바로 보이게.
  // 오프라인이거나 응답이 느리면 캐시로 폴백한다.
  if (request.mode === 'navigate') {
    event.respondWith(networkFirstNavigate(event, request, url));
    return;
  }

  event.respondWith(
    caches.match(request, { ignoreSearch: true }).then(function (cached) {
      if (cached) return cached;
      return fetchAndCache(request);
    })
  );
});

// 내비게이션 캐시 조회 (디렉터리형 /games/xxx/ 는 캐시된 index.html로)
function matchNavigateCache(request, url) {
  return caches.match(request, { ignoreSearch: true }).then(function (cached) {
    if (cached || !url.pathname.endsWith('/')) return cached;
    var idxUrl = new URL(url.pathname + 'index.html', url.origin).href;
    return caches.match(idxUrl, { ignoreSearch: true });
  });
}

function networkFirstNavigate(event, request, url) {
  var network = fetchAndCache(request);
  event.waitUntil(network.catch(function () {}));

  return new Promise(function (resolve) {
    var settled = false;
    var finish = function (response) {
      if (settled || !response) return false;
      settled = true;
      clearTimeout(timer);
      resolve(response);
      return true;
    };
    var fallback = function () {
      return matchNavigateCache(request, url).then(finish);
    };
    // 느린 네트워크: 캐시가 있으면 먼저 보여 주고, 없으면 네트워크를 계속 기다린다
    var timer = setTimeout(fallback, NAV_TIMEOUT_MS);

    network.then(finish, function () {
      fallback().then(function (ok) {
        if (!ok && !settled) {
          settled = true;
          resolve(Response.error());
        }
      });
    });
  });
}
