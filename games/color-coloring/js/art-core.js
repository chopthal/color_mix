/**
 * 색칠 놀이터 - 아트 공통 헬퍼
 * 각 물체는 viewBox="0 0 300 300" SVG 문자열로 구성됩니다.
 * class="part" + data-part 속성이 있는 요소만 색칠 대상입니다.
 */
window.CC_ART = (function () {
  'use strict';

  var CATEGORIES = [
    { id: 'vehicle', label: '탈것', emoji: '🚗' },
    { id: 'dino', label: '공룡', emoji: '🦕' },
    { id: 'animal', label: '동물', emoji: '🦁' },
    { id: 'food', label: '음식', emoji: '🍎' },
    { id: 'fantasy', label: '판타지', emoji: '🦄' }
  ];

  function eyes(cx1, cy1, cx2, cy2, r) {
    r = r || 10;
    function one(cx, cy) {
      return '<circle cx="' + cx + '" cy="' + cy + '" r="' + r + '" fill="#fff" stroke="#34455c" stroke-width="3"/>' +
        '<circle cx="' + (cx + r * 0.16) + '" cy="' + cy + '" r="' + (r * 0.46) + '" fill="#34455c"/>' +
        '<circle cx="' + (cx - r * 0.2) + '" cy="' + (cy - r * 0.26) + '" r="' + (r * 0.18) + '" fill="#fff"/>';
    }
    return '<g class="face">' + one(cx1, cy1) + one(cx2, cy2) + '</g>';
  }

  function blush(cx1, cy1, cx2, cy2, rx, ry) {
    rx = rx || 12;
    ry = ry || 7;
    return '<g class="face">' +
      '<ellipse cx="' + cx1 + '" cy="' + cy1 + '" rx="' + rx + '" ry="' + ry + '" fill="#ff9db2" opacity="0.75"/>' +
      '<ellipse cx="' + cx2 + '" cy="' + cy2 + '" rx="' + rx + '" ry="' + ry + '" fill="#ff9db2" opacity="0.75"/>' +
      '</g>';
  }

  function smile(cx, cy, w, h) {
    h = h || 10;
    return '<path d="M' + (cx - w / 2) + ' ' + cy + ' Q' + cx + ' ' + (cy + h) + ' ' + (cx + w / 2) + ' ' + cy + '" fill="none" stroke="#34455c" stroke-width="4" stroke-linecap="round"/>';
  }

  function star(cx, cy, outer, inner, fill) {
    inner = inner || outer * 0.45;
    fill = fill || '#fff';
    var pts = [];
    for (var i = 0; i < 10; i++) {
      var r = i % 2 === 0 ? outer : inner;
      var a = -Math.PI / 2 + (i * Math.PI) / 5;
      pts.push((cx + Math.cos(a) * r).toFixed(1) + ',' + (cy + Math.sin(a) * r).toFixed(1));
    }
    return '<polygon points="' + pts.join(' ') + '" fill="' + fill + '"/>';
  }

  function obj(id, name, category, emoji, sound, svg) {
    return { id: id, name: name, category: category, emoji: emoji, sound: sound, svg: svg };
  }

  return {
    CATEGORIES: CATEGORIES,
    OBJECTS: [],
    eyes: eyes,
    blush: blush,
    smile: smile,
    star: star,
    obj: obj
  };
})();
