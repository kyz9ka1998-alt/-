// Анимированный футболист (SVG) и анимации навыков.
// Цвета формы — чёрный с зелёными полосами.

const SVGNS = "http://www.w3.org/2000/svg";

function playerSVG(opts = {}) {
  const num = PLAYER.number;
  return `
<svg viewBox="0 0 300 300" class="player-svg" xmlns="${SVGNS}" aria-label="Футболист ${PLAYER.fullName}">
  <defs>
    <pattern id="stripes" width="14" height="10" patternUnits="userSpaceOnUse">
      <rect width="14" height="10" fill="#141414"/>
      <rect x="0" width="5" height="10" fill="#1f9d55"/>
    </pattern>
    <radialGradient id="ballGrad" cx="35%" cy="35%" r="70%">
      <stop offset="0%" stop-color="#ffffff"/><stop offset="100%" stop-color="#d9d9d9"/>
    </radialGradient>
  </defs>

  <!-- ворота (для ударов) -->
  <g class="goal" style="display:none">
    <rect x="242" y="150" width="54" height="120" fill="none" stroke="#fff" stroke-width="5"/>
    <g class="net" stroke="rgba(255,255,255,.45)" stroke-width="1.5">
      ${Array.from({ length: 6 }, (_, i) => `<line x1="${248 + i * 9}" y1="152" x2="${248 + i * 9}" y2="268"/>`).join("")}
      ${Array.from({ length: 12 }, (_, i) => `<line x1="244" y1="${158 + i * 10}" x2="294" y2="${158 + i * 10}"/>`).join("")}
    </g>
  </g>

  <ellipse class="shadow" cx="120" cy="272" rx="38" ry="6" fill="rgba(0,0,0,.25)"/>

  <g class="whole">
    <!-- левая нога (дальняя) -->
    <g class="legL">
      <rect x="104" y="188" width="15" height="40" rx="6" fill="#141414"/>
      <rect x="105" y="226" width="13" height="30" rx="5" fill="#1f9d55"/>
      <rect x="105" y="232" width="13" height="4" fill="#fff"/>
      <path d="M102 254 h20 a6 6 0 0 1 6 6 v2 h-26 z" fill="#222"/>
    </g>
    <!-- тело -->
    <g class="body">
      <rect x="98" y="118" width="46" height="74" rx="14" fill="url(#stripes)"/>
      <rect x="98" y="118" width="46" height="74" rx="14" fill="none" stroke="#0b0b0b" stroke-width="2"/>
      <text x="121" y="166" text-anchor="middle" font-size="24" font-weight="900" fill="#fff" font-family="Arial Black, Arial, sans-serif" stroke="#0b0b0b" stroke-width="1">${num}</text>
      <!-- руки -->
      <g class="armL"><rect x="86" y="124" width="14" height="44" rx="7" fill="url(#stripes)"/><circle cx="93" cy="172" r="7" fill="#f2c29b"/></g>
      <g class="armR"><rect x="142" y="124" width="14" height="44" rx="7" fill="url(#stripes)"/><circle cx="149" cy="172" r="7" fill="#f2c29b"/></g>
      <!-- шея и голова -->
      <rect x="114" y="106" width="14" height="16" fill="#f2c29b"/>
      <g class="head">
        <circle cx="121" cy="84" r="27" fill="#f6cfaa"/>
        <path d="M94 80 q4 -30 30 -27 q22 2 24 24 q-10 -10 -24 -9 q-16 1 -30 12z" fill="#6b3e1f"/>
        <circle cx="113" cy="88" r="3.4" fill="#222"/>
        <circle cx="131" cy="88" r="3.4" fill="#222"/>
        <circle cx="114.2" cy="86.8" r="1.1" fill="#fff"/>
        <circle cx="132.2" cy="86.8" r="1.1" fill="#fff"/>
        <path class="mouth" d="M113 98 q9 8 18 0" stroke="#7a3b2a" stroke-width="3" fill="none" stroke-linecap="round"/>
        <circle cx="106" cy="96" r="4" fill="rgba(255,120,120,.35)"/>
        <circle cx="137" cy="96" r="4" fill="rgba(255,120,120,.35)"/>
      </g>
    </g>
    <!-- правая нога (ближняя, ударная) -->
    <g class="legR">
      <rect x="122" y="188" width="15" height="40" rx="6" fill="#141414"/>
      <rect x="123" y="226" width="13" height="30" rx="5" fill="#1f9d55"/>
      <rect x="123" y="232" width="13" height="4" fill="#fff"/>
      <path d="M120 254 h20 a6 6 0 0 1 6 6 v2 h-26 z" fill="#111"/>
      <path d="M128 262 h14" stroke="#1f9d55" stroke-width="2"/>
    </g>
  </g>

  <g class="ball">
    <circle cx="0" cy="0" r="12" fill="url(#ballGrad)" stroke="#333" stroke-width="1.2"/>
    <polygon points="0,-5 4.8,-1.5 3,4 -3,4 -4.8,-1.5" fill="#222"/>
    <path d="M0 -5 L0 -12 M4.8 -1.5 L11 -4 M3 4 L7 10 M-3 4 L-7 10 M-4.8 -1.5 L-11 -4" stroke="#222" stroke-width="1.2"/>
  </g>

  <text class="counter" x="150" y="40" text-anchor="middle" font-size="34" font-weight="900" fill="#fff" stroke="#0b5" stroke-width="1.5" font-family="Arial Black, Arial, sans-serif"></text>
  <text class="goaltext" x="200" y="120" text-anchor="middle" font-size="40" font-weight="900" fill="#ffd400" stroke="#000" stroke-width="2" font-family="Arial Black, Arial, sans-serif" style="display:none">ГОЛ!</text>
</svg>`;
}

