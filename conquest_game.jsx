import React, { useEffect, useState, useRef } from "react";

// Conquest Game - with coins and rudal
export default function ConquestGame() {
  const ROWS = 4;
  const COLS = 8;
  const RUDAL_COST = 10;
  const RUDAL_DAMAGE = 25;

  const [grid, setGrid] = useState(() => makeInitialGrid(ROWS, COLS));
  const [selected, setSelected] = useState(null); // {r,c}
  const [running, setRunning] = useState(true);
  const [autoP2, setAutoP2] = useState(true);
  const [coins, setCoins] = useState({ 1: 0, 2: 0 });
  const [shopAction, setShopAction] = useState(null); // "rudal" or null
  const tickRef = useRef(null);

  useEffect(() => {
    setGrid(makeInitialGrid(ROWS, COLS));
    setSelected(null);
    setCoins({ 1: 0, 2: 0 });
  }, []);

  useEffect(() => {
    if (running) {
      tickRef.current = setInterval(() => {
        setGrid((g) => {
          const ng = tickGrid(g);
          // Update coins based on owned territories
          const p1 = ng.flat().filter((t) => t.owner === 1).length;
          const p2 = ng.flat().filter((t) => t.owner === 2).length;
          setCoins((c) => ({ 1: c[1] + p1, 2: c[2] + p2 }));
          return ng;
        });
      }, 1000);
    } else {
      clearInterval(tickRef.current);
    }
    return () => clearInterval(tickRef.current);
  }, [running]);

  useEffect(() => {
    if (!running) return;
    if (!autoP2) return;

    const aiInterval = setInterval(() => {
      setGrid((g) => {
        const next = structuredClone(g);
        runSimpleAiOnGrid(next);
        return next;
      });
    }, 1200);

    return () => clearInterval(aiInterval);
  }, [running, autoP2]);

  function handleClick(r, c) {
    const tile = grid[r][c];

    if (shopAction === "rudal") {
      // Fire missile on target tile if owned by opponent
      if (tile.owner === 2) {
        setGrid((g) => {
          const ng = structuredClone(g);
          const t = ng[r][c];
          t.soldiers = Math.max(0, t.soldiers - RUDAL_DAMAGE);
          if (t.soldiers === 0) {
            t.owner = 0; // becomes neutral if no soldiers left
          }
          return ng;
        });
        setCoins((c) => ({ ...c, 1: c[1] - RUDAL_COST }));
      }
      setShopAction(null);
      return;
    }

    if (!selected) {
      if (tile.owner === 1 && tile.soldiers > 1) {
        setSelected({ r, c });
      }
      return;
    }

    if (selected.r === r && selected.c === c) {
      setSelected(null);
      return;
    }

    const src = grid[selected.r][selected.c];
    const dst = grid[r][c];

    if (src.owner !== 1) {
      setSelected(null);
      return;
    }

    const send = Math.floor(src.soldiers / 2);
    if (send < 1) {
      setSelected(null);
      return;
    }

    setGrid((g) => {
      const ng = structuredClone(g);
      const s = ng[selected.r][selected.c];
      const d = ng[r][c];
      s.soldiers -= send;

      if (d.owner === 1) {
        d.soldiers += send;
      } else {
        if (send > d.soldiers) {
          const leftover = send - d.soldiers;
          d.owner = 1;
          d.soldiers = leftover;
        } else if (send === d.soldiers) {
          d.owner = 0;
          d.soldiers = 0;
        } else {
          d.soldiers -= send;
        }
      }
      return ng;
    });

    setSelected(null);
  }

  function buyRudal() {
    if (coins[1] >= RUDAL_COST) {
      setShopAction("rudal");
    } else {
      alert("Coins tidak cukup untuk rudal!");
    }
  }

  function resetGrid() {
    setGrid(makeInitialGrid(ROWS, COLS));
    setSelected(null);
    setCoins({ 1: 0, 2: 0 });
  }

  function randomizeGrid() {
    setGrid(makeRandomGrid(ROWS, COLS));
    setSelected(null);
    setCoins({ 1: 0, 2: 0 });
  }

  return (
    <div className="p-4 max-w-3xl mx-auto bg-white text-black min-h-screen">
      <h1 className="text-2xl font-semibold mb-3">Conquest — Prototype with Rudal</h1>

      <div className="flex gap-3 mb-4 items-center flex-wrap text-sm">
        <button
          className="px-2 py-1 rounded bg-slate-700 text-white text-xs"
          onClick={() => setRunning((r) => !r)}
        >
          {running ? "Pause" : "Start"}
        </button>

        <button className="px-2 py-1 rounded border text-xs" onClick={resetGrid}>
          Reset
        </button>
        <button className="px-2 py-1 rounded border text-xs" onClick={randomizeGrid}>
          Randomize
        </button>

        <label className="flex items-center gap-1 text-xs">
          <input
            type="checkbox"
            checked={autoP2}
            onChange={(e) => setAutoP2(e.target.checked)}
          />
          Auto Player 2
        </label>
      </div>

      <div className="mb-2 text-xs text-black">
        Pilih wilayah Anda (biru), lalu klik target mana saja untuk menyerang. Jika prajurit Anda menang, wilayah akan direbut.
      </div>

      <div className="mb-3 p-2 border rounded bg-slate-50">
        <div className="font-semibold mb-1">Toko</div>
        <button
          onClick={buyRudal}
          className={`px-2 py-1 rounded text-xs mr-2 ${coins[1] >= RUDAL_COST ? "bg-green-500 text-white" : "bg-gray-300 text-black"}`}
        >
          Rudal ({RUDAL_COST} coins)
        </button>
        {shopAction === "rudal" && <span className="text-red-600 text-xs ml-2">Klik wilayah musuh untuk menyerang!</span>}
      </div>

      <div
        className={`grid gap-0.5`} style={{ gridTemplateColumns: `repeat(${COLS}, minmax(28px, 1fr))` }}
      >
        {grid.map((row, r) =>
          row.map((tile, c) => (
            <Tile
              key={`${r}-${c}`}
              tile={tile}
              isSelected={selected && selected.r === r && selected.c === c}
              onClick={() => handleClick(r, c)}
            />
          ))
        )}
      </div>

      <div className="mt-3 flex gap-3 text-xs">
        <StatusBox player={1} grid={grid} coins={coins[1]} />
        <StatusBox player={2} grid={grid} coins={coins[2]} />
        <div className="p-2 border rounded flex-1">
          <div className="font-semibold">Legenda</div>
          <div className="mt-1">• Biru = Player 1 (Anda). • Merah = Player 2 (AI). • Abu-abu = Netral</div>
          <div>• Rudal = serang wilayah musuh, kurangi {RUDAL_DAMAGE} prajurit</div>
        </div>
      </div>
    </div>
  );
}

