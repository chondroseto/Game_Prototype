import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

// Ukuran papan
const BOARD_SIZE = 8;

// Setup awal catur standar
const initialBoard = Array(BOARD_SIZE)
  .fill(null)
  .map(() => Array(BOARD_SIZE).fill(null));

// Bidak untuk player 1 (bawah)
initialBoard[7] = [
  { player: 1, type: "R" },
  { player: 1, type: "N" },
  { player: 1, type: "B" },
  { player: 1, type: "Q" },
  { player: 1, type: "K" },
  { player: 1, type: "B" },
  { player: 1, type: "N" },
  { player: 1, type: "R" },
];
for (let i = 0; i < BOARD_SIZE; i++) initialBoard[6][i] = { player: 1, type: "P" };

// Bidak untuk player 2 (atas)
initialBoard[0] = [
  { player: 2, type: "R" },
  { player: 2, type: "N" },
  { player: 2, type: "B" },
  { player: 2, type: "Q" },
  { player: 2, type: "K" },
  { player: 2, type: "B" },
  { player: 2, type: "N" },
  { player: 2, type: "R" },
];
for (let i = 0; i < BOARD_SIZE; i++) initialBoard[1][i] = { player: 2, type: "P" };

// Harga shop
const shopPrices = {
  P: 5,
  N: 10,
  B: 10,
  R: 15,
  Q: 20,
};

// Simbol bidak catur seragam
const pieceSymbols = {
  P: "♙",
  R: "♖",
  N: "♘",
  B: "♗",
  Q: "♕",
  K: "♔",
};

// Validasi gerakan sesuai aturan dasar catur
function isValidMove(piece, fromRow, fromCol, toRow, toCol, board) {
  if (!piece) return false;
  const dr = toRow - fromRow;
  const dc = toCol - fromCol;
  const absDr = Math.abs(dr);
  const absDc = Math.abs(dc);

  const target = board[toRow][toCol];
  if (target && target.player === piece.player) return false;

  switch (piece.type) {
    case "P": {
      const dir = piece.player === 1 ? -1 : 1;
      const startRow = piece.player === 1 ? 6 : 1;
      if (dc === 0 && dr === dir && !target) return true;
      if (dc === 0 && dr === 2 * dir && fromRow === startRow && !target && !board[fromRow + dir][fromCol]) return true;
      if (absDc === 1 && dr === dir && target) return true;
      return false;
    }
    case "R": {
      if (dr !== 0 && dc !== 0) return false;
      const stepR = dr === 0 ? 0 : dr / absDr;
      const stepC = dc === 0 ? 0 : dc / absDc;
      let r = fromRow + stepR;
      let c = fromCol + stepC;
      while (r !== toRow || c !== toCol) {
        if (board[r][c]) return false;
        r += stepR;
        c += stepC;
      }
      return true;
    }
    case "N": {
      return (absDr === 2 && absDc === 1) || (absDr === 1 && absDc === 2);
    }
    case "B": {
      if (absDr !== absDc) return false;
      const stepR = dr / absDr;
      const stepC = dc / absDc;
      let r = fromRow + stepR;
      let c = fromCol + stepC;
      while (r !== toRow || c !== toCol) {
        if (board[r][c]) return false;
        r += stepR;
        c += stepC;
      }
      return true;
    }
    case "Q": {
      if (dr === 0 || dc === 0) {
        return isValidMove({ ...piece, type: "R" }, fromRow, fromCol, toRow, toCol, board);
      } else if (absDr === absDc) {
        return isValidMove({ ...piece, type: "B" }, fromRow, fromCol, toRow, toCol, board);
      }
      return false;
    }
    case "K": {
      return absDr <= 1 && absDc <= 1;
    }
    default:
      return false;
  }
}

