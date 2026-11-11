/**
 * 반짝반짝 세차 — special-vehicles 세차를 brick-garage 서브모드로 이식.
 * 비누 → 헹굼 → 바람 → 반짝. 잠금/별 UI 없음.
 */
const BrickWash = {
  combo: null,
  step: 'soap',
  soap: 0,
  rinse: 0,
  air: 0,
  onDone: null,
  renderCombo: null,
  paintBay: null,

  start(combo, opts) {
    this.combo = combo;
    this.step = 'soap';
    this.soap = 0;
    this.rinse = 0;
    this.air = 0;
    this.onDone = opts && opts.onDone;
    this.renderCombo = opts && opts.renderCombo;
    this.paintBay = opts && opts.paintBay;
    this.paint();
    if (typeof BrickSound !== 'undefined' && BrickSound.speak) {
      BrickSound.speak('차에 묻은 흙을 깨끗이 씻어볼까? 거품을 콕콕 눌러줘!');
    }
  },

  guideText() {
    if (this.step === 'soap') return '🧼 거품을 콕콕 문질러요! (' + this.soap + '/5)';
    if (this.step === 'rinse') return '🚿 물로 거품을 씻어내요! (' + this.rinse + '/4)';
    if (this.step === 'air') return '💨 타이어에 바람을 퐁퐁! (' + this.air + '/3)';
    return '✨ 반짝반짝! 세차 끝!';
  },

  dirtClass() {
    if (this.step === 'soap') return 'dirt-visible';
    if (this.step === 'rinse') return 'dirt-fading';
    return 'dirt-clean';
  },

  bubblesHtml() {
    if (this.soap <= 0) return '';
    let html = '';
    for (let i = 0; i < this.soap; i += 1) {
      const x = 18 + ((i * 19) % 64);
      const y = 22 + ((i * 13) % 48);
      html +=
        '<span class="soap-bubble" style="left:' + x + '%;top:' + y + '%;">🫧</span>';
    }
    return html;
  },

  toolHtml() {
    if (this.step === 'soap') {
      return (
        '<button class="wash-tool-btn" type="button" id="washTool">' +
        '<span class="tool-emoji">🧼</span><span>비누거품</span></button>'
      );
    }
    if (this.step === 'rinse') {
      return (
        '<button class="wash-tool-btn" type="button" id="washTool">' +
        '<span class="tool-emoji">🚿</span><span>물 뿌리기</span></button>'
      );
    }
    if (this.step === 'air') {
      return (
        '<button class="wash-tool-btn" type="button" id="washTool">' +
        '<span class="tool-emoji">💨</span><span>바람 넣기</span></button>'
      );
    }
    return (
      '<button class="wash-tool-btn wash-tool-btn--done" type="button" id="washFinish">' +
      '<span class="tool-emoji">🏅</span><span>차고로!</span></button>'
    );
  },

  paint() {
    const root = document.getElementById('washScreen');
    if (!root || !this.combo) return;

    root.innerHTML =
      '<div class="wash-header">' +
      '<h2 class="wash-title">🧽 반짝반짝 세차</h2>' +
      '<div class="wash-guide-pill" id="washGuide">' +
      this.guideText() +
      '</div></div>' +
      '<div class="wash-bay-scene">' +
      '<div class="wash-car-platform" id="washPlatform">' +
      '<div class="wash-vehicle-board" id="washBoard"></div>' +
      '<div class="dirt-overlay ' +
      this.dirtClass() +
      '" id="dirtOverlay">' +
      '<span class="dirt-spot spot-1">🟤</span>' +
      '<span class="dirt-spot spot-2">⚫</span>' +
      '<span class="dirt-spot spot-3">🟤</span>' +
      '<span class="dirt-spot spot-4">⚫</span>' +
      '</div>' +
      '<div class="soap-bubble-layer" id="soapLayer">' +
      this.bubblesHtml() +
      '</div>' +
      (this.step === 'done' ? '<div class="wash-shine" aria-hidden="true">✨✨✨</div>' : '') +
      '</div>' +
      '<div class="wash-toolbox">' +
      this.toolHtml() +
      '</div></div>';

    const board = document.getElementById('washBoard');
    if (board && typeof this.renderCombo === 'function') {
      this.renderCombo(board, this.combo);
    }

    const platform = document.getElementById('washPlatform');
    if (platform && typeof this.paintBay === 'function') {
      this.paintBay(platform);
    }
    const tool = document.getElementById('washTool');
    const finish = document.getElementById('washFinish');

    const advance = () => this.tap();
    if (tool) tool.addEventListener('click', advance);
    if (platform && this.step !== 'done') {
      platform.addEventListener('click', advance);
    }
    if (finish) {
      finish.addEventListener('click', () => {
        if (typeof BrickSound !== 'undefined') BrickSound.play('pop');
        if (typeof this.onDone === 'function') this.onDone();
      });
    }
  },

  tap() {
    if (this.step === 'soap') {
      this.soap += 1;
      if (typeof BrickSound !== 'undefined') BrickSound.play('pop');
      if (this.soap >= 5) {
        this.step = 'rinse';
        if (BrickSound.speak) BrickSound.speak('거품이 뽀글뽀글! 이제 물로 씻어볼까?');
      }
      this.paint();
      return;
    }
    if (this.step === 'rinse') {
      this.rinse += 1;
      if (typeof BrickSound !== 'undefined') BrickSound.play('water');
      if (this.rinse >= 4) {
        this.step = 'air';
        if (BrickSound.speak) BrickSound.speak('우와, 깨끗해졌어요! 타이어에 바람을 넣어줘!');
      }
      this.paint();
      return;
    }
    if (this.step === 'air') {
      this.air += 1;
      if (typeof BrickSound !== 'undefined') BrickSound.play('pour');
      if (this.air >= 3) {
        this.step = 'done';
        if (typeof BrickSound !== 'undefined') BrickSound.play('fanfare');
        if (BrickSound.speak) BrickSound.speak('반짝반짝! 세차 끝! 차고로 가요!');
      }
      this.paint();
    }
  },
};
