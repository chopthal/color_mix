/**
 * HTML/SVG 오버레이: 토리(말풍선+음성·표정) · 페달/경적/대시보드 힌트 · 핸들 회전 · 속도계
 * · 별 반짝 · 도장 지도(목적지 카드·도장) · 시동 화면
 */
import { CONFIG, DEST_ORDER } from './config.js';

const $ = (id) => document.getElementById(id);

export class UI {
  constructor() {
    this.el = {
      tori: $('tori'),
      bubble: $('bubble'),
      bubbleText: $('bubbleText'),
      wheelRot: $('wheelRot'),
      pedal: $('pedal'),
      finger: $('fingerHint'),
      horn: $('horn'),
      needle: $('needle'),
      stars: $('stars'),
      keyOverlay: $('keyOverlay'),
      soundBtn: $('soundBtn'),
      map: $('mapScreen'),
      grid: $('destGrid'),
      blinkL: $('btnBlinkL'),
      blinkR: $('btnBlinkR'),
      wiper: $('btnWiper'),
      lights: $('btnLights'),
      radio: $('btnRadio'),
    };
    this.bubbleTimer = 0;
    this.happyTimer = 0;
    this.voice = null;
    this.speechOk = 'speechSynthesis' in window && typeof window.SpeechSynthesisUtterance === 'function';
    if (this.speechOk) {
      const pickVoice = () => {
        const list = window.speechSynthesis.getVoices() || [];
        this.voice = list.find((v) => /^ko/i.test(v.lang)) || null;
      };
      pickVoice();
      if (typeof window.speechSynthesis.addEventListener === 'function') {
        window.speechSynthesis.addEventListener('voiceschanged', pickVoice);
      }
    }
  }

  /* ---------- 토리 ---------- */

  /** 말풍선. holdMs=0 이면 hideBubble 전까지 유지. happy=true면 눈웃음 */
  say(text, holdMs, happy) {
    const { bubble, bubbleText, tori } = this.el;
    clearTimeout(this.bubbleTimer);
    bubbleText.textContent = text;
    bubble.classList.remove('is-on');
    void bubble.offsetWidth;
    bubble.classList.add('is-on');
    tori.classList.remove('is-talk');
    void tori.offsetWidth;
    tori.classList.add('is-talk');
    this.setHappy(!!happy);
    const ms = holdMs == null ? Math.max(CONFIG.speech.minMs, text.length * CONFIG.speech.perCharMs + 1200) : holdMs;
    if (ms > 0) this.bubbleTimer = setTimeout(() => this.hideBubble(), ms);
    this.speak(text);
  }

  setHappy(on) {
    clearTimeout(this.happyTimer);
    this.el.tori.classList.toggle('is-happy', on);
    if (on) this.happyTimer = setTimeout(() => this.el.tori.classList.remove('is-happy'), 2600);
  }

  hideBubble() {
    clearTimeout(this.bubbleTimer);
    this.el.bubble.classList.remove('is-on');
    this.el.tori.classList.remove('is-talk');
  }

  get bubbleText() {
    return this.el.bubble.classList.contains('is-on') ? this.el.bubbleText.textContent : '';
  }

  speak(text) {
    if (!this.speechOk || !this.voice) return;
    const ua = navigator.userActivation;
    if (ua && !ua.hasBeenActive) return;
    const K = window.KidsKit;
    if (K && K.sound.isMuted()) return;
    try {
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.lang = 'ko-KR';
      u.voice = this.voice;
      u.rate = 0.95;
      u.pitch = 1.3;
      u.volume = 0.9;
      window.speechSynthesis.speak(u);
    } catch (e) {
      /* 음성 실패는 말풍선만 */
    }
  }

  stopSpeech() {
    if (!this.speechOk) return;
    try {
      window.speechSynthesis.cancel();
    } catch (e) {
      /* noop */
    }
  }

  /* ---------- 조작 표시 ---------- */

  setPedalPressed(on) {
    this.el.pedal.classList.toggle('is-pressed', on);
  }

  setPedalSparkle(on) {
    this.el.pedal.classList.toggle('is-sparkle', on);
  }

  setPedalDim(on) {
    this.el.pedal.classList.toggle('is-dim', on);
  }

  setFinger(on) {
    this.el.finger.classList.toggle('is-on', on);
  }

  setHornPulse(on) {
    this.el.horn.classList.toggle('is-pulse', on);
  }

  hornFlash() {
    const h = this.el.horn;
    h.classList.remove('is-honk');
    void h.offsetWidth;
    h.classList.add('is-honk');
  }

  setWheel(deg) {
    this.el.wheelRot.style.transform = 'rotate(' + deg.toFixed(1) + 'deg)';
  }

