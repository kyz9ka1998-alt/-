// Анимированный футболист: шарнирный «скелет» (бедро → колено → стопа, плечо → локоть),
// стадион, вратарь и эффекты. Всё рисуется в SVG, без картинок.

const SVGNS = "http://www.w3.org/2000/svg";
const GROUND = 262; // линия газона
const ANKLE_Y = GROUND - 5; // голеностоп стоящей ноги
const LEN = { thigh: 34, shin: 33, foot: 15, torso: 46, neck: 7, head: 19, upper: 23, fore: 21 };
const STAND_Y = 194; // таз в стойке (колени чуть согнуты)
const BALL_R = 11;
const D2R = Math.PI / 180;

const lerp = (a, b, t) => a + (b - a) * t;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const clamp01 = (t) => clamp(t, 0, 1);
const ease = (t) => t * t * (3 - 2 * t);
const easeOut = (t) => 1 - (1 - t) * (1 - t);
const seg = (t, a, b) => clamp01((t - a) / (b - a)); // прогресс отрезка времени [a, b]
// угол 0 — вниз, положительный — вперёд (вправо)
const vec = (p, a, L) => [p[0] + Math.sin(a * D2R) * L, p[1] + Math.cos(a * D2R) * L];
// «бугорок» вокруг p = 0 (момент касания мяча)
function bump(p, w) {
  const d = Math.min(p, 1 - p);
  return d < w ? ease(1 - d / w) : 0;
}
function mixLeg(a, b, t) {
  return { th: lerp(a.th, b.th, t), k: lerp(a.k, b.k, t), point: lerp(a.point ?? 20, b.point ?? 20, t) };
}

// Обратная кинематика для ноги из двух звеньев: колено сгибается вперёд.
function ik(hip, target, L1, L2) {
  let dx = target[0] - hip[0];
  let dy = target[1] - hip[1];
  let d = Math.hypot(dx, dy);
  const max = L1 + L2 - 0.01;
  if (d > max) {
    dx *= max / d;
    dy *= max / d;
    d = max;
  }
  d = Math.max(d, 1);
  const a0 = Math.atan2(dx, dy) / D2R;
  const alpha = Math.acos(clamp((L1 * L1 + d * d - L2 * L2) / (2 * L1 * d), -1, 1)) / D2R;
  const beta = Math.acos(clamp((L1 * L1 + L2 * L2 - d * d) / (2 * L1 * L2), -1, 1)) / D2R;
  return { th: a0 + alpha, k: 180 - beta };
}

// ---------- комплекты формы ----------
const KIT_PLAYER = {
  shirt: "#141414", stripe: "#1f9d55", trim: "#1f9d55", shorts: "#111111", sock: "#1f9d55", band: "#ffffff",
  boot: "#ffd400", sole: "#111", skin: "#f3c6a0", skinB: "#e0ad86", hair: "#6b3e1f", number: "8", numColor: "#fff",
};
const KIT_KEEPER = {
  shirt: "#ff8f00", stripe: "#ffb74d", trim: "#263238", shorts: "#263238", sock: "#ff8f00", band: "#263238",
  boot: "#ffffff", sole: "#263238", skin: "#e8b48c", skinB: "#d39b72", hair: "#222", number: "1", numColor: "#263238", gloves: "#76ff03",
};

let RIG_UID = 0;

// затемнение цвета для дальней руки и ноги (вместо CSS-фильтра — его не везде поддерживает Safari)
function shade(hex, f) {
  const n = parseInt(hex.slice(1), 16);
  const c = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => Math.round(v * f));
  return "#" + c.map((v) => v.toString(16).padStart(2, "0")).join("");
}
function shadeKit(kit, f) {
  const out = {};
  for (const [k, v] of Object.entries(kit)) out[k] = typeof v === "string" && /^#[0-9a-f]{6}$/i.test(v) ? shade(v, f) : v;
  return out;
}

class Rig {
  constructor(g, kit) {
    this.g = g;
    this.kit = kit;
    const id = "r" + ++RIG_UID;
    const k = kit;
    g.innerHTML = `
      <defs>
        <pattern id="${id}-st" width="12" height="10" patternUnits="userSpaceOnUse">
          <rect width="12" height="10" fill="${k.shirt}"/><rect width="5" height="10" fill="${k.stripe}"/>
        </pattern>
      </defs>
      <g class="armB">${this.armHTML(true)}</g>
      <g class="legB">${this.legHTML(true)}</g>
      <g class="torso">
        <rect x="-15" y="${-LEN.torso - 5}" width="30" height="${LEN.torso + 12}" rx="11" fill="url(#${id}-st)" stroke="#0b0b0b" stroke-width="1.5"/>
        <path d="M-7 ${-LEN.torso - 4} q7 7 14 0" fill="none" stroke="${k.trim}" stroke-width="3"/>
        <text x="1" y="${-LEN.torso / 2 + 7}" text-anchor="middle" font-size="19" font-weight="900" fill="${k.numColor}" stroke="#000" stroke-width=".8" font-family="Arial Black, Arial, sans-serif">${k.number}</text>
        <rect x="-16" y="-5" width="32" height="15" rx="6" fill="${k.shorts}"/>
      </g>
      <g class="legF">${this.legHTML(false)}</g>
      <line class="neck" stroke="${k.skin}" stroke-width="10" stroke-linecap="round"/>
      <g class="head">
        <circle r="${LEN.head}" fill="${k.skin}"/>
        <path d="M-19 -2 q-2 -22 19 -20 q17 1 20 15 q-9 -7 -21 -6 q-6 3 -9 13 q-5 -6 -9 -2z" fill="${k.hair}"/>
        <ellipse cx="-6" cy="3" rx="4" ry="5.5" fill="${k.skinB}"/>
        <ellipse cx="7" cy="0" rx="2.6" ry="3.4" fill="#222"/><circle cx="7.8" cy="-1" r="1" fill="#fff"/>
        <ellipse cx="15" cy="0" rx="2.2" ry="3.1" fill="#222"/><circle cx="15.6" cy="-1" r=".9" fill="#fff"/>
        <path class="mouth" d="M7 9 q5 5 10 0" stroke="#8a3b2a" stroke-width="2.6" fill="none" stroke-linecap="round"/>
        <circle cx="4" cy="8" r="3.5" fill="rgba(255,110,110,.35)"/>
      </g>
      <g class="armF">${this.armHTML(false)}</g>`;
    const q = (s) => g.querySelector(s);
    this.el = {
      torso: q(".torso"), neck: q(".neck"), head: q(".head"), mouth: q(".mouth"),
      legF: this.legEls(q(".legF")), legB: this.legEls(q(".legB")),
      armF: this.armEls(q(".armF")), armB: this.armEls(q(".armB")),
    };
  }
  legHTML(back) {
    const k = back ? shadeKit(this.kit, 0.78) : this.kit;
    return `<g>
      <line class="thigh" stroke="${k.skin}" stroke-width="12" stroke-linecap="round"/>
      <line class="short" stroke="${k.shorts}" stroke-width="16" stroke-linecap="round"/>
      <line class="shin" stroke="${k.sock}" stroke-width="10.5" stroke-linecap="round"/>
      <line class="band" stroke="${k.band}" stroke-width="11"/>
      <path class="boot" fill="${k.boot}" stroke="${k.sole}" stroke-width="1.6" stroke-linejoin="round"/>
      <line class="sole" stroke="${k.sole}" stroke-width="3" stroke-linecap="round"/>
    </g>`;
  }
  armHTML(back) {
    const k = back ? shadeKit(this.kit, 0.78) : this.kit;
    const hand = k.gloves || k.skin;
    return `<g>
      <line class="upper" stroke="${k.shirt}" stroke-width="11" stroke-linecap="round"/>
      <line class="upperS" stroke="${k.stripe}" stroke-width="4" stroke-linecap="round"/>
      <line class="fore" stroke="${k.gloves ? k.shirt : k.skin}" stroke-width="8.5" stroke-linecap="round"/>
      <circle class="hand" r="${k.gloves ? 7 : 5.2}" fill="${hand}"/>
    </g>`;
  }
  legEls(g) {
    const q = (s) => g.querySelector(s);
    return { thigh: q(".thigh"), short: q(".short"), shin: q(".shin"), band: q(".band"), boot: q(".boot"), sole: q(".sole") };
  }
  armEls(g) {
    const q = (s) => g.querySelector(s);
    return { upper: q(".upper"), upperS: q(".upperS"), fore: q(".fore"), hand: q(".hand") };
  }

