"use strict";

const socket = io.connect("http://localhost:3000"),
      createRoomButton = document.querySelector("#create-room-button"),
      createRoomModal = document.querySelector("#create-room-modal"),
      addRoomButton = document.querySelector("#add-room-button"),
      inputRoomName = document.querySelector("#input-room-name"),
      inputRoomPassword = document.querySelector("#input-room-password"),
      cancel = document.querySelector("#cancel"),
      createLabel = document.querySelector("#create-label"),
      nameLabel = document.querySelector("#name-label"),
      roomTabs = document.querySelector("#room-tabs"),
      passwordModal = document.querySelector("#password-modal"),
      passwordPrompt = document.querySelector("#password-prompt"),
      inputVerifyPassword = document.querySelector("#input-verify-password"),
      passwordJoinButton = document.querySelector("#password-join-button"),
      passwordCancel = document.querySelector("#password-cancel"),
      getStarted = document.querySelector("#get-started"),
      chatBox = document.querySelector("#chat-box"),
      messages = document.querySelector("#messages"),
      messagesUl = document.querySelector("#messages-ul"),
      inputChat = document.querySelector("#input-chat"),
      submitButton = document.querySelector("#submit-button"),
      username = document.querySelector("#user-name");

var roomForPassword;
var currentRoom;
var currentUsername = "Guest " + (Math.floor(Math.random() * (1000 - 1)) + 1);

username.innerHTML = ">&nbsp;&nbsp;&nbsp;" + currentUsername;

username.addEventListener("click", event => {
  username.innerHTML = "";
  const input = document.createElement("input");
  input.type = "text";
  input.id = "input-username";
  input.style.width = "90%";
  input.style.marginRight = "7%";
  input.addEventListener("click", event => {
    event.stopPropagation();
  });
  username.appendChild(input);
  const icon = document.createElement("i");
  icon.classList.add("fa");
  icon.classList.add("fa-check");
  icon.addEventListener("click", event => {
    event.stopPropagation();
    const inputUsername = document.querySelector("#input-username");
    if (inputUsername.value) {
      currentUsername = inputUsername.value;
      username.innerHTML = ">&nbsp;&nbsp;&nbsp;" + currentUsername;
    }
  });
  username.appendChild(icon);
});

socket.on("verifyPassword", name => {
  if (createRoomModal.style.display === "block") {
    createRoomModal.style.display = "none";
  }
  inputVerifyPassword.value = "";
  passwordPrompt.innerHTML = "This room requires a password to join.";
  passwordModal.style.display = "block";
  roomForPassword = name;
});

passwordJoinButton.addEventListener("click", event => {
  const data = {
    name: roomForPassword,
    password: inputVerifyPassword.value
  };
  socket.emit("attemptToJoin", data);
});

socket.on("setupRoom", room => {
  if (createRoomModal.style.display === "block") {
    createRoomModal.style.display = "none";
  } else if (passwordModal.style.display === "block") {
    passwordModal.style.display = "none";
  }
  if (getStarted.style.display !== "none") {
    getStarted.style.display = "none";
    chatBox.style.display = "flex";
    messages.style.display = "flex";
  }
  currentRoom = room.name;
  messagesUl.innerHTML = "";
  if (document.querySelector(".fa-circle")) {
    const icon = document.querySelector(".fa-circle");
    icon.parentNode.removeChild(icon);
  }
  document.getElementById(currentRoom).innerHTML += "<i style='padding-left: 10px; color: green' class='fa fa-circle' aria-hidden='true'></i>";
  if (room.messages) {
    renderMessages(room.messages);
  }
});

socket.on("socketJoin", name => socket.emit("socketJoinRoom", name));

function renderMessages(messages) {
  messages.forEach(data => {
    const message = document.createElement("li");
    message.classList.add("message");
    message.innerHTML = `<span style='font-weight: 700; padding-right: 10px'>${data.username}:</span> ${data.message}`;
    messagesUl.appendChild(message);
  });
}

socket.on("updateMessages", messages => {
  messagesUl.innerHTML = "";
  renderMessages(messages);
});

socket.on("hi", () => console.log("hi"));

submitButton.addEventListener("click", event => {
  if (inputChat.value) {
    const data = {
      room: currentRoom,
      username: currentUsername,
      message: inputChat.value
    };
    socket.emit("submitMessage", data);
    inputChat.value = "";
  }
});

document.addEventListener("keypress", event => {
  if (event.which === 13) {
    if (inputChat.value) {
      const data = {
        room: currentRoom,
        username: currentUsername,
        message: inputChat.value
      };
      socket.emit("submitMessage", data);
      inputChat.value = "";
    }
  }
});

socket.on("passwordFail", () => {
  inputVerifyPassword.value = "";
  passwordPrompt.innerHTML = "<span style='color: red'>That password was not correct.</span>";
});

createRoomButton.addEventListener("click", event => {
  if (passwordModal.style.display === "block") {
    passwordModal.style.display = "none";
  }
  createRoomModal.style.display = "block";
});

addRoomButton.addEventListener("click", event => {
  if (inputRoomName.value) {
    const data = {
      name: inputRoomName.value.trim(),
      password: inputRoomPassword.value
    };
    socket.emit("createRoom", data);
    createRoomModal.style.display = "none";
    inputRoomName.value = "";
    inputRoomPassword.value = "";
    nameLabel.innerHTML = "Name:"
    createLabel.innerHTML = "Create New Room:";
  } else {
    nameLabel.innerHTML = "Name: <span style='color: red'>Required</span>";
  }
});

cancel.addEventListener("click", event => {
  createRoomModal.style.display = "none";
  inputRoomName.value = "";
  inputRoomPassword.value = "";
  nameLabel.innerHTML = "Name:"
  createLabel.innerHTML = "Create New Room:";
});

passwordCancel.addEventListener("click", event => {
  passwordModal.style.display = "none";
  inputVerifyPassword.value = "";
  passwordPrompt.innerHTML = "This room requires a password to join.";
});

socket.on("addRooms", rooms => {
  roomTabs.innerHTML = "";
  rooms.forEach(room => {
    const roomTab = document.createElement("div");
    roomTab.classList.add("tab");
    roomTab.innerHTML = room.name;
    roomTab.id = room.name;
    if (room.password) {
      roomTab.innerHTML += "<i style='padding-left: 10px' class='fa fa-lock' aria-hidden='true'></i>";
    }
    roomTab.addEventListener("click", event => {
      socket.emit("joinRoom", room.name);
    });
    roomTabs.appendChild(roomTab);
  });
});

socket.on("roomTaken", () => {
  createRoomModal.style.display = "block";
  createLabel.innerHTML = "<span style='color: red'>A room with that name already exists</span>";
});
