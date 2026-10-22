"use strict";

const $ = id => document.getElementById(id);

const GAME_DATA = {
  lava: {
    name: "Floor Is Lava",
    description: "Jump across moving platforms while the lava rises. Hesitate and you're toast.",
    category: "action",
    categoryLabel: "ACTION",
    emoji: "🌋",
    art: "art-lava",
    sticker: "HOT HOT HOT",
    tag: "JUMP & SURVIVE",
    color: "#ffb15b",
    controls: "A/D or ←/→ to move. Space or ↑ to jump. You get a double jump.",
    instructions: "Keep moving, land on platforms, and avoid the lava. Stay alive as long as possible.",
    overlay: "THE FLOOR IS<br>VERY, VERY HOT.",
    overlayDescription: "Keep hopping across platforms. The lava doesn't care about your plans."
  },
  snack: {
    name: "Snack Snatcher",
    description: "Raid the kitchen for snacks while little monsters try to steal your lunch.",
    category: "action",
    categoryLabel: "ACTION",
    emoji: "🍟",
    art: "art-snack",
    sticker: "FREE FOOD!",
    tag: "GRAB & ESCAPE",
    color: "#89e9a2",
    controls: "Move with WASD or arrow keys. Collect all the snacks and avoid monsters.",
    instructions: "Collect every snack in the maze. You have three lives, so don't get caught.",
    overlay: "THE FRIDGE<br>IS UNGUARDED.",
    overlayDescription: "Collect the food. Avoid the hungry monsters. This is a very serious mission."
  },
  button: {
    name: "Don't Press That",
    description: "Read the rule, pick the right button, and try not to panic when the timer starts.",
    category: "chaos",
    categoryLabel: "CHAOS",
    emoji: "🔴",
    art: "art-button",
    sticker: "BAD IDEA",
    tag: "REACTION CHAOS",
    color: "#ff8fba",
    controls: "Click the correct button before the timer runs out. Keyboard: press 1, 2, or 3.",
    instructions: "Follow the changing instruction. Each correct choice earns points. Wrong choices break your streak.",
    overlay: "IT'S PROBABLY<br>FINE TO PRESS.",
    overlayDescription: "Eight rounds. Changing rules. Questionable decisions. Read before you click."
  },
  astro: {
    name: "Alien Delivery",
    description: "Launch space parcels into moving planetary targets. Intergalactic delivery is hard.",
    category: "chaos",
    categoryLabel: "CHAOS",
    emoji: "👽",
    art: "art-astro",
    sticker: "SPACE MAIL",
    tag: "AIM & DELIVER",
    color: "#8d86ff",
    controls: "Click or tap where you want to launch your parcel. Aim ahead of the moving planet.",
    instructions: "Land six parcels in the moving target. Your parcels follow gravity, so aim carefully.",
    overlay: "DELIVERY IN<br>ANOTHER GALAXY.",
    overlayDescription: "The customers are waiting. Launch your parcels and aim for the moving planet."
  },
  dash: {
    name: "Color Dash",
    description: "Switch lanes to match the gates. The speed keeps climbing. So does the panic.",
    category: "action",
    categoryLabel: "ACTION",
    emoji: "🏁",
    art: "art-dash",
    sticker: "ZOOM",
    tag: "SPEED & SWITCH",
    color: "#65dfff",
    controls: "Press 1, 2, or 3 to change colors. On mobile, tap a lane.",
    instructions: "Match your color with each incoming gate. Wrong color means game over.",
    overlay: "MATCH IT OR<br>GET WRECKED.",
    overlayDescription: "Switch to the correct lane before each gate reaches you. It gets faster."
  },
  memory: {
    name: "Brain Freeze",
    description: "Memorize the ridiculous sequence and repeat it correctly. Don't let the brain goblin win.",
    category: "brain",
    categoryLabel: "BRAIN STUFF",
    emoji: "🧠",
    art: "art-memory",
    sticker: "THINK FAST",
    tag: "MEMORY CHALLENGE",
    color: "#ffdf68",
    controls: "Watch the tiles light up. Then click or tap them in the same order.",
    instructions: "Repeat increasingly long sequences. One wrong tile ends your run.",
    overlay: "YOUR BRAIN<br>IS ON THE CLOCK.",
    overlayDescription: "Watch the sequence carefully. Then repeat it from memory. Easy, right?"
  }
};

const QUESTS = [
  {
    id: "play",
    emoji: "🎮",
    title: "Touch grass? Never.",
    description: "Finish three game sessions",
    goal: 3,
    reward: 30
  },
  {
    id: "coins",
    emoji: "🪙",
    title: "Pocket change",
    description: "Collect ten coins in games",
    goal: 10,
    reward: 25
  },
  {
    id: "variety",
    emoji: "🧭",
    title: "Can't pick one",
    description: "Try three different games",
    goal: 3,
    reward: 40
  }
];

const BADGES = [
  { id: "first", emoji: "🎮", name: "First game", condition: s => s.gamesPlayed >= 1 },
  { id: "coins", emoji: "🪙", name: "Coin goblin", condition: s => s.coins >= 25 },
  { id: "explorer", emoji: "🌈", name: "Explorer", condition: s => s.seenGames.length >= 4 },
  { id: "winner", emoji: "🏆", name: "Winner", condition: s => Object.values(s.wins).some(v => v > 0) },
  { id: "dedicated", emoji: "🔥", name: "On a roll", condition: s => s.gamesPlayed >= 10 },
  { id: "memory", emoji: "🧠", name: "Big brain", condition: s => (s.best.memory || 0) >= 5 }
];

const AVATARS = ["👾", "🐸", "👽", "🦆", "😎"];
const SAVE_KEY = "aliaBloxSaveV2";

function freshState() {
  return {
    name: "Player",
    avatar: "👾",
    coins: 0,
    xp: 0,
    gamesPlayed: 0,
    best: {},
    wins: {},
    questProgress: { play: 0, coins: 0, variety: 0 },
    claimed: {},
    seenGames: [],
    achievements: [],
    dailyKey: new Date().toDateString()
  };
}

function loadState() {
  const base = freshState();

  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return base;

    const stored = JSON.parse(raw);
    if (!stored || typeof stored !== "object") return base;

    const result = { ...base, ...stored };
    result.best = stored.best && typeof stored.best === "object" ? stored.best : {};
    result.wins = stored.wins && typeof stored.wins === "object" ? stored.wins : {};
    result.claimed = stored.claimed && typeof stored.claimed === "object" ? stored.claimed : {};
    result.questProgress = {
      ...base.questProgress,
      ...(stored.questProgress && typeof stored.questProgress === "object" ? stored.questProgress : {})
    };
    result.seenGames = Array.isArray(stored.seenGames) ? stored.seenGames.filter(id => GAME_DATA[id]) : [];
    result.achievements = Array.isArray(stored.achievements) ? stored.achievements : [];
    result.coins = Math.max(0, Number(result.coins) || 0);
    result.xp = Math.max(0, Number(result.xp) || 0);
    result.gamesPlayed = Math.max(0, Number(result.gamesPlayed) || 0);
    result.name = typeof result.name === "string" ? result.name.slice(0, 18) : "Player";
    result.avatar = AVATARS.includes(result.avatar) ? result.avatar : "👾";

    if (result.dailyKey !== new Date().toDateString()) {
      result.dailyKey = new Date().toDateString();
      result.questProgress = { play: 0, coins: 0, variety: result.seenGames.length };
      result.claimed = {};
    }

    return result;
  } catch {
    return base;
  }
}