  // Считает положения суставов по позе (в локальных координатах).
  joints(p) {
    const pel = [p.x, p.y];
    const leg = (spec, dx) => {
      const hip = [p.x + dx, p.y + 4];
      let th, k;
      if (spec.foot) ({ th, k } = ik(hip, spec.foot, LEN.thigh, LEN.shin));
      else ({ th, k } = spec);
      const knee = vec(hip, th, LEN.thigh);
      const shinA = th - k;
      const ankle = vec(knee, shinA, LEN.shin);
      const footA = spec.flat ? 90 : spec.footA ?? shinA + 90 - (spec.point ?? 20);
      const toe = vec(ankle, footA, LEN.foot);
      return { hip, knee, ankle, toe, footA, shinA, th };
    };
    const shoulder = vec(pel, 180 - p.lean, LEN.torso - 4);
    const arm = (spec) => {
      const elbow = vec(shoulder, spec.s, LEN.upper);
      const hand = vec(elbow, spec.s + spec.e, LEN.fore);
      return { elbow, hand };
    };
    const tilt = p.head || 0;
    const headC = vec(shoulder, 180 - p.lean - tilt * 0.4, LEN.neck + LEN.head - 2);
    return {
      pel, shoulder, headC,
      legF: leg(p.legF, 2), legB: leg(p.legB, -3),
      armF: arm(p.armF), armB: arm(p.armB),
    };
  }

  draw(p) {
    const J = this.joints(p);
    const set = (el, a, b) => {
      el.setAttribute("x1", a[0].toFixed(1));
      el.setAttribute("y1", a[1].toFixed(1));
      el.setAttribute("x2", b[0].toFixed(1));
      el.setAttribute("y2", b[1].toFixed(1));
    };
    const legDraw = (E, L) => {
      set(E.thigh, L.hip, L.knee);
      set(E.short, L.hip, [lerp(L.hip[0], L.knee[0], 0.5), lerp(L.hip[1], L.knee[1], 0.5)]);
      set(E.shin, L.knee, L.ankle);
      const b1 = [lerp(L.knee[0], L.ankle[0], 0.12), lerp(L.knee[1], L.ankle[1], 0.12)];
      const b2 = [lerp(L.knee[0], L.ankle[0], 0.26), lerp(L.knee[1], L.ankle[1], 0.26)];
      set(E.band, b1, b2);
      // бутса: от пятки к носку, верх — по нормали
      const u = [Math.sin(L.footA * D2R), Math.cos(L.footA * D2R)];
      const n = [u[1], -u[0]]; // «вверх» относительно стопы
      const A = L.ankle;
      const heel = [A[0] - u[0] * 5, A[1] - u[1] * 5];
      const toe = [A[0] + u[0] * LEN.foot, A[1] + u[1] * LEN.foot];
      const pt = (b, s) => `${(b[0] + n[0] * s).toFixed(1)} ${(b[1] + n[1] * s).toFixed(1)}`;
      E.boot.setAttribute(
        "d",
        `M${pt(heel, -2)} L${pt(toe, -2)} Q${pt([toe[0] + u[0] * 3, toe[1] + u[1] * 3], 2)} ${pt(toe, 4)} L${pt(A, 8)} L${pt(heel, 7)} Z`
      );
      set(E.sole, [heel[0] - n[0] * 2.5, heel[1] - n[1] * 2.5], [toe[0] - n[0] * 2.5, toe[1] - n[1] * 2.5]);
    };
    const armDraw = (E, sh, A) => {
      const mid = [lerp(sh[0], A.elbow[0], 0.75), lerp(sh[1], A.elbow[1], 0.75)];
      set(E.upper, sh, mid);
      set(E.upperS, [lerp(sh[0], mid[0], 0.6), lerp(sh[1], mid[1], 0.6)], mid);
      set(E.fore, mid, A.hand);
      // предплечье начинается от локтя
      set(E.fore, A.elbow, A.hand);
      E.upper.setAttribute("x2", A.elbow[0].toFixed(1));
      E.upper.setAttribute("y2", A.elbow[1].toFixed(1));
      E.hand.setAttribute("cx", A.hand[0].toFixed(1));
      E.hand.setAttribute("cy", A.hand[1].toFixed(1));
    };
    legDraw(this.el.legB, J.legB);
    legDraw(this.el.legF, J.legF);
    armDraw(this.el.armB, J.shoulder, J.armB);
    armDraw(this.el.armF, J.shoulder, J.armF);
    this.el.torso.setAttribute("transform", `translate(${p.x.toFixed(1)} ${p.y.toFixed(1)}) rotate(${p.lean.toFixed(1)})`);
    set(this.el.neck, J.shoulder, J.headC);
    this.el.head.setAttribute("transform", `translate(${J.headC[0].toFixed(1)} ${J.headC[1].toFixed(1)}) rotate(${(p.lean + (p.head || 0)).toFixed(1)})`);
    this.el.mouth.setAttribute("d", p.shout ? "M7 7 q5 9 10 0 z" : "M7 9 q5 5 10 0");
    // общий поворот / отражение (финты, сальто, прыжок вратаря)
    const rot = p.rot || 0;
    const flip = p.flip ?? 1;
    const cx = p.x;
    const cy = p.y - 10;
    this.g.setAttribute("transform", rot || flip !== 1 ? `translate(${cx} ${cy}) scale(${flip.toFixed(3)} 1) rotate(${rot.toFixed(1)}) translate(${-cx} ${-cy})` : "");
    return J;
  }
}

// ---------- базовые позы ----------
function standPose(x, y = STAND_Y) {
  return {
    x, y, lean: 3, head: 0,
    legF: { foot: [x + 10, ANKLE_Y], flat: true },
    legB: { foot: [x - 9, ANKLE_Y], flat: true },
    armF: { s: 10, e: 25 },
    armB: { s: -8, e: 25 },
  };
}

