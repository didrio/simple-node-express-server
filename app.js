const express = require("express");
const helmet = require("helmet");
const socket = require("socket.io");
const socketHotel = require("socket.io-hotel");
const app = express();
const server = app.listen(3000, () => console.log("Server Connected"));
const io = socket(server);
const hotel = new socketHotel(io.sockets.adapter);
const socketClient = require("./node_modules/socket.io-client");
const client = socketClient.connect("http://localhost:3000");

app.use(helmet());
app.use(express.static("./public"));

io.on("connection", socket => {

  socket.leave(socket.id);

  updateRooms("isNew");

  function updateRooms(isNew) {
    hotel.listRooms(rooms => {
      var roomData = [];
      for (let id in rooms) {
        hotel.getPropertiesRoom(id, data => {
          roomData.push(data);
        });
      }
      socket.emit("addRooms", roomData);
      if (!isNew) {
        socket.broadcast.emit("addRooms", roomData);
      }
    });
  }

  socket.on("submitMessage", data => {
    messages = [];
    hotel.getPropertiesRoom(data.room, room => {
      if (room.messages) {
        messages = room.messages;
      }
    });
    messages.push({
      username: data.username,
      message: data.message
    });
    hotel.setPropertyRoom(data.room, "messages", messages, () => {});
    io.in(data.room).emit("updateMessages", messages);
    socket.emit("updateMessages", messages);
  });

  socket.on("joinRoom", name => {
    hotel.getPropertiesRoom(name, room => {
      if (room.password) {
        socket.emit("verifyPassword", name);
      } else {
        joinRoom(name);
      }
    });
  });

  function joinRoom(name) {
    if (socket.currentRoom) {
      socket.leave(socket.currentRoom);
    }
    socket.join(name);
    socket.currentRoom = name;
    hotel.getPropertiesRoom(name, room => {
      socket.emit("setupRoom", room);
    });
  }

  socket.on("attemptToJoin", data => {
    hotel.getPropertiesRoom(data.name, room => {
      if (data.password === room.password) {
        joinRoom(data.name);
      } else {
        socket.emit("passwordFail");
      }
    });
  });

  socket.on("clientJoinRoom", data => {
    socket.join(data[0].name);
    hotel.setPropertyRoom(data[0].name, "name", data[0].name, () => {});
    hotel.setPropertyRoom(data[0].name, "password", data[0].password, () => {});
    updateRooms();
    io.sockets.connected[data[1]].emit("socketJoin", data[0].name);
  });

  socket.on("socketJoinRoom", name => joinRoom(name));

  socket.on("createRoom", data => {
    hotel.getPropertiesRoom(data.name, room => {
      if (room) {
        socket.emit("roomTaken");
      } else {
        var array = [data];
        array.push(socket.id);
        client.emit("clientJoinRoom", array, () => {});
      }
    });
  });
});
