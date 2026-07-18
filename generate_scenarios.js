const W = 180, H = 120;
const E = { EMPTY: 0, WALL: 14, STONE: 15, FIRE: 19, WATER: 18, DIRT: 33, BAKING_SODA: 47, VINEGAR: 48 };

function generateRLE(grid) {
  let out = [], run = 1;
  for (let i = 1; i <= grid.length; i++) {
    if (i < grid.length && grid[i] === grid[i - 1]) { run++; continue; }
    out.push(run + ',' + grid[i - 1]);
    run = 1;
  }
  return out.join(';');
}

// 1. Water Cycle
const wGrid = new Uint8Array(W * H);
for (let y = H - 20; y < H; y++) {
  for (let x = 0; x < W; x++) wGrid[y * W + x] = E.STONE;
}
// Pool in the middle
for (let y = H - 20; y < H - 10; y++) {
  for (let x = 60; x <= 120; x++) wGrid[y * W + x] = (y > H - 15) ? E.WATER : E.EMPTY;
}
// Heat source under the pool
for (let y = H - 5; y < H; y++) {
  for (let x = 80; x <= 100; x++) wGrid[y * W + x] = E.FIRE;
}
// Clouds? Just let it form naturally.
console.log('WATER_CYCLE:', generateRLE(wGrid));

// 2. School Science
const sGrid = new Uint8Array(W * H);
// Ground
for (let y = H - 10; y < H; y++) {
  for (let x = 0; x < W; x++) sGrid[y * W + x] = E.DIRT;
}
// Mound
for (let y = H - 40; y < H - 10; y++) {
  for (let x = 0; x < W; x++) {
    const dx = Math.abs(x - 90);
    const dy = H - 10 - y;
    if (dy < 40 - dx) {
      sGrid[y * W + x] = E.DIRT;
    }
  }
}
// Cup in the mound
for (let y = H - 35; y < H - 15; y++) {
  for (let x = 85; x <= 95; x++) sGrid[y * W + x] = E.EMPTY;
}
console.log('SCIENCE_FAIR:', generateRLE(sGrid));