// ---- математика анимаций ----
const HIP_R = [129, 192];
const HIP_L = [111, 192];
const LEG_LEN = 68;
const lerp = (a, b, t) => a + (b - a) * t;
const clamp01 = (t) => Math.max(0, Math.min(1, t));
const ease = (t) => t * t * (3 - 2 * t);
// точка носка при повороте ноги на угол deg (в SVG положительный угол — по часовой)
function footPos(hip, deg) {
  const r = (deg * Math.PI) / 180;
  return [hip[0] - Math.sin(r) * LEG_LEN, hip[1] + Math.cos(r) * LEG_LEN];
}
// «бугорок» вокруг p=0 (момент касания мяча)
function bump(p, w) {
  const d = Math.min(p, 1 - p);
  return d < w ? ease(1 - d / w) : 0;
}

class PlayerStage {
  constructor(container) {
    this.el = container;
    this.el.innerHTML = playerSVG();
    const q = (s) => this.el.querySelector(s);
    this.svg = q("svg");
    this.parts = {
      whole: q(".whole"), body: q(".body"), head: q(".head"), legL: q(".legL"), legR: q(".legR"),
      armL: q(".armL"), armR: q(".armR"), ball: q(".ball"), goal: q(".goal"), net: q(".net"),
      counter: q(".counter"), goaltext: q(".goaltext"), shadow: q(".shadow"),
    };
    this.raf = null;
    this.onCount = null;
  }

  reset() {
    const p = this.parts;
    ["whole", "body", "head", "legL", "legR", "armL", "armR", "net"].forEach((k) => p[k].removeAttribute("transform"));
    p.goal.style.display = "none";
    p.goaltext.style.display = "none";
    p.counter.textContent = "";
    this.ball(152, 258, 0);
  }

  ball(x, y, rot = 0) {
    this.parts.ball.setAttribute("transform", `translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${rot.toFixed(0)})`);
  }
  rot(part, deg, cx, cy) {
    this.parts[part].setAttribute("transform", `rotate(${deg.toFixed(1)} ${cx} ${cy})`);
  }
  move(part, dx, dy) {
    this.parts[part].setAttribute("transform", `translate(${dx.toFixed(1)} ${dy.toFixed(1)})`);
  }

  stop() {
    if (this.raf) cancelAnimationFrame(this.raf);
    this.raf = null;
  }

  // Запускает анимацию навыка. skill = объект из SKILLS или null (стойка).
  play(skill, { loop = true } = {}) {
    this.stop();
    this.reset();
    const anim = skill ? skill.anim : "idle";
    const fn = this["a_" + anim] ? this["a_" + anim].bind(this) : this.a_idle.bind(this);
    const state = { count: 0, target: skill?.count || 0, lastPhase: 0 };
    let start = performance.now();
    return new Promise((resolve) => {
      const tick = (now) => {
        const done = fn(Math.max(0, (now - start) / 1000), state);
        if (done) {
          if (!loop) {
            this.raf = null;
            resolve();
            return;
          }
          // перезапуск цикла после короткой паузы
          state.count = 0;
          this.reset();
          start = now + 400;
        }
        this.raf = requestAnimationFrame(tick);
      };
      this.raf = requestAnimationFrame(tick);
    });
  }

  breathe(t) {
    const b = Math.sin(t * 3) * 1.5;
    this.move("body", 0, b);
    this.rot("armL", Math.sin(t * 3) * 4, 93, 126);
    this.rot("armR", -Math.sin(t * 3) * 4, 149, 126);
  }

  // ---- стойка: перекатывает мяч подошвой ----
  a_idle(t) {
    this.breathe(t);
    const p = (t % 2) / 2;
    const a = -Math.sin(p * Math.PI * 2) * 10;
    this.rot("legR", a, ...HIP_R);
    const f = footPos(HIP_R, a);
    this.ball(f[0] + 22, 258, Math.sin(p * Math.PI * 2) * 60);
    return false;
  }

