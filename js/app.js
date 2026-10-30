/* 十九路·劫争仪 — interactions: magnetic chapters, dual POV, ko loop, lawyer lightbox, poll, particles, danmaku */
(() => {
  "use strict";

  const stage = document.getElementById("stage");
  const chapters = [...document.querySelectorAll(".ch")];
  const kifuBtns = [...document.querySelectorAll(".kifu-btn")];
  const kifuLog = document.getElementById("kifuLog");
  const voidStones = document.getElementById("voidStones");
  const koClock = document.getElementById("koClock");
  const btnSound = document.getElementById("btnSound");
  const btnFilter = document.getElementById("btnFilter");
  const btnPov = document.getElementById("btnPov");
  const btnEnter = document.getElementById("btnEnter");
  const btnKo = document.getElementById("btnKo");
  const koFill = document.getElementById("koFill");
  const koCaption = document.getElementById("koCaption");
  const btnFold = document.getElementById("btnFold");
  const beStrip = document.getElementById("beStrip");
  const danmakuLayer = document.getElementById("danmakuLayer");
  const danmakuStage = document.getElementById("danmakuStage");
  const lightbox = document.getElementById("lightbox");
  const lbImg = document.getElementById("lbImg");
  const lbCap = document.getElementById("lbCap");
  const poll = document.getElementById("poll");
  const pollResult = document.getElementById("pollResult");

  let soundOn = false;
  let audioCtx = null;
  let current = 0;
  let koTimer = null;
  let koSec = 0;
  let koRunning = false;
  const POV_CYCLE = ["both", "hao", "hu"];
  let povIdx = 0;

  const DANMAKU = [
    { t: "郝富申力挺", hot: true },
    { t: "蚂蚁永不为奴", soft: true },
    { t: "落子无悔·复盘不能", hot: false },
    { t: "敢说没吃过红利吗？（口号·传闻）", hot: true },
    { t: "光亮永远是双子星（角色层）", soft: true },
    { t: "律师函已读不回", hot: true },
    { t: "生日快乐小胡（祝福向）", soft: true },
    { t: "课题分离·正主归正主", soft: true },
    { t: "爱你老妈法庭见（二创梗）", hot: true },
    { t: "不是耽改·别强行捆绑", soft: false },
    { t: "526 滤镜碎了", hot: true },
    { t: "提纯失败·评论区沦陷", hot: true },
    { t: "只磕光亮不磕真人", soft: true },
    { t: "拉黑≠误伤？（争议）", hot: false },
  ];

  /* Audio — muted by default */
  function ensureAudio() {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    if (audioCtx.state === "suspended") audioCtx.resume();
  }
  function stoneSFX() {
    if (!soundOn || !audioCtx) return;
    const o = audioCtx.createOscillator();
    const g = audioCtx.createGain();
    const f = audioCtx.createBiquadFilter();
    o.type = "triangle";
    o.frequency.value = 180 + Math.random() * 40;
    f.type = "lowpass";
    f.frequency.value = 800;
    g.gain.value = 0.07;
    o.connect(f); f.connect(g); g.connect(audioCtx.destination);
    o.start();
    g.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.18);
    o.frequency.exponentialRampToValueAtTime(90, audioCtx.currentTime + 0.15);
    o.stop(audioCtx.currentTime + 0.2);
  }

  btnSound.addEventListener("click", () => {
    soundOn = !soundOn;
    btnSound.setAttribute("aria-pressed", String(soundOn));
    btnSound.textContent = soundOn ? "🔊 落子" : "🔇 落子";
    if (soundOn) { ensureAudio(); stoneSFX(); }
  });

  btnFilter.addEventListener("click", () => {
    const on = btnFilter.getAttribute("aria-pressed") !== "true";
    btnFilter.setAttribute("aria-pressed", String(on));
    document.body.dataset.filter = on ? "verified" : "all";
  });

  btnPov.addEventListener("click", () => {
    povIdx = (povIdx + 1) % POV_CYCLE.length;
    const v = POV_CYCLE[povIdx];
    document.body.dataset.pov = v;
    btnPov.textContent =
      v === "both" ? "双视角 · BOTH" : v === "hao" ? "单视角 · 郝" : "单视角 · 胡";
  });

  function goTo(i, smooth = true) {
    i = Math.max(0, Math.min(chapters.length - 1, i));
    current = i;
    chapters[i].scrollIntoView({ behavior: smooth ? "smooth" : "auto", block: "start" });
    kifuBtns.forEach((b, idx) => b.classList.toggle("active", idx === i));
    if (window.GobanAPI && window.GobanAPI.placeUpTo) window.GobanAPI.placeUpTo(i);
  }
  kifuBtns.forEach((b) => b.addEventListener("click", () => goTo(+b.dataset.goto)));
  btnEnter.addEventListener("click", () => goTo(1));

  const io = new IntersectionObserver((entries) => {
    let best = null, bestR = 0;
    entries.forEach((en) => {
      en.target.classList.toggle("in-view", en.isIntersecting);
      if (en.isIntersecting && en.intersectionRatio > bestR) {
        bestR = en.intersectionRatio;
        best = en.target;
      }
    });
    if (best) {
      const idx = chapters.indexOf(best);
      if (idx >= 0) {
        current = idx;
        kifuBtns.forEach((b, i) => b.classList.toggle("active", i === idx));
        if (window.GobanAPI && window.GobanAPI.placeUpTo) window.GobanAPI.placeUpTo(idx);
      }
    }
  }, { root: stage, threshold: [0.35, 0.55, 0.7] });
  chapters.forEach((c) => io.observe(c));

  /* Kifu log sync */
  window.GobanAPI = window.GobanAPI || {};
  window.GobanAPI.onSyncLog = (placed) => {
    kifuLog.innerHTML = "";
    placed.forEach((s, i) => {
      const li = document.createElement("li");
      li.innerHTML = `<span class="n">${i + 1}.</span><span class="${s.color}">${s.color === "B" ? "黑郝" : "白胡"}</span><span>${s.label}</span>`;
      kifuLog.appendChild(li);
    });
  };
  window.GobanAPI.onNodeClick = (node) => {
    stoneSFX();
    goTo(node.ch);
  };
  window.GobanAPI.playStone = () => stoneSFX();
  window.GobanAPI.onCapture = (color, reason) => {
    const el = document.createElement("span");
    el.className = "cap " + color;
    el.title = reason || "提子";
    voidStones.appendChild(el);
    if (voidStones.children.length > 24) voidStones.removeChild(voidStones.firstChild);
  };
  window.GobanAPI.onTengen = () => openDanmaku();

  /* Ko fight loop */
  function tickKo() {
    koSec++;
    const m = String(Math.floor(koSec / 60)).padStart(2, "0");
    const s = String(koSec % 60).padStart(2, "0");
    koClock.textContent = "KO " + m + ":" + s;
    const pct = (koSec % 20) / 20 * 100;
    if (koFill) koFill.style.width = pct + "%";
    if (koCaption) {
      const side = Math.floor(koSec / 5) % 2 === 0 ? "粉圈续气 · 弹幕劫材" : "偶像提纯 · 拉黑提子";
      koCaption.textContent = "FIGHT · " + side;
    }
    document.body.dataset.ko = "fight";
    // ripple pulse on goban via capture metaphor alternate
    if (koSec % 5 === 0 && window.GobanAPI.onCapture) {
      window.GobanAPI.onCapture(koSec % 10 === 0 ? "W" : "B", "劫争往复");
    }
  }
  if (btnKo) {
    btnKo.addEventListener("click", () => {
      if (koRunning) {
        clearInterval(koTimer);
        koRunning = false;
        document.body.dataset.ko = "idle";
        btnKo.textContent = "启动劫争演示 · 粉 ↔ 偶像拉力";
        if (koCaption) koCaption.textContent = "IDLE · 等待落劫";
        return;
      }
      koRunning = true;
      koSec = 0;
      btnKo.textContent = "停止劫争 · 停钟";
      koTimer = setInterval(tickKo, 400);
      tickKo();
      stoneSFX();
    });
  }

  /* Danmaku gallery */
  let dmTimers = [];
  function openDanmaku() {
    danmakuLayer.hidden = false;
    danmakuStage.innerHTML = "";
    dmTimers.forEach(clearTimeout);
    dmTimers = [];
    DANMAKU.forEach((d, i) => {
      const t = setTimeout(() => spawnDm(d), i * 380);
      dmTimers.push(t);
    });
    // loop a few more
    for (let k = 0; k < 10; k++) {
      const t = setTimeout(() => spawnDm(DANMAKU[k % DANMAKU.length]), 5500 + k * 500);
      dmTimers.push(t);
    }
    stoneSFX();
  }
  function spawnDm(d) {
    const el = document.createElement("div");
    el.className = "dm" + (d.hot ? " hot" : d.soft ? " soft" : "");
    el.textContent = d.t;
    el.style.top = 12 + Math.random() * 78 + "%";
    el.style.left = "100%";
    el.style.animationDuration = 7 + Math.random() * 5 + "s";
    danmakuStage.appendChild(el);
    setTimeout(() => el.remove(), 13000);
  }
  document.getElementById("btnCloseDanmaku").addEventListener("click", () => {
    danmakuLayer.hidden = true;
    dmTimers.forEach(clearTimeout);
  });
  danmakuLayer.addEventListener("click", (e) => {
    if (e.target === danmakuLayer) {
      danmakuLayer.hidden = true;
      dmTimers.forEach(clearTimeout);
    }
  });

  /* Finale fold */
  btnFold.addEventListener("click", () => {
    document.body.classList.add("board-folded");
    beStrip.hidden = false;
    beStrip.scrollIntoView({ behavior: "smooth", block: "center" });
    stoneSFX();
    if (window.GobanAPI.onCapture) {
      window.GobanAPI.onCapture("B", "终局提子");
      window.GobanAPI.onCapture("W", "终局提子");
    }
  });

  /* Lightbox */
  function openLb(src, cap) {
    lbImg.src = src;
    lbCap.textContent = cap || "";
    lightbox.hidden = false;
  }
  function closeLb() { lightbox.hidden = true; lbImg.src = ""; }
  document.getElementById("lbClose").addEventListener("click", closeLb);
  lightbox.addEventListener("click", (e) => { if (e.target === lightbox) closeLb(); });
  document.querySelectorAll("[data-lightbox]").forEach((fig) => {
    fig.addEventListener("click", () => {
      const img = fig.querySelector("img");
      const cap = fig.querySelector("figcaption");
      if (img) openLb(img.src, cap ? cap.textContent : "");
    });
  });

  /* Poll */
  const POLL_KEY = "goban-ko-poll-v1";
  function renderPoll() {
    let data = {};
    try { data = JSON.parse(localStorage.getItem(POLL_KEY) || "{}"); } catch (_) {}
    const total = Object.values(data).reduce((a, b) => a + b, 0) || 0;
    poll.querySelectorAll(".poll-opt").forEach((btn) => {
      const v = btn.dataset.val;
      const n = data[v] || 0;
      const pct = total ? Math.round((n / total) * 100) : 0;
      btn.querySelector(".bar").style.width = pct + "%";
      btn.querySelector(".pct").textContent = total ? pct + "%" : "";
    });
    if (total) {
      pollResult.hidden = false;
      pollResult.textContent = "已记录本地一票 · 合计 " + total + "（仅本机）";
    }
  }
  poll.querySelectorAll(".poll-opt").forEach((btn) => {
    btn.addEventListener("click", () => {
      let data = {};
      try { data = JSON.parse(localStorage.getItem(POLL_KEY) || "{}"); } catch (_) {}
      const voted = localStorage.getItem(POLL_KEY + "-voted");
      if (voted) {
        pollResult.hidden = false;
        pollResult.textContent = "本机已投过 · 可清除站点数据后重投";
        renderPoll();
        return;
      }
      data[btn.dataset.val] = (data[btn.dataset.val] || 0) + 1;
      localStorage.setItem(POLL_KEY, JSON.stringify(data));
      localStorage.setItem(POLL_KEY + "-voted", "1");
      renderPoll();
      stoneSFX();
    });
  });
  renderPoll();

  /* Lacquer dust / indium particles + parallax */
  const dust = document.getElementById("lacquerDust");
  const dctx = dust.getContext("2d");
  let W = 0, H = 0, particles = [];
  function resizeDust() {
    W = dust.width = window.innerWidth;
    H = dust.height = window.innerHeight;
  }
  function spawn(n = 55) {
    for (let i = 0; i < n; i++) {
      particles.push({
        x: Math.random() * W,
        y: Math.random() * H,
        r: 0.6 + Math.random() * 1.8,
        vx: (Math.random() - 0.5) * 0.25,
        vy: -0.15 - Math.random() * 0.35,
        c: Math.random() > 0.55 ? "rgba(110,176,255,0.55)" : "rgba(196,165,116,0.4)",
      });
    }
  }
  function tickDust() {
    dctx.clearRect(0, 0, W, H);
    for (const p of particles) {
      p.x += p.vx;
      p.y += p.vy;
      if (p.y < -5) { p.y = H + 5; p.x = Math.random() * W; }
      if (p.x < 0) p.x = W;
      if (p.x > W) p.x = 0;
      dctx.beginPath();
      dctx.fillStyle = p.c;
      dctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      dctx.fill();
    }
    requestAnimationFrame(tickDust);
  }
  resizeDust();
  spawn();
  window.addEventListener("resize", () => { resizeDust(); if (window.GobanAPI) window.GobanAPI.resize(); });
  tickDust();

  // parallax on mouse
  document.addEventListener("pointermove", (e) => {
    const nx = (e.clientX / window.innerWidth - 0.5) * 8;
    const ny = (e.clientY / window.innerHeight - 0.5) * 6;
    document.documentElement.style.setProperty("--parallax-x", nx + "px");
    document.documentElement.style.setProperty("--parallax-y", ny + "px");
    const hud = document.getElementById("goban");
    if (hud) hud.style.transform = `translate(${nx * 0.3}px, ${ny * 0.3}px)`;
  });

  /* Keyboard */
  document.addEventListener("keydown", (e) => {
    if (e.key === "ArrowDown" || e.key === "j") { e.preventDefault(); goTo(current + 1); }
    if (e.key === "ArrowUp" || e.key === "k") { e.preventDefault(); goTo(current - 1); }
    if (e.key === "Escape") {
      closeLb();
      danmakuLayer.hidden = true;
    }
  });

  // initial
  chapters[0].classList.add("in-view");
  if (window.GobanAPI && window.GobanAPI.placeUpTo) window.GobanAPI.placeUpTo(0);
})();
