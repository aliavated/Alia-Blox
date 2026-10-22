"use strict";

const $ = id => document.getElementById(id);

const GAMES = [
  {
    id: "runner",
    title: "Neon Odyssey",
    category: "Arcade",
    filter: "arcade",
    art: "runner",
    symbol: "N",
    tag: "FEATURED",
    description: "Run through a neon city, dodge dangerous obstacles, and collect energy.",
    mission: "Survive as long as possible. Jump over hazards and collect glowing coins.",
    tip: "Press Space, W, Up, or tap the game to jump. You can double jump.",
    controls: "SPACE / W / ↑ / TAP"
  },
  {
    id: "jumper",
    title: "Skybound",
    category: "Skill",
    filter: "skill",
    art: "jumper",
    symbol: "↑",
    tag: "PLATFORMER",
    description: "Scale floating platforms, find hidden gems, and reach the highest point.",
    mission: "Jump between platforms, collect gems, and avoid falling.",
    tip: "Use A and D or the arrow keys to move. Press Space, W, or Up to jump.",
    controls: "A / D / SPACE / ↑"
  },
  {
    id: "crystal",
    title: "Crystal Quest",
    category: "Skill",
    filter: "skill",
    art: "crystal",
    symbol: "◇",
    tag: "EXPLORATION",
    description: "Explore a mysterious maze, collect crystals, and avoid the guardians.",
    mission: "Collect every crystal in the maze without being caught.",
    tip: "Use WASD or the arrow keys to move through the maze.",
    controls: "WASD / ARROW KEYS"
  }
];

const ACHIEVEMENTS = [
  {
    id: "first",
    icon: "✦",
    title: "First Steps",
    description: "Finish your first game session.",
    reward: 10,
    check: s => s.gamesPlayed >= 1
  },
  {
    id: "collector",
    icon: "◇",
    title: "Coin Collector",
    description: "Collect 50 coins in total.",
    reward: 20,
    check: s => s.coins >= 50
  },
  {
    id: "explorer",
    icon: "⌘",
    title: "World Explorer",
    description: "Discover all three worlds.",
    reward: 25,
    check: s => GAMES.every(g => s.worlds.includes(g.id))
  },
  {
    id: "veteran",
    icon: "♜",
    title: "Dedicated Player",
    description: "Finish 10 game sessions.",
    reward: 30,
    check: s => s.gamesPlayed >= 10
  },
  {
    id: "level5",
    icon: "↑",
    title: "Rising Star",
    description: "Reach level 5.",
    reward: 35,
    check: s => levelOf(s.xp) >= 5
  },
  {
    id: "runner100",
    icon: "»",
    title: "Speed Demon",
    description: "Score 100 in Neon Odyssey.",
    reward: 20,
    check: s => s.bests.runner >= 100
  },
  {
    id: "sky100",
    icon: "☁",
    title: "Sky High",
    description: "Score 100 in Skybound.",
    reward: 20,
    check: s => s.bests.jumper >= 100
  },
  {
    id: "crystal100",
    icon: "✧",
    title: "Treasure Hunter",
    description: "Score 100 in Crystal Quest.",
    reward: 20,
    check: s => s.bests.crystal >= 100
  }
];

function freshState() {
  return {
    name: "Player",
    xp: 0,
    coins: 0,
    gamesPlayed: 0,
    completed: 0,
    worlds: [],
    favorites: [],
    achievements: [],
    bests: {
      runner: 0,
      jumper: 0,
      crystal: 0
    },
    lastGame: "runner"
  };
}

function levelOf(xp) {
  return Math.floor(Math.max(0, Number(xp) || 0) / 100) + 1;
}

function loadState() {
  try {
    const raw = localStorage.getItem("aliaBloxSave");
    if (!raw) return freshState();

    const saved = JSON.parse(raw);
    if (!saved || typeof saved !== "object" || Array.isArray(saved)) {
      return freshState();
    }

    const defaults = freshState();
    const state = { ...defaults, ...saved };

    state.name = typeof state.name === "string"
      ? state.name.trim().slice(0, 18) || "Player"
      : "Player";

    for (const key of ["xp", "coins", "gamesPlayed", "completed"]) {
      state[key] = Math.max(0, Math.floor(Number(state[key]) || 0));
    }

    const validIds = GAMES.map(g => g.id);

    state.worlds = Array.isArray(state.worlds)
      ? [...new Set(state.worlds.filter(id => validIds.includes(id)))]
      : [];

    state.favorites = Array.isArray(state.favorites)
      ? [...new Set(state.favorites.filter(id => validIds.includes(id)))]
      : [];

    state.achievements = Array.isArray(state.achievements)
      ? [...new Set(state.achievements.filter(id =>
          ACHIEVEMENTS.some(a => a.id === id)
        ))]
      : [];

    const oldBests = state.bests && typeof state.bests === "object"
      ? state.bests
      : {};

    state.bests = {};
    for (const id of validIds) {
      state.bests[id] = Math.max(0, Math.floor(Number(oldBests[id]) || 0));
    }

    if (!validIds.includes(state.lastGame)) {
      state.lastGame = "runner";
    }

    return state;
  } catch (error) {
    console.warn("The saved game data could not be loaded.", error);
    return freshState();
  }
}

let state = loadState();
let activePage = "home";
let activeGame = null;
let gameSession = null;
let activeFilter = "all";
let soundEnabled = false;
let audioContext = null;
let toastTimer = null;
let achievementQueue = [];
let achievementBusy = false;

function saveState() {
  try {
    localStorage.setItem("aliaBloxSave", JSON.stringify(state));
  } catch (error) {
    console.warn("Progress could not be saved.", error);
  }
}

