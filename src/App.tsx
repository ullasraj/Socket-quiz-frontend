import React, { useEffect, useState } from 'react';
import './App.css';
import io from 'socket.io-client';
import { Box, Button, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField, Typography } from '@mui/material';
import Timer from './timer';

const socket = io("ws://localhost:5000");

function App() {
  const [rooms, setRooms] = useState<any[]>([]);
  const [info, setInfo] = useState<boolean>(false);
  const [activeRoomIndex, setActiveRoomIndex] = useState<number | null>(null);
  const [username, setUsername] = useState<string>("");
  const [waitingRoomData, setWaitingRoomData] = useState<any>({ enable: false, roomId: null, username: null });
  const [gameStarted, setGameStarted] = useState<boolean>(false);
  const [questionData, setQuestionData] = useState<any>({ question: null, options: [], timer: 0, roomId: null });
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [players, setPlayers] = useState<any[]>()
  const [resetTimer, setResetTimer] = useState<boolean>(true);

  useEffect(() => {
    socket.emit("available_rooms")
    socket.on("rooms", (rooms) => {
      setInfo(true);
      setRooms(rooms);
    });

    socket.on("waiting_room", ({ roomId, username }) => {
      setWaitingRoomData({ enable: true, roomId, username });
    });

    socket.on("game_start", ({ players }) => {
      setWaitingRoomData({ enable: false });
      setGameStarted(true);
    });

    socket.on("newQuestion", ({ question, options, timer, roomId }) => {
      console.log(question);
      setResetTimer(true);
      setTimeout(() => setResetTimer(false), 0);
      setQuestionData({ question, options, timer, roomId });
      setResetTimer(true);
      // After resetting the timer, disable the reset flag
      setTimeout(() => setResetTimer(false), 0);
    });

    socket.on("gameOver", ({ players }) => {
      console.log("called game over", players);
      setPlayers(players)
      setQuestionData({ question: null, options: [], timer: 10, roomId: 0 });
    });

    return () => {
      socket.off("rooms");
      socket.off("waiting_room");
      socket.off("game_start");
      socket.off("newQuestion");
      socket.off("gameOver");
    };
  }, []);

  const handleOptionClick = (option: string) => {
    setSelectedOption(option);
    if (questionData.roomId !== null) {
      socket.emit("submitAnswer", questionData.roomId, option);
    }
  };

  const handleClick = () => {
    if (activeRoomIndex !== null && username) {
      socket.emit("join_room", { roomId: activeRoomIndex, username });
      setActiveRoomIndex(null);
    }
  };

  const handleCreateRoom = () => {
    socket.emit("create_room");
  };

  const handleEnableUsername = (index: number) => {
    setActiveRoomIndex(index);
  };
  return (
    <div className="App">
      <p>Quiz Game</p>
      {info ? (
        <><p>Quiz Game Info</p>
          {waitingRoomData.enable ? (
            <p>Waiting in room {waitingRoomData.roomId} username {waitingRoomData.username}</p>
          ) : gameStarted ? (
            questionData.question ? (
              <Box
                sx={{
                  padding: '16px',
                  border: '1px solid #ddd',
                  borderRadius: '8px',
                  maxWidth: '600px',
                  margin: 'auto',
                }}
              >
                <Timer durationInSeconds={questionData.timer} resetTimer={resetTimer} />
                <Typography variant="h6" gutterBottom>
                  {questionData.question}
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                  {questionData.options.map((option: string, index: number) => (
                    <Button
                      key={index}
                      variant={selectedOption === option ? 'contained' : 'outlined'}
                      sx={{ marginBottom: '8px' }}
                      onClick={() => handleOptionClick(option)}
                    >
                      {option}
                    </Button>
                  ))}
                </Box>
              </Box>
            ) : null
          ) : (
            <>
              <Button variant="contained" disableElevation onClick={handleCreateRoom}>
                Create Room
              </Button>
              {rooms.map((room, index) => (
                activeRoomIndex === room.id ? (
                  <Box
                    key={index}
                    sx={{
                      padding: '16px',
                      margin: '8px 0',
                      border: '1px solid #ccc',
                      borderRadius: '4px',
                    }}
                  >
                    <TextField
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="Enter username"
                      fullWidth
                    />
                    <Button
                      variant="contained"
                      color="primary"
                      onClick={handleClick}
                      sx={{ marginTop: '8px' }}
                    >
                      Submit
                    </Button>
                  </Box>
                ) : (
                  <Box
                  key={index}
                  sx={{
                    padding: '16px',
                    margin: '8px 0',
                    border: '1px solid #ccc',
                    borderRadius: '4px',
                    cursor: room.isFull ? 'not-allowed' : 'pointer',
                    backgroundColor: room.isFull ? '#e0e0e0' : 'inherit',
                    '&:hover': {
                      backgroundColor: room.isFull ? '#e0e0e0' : '#f5f5f5',
                    },
                  }}
                  onClick={() => {
                    if (!room.isFull) {
                      handleEnableUsername(room.id);
                    }
                  }}
                >
                  <Typography>Room {room.id} {room.isFull ? "is full" : null}</Typography>
                </Box>
                
                )
              ))}
            </>
          )}
        </>
      ) : null}

      {players && players.length > 0 ? (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>
                  <Typography variant="h6">Username</Typography>
                </TableCell>
                <TableCell align="right">
                  <Typography variant="h6">Score</Typography>
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {players.map((player) => (
                <TableRow key={player.id}>
                  <TableCell component="th" scope="row">
                    {player.username}
                  </TableCell>
                  <TableCell align="right">{player.score}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      ) : null}
    </div>
  );
}

export default App;