function Tile({ tile, onClick, isSelected }) {
  const ownerClass = tile.owner === 1 ? "ring-1 ring-blue-400" : tile.owner === 2 ? "ring-1 ring-red-400" : "ring-1 ring-slate-300";
  const bg = tile.owner === 1 ? "bg-blue-500" : tile.owner === 2 ? "bg-red-500" : "bg-slate-200";

  return (
    <button
      onClick={onClick}
      className={`relative p-1 aspect-square flex items-center justify-center rounded ${bg} ${ownerClass} transition-transform ${isSelected ? "scale-105" : ""}`}
      title={`Owner: ${ownerName(tile.owner)}\nSoldiers: ${tile.soldiers}`}
    >
      <div className="text-black font-bold text-[10px] select-none">{tile.soldiers}</div>
    </button>
  );
}

function StatusBox({ player, grid, coins }) {
  const tiles = grid.flat().filter((t) => t.owner === player);
  const total = tiles.reduce((s, t) => s + t.soldiers, 0);
  return (
    <div className="p-2 border rounded w-36">
      <div className="font-semibold">Player {player}</div>
      <div className="mt-1">Wilayah: {tiles.length}</div>
      <div>Total Prajurit: {total}</div>
      <div>Coins: {coins}</div>
    </div>
  );
}

// Helpers
function makeInitialGrid(rows, cols) {
  const g = Array.from({ length: rows }, () =>
    Array.from({ length: cols }, () => ({ owner: 0, soldiers: 0 }))
  );
  g[rows - 1][0] = { owner: 1, soldiers: 5 };
  g[0][cols - 1] = { owner: 2, soldiers: 5 };
  return g;
}

function makeRandomGrid(rows, cols) {
  const g = Array.from({ length: rows }, () =>
    Array.from({ length: cols }, () => ({ owner: 0, soldiers: randInt(0, 6) }))
  );
  g[rows - 1][0] = { owner: 1, soldiers: 5 };
  g[0][cols - 1] = { owner: 2, soldiers: 5 };
  return g;
}

function tickGrid(g) {
  const ng = structuredClone(g);
  for (let r = 0; r < ng.length; r++) {
    for (let c = 0; c < ng[r].length; c++) {
      if (ng[r][c].owner !== 0) ng[r][c].soldiers += 1;
    }
  }
  return ng;
}

function runSimpleAiOnGrid(g) {
  const rows = g.length;
  const cols = g[0].length;
  const candidates = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const t = g[r][c];
      if (t.owner === 2 && t.soldiers > 1) {
        const neighbors = neighborsOf(r, c, rows, cols);
        for (const [nr, nc] of neighbors) {
          const neigh = g[nr][nc];
          if (neigh.owner !== 2) {
            candidates.push({ r, c, nr, nc });
          }
        }
      }
    }
  }
  if (candidates.length === 0) return;
  candidates.sort((a, b) => g[a.nr][a.nc].soldiers - g[b.nr][b.nc].soldiers);
  const pick = candidates[0];
  const src = g[pick.r][pick.c];
  const dst = g[pick.nr][pick.nc];
  const send = Math.floor(src.soldiers / 2);
  if (send < 1) return;
  src.soldiers -= send;
  if (dst.owner === 2) {
    dst.soldiers += send;
  } else {
    if (send > dst.soldiers) {
      dst.owner = 2;
      dst.soldiers = send - dst.soldiers;
    } else if (send === dst.soldiers) {
      dst.owner = 0;
      dst.soldiers = 0;
    } else {
      dst.soldiers -= send;
    }
  }
}

function neighborsOf(r, c, rows, cols) {
  const arr = [];
  if (r > 0) arr.push([r - 1, c]);
  if (r < rows - 1) arr.push([r + 1, c]);
  if (c > 0) arr.push([r, c - 1]);
  if (c < cols - 1) arr.push([r, c + 1]);
  return arr;
}

function ownerName(o) {
  if (o === 1) return "Player 1";
  if (o === 2) return "Player 2";
  return "Neutral";
}

function randInt(a, b) {
  return Math.floor(Math.random() * (b - a + 1)) + a;
}
