const express = require("express");
const http = require("http");
const app = express();
const server = http.createServer(app);
const socket = require("socket.io");
const io = socket(server);
const cors = require("cors");
require('dotenv').config()

const rooms = {};
const roles = [];

app.use(cors());

io.on("connection", socket => {
    socket.on("join room", roomID => {
        if (rooms[roomID]) {
            rooms[roomID].push(socket.id);
        } else {
            rooms[roomID] = [socket.id];
        }
        const otherUser = rooms[roomID].find(id => id !== socket.id);
        if (otherUser) {
            socket.emit("other user", otherUser);
            socket.to(otherUser).emit("user joined", socket.id);
        }
    });

    console.log(rooms);

    socket.on("update roles", role => {
        roles.push(role);
    });

    socket.on("get roles", sender => {
        io.to(sender).emit("get roles", roles);
    });

    socket.on("get rooms", sender => {
        console.log(sender);
        io.to(sender).emit("get rooms", rooms);
    });

    socket.on("offer", payload => {
        io.to(payload.target).emit("offer", payload);
    });

    socket.on("answer", payload => {
        io.to(payload.target).emit("answer", payload);
    });

    socket.on("ice-candidate", incoming => {
        io.to(incoming.target).emit("ice-candidate", incoming.candidate);
    });
});

server.listen(8000, process.env.REACT_APP_IP,  () => console.log('server is running on port 8000'));