  // ---- набивание ногой ----
  jugglingCycle(t, state, { period, contact, apex, legMax, ballX, legKey = "legR", hip = HIP_R, armSwing = true }) {
    const target = state.target || 10;
    // каждые 20 касаний ускоряемся — чтобы 100 раз не длилось вечность
    const speedUp = target >= 50 ? 1.9 : target >= 20 ? 1.35 : 1;
    const per = period / speedUp;
    const startDelay = 0.6;
    if (t < startDelay) {
      // подброс мяча в руки → на ногу
      this.breathe(t);
      const k = t / startDelay;
      this.ball(lerp(152, ballX, k), lerp(258, contact, k) - Math.sin(k * Math.PI) * 50, k * 200);
      this.parts.counter.textContent = "0";
      return false;
    }
    const tt = t - startDelay;
    const n = Math.floor(tt / per);
    const p = (tt % per) / per;
    if (n >= target) {
      // финал: мяч ловится на ногу, игрок радуется
      const k = clamp01((tt - target * per) / 0.9);
      this.parts.counter.textContent = String(target) + " ✓";
      this.rot(legKey, 0, ...hip);
      this.move("body", 0, -Math.sin(k * Math.PI) * 10);
      this.rot("armL", -150 * Math.sin(k * Math.PI), 93, 126);
      this.rot("armR", 150 * Math.sin(k * Math.PI), 149, 126);
      this.ball(lerp(ballX, 152, k), lerp(contact, 258, ease(k)) - Math.sin(k * Math.PI) * 60, k * 300);
      return k >= 1 && tt > target * per + 1.6;
    }
    if (n + 1 !== state.count && n + 1 <= target) {
      state.count = n + 1;
      this.parts.counter.textContent = String(state.count);
      if (this.onCount) this.onCount(state.count);
    }
    const lb = bump(p, 0.18);
    this.rot(legKey, legMax * lb, ...hip);
    const h = apex * Math.sin(p * Math.PI);
    this.ball(ballX + Math.sin(p * Math.PI * 2) * 3, contact - h, p * 360);
    this.move("body", 0, -lb * 2);
    if (armSwing) {
      this.rot("armL", 20 * Math.sin(tt * 4), 93, 126);
      this.rot("armR", -25 - 10 * Math.sin(tt * 4), 149, 126);
    }
    return false;
  }

  a_juggle(t, s) {
    return this.jugglingCycle(t, s, { period: 0.62, contact: 236, apex: 80, legMax: -42, ballX: 172 });
  }
  a_knee(t, s) {
    return this.jugglingCycle(t, s, { period: 0.6, contact: 196, apex: 70, legMax: -80, ballX: 158 });
  }
  a_head(t, s) {
    const r = this.jugglingCycle(t, s, { period: 0.7, contact: 44, apex: 55, legMax: 0, ballX: 123, armSwing: true });
    // кивок головой в момент касания
    const per = 0.7 / (s.target >= 20 ? 1.35 : 1);
    const tt = Math.max(0, t - 0.6);
    const p = (tt % per) / per;
    if (t > 0.6) this.move("head", 0, -bump(p, 0.15) * 6);
    return r;
  }

  // ---- удар по воротам ----
  shotCycle(t, targetY, label) {
    const g = this.parts;
    g.goal.style.display = "";
    this.breathe(t);
    const T = 2.6;
    if (t > T) return true;
    // 0..0.5 замах, 0.5..0.65 удар, 0.65..1.4 полёт, 1.4.. гол
    let leg = 0;
    if (t < 0.5) leg = 35 * ease(t / 0.5);
    else if (t < 0.65) leg = lerp(35, -60, ease((t - 0.5) / 0.15));
    else leg = lerp(-60, 0, clamp01((t - 0.65) / 0.6));
    this.rot("legR", leg, ...HIP_R);
    if (t < 0.6) this.ball(162, 258, 0);
    else {
      const k = clamp01((t - 0.6) / 0.55);
      const x = lerp(162, 280, k);
      const y = lerp(258, targetY, k) - Math.sin(k * Math.PI) * 40;
      this.ball(x, y, k * 900);
    }
    if (t > 1.15) {
      g.goaltext.style.display = "";
      g.goaltext.textContent = label;
      const s = Math.sin((t - 1.15) * 30) * Math.max(0, 1 - (t - 1.15) * 1.5) * 3;
      g.net.setAttribute("transform", `translate(${s} 0)`);
      // радость
      const k = clamp01((t - 1.15) / 0.5);
      this.rot("armL", -150 * k, 93, 126);
      this.rot("armR", 150 * k, 149, 126);
      this.move("body", 0, -Math.abs(Math.sin((t - 1.15) * 8)) * 6);
    }
    return false;
  }
  a_shot(t) {
    return this.shotCycle(t, 236, "ГОЛ!");
  }
  a_topcorner(t) {
    return this.shotCycle(t, 166, "В ДЕВЯТКУ!");
  }