function escapeHTML(value) {
  return String(value).replace(/[&<>"']/g, char => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[char]);
}

function getGame(id) {
  return GAMES.find(g => g.id === id) || GAMES[0];
}

function notify(message) {
  const toast = $("toast");
  if (!toast) return;

  toast.textContent = message;
  toast.classList.add("show");

  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    toast.classList.remove("show");
  }, 2800);
}

function renderHeader() {
  const initial = (state.name.trim()[0] || "P").toUpperCase();

  $("coinCount").textContent = state.coins.toLocaleString();
  $("topName").textContent = state.name;
  $("topAvatar").textContent = initial;
  $("sideAvatar").textContent = initial;
  $("sideName").textContent = state.name;
  $("sideLevel").textContent = "Level " + levelOf(state.xp) + " explorer";
  $("favoriteCount").textContent = state.favorites.length;
}

function renderProgress() {
  const level = levelOf(state.xp);
  const progress = state.xp % 100;

  $("homeLevel").textContent = level;
  $("homeCoins").textContent = state.coins.toLocaleString();
  $("homeGames").textContent = state.completed;
  $("homeWorlds").textContent = state.worlds.length;

  $("homeLevelProgress").style.width = progress + "%";
  $("homeXP").textContent = progress + " / 100 XP";

  $("levelLabel")?.textContent;
  $("levelProgress").style.width = progress + "%";
  $("xpLabel").textContent = state.xp + " XP";
  $("xpNext").textContent = (100 - progress) + " XP to next level";

  $("levelAvatar").textContent = (state.name[0] || "P").toUpperCase();
  $("levelPlayerName").textContent = state.name;
  $("levelPlayerText").textContent = "Level " + level;
  $("levelNumber").textContent = "LV. " + level;
}

function gameCardHTML(game) {
  const favorite = state.favorites.includes(game.id);

  return `
    <article class="game-card">
      <div class="game-art art-${game.art}">
        <span class="art-label">${game.tag}</span>
        <span class="art-symbol" aria-hidden="true">${game.symbol}</span>
        <button
          class="favorite-button ${favorite ? "is-favorite" : ""}"
          data-favorite="${game.id}"
          aria-label="${favorite ? "Remove from" : "Add to"} favorites"
          aria-pressed="${favorite}"
        >${favorite ? "♥" : "♡"}</button>
      </div>
      <div class="game-info">
        <div class="game-title-row">
          <h3>${escapeHTML(game.title)}</h3>
          <span class="game-type">${game.category.toUpperCase()}</span>
        </div>
        <p>${escapeHTML(game.description)}</p>
        <div class="game-meta">
          <span class="game-best">Best: ${(state.bests[game.id] || 0).toLocaleString()}</span>
          <button class="play-card-button" data-play="${game.id}">Play now →</button>
        </div>
      </div>
    </article>
  `;
}

function renderGameGrids() {
  $("homeGameGrid").innerHTML = GAMES.map(gameCardHTML).join("");

  const query = $("gameSearch").value.trim().toLowerCase();

  const filtered = GAMES.filter(game => {
    const searchable = [
      game.title,
      game.description,
      game.category,
      game.tag
    ].join(" ").toLowerCase();

    return searchable.includes(query) &&
      (activeFilter === "all" || game.filter === activeFilter);
  });

  $("libraryGameGrid").innerHTML = filtered.map(gameCardHTML).join("");
  $("noGames").classList.toggle("hidden", filtered.length > 0);
  $("libraryCount").textContent = filtered.length;

  const favorites = GAMES.filter(game => state.favorites.includes(game.id));

  $("favoriteGameGrid").innerHTML = favorites.map(gameCardHTML).join("");
  $("noFavorites").classList.toggle("hidden", favorites.length > 0);
  $("favoritesTotal").textContent = favorites.length;
}

function renderContinue() {
  const game = getGame(state.lastGame);

  $("continueContent").innerHTML = `
    <div class="continue-item">
      <div class="continue-art">${game.symbol}</div>
      <div class="continue-details">
        <strong>${escapeHTML(game.title)}</strong>
        <span>Personal best: ${(state.bests[game.id] || 0).toLocaleString()}</span>
      </div>
      <button class="play-card-button" data-play="${game.id}">Play →</button>
    </div>
  `;
}

function renderProfile() {
  const initial = (state.name[0] || "P").toUpperCase();

  $("profileDisplayName").textContent = state.name;
  $("profileAvatar").textContent = initial;
  $("profileLevel").textContent = "Level " + levelOf(state.xp) + " explorer";
  $("profileXP").textContent = state.xp.toLocaleString();
  $("profileCoins").textContent = state.coins.toLocaleString();
  $("profileGames").textContent = state.completed;
  $("profileWorlds").textContent = state.worlds.length;
  $("profileWorldBadge").textContent = state.worlds.length + " WORLDS";

  if (document.activeElement !== $("playerName")) {
    $("playerName").value = state.name;
  }
}

function renderAchievements() {
  const unlocked = state.achievements.length;
  const total = ACHIEVEMENTS.length;
  const percent = Math.round((unlocked / total) * 100);

  $("achievementCount").textContent = unlocked + " / " + total;
  $("achievementProgress").style.width = percent + "%";
  $("achievementPercent").textContent = percent + "% complete";

  $("achievementSummary").textContent = unlocked === total
    ? "You've unlocked every achievement!"
    : unlocked === 0
      ? "Your journey starts here."
      : "You've unlocked " + unlocked + " milestone" + (unlocked === 1 ? "." : "s.");

  $("achievementGrid").innerHTML = ACHIEVEMENTS.map(item => {
    const isUnlocked = state.achievements.includes(item.id);

    return `
      <article class="achievement-card ${isUnlocked ? "unlocked" : ""}">
        <div class="achievement-icon">${item.icon}</div>
        <div>
          <strong>${escapeHTML(item.title)}</strong>
          <p>${escapeHTML(item.description)}</p>
          <div class="achievement-status">
            ${isUnlocked ? "Unlocked · +" + item.reward + " coins" : "Locked"}
          </div>
        </div>
      </article>
    `;
  }).join("");
}

