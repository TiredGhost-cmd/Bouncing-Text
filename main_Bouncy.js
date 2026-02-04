const canvas = document.getElementById("c");
const ctx = canvas.getContext("2d");

// --- Canvas resize ---
function resize() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
window.addEventListener("resize", resize);
resize();

// --- Customize ---
let text = "SPOOKY MODE";
let fontSize = 64;

// Permanent Marker (requires the Google Fonts <link> in index.html)
let fontFamily = "'Permanent Marker', 'Comic Sans MS', cursive";

let speedX = 280; // pixels per second
let speedY = 220;
// ---------------------
let cornerSpeedBoost = 25; // starting boost
let minCornerBoost = 5; // min boost (never goes below this)
let boostDecay = 0.85; // how fast it decays
let maxSpeed = 1200; // safety cap

// --- Color palette (cycles in order) ---
const COLORS = [
  "#FFD700", // Gold
  "#FFBF00", // Amber
  "#008080", // Teal
  "#7FFFD4", // Aquamarine
  "#800080", // Purple
  "#1E90FF", // Blue
  "#FF0000", // Red
  "#2BBBAD"  // Blue-Green
];

let colorIndex = 0;
let color = COLORS[colorIndex];

// --- Motion state ---
let x = 80;      // left of text box
let y = 120;     // baseline of text
let vx = speedX; // px/sec
let vy = speedY; // px/sec

let cornerHits = 0;

// Timing
let lastTime = performance.now();

// Helpers
function clamp(val, min, max) {
  return Math.max(min, Math.min(max, val));
}

function applyMainFont() {
  ctx.font = `${fontSize}px ${fontFamily}`;
}

function measureTextBox() {
  // IMPORTANT: set font before measureText
  applyMainFont();
  const w = ctx.measureText(text).width;
  const h = fontSize; // decent approximation
  return { w, h };
}

function nextColor() {
  colorIndex = (colorIndex + 1) % COLORS.length;
  color = COLORS[colorIndex];
}

function boostSpeedOnCorner() {
	const newVx = Math.min(Math.abs(vx) + cornerSpeedBoost, maxSpeed);
	const newVy = Math.min(Math.abs(vy) + cornerSpeedBoost, maxSpeed);
	
	vx = Math.sign(vx) * newVx;
	vy = Math.sign(vy) * newVy;
	
	cornerSpeedBoost = Math.max(
	 minCornerBoost,
	 cornerSpeedBoost * boostDecay
	);
}

// Main loop
function tick(now) {
  const dt = (now - lastTime) / 1000;
  lastTime = now;

  // Clear
  ctx.fillStyle = "black";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Measure
  const { w, h } = measureTextBox();

  // Move
  x += vx * dt;
  y += vy * dt;

  let hitX = false;
  let hitY = false;

  // Bounce X (x is left edge)
  if (x <= 0) {
    x = 0;
    vx *= -1;
    hitX = true;
  } else if (x + w >= canvas.width) {
    x = canvas.width - w;
    vx *= -1;
    hitX = true;
  }

  // Bounce Y (y is baseline; top is y-h)
  if (y - h <= 0) {
    y = h;
    vy *= -1;
    hitY = true;
  } else if (y >= canvas.height) {
    y = canvas.height;
    vy *= -1;
    hitY = true;
  }

  // Cycle color on wall hits (change to hitX && hitY for corner-only)
  if (hitX || hitY) nextColor();

  // Count perfect corner hits
  if (hitX && hitY) {
	cornerHits++;
	boostSpeedOnCorner();
  }
  
  // Draw
  applyMainFont();
  ctx.fillStyle = color;
  ctx.fillText(text, x, y);
  ctx.font = `18px ${fontFamily}`;
  ctx.fillStyle = "white";
  ctx.fillText(`Corner hits: ${cornerHits}`, 12, 26);


  requestAnimationFrame(tick);
}

// Optional controls
window.addEventListener("click", () => {
  // Click cycles color manually
  nextColor();
});

window.addEventListener("keydown", (e) => {
  const step = 40;

  if (e.key === "ArrowRight") vx = Math.sign(vx) * (Math.abs(vx) + step);
  if (e.key === "ArrowLeft")  vx = Math.sign(vx) * Math.max(40, Math.abs(vx) - step);
  if (e.key === "ArrowDown")  vy = Math.sign(vy) * (Math.abs(vy) + step);
  if (e.key === "ArrowUp")    vy = Math.sign(vy) * Math.max(40, Math.abs(vy) - step);

  vx = clamp(vx, -2000, 2000);
  vy = clamp(vy, -2000, 2000);
});

// Start AFTER font loads (prevents measurement glitches)
async function start() {
  try {
    await document.fonts.load(`${fontSize}px ${fontFamily}`);
    await document.fonts.ready;
  } catch (e) {
    // If font loading fails, run anyway with fallbacks
  }

  lastTime = performance.now();
  requestAnimationFrame(tick);
}

start();