let state = loadState();
let currentPage = "home";
let currentGame = "lava";
let session = null;
let animationFrame = 0;
let toastTimer = 0;
let keys = {};
let pointerHeld = false;

function saveState() {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(state));
  } catch {
    notify("Progress couldn't be saved in this browser.");
  }
}

function levelFromXP(xp) {
  return Math.floor(Math.max(0, xp) / 100) + 1;
}

function levelProgress(xp) {
  return Math.max(0, xp) % 100;
}

function notify(message) {
  const toast = $("toast");
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("show"), 2400);
}

function showPage(page) {
  if (!$(page)) return;

  stopLoop();
  currentPage = page;

  document.querySelectorAll(".page").forEach(section => {
    section.classList.toggle("active", section.id === page);
  });

  document.querySelectorAll(".navbtn").forEach(button => {
    button.classList.toggle("active", button.dataset.page === page);
  });

  if (page === "home") renderHome();
  if (page === "library") renderLibrary();
  if (page === "quests") renderQuests();
  if (page === "profile") renderProfile();
  if (page === "play") renderGameScreen();

  window.scrollTo({ top: 0, behavior: "smooth" });
}

function renderTop() {
  $("topName").textContent = state.name;
  $("topAvatar").textContent = state.avatar;
  $("topCoins").textContent = state.coins;
  $("sidePlayerName").textContent = state.name;
  $("sidePlayerLevel").textContent = levelFromXP(state.xp);
  $("sideXPBar").style.width = levelProgress(state.xp) + "%";
}

function renderCard(id) {
  const game = GAME_DATA[id];
  const card = document.createElement("article");
  card.className = "game-card";

  const best = Number(state.best[id]) || 0;

  const art = document.createElement("div");
  art.className = "game-art " + game.art;

  const stickerTop = document.createElement("span");
  stickerTop.className = "sticker sticker-top";
  stickerTop.textContent = game.sticker;

  const emoji = document.createElement("span");
  emoji.className = "game-emoji";
  emoji.textContent = game.emoji;

  const stickerBottom = document.createElement("span");
  stickerBottom.className = "sticker sticker-bottom";
  stickerBottom.textContent = game.tag;

  art.append(stickerTop, emoji, stickerBottom);

  const info = document.createElement("div");
  info.className = "game-info";

  const title = document.createElement("h3");
  title.textContent = game.name;

  const description = document.createElement("p");
  description.textContent = game.description;

  const bottom = document.createElement("div");
  bottom.className = "card-bottom";

  const tag = document.createElement("span");
  tag.className = "tag";
  tag.textContent = best ? "BEST " + best : game.categoryLabel;

  const playButton = document.createElement("button");
  playButton.className = "play-btn";
  playButton.dataset.play = id;
  playButton.textContent = "PLAY ↗";

  bottom.append(tag, playButton);
  info.append(title, description, bottom);
  card.append(art, info);

  return card;
}

function renderCards(container, filter = "all", search = "") {
  container.replaceChildren();

  const query = search.trim().toLowerCase();

  const ids = Object.keys(GAME_DATA).filter(id => {
    const game = GAME_DATA[id];
    const matchesFilter = filter === "all" || game.category === filter;
    const matchesSearch = !query ||
      game.name.toLowerCase().includes(query) ||
      game.description.toLowerCase().includes(query) ||
      game.categoryLabel.toLowerCase().includes(query);

    return matchesFilter && matchesSearch;
  });

  ids.forEach(id => container.appendChild(renderCard(id)));
  return ids.length;
}

function renderHome() {
  renderTop();
  renderCards($("homeGames"));
  renderQuestRows($("homeQuests"));
  renderBadges($("homeBadges"));
}

let activeFilter = "all";

function renderLibrary() {
  const count = renderCards($("libraryGames"), activeFilter, $("gameSearch").value);
  $("emptyGames").classList.toggle("hidden", count !== 0);
}

function renderBadges(container) {
  container.replaceChildren();

  BADGES.forEach(badge => {
    const unlocked = badge.condition(state);
    const item = document.createElement("div");
    item.className = "badge-item" + (unlocked ? "" : " locked");

    const icon = document.createElement("span");
    icon.className = "badge-icon";
    icon.textContent = unlocked ? badge.emoji : "🔒";

    const name = document.createElement("span");
    name.textContent = badge.name;

    item.append(icon, name);
    container.appendChild(item);
  });
}

function renderQuestRows(container) {
  container.replaceChildren();

  QUESTS.forEach(quest => {
    const progress = Math.min(quest.goal, Number(state.questProgress[quest.id]) || 0);
    const claimed = Boolean(state.claimed[quest.id]);

    const row = document.createElement("div");
    row.className = "quest";

    const icon = document.createElement("div");
    icon.className = "quest-icon";
    icon.textContent = quest.emoji;

    const copy = document.createElement("div");
    copy.className = "quest-copy";

    const title = document.createElement("strong");
    title.textContent = quest.title;

    const description = document.createElement("small");
    description.textContent = quest.description + " · " + quest.reward + " coins";

    const progressBar = document.createElement("div");
    progressBar.className = "progress";

    const fill = document.createElement("div");
    fill.style.width = (progress / quest.goal * 100) + "%";

    progressBar.appendChild(fill);
    copy.append(title, description, progressBar);

    const button = document.createElement("button");
    button.className = "claim-btn" + (progress >= quest.goal && !claimed ? " ready" : "");
    button.dataset.claim = quest.id;
    button.disabled = claimed || progress < quest.goal;
    button.textContent = claimed ? "CLAIMED" : progress >= quest.goal ? "CLAIM" : progress + "/" + quest.goal;

    row.append(icon, copy, button);
    container.appendChild(row);
  });
}

function renderQuests() {
  renderQuestRows($("questList"));

  const completed = QUESTS.filter(quest => state.claimed[quest.id]).length;
  $("questCount").textContent = completed + " / " + QUESTS.length + " complete";
}