// Бег: phase — доля шага (1 = полный цикл из двух шагов)
function runPose(x, phase, { lean = 12, amp = 1 } = {}) {
  const w = phase * Math.PI * 2;
  const leg = (o) => {
    const s = Math.sin(w + o);
    const c = Math.cos(w + o + 0.3);
    return { th: 34 * amp * s, k: 14 + 88 * amp * Math.max(0, c), point: 25 };
  };
  return {
    x, y: STAND_Y - 3 - 4 * amp * Math.abs(Math.sin(w * 2 + 0.5)), lean, head: -lean * 0.6,
    legF: leg(0), legB: leg(Math.PI),
    armF: { s: -40 * amp * Math.sin(w), e: 80 },
    armB: { s: 40 * amp * Math.sin(w), e: 80 },
  };
}

// ---------- сцена: стадион ----------
function rnd(seed) {
  let s = seed;
  return () => ((s = (s * 9301 + 49297) % 233280) / 233280);
}

function sceneSVG(uid) {
  const r = rnd(7);
  const fans = ["#141414", "#1f9d55", "#1f9d55", "#2ecc71", "#ffffff", "#ffd400", "#141414", "#e53935", "#1e66f5"];
  let crowd = "";
  for (let row = 0; row < 5; row++) {
    const y = 78 + row * 14;
    for (let i = 0; i < 34; i++) {
      const x = -52 + i * 11.6 + (row % 2) * 5 + r() * 3;
      const c = fans[Math.floor(r() * fans.length)];
      const d = (r() * 0.8).toFixed(2);
      crowd += `<g class="fan" style="animation-delay:${d}s"><circle cx="${x.toFixed(1)}" cy="${y}" r="4" fill="#f1c7a3"/><rect x="${(x - 4.5).toFixed(1)}" y="${y + 3.5}" width="9" height="8" rx="3" fill="${c}"/></g>`;
    }
  }
  let flashes = "";
  for (let i = 0; i < 10; i++) flashes += `<circle class="flash" cx="${(10 + r() * 280).toFixed(0)}" cy="${(80 + r() * 60).toFixed(0)}" r="2.2" fill="#fff" style="animation-delay:${(r() * 2).toFixed(2)}s"/>`;
  let stars = "";
  for (let i = 0; i < 18; i++) stars += `<circle cx="${(r() * 400 - 50).toFixed(0)}" cy="${(r() * 50).toFixed(0)}" r="${(0.5 + r()).toFixed(1)}" fill="#fff" opacity="${(0.4 + r() * 0.6).toFixed(2)}"/>`;
  const boards = ["HELLO!", "ENGLISH", "⚽ GOAL!", "ROMAN 8", "HELLO!", "ENGLISH", "⚽ GOAL!"];
  const bcol = ["#e53935", "#1f9d55", "#141414", "#ffd400", "#1e66f5", "#1f9d55", "#141414"];
  const net = [];
  for (let i = 0; i <= 8; i++) net.push(`<line x1="${232 + i * 8}" y1="172" x2="${238 + i * 7}" y2="236"/>`);
  for (let j = 0; j <= 7; j++) net.push(`<line x1="${232 + j * 0.8}" y1="${172 + j * 9}" x2="296" y2="${172 + j * 9}"/>`);
  return `
<svg viewBox="-45 8 390 292" preserveAspectRatio="xMidYMid slice" class="player-svg" xmlns="${SVGNS}" aria-label="Футболист ${PLAYER.fullName}">
  <defs>
    <linearGradient id="sky${uid}" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#0b1440"/><stop offset=".6" stop-color="#3b2a8a"/><stop offset="1" stop-color="#c2477a"/>
    </linearGradient>
    <linearGradient id="beam${uid}" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#fffbe0" stop-opacity=".55"/><stop offset="1" stop-color="#fffbe0" stop-opacity="0"/>
    </linearGradient>
    <linearGradient id="grass${uid}" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#2fb565"/><stop offset="1" stop-color="#1c8a45"/>
    </linearGradient>
    <radialGradient id="ballG${uid}" cx="35%" cy="30%" r="75%">
      <stop offset="0" stop-color="#fff"/><stop offset=".7" stop-color="#e8e8e8"/><stop offset="1" stop-color="#b9b9b9"/>
    </radialGradient>
    <radialGradient id="glow${uid}" cx="50%" cy="50%" r="50%">
      <stop offset="0" stop-color="#fff" stop-opacity="1"/><stop offset="1" stop-color="#fff6b0" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <style>
    .fan { animation: fanBob 1.6s ease-in-out infinite; transform-box: fill-box; }
    .cheer .fan { animation: fanJump .45s ease-in-out infinite; }
    @keyframes fanBob { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-1px); } }
    @keyframes fanJump { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-6px); } }
    .flash { opacity: 0; }
    .cheer .flash { animation: flash .6s steps(1) infinite; }
    @keyframes flash { 0% { opacity: 1; } 30% { opacity: 0; } }
    .beam { animation: beam 4s ease-in-out infinite; transform-origin: top; transform-box: fill-box; }
    @keyframes beam { 0%,100% { opacity: .75; } 50% { opacity: 1; } }
    .gtext { transform-box: fill-box; transform-origin: center; }
  </style>

  <!-- небо и прожекторы -->
  <rect x="-60" width="420" height="170" fill="url(#sky${uid})"/>
  ${stars}
  <polygon class="beam" points="-12,18 -80,170 100,170" fill="url(#beam${uid})"/>
  <polygon class="beam" points="312,18 200,170 380,170" fill="url(#beam${uid})" style="animation-delay:2s"/>
  <g>
    <rect x="-16" y="8" width="8" height="70" fill="#2b2b3a"/>
    <rect x="-26" y="2" width="28" height="14" rx="3" fill="#3a3a4d"/>
    <circle cx="-19" cy="9" r="3.4" fill="#fffbe0"/><circle cx="-12" cy="9" r="3.4" fill="#fffbe0"/><circle cx="-5" cy="9" r="3.4" fill="#fffbe0"/>
    <circle cx="-12" cy="9" r="20" fill="url(#glow${uid})" opacity=".55"/>
    <rect x="308" y="8" width="8" height="70" fill="#2b2b3a"/>
    <rect x="298" y="2" width="28" height="14" rx="3" fill="#3a3a4d"/>
    <circle cx="305" cy="9" r="3.4" fill="#fffbe0"/><circle cx="312" cy="9" r="3.4" fill="#fffbe0"/><circle cx="319" cy="9" r="3.4" fill="#fffbe0"/>
    <circle cx="312" cy="9" r="20" fill="url(#glow${uid})" opacity=".55"/>
  </g>

  <!-- трибуны -->
  <path d="M-60 64 L360 64 L360 150 L-60 150 Z" fill="#23264a"/>
  <path d="M-60 64 L360 64 L360 70 L-60 70 Z" fill="#1f9d55"/>
  <g class="crowd">${crowd}${flashes}</g>

  <!-- рекламные щиты -->
  ${boards.map((b, i) => `<rect x="${i * 60 - 60}" y="148" width="60" height="16" fill="${bcol[i]}"/><text x="${i * 60 - 30}" y="160" text-anchor="middle" font-size="9" font-weight="900" fill="${bcol[i] === "#ffd400" ? "#141414" : "#fff"}" font-family="Arial Black, Arial, sans-serif">${b}</text>`).join("")}

  <!-- газон -->
  <rect x="-60" y="164" width="420" height="136" fill="url(#grass${uid})"/>
  ${Array.from({ length: 8 }, (_, i) => `<rect x="${i * 60 - 60}" y="164" width="30" height="136" fill="rgba(255,255,255,.06)"/>`).join("")}
  <path d="M-60 236 L360 236" stroke="rgba(255,255,255,.75)" stroke-width="2"/>
  <path d="M60 300 Q150 255 240 300" fill="none" stroke="rgba(255,255,255,.6)" stroke-width="2"/>

  <!-- ворота (вдалеке) -->
  <g class="goal">
    <g class="net" stroke="rgba(255,255,255,.55)" stroke-width="1">${net.join("")}</g>
    <path d="M232 236 L232 170 L296 170" fill="none" stroke="#fff" stroke-width="4.5" stroke-linejoin="round"/>
    
  </g>
  <g class="rig-keeper" style="display:none"><g class="keeper-body"></g></g>

  <!-- тени -->
  <ellipse class="shadow" cx="120" cy="${GROUND + 3}" rx="34" ry="5.5" fill="rgba(0,0,0,.3)"/>
  <ellipse class="bshadow" cx="150" cy="${GROUND + 3}" rx="10" ry="3" fill="rgba(0,0,0,.28)"/>

  <g class="rig-player"></g>

  <!-- мяч и шлейф -->
  <g class="trail">${[0, 1, 2, 3, 4].map((i) => `<circle r="${BALL_R - i * 1.4}" fill="#fff" opacity="${0.35 - i * 0.06}"/>`).join("")}</g>
  <g class="ball">
    <circle r="${BALL_R}" fill="url(#ballG${uid})" stroke="#333" stroke-width="1.2"/>
    <polygon points="0,-4.6 4.4,-1.4 2.7,3.7 -2.7,3.7 -4.4,-1.4" fill="#141414"/>
    <path d="M0 -4.6 L0 -11 M4.4 -1.4 L10.4 -3.4 M2.7 3.7 L6.4 9 M-2.7 3.7 L-6.4 9 M-4.4 -1.4 L-10.4 -3.4" stroke="#141414" stroke-width="1.3"/>
    <path d="M-7 -8.4 L-3.5 -11 M7 -8.4 L3.5 -11 M11 2 L9.6 6 M-11 2 L-9.6 6 M-3 10.6 L3 10.6" stroke="#141414" stroke-width="2.4" stroke-linecap="round"/>
  </g>

  <g class="sparks"></g>
  <text class="counter" x="150" y="40" text-anchor="middle" font-size="30" font-weight="900" fill="#ffd400" stroke="#141414" stroke-width="2" paint-order="stroke" font-family="Arial Black, Arial, sans-serif"></text>
  <text class="gtext" x="150" y="60" text-anchor="middle" font-size="38" font-weight="900" fill="#ffd400" stroke="#141414" stroke-width="3" paint-order="stroke" font-family="Arial Black, Arial, sans-serif" style="display:none">ГОЛ!</text>
</svg>`;
}

let STAGE_UID = 0;

class PlayerStage {
  constructor(container) {
    this.el = container;
    const uid = ++STAGE_UID;
    container.innerHTML = sceneSVG(uid);
    const q = (s) => container.querySelector(s);
    this.svg = q("svg");
    this.rig = new Rig(q(".rig-player"), KIT_PLAYER);
    this.keeperWrap = q(".rig-keeper");
    this.keeper = new Rig(q(".keeper-body"), KIT_KEEPER);
    // вратарь стоит в воротах вдалеке — уменьшен
    q(".keeper-body").parentNode.setAttribute("transform", "translate(264 236) scale(.4) translate(-120 -262)");
    this.parts = {
      ball: q(".ball"), trail: [...q(".trail").children], shadow: q(".shadow"), bshadow: q(".bshadow"),
      net: q(".net"), counter: q(".counter"), gtext: q(".gtext"), sparks: q(".sparks"), crowd: q(".crowd"),
    };
    this.raf = null;
    this.onCount = null;
    this.hist = [];
    this.sparkList = [];
  }

  stop() {
    if (this.raf) cancelAnimationFrame(this.raf);
    this.raf = null;
  }

  reset() {
    this.parts.counter.textContent = "";
    this.parts.gtext.style.display = "none";
    this.parts.net.removeAttribute("transform");
    this.parts.crowd.classList.remove("cheer");
    this.parts.sparks.innerHTML = "";
    this.sparkList = [];
    this.hist = [];
    this.keeperWrap.style.display = "none";
  }

  // мяч: x, y, вращение, масштаб (дальше — меньше), показывать ли шлейф
  drawBall(x, y, rot = 0, scale = 1, trail = false) {
    const P = this.parts;
    P.ball.setAttribute("transform", `translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${rot.toFixed(0)}) scale(${scale.toFixed(2)})`);
    this.hist.unshift([x, y, scale]);
    this.hist.length = 6;
    P.trail.forEach((c, i) => {
      const h = this.hist[i + 1];
      if (trail && h) {
        c.setAttribute("cx", h[0].toFixed(1));
        c.setAttribute("cy", h[1].toFixed(1));
        c.setAttribute("transform", "");
        c.style.display = "";
        c.setAttribute("r", ((BALL_R - i * 1.4) * h[2]).toFixed(1));
      } else c.style.display = "none";
    });
    // тень мяча: ближе к земле — темнее и крупнее
    const ground = scale < 0.95 ? 238 : GROUND + 3;
    const h = Math.max(0, ground - y);
    P.bshadow.setAttribute("cx", x.toFixed(1));
    P.bshadow.setAttribute("cy", ground);
    P.bshadow.setAttribute("rx", (10 * scale * Math.max(0.3, 1 - h / 200)).toFixed(1));
    P.bshadow.setAttribute("opacity", Math.max(0.15, 1 - h / 160).toFixed(2));
  }

  drawPlayer(pose) {
    const J = this.rig.draw(pose);
    const lift = Math.max(0, STAND_Y - pose.y);
    this.parts.shadow.setAttribute("cx", pose.x.toFixed(1));
    this.parts.shadow.setAttribute("rx", (34 * Math.max(0.5, 1 - lift / 140)).toFixed(1));
    return J;
  }

  drawKeeper(pose) {
    this.keeperWrap.style.display = "";
    this.keeper.draw(pose);
  }

  goal(text, t0, t) {
    const P = this.parts;
    const k = t - t0;
    if (k < 0) return;
    P.gtext.style.display = "";
    P.gtext.textContent = text;
    const s = k < 0.3 ? easeOut(k / 0.3) * 1.25 : 1.25 - 0.25 * ease(clamp01((k - 0.3) / 0.3));
    P.gtext.setAttribute("transform", `scale(${s.toFixed(3)}) rotate(${(Math.sin(k * 6) * 4).toFixed(1)})`);
    const shake = Math.sin(k * 40) * Math.max(0, 1 - k * 1.6) * 3;
    P.net.setAttribute("transform", `translate(${shake.toFixed(1)} 0)`);
    P.crowd.classList.add("cheer");
    if (!this.sparkList.length) this.burst(262, 200);
    this.updateSparks(k);
  }

  burst(x, y) {
    const cols = ["#ffd400", "#1f9d55", "#ffffff", "#ff5a5a", "#1e66f5", "#2ecc71"];
    let html = "";
    this.sparkList = [];
    for (let i = 0; i < 28; i++) {
      const a = Math.random() * Math.PI * 2;
      const v = 40 + Math.random() * 90;
      this.sparkList.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 60, r: Math.random() * 360 });
      html += `<rect width="5" height="8" rx="1" fill="${cols[i % cols.length]}"/>`;
    }
    this.parts.sparks.innerHTML = html;
  }
  updateSparks(k) {
    const els = this.parts.sparks.children;
    this.sparkList.forEach((s, i) => {
      const x = s.x + s.vx * k;
      const y = s.y + s.vy * k + 140 * k * k;
      els[i].setAttribute("transform", `translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${(s.r + k * 500).toFixed(0)})`);
      els[i].setAttribute("opacity", Math.max(0, 1 - k / 1.6).toFixed(2));
    });
  }

  // Запускает анимацию навыка (skill — из SKILLS) или стойку с мячом (null)
  play(skill, { loop = true } = {}) {
    this.stop();
    this.reset();
    const anim = skill ? skill.anim : "idle";
    const fn = (this["a_" + anim] || this.a_idle).bind(this);
    const state = { count: 0, target: skill?.count || 0 };
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
          state.count = 0;
          this.reset();
          start = now + 500;
        }
        this.raf = requestAnimationFrame(tick);
      };
      this.raf = requestAnimationFrame(tick);
    });
  }

  count(n) {
    if (n !== this._lastCount) {
      this._lastCount = n;
      this.parts.counter.textContent = String(n);
      if (n > 0 && this.onCount) this.onCount(n);
    }
  }

  // =================== АНИМАЦИИ ===================

  // стойка: перекатывает мяч подошвой и пританцовывает
  a_idle(t) {
    const p = standPose(110, STAND_Y + Math.sin(t * 3) * 1.4);
    const w = Math.sin(t * 2.2);
    const bx = 140 + w * 6;
    p.legF = { foot: [bx - 6, GROUND - 2 * BALL_R - 1], footA: 95 };
    p.armF = { s: 15 + Math.sin(t * 3) * 4, e: 30 };
    p.armB = { s: -10 - Math.sin(t * 3) * 4, e: 30 };
    p.head = 10;
    this.drawPlayer(p);
    this.drawBall(bx, GROUND - BALL_R, w * 70);
    return false;
  }

  // набивание: ногой / коленом / головой
  juggleBase(t, st, kind) {
    const target = st.target || 10;
    const speed = target >= 100 ? 2.2 : target >= 50 ? 1.8 : target >= 20 ? 1.35 : 1;
    const per = (kind === "head" ? 0.72 : kind === "knee" ? 0.62 : 0.6) / speed;
    const x = 116;
    const restLeg = { th: 16, k: 34, point: -8 };
    const hitLeg = kind === "knee" ? { th: 88, k: 100, point: 10 } : kind === "head" ? restLeg : { th: 68, k: 76, point: -6 };
    const contactPose = this.juggPose(x, hitLeg, kind, 1);
    const J = this.rig.joints(contactPose);
    let cx, cy;
    if (kind === "knee") [cx, cy] = [J.legF.knee[0] - 1, J.legF.knee[1] - 7 - BALL_R];
    else if (kind === "head") [cx, cy] = [J.headC[0] + 2, J.headC[1] - LEN.head - BALL_R + 1];
    else {
      const a = J.legF.ankle;
      const u = [Math.sin(J.legF.footA * D2R), Math.cos(J.legF.footA * D2R)];
      [cx, cy] = [a[0] + u[0] * 8, a[1] + u[1] * 8 - 7 - BALL_R];
    }
    const apex = kind === "head" ? 55 : 72;
    const intro = 0.7;
    if (t < intro) {
      // подбрасывает мяч руками
      const k = t / intro;
      const p = standPose(x);
      p.armF = { s: lerp(10, 60, Math.sin(k * Math.PI)), e: 40 };
      this.drawPlayer(p);
      this.drawBall(lerp(140, cx, k), lerp(GROUND - BALL_R, cy, k) - Math.sin(k * Math.PI) * 70, k * 300);
      this.count(0);
      return false;
    }
    const tt = t - intro;
    const n = Math.floor(tt / per);
    const ph = (tt % per) / per;
    if (n >= target) {
      // финал: мяч ловится, игрок радуется и прыгает
      const k = clamp01((tt - target * per) / 1.2);
      this.parts.counter.textContent = `${target} ✓`;
      const jump = Math.sin(clamp01(k * 1.6) * Math.PI);
      const p = standPose(x, STAND_Y - jump * 26);
      if (jump > 0.05) {
        p.legF = { th: 30 * jump, k: 90 * jump, point: 30 };
        p.legB = { th: -10 * jump, k: 100 * jump, point: 30 };
      }
      p.armF = { s: 165 * ease(clamp01(k * 3)), e: 10 };
      p.armB = { s: 150 * ease(clamp01(k * 3)), e: 10 };
      p.shout = true;
      this.drawPlayer(p);
      this.drawBall(lerp(cx, 150, k), lerp(cy, GROUND - BALL_R, ease(k)) - Math.sin(k * Math.PI) * 50, k * 400);
      return tt > target * per + 2.0;
    }
    this.count(n + 1);
    const hit = bump(ph, 0.2);
    const leg = mixLeg(restLeg, hitLeg, hit);
    this.drawPlayer(this.juggPose(x, leg, kind, hit, tt));
    this.drawBall(cx + Math.sin(ph * Math.PI * 2) * 2, cy - apex * Math.sin(ph * Math.PI), ph * 360);
    return false;
  }
  juggPose(x, leg, kind, hit, tt = 0) {
    const sway = Math.sin(tt * 4);
    const p = standPose(x, STAND_Y + 2 + (kind === "head" ? -4 * hit + 4 : hit * 1.5));
    p.legB = { foot: [x - 6, ANKLE_Y], flat: true };
    p.legF = kind === "head" ? { foot: [x + 12, ANKLE_Y], flat: true } : leg;
    p.lean = kind === "head" ? -8 + hit * 6 : 2 - hit * 4;
    p.head = kind === "head" ? -28 + hit * 14 : 14;
    p.armF = { s: 35 + sway * 6, e: 35 };
    p.armB = { s: -35 - sway * 6, e: 35 };
    return p;
  }
  a_juggle(t, st) {
    return this.juggleBase(t, st, "foot");
  }
  a_knee(t, st) {
    return this.juggleBase(t, st, "knee");
  }
  a_head(t, st) {
    return this.juggleBase(t, st, "head");
  }

  // нога → колено → голова по кругу
  a_combo(t, st) {
    const kinds = ["foot", "knee", "head"];
    const per = 0.68;
    const intro = 0.4;
    const total = 12;
    if (t < intro) return this.juggleBase(t, { target: 1 }, "foot");
    const tt = t - intro;
    const n = Math.floor(tt / per);
    if (n >= total) {
      // финал: мяч падает, игрок прыгает от радости
      const k = clamp01((tt - total * per) / 1.2);
      this.parts.counter.textContent = "Комбо! 🔥";
      const jump = Math.sin(clamp01(k * 1.6) * Math.PI);
      const p = standPose(x, STAND_Y - jump * 26);
      if (jump > 0.05) {
        p.legF = { th: 30 * jump, k: 90 * jump, point: 30 };
        p.legB = { th: -10 * jump, k: 100 * jump, point: 30 };
      }
      p.armF = { s: 165 * ease(clamp01(k * 3)), e: 10 };
      p.armB = { s: 150 * ease(clamp01(k * 3)), e: 10 };
      p.shout = true;
      this.drawPlayer(p);
      this.drawBall(lerp(150, 150, k), lerp(150, GROUND - BALL_R, ease(k)), k * 400);
      return tt > total * per + 2.0;
    }
    const kind = kinds[n % 3];
    const next = kinds[(n + 1) % 3];
    const ph = (tt % per) / per;
    const x = 116;
    const pts = {};
    for (const kd of kinds) {
      const hitLeg = kd === "knee" ? { th: 88, k: 100, point: 10 } : kd === "head" ? { th: 16, k: 34, point: -8 } : { th: 68, k: 76, point: -6 };
      const J = this.rig.joints(this.juggPose(x, hitLeg, kd, 1));
      if (kd === "knee") pts[kd] = [J.legF.knee[0] - 1, J.legF.knee[1] - 7 - BALL_R];
      else if (kd === "head") pts[kd] = [J.headC[0] + 2, J.headC[1] - LEN.head - BALL_R + 1];
      else {
        const a = J.legF.ankle;
        const u = [Math.sin(J.legF.footA * D2R), Math.cos(J.legF.footA * D2R)];
        pts[kd] = [a[0] + u[0] * 8, a[1] + u[1] * 8 - 7 - BALL_R];
      }
    }
    const hitNow = bump(ph, 0.2) * (ph < 0.5 ? 1 : 0);
    const hitNext = bump(ph, 0.2) * (ph >= 0.5 ? 1 : 0);
    const rest = { th: 16, k: 34, point: -8 };
    const legFor = (kd) => (kd === "knee" ? { th: 88, k: 100, point: 10 } : kd === "foot" ? { th: 68, k: 76, point: -6 } : rest);
    let leg = rest;
    let kindDraw = "foot";
    let hit = 0;
    if (hitNow) [leg, kindDraw, hit] = [mixLeg(rest, legFor(kind), hitNow), kind, hitNow];
    else if (hitNext) [leg, kindDraw, hit] = [mixLeg(rest, legFor(next), hitNext), next, hitNext];
    this.drawPlayer(this.juggPose(x, leg, kindDraw === "head" ? "head" : "foot", kindDraw === "head" ? hit : hit, tt));
    const a = pts[kind];
    const b = pts[next];
    const apex = 60;
    this.drawBall(lerp(a[0], b[0], ph), lerp(a[1], b[1], ph) - apex * Math.sin(ph * Math.PI), ph * 360);
    this.parts.counter.textContent = ["Нога", "Колено", "Голова"][n % 3];
    return false;
  }

  // ---------- удары ----------
  // общий сценарий: разбег → замах → удар → полёт мяча → гол → радость
  shotScene(t, { target = [262, 208], label = "ГОЛ!", chip = false, keeperDive = "up", flight = 0.5 } = {}) {
    const T_RUN = 1.0;
    const T_PLANT = 1.22;
    const T_HIT = 1.36;
    const ballX = 150;
    const kickT = T_HIT;
    let pose;
    if (t < T_RUN) {
      const k = t / T_RUN;
      pose = runPose(lerp(52, 118, k), k * 2.2, { lean: 10 });
    } else if (t < T_HIT) {
      // опорная нога рядом с мячом, ударная — замах назад (колено сильно согнуто)
      const k = ease(seg(t, T_RUN, T_PLANT));
      const k2 = ease(seg(t, T_PLANT, T_HIT));
      pose = standPose(lerp(118, 128, k), STAND_Y - 1);
      pose.legB = { foot: [lerp(116, 138, k), ANKLE_Y], flat: true };
      pose.legF = mixLeg({ th: -10, k: 40, point: 30 }, { th: -38, k: 115, point: 45 }, k);
      if (k2 > 0) pose.legF = mixLeg({ th: -38, k: 115, point: 45 }, { th: 25, k: 40, point: 60 }, k2);
      pose.lean = lerp(10, -6, k);
      pose.armF = { s: lerp(-30, -55, k), e: 30 };
      pose.armB = { s: lerp(30, 75, k), e: 20 };
      pose.head = 18;
    } else {
      // удар и проводка
      const k = ease(seg(t, T_HIT, T_HIT + 0.3));
      const land = ease(seg(t, T_HIT + 0.35, T_HIT + 0.8));
      pose = standPose(128 + 10 * land, STAND_Y - 3 * k * (1 - land));
      pose.legB = { foot: [138 + 8 * land, ANKLE_Y], flat: true };
      const follow = chip ? { th: 50, k: 30, point: 10 } : { th: 95, k: 12, point: 60 };
      pose.legF = mixLeg(mixLeg({ th: 25, k: 40, point: 60 }, follow, k), { th: 0, k: 15, point: 20 }, land);
      if (land >= 1) pose.legF = { foot: [154, ANKLE_Y], flat: true };
      pose.lean = lerp(-8, 4, land);
      pose.armF = { s: lerp(-55, 10, land), e: 30 };
      pose.armB = { s: lerp(75, -8, land), e: 25 };
      pose.head = 10;
    }
    // радость после гола
    const tGoal = kickT + flight;
    if (t > tGoal + 0.3) {
      const k = t - (tGoal + 0.3);
      const jump = Math.abs(Math.sin(k * 5.5)) * (k < 1.6 ? 1 : 0);
      pose = standPose(138, STAND_Y - jump * 24);
      pose.legF = jump > 0.05 ? { th: 40 * jump, k: 110 * jump, point: 30 } : { foot: [148, ANKLE_Y], flat: true };
      pose.legB = jump > 0.05 ? { th: -5 * jump, k: 110 * jump, point: 30 } : { foot: [130, ANKLE_Y], flat: true };
      pose.armF = { s: 160, e: 15 };
      pose.armB = { s: 145, e: 15 };
      pose.lean = -6;
      pose.head = -15;
      pose.shout = true;
    }
    this.drawPlayer(pose);

    // мяч
    if (t < kickT) this.drawBall(ballX, GROUND - BALL_R, 0);
    else {
      const k = clamp01((t - kickT) / flight);
      const s = lerp(1, 0.5, k);
      const arc = chip ? 90 : 26;
      const x = lerp(ballX, target[0], easeOut(k));
      const y = lerp(GROUND - BALL_R, target[1], k) - Math.sin(k * Math.PI) * arc;
      if (k < 1) this.drawBall(x, y, k * 1100, s, true);
      else {
        // мяч в сетке: падает на газон за линией
        const d = clamp01((t - kickT - flight) / 0.5);
        this.drawBall(target[0] + 8 * d, lerp(target[1], 230, d * d), 1100 + d * 200, 0.5, false);
      }
    }
    // вратарь: стоит, затем прыгает мимо мяча
    const dive = ease(seg(t, kickT + (chip ? -0.15 : 0.05), kickT + (chip ? 0.35 : 0.45)));
    const kp = standPose(120, STAND_Y);
    kp.flip = -1;
    kp.armF = { s: lerp(40, 170, dive), e: lerp(40, 5, dive) };
    kp.armB = { s: lerp(40, 160, dive), e: lerp(40, 5, dive) };
    kp.lean = lerp(14, 0, dive);
    if (dive > 0) {
      kp.y = STAND_Y - (keeperDive === "up" ? 60 : 20) * Math.sin(dive * Math.PI * 0.8);
      kp.rot = (keeperDive === "up" ? -70 : 80) * dive;
      kp.legF = { th: 20 * dive, k: 30 * dive, point: 40 };
      kp.legB = { th: -20 * dive, k: 60 * dive, point: 40 };
    } else {
      kp.y = STAND_Y + 6;
      kp.legF = { foot: [134, ANKLE_Y], flat: true };
      kp.legB = { foot: [106, ANKLE_Y], flat: true };
    }
    this.drawKeeper(kp);
    if (t > tGoal) this.goal(label, tGoal, t);
    return t > tGoal + 2.6;
  }
  a_shot(t) {
    return this.shotScene(t, { target: [258, 214], label: "ГОЛ!", keeperDive: "up" });
  }
  a_topcorner(t) {
    return this.shotScene(t, { target: [289, 178], label: "В ДЕВЯТКУ!", keeperDive: "down" });
  }
  a_panenka(t) {
    return this.shotScene(t, { target: [262, 196], label: "ПАНЕНКА!", chip: true, keeperDive: "down", flight: 0.95 });
  }

  // удар с лёта: мяч падает сверху, игрок бьёт, не давая ему коснуться земли
  a_volley(t) {
    const kickT = 1.15;
    const flight = 0.42;
    const x = 120;
    let pose = standPose(x);
    pose.head = -25;
    pose.lean = -4;
    if (t < 0.9) {
      pose.armF = { s: 30, e: 30 };
      pose.armB = { s: -30, e: 30 };
    } else if (t < kickT) {
      const k = ease(seg(t, 0.9, kickT));
      pose.legF = mixLeg({ th: 0, k: 20, point: 20 }, { th: -10, k: 100, point: 50 }, k);
      pose.lean = lerp(-4, -16, k);
      pose.armB = { s: lerp(-30, 80, k), e: 20 };
      pose.armF = { s: lerp(30, -40, k), e: 30 };
      pose.head = lerp(-25, 10, k);
    } else {
      const k = ease(seg(t, kickT, kickT + 0.25));
      const land = ease(seg(t, kickT + 0.4, kickT + 0.9));
      pose.legF = mixLeg(mixLeg({ th: -10, k: 100, point: 50 }, { th: 100, k: 8, point: 60 }, k), { th: 0, k: 15, point: 20 }, land);
      if (land >= 1) pose.legF = { foot: [x + 10, ANKLE_Y], flat: true };
      pose.lean = lerp(-20, 3, land);
      pose.armB = { s: lerp(80, -8, land), e: 20 };
      pose.armF = { s: lerp(-40, 10, land), e: 30 };
      pose.head = 10;
    }
    const tGoal = kickT + flight;
    if (t > tGoal + 0.3) {
      const k = t - tGoal - 0.3;
      pose = standPose(x);
      pose.armF = { s: 170, e: 10 };
      pose.armB = { s: 150, e: 10 };
      pose.head = -15;
      pose.shout = true;
      pose.y = STAND_Y - Math.abs(Math.sin(k * 5)) * 18;
      if (pose.y < STAND_Y - 2) {
        pose.legF = { th: 35, k: 100, point: 30 };
        pose.legB = { th: -5, k: 105, point: 30 };
      }
    }
    const J = this.drawPlayer(pose);
    // мяч: падает с неба прямо к ноге
    const contact = [x + 34, 214];
    if (t < kickT) {
      const k = t / kickT;
      this.drawBall(lerp(10, contact[0], k), lerp(-20, contact[1], k * k) - Math.sin(k * Math.PI) * 40, k * 500);
    } else {
      const k = clamp01((t - kickT) / flight);
      if (k < 1) this.drawBall(lerp(contact[0], 284, easeOut(k)), lerp(contact[1], 184, k), 600 + k * 900, lerp(1, 0.5, k), true);
      else this.drawBall(284 + 6 * clamp01((t - tGoal) / 0.5), lerp(184, 230, clamp01((t - tGoal) / 0.5) ** 2), 1500, 0.5);
    }
    if (t > tGoal) this.goal("С ЛЁТА!", tGoal, t);
    return t > tGoal + 2.5;
  }

  // ---------- финты ----------
  // «Рулетка»: разворот на 360° с мячом под подошвой
  a_roulette(t) {
    const T = 3.0;
    if (t > T) return true;
    let pose;
    let bx;
    if (t < 0.8) {
      const k = t / 0.8;
      pose = runPose(lerp(50, 110, k), k * 1.6, { lean: 8, amp: 0.8 });
      bx = pose.x + 26;
    } else if (t < 2.0) {
      const k = ease(seg(t, 0.8, 2.0));
      const x = lerp(110, 140, k);
      pose = standPose(x, STAND_Y - 2);
      pose.flip = Math.cos(k * Math.PI * 2);
      // подошва тянет мяч, ноги переступают
      const step = Math.sin(k * Math.PI * 4);
      pose.legF = { foot: [x + 14 + 4 * step, ANKLE_Y - 14 * Math.max(0, step)], footA: 100 };
      pose.legB = { foot: [x - 10 - 4 * step, ANKLE_Y - 10 * Math.max(0, -step)], flat: true };
      pose.armF = { s: 70, e: 20 };
      pose.armB = { s: -70, e: 20 };
      pose.lean = 6;
      bx = x + 22 * pose.flip;
      this.parts.counter.textContent = "Рулетка!";
    } else {
      const k = seg(t, 2.0, T);
      pose = runPose(lerp(140, 200, k), k * 1.8, { lean: 14 });
      bx = pose.x + 28;
    }
    this.drawPlayer(pose);
    this.drawBall(bx, GROUND - BALL_R, t * 400);
    return false;
  }

  // «Радуга»: мяч закатывается на пятку и перелетает над головой
  a_rainbow(t) {
    const T = 3.2;
    if (t > T) return true;
    let pose;
    const x0 = 100;
    if (t < 0.7) {
      const k = t / 0.7;
      pose = runPose(lerp(50, x0, k), k * 1.4, { amp: 0.8 });
      this.drawPlayer(pose);
      this.drawBall(pose.x + 26, GROUND - BALL_R, t * 500);
      return false;
    }
    if (t < 1.25) {
      // мяч зажат между ног, задняя нога подбрасывает пяткой
      const k = ease(seg(t, 0.7, 1.0));
      const flick = ease(seg(t, 1.0, 1.25));
      pose = standPose(x0, STAND_Y + 2);
      pose.legF = { foot: [x0 + 6, ANKLE_Y], flat: true };
      pose.legB = mixLeg({ th: 0, k: 20, point: 20 }, { th: -5, k: 130, point: 50 }, flick);
      pose.lean = 10;
      pose.armF = { s: 40, e: 30 };
      pose.armB = { s: -40, e: 30 };
      pose.head = 20;
      this.drawPlayer(pose);
      this.drawBall(lerp(x0 + 26, x0 - 4, k), GROUND - BALL_R - 22 * flick, -k * 300);
      return false;
    }
    // мяч летит дугой над головой, игрок бежит за ним
    const k = seg(t, 1.25, 2.35);
    const run = seg(t, 1.35, T);
    pose = runPose(lerp(x0, x0 + 90, ease(run)), run * 2.4, { amp: 0.9 });
    this.drawPlayer(pose);
    if (k < 1) this.drawBall(lerp(x0 - 4, x0 + 110, k), lerp(GROUND - BALL_R - 22, GROUND - BALL_R, k) - Math.sin(k * Math.PI) * 200, k * 720, 1, true);
    else this.drawBall(pose.x + 26, GROUND - BALL_R, t * 500);
    if (t > 1.9) this.parts.counter.textContent = "Радуга! 🌈";
    return false;
  }

  // «Ножницы»: ноги по очереди обводят мяч
  a_stepover(t) {
    const T = 3.2;
    if (t > T) return true;
    const x = 110;
    const bx = 138;
    let pose;
    if (t < 2.0) {
      const n = Math.floor(t / 0.5);
      const u = (t % 0.5) / 0.5;
      const sway = Math.sin(t * Math.PI * 2) * 5;
      pose = standPose(x + sway, STAND_Y + 3);
      const path = (side) => ({ foot: [lerp(bx - 18, bx + 16, ease(u)) - side * 2, ANKLE_Y - 34 * Math.sin(u * Math.PI)], footA: 100 - 30 * Math.sin(u * Math.PI) });
      if (n % 2 === 0) {
        pose.legF = path(1);
        pose.legB = { foot: [x - 6, ANKLE_Y], flat: true };
      } else {
        pose.legB = path(-1);
        pose.legF = { foot: [x + 16, ANKLE_Y], flat: true };
      }
      pose.lean = 10 + sway;
      pose.armF = { s: 50 + sway * 3, e: 30 };
      pose.armB = { s: -50 + sway * 3, e: 30 };
      pose.head = 25;
      this.drawPlayer(pose);
      this.drawBall(bx, GROUND - BALL_R, 0);
      this.parts.counter.textContent = n >= 1 ? "Ножницы! ✂️" : "";
      return false;
    }
    // рывок с мячом
    const k = seg(t, 2.0, T);
    pose = runPose(lerp(x, x + 90, ease(k)), k * 2.4, { lean: 16 });
    this.drawPlayer(pose);
    this.drawBall(lerp(bx, pose.x + 28, Math.min(1, k * 3)), GROUND - BALL_R, k * 900, 1, k < 0.5);
    return false;
  }

  // удар через себя (сальто назад)
  a_bicycle(t) {
    const kickT = 1.15;
    const flight = 0.4;
    const x = 132;
    let pose = standPose(x);
    pose.flip = -1; // спиной к воротам
    pose.head = -30;
    if (t < 0.55) {
      // ждёт мяч, приседает
      const k = ease(t / 0.55);
      pose.y = STAND_Y + 10 * k;
      pose.legF = { foot: [x + 12, ANKLE_Y], flat: true };
      pose.legB = { foot: [x - 10, ANKLE_Y], flat: true };
      pose.armF = { s: 30 + 40 * k, e: 30 };
      pose.armB = { s: -30, e: 30 };
    } else if (t < 1.8) {
      // прыжок и переворот назад
      const k = seg(t, 0.55, 1.8);
      pose.rot = -360 * ease(k);
      pose.y = STAND_Y + 10 - Math.sin(k * Math.PI) * 75;
      const kick = seg(t, 0.95, kickT + 0.05);
      // опорная нога махом вверх, ударная — «ножницами» хлёстко разгибается
      pose.legB = { th: lerp(10, 110, ease(seg(t, 0.6, 0.95))) - 60 * kick, k: lerp(20, 90, kick), point: 40 };
      pose.legF = { th: lerp(20, 60, ease(seg(t, 0.6, 0.95))) + 90 * ease(kick), k: lerp(110, 5, ease(kick)), point: 55 };
      if (k > 0.7) {
        const r = ease(seg(k, 0.7, 1));
        pose.legF = mixLeg(pose.legF, { th: 30, k: 90, point: 30 }, r);
        pose.legB = mixLeg(pose.legB, { th: -10, k: 90, point: 30 }, r);
      }
      pose.armF = { s: 90 + 60 * k, e: 20 };
      pose.armB = { s: 120, e: 20 };
      pose.head = -20;
    } else {
      const k = ease(seg(t, 1.8, 2.1));
      pose = standPose(x, STAND_Y + 8 * (1 - k));
      pose.flip = -1;
      if (t > kickT + flight + 0.4) {
        pose.flip = 1;
        pose.armF = { s: 170, e: 10 };
        pose.armB = { s: 150, e: 10 };
        pose.shout = true;
        pose.head = -15;
      }
    }
    this.drawPlayer(pose);
    // мяч: сверху слева → к точке удара над игроком → в ворота
    const contact = [x + 4, 120];
    if (t < kickT) {
      const k = t / kickT;
      this.drawBall(lerp(-10, contact[0], k), lerp(40, contact[1], k) - Math.sin(k * Math.PI) * 50, k * 600);
    } else {
      const k = clamp01((t - kickT) / flight);
      if (k < 1) this.drawBall(lerp(contact[0], 280, easeOut(k)), lerp(contact[1], 196, k), 600 + k * 1000, lerp(1, 0.5, k), true);
      else this.drawBall(280 + 6 * clamp01((t - kickT - flight) / 0.5), lerp(196, 230, clamp01((t - kickT - flight) / 0.5) ** 2), 1600, 0.5);
    }
    if (t > kickT + flight) this.goal("СУПЕРГОЛ!", kickT + flight, t);
    return t > kickT + flight + 2.6;
  }

  // празднование: разбег и скольжение на коленях
  a_kneeslide(t) {
    const T = 3.6;
    if (t > T) return true;
    this.parts.crowd.classList.add("cheer");
    let pose;
    if (t < 1.0) {
      const k = t / 1.0;
      pose = runPose(lerp(30, 100, k), k * 2.6, { lean: 14 });
      pose.armF.s = 120;
      pose.armF.e = 10;
    } else if (t < 2.2) {
      // падает на колени и скользит
      const k = ease(seg(t, 1.0, 1.25));
      const slide = easeOut(seg(t, 1.0, 2.2));
      const x = lerp(100, 175, slide);
      pose = standPose(x, lerp(STAND_Y - 4, STAND_Y + 26, k));
      pose.legF = mixLeg({ th: 20, k: 40, point: 20 }, { th: 14, k: 104, point: 75 }, k);
      pose.legB = mixLeg({ th: -20, k: 60, point: 20 }, { th: 2, k: 92, point: 75 }, k);
      pose.lean = lerp(12, -25, k);
      pose.armF = { s: lerp(120, 110, k), e: 0 };
      pose.armB = { s: lerp(-30, 105, k), e: 0 };
      pose.head = -25;
      pose.shout = true;
    } else {
      // руки вверх, кричит
      const k = t - 2.2;
      pose = standPose(175, STAND_Y + 26);
      pose.legF = { th: 14, k: 104, point: 75 };
      pose.legB = { th: 2, k: 92, point: 75 };
      pose.lean = -20 + Math.sin(k * 6) * 4;
      pose.armF = { s: 165 + Math.sin(k * 8) * 10, e: 5 };
      pose.armB = { s: 150 - Math.sin(k * 8) * 10, e: 5 };
      pose.head = -30;
      pose.shout = true;
      if (!this.sparkList.length) this.burst(175, 150);
      this.updateSparks(k);
      this.parts.counter.textContent = "ЙЕС! 🙌";
    }
    this.drawPlayer(pose);
    this.drawBall(250, GROUND - BALL_R, 0, 1);
    return false;
  }
}