  // ---- финт «Рулетка»: разворот на 360° с мячом ----
  a_roulette(t) {
    const T = 2.4;
    if (t > T) return true;
    const k = clamp01((t - 0.3) / 1.4);
    const spin = Math.cos(ease(k) * Math.PI * 2);
    const dx = ease(k) * 40;
    this.parts.whole.setAttribute("transform", `translate(${120 + dx} 0) scale(${spin.toFixed(3)} 1) translate(-120 0)`);
    this.ball(152 + dx + Math.sin(k * Math.PI * 2) * 10, 258, k * 720);
    if (t > 1.8) this.parts.counter.textContent = "Рулетка!";
    return false;
  }

  // ---- финт «Радуга»: мяч перелетает над головой ----
  a_rainbow(t) {
    const T = 2.6;
    if (t > T) return true;
    this.breathe(t);
    let leg = 0;
    if (t < 0.6) {
      // мяч закатывается за ногу
      const k = ease(t / 0.6);
      this.ball(lerp(152, 98, k), 258, -k * 300);
      leg = 20 * k;
    } else if (t < 0.8) {
      leg = lerp(20, 50, (t - 0.6) / 0.2);
      this.ball(98, 258, 0);
    } else {
      const k = clamp01((t - 0.8) / 1.0);
      leg = lerp(50, 0, clamp01(k * 2));
      this.ball(lerp(98, 200, k), 258 - Math.sin(k * Math.PI) * 225, k * 720);
    }
    this.rot("legR", leg, ...HIP_R);
    this.rot("legL", leg * 0.8, ...HIP_L);
    if (t > 1.9) this.parts.counter.textContent = "Радуга! 🌈";
    return false;
  }

  // ---- финт «Ножницы»: ноги обводят мяч ----
  a_stepover(t) {
    const T = 2.6;
    if (t > T) return true;
    this.breathe(t);
    if (t < 1.6) {
      const p = (t % 0.4) / 0.4;
      const side = Math.floor(t / 0.4) % 2;
      const a = Math.sin(p * Math.PI) * -35;
      if (side) this.rot("legR", a, ...HIP_R), this.rot("legL", 0, ...HIP_L);
      else this.rot("legL", a, ...HIP_L), this.rot("legR", 0, ...HIP_R);
      this.move("whole", Math.sin(t * Math.PI * 2.5) * 6, 0);
      this.ball(165, 258, 0);
    } else {
      // рывок с мячом
      const k = ease(clamp01((t - 1.6) / 0.8));
      this.parts.whole.setAttribute("transform", `translate(${k * 60} 0)`);
      this.rot("legR", -30 * Math.sin(k * Math.PI * 3), ...HIP_R);
      this.ball(165 + k * 100, 258, k * 500);
      this.parts.counter.textContent = "Ножницы! ✂️";
    }
    return false;
  }

  // ---- удар через себя ----
  a_bicycle(t) {
    const g = this.parts;
    g.goal.style.display = "";
    const T = 3.2;
    if (t > T) return true;
    // мяч прилетает сверху-слева
    if (t < 0.9) {
      const k = t / 0.9;
      this.ball(lerp(10, 125, k), lerp(60, 70, k) - Math.sin(k * Math.PI) * 40, k * 400);
    }
    // игрок взлетает и переворачивается
    let r = 0, lift = 0;
    if (t >= 0.5 && t < 1.3) {
      const k = ease((t - 0.5) / 0.8);
      r = -170 * k;
      lift = -60 * Math.sin(k * Math.PI * 0.5);
    } else if (t >= 1.3 && t < 2.1) {
      const k = ease((t - 1.3) / 0.8);
      r = lerp(-170, -360, k);
      lift = lerp(-60, 0, k);
    }
    g.whole.setAttribute("transform", `translate(0 ${lift.toFixed(1)}) rotate(${r.toFixed(1)} 120 160)`);
    const kickA = t > 0.85 && t < 1.15 ? -70 * Math.sin(((t - 0.85) / 0.3) * Math.PI) : 0;
    this.rot("legR", kickA, ...HIP_R);
    if (t >= 0.9) {
      const k = clamp01((t - 0.95) / 0.5);
      this.ball(lerp(125, 282, k), lerp(70, 200, k), k * 900);
    }
    if (t > 1.45) {
      g.goaltext.style.display = "";
      g.goaltext.textContent = "СУПЕРГОЛ!";
      const s = Math.sin((t - 1.45) * 30) * Math.max(0, 1 - (t - 1.45) * 1.5) * 3;
      g.net.setAttribute("transform", `translate(${s} 0)`);
    }
    return false;
  }
}