function renderProfile() {
  renderTop();

  $("profileAvatar").textContent = state.avatar;
  $("profileName").textContent = state.name;
  $("profileLevel").textContent = "LEVEL " + levelFromXP(state.xp) + " CHAOS AGENT";
  $("nameInput").value = state.name === "Player" ? "" : state.name;

  $("statCoins").textContent = state.coins;
  $("statGames").textContent = state.gamesPlayed;
  $("statBest").textContent = Math.max(0, ...Object.values(state.best).map(Number));
  $("statLevel").textContent = levelFromXP(state.xp);

  $("profileXPBar").style.width = levelProgress(state.xp) + "%";
  $("profileXPText").textContent =
    levelProgress(state.xp) + " / 100 XP until level " + (levelFromXP(state.xp) + 1);

  document.querySelectorAll(".avatar-choice").forEach(button => {
    button.classList.toggle("selected", button.dataset.avatar === state.avatar);
  });

  renderBadges($("profileBadges"));
}

function renderGameScreen() {
  const game = GAME_DATA[currentGame];

  $("playCategory").textContent = game.categoryLabel;
  $("playingTitle").textContent = game.name;
  $("playingSubtitle").textContent = game.description;
  $("gameName").textContent = game.name;
  $("controlHelp").textContent = game.controls;
  $("howTitle").textContent = "THE RULES";
  $("howText").textContent = game.instructions;
  $("gameBest").textContent = state.best[currentGame] || 0;
  $("gameScore").textContent = "0";
  $("gameCoins").textContent = "0";
  $("currentScore").textContent = "0";
  $("runCoins").textContent = "0 ✦";
  $("startButton").textContent = "LET'S GO ↗";

  $("overlayKicker").textContent = "READY, TROUBLEMAKER?";
  $("overlayTitle").innerHTML = game.overlay;
  $("overlayDescription").textContent = game.overlayDescription;
  $("overlayControls").textContent = game.controls.toUpperCase();

  $("canvasOverlay").classList.remove("hidden");
  $("gameMessage").textContent = "Ready? Let's cause a little trouble.";

  const switcher = $("gameSwitcher");
  switcher.replaceChildren();

  Object.entries(GAME_DATA).forEach(([id, item]) => {
    const button = document.createElement("button");
    button.className = "switch-btn" + (id === currentGame ? " active" : "");
    button.textContent = item.emoji + " " + item.name;
    button.dataset.switchGame = id;
    switcher.appendChild(button);
  });

  drawTitleScreen();
  renderTop();
}

function drawTitleScreen() {
  const canvas = $("stage");
  const ctx = canvas.getContext("2d");
  const game = GAME_DATA[currentGame];

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = game.color;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  drawDots(ctx, canvas.width, canvas.height, "#ffffff55", 38);

  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = "#252044";
  ctx.font = "90px sans-serif";
  ctx.fillText(game.emoji, canvas.width / 2, 190);

  ctx.font = "bold 32px Fredoka, sans-serif";
  ctx.fillText(game.name.toUpperCase(), canvas.width / 2, 275);

  ctx.font = "bold 16px Nunito, sans-serif";
  ctx.fillText("PRESS LET'S GO TO START", canvas.width / 2, 325);
}

function launchGame(id) {
  if (!GAME_DATA[id]) return;

  stopLoop();
  currentGame = id;

  if (!state.seenGames.includes(id)) {
    state.seenGames.push(id);
    state.questProgress.variety = Math.min(QUESTS[2].goal, state.seenGames.length);
  }

  saveState();
  showPage("play");
  renderGameScreen();
}

function leaveGame() {
  stopLoop();
  showPage("library");
}

function setMessage(message) {
  $("gameMessage").textContent = message;
}

function setHUD(score, coins) {
  const safeScore = Math.max(0, Math.floor(score));
  $("gameScore").textContent = safeScore;
  $("gameCoins").textContent = coins;
  $("currentScore").textContent = safeScore;
  $("runCoins").textContent = coins + " ✦";
  $("gameBest").textContent = state.best[currentGame] || 0;
}

function stopLoop() {
  if (animationFrame) cancelAnimationFrame(animationFrame);
  animationFrame = 0;
  session = null;
  keys = {};
  pointerHeld = false;
}

function startSession() {
  stopLoop();

  const canvas = $("stage");
  const ctx = canvas.getContext("2d");

  const s = {
    id: currentGame,
    running: true,
    over: false,
    score: 0,
    coins: 0,
    time: 0,
    last: performance.now(),
    canvas,
    ctx,
    W: canvas.width,
    H: canvas.height
  };

  session = s;

  if (s.id === "lava") setupLava(s);
  if (s.id === "snack") setupSnack(s);
  if (s.id === "button") setupButton(s);
  if (s.id === "astro") setupAstro(s);
  if (s.id === "dash") setupDash(s);
  if (s.id === "memory") setupMemory(s);

  $("canvasOverlay").classList.add("hidden");
  $("startButton").textContent = "RESTART";
  $("gameMessage").textContent = "GO GO GO!";
  setHUD(0, 0);

  animationFrame = requestAnimationFrame(frame);
}

function finishGame(message, won = false) {
  if (!session || session.over) return;

  const s = session;
  s.over = true;
  s.running = false;

  const id = s.id;
  const score = Math.max(0, Math.floor(s.score));
  const oldLevel = levelFromXP(state.xp);

  state.gamesPlayed++;
  state.xp += Math.max(10, score);
  state.coins += s.coins;

  state.questProgress.play = Math.min(QUESTS[0].goal, state.questProgress.play + 1);
  state.questProgress.coins = Math.min(QUESTS[1].goal, state.questProgress.coins + s.coins);

  state.best[id] = Math.max(Number(state.best[id]) || 0, score);

  if (won) {
    state.wins[id] = (state.wins[id] || 0) + 1;
  }

  updateAchievements();
  saveState();

  renderTop();
  renderHomeQuests();
  renderQuests();
  renderBadges($("homeBadges"));
  setHUD(score, s.coins);

  $("startButton").textContent = "PLAY AGAIN";
  $("canvasOverlay").classList.remove("hidden");
  $("overlayKicker").textContent = won ? "ABSOLUTE LEGEND" : "WELL, THAT HAPPENED";
  $("overlayTitle").innerHTML = won ? "YOU DID<br>THE THING." : "ONE MORE<br>GO?";
  $("overlayDescription").textContent =
    message + " Final score: " + score + ". You earned " + s.coins + " coins.";
  $("overlayControls").textContent = "YOUR PROGRESS HAS BEEN SAVED ON THIS DEVICE.";

  setMessage(message + " Final score: " + score + ". Press PLAY AGAIN to retry.");

  const newLevel = levelFromXP(state.xp);

  if (newLevel > oldLevel) {
    notify("LEVEL UP! You're now level " + newLevel + "!");
  } else {
    notify(won ? "YOU DID IT! +" + s.coins + " coins" : "Run finished. +" + s.coins + " coins");
  }
}

function updateAchievements() {
  BADGES.forEach(badge => {
    if (badge.condition(state) && !state.achievements.includes(badge.id)) {
      state.achievements.push(badge.id);
    }
  });
}

function addCoin(s, amount = 1) {
  s.coins += amount;
  s.score += amount * 5;
}

/* FLOOR IS LAVA */