function renderAll() {
  renderHeader();
  renderProgress();
  renderGameGrids();
  renderContinue();
  renderProfile();
  renderAchievements();

  if (activeGame) renderHUD();
}

function showPage(page) {
  const validPages = [
    "home", "games", "favorites",
    "achievements", "profile", "play"
  ];

  if (!validPages.includes(page)) return;

  if (page !== "play") stopSession();

  activePage = page;

  const labels = {
    home: "Home",
    games: "Discover games",
    favorites: "Favorites",
    achievements: "Achievements",
    profile: "My profile",
    play: "Playing"
  };

  document.querySelectorAll(".page").forEach(section => {
    section.classList.toggle("hidden", section.id !== page + "Page");
  });

  document.querySelectorAll(".nav-item").forEach(button => {
    button.classList.toggle("active", button.dataset.page === page);
  });

  $("pageCrumb").textContent = labels[page];
  $("sidebar").classList.remove("open");

  renderAll();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function toggleFavorite(id) {
  if (!GAMES.some(game => game.id === id)) return;

  if (state.favorites.includes(id)) {
    state.favorites = state.favorites.filter(item => item !== id);
    notify("Removed from favorites.");
  } else {
    state.favorites.push(id);
    notify("Added to favorites.");
  }

  saveState();
  renderAll();
}

function enterGame(id) {
  stopSession();

  activeGame = getGame(id);
  state.lastGame = activeGame.id;
  state.worlds = [...new Set([...state.worlds, activeGame.id])];

  saveState();

  $("activeGameTitle").textContent = activeGame.title;
  $("activeGameDescription").textContent = activeGame.description;
  $("gameCategory").textContent = activeGame.category.toUpperCase();
  $("stageName").textContent = "WORLD 0" + (GAMES.findIndex(g => g.id === id) + 1);
  $("missionTitle").textContent = activeGame.title;
  $("missionText").textContent = activeGame.mission;
  $("gameTip").textContent = activeGame.tip;
  $("controlText").textContent = activeGame.controls;
  $("overlayControls").textContent = activeGame.controls;
  $("overlayTitle").textContent = "Enter " + activeGame.title + ".";
  $("overlayDescription").textContent = activeGame.mission;
  $("startGame").textContent = "Start playing →";
  $("overlayMark").textContent = activeGame.symbol;

  $("gameOverlay").classList.remove("hidden");

  drawPreview(activeGame.id);
  showPage("play");
  renderHUD();
  checkAchievements();
}

function renderHUD() {
  if (!activeGame) return;

  $("liveBest").textContent = (state.bests[activeGame.id] || 0).toLocaleString();
  $("stageBest").textContent = (state.bests[activeGame.id] || 0).toLocaleString();
  $("liveScore").textContent = gameSession
    ? Math.floor(gameSession.score).toLocaleString()
    : "0";
  $("liveCoins").textContent = gameSession ? gameSession.coins : "0";
}

function toggleSound() {
  soundEnabled = !soundEnabled;

  $("soundToggle").textContent = soundEnabled ? "♫" : "♩";
  $("soundToggle").style.color = soundEnabled ? "var(--cyan)" : "";

  if (soundEnabled) playTone(520, 0.08);

  notify(soundEnabled ? "Sound effects enabled." : "Sound effects disabled.");
}

function playTone(frequency, duration) {
  if (!soundEnabled) return;

  try {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return;

    if (!audioContext) audioContext = new AudioContextClass();

    if (audioContext.state === "suspended") {
      audioContext.resume().catch(() => {});
    }

    const oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();
    const now = audioContext.currentTime;

    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(frequency, now);
    gain.gain.setValueAtTime(0.035, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    oscillator.connect(gain);
    gain.connect(audioContext.destination);

    oscillator.start(now);
    oscillator.stop(now + duration);
  } catch (error) {
    console.warn("Audio is unavailable.", error);
  }
}

function drawPreview(id) {
  const canvas = $("gameCanvas");
  const ctx = canvas.getContext("2d");

  if (!ctx) {
    notify("Your browser does not support this game canvas.");
    return;
  }

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (id === "runner") {
    drawRunnerScene(ctx, canvas.width, canvas.height, 0, null);
  } else if (id === "jumper") {
    drawJumperScene(ctx, canvas.width, canvas.height, null);
  } else {
    drawCrystalScene(ctx, canvas.width, canvas.height, null);
  }
}

function stopSession() {
  if (!gameSession) return;

  gameSession.running = false;

  if (gameSession.frame) {
    cancelAnimationFrame(gameSession.frame);
  }

  gameSession.keys.clear();
  gameSession = null;
}

function startGame() {
  if (!activeGame) return;

  stopSession();

  const canvas = $("gameCanvas");
  const ctx = canvas.getContext("2d");

  if (!ctx) {
    notify("Your browser could not start the game.");
    return;
  }

  gameSession = {
    id: activeGame.id,
    canvas,
    ctx,
    running: true,
    ended: false,
    frame: 0,
    lastTime: 0,
    elapsed: 0,
    score: 0,
    coins: 0,
    keys: new Set(),
    objects: [],
    particles: [],
    player: null,
    worldOffset: 0,
    obstacleTimer: 1.1,
    coinTimer: 0.8,
    rewardPaid: false
  };

  initializeGame(gameSession);

  $("gameOverlay").classList.add("hidden");
  renderHUD();

  gameSession.frame = requestAnimationFrame(gameLoop);
}

function initializeGame(s) {
  if (s.id === "runner") {
    s.player = {
      x: 150, y: 390, w: 34, h: 44,
      vy: 0, jumps: 0, grounded: true
    };
    s.obstacleTimer = 1.15;
    s.coinTimer = 0.8;
    return;
  }

  if (s.id === "jumper") {
    s.player = {
      x: 450, y: 380, w: 30, h: 38,
      vx: 0, vy: 0, grounded: false
    };

    s.cameraY = 0;
    s.highest = s.player.y;
    s.platforms = [];
    s.gems = [];

    const platformXs = [
      390, 500, 370, 240, 350, 470,
      340, 200, 320, 450, 330, 190,
      310, 440, 320, 180, 300, 430
    ];

    for (let i = 0; i < platformXs.length; i++) {
      const platform = {
        x: platformXs[i],
        y: 425 - i * 76,
        w: 145,
        h: 13
      };

      s.platforms.push(platform);

      if (i > 0 && i % 2 === 1) {
        s.gems.push({
          x: platform.x + platform.w / 2,
          y: platform.y - 28,
          taken: false
        });
      }
    }

    return;
  }

  s.player = { x: 1, y: 1 };
  s.moveCooldown = 0;
  s.mazeWon = false;

  s.maze = [
    "############",
    "#....#.....#",
    "#.##.#.###.#",
    "#....#...#.#",
    "####.##..#.#",
    "#......#...#",
    "#.####.#.###",
    "#.#....#...#",
    "#.#.######.#",
    "#..........#",
    "############"
  ];

  s.crystals = [
    { x: 3, y: 1, taken: false },
    { x: 9, y: 1, taken: false },
    { x: 1, y: 5, taken: false },
    { x: 5, y: 5, taken: false },
    { x: 10, y: 7, taken: false },
    { x: 8, y: 9, taken: false },
    { x: 2, y: 9, taken: false }
  ];

  s.enemies = [
    { x: 9, y: 3, timer: 0 },
    { x: 2, y: 7, timer: 0 }
  ];
}

function gameLoop(timestamp) {
  const s = gameSession;

  if (!s || !s.running || s.ended) return;

  const dt = s.lastTime
    ? Math.min((timestamp - s.lastTime) / 1000, 0.035)
    : 0;

  s.lastTime = timestamp;
  s.elapsed += dt;

  if (s.id === "runner") updateRunner(s, dt);
  else if (s.id === "jumper") updateJumper(s, dt);
  else updateCrystal(s, dt);

  if (gameSession === s && s.running && !s.ended) {
    renderHUD();
    s.frame = requestAnimationFrame(gameLoop);
  }
}

function addParticle(s, x, y, color) {
  for (let i = 0; i < 7; i++) {
    s.particles.push({
      x, y,
      vx: (Math.random() - 0.5) * 140,
      vy: -Math.random() * 100,
      life: 0.45,
      color
    });
  }
}

function updateParticles(s, dt) {
  for (const p of s.particles) {
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.vy += 90 * dt;
    p.life -= dt;
  }

  s.particles = s.particles.filter(p => p.life > 0);
}

function drawParticles(ctx, s) {
  for (const p of s.particles) {
    ctx.globalAlpha = Math.max(0, p.life / 0.45);
    ctx.fillStyle = p.color;
    ctx.fillRect(p.x, p.y, 4, 4);
  }

  ctx.globalAlpha = 1;
}

function intersects(a, b) {
  return a.x < b.x + b.w &&
    a.x + a.w > b.x &&
    a.y < b.y + b.h &&
    a.y + a.h > b.y;
}

/* NEON ODYSSEY */

function updateRunner(s, dt) {
  const w = s.canvas.width;
  const h = s.canvas.height;
  const p = s.player;

  s.score += dt * 10;
  s.worldOffset += dt * (260 + Math.min(s.score * 1.2, 260));
  s.obstacleTimer -= dt;
  s.coinTimer -= dt;

  if (s.obstacleTimer <= 0) {
    const last = s.objects[s.objects.length - 1];

    if (!last || last.x < w - 270) {
      const tall = Math.random() < 0.35;

      s.objects.push({
        type: "obstacle",
        x: w + 20,
        y: tall ? 385 : 407,
        w: tall ? 33 : 27,
        h: tall ? 49 : 27
      });

      s.obstacleTimer = Math.max(
        0.65,
        1.25 + Math.random() * 0.6 - s.score / 800
      );
    }
  }

  if (s.coinTimer <= 0) {
    s.objects.push({
      type: "coin",
      x: w + 20,
      y: 300 + Math.random() * 65,
      w: 16,
      h: 16
    });

    s.coinTimer = 0.8 + Math.random() * 0.7;
  }

  const speed = 260 + Math.min(s.score * 1.3, 300);

  for (const object of s.objects) {
    object.x -= speed * dt;
  }

  s.objects = s.objects.filter(o => o.x + o.w > -20);

  p.vy += 1550 * dt;
  p.y += p.vy * dt;

  const floor = 434;

  if (p.y + p.h >= floor) {
    p.y = floor - p.h;
    p.vy = 0;
    p.grounded = true;
    p.jumps = 0;
  } else {
    p.grounded = false;
  }

  for (const object of s.objects) {
    if (object.type === "coin" && intersects(p, object)) {
      object.type = "taken";
      s.coins++;
      s.score += 5;

      addParticle(s, object.x, object.y, "#ffcf70");
      playTone(740, 0.05);
    } else if (object.type === "obstacle" && intersects(p, object)) {
      drawRunnerScene(s.ctx, w, h, s.worldOffset, s);
      endGame(false, "You scored " + Math.floor(s.score) + ".");
      return;
    }
  }

  updateParticles(s, dt);
  drawRunnerScene(s.ctx, w, h, s.worldOffset, s);
}

function jumpRunner() {
  const s = gameSession;

  if (!s || !s.running || s.id !== "runner") return;

  const p = s.player;

  if (p.jumps >= 2) return;

  p.vy = p.jumps === 0 ? -590 : -480;
  p.jumps++;
  p.grounded = false;

  playTone(400, 0.07);
}

function drawRunnerScene(ctx, w, h, offset, s) {
  ctx.fillStyle = "#0b1022";
  ctx.fillRect(0, 0, w, h);

  const sky = ctx.createLinearGradient(0, 0, 0, h);
  sky.addColorStop(0, "#10152e");
  sky.addColorStop(1, "#211336");

  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, w, h);

  ctx.fillStyle = "#b29bff";
  ctx.beginPath();
  ctx.arc(740, 100, 40, 0, Math.PI * 2);
  ctx.fill();

  ctx.globalAlpha = 0.35;
  ctx.fillStyle = "#0a0e1d";

  for (let i = 0; i < 16; i++) {
    const x = ((i * 95 - offset * 0.15) % (w + 100) + w + 100) % (w + 100) - 50;
    const bh = 80 + (i * 47 % 130);
    ctx.fillRect(x, 360 - bh, 65, bh);
  }

  ctx.globalAlpha = 1;
  ctx.fillStyle = "#14152d";
  ctx.fillRect(0, 434, w, 106);

  ctx.strokeStyle = "#5ee7ff";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(0, 434);
  ctx.lineTo(w, 434);
  ctx.stroke();

  ctx.strokeStyle = "#41436c";
  ctx.lineWidth = 1;

  for (let x = -60; x < w + 60; x += 60) {
    const xx = x - (offset % 60);
    ctx.beginPath();
    ctx.moveTo(xx, 435);
    ctx.lineTo(xx - 35, 540);
    ctx.stroke();
  }

  if (!s) {
    ctx.fillStyle = "#a68bff";
    ctx.fillRect(150, 390, 34, 44);
    return;
  }

  for (const object of s.objects) {
    if (object.type === "obstacle") {
      ctx.fillStyle = "#ff579c";
      ctx.shadowColor = "#ff579c";
      ctx.shadowBlur = 16;
      ctx.fillRect(object.x, object.y, object.w, object.h);
      ctx.shadowBlur = 0;

      ctx.fillStyle = "#ffb0d2";
      ctx.fillRect(object.x + 5, object.y + 5, Math.max(3, object.w - 10), 4);
    } else if (object.type === "coin") {
      ctx.fillStyle = "#ffcf70";
      ctx.shadowColor = "#ffcf70";
      ctx.shadowBlur = 15;
      ctx.beginPath();
      ctx.arc(object.x + 8, object.y + 8, 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
    }
  }

  const p = s.player;

  ctx.fillStyle = "#a68bff";
  ctx.shadowColor = "#a68bff";
  ctx.shadowBlur = 20;
  ctx.fillRect(p.x, p.y, p.w, p.h);
  ctx.shadowBlur = 0;

  ctx.fillStyle = "#f3f4ff";
  ctx.fillRect(p.x + 20, p.y + 10, 7, 7);

  drawParticles(ctx, s);
}

/* SKYBOUND */

function updateJumper(s, dt) {
  const p = s.player;
  const w = s.canvas.width;
  const h = s.canvas.height;

  const left = s.keys.has("ArrowLeft") || s.keys.has("a");
  const right = s.keys.has("ArrowRight") || s.keys.has("d");

  p.vx = ((right ? 1 : 0) - (left ? 1 : 0)) * 260;

  const oldY = p.y;
  p.x += p.vx * dt;
  p.x = Math.max(0, Math.min(w - p.w, p.x));

  p.grounded = false;
  p.vy += 1100 * dt;
  p.y += p.vy * dt;

  if (p.vy > 0) {
    for (const platform of s.platforms) {
      const crossedPlatform =
        oldY + p.h <= platform.y &&
        p.y + p.h >= platform.y;

      const overlapsPlatform =
        p.x + p.w > platform.x &&
        p.x < platform.x + platform.w;

      if (crossedPlatform && overlapsPlatform) {
        p.y = platform.y - p.h;
        p.vy = 0;
        p.grounded = true;
        break;
      }
    }
  }

  for (const gem of s.gems) {
    if (
      !gem.taken &&
      Math.abs((p.x + p.w / 2) - gem.x) < 22 &&
      Math.abs((p.y + p.h / 2) - gem.y) < 25
    ) {
      gem.taken = true;
      s.coins += 3;
      s.score += 20;

      addParticle(s, gem.x, gem.y, "#5ee7ff");
      playTone(800, 0.06);
    }
  }

  s.highest = Math.min(s.highest, p.y);
  s.score = Math.max(
    s.score,
    Math.floor(Math.max(0, 425 - s.highest) / 2)
  );

  if (p.y < s.cameraY + 180) {
    s.cameraY = p.y - 180;
  }

  updateParticles(s, dt);
  drawJumperScene(s.ctx, w, h, s);

  if (p.y - s.cameraY > h + 20) {
    endGame(false, "You reached a height score of " + Math.floor(s.score) + ".");
  }
}

function jumpJumper() {
  const s = gameSession;

  if (!s || !s.running || s.id !== "jumper") return;

  if (s.player.grounded) {
    s.player.vy = -590;
    s.player.grounded = false;
    playTone(420, 0.06);
  }
}

function drawJumperScene(ctx, w, h, s) {
  ctx.fillStyle = "#091629";
  ctx.fillRect(0, 0, w, h);

  const gradient = ctx.createLinearGradient(0, 0, w, h);
  gradient.addColorStop(0, "#102c45");
  gradient.addColorStop(1, "#1d1640");

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, w, h);

  ctx.globalAlpha = 0.6;

  for (let i = 0; i < 70; i++) {
    ctx.fillStyle = i % 3 === 0 ? "#5ee7ff" : "#ffffff";
    ctx.fillRect((i * 137) % w, (i * 83) % h, 2, 2);
  }

  ctx.globalAlpha = 1;

  if (!s) {
    for (let i = 0; i < 5; i++) {
      const x = 110 + (i * 157) % (w - 180);
      const y = 420 - i * 76;

      ctx.fillStyle = "#23647a";
      ctx.fillRect(x, y, 130, 12);
    }

    ctx.fillStyle = "#5ee7ff";
    ctx.fillRect(450, 380, 30, 38);
    return;
  }

  for (const platform of s.platforms) {
    const y = platform.y - s.cameraY;

    if (y < -30 || y > h + 30) continue;

    ctx.fillStyle = "#16465d";
    ctx.fillRect(platform.x, y, platform.w, platform.h);

    ctx.fillStyle = "#5ee7ff";
    ctx.fillRect(platform.x, y, platform.w, 3);
  }

  for (const gem of s.gems) {
    if (gem.taken) continue;

    const y = gem.y - s.cameraY;

    if (y < -20 || y > h + 20) continue;

    ctx.fillStyle = "#7df5b4";
    ctx.shadowColor = "#7df5b4";
    ctx.shadowBlur = 15;
    ctx.beginPath();
    ctx.moveTo(gem.x, y - 10);
    ctx.lineTo(gem.x + 8, y);
    ctx.lineTo(gem.x, y + 10);
    ctx.lineTo(gem.x - 8, y);
    ctx.closePath();
    ctx.fill();
    ctx.shadowBlur = 0;
  }

  const p = s.player;

  ctx.fillStyle = "#a68bff";
  ctx.shadowColor = "#a68bff";
  ctx.shadowBlur = 15;
  ctx.fillRect(p.x, p.y - s.cameraY, p.w, p.h);
  ctx.shadowBlur = 0;

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(p.x + 19, p.y - s.cameraY + 8, 5, 5);

  drawParticles(ctx, s);
}

/* CRYSTAL QUEST */

function isWall(s, x, y) {
  return y < 0 ||
    y >= s.maze.length ||
    x < 0 ||
    x >= s.maze[0].length ||
    s.maze[y][x] === "#";
}

function updateCrystal(s, dt) {
  const p = s.player;
  const w = s.canvas.width;
  const h = s.canvas.height;

  s.moveCooldown -= dt;

  if (s.moveCooldown <= 0) {
    let dx = 0;
    let dy = 0;

    if (s.keys.has("ArrowLeft") || s.keys.has("a")) dx = -1;
    else if (s.keys.has("ArrowRight") || s.keys.has("d")) dx = 1;
    else if (s.keys.has("ArrowUp") || s.keys.has("w")) dy = -1;
    else if (s.keys.has("ArrowDown") || s.keys.has("s")) dy = 1;

    if (dx || dy) {
      const nx = p.x + dx;
      const ny = p.y + dy;

      if (!isWall(s, nx, ny)) {
        p.x = nx;
        p.y = ny;
        s.score += 1;
        s.moveCooldown = 0.12;
      }
    }
  }

  for (const crystal of s.crystals) {
    if (!crystal.taken && p.x === crystal.x && p.y === crystal.y) {
      crystal.taken = true;
      s.coins += 5;
      s.score += 20;

      addParticle(
        s,
        (s.canvas.width - 90) / 2 + p.x * 54,
        (s.canvas.height - 50) / 2 + p.y * 43,
        "#7df5b4"
      );

      playTone(720, 0.06);
    }
  }

  for (const enemy of s.enemies) {
    enemy.timer += dt;

    if (enemy.timer >= 1) {
      enemy.timer = 0;

      const dx = p.x - enemy.x;
      const dy = p.y - enemy.y;

      const options = Math.abs(dx) > Math.abs(dy)
        ? [[Math.sign(dx), 0], [0, Math.sign(dy)]]
        : [[0, Math.sign(dy)], [Math.sign(dx), 0]];

      for (const [ex, ey] of options) {
        if ((ex || ey) && !isWall(s, enemy.x + ex, enemy.y + ey)) {
          enemy.x += ex;
          enemy.y += ey;
          break;
        }
      }
    }

    if (enemy.x === p.x && enemy.y === p.y) {
      drawCrystalScene(s.ctx, w, h, s);

      endGame(
        false,
        "The guardians caught you. You collected " +
        s.crystals.filter(c => c.taken).length + " crystals."
      );

      return;
    }
  }

  if (s.crystals.every(c => c.taken)) {
    s.score += 50;
    s.mazeWon = true;

    drawCrystalScene(s.ctx, w, h, s);
    endGame(true, "You collected every crystal and escaped the maze!");
    return;
  }

  updateParticles(s, dt);
  drawCrystalScene(s.ctx, w, h, s);
}

function drawCrystalScene(ctx, w, h, s) {
  ctx.fillStyle = "#071a1c";
  ctx.fillRect(0, 0, w, h);

  if (!s) {
    ctx.fillStyle = "#153c40";

    for (let y = 0; y < 11; y++) {
      for (let x = 0; x < 12; x++) {
        ctx.fillRect(130 + x * 54, 40 + y * 43, 49, 38);
      }
    }

    ctx.fillStyle = "#7df5b4";
    ctx.font = "bold 38px sans-serif";
    ctx.fillText("◇", 275, 110);

    ctx.fillStyle = "#a68bff";
    ctx.fillRect(180, 95, 23, 30);
    return;
  }

  const cellW = Math.min(54, (w - 90) / 12);
  const cellH = Math.min(43, (h - 50) / 11);
  const ox = (w - cellW * 12) / 2;
  const oy = (h - cellH * 11) / 2;

  for (let y = 0; y < s.maze.length; y++) {
    for (let x = 0; x < s.maze[y].length; x++) {
      const wall = s.maze[y][x] === "#";
      const px = ox + x * cellW;
      const py = oy + y * cellH;

      ctx.fillStyle = wall ? "#1b3545" : "#0b282b";
      ctx.fillRect(px, py, cellW - 2, cellH - 2);

      if (wall) {
        ctx.fillStyle = "#315566";
        ctx.fillRect(px, py, cellW - 2, 3);
      }
    }
  }

  for (const crystal of s.crystals) {
    if (crystal.taken) continue;

    const x = ox + (crystal.x + 0.5) * cellW;
    const y = oy + (crystal.y + 0.5) * cellH;

    ctx.fillStyle = "#7df5b4";
    ctx.shadowColor = "#7df5b4";
    ctx.shadowBlur = 13;
    ctx.beginPath();
    ctx.moveTo(x, y - 10);
    ctx.lineTo(x + 8, y);
    ctx.lineTo(x, y + 10);
    ctx.lineTo(x - 8, y);
    ctx.closePath();
    ctx.fill();
    ctx.shadowBlur = 0;
  }

  for (const enemy of s.enemies) {
    const x = ox + (enemy.x + 0.5) * cellW;
    const y = oy + (enemy.y + 0.5) * cellH;

    ctx.fillStyle = "#ff579c";
    ctx.shadowColor = "#ff579c";
    ctx.shadowBlur = 12;
    ctx.beginPath();
    ctx.arc(x, y, 12, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
  }

  const px = ox + (s.player.x + 0.5) * cellW;
  const py = oy + (s.player.y + 0.5) * cellH;

  ctx.fillStyle = "#a68bff";
  ctx.shadowColor = "#a68bff";
  ctx.shadowBlur = 15;
  ctx.fillRect(px - 11, py - 13, 22, 26);
  ctx.shadowBlur = 0;

  drawParticles(ctx, s);

  ctx.fillStyle = "#d1d9ed";
  ctx.font = "14px sans-serif";
  ctx.fillText(
    "Crystals: " + s.crystals.filter(c => c.taken).length +
    " / " + s.crystals.length,
    20, 25
  );
}

/* SESSION RESULTS AND ACHIEVEMENTS */

function endGame(won, message) {
  const s = gameSession;

  if (!s || s.ended) return;

  s.ended = true;
  s.running = false;
  s.rewardPaid = true;

  const score = Math.max(0, Math.floor(s.score));
  const previousBest = state.bests[s.id] || 0;
  const isNewBest = score > previousBest;

  state.bests[s.id] = Math.max(previousBest, score);
  state.gamesPlayed++;
  state.completed += won ? 1 : 0;

  const xpReward = Math.max(5, Math.floor(score / 3) + (won ? 25 : 0));
  const coinReward = Math.max(2, Math.floor(s.coins) + (won ? 15 : 0));

  state.xp += xpReward;
  state.coins += coinReward;

  const previousAchievements = new Set(state.achievements);

  for (const achievement of ACHIEVEMENTS) {
    if (
      !previousAchievements.has(achievement.id) &&
      achievement.check(state)
    ) {
      state.achievements.push(achievement.id);
      state.coins += achievement.reward;
      achievementQueue.push(achievement);
    }
  }

  saveState();
  renderAll();

  $("overlayTitle").textContent = won ? "World completed!" : "Run over.";
  $("overlayDescription").textContent =
    message + " +" + xpReward + " XP and +" + coinReward + " coins." +
    (isNewBest ? " New personal best!" : "");

  $("startGame").textContent = "Play again →";
  $("overlayMark").textContent = won ? "✦" : "↻";
  $("gameOverlay").classList.remove("hidden");

  if (soundEnabled) playTone(won ? 660 : 220, 0.15);

  processAchievementQueue();
}

function checkAchievements() {
  let changed = false;

  for (const achievement of ACHIEVEMENTS) {
    if (
      !state.achievements.includes(achievement.id) &&
      achievement.check(state)
    ) {
      state.achievements.push(achievement.id);
      state.coins += achievement.reward;
      achievementQueue.push(achievement);
      changed = true;
    }
  }

  if (changed) {
    saveState();
    renderAll();
    processAchievementQueue();
  } else {
    renderAchievements();
  }
}

function processAchievementQueue() {
  if (achievementBusy || achievementQueue.length === 0) return;

  achievementBusy = true;
  const achievement = achievementQueue.shift();

  notify("Achievement unlocked: " + achievement.title +
    " (+" + achievement.reward + " coins)");

  setTimeout(() => {
    achievementBusy = false;
    processAchievementQueue();
  }, 1000);
}

/* NAVIGATION AND INPUT */

document.addEventListener("click", event => {
  const pageButton = event.target.closest("[data-page]");

  if (pageButton) {
    event.preventDefault();
    showPage(pageButton.dataset.page);
    return;
  }

  const playButton = event.target.closest("[data-play]");

  if (playButton) {
    enterGame(playButton.dataset.play);
    return;
  }

  const favoriteButton = event.target.closest("[data-favorite]");

  if (favoriteButton) {
    toggleFavorite(favoriteButton.dataset.favorite);
    return;
  }

  const filterButton = event.target.closest("[data-filter]");

  if (filterButton) {
    activeFilter = filterButton.dataset.filter;

    document.querySelectorAll("[data-filter]").forEach(button => {
      button.classList.toggle("selected", button === filterButton);
    });

    renderGameGrids();
  }
});

$("gameSearch").addEventListener("input", renderGameGrids);

document.addEventListener("keydown", event => {
  if (
    event.target.matches("input, textarea, select") ||
    event.target.isContentEditable
  ) {
    return;
  }

  if (event.key === "/" && activePage === "games") {
    event.preventDefault();
    $("gameSearch").focus();
    return;
  }

  if (event.key === "Escape") {
    if (!$("resetModal").classList.contains("hidden")) {
      closeResetModal();
      return;
    }

    if (activePage === "play") {
      showPage("games");
      return;
    }

    $("sidebar").classList.remove("open");
    return;
  }

  const s = gameSession;

  if (!s || !s.running || s.ended) return;

  if (
    ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", " "].includes(event.key)
  ) {
    event.preventDefault();
  }

  if (s.id === "runner") {
    if (!event.repeat && ["ArrowUp", " ", "w", "W"].includes(event.key)) {
      jumpRunner();
    }
    return;
  }

  if (s.id === "jumper") {
    if (!event.repeat && ["ArrowUp", " ", "w", "W"].includes(event.key)) {
      jumpJumper();
    }

    const key = event.key.length === 1 ? event.key.toLowerCase() : event.key;
    s.keys.add(key);
    return;
  }

  const key = event.key.length === 1 ? event.key.toLowerCase() : event.key;
  s.keys.add(key);
});

document.addEventListener("keyup", event => {
  if (!gameSession) return;

  const key = event.key.length === 1 ? event.key.toLowerCase() : event.key;
  gameSession.keys.delete(key);
});

window.addEventListener("blur", () => {
  if (gameSession) gameSession.keys.clear();
});

$("gameCanvas").addEventListener("pointerdown", event => {
  const s = gameSession;

  if (!s || !s.running || s.ended) return;

  if (s.id === "runner") {
    jumpRunner();
    return;
  }

  if (s.id === "jumper") {
    const rect = s.canvas.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width;

    if (x < 0.35) {
      s.keys.add("ArrowLeft");
      setTimeout(() => {
        if (gameSession === s) s.keys.delete("ArrowLeft");
      }, 180);
    } else if (x > 0.65) {
      s.keys.add("ArrowRight");
      setTimeout(() => {
        if (gameSession === s) s.keys.delete("ArrowRight");
      }, 180);
    } else {
      jumpJumper();
    }

    return;
  }

  const rect = s.canvas.getBoundingClientRect();
  const x = (event.clientX - rect.left) / rect.width;
  const y = (event.clientY - rect.top) / rect.height;

  const dx = x - 0.5;
  const dy = y - 0.5;

  let key;

  if (Math.abs(dx) > Math.abs(dy)) {
    key = dx < 0 ? "ArrowLeft" : "ArrowRight";
  } else {
    key = dy < 0 ? "ArrowUp" : "ArrowDown";
  }

  s.keys.add(key);

  setTimeout(() => {
    if (gameSession === s) s.keys.delete(key);
  }, 180);
});

/* PLAYER PROFILE */

$("saveName").addEventListener("click", () => {
  const name = $("playerName").value.trim();

  if (!name) {
    notify("Enter a player name first.");
    return;
  }

  state.name = name.slice(0, 18);

  saveState();
  renderAll();
  notify("Player name updated.");
});

$("playerName").addEventListener("keydown", event => {
  if (event.key === "Enter") {
    event.preventDefault();
    $("saveName").click();
  }
});

$("mobileMenu").addEventListener("click", () => {
  $("sidebar").classList.toggle("open");
});

$("startGame").addEventListener("click", startGame);
$("restartGame").addEventListener("click", startGame);
$("backToGames").addEventListener("click", () => showPage("games"));
$("soundToggle").addEventListener("click", toggleSound);

/* RESET CONFIRMATION */

function closeResetModal() {
  $("resetModal").classList.add("hidden");
}

$("resetProgress").addEventListener("click", () => {
  $("resetModal").classList.remove("hidden");
  $("cancelReset").focus();
});

$("cancelReset").addEventListener("click", closeResetModal);

$("resetModal").addEventListener("click", event => {
  if (event.target === $("resetModal")) closeResetModal();
});

$("confirmReset").addEventListener("click", () => {
  stopSession();

  state = freshState();
  activeGame = null;
  activeFilter = "all";
  achievementQueue = [];
  achievementBusy = false;

  saveState();
  closeResetModal();

  $("gameSearch").value = "";

  document.querySelectorAll("[data-filter]").forEach(button => {
    button.classList.toggle("selected", button.dataset.filter === "all");
  });

  renderAll();
  showPage("home");
  notify("Your local progress has been reset.");
});

/* STARTUP */

renderAll();
showPage("home");
checkAchievements();
