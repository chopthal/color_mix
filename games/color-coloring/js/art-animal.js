/* 색칠 놀이터 - 동물 10종 */
(function (A) {
  'use strict';
  var eyes = A.eyes;
  var blush = A.blush;
  var smile = A.smile;

  A.OBJECTS.push(

    A.obj('lion', '사자', 'animal', '🦁', '어흥', `
      <svg viewBox="0 0 300 300" class="obj-svg">
        <path class="part" data-part="tail" data-name="꼬리" d="M206 222 Q250 224 262 196 Q266 184 256 182 Q248 194 240 206 Q226 214 206 210 Z"/>
        <ellipse class="part" data-part="body" data-name="몸통" cx="150" cy="214" rx="64" ry="58"/>
        <g class="part" data-part="legs" data-name="다리">
          <ellipse cx="118" cy="258" rx="18" ry="22"/><ellipse cx="182" cy="258" rx="18" ry="22"/>
        </g>
        <circle class="part" data-part="mane" data-name="갈기" cx="150" cy="128" r="68"/>
        <g class="part" data-part="ears" data-name="귀">
          <circle cx="106" cy="84" r="18"/><circle cx="194" cy="84" r="18"/>
        </g>
        <circle class="part" data-part="head" data-name="얼굴" cx="150" cy="130" r="44"/>
        <ellipse class="part" data-part="muzzle" data-name="입 주변" cx="150" cy="152" rx="30" ry="22"/>
        <g class="fixed">
          ${eyes(132, 124, 168, 124, 9)}
          ${blush(118, 146, 182, 146, 10, 6)}
          <path d="M150 140 L142 150 L158 150 Z" fill="#7b5b33"/>
          ${smile(150, 156, 26, 10)}
          <path d="M126 152 L104 148 M126 158 L104 160 M174 152 L196 148 M174 158 L196 160" stroke="#34455c" stroke-width="2" stroke-linecap="round"/>
          <circle cx="258" cy="182" r="14" fill="#a8642c" stroke="#34455c" stroke-width="3"/>
        </g>
      </svg>`),

    A.obj('elephant', '코끼리', 'animal', '🐘', '뿌우', `
      <svg viewBox="0 0 300 300" class="obj-svg">
        <path class="part" data-part="tail" data-name="꼬리" d="M232 196 Q262 198 272 218 Q260 220 252 208 Q246 202 234 204 Z"/>
        <ellipse class="part" data-part="body" data-name="몸통" cx="176" cy="186" rx="72" ry="54"/>
        <g class="part" data-part="legs" data-name="다리">
          <rect x="130" y="212" width="34" height="54" rx="14"/>
          <rect x="196" y="212" width="34" height="54" rx="14"/>
        </g>
        <circle class="part" data-part="head" data-name="머리" cx="102" cy="150" r="50"/>
        <path class="part" data-part="ear" data-name="귀" d="M122 108 Q176 100 178 158 Q174 200 132 198 Q108 160 122 108 Z"/>
        <path class="part" data-part="trunk" data-name="코" d="M78 168 Q46 198 58 242 Q62 256 76 252 Q88 248 80 234 Q70 208 94 186 Z"/>
        <path class="part" data-part="tusk" data-name="엄니" d="M64 178 Q46 186 48 200 Q58 196 66 188 Z"/>
        <g class="fixed">
          ${eyes(88, 138, 114, 138, 9)}
          ${blush(82, 160, 120, 162, 9, 5)}
          <path d="M148 254 L164 254 M214 254 L230 254" stroke="#34455c" stroke-width="3" stroke-linecap="round"/>
        </g>
      </svg>`),

    A.obj('rabbit', '토끼', 'animal', '🐰', '깡충깡충', `
      <svg viewBox="0 0 300 300" class="obj-svg">
        <ellipse class="part" data-part="ear-left" data-name="왼쪽 귀" cx="118" cy="76" rx="16" ry="46" transform="rotate(-12 118 76)"/>
        <ellipse class="part" data-part="ear-right" data-name="오른쪽 귀" cx="182" cy="76" rx="16" ry="46" transform="rotate(12 182 76)"/>
        <circle class="part" data-part="tail" data-name="꼬리" cx="214" cy="218" r="18"/>
        <ellipse class="part" data-part="body" data-name="몸통" cx="150" cy="210" rx="48" ry="50"/>
        <g class="part" data-part="feet" data-name="발">
          <ellipse cx="120" cy="254" rx="22" ry="12"/><ellipse cx="180" cy="254" rx="22" ry="12"/>
        </g>
        <circle class="part" data-part="head" data-name="얼굴" cx="150" cy="134" r="46"/>
        <ellipse class="part" data-part="belly" data-name="배" cx="150" cy="218" rx="30" ry="32"/>
        <g class="fixed">
          ${eyes(132, 128, 168, 128, 9)}
          ${blush(118, 148, 182, 148, 10, 6)}
          <path d="M150 142 L144 150 L156 150 Z" fill="#ff8fa8"/>
          ${smile(150, 152, 20, 8)}
          <path d="M120 156 L100 152 M120 162 L100 164 M180 156 L200 152 M180 162 L200 164" stroke="#34455c" stroke-width="2" stroke-linecap="round"/>
        </g>
      </svg>`),

    A.obj('bear', '곰', 'animal', '🐻', '으르렁', `
      <svg viewBox="0 0 300 300" class="obj-svg">
        <g class="part" data-part="ears" data-name="귀">
          <circle cx="112" cy="92" r="18"/><circle cx="188" cy="92" r="18"/>
        </g>
        <ellipse class="part" data-part="body" data-name="몸통" cx="150" cy="214" rx="62" ry="56"/>
        <ellipse class="part" data-part="belly" data-name="배" cx="150" cy="224" rx="40" ry="40"/>
        <g class="part" data-part="legs" data-name="발">
          <ellipse cx="116" cy="260" rx="20" ry="14"/><ellipse cx="184" cy="260" rx="20" ry="14"/>
        </g>
        <circle class="part" data-part="head" data-name="얼굴" cx="150" cy="132" r="48"/>
        <ellipse class="part" data-part="muzzle" data-name="입 주변" cx="150" cy="154" rx="28" ry="20"/>
        <g class="fixed">
          ${eyes(132, 126, 168, 126, 9)}
          ${blush(116, 148, 184, 148, 10, 6)}
          <ellipse cx="150" cy="146" rx="9" ry="7" fill="#5a3a22"/>
          ${smile(150, 158, 22, 9)}
        </g>
      </svg>`),

    A.obj('penguin', '펭귄', 'animal', '🐧', '펭펭', `
      <svg viewBox="0 0 300 300" class="obj-svg">
        <g class="part" data-part="feet" data-name="발">
          <ellipse cx="126" cy="266" rx="20" ry="10"/><ellipse cx="174" cy="266" rx="20" ry="10"/>
        </g>
        <path class="part" data-part="wing-left" data-name="왼쪽 날개" d="M94 158 Q64 200 82 246 Q100 238 100 202 Z"/>
        <path class="part" data-part="wing-right" data-name="오른쪽 날개" d="M206 158 Q236 200 218 246 Q200 238 200 202 Z"/>
        <ellipse class="part" data-part="body" data-name="몸통" cx="150" cy="196" rx="60" ry="74"/>
        <ellipse class="part" data-part="belly" data-name="배" cx="150" cy="208" rx="40" ry="56"/>
        <circle class="part" data-part="head" data-name="머리" cx="150" cy="108" r="42"/>
        <path class="part" data-part="beak" data-name="부리" d="M150 118 L180 132 L150 140 Z"/>
        <g class="fixed">
          ${eyes(136, 104, 164, 104, 8)}
          ${blush(120, 124, 180, 124, 8, 5)}
        </g>
      </svg>`),

    A.obj('giraffe', '기린', 'animal', '🦒', '끼룩', `
      <svg viewBox="0 0 300 300" class="obj-svg">
        <path class="part" data-part="tail" data-name="꼬리" d="M214 190 Q246 196 252 220 Q240 220 234 208 Q228 200 214 200 Z"/>
        <g class="part" data-part="legs" data-name="다리">
          <rect x="118" y="214" width="24" height="56" rx="12"/><rect x="168" y="214" width="24" height="56" rx="12"/>
        </g>
        <ellipse class="part" data-part="body" data-name="몸통" cx="158" cy="184" rx="62" ry="46"/>
        <path class="part" data-part="neck" data-name="목" d="M186 166 Q202 104 206 62 L238 66 Q232 128 214 184 Z"/>
        <ellipse class="part" data-part="head" data-name="머리" cx="230" cy="58" rx="30" ry="20"/>
        <g class="part" data-part="spots" data-name="무늬">
          <circle cx="140" cy="170" r="8"/><circle cx="168" cy="162" r="6"/><circle cx="188" cy="180" r="7"/><circle cx="124" cy="192" r="6"/>
        </g>
        <g class="part" data-part="horns" data-name="뿔">
          <rect x="218" y="32" width="6" height="18" rx="3"/><rect x="238" y="32" width="6" height="18" rx="3"/>
          <circle cx="221" cy="30" r="6"/><circle cx="241" cy="30" r="6"/>
        </g>
        <g class="fixed">
          ${eyes(226, 52, 244, 54, 6)}
          ${smile(232, 66, 16, 6)}
        </g>
      </svg>`),

    A.obj('monkey', '원숭이', 'animal', '🐵', '우끼끼', `
      <svg viewBox="0 0 300 300" class="obj-svg">
        <path class="part" data-part="tail" data-name="꼬리" d="M108 206 Q66 202 62 170 Q64 148 86 150 Q96 154 92 166 Q86 178 100 188 Z"/>
        <g class="part" data-part="arms" data-name="팔">
          <path d="M104 170 Q78 190 82 218 Q92 222 102 208 Q110 192 118 184 Z"/>
          <path d="M196 170 Q222 190 218 218 Q208 222 198 208 Q190 192 182 184 Z"/>
        </g>
        <ellipse class="part" data-part="body" data-name="몸통" cx="150" cy="198" rx="50" ry="54"/>
        <g class="part" data-part="legs" data-name="다리">
          <ellipse cx="126" cy="250" rx="18" ry="16"/><ellipse cx="174" cy="250" rx="18" ry="16"/>
        </g>
        <g class="part" data-part="ears" data-name="귀">
          <circle cx="106" cy="122" r="18"/><circle cx="194" cy="122" r="18"/>
        </g>
        <circle class="part" data-part="head" data-name="머리" cx="150" cy="124" r="44"/>
        <ellipse class="part" data-part="face" data-name="얼굴" cx="150" cy="136" rx="32" ry="30"/>
        <g class="fixed">
          ${eyes(134, 128, 166, 128, 8)}
          <ellipse cx="150" cy="140" rx="5" ry="4" fill="#5a3a22"/>
          ${smile(150, 150, 22, 9)}
        </g>
      </svg>`),

    A.obj('cat', '고양이', 'animal', '🐱', '야옹', `
      <svg viewBox="0 0 300 300" class="obj-svg">
        <path class="part" data-part="tail" data-name="꼬리" d="M206 220 Q250 216 254 184 Q254 168 240 170 Q234 186 226 198 Q218 208 206 208 Z"/>
        <ellipse class="part" data-part="body" data-name="몸통" cx="150" cy="210" rx="54" ry="52"/>
        <ellipse class="part" data-part="belly" data-name="배" cx="150" cy="218" rx="32" ry="34"/>
        <g class="part" data-part="paws" data-name="발">
          <ellipse cx="116" cy="256" rx="20" ry="12"/><ellipse cx="184" cy="256" rx="20" ry="12"/>
        </g>
        <g class="part" data-part="ears" data-name="귀">
          <path d="M112 104 L108 62 L146 90 Z"/><path d="M188 104 L192 62 L154 90 Z"/>
        </g>
        <circle class="part" data-part="head" data-name="얼굴" cx="150" cy="126" r="46"/>
        <ellipse class="part" data-part="nose" data-name="코" cx="150" cy="144" rx="8" ry="6"/>
        <g class="fixed">
          ${eyes(132, 120, 168, 120, 9)}
          ${blush(116, 142, 184, 142, 10, 6)}
          ${smile(150, 152, 22, 8)}
          <path d="M122 148 L100 144 M122 154 L100 156 M178 148 L200 144 M178 154 L200 156" stroke="#34455c" stroke-width="2" stroke-linecap="round"/>
        </g>
      </svg>`),

    A.obj('dog', '강아지', 'animal', '🐶', '멍멍', `
      <svg viewBox="0 0 300 300" class="obj-svg">
        <path class="part" data-part="tail" data-name="꼬리" d="M208 216 Q248 212 252 184 Q250 170 238 174 Q234 190 226 200 Q218 208 206 206 Z"/>
        <ellipse class="part" data-part="body" data-name="몸통" cx="150" cy="210" rx="56" ry="50"/>
        <g class="part" data-part="paws" data-name="발">
          <ellipse cx="116" cy="254" rx="20" ry="12"/><ellipse cx="184" cy="254" rx="20" ry="12"/>
        </g>
        <g class="part" data-part="ears" data-name="귀">
          <ellipse cx="110" cy="110" rx="18" ry="32" transform="rotate(-18 110 110)"/>
          <ellipse cx="190" cy="110" rx="18" ry="32" transform="rotate(18 190 110)"/>
        </g>
        <circle class="part" data-part="head" data-name="얼굴" cx="150" cy="128" r="46"/>
        <ellipse class="part" data-part="muzzle" data-name="입 주변" cx="150" cy="150" rx="28" ry="20"/>
        <path class="part" data-part="tongue" data-name="혀" d="M142 162 Q142 182 150 182 Q158 182 158 162 Z"/>
        <g class="fixed">
          ${eyes(132, 122, 168, 122, 9)}
          ${blush(116, 144, 184, 144, 10, 6)}
          <ellipse cx="150" cy="142" rx="9" ry="7" fill="#5a3a22"/>
          ${smile(150, 156, 22, 9)}
        </g>
      </svg>`),

    A.obj('owl', '부엉이', 'animal', '🦉', '부엉부엉', `
      <svg viewBox="0 0 300 300" class="obj-svg">
        <path class="part" data-part="wing-left" data-name="왼쪽 날개" d="M104 160 Q66 200 84 254 Q104 246 104 208 Z"/>
        <path class="part" data-part="wing-right" data-name="오른쪽 날개" d="M196 160 Q234 200 216 254 Q196 246 196 208 Z"/>
        <ellipse class="part" data-part="body" data-name="몸통" cx="150" cy="196" rx="58" ry="72"/>
        <ellipse class="part" data-part="belly" data-name="배" cx="150" cy="210" rx="38" ry="52"/>
        <g class="part" data-part="tufts" data-name="깃털 귀">
          <path d="M112 92 L100 60 L136 78 Z"/><path d="M188 92 L200 60 L164 78 Z"/>
        </g>
        <circle class="part" data-part="head" data-name="머리" cx="150" cy="116" r="48"/>
        <path class="part" data-part="beak" data-name="부리" d="M150 122 L168 140 L150 148 L132 140 Z"/>
        <g class="fixed">
          <circle cx="128" cy="110" r="18" fill="#fff" stroke="#34455c" stroke-width="3"/>
          <circle cx="172" cy="110" r="18" fill="#fff" stroke="#34455c" stroke-width="3"/>
          <circle cx="128" cy="110" r="8" fill="#34455c"/><circle cx="172" cy="110" r="8" fill="#34455c"/>
          <circle cx="124" cy="106" r="3" fill="#fff"/><circle cx="168" cy="106" r="3" fill="#fff"/>
        </g>
      </svg>`)
  );
})(window.CC_ART);