function setupLava(s) {
  s.player = { x: 100, y: 350, w: 35, h: 42, vx: 0, vy: 0, grounded: false, jumpCount: 0 };
  s.platforms = [
    { x: 0, y: 430, w: 200, h: 70 },
    { x: 245, y: 370, w: 125, h: 18 },
    { x: 425, y: 315, w: 120, h: 18 },
    { x: 590, y: 360, w: 130, h: 18 },
    { x: 770, y: 290, w: 130, h: 18 }
  ];
  s.obstacles = [];
  s.spawnTimer = 1.3;
  s.lava = 480;
  s.worldSpeed = 115;
  s.invulnerable = 0;
}

function updateLava(s, dt) {
  const { ctx, W, H } = s;
  const p = s.player;

  s.score += dt * 2;
  s.lava -= dt * 4.2;
  s.invulnerable = Math.max(0, s.invulnerable - dt);

  const move = (keys.ArrowRight || keys.d || keys.D ? 1 : 0) -
    (keys.ArrowLeft || keys.a || keys.A ? 1 : 0);

  p.vx = move * 275;
  p.x += p.vx * dt;
  p.x = Math.max(0, Math.min(W - p.w, p.x));

  const oldBottom = p.y + p.h;
  p.vy += 1050 * dt;
  p.y += p.vy * dt;
  p.grounded = false;

  for (const platform of s.platforms) {
    const newBottom = p.y + p.h;

    if (
      p.vy >= 0 &&
      p.x + p.w > platform.x &&
      p.x < platform.x + platform.w &&
      oldBottom <= platform.y &&
      newBottom >= platform.y
    ) {
      p.y = platform.y - p.h;
      p.vy = 0;
      p.grounded = true;
      p.jumpCount = 0;
    }
  }

  s.platforms.forEach(platform => {
    platform.x -= s.worldSpeed * dt;
  });

  s.platforms = s.platforms.filter(platform => platform.x + platform.w > -10);

  s.spawnTimer -= dt;

  if (s.spawnTimer <= 0) {
    s.spawnTimer = .9 + Math.random() * .55;
    const y = 270 + Math.random() * 115;
    const x = W + 15;
    s.platforms.push({ x, y, w: 110 + Math.random() * 55, h: 18 });

    if (Math.random() < .3) {
      s.obstacles.push({ x: x + 40, y: y - 27, w: 24, h: 27 });
    }
  }

  s.obstacles.forEach(obstacle => {
    obstacle.x -= s.worldSpeed * dt;
  });

  s.obstacles = s.obstacles.filter(obstacle => obstacle.x + obstacle.w > 0);

  for (const obstacle of s.obstacles) {
    const colliding =
      p.x < obstacle.x + obstacle.w &&
      p.x + p.w > obstacle.x &&
      p.y < obstacle.y + obstacle.h &&
      p.y + p.h > obstacle.y;

    if (colliding && s.invulnerable <= 0) {
      s.invulnerable = 1;
      p.vy = -300;
      s.score = Math.max(0, s.score - 10);
    }
  }

  if (p.y + p.h >= s.lava || p.y > H + 80) {
    finishGame("The lava won this round.", false);
  }

  drawLava(s);
}

