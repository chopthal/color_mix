/* 색칠 놀이터 - 음식 10종 */
(function (A) {
  'use strict';
  A.OBJECTS.push(

    A.obj('apple', '사과', 'food', '🍎', '냠냠', `
      <svg viewBox="0 0 300 300" class="obj-svg">
        <path class="part" data-part="body" data-name="사과" d="M150 92 Q120 68 92 96 Q64 130 84 190 Q104 248 150 248 Q196 248 216 190 Q236 130 208 96 Q180 68 150 92 Z"/>
        <path class="part" data-part="stem" data-name="꼭지" d="M148 92 Q144 66 156 52 L168 56 Q158 70 160 92 Z"/>
        <path class="part" data-part="leaf" data-name="잎" d="M160 70 Q190 52 210 66 Q204 90 176 90 Q164 82 160 70 Z"/>
        <ellipse class="part" data-part="highlight" data-name="하이라이트" cx="112" cy="128" rx="16" ry="26" transform="rotate(24 112 128)"/>
      </svg>`),

    A.obj('banana', '바나나', 'food', '🍌', '냠냠', `
      <svg viewBox="0 0 300 300" class="obj-svg">
        <path class="part" data-part="banana1" data-name="바나나" d="M64 200 Q74 108 176 64 Q206 52 226 66 Q168 96 140 156 Q124 192 96 212 Q72 214 64 200 Z"/>
        <path class="part" data-part="banana2" data-name="바나나" d="M88 214 Q96 132 188 88 Q214 78 230 90 Q180 116 156 168 Q142 198 116 220 Q98 224 88 214 Z"/>
        <path class="part" data-part="tip1" data-name="꼭지" d="M226 66 Q240 60 246 70 Q242 80 230 76 Z"/>
        <path class="part" data-part="tip2" data-name="꼭지" d="M230 90 Q244 84 250 94 Q246 104 234 100 Z"/>
        <g class="fixed">
          <path d="M86 196 Q108 150 132 122 M108 208 Q130 166 152 138" stroke="#34455c" stroke-width="3" opacity="0.3" fill="none"/>
        </g>
      </svg>`),

    A.obj('watermelon', '수박', 'food', '🍉', '냠냠', `
      <svg viewBox="0 0 300 300" class="obj-svg">
        <path class="part" data-part="rind" data-name="껍질" d="M28 160 A122 122 0 0 0 272 160 Z"/>
        <path class="part" data-part="flesh" data-name="속" d="M50 160 A100 100 0 0 0 250 160 Z"/>
        <g class="part" data-part="seeds" data-name="씨">
          <ellipse cx="110" cy="190" rx="5" ry="8"/><ellipse cx="150" cy="208" rx="5" ry="8"/>
          <ellipse cx="190" cy="190" rx="5" ry="8"/><ellipse cx="130" cy="222" rx="5" ry="8"/>
          <ellipse cx="170" cy="222" rx="5" ry="8"/>
        </g>
        <g class="fixed">
          <path d="M38 166 A112 112 0 0 0 262 166" fill="none" stroke="#34455c" stroke-width="3" opacity="0.35"/>
        </g>
      </svg>`),

    A.obj('strawberry', '딸기', 'food', '🍓', '냠냠', `
      <svg viewBox="0 0 300 300" class="obj-svg">
        <path class="part" data-part="body" data-name="딸기" d="M150 252 Q70 214 70 152 Q70 112 110 102 Q150 94 190 102 Q230 112 230 152 Q230 214 150 252 Z"/>
        <g class="part" data-part="leaves" data-name="잎">
          <path d="M150 108 L118 78 L146 84 L136 56 L154 78 L166 54 L168 86 L196 76 L170 106 Z"/>
        </g>
        <g class="part" data-part="seeds" data-name="씨">
          <ellipse cx="116" cy="148" rx="4" ry="6"/><ellipse cx="150" cy="138" rx="4" ry="6"/>
          <ellipse cx="184" cy="148" rx="4" ry="6"/><ellipse cx="132" cy="176" rx="4" ry="6"/>
          <ellipse cx="168" cy="176" rx="4" ry="6"/><ellipse cx="150" cy="204" rx="4" ry="6"/>
        </g>
        <rect class="part" data-part="stem" data-name="꼭지" x="146" y="44" width="8" height="28" rx="4"/>
      </svg>`),

    A.obj('icecream', '아이스크림', 'food', '🍦', '냠냠', `
      <svg viewBox="0 0 300 300" class="obj-svg">
        <path class="part" data-part="cone" data-name="콘" d="M108 172 L192 172 L150 268 Z"/>
        <circle class="part" data-part="scoop1" data-name="아이스크림" cx="122" cy="148" r="42"/>
        <circle class="part" data-part="scoop2" data-name="아이스크림" cx="178" cy="148" r="42"/>
        <circle class="part" data-part="scoop3" data-name="아이스크림" cx="150" cy="102" r="38"/>
        <circle class="part" data-part="cherry" data-name="체리" cx="150" cy="58" r="12"/>
        <g class="part" data-part="sprinkles" data-name="스프링클">
          <rect x="108" y="132" width="10" height="4" rx="2" transform="rotate(24 113 134)"/>
          <rect x="172" y="126" width="10" height="4" rx="2" transform="rotate(-30 177 128)"/>
          <rect x="138" y="94" width="10" height="4" rx="2" transform="rotate(12 143 96)"/>
          <rect x="160" y="166" width="10" height="4" rx="2" transform="rotate(40 165 168)"/>
        </g>
        <g class="fixed">
          <path d="M124 190 L140 236 M150 190 L150 242 M176 190 L160 236" stroke="#34455c" stroke-width="3" opacity="0.3"/>
          <path d="M144 58 Q144 44 156 40" stroke="#34455c" stroke-width="3" fill="none" stroke-linecap="round"/>
        </g>
      </svg>`),

    A.obj('cake', '케이크', 'food', '🎂', '냠냠', `
      <svg viewBox="0 0 300 300" class="obj-svg">
        <ellipse class="part" data-part="plate" data-name="접시" cx="150" cy="258" rx="112" ry="16"/>
        <rect class="part" data-part="layer1" data-name="아래 케이크" x="58" y="190" width="184" height="58" rx="12"/>
        <rect class="part" data-part="layer2" data-name="위 케이크" x="76" y="142" width="148" height="50" rx="12"/>
        <path class="part" data-part="frosting" data-name="크림" d="M70 146 Q70 118 100 118 Q112 104 136 112 Q150 96 168 110 Q192 100 204 116 Q234 118 234 146 L226 164 Q214 150 206 164 Q196 150 186 164 Q176 150 166 164 Q156 150 146 164 Q136 150 126 164 Q116 150 106 164 Q96 150 86 164 Z"/>
        <rect class="part" data-part="candle" data-name="초" x="144" y="80" width="12" height="38" rx="6"/>
        <path class="part" data-part="flame" data-name="불꽃" d="M150 56 Q140 70 150 78 Q160 70 150 56 Z"/>
        <g class="fixed">
          <path d="M86 208 L214 208 M86 224 L214 224" stroke="#34455c" stroke-width="3" opacity="0.25"/>
          <circle cx="100" cy="196" r="4" fill="#fff" opacity="0.8"/>
          <circle cx="200" cy="196" r="4" fill="#fff" opacity="0.8"/>
        </g>
      </svg>`),

    A.obj('donut', '도넛', 'food', '🍩', '냠냠', `
      <svg viewBox="0 0 300 300" class="obj-svg">
        <path class="part" data-part="dough" data-name="도넛" fill-rule="evenodd" d="M150 46 A104 104 0 1 0 150 254 A104 104 0 1 0 150 46 Z M150 116 A34 34 0 1 1 150 184 A34 34 0 1 1 150 116 Z"/>
        <path class="part" data-part="icing" data-name="아이싱" fill-rule="evenodd" d="M150 58 A92 92 0 0 1 150 242 A92 92 0 0 1 150 58 Z M150 116 A34 34 0 1 1 150 184 A34 34 0 1 1 150 116 Z"/>
        <g class="part" data-part="sprinkles" data-name="스프링클">
          <rect x="98" y="104" width="14" height="5" rx="2" transform="rotate(28 105 106)"/>
          <rect x="176" y="96" width="14" height="5" rx="2" transform="rotate(-24 183 98)"/>
          <rect x="196" y="150" width="14" height="5" rx="2" transform="rotate(60 203 152)"/>
          <rect x="90" y="166" width="14" height="5" rx="2" transform="rotate(-50 97 168)"/>
          <rect x="140" y="82" width="14" height="5" rx="2" transform="rotate(10 147 84)"/>
          <rect x="146" y="196" width="14" height="5" rx="2" transform="rotate(34 153 198)"/>
        </g>
      </svg>`),

    A.obj('pizza', '피자', 'food', '🍕', '냠냠', `
      <svg viewBox="0 0 300 300" class="obj-svg">
        <circle class="part" data-part="crust" data-name="도우" cx="150" cy="150" r="112"/>
        <circle class="part" data-part="cheese" data-name="치즈" cx="150" cy="150" r="94"/>
        <g class="part" data-part="pepperoni" data-name="페퍼로니">
          <circle cx="110" cy="110" r="16"/><circle cx="186" cy="104" r="15"/>
          <circle cx="112" cy="190" r="15"/><circle cx="196" cy="186" r="16"/>
          <circle cx="150" cy="150" r="14"/>
        </g>
        <g class="part" data-part="toppings" data-name="토핑">
          <ellipse cx="150" cy="96" rx="10" ry="6"/><ellipse cx="96" cy="150" rx="6" ry="10"/>
          <ellipse cx="204" cy="150" rx="6" ry="10"/><ellipse cx="150" cy="208" rx="10" ry="6"/>
        </g>
        <g class="fixed">
          <path d="M150 150 L78 78 M150 150 L222 78 M150 150 L78 222 M150 150 L222 222" stroke="#34455c" stroke-width="3" opacity="0.3"/>
        </g>
      </svg>`),

    A.obj('cupcake', '컵케이크', 'food', '🧁', '냠냠', `
      <svg viewBox="0 0 300 300" class="obj-svg">
        <path class="part" data-part="wrapper" data-name="컵" d="M92 168 L208 168 L192 254 Q190 262 180 262 L120 262 Q110 262 108 254 Z"/>
        <path class="part" data-part="frosting" data-name="크림" d="M96 170 Q84 140 108 132 Q100 104 128 100 Q132 72 158 80 Q186 70 194 100 Q222 104 216 132 Q240 140 224 170 Z"/>
        <circle class="part" data-part="cherry" data-name="체리" cx="150" cy="62" r="13"/>
        <g class="part" data-part="sprinkles" data-name="스프링클">
          <rect x="112" y="126" width="12" height="4" rx="2" transform="rotate(28 118 128)"/>
          <rect x="170" y="118" width="12" height="4" rx="2" transform="rotate(-26 176 120)"/>
          <rect x="140" y="96" width="12" height="4" rx="2" transform="rotate(12 146 98)"/>
        </g>
        <g class="fixed">
          <path d="M116 186 L124 250 M150 186 L150 254 M184 186 L176 250" stroke="#34455c" stroke-width="3" opacity="0.3"/>
          <path d="M146 62 Q146 48 158 44" stroke="#34455c" stroke-width="3" fill="none" stroke-linecap="round"/>
        </g>
      </svg>`),

    A.obj('carrot', '당근', 'food', '🥕', '냠냠', `
      <svg viewBox="0 0 300 300" class="obj-svg">
        <path class="part" data-part="body" data-name="당근" d="M150 258 Q118 220 112 168 Q110 140 150 132 Q190 140 188 168 Q182 220 150 258 Z"/>
        <g class="part" data-part="leaves" data-name="잎">
          <path d="M150 134 Q132 96 140 60 Q156 84 156 130 Z"/>
          <path d="M148 134 Q118 106 112 74 Q140 92 154 130 Z"/>
          <path d="M152 134 Q182 106 188 74 Q160 92 146 130 Z"/>
        </g>
        <g class="part" data-part="stripes" data-name="줄무늬">
          <rect x="124" y="172" width="24" height="7" rx="3" transform="rotate(12 136 175)"/>
          <rect x="132" y="198" width="24" height="7" rx="3" transform="rotate(12 144 201)"/>
          <rect x="142" y="222" width="20" height="6" rx="3" transform="rotate(12 152 225)"/>
        </g>
      </svg>`)
  );
})(window.CC_ART);
