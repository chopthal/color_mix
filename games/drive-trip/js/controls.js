/**
 * 멀티터치 조작 (Pointer Events): 핸들 영역 · 원페달 · 경적.
 * 핸들과 페달은 서로 다른 pointerId로 동시에 잡힌다.
 */
import { CONFIG } from './config.js';

export class Controls {
  constructor({ steerZone, wheel, pedalZone, horn }) {
    this.steerZone = steerZone;
    this.wheel = wheel;
    this.pedalZone = pedalZone;
    this.horn = horn;
    this.enabled = false;
    this.steerId = null;
    this.steerStartX = 0;
    this.steerInput = 0; // -1..1 (잡고 있는 동안)
    this.steerHeld = false;
    this.pedalIds = new Set();
    this.keys = { pedal: false, left: false, right: false };
    this.onHorn = null;
    this.onInput = null;
    this.lastHorn = -1;

    this.bind();
  }

  get pedal() {
    return this.enabled && (this.pedalIds.size > 0 || this.keys.pedal);
  }

  get steer() {
    if (!this.enabled) return 0;
    if (this.steerHeld) return this.steerInput;
    return (this.keys.right ? 1 : 0) - (this.keys.left ? 1 : 0);
  }

  get steering() {
    return this.enabled && (this.steerHeld || this.keys.left || this.keys.right);
  }

  bind() {
    const z = this.steerZone;
    z.addEventListener('pointerdown', (e) => {
      if (!this.enabled || this.steerId !== null) return;
      e.preventDefault();
      this.steerId = e.pointerId;
      this.steerStartX = e.clientX;
      this.steerInput = 0;
      this.steerHeld = true;
      try {
        z.setPointerCapture(e.pointerId);
      } catch (err) {
        /* 일부 브라우저는 캡처 불가 */
      }
      if (this.onInput) this.onInput('steer');
    });
    z.addEventListener('pointermove', (e) => {
      if (e.pointerId !== this.steerId) return;
      const dia = this.wheel.getBoundingClientRect().width || 200;
      const v = (e.clientX - this.steerStartX) / dia;
      this.steerInput = Math.max(-1, Math.min(1, v));
    });
    const endSteer = (e) => {
      if (e.pointerId !== this.steerId) return;
      this.steerId = null;
      this.steerHeld = false;
      this.steerInput = 0;
    };
    z.addEventListener('pointerup', endSteer);
    z.addEventListener('pointercancel', endSteer);
    z.addEventListener('lostpointercapture', endSteer);

    const p = this.pedalZone;
    p.addEventListener('pointerdown', (e) => {
      if (!this.enabled) return;
      e.preventDefault();
      this.pedalIds.add(e.pointerId);
      try {
        p.setPointerCapture(e.pointerId);
      } catch (err) {
        /* noop */
      }
      if (this.onInput) this.onInput('pedal');
    });
    const endPedal = (e) => this.pedalIds.delete(e.pointerId);
    p.addEventListener('pointerup', endPedal);
    p.addEventListener('pointercancel', endPedal);
    p.addEventListener('lostpointercapture', endPedal);

    this.horn.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.honk();
    });

    window.addEventListener('keydown', (e) => {
      if (e.repeat) return;
      const k = e.key;
      if (k === 'ArrowUp' || k === ' ' || k === 'w') this.keys.pedal = true;
      else if (k === 'ArrowLeft' || k === 'a') this.keys.left = true;
      else if (k === 'ArrowRight' || k === 'd') this.keys.right = true;
      else if (k === 'h' || k === 'Enter') this.honk();
      else return;
      if (this.enabled && this.onInput) this.onInput(this.keys.pedal ? 'pedal' : 'steer');
    });
    window.addEventListener('keyup', (e) => {
      const k = e.key;
      if (k === 'ArrowUp' || k === ' ' || k === 'w') this.keys.pedal = false;
      else if (k === 'ArrowLeft' || k === 'a') this.keys.left = false;
      else if (k === 'ArrowRight' || k === 'd') this.keys.right = false;
    });
    window.addEventListener('blur', () => this.releaseAll());
  }

  honk() {
    if (!this.enabled) return false;
    const now = performance.now() / 1000;
    if (now - this.lastHorn < CONFIG.horn.cooldown) return false;
    this.lastHorn = now;
    if (this.onHorn) this.onHorn();
    return true;
  }

  releaseAll() {
    this.pedalIds.clear();
    this.steerId = null;
    this.steerHeld = false;
    this.steerInput = 0;
    this.keys.pedal = this.keys.left = this.keys.right = false;
  }
}
