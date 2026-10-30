/* 색칠 놀이터 - 탈것 10종 */
(function (A) {
  'use strict';
  A.OBJECTS.push(

    A.obj('car', '자동차', 'vehicle', '🚗', '부릉부릉', `
      <svg viewBox="0 0 300 300" class="obj-svg">
        <path class="part" data-part="body" data-name="차체" d="M35 205 L35 172 Q35 158 50 158 L95 158 L125 112 Q131 104 143 104 L196 104 Q209 104 216 114 L243 158 L255 158 Q270 158 270 173 L270 205 Q270 216 257 216 L48 216 Q35 216 35 205 Z"/>
        <path class="part" data-part="window-back" data-name="뒷창문" d="M132 151 L154 117 L188 117 L188 151 Z"/>
        <path class="part" data-part="window-front" data-name="앞창문" d="M197 151 L197 117 L225 117 L242 151 Z"/>
        <circle class="part" data-part="wheel-back" data-name="뒷바퀴" cx="90" cy="216" r="30"/>
        <circle class="part" data-part="wheel-front" data-name="앞바퀴" cx="222" cy="216" r="30"/>
        <ellipse class="part" data-part="headlight" data-name="헤드라이트" cx="259" cy="180" rx="8" ry="11"/>
        <rect class="part" data-part="taillight" data-name="미등" x="37" y="168" width="9" height="20" rx="4"/>
        <g class="fixed">
          <circle cx="90" cy="216" r="12" fill="#cfd8e3" stroke="#34455c" stroke-width="3"/>
          <circle cx="222" cy="216" r="12" fill="#cfd8e3" stroke="#34455c" stroke-width="3"/>
          <path d="M150 158 L150 210" stroke="#34455c" stroke-width="3" fill="none"/>
          <rect x="160" y="176" width="18" height="6" rx="3" fill="#34455c"/>
          <path d="M45 196 L260 196" stroke="#34455c" stroke-width="2" opacity="0.25"/>
        </g>
      </svg>`),

    A.obj('bus', '버스', 'vehicle', '🚌', '빵빵', `
      <svg viewBox="0 0 300 300" class="obj-svg">
        <rect class="part" data-part="body" data-name="차체" x="40" y="82" width="220" height="156" rx="26"/>
        <rect class="part" data-part="stripe" data-name="띠" x="40" y="170" width="220" height="20"/>
        <rect class="part" data-part="window1" data-name="창문" x="58" y="108" width="44" height="44" rx="8"/>
        <rect class="part" data-part="window2" data-name="창문" x="112" y="108" width="44" height="44" rx="8"/>
        <rect class="part" data-part="window3" data-name="창문" x="166" y="108" width="44" height="44" rx="8"/>
        <rect class="part" data-part="door" data-name="문" x="216" y="108" width="30" height="96" rx="8"/>
        <circle class="part" data-part="wheel1" data-name="바퀴" cx="92" cy="234" r="28"/>
        <circle class="part" data-part="wheel2" data-name="바퀴" cx="208" cy="234" r="28"/>
        <g class="fixed">
          <circle cx="92" cy="234" r="11" fill="#cfd8e3" stroke="#34455c" stroke-width="3"/>
          <circle cx="208" cy="234" r="11" fill="#cfd8e3" stroke="#34455c" stroke-width="3"/>
          <rect x="222" y="140" width="18" height="6" rx="3" fill="#34455c"/>
          <circle cx="246" cy="204" r="8" fill="#fff3a8" stroke="#34455c" stroke-width="3"/>
        </g>
      </svg>`),

    A.obj('plane', '비행기', 'vehicle', '✈️', '슝슝', `
      <svg viewBox="0 0 300 300" class="obj-svg">
        <path class="part" data-part="body" data-name="동체" d="M38 158 Q38 130 70 124 L210 124 Q248 124 262 146 Q268 156 258 164 L70 186 Q42 186 38 166 Z"/>
        <path class="part" data-part="wing" data-name="날개" d="M128 164 L100 222 L162 214 L178 166 Z"/>
        <path class="part" data-part="tail" data-name="꼬리날개" d="M48 156 L22 108 L58 112 L74 150 Z"/>
        <circle class="part" data-part="window1" data-name="창문" cx="212" cy="143" r="8"/>
        <circle class="part" data-part="window2" data-name="창문" cx="184" cy="147" r="8"/>
        <circle class="part" data-part="window3" data-name="창문" cx="156" cy="151" r="8"/>
        <path class="part" data-part="stripe" data-name="띠" d="M60 168 Q150 152 250 150 L252 160 Q160 162 62 178 Z"/>
        <g class="fixed">
          <circle cx="266" cy="154" r="7" fill="#cfd8e3" stroke="#34455c" stroke-width="3"/>
          <path d="M92 150 L116 150" stroke="#34455c" stroke-width="3" stroke-linecap="round"/>
        </g>
      </svg>`),

    A.obj('train', '기차', 'vehicle', '🚂', '칙칙폭폭', `
      <svg viewBox="0 0 300 300" class="obj-svg">
        <rect class="part" data-part="body" data-name="기관차" x="60" y="138" width="174" height="76" rx="14"/>
        <rect class="part" data-part="cabin" data-name="운전실" x="178" y="84" width="60" height="60" rx="10"/>
        <rect class="part" data-part="roof" data-name="지붕" x="172" y="72" width="72" height="16" rx="8"/>
        <rect class="part" data-part="chimney" data-name="굴뚝" x="90" y="90" width="32" height="54" rx="8"/>
        <rect class="part" data-part="window" data-name="창문" x="192" y="96" width="32" height="28" rx="6"/>
        <circle class="part" data-part="wheel1" data-name="바퀴" cx="100" cy="220" r="22"/>
        <circle class="part" data-part="wheel2" data-name="바퀴" cx="156" cy="220" r="22"/>
        <circle class="part" data-part="wheel3" data-name="바퀴" cx="212" cy="220" r="22"/>
        <path class="part" data-part="bumper" data-name="앞부분" d="M38 196 L62 196 L62 226 L44 226 Q38 226 38 218 Z"/>
        <g class="fixed">
          <circle cx="100" cy="220" r="9" fill="#cfd8e3" stroke="#34455c" stroke-width="3"/>
          <circle cx="156" cy="220" r="9" fill="#cfd8e3" stroke="#34455c" stroke-width="3"/>
          <circle cx="212" cy="220" r="9" fill="#cfd8e3" stroke="#34455c" stroke-width="3"/>
          <circle cx="106" cy="66" r="12" fill="#e8eef5" opacity="0.9"/>
          <circle cx="128" cy="50" r="9" fill="#e8eef5" opacity="0.8"/>
          <circle cx="146" cy="38" r="6" fill="#e8eef5" opacity="0.7"/>
          <rect x="64" y="158" width="166" height="8" rx="4" fill="#34455c" opacity="0.25"/>
        </g>
      </svg>`),

    A.obj('yacht', '요트', 'vehicle', '⛵', '출렁출렁', `
      <svg viewBox="0 0 300 300" class="obj-svg">
        <path class="part" data-part="water" data-name="바다" d="M20 246 Q60 232 100 246 T180 246 T260 246 L280 274 L20 274 Z"/>
        <path class="part" data-part="hull" data-name="배" d="M42 196 L258 196 L232 244 Q226 252 212 252 L88 252 Q74 252 68 244 Z"/>
        <path class="part" data-part="sail-main" data-name="큰 돛" d="M152 54 L152 190 L236 190 Z"/>
        <path class="part" data-part="sail-front" data-name="작은 돛" d="M146 66 L146 190 L72 190 Z"/>
        <path class="part" data-part="flag" data-name="깃발" d="M152 52 L198 64 L152 76 Z"/>
        <g class="fixed">
          <rect x="147" y="52" width="7" height="140" fill="#7b5b33" stroke="#34455c" stroke-width="2"/>
          <circle cx="120" cy="222" r="9" fill="#e8eef5" stroke="#34455c" stroke-width="3"/>
          <circle cx="150" cy="222" r="9" fill="#e8eef5" stroke="#34455c" stroke-width="3"/>
          <circle cx="180" cy="222" r="9" fill="#e8eef5" stroke="#34455c" stroke-width="3"/>
        </g>
      </svg>`),

    A.obj('rocket', '로켓', 'vehicle', '🚀', '슈웅', `
      <svg viewBox="0 0 300 300" class="obj-svg">
        <path class="part" data-part="flame" data-name="불꽃" d="M150 236 Q126 268 150 294 Q174 268 150 236 Z"/>
        <path class="part" data-part="fin-left" data-name="왼쪽 날개" d="M112 198 L72 250 L112 246 Z"/>
        <path class="part" data-part="fin-right" data-name="오른쪽 날개" d="M188 198 L228 250 L188 246 Z"/>
        <path class="part" data-part="body" data-name="몸통" d="M112 196 Q112 112 150 72 Q188 112 188 196 Z"/>
        <path class="part" data-part="nose" data-name="머리" d="M150 38 Q178 56 188 96 L112 96 Q122 56 150 38 Z"/>
        <circle class="part" data-part="window" data-name="창문" cx="150" cy="134" r="24"/>
        <path class="part" data-part="stripe" data-name="띠" d="M112 178 L188 178 L188 196 L112 196 Z"/>
        <g class="fixed">
          <circle cx="150" cy="134" r="14" fill="#bfe3fc" stroke="#34455c" stroke-width="3"/>
          <circle cx="144" cy="128" r="5" fill="#fff"/>
          <circle cx="130" cy="182" r="4" fill="#34455c" opacity="0.35"/>
          <circle cx="170" cy="182" r="4" fill="#34455c" opacity="0.35"/>
          <path d="M150 250 Q146 268 150 282 Q154 268 150 250 Z" fill="#ffe144"/>
        </g>
      </svg>`),

    A.obj('truck', '트럭', 'vehicle', '🚚', '덜컹덜컹', `
      <svg viewBox="0 0 300 300" class="obj-svg">
        <rect class="part" data-part="trailer" data-name="짐칸" x="30" y="118" width="152" height="92" rx="10"/>
        <path class="part" data-part="cabin" data-name="운전실" d="M184 210 L184 138 Q184 126 196 126 L224 126 L252 166 L252 210 Z"/>
        <rect class="part" data-part="window" data-name="창문" x="198" y="138" width="38" height="32" rx="6"/>
        <rect class="part" data-part="stripe" data-name="띠" x="30" y="180" width="152" height="14"/>
        <circle class="part" data-part="wheel1" data-name="바퀴" cx="72" cy="214" r="26"/>
        <circle class="part" data-part="wheel2" data-name="바퀴" cx="130" cy="214" r="26"/>
        <circle class="part" data-part="wheel3" data-name="바퀴" cx="218" cy="214" r="26"/>
        <g class="fixed">
          <circle cx="72" cy="214" r="10" fill="#cfd8e3" stroke="#34455c" stroke-width="3"/>
          <circle cx="130" cy="214" r="10" fill="#cfd8e3" stroke="#34455c" stroke-width="3"/>
          <circle cx="218" cy="214" r="10" fill="#cfd8e3" stroke="#34455c" stroke-width="3"/>
          <path d="M196 164 L196 210" stroke="#34455c" stroke-width="3"/>
          <circle cx="242" cy="190" r="7" fill="#fff3a8" stroke="#34455c" stroke-width="3"/>
        </g>
      </svg>`),

    A.obj('firetruck', '소방차', 'vehicle', '🚒', '삐뽀삐뽀', `
      <svg viewBox="0 0 300 300" class="obj-svg">
        <rect class="part" data-part="body" data-name="차체" x="36" y="128" width="228" height="84" rx="14"/>
        <rect class="part" data-part="cabin" data-name="운전실" x="196" y="88" width="68" height="62" rx="10"/>
        <rect class="part" data-part="window" data-name="창문" x="208" y="100" width="44" height="32" rx="6"/>
        <rect class="part" data-part="ladder" data-name="사다리" x="58" y="94" width="122" height="18" rx="8"/>
        <rect class="part" data-part="stripe" data-name="띠" x="36" y="178" width="228" height="16"/>
        <circle class="part" data-part="wheel1" data-name="바퀴" cx="88" cy="212" r="26"/>
        <circle class="part" data-part="wheel2" data-name="바퀴" cx="214" cy="212" r="26"/>
        <circle class="part" data-part="light" data-name="경광등" cx="150" cy="86" r="12"/>
        <g class="fixed">
          <circle cx="88" cy="212" r="10" fill="#cfd8e3" stroke="#34455c" stroke-width="3"/>
          <circle cx="214" cy="212" r="10" fill="#cfd8e3" stroke="#34455c" stroke-width="3"/>
          <path d="M84 94 L84 112 M108 94 L108 112 M132 94 L132 112 M156 94 L156 112" stroke="#34455c" stroke-width="3"/>
          <path d="M200 134 L200 210" stroke="#34455c" stroke-width="3"/>
        </g>
      </svg>`),

    A.obj('excavator', '굴착기', 'vehicle', '🚜', '웅웅', `
      <svg viewBox="0 0 300 300" class="obj-svg">
        <rect class="part" data-part="track" data-name="바퀴" x="38" y="208" width="224" height="42" rx="21"/>
        <rect class="part" data-part="body" data-name="몸통" x="96" y="178" width="110" height="38" rx="12"/>
        <rect class="part" data-part="cab" data-name="운전실" x="148" y="116" width="92" height="94" rx="12"/>
        <rect class="part" data-part="window" data-name="창문" x="164" y="130" width="60" height="46" rx="8"/>
        <g class="part" data-part="arm" data-name="팔">
          <rect x="84" y="144" width="84" height="16" rx="8" transform="rotate(18 126 152)"/>
          <rect x="52" y="176" width="64" height="14" rx="7" transform="rotate(-34 84 183)"/>
        </g>
        <path class="part" data-part="bucket" data-name="버킷" d="M44 170 L84 170 L84 202 Q84 214 72 214 L58 214 Q44 214 44 202 Z"/>
        <g class="fixed">
          <circle cx="130" cy="152" r="7" fill="#cfd8e3" stroke="#34455c" stroke-width="3"/>
          <circle cx="82" cy="188" r="6" fill="#cfd8e3" stroke="#34455c" stroke-width="3"/>
          <circle cx="72" cy="229" r="10" fill="#cfd8e3" stroke="#34455c" stroke-width="3"/>
          <circle cx="150" cy="229" r="10" fill="#cfd8e3" stroke="#34455c" stroke-width="3"/>
          <circle cx="228" cy="229" r="10" fill="#cfd8e3" stroke="#34455c" stroke-width="3"/>
        </g>
      </svg>`),

    A.obj('helicopter', '헬리콥터', 'vehicle', '🚁', '드르륵', `
      <svg viewBox="0 0 300 300" class="obj-svg">
        <path class="part" data-part="tail" data-name="꼬리" d="M226 156 L286 142 L286 174 L226 188 Z"/>
        <ellipse class="part" data-part="body" data-name="몸통" cx="146" cy="172" rx="92" ry="54"/>
        <circle class="part" data-part="window" data-name="창문" cx="100" cy="168" r="28"/>
        <rect class="part" data-part="rotor" data-name="날개" x="34" y="98" width="224" height="12" rx="6"/>
        <rect class="part" data-part="skid" data-name="바닥" x="86" y="224" width="120" height="12" rx="6"/>
        <circle class="part" data-part="tailrotor" data-name="꼬리 날개" cx="286" cy="158" r="16"/>
        <g class="fixed">
          <rect x="140" y="108" width="12" height="20" rx="4" fill="#cfd8e3" stroke="#34455c" stroke-width="3"/>
          <circle cx="100" cy="168" r="17" fill="#bfe3fc" stroke="#34455c" stroke-width="3"/>
          <path d="M112 224 L112 212 M180 224 L180 212" stroke="#34455c" stroke-width="3"/>
          <path d="M60 172 L100 172" stroke="#34455c" stroke-width="3" opacity="0.4"/>
        </g>
      </svg>`)
  );
})(window.CC_ART);