  setSpeed(v01) {
    const a = -90 + Math.max(0, Math.min(1, v01)) * 180;
    this.el.needle.style.transform = 'rotate(' + a.toFixed(1) + 'deg)';
  }

  setSoundIcon(muted) {
    const b = this.el.soundBtn;
    b.classList.toggle('is-muted', muted);
    b.setAttribute('aria-pressed', muted ? 'true' : 'false');
  }

  /** 대시보드 버튼 상태: name = blinkL | blinkR | wiper | lights | radio */
  setButton(name, on) {
    const b = this.el[name];
    b.classList.toggle('is-on', on);
    b.setAttribute('aria-pressed', on ? 'true' : 'false');
  }

  setHint(name, on) {
    this.el[name].classList.toggle('is-hint', on);
  }

  burstStars(x, y) {
    const host = this.el.stars;
    const colors = ['#ffd166', '#ff9fb8', '#8fcdf0', '#9fdc8f', '#c2a8f5'];
    for (let i = 0; i < 12; i++) {
      const s = document.createElement('span');
      s.className = 'star';
      const a = (i / 12) * Math.PI * 2 + Math.random() * 0.3;
      const r = 70 + Math.random() * 70;
      s.style.left = x + 'px';
      s.style.top = y + 'px';
      s.style.setProperty('--dx', (Math.cos(a) * r).toFixed(0) + 'px');
      s.style.setProperty('--dy', (Math.sin(a) * r * 0.8 - 30).toFixed(0) + 'px');
      s.style.setProperty('--c', colors[i % colors.length]);
      s.style.animationDelay = (Math.random() * 0.12).toFixed(2) + 's';
      host.appendChild(s);
      setTimeout(() => s.remove(), 1500);
    }
  }

  /* ---------- 화면 모드 ---------- */

  setMode(mode) {
    const b = document.body.classList;
    b.toggle('is-map', mode === 'map');
    b.toggle('is-key', mode === 'key');
    b.toggle('is-stamp', mode === 'stamp');
  }

  /** 도장 지도: visits = {sea, zoo, grandma, park} */
  showMap(visits, mode) {
    const m = this.el.map;
    m.hidden = false;
    m.classList.remove('is-out');
    this.setMode(mode);
    for (const key of DEST_ORDER) this.renderCard(key, visits[key] || 0, false);
  }

  renderCard(key, count, fresh) {
    const card = this.el.grid.querySelector('[data-dest="' + key + '"]');
    card.classList.toggle('has-stamp', count > 0 && !fresh);
    const dots = card.querySelector('.dots');
    dots.textContent = '';
    for (let i = 0; i < Math.min(5, count); i++) {
      const dot = document.createElement('i');
      if (fresh && i === Math.min(5, count) - 1) dot.className = 'is-new';
      dots.appendChild(dot);
    }
  }

  /** 도장 쾅 애니메이션 */
  stampCard(key, count) {
    const card = this.el.grid.querySelector('[data-dest="' + key + '"]');
    this.renderCard(key, count, true);
    card.classList.remove('is-stamping');
    void card.offsetWidth;
    card.classList.add('is-stamping', 'has-stamp');
  }

  pickCard(key) {
    const card = this.el.grid.querySelector('[data-dest="' + key + '"]');
    card.classList.remove('is-picked');
    void card.offsetWidth;
    card.classList.add('is-picked');
  }

  hideMap() {
    const m = this.el.map;
    m.classList.add('is-out');
    setTimeout(() => {
      if (m.classList.contains('is-out')) m.hidden = true;
    }, 520);
    for (const c of this.el.grid.querySelectorAll('.dest-card')) c.classList.remove('is-stamping', 'is-picked');
  }

  showKey() {
    const o = this.el.keyOverlay;
    o.hidden = false;
    o.classList.remove('is-out', 'is-turn');
    this.setMode('key');
  }

  turnKey() {
    this.el.keyOverlay.classList.add('is-turn');
  }

  hideKey() {
    const o = this.el.keyOverlay;
    o.classList.add('is-out');
    this.setMode('drive');
    setTimeout(() => {
      if (o.classList.contains('is-out')) o.hidden = true;
    }, 700);
  }

  resetHints() {
    this.setPedalSparkle(false);
    this.setPedalDim(false);
    this.setFinger(false);
    this.setHornPulse(false);
    this.setPedalPressed(false);
    for (const n of ['blinkL', 'blinkR', 'wiper', 'lights', 'radio']) {
      this.setButton(n, false);
      this.setHint(n, false);
    }
    this.hideBubble();
  }
}
