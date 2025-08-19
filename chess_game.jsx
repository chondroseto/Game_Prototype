import React, { useState, useEffect } from 'react';

const initialBoard = [
  ['R','N','B','Q','K','B','N','R'],
  ['P','P','P','P','P','P','P','P'],
  [null,null,null,null,null,null,null,null],
  [null,null,null,null,null,null,null,null],
  [null,null,null,null,null,null,null,null],
  [null,null,null,null,null,null,null,null],
  ['P','P','P','P','P','P','P','P'],
  ['R','N','B','Q','K','B','N','R']
];

const pieceIcons = {
  'P': '♙', 'R': '♖', 'N': '♘', 'B': '♗', 'Q': '♕', 'K': '♔'
};

const pieceCosts = { 'P': 5, 'R': 20, 'N': 20, 'B': 20, 'Q': 50, 'K': 100 };
const cellSize = 60;

export default function Chess() {
  const [board, setBoard] = useState(initialBoard);
  const [selected, setSelected] = useState(null);
  const [tileOwners, setTileOwners] = useState(Array(8).fill(null).map(() => Array(8).fill(null)));
  const [turn, setTurn] = useState('player1');
  const [coins, setCoins] = useState({ player1: 0, player2: 0 });

  useEffect(() => {
    const initialOwners = tileOwners.map(r => [...r]);
    for (let row = 0; row < 2; row++) {
      for (let col = 0; col < 8; col++) {
        if (board[row][col]) initialOwners[row][col] = 'player1';
      }
    }
    for (let row = 6; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        if (board[row][col]) initialOwners[row][col] = 'player2';
      }
    }
    setTileOwners(initialOwners);
  }, []);

  useEffect(() => {
    const countPlayer1 = tileOwners.flat().filter(owner => owner === 'player1').length;
    const countPlayer2 = tileOwners.flat().filter(owner => owner === 'player2').length;

    setCoins(prev => ({
      player1: prev.player1 + countPlayer1,
      player2: prev.player2 + countPlayer2
    }));
  }, [turn]);

  const isValidMove = (piece, fromRow, fromCol, toRow, toCol) => {
    const target = board[toRow][toCol];
    const isWhite = fromRow < 4;
    if ((turn === 'player1' && !isWhite) || (turn === 'player2' && isWhite)) return false;
    if (target && ((isWhite && target === target.toUpperCase()) || (!isWhite && target !== target.toUpperCase()))) return false;

    const dr = toRow - fromRow;
    const dc = toCol - fromCol;

    switch(piece.toUpperCase()) {
      case 'P':
        const dir = isWhite ? 1 : -1;
        if (dc === 0 && !target && dr === dir) return true;
        if (dc === 0 && !target && dr === 2*dir && ((isWhite && fromRow === 1) || (!isWhite && fromRow === 6)) && !board[fromRow + dir][fromCol]) return true;
        if (Math.abs(dc) === 1 && dr === dir && target) return true;
        return false;
      case 'R':
        if (dr === 0 || dc === 0) {
          const stepR = dr === 0 ? 0 : dr/Math.abs(dr);
          const stepC = dc === 0 ? 0 : dc/Math.abs(dc);
          let r = fromRow + stepR, c = fromCol + stepC;
          while (r !== toRow || c !== toCol) {
            if (board[r][c]) return false;
            r += stepR; c += stepC;
          }
          return true;
        }
        return false;
      case 'N':
        return (Math.abs(dr) === 2 && Math.abs(dc) === 1) || (Math.abs(dr) === 1 && Math.abs(dc) === 2);
      case 'B':
        if (Math.abs(dr) === Math.abs(dc)) {
          const stepR = dr/Math.abs(dr);
          const stepC = dc/Math.abs(dc);
          let r = fromRow + stepR, c = fromCol + stepC;
          while (r !== toRow && c !== toCol) {
            if (board[r][c]) return false;
            r += stepR; c += stepC;
          }
          return true;
        }
        return false;
      case 'Q':
        if (dr === 0 || dc === 0 || Math.abs(dr) === Math.abs(dc)) {
          const stepR = dr === 0 ? 0 : dr/Math.abs(dr);
          const stepC = dc === 0 ? 0 : dc/Math.abs(dc);
          let r = fromRow + stepR, c = fromCol + stepC;
          while (r !== toRow || c !== toCol) {
            if (board[r][c]) return false;
            r += stepR; c += stepC;
          }
          return true;
        }
        return false;
      case 'K':
        return Math.abs(dr) <= 1 && Math.abs(dc) <= 1;
      default:
        return false;
    }
  };

  const handleCellClick = (row, col) => {
    if (selected) {
      const piece = board[selected.row][selected.col];
      if (isValidMove(piece, selected.row, selected.col, row, col)) {
        const newBoard = board.map(r => [...r]);
        newBoard[row][col] = piece;
        newBoard[selected.row][selected.col] = null;
        setBoard(newBoard);

        const newOwners = tileOwners.map(r => [...r]);
        newOwners[row][col] = turn;
        setTileOwners(newOwners);

        setTurn(turn === 'player1' ? 'player2' : 'player1');
      }
      setSelected(null);
    } else if (board[row][col]) {
      setSelected({ row, col });
    }
  };

  const handleBuyPiece = (pieceType) => {
    if (coins[turn] < pieceCosts[pieceType]) return;
    const spawnRows = turn === 'player1' ? [0,1] : [6,7];
    const emptyCells = [];
    spawnRows.forEach(row=>{
      board[row].forEach((cell,col)=>{
        if(!cell) emptyCells.push([row,col]);
      });
    });
    if(emptyCells.length===0) return;
    const [r,c] = emptyCells[Math.floor(Math.random()*emptyCells.length)];
    const newBoard = board.map(r=>[...r]);
    newBoard[r][c] = pieceType;
    setBoard(newBoard);

    const newOwners = tileOwners.map(r=>[...r]);
    newOwners[r][c] = turn;
    setTileOwners(newOwners);

    setCoins(prev=>({...prev,[turn]: prev[turn]-pieceCosts[pieceType]}));
  };

  const boardStyle = { display: 'inline-block', border: '2px solid #333', marginBottom: 20, backgroundColor: '#ffffff' };
  const rowStyle = { display: 'flex' };
  const cellStyle = (row, col, isSelected) => {
    const owner = tileOwners[row][col];
    let bgColor = (row + col) % 2 === 0 ? '#f0d9b5' : '#b58863';
    if (owner === 'player1') bgColor = '#4da6ff';
    if (owner === 'player2') bgColor = '#ff4d4d';
    return { width: cellSize, height: cellSize, display:'flex',justifyContent:'center',alignItems:'center',fontSize:40,cursor:'pointer',backgroundColor:bgColor,outline:isSelected?'3px solid yellow':'none'};
  };

  return (
    <div style={{backgroundColor:'#ffffff', padding:10}}>
      <div style={{marginBottom:10}}>
        <strong>Player 1 Coins:</strong> {coins.player1} | <strong>Player 2 Coins:</strong> {coins.player2}
      </div>
      <div style={{marginBottom:10}}>
        {['P','R','N','B','Q','K'].map(p=>
          <button key={p} onClick={()=>handleBuyPiece(p)} style={{marginRight:5}}>{pieceIcons[p]} {pieceCosts[p]}</button>
        )}
      </div>
      <div style={boardStyle}>
        {board.map((rowData,row)=>(
          <div key={row} style={rowStyle}>
            {rowData.map((piece,col)=>(
              <div key={col} style={cellStyle(row,col,selected&&selected.row===row&&selected.col===col)} onClick={()=>handleCellClick(row,col)}>
                {piece && <span>{pieceIcons[piece.toUpperCase()]}</span>}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
