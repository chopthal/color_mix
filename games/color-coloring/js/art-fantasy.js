/* 색칠 놀이터 - 판타지 10종 */
(function (A) {
  'use strict';
  var eyes = A.eyes;
  var blush = A.blush;
  var smile = A.smile;

  A.OBJECTS.push(

    A.obj('robot', '로봇', 'fantasy', '🤖', '삐빅', `
      <svg viewBox="0 0 300 300" class="obj-svg">
        <rect class="part" data-part="antenna" data-name="안테나" x="146" y="36" width="8" height="26" rx="4"/>
        <circle class="part" data-part="antenna-ball" data-name="안테나 방울" cx="150" cy="32" r="12"/>
        <g class="part" data-part="arms" data-name="팔">
          <rect x="58" y="150" width="32" height="90" rx="14"/>
          <rect x="210" y="150" width="32" height="90" rx="14"/>
        </g>
        <g class="part" data-part="legs" data-name="다리">
          <rect x="112" y="238" width="32" height="48" rx="12"/>
          <rect x="156" y="238" width="32" height="48" rx="12"/>
        </g>
        <rect class="part" data-part="body" data-name="몸통" x="96" y="146" width="108" height="100" rx="18"/>
        <rect class="part" data-part="head" data-name="머리" x="102" y="68" width="96" height="76" rx="18"/>
        <circle class="part" data-part="chest" data-name="가슴 버튼" cx="150" cy="192" r="22"/>
        <g class="fixed">
          ${eyes(130, 104, 170, 104, 9)}
          <rect x="128" y="126" width="44" height="6" rx="3" fill="#34455c"/>
          <circle cx="150" cy="192" r="8" fill="#ffe144" stroke="#34455c" stroke-width="3"/>
          <circle cx="76" cy="150" r="8" fill="#cfd8e3" stroke="#34455c" stroke-width="3"/>
          <circle cx="224" cy="150" r="8" fill="#cfd8e3" stroke="#34455c" stroke-width="3"/>
        </g>
      </svg>`),

    A.obj('castle', '성', 'fantasy', '🏰', '반짝반짝', `
      <svg viewBox="0 0 300 300" class="obj-svg">
        <rect class="part" data-part="tower-mid" data-name="가운데 탑" x="112" y="128" width="76" height="140" rx="6"/>
        <path class="part" data-part="roof-mid" data-name="가운데 지붕" d="M104 132 L150 62 L196 132 Z"/>
        <rect class="part" data-part="tower-left" data-name="왼쪽 탑" x="52" y="162" width="56" height="106" rx="6"/>
        <path class="part" data-part="roof-left" data-name="왼쪽 지붕" d="M46 166 L80 116 L114 166 Z"/>
        <rect class="part" data-part="tower-right" data-name="오른쪽 탑" x="192" y="162" width="56" height="106" rx="6"/>
        <path class="part" data-part="roof-right" data-name="오른쪽 지붕" d="M186 166 L220 116 L254 166 Z"/>
        <path class="part" data-part="door" data-name="문" d="M136 268 L136 216 Q136 196 150 196 Q164 196 164 216 L164 268 Z"/>
        <g class="part" data-part="windows" data-name="창문">
          <rect x="82" y="190" width="18" height="24" rx="8"/>
          <rect x="200" y="190" width="18" height="24" rx="8"/>
          <rect x="141" y="152" width="18" height="24" rx="8"/>
        </g>
        <path class="part" data-part="flag" data-name="깃발" d="M150 62 L150 34 L184 42 L150 52 Z"/>
        <g class="fixed">
          <path d="M120 148 L120 250 M180 148 L180 250 M60 180 L60 250 M240 180 L240 250" stroke="#34455c" stroke-width="2" opacity="0.22"/>
          <circle cx="150" cy="250" r="5" fill="#ffe144" stroke="#34455c" stroke-width="2"/>
        </g>
      </svg>`),

    A.obj('crown', '왕관', 'fantasy', '👑', '반짝반짝', `
      <svg viewBox="0 0 300 300" class="obj-svg">
        <path class="part" data-part="crown" data-name="왕관" d="M64 202 L64 108 L108 148 L150 84 L192 148 L236 108 L236 202 Z"/>
        <rect class="part" data-part="band" data-name="아래 띠" x="64" y="196" width="172" height="34" rx="10"/>
        <g class="part" data-part="jewels" data-name="보석">
          <circle cx="106" cy="176" r="11"/><circle cx="150" cy="170" r="12"/><circle cx="194" cy="176" r="11"/>
        </g>
        <g class="fixed">
          <circle cx="150" cy="84" r="8" fill="#ffe144" stroke="#34455c" stroke-width="3"/>
          <circle cx="108" cy="148" r="7" fill="#ffe144" stroke="#34455c" stroke-width="3"/>
          <circle cx="192" cy="148" r="7" fill="#ffe144" stroke="#34455c" stroke-width="3"/>
          <path d="M64 202 L236 202" stroke="#34455c" stroke-width="3"/>
        </g>
      </svg>`),

    A.obj('wand', '마법 지팡이', 'fantasy', '🪄', '반짝반짝', `
      <svg viewBox="0 0 300 300" class="obj-svg">
        <rect class="part" data-part="stick" data-name="지팡이" x="142" y="112" width="16" height="150" rx="8"/>
        <path class="part" data-part="star" data-name="별" d="M150 34 L164 76 L208 76 L172 102 L186 144 L150 118 L114 144 L128 102 L92 76 L136 76 Z"/>
        <circle class="part" data-part="center" data-name="별 가운데" cx="150" cy="92" r="14"/>
        <g class="part" data-part="sparkles" data-name="반짝이">
          <path d="M62 70 l4 10 10 4 -10 4 -4 10 -4 -10 -10 -4 10 -4z"/>
          <path d="M232 96 l3 8 8 3 -8 3 -3 8 -3 -8 -8 -3 8 -3z"/>
          <path d="M80 190 l3 8 8 3 -8 3 -3 8 -3 -8 -8 -3 8 -3z"/>
        </g>
        <g class="fixed">
          <circle cx="150" cy="92" r="7" fill="#ffe144" stroke="#34455c" stroke-width="2"/>
        </g>
      </svg>`),

    A.obj('flower', '꽃', 'fantasy', '🌸', '반짝반짝', `
      <svg viewBox="0 0 300 300" class="obj-svg">
        <circle class="part" data-part="petal1" data-name="꽃잎" cx="150" cy="92" r="30"/>
        <circle class="part" data-part="petal2" data-name="꽃잎" cx="190" cy="124" r="30"/>
        <circle class="part" data-part="petal3" data-name="꽃잎" cx="174" cy="172" r="30"/>
        <circle class="part" data-part="petal4" data-name="꽃잎" cx="126" cy="172" r="30"/>
        <circle class="part" data-part="petal5" data-name="꽃잎" cx="110" cy="124" r="30"/>
        <circle class="part" data-part="center" data-name="꽃 가운데" cx="150" cy="132" r="26"/>
        <rect class="part" data-part="stem" data-name="줄기" x="145" y="156" width="10" height="110" rx="5"/>
        <g class="part" data-part="leaves" data-name="잎">
          <path d="M150 210 Q118 198 108 218 Q128 236 150 220 Z"/>
          <path d="M150 234 Q182 222 192 242 Q172 260 150 244 Z"/>
        </g>
        <g class="fixed">
          ${eyes(140, 126, 160, 126, 6)}
          ${smile(150, 142, 14, 5)}
        </g>
      </svg>`),

    A.obj('butterfly', '나비', 'fantasy', '🦋', '팔랑팔랑', `
      <svg viewBox="0 0 300 300" class="obj-svg">
        <path class="part" data-part="wing-ul" data-name="왼쪽 윗날개" d="M146 136 Q108 76 62 78 Q48 118 92 150 Q120 162 146 150 Z"/>
        <path class="part" data-part="wing-ur" data-name="오른쪽 윗날개" d="M154 136 Q192 76 238 78 Q252 118 208 150 Q180 162 154 150 Z"/>
        <path class="part" data-part="wing-ll" data-name="왼쪽 아랫날개" d="M146 156 Q104 172 92 210 Q110 244 146 214 Q154 194 146 156 Z"/>
        <path class="part" data-part="wing-lr" data-name="오른쪽 아랫날개" d="M154 156 Q196 172 208 210 Q190 244 154 214 Q146 194 154 156 Z"/>
        <ellipse class="part" data-part="body" data-name="몸통" cx="150" cy="168" rx="14" ry="60"/>
        <g class="fixed">
          <path d="M144 114 Q132 92 118 84 M156 114 Q168 92 182 84" stroke="#34455c" stroke-width="3" fill="none" stroke-linecap="round"/>
          <circle cx="118" cy="84" r="5" fill="#34455c"/><circle cx="182" cy="84" r="5" fill="#34455c"/>
          <circle cx="144" cy="122" r="5" fill="#fff" stroke="#34455c" stroke-width="2"/>
          <circle cx="156" cy="122" r="5" fill="#fff" stroke="#34455c" stroke-width="2"/>
        </g>
      </svg>`),

    A.obj('fish', '물고기', 'fantasy', '🐟', '보글보글', `
      <svg viewBox="0 0 300 300" class="obj-svg">
        <path class="part" data-part="tail" data-name="꼬리" d="M74 150 L28 112 L38 150 L28 188 Z"/>
        <path class="part" data-part="fin-top" data-name="등지느러미" d="M148 98 L170 58 L196 100 Z"/>
        <path class="part" data-part="fin-bottom" data-name="배지느러미" d="M148 202 L170 242 L196 200 Z"/>
        <path class="part" data-part="body" data-name="몸통" d="M74 150 Q108 92 178 96 Q240 102 262 150 Q240 198 178 204 Q108 208 74 150 Z"/>
        <g class="part" data-part="scales" data-name="비늘">
          <ellipse cx="146" cy="126" rx="10" ry="7"/><ellipse cx="176" cy="126" rx="10" ry="7"/>
          <ellipse cx="161" cy="152" rx="10" ry="7"/><ellipse cx="131" cy="152" rx="10" ry="7"/>
        </g>
        <g class="fixed">
          <circle cx="226" cy="138" r="10" fill="#fff" stroke="#34455c" stroke-width="3"/>
          <circle cx="228" cy="138" r="5" fill="#34455c"/>
          ${smile(220, 166, 18, 7)}
          <path d="M196 176 Q206 182 216 176" fill="none" stroke="#34455c" stroke-width="3" stroke-linecap="round"/>
        </g>
      </svg>`),

    A.obj('balloon', '풍선', 'fantasy', '🎈', '반짝반짝', `
      <svg viewBox="0 0 300 300" class="obj-svg">
        <path class="part" data-part="balloon" data-name="풍선" d="M150 44 Q222 44 222 132 Q222 194 150 218 Q78 194 78 132 Q78 44 150 44 Z"/>
        <path class="part" data-part="knot" data-name="매듭" d="M140 218 L160 218 L150 234 Z"/>
        <ellipse class="part" data-part="highlight" data-name="하이라이트" cx="118" cy="100" rx="14" ry="24" transform="rotate(20 118 100)"/>
        <circle class="part" data-part="small1" data-name="작은 풍선" cx="232" cy="96" r="26"/>
        <circle class="part" data-part="small2" data-name="작은 풍선" cx="238" cy="150" r="18"/>
        <g class="fixed">
          <path d="M150 232 Q146 254 158 272 M232 122 Q214 160 156 224 M238 168 Q218 190 158 226" stroke="#34455c" stroke-width="2.5" fill="none" stroke-linecap="round"/>
        </g>
      </svg>`),

    A.obj('ufo', 'UFO', 'fantasy', '🛸', '위잉위잉', `
      <svg viewBox="0 0 300 300" class="obj-svg">
        <path class="part" data-part="beam" data-name="빛줄기" d="M150 190 L96 278 L204 278 Z"/>
        <ellipse class="part" data-part="saucer" data-name="접시" cx="150" cy="180" rx="104" ry="34"/>
        <path class="part" data-part="dome" data-name="돔" d="M96 176 Q96 116 150 116 Q204 116 204 176 Z"/>
        <g class="part" data-part="lights" data-name="불빛">
          <circle cx="92" cy="184" r="8"/><circle cx="124" cy="192" r="8"/>
          <circle cx="150" cy="196" r="8"/><circle cx="176" cy="192" r="8"/><circle cx="208" cy="184" r="8"/>
        </g>
        <g class="fixed">
          <ellipse cx="130" cy="146" rx="14" ry="8" fill="#fff" opacity="0.75"/>
          ${eyes(138, 158, 162, 158, 7)}
        </g>
      </svg>`),

    A.obj('submarine', '잠수함', 'fantasy', '🚤', '보글보글', `
      <svg viewBox="0 0 300 300" class="obj-svg">
        <path class="part" data-part="fin" data-name="꼬리 날개" d="M246 140 L276 116 L276 164 Z"/>
        <path class="part" data-part="propeller" data-name="프로펠러" d="M270 150 L288 132 L288 168 L270 170 Z"/>
        <ellipse class="part" data-part="body" data-name="몸통" cx="150" cy="170" rx="110" ry="56"/>
        <path class="part" data-part="dome" data-name="돔" d="M112 132 Q112 96 150 96 Q188 96 188 132 Z"/>
        <g class="part" data-part="portholes" data-name="창문">
          <circle cx="112" cy="170" r="12"/><circle cx="150" cy="170" r="12"/><circle cx="188" cy="170" r="12"/>
        </g>
        <g class="fixed">
          <circle cx="112" cy="170" r="6" fill="#bfe3fc" stroke="#34455c" stroke-width="2"/>
          <circle cx="150" cy="170" r="6" fill="#bfe3fc" stroke="#34455c" stroke-width="2"/>
          <circle cx="188" cy="170" r="6" fill="#bfe3fc" stroke="#34455c" stroke-width="2"/>
          <ellipse cx="130" cy="116" rx="12" ry="7" fill="#fff" opacity="0.7"/>
          <path d="M40 170 L70 170" stroke="#34455c" stroke-width="3" stroke-linecap="round"/>
        </g>
      </svg>`)
  );
})(window.CC_ART);
