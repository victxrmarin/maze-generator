const COLS = 20;
const ROWS = 20;
const SIZE = 30;
let speed = 3;

const canvas = document.getElementById('maze');
const ctx = canvas.getContext('2d');
canvas.width = COLS * SIZE;
canvas.height = ROWS * SIZE;

const DIRS = [
    {dx: 0, dy: -1, wall:'top', opposite:'bottom'},
    {dx: 1, dy: 0, wall: 'right', opposite: 'left'},
    {dx: 0, dy: 1, wall: 'bottom', opposite: 'top'},
    {dx: -1, dy: 0, wall: 'left', opposite: 'right'},
];

function createGrid() {
    const grid = [];
    for(let y = 0; y < ROWS; y++) {
        const row = [];
        for(let x = 0; x < COLS; x++) {
            row.push({
                x,y,
                walls: {top: true, right: true, bottom: true, left: true},
                visited: false,
                color: null,
            });
        }
        grid.push(row);
    }
    return grid;
}

function getNeighbor(grid, cell, d) {
    return grid[cell.y + d.dy]?.[cell.x + d.dx]
}

function draw(grid) {
    ctx.clearRect(0,0, canvas.width, canvas.height);

    for (const row of grid) {
        for (const c of row) {
            if(c.color) {
                ctx.fillStyle = c.color;
                ctx.fillRect(c.x * SIZE, c.y * SIZE, SIZE, SIZE)
            }
        }
    }

  ctx.fillStyle = '#00ff26';
  ctx.fillRect(2, 2, SIZE - 4, SIZE - 4);
  ctx.fillStyle = '#ff1900';
  ctx.fillRect((COLS - 1) * SIZE + 2, (ROWS - 1) * SIZE + 2, SIZE - 4, SIZE - 4);

  
  ctx.strokeStyle = '#000';
  ctx.lineWidth = 2;

  ctx.beginPath();
  for (const row of grid) {
    for (const c of row) {
      const px = c.x * SIZE, py = c.y * SIZE;
      if (c.walls.top)    { ctx.moveTo(px, py);               ctx.lineTo(px + SIZE, py); }
      if (c.walls.right)  { ctx.moveTo(px + SIZE, py);        ctx.lineTo(px + SIZE, py + SIZE); }
      if (c.walls.bottom) { ctx.moveTo(px, py + SIZE);        ctx.lineTo(px + SIZE, py + SIZE); }
      if (c.walls.left)   { ctx.moveTo(px, py);               ctx.lineTo(px, py + SIZE); }
    }
  }
  ctx.stroke();
}

function* generateDFS(grid) {
    const start = grid[0][0];
    start.visited = true;
    const stack = [start];

    while(stack.length > 0) {
        const current = stack[stack.length - 1];
        current.color = '#f1d8ff';

        const options = [];
        for (const d of DIRS) {
            const next = getNeighbor(grid, current, d);
            if(next && !next.visited) options.push({d, next});
        }

        if(options.length === 0) {
            stack.pop();
        } else {
            const {d, next} = options[Math.floor(Math.random() * options.length)];
            current.walls[d.wall] = false;
            next.walls[d.opposite] =  false;
            next.visited = true;
            stack.push(next);
        }
        yield;
    }
}

let grid = createGrid();
let job = 0;

function run(gen, onDone) {
    const id = ++job;
    function frame() {
        if (id !== job) return;
        for(let i = 0; i < speed; i++) {
            if(gen.next().done) {
                draw(grid);
                onDone?.();
                return;
            }
        }
        draw(grid);
        requestAnimationFrame(frame);
    }
    frame();
}

function clearColors() {
    for (const row of grid) for (const c of row) c.color = null
}

function newMaze() {
    grid = createGrid()
    run(generateDFS(grid), clearColors);
}

document.getElementById('btn-generate').onclick = newMaze;
newMaze();

function* solveBFS(grid, start, end) {
    const queue = [start];
    const cameFrom = new Map([[start, null]]);

    while (queue.length > 0) {
        const current = queue.shift()
        current.color = '#acd3f5'

        if(current === end) break;

        for (const d of DIRS) {
            if(current.walls[d.wall]) continue;
            const next = getNeighbor(grid, current ,d);
            if(next && !cameFrom.has(next)) {
                cameFrom.set(next, current);
                queue.push(next);
            }
        }
        yield
    }

    let c = end;
    while (c) {
        c.color = '#fff700';
        c = cameFrom.get(c);
        yield
    }
}

document.getElementById('btn-solve').onclick = () => {
    clearColors();
    const start = grid[0][0];
    const end = grid[ROWS - 1][COLS - 1]
    run(solveBFS(grid, start, end));
};

