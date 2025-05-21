const express = require('express');
const http = require('http');
const socketIO = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIO(server);

const PORT = process.env.PORT || 3000;

let waitingPlayer = null;

io.on('connection', (socket) => {
  console.log('New player onnected:', socket.id);

  if (waitingPlayer) {
    // Match found
    const player1 = waitingPlayer;
    const player2 = socket;
    const room = `room-${player1.id}-${player2.id}`;
    
    player1.join(room);
    player2.join(room);

    io.to(room).emit('message', 'Match found!');

    let moves = {};

    const handleMove = (player, move) => {
      moves[player.id] = move;

      if (moves[player1.id] && moves[player2.id]) {
        const result = getResult(moves[player1.id], moves[player2.id]);
        io.to(room).emit('result', {
          player1: moves[player1.id],
          player2: moves[player2.id],
          outcome: result
        });
        moves = {};
      }
    };

    player1.on('move', (move) => handleMove(player1, move));
    player2.on('move', (move) => handleMove(player2, move));

    player1.on('disconnect', () => {
      io.to(room).emit('message', 'Player 1 disconnected');
    });

    player2.on('disconnect', () => {
      io.to(room).emit('message', 'Player 2 disconnected');
    });

    waitingPlayer = null;
  } else {
    waitingPlayer = socket;
    socket.emit('message', 'Waiting for an opponent...');
  }
});

function getResult(p1, p2) {
  if (p1 === p2) return 'Draw';
  if (
    (p1 === 'rock' && p2 === 'scissors') ||
    (p1 === 'scissors' && p2 === 'paper') ||
    (p1 === 'paper' && p2 === 'rock')
  ) {
    return 'Player 1 wins';
  }
  return 'Player 2 wins';
}

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
