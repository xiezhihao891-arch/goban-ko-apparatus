/* Canvas 19×19 deep-lacquer goban with indium-blue glow */
(() => {
  "use strict";
  const canvas = document.getElementById("goban");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  const N = 19;
  const nodes = [
    { id: 1, color: "B", x: 3, y: 15, label: "2019 开拍", ch: 1 },
    { id: 2, color: "W", x: 15, y: 3, label: "2020 首播", ch: 2 },
    { id: 3, color: "B", x: 9, y: 9, label: "526 丑闻", ch: 3 },
    { id: 4, color: "W", x: 2, y: 3, label: "2021-07 反腐", ch: 4 },
    { id: 5, color: "B", x: 16, y: 16, label: "沉默数年", ch: 5 },
    { id: 6, color: "W", x: 9, y: 9, label: "2025 律师函", ch: 6, ko: true },
    { id: 7, color: "B", x: 5, y: 2, label: "行业复盘", ch: 7 },
    { id: 8, color: "W", x: 14, y: 15, label: "2026 潮", ch: 8 },
  ];
  let placed = [];
  let hover = null;
  let pulse = 0;
  let dpr = 1;
  let ripples = [];
  let capturedFlash = [];

  function resize() {
    const rect = canvas.getBoundingClientRect();
    const css = Math.min(rect.width || 300, 520);
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = css * dpr;
    canvas.height = css * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    draw();
  }

  function geom(cssW) {
    const pad = cssW * 0.08;
    const grid = (cssW - pad * 2) / (N - 1);
    return { pad, grid, cssW };
  }

  function drawWood(cssW) {
    const g = ctx.createLinearGradient(0, 0, cssW, cssW);
    g.addColorStop(0, "#1c100a");
    g.addColorStop(0.35, "#2a1810");
    g.addColorStop(0.7, "#24140c");
    g.addColorStop(1, "#160c08");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, cssW, cssW);
    // lacquer grain
    ctx.save();
    ctx.globalAlpha = 0.06;
    for (let i = 0; i < 40; i++) {
      ctx.strokeStyle = i % 2 ? "#6eb0ff" : "#c4a574";
      ctx.beginPath();
      ctx.moveTo(0, (i / 40) * cssW + Math.sin(i + pulse) * 2);
      ctx.bezierCurveTo(cssW * 0.3, (i / 40) * cssW + 8, cssW * 0.7, (i / 40) * cssW - 6, cssW, (i / 40) * cssW);
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawGrid(pad, grid) {
    ctx.save();
    ctx.strokeStyle = "rgba(110,176,255,0.55)";
    ctx.lineWidth = 1;
    ctx.shadowColor = "rgba(58,108,255,0.65)";
    ctx.shadowBlur = 4 + Math.sin(pulse * 2) * 2;
    for (let i = 0; i < N; i++) {
      const p = pad + i * grid;
      ctx.beginPath();
      ctx.moveTo(pad, p);
      ctx.lineTo(pad + (N - 1) * grid, p);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(p, pad);
      ctx.lineTo(p, pad + (N - 1) * grid);
      ctx.stroke();
    }
    // star points
    const stars = [[3, 3], [3, 9], [3, 15], [9, 3], [9, 9], [9, 15], [15, 3], [15, 9], [15, 15]];
    ctx.fillStyle = "rgba(110,176,255,0.85)";
    ctx.shadowBlur = 8;
    for (const [sx, sy] of stars) {
      ctx.beginPath();
      ctx.arc(pad + sx * grid, pad + sy * grid, 3.2, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  function drawStone(px, py, color, r, alpha = 1) {
    ctx.save();
    ctx.globalAlpha = alpha;
    const grd = ctx.createRadialGradient(px - r * 0.35, py - r * 0.4, r * 0.1, px, py, r);
    if (color === "B") {
      grd.addColorStop(0, "#5a5a5a");
      grd.addColorStop(0.45, "#1a1a1a");
      grd.addColorStop(1, "#000");
    } else {
      grd.addColorStop(0, "#ffffff");
      grd.addColorStop(0.5, "#f0ebe3");
      grd.addColorStop(1, "#c8c0b4");
    }
    ctx.beginPath();
    ctx.arc(px, py, r, 0, Math.PI * 2);
    ctx.fillStyle = grd;
    ctx.shadowColor = color === "B" ? "rgba(0,0,0,0.8)" : "rgba(110,176,255,0.45)";
    ctx.shadowBlur = 10;
    ctx.fill();
    if (color === "W") {
      ctx.strokeStyle = "rgba(80,80,80,0.35)";
      ctx.lineWidth = 1;
      ctx.stroke();
    }
    ctx.restore();
  }

  function draw() {
    const cssW = canvas.width / dpr;
    const { pad, grid } = geom(cssW);
    drawWood(cssW);
    drawGrid(pad, grid);

    // ghost hover
    if (hover) {
      const px = pad + hover.x * grid;
      const py = pad + hover.y * grid;
      ctx.save();
      ctx.globalAlpha = 0.25 + Math.sin(pulse * 4) * 0.08;
      ctx.fillStyle = "#6eb0ff";
      ctx.beginPath();
      ctx.arc(px, py, grid * 0.38, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    const r = grid * 0.42;
    for (const s of placed) {
      const px = pad + s.x * grid;
      const py = pad + s.y * grid;
      const a = s.ko && Math.floor(pulse * 3) % 2 === 0 ? 0.55 : 1;
      drawStone(px, py, s.color, r, a);
      // label tick
      if (s.hl) {
        ctx.save();
        ctx.strokeStyle = "rgba(255,107,74,0.9)";
        ctx.lineWidth = 2;
        ctx.shadowColor = "#ff6b4a";
        ctx.shadowBlur = 12;
        ctx.beginPath();
        ctx.arc(px, py, r + 4, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }
    }

    // ripples
    ripples = ripples.filter((rp) => {
      rp.t += 0.04;
      ctx.save();
      ctx.globalAlpha = Math.max(0, 1 - rp.t);
      ctx.strokeStyle = rp.color;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(rp.x, rp.y, rp.t * 40, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
      return rp.t < 1;
    });

    // tengen hint ring
    const tx = pad + 9 * grid, ty = pad + 9 * grid;
    ctx.save();
    ctx.strokeStyle = `rgba(58,108,255,${0.25 + Math.sin(pulse * 3) * 0.15})`;
    ctx.lineWidth = 1.5;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.arc(tx, ty, r + 8, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  function xyFromEvent(e) {
    const rect = canvas.getBoundingClientRect();
    const cssW = rect.width;
    const { pad, grid } = geom(cssW);
    const cx = (e.clientX - rect.left);
    const cy = (e.clientY - rect.top);
    const x = Math.round((cx - pad) / grid);
    const y = Math.round((cy - pad) / grid);
    return { x, y, cssW, pad, grid, px: pad + x * grid, py: pad + y * grid, rect };
  }

  function placeUpTo(chIndex) {
    placed = [];
    for (const n of nodes) {
      if (n.ch <= chIndex) {
        // ko at tengen: remove previous B at same point when placing W ko
        if (n.ko) {
          placed = placed.filter((p) => !(p.x === n.x && p.y === n.y));
          window.GobanAPI && window.GobanAPI.onCapture && window.GobanAPI.onCapture("B", n.label);
        }
        placed.push({ ...n, hl: n.ch === chIndex });
      }
    }
    draw();
    window.GobanAPI && window.GobanAPI.onSyncLog && window.GobanAPI.onSyncLog(placed);
  }

  canvas.addEventListener("pointermove", (e) => {
    const { x, y } = xyFromEvent(e);
    if (x >= 0 && x < N && y >= 0 && y < N) hover = { x, y };
    else hover = null;
  });
  canvas.addEventListener("pointerleave", () => { hover = null; });

  canvas.addEventListener("pointerdown", (e) => {
    try { canvas.setPointerCapture(e.pointerId); } catch (_) {}
    const g = xyFromEvent(e);
    if (g.x < 0 || g.x >= N || g.y < 0 || g.y >= N) return;
    e.preventDefault();
    ripples.push({ x: g.px, y: g.py, t: 0, color: "rgba(110,176,255,0.9)" });

    // screen ripple
    const fx = document.createElement("div");
    fx.className = "ripple-fx";
    fx.style.left = e.clientX + "px";
    fx.style.top = e.clientY + "px";
    document.body.appendChild(fx);
    setTimeout(() => fx.remove(), 700);

    // tengen → danmaku
    if (g.x === 9 && g.y === 9) {
      window.GobanAPI && window.GobanAPI.onTengen && window.GobanAPI.onTengen();
      return;
    }
    // click nearest timeline node
    let best = null, bestD = 99;
    for (const n of nodes) {
      const d = Math.hypot(n.x - g.x, n.y - g.y);
      if (d < bestD) { bestD = d; best = n; }
    }
    if (best && bestD <= 2.2) {
      window.GobanAPI && window.GobanAPI.onNodeClick && window.GobanAPI.onNodeClick(best);
      // capture metaphor: click empty far point sucks a stone
    } else if (Math.random() > 0.4) {
      const victim = placed[placed.length - 1];
      if (victim && window.GobanAPI && window.GobanAPI.onCapture) {
        window.GobanAPI.onCapture(victim.color, "闲子·黑名单隐喻");
      }
    }
    window.GobanAPI && window.GobanAPI.playStone && window.GobanAPI.playStone();
  });

  function loop() {
    pulse += 0.02;
    draw();
    requestAnimationFrame(loop);
  }

  window.GobanAPI = window.GobanAPI || {};
  window.GobanAPI.placeUpTo = placeUpTo;
  window.GobanAPI.nodes = nodes;
  window.GobanAPI.resize = resize;

  window.addEventListener("resize", resize);
  resize();
  loop();
})();