export default function ChessEconomy() {
  const [board, setBoard] = useState(initialBoard);
  const [selected, setSelected] = useState(null);
  const [coins, setCoins] = useState({ 1: 0, 2: 0 });
  const [turn, setTurn] = useState(1);
  const [territory, setTerritory] = useState(Array(BOARD_SIZE).fill(null).map(() => Array(BOARD_SIZE).fill(null)));

  // Tandai wilayah awal berdasarkan bidak awal
  useEffect(() => {
    const newTerritory = territory.map((r) => [...r]);
    for (let r = 0; r < BOARD_SIZE; r++) {
      for (let c = 0; c < BOARD_SIZE; c++) {
        if (board[r][c]) {
          newTerritory[r][c] = board[r][c].player;
        }
      }
    }
    setTerritory(newTerritory);
  }, []);

  const handleCellClick = (row, col) => {
    const piece = board[row][col];

    if (selected) {
      const [selRow, selCol] = selected;
      const movingPiece = board[selRow][selCol];

      if (
        movingPiece &&
        movingPiece.player === turn &&
        (row !== selRow || col !== selCol)
      ) {
        if (isValidMove(movingPiece, selRow, selCol, row, col, board)) {
          const newBoard = board.map((r) => [...r]);
          newBoard[row][col] = movingPiece;
          newBoard[selRow][selCol] = null;
          setBoard(newBoard);

          // Kuasai wilayah
          const newTerritory = territory.map((r) => [...r]);
          newTerritory[row][col] = turn;
          setTerritory(newTerritory);

          // Hitung coin per wilayah yang dikuasai setelah giliran
          const count1 = newTerritory.flat().filter((t) => t === 1).length;
          const count2 = newTerritory.flat().filter((t) => t === 2).length;
          setCoins((prev) => ({
            1: prev[1] + count1,
            2: prev[2] + count2,
          }));

          setTurn(turn === 1 ? 2 : 1);
        }
      }
      setSelected(null);
    } else {
      if (piece && piece.player === turn) {
        setSelected([row, col]);
      }
    }
  };

  const buyPiece = (player, type) => {
    if (coins[player] >= shopPrices[type]) {
      const newBoard = board.map((r) => [...r]);
      const baseRow = player === 1 ? 7 : 0;
      const emptyCol = newBoard[baseRow].findIndex((cell) => cell === null);
      if (emptyCol !== -1) {
        newBoard[baseRow][emptyCol] = { player, type };
        setBoard(newBoard);
        setCoins({ ...coins, [player]: coins[player] - shopPrices[type] });
      }
    }
  };

  return (
    <div className="flex flex-col items-center p-4 gap-4">
      <h1 className="text-2xl font-bold">Chess Economy Game</h1>
      <div className="grid grid-cols-8 border-2">
        {board.map((row, rIdx) =>
          row.map((cell, cIdx) => (
            <div
              key={`${rIdx}-${cIdx}`}
              onClick={() => handleCellClick(rIdx, cIdx)}
              className={`w-12 h-12 flex items-center justify-center cursor-pointer text-2xl border
                ${(rIdx + cIdx) % 2 === 0 ? "bg-gray-200" : "bg-green-600"}
                ${territory[rIdx][cIdx] === 1 ? "bg-blue-300" : ""}
                ${territory[rIdx][cIdx] === 2 ? "bg-red-300" : ""}
                ${selected && selected[0] === rIdx && selected[1] === cIdx ? "ring-4 ring-yellow-400" : ""}
              `}
            >
              {cell ? (
                <span className={cell.player === 1 ? "text-blue-600" : "text-red-600"}>
                  {pieceSymbols[cell.type]}
                </span>
              ) : null}
            </div>
          ))
        )}
      </div>

      <div className="flex gap-6">
        {[1, 2].map((p) => (
          <Card key={p} className="p-2 w-52">
            <CardContent className="flex flex-col items-center gap-2">
              <p className="font-bold">Player {p}</p>
              <p>Coins: {coins[p]}</p>
              <div className="flex flex-wrap gap-2 justify-center">
                {Object.keys(shopPrices).map((t) => (
                  <Button
                    key={t}
                    onClick={() => buyPiece(p, t)}
                    disabled={coins[p] < shopPrices[t]}
                  >
                    <span className={p === 1 ? "text-blue-600" : "text-red-600"}>
                      {pieceSymbols[t]}
                    </span>
                    {` (${shopPrices[t]}c)`}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <p className="mt-2">Giliran: Player {turn}</p>
    </div>
  );
}
