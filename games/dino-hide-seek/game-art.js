(function () {
  'use strict';

  var DINO = window.DINO || (window.DINO = {});
  var LINE = DINO.LINE || '#34455c';

  function eye(x, y, r) {
    r = r || 7.5;
    return '<circle cx="' + x + '" cy="' + y + '" r="' + r + '" fill="#fff" stroke="' + LINE + '" stroke-width="2.4"/>'
      + '<circle cx="' + (x + 1.2) + '" cy="' + (y + 0.6) + '" r="' + (r * 0.44) + '" fill="#2b3a4a"/>'
      + '<circle cx="' + (x + 2.4) + '" cy="' + (y - 2) + '" r="' + (r * 0.17) + '" fill="#fff"/>';
  }

  function cheek(x, y) {
    return '<circle cx="' + x + '" cy="' + y + '" r="7" fill="#ff93a8" opacity=".45"/>';
  }

  function svgWrap(inner) {
    return '<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" role="img">' + inner + '</svg>';
  }

  function artTheropod(d) {
    var o = d.opts || {};
    var c = d.body, b = d.belly, a = d.accent;
    var sail = '';
    if (o.sail) {
      sail = '<path d="M66 128 C56 94 70 60 98 46 C108 66 110 100 100 128Z" fill="' + a + '" stroke="' + LINE + '" stroke-width="5"/>'
        + '<path d="M80 112 l10 -18 M89 122 l10 -18 M98 126 l8 -16" stroke="' + LINE + '" stroke-width="2.5" opacity=".45"/>';
    } else if (o.smallSail) {
      sail = '<path d="M74 126 C68 106 78 84 96 74 C102 90 104 110 98 128Z" fill="' + a + '" stroke="' + LINE + '" stroke-width="4"/>';
    }

    var head, mouth, eyePos, nose;
    if (o.longSnout) {
      head = 'M110 108 C104 76 128 56 154 56 C178 56 198 70 200 88 C202 106 184 118 162 120 C138 122 118 120 110 108Z';
      mouth = 'M142 108 Q174 120 197 104';
      eyePos = [168, 78];
      nose = '<circle cx="195" cy="84" r="2.4" fill="' + LINE + '"/>';
    } else {
      head = 'M110 108 C104 74 128 52 156 52 C181 52 195 69 193 91 C191 110 172 119 150 119 C132 119 116 117 110 108Z';
      mouth = 'M150 108 Q170 117 190 103';
      eyePos = [166, 78];
      nose = '<circle cx="189" cy="84" r="2.4" fill="' + LINE + '"/>';
    }

    var teeth = o.beak ? '' : (o.longSnout
      ? '<path d="M160 111 l4 8 l4 -8 M176 111 l4 8 l4 -8" fill="#fff" stroke="' + LINE + '" stroke-width="1.4"/>'
      : '<path d="M158 110 l4 8 l4 -8 M172 111 l4 8 l4 -8" fill="#fff" stroke="' + LINE + '" stroke-width="1.4"/>');

    var crest = '';
    if (o.crest === 'double') {
      crest = '<path d="M144 58 l-14 -26 l22 16" fill="' + a + '" stroke="' + LINE + '" stroke-width="4" stroke-linejoin="round"/>'
        + '<path d="M160 54 l4 -25 l12 21" fill="' + a + '" stroke="' + LINE + '" stroke-width="4" stroke-linejoin="round"/>';
    } else if (o.crest === 'ridge') {
      crest = '<path d="M136 56 l8 -10 l6 9 l9 -9 l7 9" fill="none" stroke="' + a + '" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>';
    } else if (o.crest === 'feather' || o.raptor || o.feather) {
      crest = '<path d="M146 54 l-8 -14 l12 8 l4 -14 l6 13 l10 -10 l-6 18" fill="' + a + '" stroke="' + LINE + '" stroke-width="3" stroke-linejoin="round"/>';
    }
    if (o.horns) {
      crest += '<path d="M146 62 l-8 -18 l14 12" fill="#fff8e6" stroke="' + LINE + '" stroke-width="3.2" stroke-linejoin="round"/>'
        + '<path d="M168 60 l5 -19 l9 16" fill="#fff8e6" stroke="' + LINE + '" stroke-width="3.2" stroke-linejoin="round"/>';
    }
    if (o.noseHorn) {
      crest += '<path d="M188 98 l6 -16 l7 16" fill="#fff8e6" stroke="' + LINE + '" stroke-width="3" stroke-linejoin="round"/>';
    }
    if (o.beak) {
      crest += '<path d="M186 90 L204 99 L186 108Z" fill="#ff9d3d" stroke="' + LINE + '" stroke-width="3" stroke-linejoin="round"/>';
    }
    if (o.raptor) {
      crest += '<path d="M56 144 l-22 -12 l18 20 l-24 -2 l22 14" fill="' + a + '" stroke="' + LINE + '" stroke-width="3" stroke-linejoin="round"/>';
    }

    var inner = sail
      + '<path d="M64 140 C40 150 18 142 16 118 C30 128 46 131 63 127Z" fill="' + c + '" stroke="' + LINE + '" stroke-width="6" stroke-linejoin="round"/>'
      + '<ellipse cx="100" cy="132" rx="43" ry="37" fill="' + c + '" stroke="' + LINE + '" stroke-width="6"/>'
      + '<ellipse cx="99" cy="144" rx="26" ry="18" fill="' + b + '"/>'
      + '<rect x="81" y="154" width="21" height="31" rx="10" fill="' + a + '" stroke="' + LINE + '" stroke-width="5"/>'
      + '<rect x="111" y="154" width="21" height="31" rx="10" fill="' + a + '" stroke="' + LINE + '" stroke-width="5"/>'
      + '<path d="' + head + '" fill="' + c + '" stroke="' + LINE + '" stroke-width="6" stroke-linejoin="round"/>'
      + '<path d="' + mouth + '" fill="none" stroke="' + LINE + '" stroke-width="3.4" stroke-linecap="round"/>'
      + teeth + nose
      + '<path d="M120 126 Q108 138 118 150" fill="none" stroke="' + LINE + '" stroke-width="8" stroke-linecap="round"/>'
      + eye(eyePos[0], eyePos[1])
      + cheek(o.longSnout ? 154 : 150, 99)
      + crest;

    if (o.small) inner = '<g transform="translate(24 22) scale(0.78)">' + inner + '</g>';
    if (o.big) inner = '<g transform="translate(-4 -4) scale(1.03)">' + inner + '</g>';
    return svgWrap(inner);
  }

  function artCeratops(d) {
    var c = d.body, b = d.belly, a = d.accent;
    return svgWrap(
      '<path d="M58 146 C34 152 18 140 20 118 C34 132 48 136 64 134Z" fill="' + c + '" stroke="' + LINE + '" stroke-width="6" stroke-linejoin="round"/>'
      + '<ellipse cx="96" cy="140" rx="43" ry="34" fill="' + c + '" stroke="' + LINE + '" stroke-width="6"/>'
      + '<ellipse cx="95" cy="151" rx="25" ry="16" fill="' + b + '"/>'
      + '<rect x="68" y="158" width="20" height="28" rx="10" fill="' + a + '" stroke="' + LINE + '" stroke-width="5"/>'
      + '<rect x="100" y="158" width="20" height="28" rx="10" fill="' + a + '" stroke="' + LINE + '" stroke-width="5"/>'
      + '<ellipse cx="132" cy="96" rx="39" ry="33" fill="' + a + '" stroke="' + LINE + '" stroke-width="6"/>'
      + '<ellipse cx="154" cy="108" rx="30" ry="26" fill="' + c + '" stroke="' + LINE + '" stroke-width="6"/>'
      + '<path d="M139 86 l-7 -20 l16 13" fill="#fff8e6" stroke="' + LINE + '" stroke-width="3.4" stroke-linejoin="round"/>'
      + '<path d="M163 90 l10 -21 l7 18" fill="#fff8e6" stroke="' + LINE + '" stroke-width="3.4" stroke-linejoin="round"/>'
      + '<path d="M172 122 l7 -16 l8 15" fill="#fff8e6" stroke="' + LINE + '" stroke-width="3.2" stroke-linejoin="round"/>'
      + '<path d="M170 124 Q179 129 187 122" fill="none" stroke="' + LINE + '" stroke-width="3.2" stroke-linecap="round"/>'
      + eye(160, 104) + cheek(147, 119)
    );
  }

  function artSauropod(d) {
    var o = d.opts || {};
    var c = d.body, b = d.belly, a = d.accent;
    var tail = o.whip
      ? '<path d="M60 152 C28 160 8 146 6 120 C22 136 42 142 64 138Z" fill="' + c + '" stroke="' + LINE + '" stroke-width="6" stroke-linejoin="round"/>'
        + '<path d="M8 126 C2 112 6 100 14 94" fill="none" stroke="' + LINE + '" stroke-width="4" stroke-linecap="round"/>'
      : '<path d="M60 154 C36 162 18 150 20 128 C34 144 50 148 64 146Z" fill="' + c + '" stroke="' + LINE + '" stroke-width="6" stroke-linejoin="round"/>';
    var neck = o.whip
      ? 'M118 146 C114 116 120 88 140 72 C152 62 168 66 174 78 C180 91 168 99 158 104 C146 110 138 126 136 148Z'
      : 'M118 144 C112 110 118 76 142 58 C156 47 174 51 181 65 C188 80 175 90 163 96 C149 104 139 122 137 146Z';
    var headX = o.whip ? 166 : 172;
    var bodyRx = o.huge ? 48 : 44;
    var legW = o.huge ? 24 : 21;
    var headY = o.whip ? 74 : 64;
    var inner = tail
      + '<ellipse cx="98" cy="150" rx="' + bodyRx + '" ry="32" fill="' + c + '" stroke="' + LINE + '" stroke-width="6"/>'
      + '<ellipse cx="97" cy="160" rx="26" ry="15" fill="' + b + '"/>'
      + '<rect x="66" y="168" width="' + legW + '" height="24" rx="10" fill="' + a + '" stroke="' + LINE + '" stroke-width="5"/>'
      + '<rect x="96" y="168" width="' + legW + '" height="24" rx="10" fill="' + a + '" stroke="' + LINE + '" stroke-width="5"/>'
      + '<rect x="120" y="168" width="' + legW + '" height="24" rx="10" fill="' + a + '" stroke="' + LINE + '" stroke-width="5"/>'
      + '<path d="' + neck + '" fill="' + c + '" stroke="' + LINE + '" stroke-width="6" stroke-linejoin="round"/>'
      + '<ellipse cx="' + headX + '" cy="' + headY + '" rx="21" ry="17" fill="' + c + '" stroke="' + LINE + '" stroke-width="6"/>'
      + '<circle cx="' + (headX + 19) + '" cy="' + (headY - 4) + '" r="2.6" fill="' + LINE + '"/>'
      + '<path d="M' + (headX - 10) + ' ' + (headY + 24) + ' Q' + (headX + 2) + ' ' + (headY + 29) + ' ' + (headX + 12) + ' ' + (headY + 22) + '" fill="none" stroke="' + LINE + '" stroke-width="3" stroke-linecap="round"/>'
      + eye(headX + 5, headY - 6, 7)
      + cheek(headX - 7, headY + 10);
    if (o.huge) inner = '<g transform="translate(-5 -6) scale(1.05)">' + inner + '</g>';
    return svgWrap(inner);
  }

  function artStego(d) {
    var c = d.body, b = d.belly, a = d.accent;
    var plates = [
      '54,124 66,92 78,124', '74,118 88,82 102,118',
      '98,116 112,78 126,116', '122,120 134,90 144,120'
    ].map(function (pts) {
      return '<polygon points="' + pts + '" fill="' + a + '" stroke="' + LINE + '" stroke-width="4" stroke-linejoin="round"/>';
    }).join('');
    return svgWrap(
      '<path d="M58 150 C34 158 18 146 20 124 C34 140 48 144 62 140Z" fill="' + c + '" stroke="' + LINE + '" stroke-width="6" stroke-linejoin="round"/>'
      + '<path d="M26 128 l-7 -14 l12 6 l2 -13 l6 11" fill="' + a + '" stroke="' + LINE + '" stroke-width="3" stroke-linejoin="round"/>'
      + '<ellipse cx="100" cy="144" rx="44" ry="32" fill="' + c + '" stroke="' + LINE + '" stroke-width="6"/>'
      + '<ellipse cx="100" cy="155" rx="26" ry="15" fill="' + b + '"/>'
      + '<rect x="72" y="166" width="20" height="24" rx="10" fill="' + a + '" stroke="' + LINE + '" stroke-width="5"/>'
      + '<rect x="102" y="166" width="20" height="24" rx="10" fill="' + a + '" stroke="' + LINE + '" stroke-width="5"/>'
      + plates
      + '<ellipse cx="152" cy="134" rx="25" ry="21" fill="' + c + '" stroke="' + LINE + '" stroke-width="6"/>'
      + '<path d="M164 146 Q174 150 180 143" fill="none" stroke="' + LINE + '" stroke-width="3" stroke-linecap="round"/>'
      + eye(160, 130, 7) + cheek(146, 143)
    );
  }

  function artPachy(d) {
    var c = d.body, b = d.belly, a = d.accent;
    return svgWrap(
      '<path d="M58 152 C34 160 18 148 20 126 C34 142 48 146 62 142Z" fill="' + c + '" stroke="' + LINE + '" stroke-width="6" stroke-linejoin="round"/>'
      + '<ellipse cx="98" cy="140" rx="42" ry="34" fill="' + c + '" stroke="' + LINE + '" stroke-width="6"/>'
      + '<ellipse cx="96" cy="151" rx="24" ry="16" fill="' + b + '"/>'
      + '<rect x="74" y="158" width="20" height="28" rx="10" fill="' + a + '" stroke="' + LINE + '" stroke-width="5"/>'
      + '<rect x="104" y="158" width="20" height="28" rx="10" fill="' + a + '" stroke="' + LINE + '" stroke-width="5"/>'
      + '<ellipse cx="150" cy="106" rx="29" ry="26" fill="' + c + '" stroke="' + LINE + '" stroke-width="6"/>'
      + '<ellipse cx="150" cy="78" rx="31" ry="20" fill="' + a + '" stroke="' + LINE + '" stroke-width="6"/>'
      + '<circle cx="136" cy="68" r="5" fill="#fff8e6" stroke="' + LINE + '" stroke-width="2.5"/>'
      + '<circle cx="154" cy="62" r="6" fill="#fff8e6" stroke="' + LINE + '" stroke-width="2.5"/>'
      + '<circle cx="168" cy="72" r="4.5" fill="#fff8e6" stroke="' + LINE + '" stroke-width="2.5"/>'
      + '<path d="M166 120 Q176 124 183 117" fill="none" stroke="' + LINE + '" stroke-width="3.2" stroke-linecap="round"/>'
      + eye(159, 104, 7) + cheek(144, 119)
    );
  }

  function artAnkylo(d) {
    var c = d.body, b = d.belly, a = d.accent;
    var plates = '';
    var xs = [60, 80, 100, 120];
    xs.forEach(function (x, i) {
      plates += '<rect x="' + x + '" y="' + (108 + (i % 2) * 4) + '" width="24" height="18" rx="8" fill="' + a + '" stroke="' + LINE + '" stroke-width="3.5"/>';
    });
    return svgWrap(
      '<path d="M58 152 C34 158 20 150 14 142" fill="none" stroke="' + LINE + '" stroke-width="10" stroke-linecap="round"/>'
      + '<circle cx="18" cy="144" r="17" fill="' + a + '" stroke="' + LINE + '" stroke-width="5"/>'
      + '<path d="M8 132 l-7 -9 l11 3 M6 156 l-10 5 l6 -11 M28 130 l2 -11 l6 10" fill="#fff8e6" stroke="' + LINE + '" stroke-width="2.6" stroke-linejoin="round"/>'
      + '<ellipse cx="101" cy="142" rx="48" ry="30" fill="' + c + '" stroke="' + LINE + '" stroke-width="6"/>'
      + '<ellipse cx="101" cy="152" rx="27" ry="14" fill="' + b + '"/>'
      + '<rect x="70" y="160" width="19" height="24" rx="9" fill="' + a + '" stroke="' + LINE + '" stroke-width="5"/>'
      + '<rect x="104" y="160" width="19" height="24" rx="9" fill="' + a + '" stroke="' + LINE + '" stroke-width="5"/>'
      + plates
      + '<ellipse cx="154" cy="140" rx="27" ry="22" fill="' + c + '" stroke="' + LINE + '" stroke-width="6"/>'
      + '<path d="M166 150 Q176 154 183 147" fill="none" stroke="' + LINE + '" stroke-width="3.2" stroke-linecap="round"/>'
      + eye(162, 136, 7) + cheek(148, 149)
    );
  }

  function artTheri(d) {
    var c = d.body, b = d.belly, a = d.accent;
    return svgWrap(
      '<path d="M60 152 C34 160 16 148 18 126 C32 142 48 146 64 142Z" fill="' + c + '" stroke="' + LINE + '" stroke-width="6" stroke-linejoin="round"/>'
      + '<path d="M52 148 l-18 10 l22 -2 l-14 14 l22 -8" fill="' + a + '" stroke="' + LINE + '" stroke-width="3" stroke-linejoin="round"/>'
      + '<ellipse cx="100" cy="142" rx="42" ry="38" fill="' + c + '" stroke="' + LINE + '" stroke-width="6"/>'
      + '<ellipse cx="99" cy="155" rx="28" ry="21" fill="' + b + '"/>'
      + '<rect x="78" y="162" width="22" height="26" rx="11" fill="' + a + '" stroke="' + LINE + '" stroke-width="5"/>'
      + '<rect x="106" y="162" width="22" height="26" rx="11" fill="' + a + '" stroke="' + LINE + '" stroke-width="5"/>'
      + '<path d="M120 140 C116 110 124 82 144 72 C156 66 170 72 172 82 C174 94 160 100 150 104 C138 110 132 124 130 142Z" fill="' + c + '" stroke="' + LINE + '" stroke-width="6" stroke-linejoin="round"/>'
      + '<ellipse cx="160" cy="78" rx="19" ry="16" fill="' + c + '" stroke="' + LINE + '" stroke-width="6"/>'
      + '<path d="M170 86 L182 90 L170 96Z" fill="#ff9d3d" stroke="' + LINE + '" stroke-width="2.6" stroke-linejoin="round"/>'
      + eye(165, 73, 6.5) + cheek(152, 88)
      + '<path d="M112 126 C100 146 92 160 94 172" fill="none" stroke="' + LINE + '" stroke-width="9" stroke-linecap="round"/>'
      + '<path d="M94 172 l-7 8 M94 172 l0 11 M94 172 l7 8" fill="none" stroke="' + LINE + '" stroke-width="4" stroke-linecap="round"/>'
    );
  }

  function artHadrosaur(d) {
    var o = d.opts || {};
    var c = d.body, b = d.belly, a = d.accent;
    var crest = o.crest === 'long'
      ? '<path d="M150 76 C142 48 120 36 108 42 C118 52 130 62 140 84Z" fill="' + a + '" stroke="' + LINE + '" stroke-width="5" stroke-linejoin="round"/>'
      : '<path d="M150 78 C146 68 138 62 130 64 C136 70 140 76 142 82Z" fill="' + a + '" stroke="' + LINE + '" stroke-width="4" stroke-linejoin="round"/>';
    return svgWrap(
      '<path d="M56 150 C32 158 16 146 18 124 C32 140 48 144 62 140Z" fill="' + c + '" stroke="' + LINE + '" stroke-width="6" stroke-linejoin="round"/>'
      + '<ellipse cx="96" cy="146" rx="44" ry="32" fill="' + c + '" stroke="' + LINE + '" stroke-width="6"/>'
      + '<ellipse cx="95" cy="157" rx="26" ry="15" fill="' + b + '"/>'
      + '<rect x="68" y="164" width="20" height="26" rx="10" fill="' + a + '" stroke="' + LINE + '" stroke-width="5"/>'
      + '<rect x="98" y="164" width="20" height="26" rx="10" fill="' + a + '" stroke="' + LINE + '" stroke-width="5"/>'
      + '<rect x="120" y="164" width="20" height="26" rx="10" fill="' + a + '" stroke="' + LINE + '" stroke-width="5"/>'
      + '<path d="M118 146 C114 122 122 100 140 94 C150 90 160 94 164 102 C168 110 162 118 152 120 C142 122 136 132 136 148Z" fill="' + c + '" stroke="' + LINE + '" stroke-width="6" stroke-linejoin="round"/>'
      + '<ellipse cx="152" cy="98" rx="26" ry="21" fill="' + c + '" stroke="' + LINE + '" stroke-width="6"/>'
      + '<path d="M168 98 C182 96 190 100 192 106 C190 114 178 116 164 112Z" fill="' + b + '" stroke="' + LINE + '" stroke-width="4" stroke-linejoin="round"/>'
      + crest
      + '<circle cx="186" cy="102" r="2" fill="' + LINE + '"/>'
      + eye(160, 92, 6.5) + cheek(146, 108)
    );
  }

  function artPtera(d) {
    var o = d.opts || {};
    var c = d.body, b = d.belly, a = d.accent;
    var tail = o.longTail
      ? '<path d="M82 150 C64 160 44 170 24 176" fill="none" stroke="' + LINE + '" stroke-width="5" stroke-linecap="round"/>'
        + '<path d="M28 168 l-12 8 l14 6 l-2 -14Z" fill="' + a + '" stroke="' + LINE + '" stroke-width="3" stroke-linejoin="round"/>'
      : '';
    var teeth = o.longTail
      ? '<path d="M118 110 l2 6 l5 -4 M126 113 l2 6 l5 -4" fill="#fff" stroke="' + LINE + '" stroke-width="1.3"/>'
      : '';
    return svgWrap(
      '<path d="M96 118 C70 84 34 78 16 94 C34 104 44 120 58 138 C72 154 88 150 98 140Z" fill="' + a + '" stroke="' + LINE + '" stroke-width="6" stroke-linejoin="round"/>'
      + '<path d="M104 118 C130 84 166 78 184 94 C166 104 156 120 142 138 C128 154 112 150 102 140Z" fill="' + a + '" stroke="' + LINE + '" stroke-width="6" stroke-linejoin="round"/>'
      + '<path d="M96 118 C76 100 48 96 30 104" fill="none" stroke="' + LINE + '" stroke-width="3" opacity=".4"/>'
      + '<path d="M104 118 C124 100 152 96 170 104" fill="none" stroke="' + LINE + '" stroke-width="3" opacity=".4"/>'
      + '<ellipse cx="100" cy="138" rx="24" ry="30" fill="' + c + '" stroke="' + LINE + '" stroke-width="6"/>'
      + '<ellipse cx="100" cy="148" rx="14" ry="16" fill="' + b + '"/>'
      + '<path d="M90 164 l-2 12 M110 164 l2 12" stroke="' + LINE + '" stroke-width="5" stroke-linecap="round"/>'
      + tail
      + '<circle cx="100" cy="96" r="25" fill="' + c + '" stroke="' + LINE + '" stroke-width="6"/>'
      + (o.longTail
        ? '<path d="M100 76 l-18 -16 l20 8 l-6 -14 l12 12" fill="' + a + '" stroke="' + LINE + '" stroke-width="3" stroke-linejoin="round"/>'
        : '<path d="M100 74 L69 58 L95 92Z" fill="' + a + '" stroke="' + LINE + '" stroke-width="4" stroke-linejoin="round"/>')
      + '<path d="M100 104 L128 114 L100 122Z" fill="#ff9d3d" stroke="' + LINE + '" stroke-width="3.4" stroke-linejoin="round"/>'
      + teeth
      + eye(109, 92, 6.5) + cheek(91, 104)
    );
  }

  function artMarine(d) {
    var o = d.opts || {};
    var type = o.marine || 'plesio';
    var c = d.body, b = d.belly, a = d.accent;

    if (type === 'mosa') {
      return svgWrap(
        '<path d="M48 146 C30 146 16 156 8 166 C22 168 34 164 44 158Z" fill="' + a + '" stroke="' + LINE + '" stroke-width="5" stroke-linejoin="round"/>'
        + '<ellipse cx="66" cy="152" rx="22" ry="9" transform="rotate(24 66 152)" fill="' + a + '" stroke="' + LINE + '" stroke-width="4"/>'
        + '<ellipse cx="134" cy="152" rx="22" ry="9" transform="rotate(-24 134 152)" fill="' + a + '" stroke="' + LINE + '" stroke-width="4"/>'
        + '<ellipse cx="100" cy="142" rx="52" ry="22" fill="' + c + '" stroke="' + LINE + '" stroke-width="6"/>'
        + '<ellipse cx="100" cy="150" rx="34" ry="11" fill="' + b + '"/>'
        + '<path d="M144 138 C160 132 176 132 188 138 C176 148 160 150 144 146Z" fill="' + c + '" stroke="' + LINE + '" stroke-width="6" stroke-linejoin="round"/>'
        + '<path d="M150 144 l4 6 l4 -6 M162 145 l4 6 l4 -6 M174 145 l4 6 l4 -6" fill="#fff" stroke="' + LINE + '" stroke-width="1.4"/>'
        + eye(162, 134, 6.5)
        + '<path d="M182 140 q4 3 8 0" fill="none" stroke="' + LINE + '" stroke-width="2.4" stroke-linecap="round"/>'
      );
    }

    if (type === 'ichthyo') {
      return svgWrap(
        '<path d="M40 146 C26 136 14 138 6 148 C16 156 30 158 42 154Z" fill="' + a + '" stroke="' + LINE + '" stroke-width="5" stroke-linejoin="round"/>'
        + '<path d="M92 116 C102 100 120 100 128 112 C134 122 126 130 114 130 C102 130 94 126 92 116Z" fill="' + a + '" stroke="' + LINE + '" stroke-width="4"/>'
        + '<path d="M44 144 C58 122 90 120 120 128 C140 134 154 140 164 146 C150 158 120 164 88 158 C64 154 50 150 44 144Z" fill="' + c + '" stroke="' + LINE + '" stroke-width="6" stroke-linejoin="round"/>'
        + '<ellipse cx="104" cy="146" rx="32" ry="10" fill="' + b + '"/>'
        + '<path d="M164 146 C176 142 188 142 196 146 C188 152 176 154 164 152Z" fill="' + c + '" stroke="' + LINE + '" stroke-width="5" stroke-linejoin="round"/>'
        + eye(170, 144, 5.5)
        + '<path d="M62 136 q-8 8 -2 16" fill="none" stroke="' + a + '" stroke-width="6" stroke-linecap="round"/>'
      );
    }

    var neck = type === 'elasm'
      ? 'M122 140 C118 104 124 66 146 52 C160 43 176 49 181 62 C186 76 174 84 162 90 C146 98 137 118 138 140Z'
      : 'M122 140 C118 108 126 78 148 66 C160 59 174 65 177 77 C180 90 167 97 156 102 C142 109 137 124 138 142Z';
    var headY = type === 'elasm' ? 60 : 74;
    var headX = type === 'elasm' ? 170 : 166;
    return svgWrap(
      '<ellipse cx="66" cy="156" rx="25" ry="10" transform="rotate(-24 66 156)" fill="' + a + '" stroke="' + LINE + '" stroke-width="5"/>'
      + '<ellipse cx="134" cy="156" rx="25" ry="10" transform="rotate(24 134 156)" fill="' + a + '" stroke="' + LINE + '" stroke-width="5"/>'
      + '<ellipse cx="72" cy="132" rx="20" ry="8" transform="rotate(24 72 132)" fill="' + a + '" stroke="' + LINE + '" stroke-width="4"/>'
      + '<ellipse cx="128" cy="132" rx="20" ry="8" transform="rotate(-24 128 132)" fill="' + a + '" stroke="' + LINE + '" stroke-width="4"/>'
      + '<ellipse cx="100" cy="146" rx="42" ry="25" fill="' + c + '" stroke="' + LINE + '" stroke-width="6"/>'
      + '<ellipse cx="100" cy="154" rx="25" ry="12" fill="' + b + '"/>'
      + '<path d="' + neck + '" fill="' + c + '" stroke="' + LINE + '" stroke-width="6" stroke-linejoin="round"/>'
      + '<ellipse cx="' + headX + '" cy="' + headY + '" rx="20" ry="16" fill="' + c + '" stroke="' + LINE + '" stroke-width="6"/>'
      + '<circle cx="' + (headX + 18) + '" cy="' + (headY - 4) + '" r="2.4" fill="' + LINE + '"/>'
      + '<path d="M' + (headX - 8) + ' ' + (headY + 12) + ' Q' + (headX + 4) + ' ' + (headY + 16) + ' ' + (headX + 14) + ' ' + (headY + 10) + '" fill="none" stroke="' + LINE + '" stroke-width="3" stroke-linecap="round"/>'
      + eye(headX + 4, headY - 6, 7) + cheek(headX - 8, headY + 10)
    );
  }

  function artBird(d) {
    var c = d.body, b = d.belly, a = d.accent;
    return svgWrap(
      '<path d="M74 150 C56 158 32 166 14 178 C34 180 54 174 70 166Z" fill="' + a + '" stroke="' + LINE + '" stroke-width="4" stroke-linejoin="round"/>'
      + '<path d="M88 120 C64 96 36 96 22 112 C40 118 52 130 64 146 C76 158 88 152 92 140Z" fill="' + a + '" stroke="' + LINE + '" stroke-width="5" stroke-linejoin="round"/>'
      + '<path d="M112 120 C136 96 164 96 178 112 C160 118 148 130 136 146 C124 158 112 152 108 140Z" fill="' + a + '" stroke="' + LINE + '" stroke-width="5" stroke-linejoin="round"/>'
      + '<ellipse cx="100" cy="140" rx="26" ry="30" fill="' + c + '" stroke="' + LINE + '" stroke-width="6"/>'
      + '<ellipse cx="100" cy="148" rx="14" ry="16" fill="' + b + '"/>'
      + '<circle cx="100" cy="100" r="23" fill="' + c + '" stroke="' + LINE + '" stroke-width="6"/>'
      + '<path d="M100 112 L128 120 L100 126Z" fill="#ff9d3d" stroke="' + LINE + '" stroke-width="3" stroke-linejoin="round"/>'
      + '<path d="M100 78 l-10 -14 l12 6 l4 -14 l6 13 l10 -10 l-6 18" fill="' + a + '" stroke="' + LINE + '" stroke-width="3" stroke-linejoin="round"/>'
      + eye(108, 96, 6)
      + '<path d="M92 162 l-2 10 M108 162 l2 10" stroke="' + LINE + '" stroke-width="4" stroke-linecap="round"/>'
    );
  }

  function dinoArt(d) {
    if (!d) return '';
    switch (d.kind) {
      case 'ceratops': return artCeratops(d);
      case 'stego': return artStego(d);
      case 'sauropod': return artSauropod(d);
      case 'pachy': return artPachy(d);
      case 'ankylo': return artAnkylo(d);
      case 'theri': return artTheri(d);
      case 'hadrosaur': return artHadrosaur(d);
      case 'ptera': return artPtera(d);
      case 'marine': return artMarine(d);
      case 'bird': return artBird(d);
      default: return artTheropod(d);
    }
  }

  function spotArt(type) {
    switch (type) {
      case 'bush':
        return '<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">'
          + '<g stroke="#2f6b45" stroke-width="3" stroke-linejoin="round">'
          + '<circle cx="28" cy="62" r="22" fill="#63c97f"/><circle cx="52" cy="50" r="26" fill="#79d893"/>'
          + '<circle cx="74" cy="63" r="21" fill="#57bd74"/><circle cx="52" cy="72" r="20" fill="#4fb16a"/>'
          + '</g><circle cx="40" cy="41" r="5" fill="#a7eeb9"/><circle cx="64" cy="35" r="4" fill="#a7eeb9"/></svg>';
      case 'rock':
        return '<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">'
          + '<path d="M14 82 L20 46 L42 26 L72 32 L88 62 L84 82Z" fill="#aebccd" stroke="#6f8199" stroke-width="4" stroke-linejoin="round"/>'
          + '<path d="M34 42 L46 34 L58 46 L46 58Z" fill="#cbd7e4"/><path d="M62 70 L72 62 L78 74Z" fill="#93a4b8"/></svg>';
      case 'tree':
        return '<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">'
          + '<rect x="44" y="52" width="14" height="40" rx="7" fill="#a9744f" stroke="#7d5335" stroke-width="3"/>'
          + '<circle cx="50" cy="38" r="26" fill="#5cc07e" stroke="#2f6b45" stroke-width="3"/>'
          + '<circle cx="28" cy="52" r="18" fill="#6fd18b" stroke="#2f6b45" stroke-width="3"/>'
          + '<circle cx="72" cy="52" r="18" fill="#6fd18b" stroke="#2f6b45" stroke-width="3"/>'
          + '<circle cx="40" cy="30" r="5" fill="#a7eeb9"/></svg>';
      case 'cloud':
        return '<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">'
          + '<g fill="#ffffff" stroke="#cfe4f2" stroke-width="3"><circle cx="32" cy="58" r="18"/><circle cx="52" cy="46" r="24"/>'
          + '<circle cx="74" cy="58" r="17"/><rect x="32" y="58" width="42" height="18" rx="9"/></g></svg>';
      case 'reed':
        return '<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">'
          + '<g stroke="#3f9b62" stroke-width="5" stroke-linecap="round" fill="none">'
          + '<path d="M30 90 Q26 60 34 30"/><path d="M50 90 Q52 58 46 26"/><path d="M70 90 Q74 62 66 34"/></g>'
          + '<ellipse cx="34" cy="28" rx="7" ry="14" fill="#7a5230"/><ellipse cx="46" cy="24" rx="7" ry="14" fill="#8a5f38"/>'
          + '<ellipse cx="66" cy="32" rx="7" ry="14" fill="#7a5230"/></svg>';
      case 'lily':
        return '<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">'
          + '<path d="M50 22 A30 30 0 1 1 49.9 22 L50 50 Z" fill="#63c98a" stroke="#3d9e66" stroke-width="4" stroke-linejoin="round"/>'
          + '<circle cx="50" cy="50" r="6" fill="#ffd6e2"/><circle cx="50" cy="50" r="3" fill="#ff9db0"/></svg>';
      case 'shell':
        return '<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">'
          + '<path d="M50 86 L18 66 A34 34 0 0 1 82 66 Z" fill="#ffc2d1" stroke="#d47f9a" stroke-width="4" stroke-linejoin="round"/>'
          + '<path d="M50 84 L32 58 M50 84 L44 52 M50 84 L56 52 M50 84 L68 58" stroke="#d47f9a" stroke-width="3" stroke-linecap="round"/></svg>';
      case 'mound':
        return '<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">'
          + '<path d="M10 84 Q20 46 50 44 Q80 46 90 84Z" fill="#d9a76c" stroke="#a97b45" stroke-width="4" stroke-linejoin="round"/>'
          + '<circle cx="36" cy="68" r="5" fill="#c08e55"/><circle cx="58" cy="62" r="4" fill="#c08e55"/><circle cx="64" cy="76" r="6" fill="#c08e55"/></svg>';
      case 'flower':
        return '<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">'
          + '<g stroke="#3d8f5c" stroke-width="4" fill="none" stroke-linecap="round">'
          + '<path d="M50 92 Q48 68 50 52"/><path d="M50 74 Q34 64 30 52"/><path d="M50 68 Q66 60 70 48"/>'
          + '</g>'
          + '<g stroke="#d06a8e" stroke-width="3">'
          + '<circle cx="50" cy="38" r="12" fill="#ffd6e2"/><circle cx="36" cy="48" r="10" fill="#ffe3ec"/>'
          + '<circle cx="64" cy="48" r="10" fill="#ffe3ec"/><circle cx="50" cy="38" r="5" fill="#ffb347"/>'
          + '<circle cx="28" cy="50" r="8" fill="#ffe3ec"/><circle cx="28" cy="50" r="4" fill="#ffb347"/>'
          + '<circle cx="72" cy="46" r="8" fill="#ffe3ec"/><circle cx="72" cy="46" r="4" fill="#ffb347"/>'
          + '</g></svg>';
      case 'hay':
        return '<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">'
          + '<path d="M16 86 Q20 48 50 40 Q80 48 84 86Z" fill="#e8c56b" stroke="#b98f3a" stroke-width="4" stroke-linejoin="round"/>'
          + '<path d="M30 82 Q34 62 38 52 M46 84 Q48 60 50 48 M62 84 Q62 64 60 52 M74 82 Q70 66 66 56" fill="none" stroke="#c9a348" stroke-width="3" stroke-linecap="round"/>'
          + '<path d="M50 42 q-8 -10 -14 -12 M50 42 q0 -12 4 -16 M50 42 q10 -8 16 -8" fill="none" stroke="#e0b955" stroke-width="4" stroke-linecap="round"/></svg>';
      case 'coral':
        return '<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">'
          + '<g stroke="#e06a8e" stroke-width="7" fill="none" stroke-linecap="round" stroke-linejoin="round">'
          + '<path d="M50 92 V42"/><path d="M50 64 L28 44"/><path d="M50 54 L72 34"/>'
          + '<path d="M28 44 V26"/><path d="M72 34 V18"/><path d="M50 42 V22"/>'
          + '</g>'
          + '<circle cx="28" cy="24" r="6" fill="#ffb3c4"/><circle cx="72" cy="16" r="6" fill="#ffb3c4"/>'
          + '<circle cx="50" cy="20" r="6" fill="#ffb3c4"/></svg>';
      case 'grass':
      default:
        return '<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">'
          + '<g stroke="#4aa96a" stroke-width="5" stroke-linecap="round" fill="none">'
          + '<path d="M22 86 Q16 60 26 44"/><path d="M38 86 Q40 56 34 40"/><path d="M54 86 Q56 60 62 42"/>'
          + '<path d="M70 86 Q80 62 72 46"/><path d="M84 86 Q88 68 82 56"/></g></svg>';
    }
  }

  var SCENE_ART = {
    forest: '<svg viewBox="0 0 1000 700" preserveAspectRatio="xMidYMax slice" xmlns="http://www.w3.org/2000/svg">'
      + '<path d="M0 505 Q170 460 350 500 T690 488 T1000 512 L1000 700 L0 700Z" fill="#a5e7b2"/>'
      + '<path d="M0 574 Q190 528 390 564 T730 552 T1000 578 L1000 700 L0 700Z" fill="#79d494"/>'
      + '<g><rect x="58" y="418" width="30" height="140" rx="14" fill="#a9744f"/>'
      + '<circle cx="72" cy="392" r="76" fill="#4db16b"/><circle cx="22" cy="438" r="46" fill="#5cc07e"/>'
      + '<circle cx="122" cy="440" r="52" fill="#5cc07e"/><circle cx="58" cy="348" r="9" fill="#a7eeb9"/></g>'
      + '<g><rect x="900" y="402" width="30" height="150" rx="14" fill="#a9744f"/>'
      + '<circle cx="914" cy="374" r="80" fill="#4db16b"/><circle cx="862" cy="424" r="48" fill="#5cc07e"/>'
      + '<circle cx="968" cy="426" r="54" fill="#5cc07e"/><circle cx="920" cy="330" r="10" fill="#a7eeb9"/></g>'
      + '<circle cx="300" cy="590" r="26" fill="#57bd74"/><circle cx="330" cy="600" r="20" fill="#63c97f"/>'
      + '<circle cx="720" cy="606" r="24" fill="#57bd74"/></svg>',
    meadow: '<svg viewBox="0 0 1000 700" preserveAspectRatio="xMidYMax slice" xmlns="http://www.w3.org/2000/svg">'
      + '<path d="M0 428 Q200 380 420 424 T800 414 T1000 448 L1000 540 L0 540Z" fill="#dcf3c0"/>'
      + '<path d="M0 470 Q180 420 390 462 T720 450 T1000 480 L1000 700 L0 700Z" fill="#bfe89a"/>'
      + '<path d="M0 545 Q220 500 440 540 T780 528 T1000 556 L1000 700 L0 700Z" fill="#9bdc7f"/>'
      + '<path d="M0 618 Q240 580 500 612 T1000 604 L1000 700 L0 700Z" fill="#84cf6d"/>'
      + '<g><rect x="292" y="452" width="16" height="52" rx="8" fill="#a9744f"/>'
      + '<circle cx="300" cy="432" r="34" fill="#8fd48f"/><circle cx="274" cy="452" r="22" fill="#9bdc7f"/>'
      + '<circle cx="326" cy="452" r="22" fill="#9bdc7f"/></g>'
      + '<g><rect x="702" y="444" width="18" height="58" rx="9" fill="#a9744f"/>'
      + '<circle cx="711" cy="422" r="38" fill="#8fd48f"/><circle cx="682" cy="444" r="24" fill="#9bdc7f"/>'
      + '<circle cx="740" cy="444" r="24" fill="#9bdc7f"/></g>'
      + '<g fill="#ffd76b"><circle cx="180" cy="600" r="8"/><circle cx="196" cy="590" r="6"/><circle cx="166" cy="590" r="6"/>'
      + '<circle cx="720" cy="620" r="8"/><circle cx="738" cy="610" r="6"/><circle cx="704" cy="610" r="6"/>'
      + '<circle cx="340" cy="646" r="7"/><circle cx="356" cy="638" r="5"/><circle cx="326" cy="638" r="5"/></g>'
      + '<g fill="#fff6d8"><circle cx="520" cy="650" r="6"/><circle cx="580" cy="636" r="5"/></g>'
      + '<g fill="#ffb3c9"><circle cx="140" cy="566" r="7"/><circle cx="156" cy="558" r="5"/><circle cx="124" cy="558" r="5"/></g>'
      + '<g fill="#fff6d8"><circle cx="640" cy="582" r="7"/><circle cx="656" cy="574" r="5"/><circle cx="624" cy="574" r="5"/></g>'
      + '<g fill="#ffd76b"><circle cx="460" cy="574" r="6"/><circle cx="474" cy="568" r="4"/></g>'
      + '<g stroke="#6fbf5c" stroke-width="5" stroke-linecap="round" fill="none">'
      + '<path d="M80 640 Q76 610 84 590"/><path d="M96 642 Q100 614 94 594"/>'
      + '<path d="M900 632 Q896 602 904 582"/><path d="M916 634 Q920 606 914 586"/></g>'
      + '<path d="M700 510 L760 380 L820 510Z" fill="#b8a08b" opacity=".55"/></svg>',
    lake: '<svg viewBox="0 0 1000 700" preserveAspectRatio="xMidYMax slice" xmlns="http://www.w3.org/2000/svg">'
      + '<path d="M0 470 Q180 430 360 462 T700 452 T1000 474 L1000 560 L0 560Z" fill="#8fd8a6"/>'
      + '<path d="M0 498 Q140 486 280 498 T560 494 T840 500 T1000 490 L1000 528 L0 528Z" fill="#f2d59a"/>'
      + '<path d="M0 514 Q160 506 320 514 T640 510 T1000 512 L1000 532 L0 532Z" fill="#e5c88a" opacity=".6"/>'
      + '<rect y="520" width="1000" height="180" fill="#5ac8ea"/>'
      + '<path d="M0 536 Q120 528 240 536 T480 536 T720 536 T960 536 T1000 538 L1000 556 L0 556Z" fill="#8ee2f7" opacity=".75"/>'
      + '<g fill="#ffffff" opacity=".55"><circle cx="300" cy="582" r="3"/><circle cx="520" cy="624" r="2.5"/>'
      + '<circle cx="700" cy="566" r="3"/><circle cx="860" cy="640" r="2.5"/><circle cx="160" cy="654" r="2.5"/></g>'
      + '<ellipse cx="200" cy="612" rx="60" ry="12" fill="#46b6da" opacity=".45"/>'
      + '<ellipse cx="760" cy="644" rx="80" ry="14" fill="#46b6da" opacity=".4"/>'
      + '<g stroke="#3f9b62" stroke-width="7" stroke-linecap="round" fill="none">'
      + '<path d="M40 604 Q34 544 46 504"/><path d="M74 608 Q80 552 70 510"/></g>'
      + '<ellipse cx="46" cy="496" rx="9" ry="20" fill="#7a5230"/><ellipse cx="70" cy="502" rx="9" ry="20" fill="#8a5f38"/>'
      + '<circle cx="930" cy="600" r="26" fill="#63c98a"/><circle cx="930" cy="600" r="10" fill="#4db16b"/></svg>'
  };

  DINO.dinoArt = dinoArt;
  DINO.spotArt = spotArt;
  DINO.SCENE_ART = SCENE_ART;
})();