function drawLava(s) {
  const { ctx, W, H } = s;

  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = "#ffd5a0";
  ctx.fillRect(0, 0, W, H);
  drawDots(ctx, W, H, "#ffffff55", 40);

  ctx.fillStyle = "#ff704d";
  ctx.fillRect(0, s.lava, W, H - s.lava);

  ctx.fillStyle = "#ffb84e";

  for (let x = -20; x < W + 20; x += 55) {
    const wave = Math.sin(s.time * 4 + x) * 8;
    ctx.beginPath();
    ctx.ellipse(x, s.lava + wave, 32, 10, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  s.platforms.forEach(platform => {
    ctx.fillStyle = "#8151a8";
    roundRect(ctx, platform.x, platform.y, platform.w, platform.h, 7);
    ctx.fill();

    ctx.fillStyle = "#d9a2ff";
    roundRect(ctx, platform.x, platform.y, platform.w, 6, 4);
    ctx.fill();
  });

  s.obstacles.forEach(obstacle => {
    ctx.fillStyle = "#ff3d77";
    ctx.beginPath();
    ctx.moveTo(obstacle.x, obstacle.y + obstacle.h);
    ctx.lineTo(obstacle.x + obstacle.w / 2, obstacle.y);
    ctx.lineTo(obstacle.x + obstacle.w, obstacle.y + obstacle.h);
    ctx.closePath();
    ctx.fill();
  });

  drawCharacter(ctx, s.player.x, s.player.y, s.player.w, s.player.h, "#6e51c8", "👾");

  ctx.fillStyle = "#252044";
  ctx.font = "bold 17px Nunito";
  ctx.textAlign = "left";
  ctx.fillText("SURVIVE THE MELTDOWN", 18, 27);
}

function jumpLava() {
  if (!session || session.id !== "lava" || session.over) return;

  const player = session.player;

  if (player.jumpCount < 2) {
    player.vy = -445;
    player.jumpCount++;
    player.grounded = false;
  }
}

/* SNACK SNATCHER */

function setupSnack(s) {
  s.gridW = 18;
  s.gridH = 10;
  s.player = { x: 1, y: 1 };
  s.snacks = [];
  s.walls = new Set();
  s.enemies = [
    { x: 16, y: 8, cooldown: .7 },
    { x: 15, y: 1, cooldown: 1.1 }
  ];
  s.lives = 3;
  s.moveTimer = 0;
  s.snackEmoji = ["🍟", "🍕", "🍩", "🍪", "🍔", "🧁"];

  for (let y = 0; y < s.gridH; y++) {
    for (let x = 0; x < s.gridW; x++) {
      if (x === 0 || y === 0 || x === s.gridW - 1 || y === s.gridH - 1) {
        s.walls.add(x + "," + y);
      }
    }
  }

  /* Place a small number of interior walls without blocking the corridors. */
  for (let y = 2; y < s.gridH - 1; y += 2) {
    for (let x = 3; x < s.gridW - 2; x += 4) {
      if ((x === 3 && y === 2) || (x === 15 && y === 8)) continue;
      s.walls.add(x + "," + y);
    }
  }

  for (let i = 0; i < 24; i++) {
    let x, y, attempts = 0;

    do {
      x = 1 + Math.floor(Math.random() * (s.gridW - 2));
      y = 1 + Math.floor(Math.random() * (s.gridH - 2));
      attempts++;
    } while (
      (
        s.walls.has(x + "," + y) ||
        (x === 1 && y === 1) ||
        s.enemies.some(enemy => enemy.x === x && enemy.y === y) ||
        s.snacks.some(snack => snack.x === x && snack.y === y)
      ) &&
      attempts < 500
    );

    if (attempts < 500) {
      s.snacks.push({
        x, y,
        emoji: s.snackEmoji[Math.floor(Math.random() * s.snackEmoji.length)]
      });
    }
  }
}

function updateSnack(s, dt) {
  s.moveTimer -= dt;

  const player = s.player;

  if (s.moveTimer <= 0) {
    let dx = 0;
    let dy = 0;

    if (keys.ArrowLeft || keys.a || keys.A) dx = -1;
    else if (keys.ArrowRight || keys.d || keys.D) dx = 1;
    else if (keys.ArrowUp || keys.w || keys.W) dy = -1;
    else if (keys.ArrowDown || keys.s || keys.S) dy = 1;

    if (dx || dy) {
      s.moveTimer = .13;

      const nx = player.x + dx;
      const ny = player.y + dy;

      if (!s.walls.has(nx + "," + ny)) {
        player.x = nx;
        player.y = ny;
      }

      const index = s.snacks.findIndex(snack => snack.x === player.x && snack.y === player.y);

      if (index !== -1) {
        s.snacks.splice(index, 1);
        addCoin(s, 1);

        if (s.snacks.length === 0) {
          s.score += 100;
          finishGame("You cleaned out the kitchen!", true);
          return;
        }
      }
    }
  }

  for (const enemy of s.enemies) {
    enemy.cooldown -= dt;

    if (enemy.cooldown <= 0) {
      enemy.cooldown = .42 + Math.random() * .18;

      const dx = Math.sign(player.x - enemy.x);
      const dy = Math.sign(player.y - enemy.y);
      const choices = Math.random() < .5 ? [[dx, 0], [0, dy]] : [[0, dy], [dx, 0]];

      for (const [mx, my] of choices) {
        if (!mx && !my) continue;

        const nx = enemy.x + mx;
        const ny = enemy.y + my;

        if (!s.walls.has(nx + "," + ny)) {
          enemy.x = nx;
          enemy.y = ny;
          break;
        }
      }
    }

    if (enemy.x === player.x && enemy.y === player.y) {
      s.lives--;
      enemy.x = enemy.x < 9 ? 16 : 1;
      enemy.y = enemy.y < 5 ? 8 : 1;
      player.x = 1;
      player.y = 1;

      setMessage("BONK! Lives left: " + s.lives + ". Keep grabbing snacks!");

      if (s.lives <= 0) {
        finishGame("The snack monsters got you.", false);
        return;
      }
    }
  }

  s.score += dt * .5;
  drawSnack(s);
}

function drawSnack(s) {
  const { ctx, W, H } = s;
  const cw = W / s.gridW;
  const ch = H / s.gridH;

  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = "#d5ffd9";
  ctx.fillRect(0, 0, W, H);

  s.walls.forEach(wall => {
    const [x, y] = wall.split(",").map(Number);

    ctx.fillStyle = "#5acb82";
    roundRect(ctx, x * cw + 2, y * ch + 2, cw - 4, ch - 4, 6);
    ctx.fill();

    ctx.fillStyle = "#a2f0ae";
    roundRect(ctx, x * cw + 5, y * ch + 4, cw - 10, 5, 3);
    ctx.fill();
  });

  s.snacks.forEach(snack => {
    ctx.font = "24px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(snack.emoji, (snack.x + .5) * cw, (snack.y + .5) * ch);
  });

  s.enemies.forEach(enemy => {
    drawCharacter(ctx, enemy.x * cw + 4, enemy.y * ch + 3, cw - 8, ch - 6, "#ff5b91", "👹");
  });

  drawCharacter(ctx, s.player.x * cw + 4, s.player.y * ch + 3, cw - 8, ch - 6, "#6550c8", "😎");

  ctx.fillStyle = "#252044";
  ctx.font = "bold 15px Nunito";
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
  ctx.fillText("SNACKS LEFT: " + s.snacks.length + "     LIVES: " + "♥".repeat(s.lives), 12, 23);
}

/* DON'T PRESS THAT */

function setupButton(s) {
  s.round = 0;
  s.maxRounds = 8;
  s.timer = 0;
  s.phase = "ready";
  s.rule = "";
  s.roundScore = 0;
  s.streak = 0;
  s.buttons = [];
  s.options = [];
  beginButtonRound(s);
}

function beginButtonRound(s) {
  s.round++;

  if (s.round > s.maxRounds) {
    s.score += s.roundScore;
    finishGame("You survived all eight suspicious decisions!", true);
    return;
  }

  const rules = [
    { text: "PRESS THE RED BUTTON", good: "🔴", options: ["🔴", "🔵", "🟡"] },
    { text: "AVOID THE GREEN BUTTON", good: "🟣", options: ["🟢", "🟣", "🟠"] },
    { text: "PICK THE BIGGEST NUMBER", good: "12", options: ["4", "9", "12"] },
    { text: "PICK THE ODD ONE OUT", good: "🍕", options: ["🐸", "🍕", "🐸"] },
    { text: "PICK THE ONLY FRUIT", good: "🍉", options: ["🥨", "🧀", "🍉"] },
    { text: "PRESS THE BLUE BUTTON", good: "🔵", options: ["🟡", "🔴", "🔵"] },
    { text: "PICK THE ANGRY FACE", good: "😡", options: ["😡", "😴", "🥳"] },
    { text: "PICK THE THING THAT FLOATS", good: "🪶", options: ["🪨", "🪶", "🧱"] }
  ];

  const item = rules[Math.floor(Math.random() * rules.length)];

  s.rule = item.text;
  s.options = item.options.map(label => ({ label, good: label === item.good }));

  for (let i = s.options.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [s.options[i], s.options[j]] = [s.options[j], s.options[i]];
  }

  s.phase = "playing";
  s.timer = Math.max(1.7, 4.2 - s.round * .25);
  s.buttons = [];

  drawButton(s);
  setMessage("ROUND " + s.round + " OF " + s.maxRounds + " · Follow the rule. Don't overthink it.");
}

function updateButton(s, dt) {
  if (s.phase === "playing") {
    s.timer -= dt;

    if (s.timer <= 0) {
      s.streak = 0;
      s.phase = "result";
      s.resultGood = false;
      s.resultText = "TOO SLOW!";
      setMessage("TOO SLOW! The button has won this round.");
      s.timer = 1;
    }
  } else if (s.phase === "result") {
    s.timer -= dt;

    if (s.timer <= 0) {
      beginButtonRound(s);
      if (!s.over) return;
    }
  }

  drawButton(s);
}

function drawButton(s) {
  const { ctx, W, H } = s;

  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = "#ffc0d9";
  ctx.fillRect(0, 0, W, H);
  drawDots(ctx, W, H, "#ffffff66", 40);

  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = "#252044";
  ctx.font = "bold 16px Nunito";
  ctx.fillText("ROUND " + Math.min(s.round, s.maxRounds) + " / " + s.maxRounds, W / 2, 45);

  ctx.font = "bold 25px Fredoka";
  ctx.fillText(s.rule, W / 2, 100);

  const width = 165;
  const height = 145;
  const gap = 22;
  const startX = (W - (width * 3 + gap * 2)) / 2;

  s.buttons = [];

  s.options.forEach((option, index) => {
    const x = startX + index * (width + gap);
    const y = 160;

    s.buttons.push({ x, y, w: width, h: height, good: option.good });

    ctx.fillStyle = ["#ffdc56", "#8be8a1", "#64d9ff"][index];
    roundRect(ctx, x, y, width, height, 20);
    ctx.fill();

    ctx.lineWidth = 4;
    ctx.strokeStyle = "#252044";
    roundRect(ctx, x, y, width, height, 20);
    ctx.stroke();

    ctx.fillStyle = "#252044";
    ctx.font = "bold 46px Fredoka";
    ctx.fillText(option.label, x + width / 2, y + height / 2);
  });

  if (s.phase === "playing") {
    ctx.fillStyle = "#ffffff";
    roundRect(ctx, W / 2 - 160, 345, 320, 18, 9);
    ctx.fill();

    ctx.fillStyle = "#ff5b91";
    roundRect(ctx, W / 2 - 160, 345, 320 * Math.max(0, s.timer / 4.2), 18, 9);
    ctx.fill();

    ctx.fillStyle = "#252044";
    ctx.font = "bold 15px Nunito";
    ctx.fillText("STREAK: " + s.streak + "     POINTS: " + s.roundScore, W / 2, 410);
  } else if (s.phase === "result") {
    ctx.fillStyle = "#252044";
    ctx.font = "bold 28px Fredoka";
    ctx.fillText(s.resultText || "OOPS!", W / 2, 410);
  }
}

function buttonChoice(s, x, y) {
  if (!s || s.id !== "button" || s.over || s.phase !== "playing") return;

  const button = s.buttons.find(item =>
    x >= item.x && x <= item.x + item.w &&
    y >= item.y && y <= item.y + item.h
  );

  if (!button) return;

  s.phase = "result";
  s.timer = .8;

  if (button.good) {
    s.streak++;
    s.roundScore += 15 + s.streak * 2;
    addCoin(s, 1);
    s.resultGood = true;
    s.resultText = "NICE ONE!";
    setMessage("CORRECT! Your brain is functioning. Barely.");
  } else {
    s.streak = 0;
    s.roundScore = Math.max(0, s.roundScore - 5);
    s.resultGood = false;
    s.resultText = "WRONG BUTTON!";
    setMessage("Wrong button. That was impressively incorrect.");
  }
}

/* ALIEN DELIVERY */

function setupAstro(s) {
  s.target = { x: 720, y: 190, r: 34 };
  s.parcels = [];
  s.deliveries = 0;
  s.deliveryLimit = 6;
  s.targetMove = 0;
  s.stars = Array.from({ length: 50 }, () => ({
    x: Math.random() * s.W,
    y: Math.random() * s.H,
    r: Math.random() * 2 + 1
  }));
}

function updateAstro(s, dt) {
  s.targetMove += dt;
  s.target.y = 190 + Math.sin(s.targetMove * 1.5) * 90;

  s.parcels.forEach(parcel => {
    parcel.vy += 440 * dt;
    parcel.x += parcel.vx * dt;
    parcel.y += parcel.vy * dt;

    if (parcel.x > s.W + 30 || parcel.y > s.H + 30 || parcel.y < -30) {
      parcel.dead = true;
    }

    const dx = parcel.x - s.target.x;
    const dy = parcel.y - s.target.y;

    if (!parcel.dead && Math.hypot(dx, dy) < s.target.r + 10) {
      parcel.dead = true;
      s.deliveries++;
      addCoin(s, 2);
      s.score += 25;

      if (s.deliveries >= s.deliveryLimit) {
        finishGame("All parcels delivered. Intergalactic employee of the month!", true);
        return;
      }

      setMessage("DELIVERY COMPLETE! " + (s.deliveryLimit - s.deliveries) + " parcels left.");
    }
  });

  s.parcels = s.parcels.filter(parcel => !parcel.dead);
  drawAstro(s);
}

function drawAstro(s) {
  const { ctx, W, H } = s;

  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = "#29234f";
  ctx.fillRect(0, 0, W, H);

  s.stars.forEach(star => {
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.arc(star.x, star.y, star.r, 0, Math.PI * 2);
    ctx.fill();
  });

  ctx.fillStyle = "#9c7bff";
  ctx.beginPath();
  ctx.arc(s.target.x, s.target.y, s.target.r + 12, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#ffdc56";
  ctx.beginPath();
  ctx.arc(s.target.x, s.target.y, s.target.r, 0, Math.PI * 2);
  ctx.fill();

  ctx.font = "39px sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("🪐", s.target.x, s.target.y);

  ctx.fillStyle = "#ff5b91";
  roundRect(ctx, 43, 325, 105, 105, 24);
  ctx.fill();

  ctx.font = "51px sans-serif";
  ctx.fillText("👽", 95, 377);

  ctx.strokeStyle = "#ffffff66";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(95, 377);
  ctx.lineTo(s.target.x, s.target.y);
  ctx.stroke();

  s.parcels.forEach(parcel => {
    ctx.fillStyle = "#ff985a";
    roundRect(ctx, parcel.x - 12, parcel.y - 12, 24, 24, 5);
    ctx.fill();
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 2;
    ctx.strokeRect(parcel.x - 12, parcel.y - 12, 24, 24);
  });

  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 16px Nunito";
  ctx.textAlign = "left";
  ctx.fillText("DELIVERIES: " + s.deliveries + " / " + s.deliveryLimit, 18, 28);
}

function astroLaunch(s, x, y) {
  if (!s || s.id !== "astro" || s.over) return;

  const dx = x - 95;
  const dy = y - 377;
  const length = Math.max(1, Math.hypot(dx, dy));
  const speed = Math.min(620, Math.max(250, length * 1.1));

  s.parcels.push({
    x: 105,
    y: 375,
    vx: dx / length * speed,
    vy: dy / length * speed,
    dead: false
  });
}

/* COLOR DASH */

function setupDash(s) {
  s.lane = 1;
  s.speed = 290;
  s.gates = [];
  s.colors = ["#ff5b91", "#6550c8", "#ffdc56"];
  s.colorNames = ["PINK", "PURPLE", "YELLOW"];
  s.gatesPassed = 0;

  for (let i = 0; i < 4; i++) {
    s.gates.push({
      x: s.W + 80 + i * 240,
      lane: Math.floor(Math.random() * 3),
      passed: false
    });
  }
}

function updateDash(s, dt) {
  s.score += dt * 3;
  s.speed = Math.min(550, 290 + s.score * 2);

  s.gates.forEach(gate => {
    gate.x -= s.speed * dt;

    if (!gate.passed && gate.x < 130) {
      gate.passed = true;

      if (gate.lane === s.lane) {
        s.gatesPassed++;
        addCoin(s, 1);
        s.score += 10;
      } else {
        finishGame("Wrong color! Your color-matching career is over.", false);
      }
    }
  });

  if (s.over) return;

  s.gates = s.gates.filter(gate => gate.x > -60);

  while (s.gates.length < 4) {
    const lastX = Math.max(s.W, ...s.gates.map(gate => gate.x));
    s.gates.push({
      x: lastX + 210 + Math.random() * 80,
      lane: Math.floor(Math.random() * 3),
      passed: false
    });
  }

  drawDash(s);
}

function drawDash(s) {
  const { ctx, W, H } = s;

  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = "#b5f0ff";
  ctx.fillRect(0, 0, W, H);

  for (let i = 0; i < 9; i++) {
    ctx.fillStyle = i % 2 ? "#ffffff77" : "#64d9ff55";
    ctx.beginPath();
    ctx.arc((i * 127 - s.time * 45 % W + W) % W, 70 + (i * 53) % 340, 18, 0, Math.PI * 2);
    ctx.fill();
  }

  for (let i = 0; i < 3; i++) {
    const y = 130 + i * 105;

    ctx.fillStyle = "#ffffff99";
    roundRect(ctx, 35, y, W - 70, 72, 18);
    ctx.fill();

    ctx.fillStyle = s.colors[i];
    roundRect(ctx, 45, y + 8, W - 90, 56, 13);
    ctx.fill();

    ctx.fillStyle = "#ffffff33";
    ctx.fillRect(50, y + 12, W - 100, 8);
  }

  s.gates.forEach(gate => {
    const y = 130 + gate.lane * 105;

    ctx.fillStyle = "#252044";
    roundRect(ctx, gate.x, y, 42, 72, 12);
    ctx.fill();

    ctx.fillStyle = s.colors[gate.lane];
    roundRect(ctx, gate.x + 7, y + 7, 28, 58, 7);
    ctx.fill();
  });

  const playerY = 130 + s.lane * 105 + 36;

  ctx.fillStyle = "#252044";
  roundRect(ctx, 100, playerY - 25, 55, 50, 14);
  ctx.fill();

  ctx.fillStyle = s.colors[s.lane];
  roundRect(ctx, 106, playerY - 19, 43, 38, 10);
  ctx.fill();

  ctx.fillStyle = "#252044";
  ctx.textAlign = "left";
  ctx.font = "bold 16px Nunito";
  ctx.fillText("MATCH THE COLOR BEFORE THE GATE!", 22, 29);

  ctx.textAlign = "center";
  ctx.font = "bold 13px Nunito";

  s.colors.forEach((color, i) => {
    ctx.fillStyle = color;
    roundRect(ctx, 250 + i * 145, 465, 120, 25, 8);
    ctx.fill();

    ctx.fillStyle = "#252044";
    ctx.fillText((i + 1) + " · " + s.colorNames[i], 310 + i * 145, 482);
  });
}

/* BRAIN FREEZE */

function setupMemory(s) {
  s.sequence = [Math.floor(Math.random() * 4)];
  s.input = [];
  s.round = 1;
  s.maxRound = 7;
  s.phase = "show";
  s.showIndex = 0;
  s.showTimer = .7;
  s.activeTile = -1;
  s.flashTimer = 0;
  s.tiles = ["🍕", "🐸", "🌈", "🦆"];
  s.tileRects = [];

  setMessage("Watch the sequence, then repeat it.");
}

function updateMemory(s, dt) {
  s.showTimer -= dt;

  if (s.phase === "show" && s.showTimer <= 0) {
    if (s.showIndex < s.sequence.length) {
      s.activeTile = s.sequence[s.showIndex];
      s.showIndex++;
      s.phase = "flash";
      s.flashTimer = .4;
    } else {
      s.activeTile = -1;
      s.phase = "input";
      setMessage("Your turn! Repeat the sequence in order.");
    }
  } else if (s.phase === "flash") {
    s.flashTimer -= dt;

    if (s.flashTimer <= 0) {
      s.activeTile = -1;
      s.phase = "show";
      s.showTimer = .3;
    }
  }

  drawMemory(s);
}

function drawMemory(s) {
  const { ctx, W, H } = s;

  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = "#fff0a6";
  ctx.fillRect(0, 0, W, H);
  drawDots(ctx, W, H, "#ffffff88", 42);

  ctx.fillStyle = "#252044";
  ctx.textAlign = "center";
  ctx.font = "bold 26px Fredoka";
  ctx.fillText("ROUND " + s.round + " / " + s.maxRound, W / 2, 55);

  const width = 170;
  const height = 140;
  const gap = 25;
  const startX = (W - (width * 2 + gap)) / 2;

  s.tileRects = [];

  s.tiles.forEach((tile, i) => {
    const x = startX + (i % 2) * (width + gap);
    const y = 95 + Math.floor(i / 2) * (height + gap);

    s.tileRects.push({ x, y, w: width, h: height, index: i });

    ctx.fillStyle = s.activeTile === i
      ? "#ffffff"
      : ["#ffb4d0", "#b9a8ff", "#8be8a1", "#64d9ff"][i];

    roundRect(ctx, x, y, width, height, 24);
    ctx.fill();

    ctx.lineWidth = s.activeTile === i ? 7 : 3;
    ctx.strokeStyle = "#252044";
    roundRect(ctx, x, y, width, height, 24);
    ctx.stroke();

    ctx.font = "57px sans-serif";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "#252044";
    ctx.fillText(tile, x + width / 2, y + height / 2);
  });

  ctx.fillStyle = "#252044";
  ctx.font = "bold 16px Nunito";
  ctx.textBaseline = "alphabetic";
  ctx.fillText(s.phase === "input" ? "YOUR TURN!" : "WATCH CAREFULLY...", W / 2, 455);
}

function memoryChoice(s, index) {
  if (!s || s.id !== "memory" || s.over || s.phase !== "input") return;

  const expected = s.sequence[s.input.length];

  if (index !== expected) {
    finishGame("Brain freeze! You reached round " + s.round + ".", false);
    return;
  }

  s.input.push(index);

  if (s.input.length === s.sequence.length) {
    s.score += s.round * 10;
    addCoin(s, 1);

    if (s.round >= s.maxRound) {
      s.score += 50;
      finishGame("Your memory is terrifyingly good!", true);
      return;
    }

    s.round++;
    s.sequence.push(Math.floor(Math.random() * s.tiles.length));
    s.input = [];
    s.showIndex = 0;
    s.phase = "show";
    s.showTimer = .8;
    s.activeTile = -1;

    setMessage("Correct! Round " + s.round + " is longer. Stay focused.");
  }
}

/* SHARED GAME LOOP */

function frame(now) {
  if (!session || !session.running || session.over) return;

  const s = session;
  const dt = Math.min(.035, Math.max(0, (now - s.last) / 1000));
  s.last = now;
  s.time += dt;

  if (s.id === "lava") updateLava(s, dt);
  if (s.id === "snack") updateSnack(s, dt);
  if (s.id === "button") updateButton(s, dt);
  if (s.id === "astro") updateAstro(s, dt);
  if (s.id === "dash") updateDash(s, dt);
  if (s.id === "memory") updateMemory(s, dt);

  if (session && session.running && !session.over) {
    setHUD(session.score, session.coins);
    animationFrame = requestAnimationFrame(frame);
  }
}

function drawDots(ctx, width, height, color, step) {
  ctx.fillStyle = color;

  for (let y = 10; y < height; y += step) {
    for (let x = 10; x < width; x += step) {
      ctx.beginPath();
      ctx.arc(x, y, 2, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

function roundRect(ctx, x, y, width, height, radius) {
  const r = Math.max(0, Math.min(radius, width / 2, height / 2));

  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + width, y, x + width, y + height, r);
  ctx.arcTo(x + width, y + height, x, y + height, r);
  ctx.arcTo(x, y + height, x, y, r);
  ctx.arcTo(x, y, x + width, y, r);
  ctx.closePath();
}

function drawCharacter(ctx, x, y, width, height, color, emoji) {
  ctx.fillStyle = "#252044";
  roundRect(ctx, x, y, width, height, 9);
  ctx.fill();

  ctx.fillStyle = color;
  roundRect(ctx, x + 3, y + 3, Math.max(1, width - 6), Math.max(1, height - 6), 7);
  ctx.fill();

  ctx.font = Math.max(10, Math.min(height * .72, width * .75)) + "px sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(emoji, x + width / 2, y + height / 2 + 1);
}

/* NAVIGATION AND BUTTONS */

document.querySelectorAll("[data-page]").forEach(button => {
  button.addEventListener("click", event => {
    event.preventDefault();
    showPage(button.dataset.page);
  });
});

document.addEventListener("click", event => {
  const playButton = event.target.closest("[data-play]");

  if (playButton) {
    launchGame(playButton.dataset.play);
    return;
  }

  const filterButton = event.target.closest("[data-filter]");

  if (filterButton) {
    activeFilter = filterButton.dataset.filter;

    document.querySelectorAll("[data-filter]").forEach(button => {
      button.classList.toggle("active", button === filterButton);
    });

    renderLibrary();
    return;
  }

  const claimButton = event.target.closest("[data-claim]");

  if (claimButton) {
    claimQuest(claimButton.dataset.claim);
    return;
  }

  const switchButton = event.target.closest("[data-switch-game]");

  if (switchButton) {
    launchGame(switchButton.dataset.switchGame);
    return;
  }

  const avatarButton = event.target.closest("[data-avatar]");

  if (avatarButton) {
    state.avatar = avatarButton.dataset.avatar;
    saveState();
    renderTop();
    renderProfile();
  }
});

$("gameSearch").addEventListener("input", renderLibrary);

$("clearSearch").addEventListener("click", () => {
  $("gameSearch").value = "";
  activeFilter = "all";

  document.querySelectorAll("[data-filter]").forEach(button => {
    button.classList.toggle("active", button.dataset.filter === "all");
  });

  renderLibrary();
});

$("backToArcade").addEventListener("click", leaveGame);
$("restartGame").addEventListener("click", startSession);
$("playAgain").addEventListener("click", startSession);
$("startButton").addEventListener("click", startSession);

$("saveName").addEventListener("click", () => {
  const name = $("nameInput").value.trim().slice(0, 18);

  if (!name) {
    notify("Pick a name first.");
    return;
  }

  state.name = name;
  saveState();
  renderTop();
  renderProfile();
  notify("New name. Same chaos.");
});

$("nameInput").addEventListener("keydown", event => {
  if (event.key === "Enter") {
    event.preventDefault();
    $("saveName").click();
  }
});

function claimQuest(id) {
  const quest = QUESTS.find(item => item.id === id);

  if (!quest || state.claimed[id]) return;

  if ((state.questProgress[id] || 0) < quest.goal) return;

  state.claimed[id] = true;
  state.coins += quest.reward;
  state.xp += 15;

  updateAchievements();
  saveState();

  renderTop();
  renderQuests();
  renderHomeQuests();
  renderBadges($("homeBadges"));
  notify("Quest complete! +" + quest.reward + " coins.");
}

/* KEYBOARD CONTROLS */

document.addEventListener("keydown", event => {
  const gameKeys = ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", " "];

  if (currentPage === "play" && gameKeys.includes(event.key)) {
    event.preventDefault();
  }

  keys[event.key] = true;

  if (event.repeat || currentPage !== "play" || !session || session.over) return;

  if (session.id === "lava" && [" ", "ArrowUp", "w", "W"].includes(event.key)) {
    jumpLava();
  }

  if (session.id === "dash") {
    const number = Number(event.key);
    if (number >= 1 && number <= 3) session.lane = number - 1;
  }

  if (session.id === "button" && ["1", "2", "3"].includes(event.key)) {
    const button = session.buttons[Number(event.key) - 1];

    if (button) {
      buttonChoice(session, button.x + button.w / 2, button.y + button.h / 2);
    }
  }
});

document.addEventListener("keyup", event => {
  keys[event.key] = false;
});

/* TOUCH AND POINTER CONTROLS */

$("stage").addEventListener("pointerdown", event => {
  if (currentPage !== "play" || !session || session.over) return;

  const canvas = $("stage");
  const rect = canvas.getBoundingClientRect();
  const x = (event.clientX - rect.left) * canvas.width / rect.width;
  const y = (event.clientY - rect.top) * canvas.height / rect.height;

  if (session.id === "lava") {
    if (y > canvas.height * .65 && x < canvas.width * .4) {
      keys.ArrowLeft = true;
      pointerHeld = true;
      return;
    }

    if (y > canvas.height * .65 && x > canvas.width * .6) {
      keys.ArrowRight = true;
      pointerHeld = true;
      return;
    }

    jumpLava();
  }

  if (session.id === "button") {
    buttonChoice(session, x, y);
  }

  if (session.id === "astro") {
    astroLaunch(session, x, y);
  }

  if (session.id === "dash") {
    const lane = Math.floor((y - 130) / 105);

    if (lane >= 0 && lane < 3) {
      session.lane = lane;
    } else {
      session.lane = Math.max(0, Math.min(2, Math.floor(x / canvas.width * 3)));
    }
  }

  if (session.id === "memory") {
    const tile = session.tileRects.find(item =>
      x >= item.x && x <= item.x + item.w &&
      y >= item.y && y <= item.y + item.h
    );

    if (tile) memoryChoice(session, tile.index);
  }
});

function releasePointerControls() {
  keys.ArrowLeft = false;
  keys.ArrowRight = false;
  pointerHeld = false;
}

$("stage").addEventListener("pointerup", releasePointerControls);
$("stage").addEventListener("pointercancel", releasePointerControls);
$("stage").addEventListener("pointerleave", releasePointerControls);

window.addEventListener("blur", () => {
  keys = {};
});

document.addEventListener("visibilitychange", () => {
  if (document.hidden) keys = {};
});

/* INITIALIZE */

renderTop();
renderHome();
renderLibrary();
