/* PWA 서비스 워커 등록 (로비·kit.js 미사용 게임용)
 * 루트에 두고, 자신의 위치 기준으로 sw.js/scope(루트)를 계산한다.
 * file:// 이거나 미지원 브라우저면 조용히 건너뜀.
 */
(function () {
  'use strict';
  if (!('serviceWorker' in navigator)) return;
  if (location.protocol === 'file:') return;

  var root;
  try {
    var src = document.currentScript && document.currentScript.src;
    root = new URL('./', src || location.href).href;
  } catch (e) {
    root = new URL('./', location.href).href;
  }

  var register = function () {
    try {
      navigator.serviceWorker.register(root + 'sw.js', { scope: root }).catch(function () {
        /* 등록 실패는 무시 */
      });
    } catch (e) {
      /* ignore */
    }
  };

  if (document.readyState === 'complete') {
    register();
  } else {
    window.addEventListener('load', register);
  }
})();
