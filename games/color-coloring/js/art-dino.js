/* 색칠 놀이터 - 공룡 10종 */
(function (A) {
  'use strict';
  var eyes = A.eyes;
  var blush = A.blush;
  var smile = A.smile;

  A.OBJECTS.push(

    A.obj('trex', '티라노사우루스', 'dino', '🦖', '크앙', `
      <svg viewBox="0 0 300 300" class="obj-svg">
        <path class="part" data-part="tail" data-name="꼬리" d="M92 184 Q42 198 22 232 Q54 228 72 214 Q82 200 100 196 Z"/>
        <path class="part" data-part="leg-back" data-name="뒷다리" d="M110 206 L104 254 Q104 266 116 266 L134 266 Q142 266 140 254 L136 206 Z"/>
        <path class="part" data-part="leg-front" data-name="앞다리" d="M162 206 L156 254 Q156 266 168 266 L186 266 Q194 266 192 254 L188 206 Z"/>
        <ellipse class="part" data-part="body" data-name="몸통" cx="145" cy="162" rx="64" ry="60"/>
        <ellipse class="part" data-part="belly" data-name="배" cx="152" cy="180" rx="40" ry="36"/>
        <path class="part" data-part="head" data-name="머리" d="M176 116 Q228 96 254 124 Q266 142 252 156 L198 168 Q180 148 176 116 Z"/>
        <path class="part" data-part="arm" data-name="팔" d="M196 158 Q220 162 224 180 Q214 186 202 178 Z"/>
        <g class="fixed">
          ${eyes(226, 132, 246, 136, 8)}
          ${smile(238, 150, 22, 8)}
          <path d="M204 140 L216 146 M198 156 L210 160" stroke="#34455c" stroke-width="3" stroke-linecap="round"/>
          <path d="M112 262 L104 268 M128 262 L122 268 M166 262 L158 268 M182 262 L176 268" stroke="#34455c" stroke-width="3" stroke-linecap="round"/>
        </g>
      </svg>`),

    A.obj('triceratops', '트리케라톱스', 'dino', '🦕', '크앙', `
      <svg viewBox="0 0 300 300" class="obj-svg">
        <path class="part" data-part="tail" data-name="꼬리" d="M212 190 Q258 194 278 216 Q252 222 236 210 Q224 202 210 200 Z"/>
        <path class="part" data-part="leg-back" data-name="뒷다리" d="M118 208 L112 254 Q112 264 124 264 L140 264 Q148 264 146 254 L142 208 Z"/>
        <path class="part" data-part="leg-front" data-name="앞다리" d="M180 208 L174 254 Q174 264 186 264 L202 264 Q210 264 208 254 L204 208 Z"/>
        <ellipse class="part" data-part="body" data-name="몸통" cx="168" cy="176" rx="66" ry="50"/>
        <path class="part" data-part="frill" data-name="프릴" d="M96 118 Q58 98 52 142 Q54 184 94 190 Q124 192 128 150 Z"/>
        <path class="part" data-part="head" data-name="머리" d="M96 130 Q142 110 174 142 Q182 162 160 178 L110 178 Q88 160 96 130 Z"/>
        <path class="part" data-part="horn1" data-name="뿔" d="M102 138 L78 122 L94 154 Z"/>
        <path class="part" data-part="horn2" data-name="뿔" d="M112 124 L98 104 L120 126 Z"/>
        <path class="part" data-part="nosehorn" data-name="코뿔" d="M84 156 L62 158 L82 168 Z"/>
        <g class="fixed">
          ${eyes(132, 146, 154, 148, 8)}
          ${smile(142, 164, 20, 7)}
          ${blush(120, 160, 166, 162, 9, 5)}
        </g>
      </svg>`),

    A.obj('brachiosaurus', '브라키오사우루스', 'dino', '🦕', '끼룩', `
      <svg viewBox="0 0 300 300" class="obj-svg">
        <path class="part" data-part="tail" data-name="꼬리" d="M92 192 Q40 196 20 226 Q54 224 74 214 Q84 204 100 202 Z"/>
        <path class="part" data-part="leg-back" data-name="뒷다리" d="M116 200 L110 252 Q110 264 122 264 L140 264 Q148 264 146 252 L142 200 Z"/>
        <path class="part" data-part="leg-front" data-name="앞다리" d="M178 200 L172 252 Q172 264 184 264 L202 264 Q210 264 208 252 L204 200 Z"/>
        <ellipse class="part" data-part="body" data-name="몸통" cx="156" cy="182" rx="72" ry="48"/>
        <path class="part" data-part="neck" data-name="목" d="M190 166 Q216 104 220 58 L252 62 Q248 126 214 190 Z"/>
        <ellipse class="part" data-part="head" data-name="머리" cx="244" cy="52" rx="30" ry="20"/>
        <g class="part" data-part="spots" data-name="무늬">
          <circle cx="140" cy="166" r="8"/><circle cx="168" cy="156" r="6"/><circle cx="186" cy="180" r="7"/><circle cx="126" cy="192" r="6"/>
        </g>
        <g class="fixed">
          ${eyes(240, 46, 256, 48, 7)}
          ${smile(246, 60, 16, 6)}
        </g>
      </svg>`),

    A.obj('stegosaurus', '스테고사우루스', 'dino', '🦕', '크앙', `
      <svg viewBox="0 0 300 300" class="obj-svg">
        <path class="part" data-part="tail" data-name="꼬리" d="M214 196 Q262 198 282 222 Q252 228 234 214 Q224 206 210 204 Z"/>
        <path class="part" data-part="leg-back" data-name="뒷다리" d="M118 204 L112 252 Q112 262 124 262 L140 262 Q148 262 146 252 L142 204 Z"/>
        <path class="part" data-part="leg-front" data-name="앞다리" d="M180 204 L174 252 Q174 262 186 262 L202 262 Q210 262 208 252 L204 204 Z"/>
        <ellipse class="part" data-part="body" data-name="몸통" cx="162" cy="184" rx="74" ry="46"/>
        <g class="part" data-part="plates" data-name="등판">
          <path d="M110 160 L124 112 L138 160 Z"/>
          <path d="M136 154 L152 96 L168 154 Z"/>
          <path d="M166 152 L184 92 L202 152 Z"/>
          <path d="M196 158 L212 116 L226 160 Z"/>
        </g>
        <path class="part" data-part="head" data-name="머리" d="M84 186 Q56 178 52 196 Q54 214 82 214 Q100 210 100 196 Q98 186 84 186 Z"/>
        <g class="part" data-part="spikes" data-name="꼬리 가시">
          <path d="M250 196 L262 178 L270 200 Z"/><path d="M272 208 L286 194 L290 218 Z"/>
        </g>
        <g class="fixed">
          ${eyes(76, 196, 92, 197, 6)}
          <path d="M96 176 L116 170 M108 166 L126 160" stroke="#34455c" stroke-width="3" opacity="0.35"/>
        </g>
      </svg>`),

    A.obj('pteranodon', '프테라노돈', 'dino', '🦕', '끼룩끼룩', `
      <svg viewBox="0 0 300 300" class="obj-svg">
        <path class="part" data-part="wing-left" data-name="왼쪽 날개" d="M142 152 Q82 88 22 104 Q56 152 118 188 Z"/>
        <path class="part" data-part="wing-right" data-name="오른쪽 날개" d="M158 152 Q218 88 278 104 Q244 152 182 188 Z"/>
        <ellipse class="part" data-part="body" data-name="몸통" cx="150" cy="168" rx="26" ry="44"/>
        <path class="part" data-part="head" data-name="머리" d="M150 84 Q176 84 178 108 Q178 126 150 126 Q122 126 122 108 Q122 84 150 84 Z"/>
        <path class="part" data-part="beak" data-name="부리" d="M150 108 L214 128 L154 136 Z"/>
        <path class="part" data-part="crest" data-name="볏" d="M138 86 L100 58 L146 72 Z"/>
        <path class="part" data-part="legs" data-name="발" d="M136 204 L126 226 L140 226 L144 208 Z M164 204 L174 226 L160 226 L156 208 Z"/>
        <g class="fixed">
          ${eyes(140, 104, 160, 104, 7)}
        </g>
      </svg>`),

    A.obj('raptor', '벨로시랩터', 'dino', '🦖', '크르릉', `
      <svg viewBox="0 0 300 300" class="obj-svg">
        <path class="part" data-part="tail" data-name="꼬리" d="M96 184 Q48 190 26 220 Q56 220 74 210 Q84 200 102 198 Z"/>
        <path class="part" data-part="leg-back" data-name="뒷다리" d="M120 204 L112 252 Q112 262 124 262 L138 262 Q146 262 144 252 L142 204 Z"/>
        <path class="part" data-part="leg-front" data-name="앞다리" d="M168 204 L160 252 Q160 262 172 262 L186 262 Q194 262 192 252 L190 204 Z"/>
        <ellipse class="part" data-part="body" data-name="몸통" cx="150" cy="164" rx="54" ry="50"/>
        <path class="part" data-part="head" data-name="머리" d="M184 118 Q232 108 248 134 Q254 148 240 156 L194 162 Q182 144 184 118 Z"/>
        <path class="part" data-part="arm" data-name="팔" d="M190 158 Q208 164 208 178 Q198 182 190 172 Z"/>
        <path class="part" data-part="crest" data-name="깃털" d="M186 120 Q168 96 182 82 Q204 96 208 122 Z"/>
        <g class="fixed">
          ${eyes(222, 130, 240, 134, 7)}
          ${smile(230, 146, 18, 7)}
          <path d="M124 258 L116 264 M180 258 L172 264" stroke="#34455c" stroke-width="3" stroke-linecap="round"/>
        </g>
      </svg>`),

    A.obj('ankylosaurus', '안킬로사우루스', 'dino', '🦕', '쿵쿵', `
      <svg viewBox="0 0 300 300" class="obj-svg">
        <path class="part" data-part="tail" data-name="꼬리" d="M212 200 Q258 200 274 222 Q286 238 268 240 Q254 232 244 218 Q230 210 210 210 Z"/>
        <circle class="part" data-part="club" data-name="꼬리 방망이" cx="278" cy="228" r="18"/>
        <path class="part" data-part="leg-back" data-name="뒷다리" d="M120 208 L114 252 Q114 262 126 262 L142 262 Q150 262 148 252 L144 208 Z"/>
        <path class="part" data-part="leg-front" data-name="앞다리" d="M180 208 L174 252 Q174 262 186 262 L202 262 Q210 262 208 252 L204 208 Z"/>
        <ellipse class="part" data-part="body" data-name="몸통" cx="166" cy="190" rx="72" ry="44"/>
        <path class="part" data-part="shell" data-name="등껍질" d="M98 182 Q108 128 170 124 Q230 128 240 182 Q210 200 166 200 Q120 200 98 182 Z"/>
        <g class="part" data-part="spikes" data-name="가시">
          <path d="M104 160 L92 140 L118 152 Z"/><path d="M132 140 L128 116 L152 136 Z"/>
          <path d="M200 136 L212 114 L216 142 Z"/><path d="M228 158 L244 140 L240 166 Z"/>
        </g>
        <path class="part" data-part="head" data-name="머리" d="M84 188 Q56 184 52 202 Q54 220 82 218 Q98 212 98 202 Q96 190 84 188 Z"/>
        <g class="fixed">
          ${eyes(74, 198, 90, 199, 6)}
          <circle cx="140" cy="160" r="5" fill="#34455c" opacity="0.3"/>
          <circle cx="172" cy="150" r="5" fill="#34455c" opacity="0.3"/>
          <circle cx="198" cy="168" r="5" fill="#34455c" opacity="0.3"/>
        </g>
      </svg>`),

    A.obj('parasaur', '파라사우롤로푸스', 'dino', '🦕', '끼룩', `
      <svg viewBox="0 0 300 300" class="obj-svg">
        <path class="part" data-part="tail" data-name="꼬리" d="M96 190 Q46 196 24 224 Q56 222 76 212 Q86 202 104 200 Z"/>
        <path class="part" data-part="leg-back" data-name="뒷다리" d="M120 206 L114 252 Q114 262 126 262 L142 262 Q150 262 148 252 L144 206 Z"/>
        <path class="part" data-part="leg-front" data-name="앞다리" d="M178 206 L172 252 Q172 262 184 262 L200 262 Q208 262 206 252 L202 206 Z"/>
        <ellipse class="part" data-part="body" data-name="몸통" cx="152" cy="176" rx="60" ry="48"/>
        <ellipse class="part" data-part="belly" data-name="배" cx="158" cy="190" rx="34" ry="28"/>
        <path class="part" data-part="head" data-name="머리" d="M182 126 Q220 116 236 140 Q242 154 228 162 L190 166 Q178 148 182 126 Z"/>
        <path class="part" data-part="crest" data-name="볏" d="M190 128 Q160 104 166 74 Q196 82 214 120 Z"/>
        <g class="fixed">
          ${eyes(212, 138, 228, 140, 7)}
          ${smile(220, 152, 16, 6)}
        </g>
      </svg>`),

    A.obj('spino', '스피노사우루스', 'dino', '🦖', '크앙', `
      <svg viewBox="0 0 300 300" class="obj-svg">
        <path class="part" data-part="tail" data-name="꼬리" d="M92 192 Q42 198 20 228 Q54 226 74 214 Q84 204 100 202 Z"/>
        <path class="part" data-part="leg-back" data-name="뒷다리" d="M116 206 L110 252 Q110 262 122 262 L138 262 Q146 262 144 252 L140 206 Z"/>
        <path class="part" data-part="leg-front" data-name="앞다리" d="M176 206 L170 252 Q170 262 182 262 L198 262 Q206 262 204 252 L200 206 Z"/>
        <ellipse class="part" data-part="body" data-name="몸통" cx="150" cy="178" rx="62" ry="46"/>
        <path class="part" data-part="sail" data-name="돛" d="M104 156 Q112 82 150 70 Q190 82 198 156 Q174 166 150 166 Q124 166 104 156 Z"/>
        <path class="part" data-part="head" data-name="머리" d="M186 132 Q232 124 260 142 Q268 152 256 160 L192 170 Q182 150 186 132 Z"/>
        <path class="part" data-part="snout" data-name="주둥이" d="M236 146 L282 148 Q288 158 278 164 L242 162 Z"/>
        <g class="fixed">
          ${eyes(224, 142, 244, 144, 7)}
          <path d="M130 160 L130 86 M150 160 L150 74 M170 160 L170 86" stroke="#34455c" stroke-width="3" opacity="0.35"/>
          <path d="M250 158 L262 158 M250 164 L262 164" stroke="#fff" stroke-width="3"/>
        </g>
      </svg>`),

    A.obj('diplodocus', '디플로도쿠스', 'dino', '🦕', '끼룩', `
      <svg viewBox="0 0 300 300" class="obj-svg">
        <path class="part" data-part="tail" data-name="꼬리" d="M96 192 Q38 198 16 230 Q52 228 72 214 Q84 204 102 202 Z"/>
        <path class="part" data-part="leg-back" data-name="뒷다리" d="M120 202 L114 252 Q114 262 126 262 L142 262 Q150 262 148 252 L144 202 Z"/>
        <path class="part" data-part="leg-front" data-name="앞다리" d="M176 202 L170 252 Q170 262 182 262 L198 262 Q206 262 204 252 L200 202 Z"/>
        <ellipse class="part" data-part="body" data-name="몸통" cx="156" cy="180" rx="66" ry="46"/>
        <path class="part" data-part="neck" data-name="목" d="M194 166 Q226 120 232 76 L262 80 Q256 132 216 190 Z"/>
        <ellipse class="part" data-part="head" data-name="머리" cx="252" cy="68" rx="26" ry="18"/>
        <g class="part" data-part="spots" data-name="무늬">
          <circle cx="140" cy="166" r="7"/><circle cx="168" cy="158" r="6"/><circle cx="188" cy="182" r="7"/><circle cx="124" cy="190" r="5"/>
        </g>
        <g class="fixed">
          ${eyes(248, 62, 262, 64, 6)}
          ${smile(254, 76, 14, 5)}
        </g>
      </svg>`)
  );
})(window.CC_ART);
