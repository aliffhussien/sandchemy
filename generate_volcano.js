const W = 180, H = 120;
const grid = new Uint8Array(W * H);
const E = { EMPTY: 0, STONE: 15, VOLCANO: 46 };

for (let y = 0; y < H; y++) {
  for (let x = 0; x < W; x++) {
    const i = y * W + x;
    // Ground level at H-20
    if (y >= H - 20) {
      grid[i] = E.STONE;
    } else {
      // Mountain shape: peaks at x=90, y=40
      const dx = Math.abs(x - 90);
      const dy = H - 20 - y;
      if (dy < 60 - dx) {
        grid[i] = E.STONE;
      }
    }
  }
}

// Hollow out the center for the magma chamber and vent
for (let y = 40; y < H - 20; y++) {
  for (let x = 85; x <= 95; x++) {
    // Narrow vent at the top, wider at the bottom
    const widthAtY = 2 + Math.floor((y - 40) / 5);
    const dx = Math.abs(x - 90);
    if (dx < widthAtY) {
      grid[y * W + x] = E.EMPTY;
    }
  }
}

// Add magma vents at the very bottom of the chamber
for (let x = 80; x <= 100; x++) {
  if (grid[(H - 22) * W + x] === E.EMPTY) {
    grid[(H - 22) * W + x] = E.VOLCANO;
    grid[(H - 21) * W + x] = E.VOLCANO;
  }
}

// RLE
let out = [], run = 1;
for (let i = 1; i <= grid.length; i++) {
  if (i < grid.length && grid[i] === grid[i - 1]) { run++; continue; }
  out.push(run + ',' + grid[i - 1]);
  run = 1;
}
const rle = out.join(';');
console.log(rle);
