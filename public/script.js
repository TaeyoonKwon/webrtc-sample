const socket = io("/");
const videoGrid = document.getElementById("video-grid");
// const myPeer = new Peer(undefined, {
//   host: "/",
//   port: "3001",
// });
const myPeer = new Peer();
const myVideo = document.createElement("video");
myVideo.muted = true;
const peers = {};
navigator.mediaDevices
  .getUserMedia({
    video: true,
    audio: false,
  })
  .then((stream) => {
    addVideoStream(myVideo, stream);

    myPeer.on("call", (call) => {
      call.answer(stream);
      const video = document.createElement("video");
      call.on("stream", (userVideoStream) => {
        addVideoStream(video, userVideoStream);
      });
    });

    socket.on("user-connected", (userId) => {
      connectToNewUser(userId, stream);
    });
  });

socket.on("user-disconnected", (userId) => {
  if (peers[userId]) peers[userId].close();
});

myPeer.on("open", (id) => {
  socket.emit("join-room", ROOM_ID, id);
});

function connectToNewUser(userId, stream) {
  const call = myPeer.call(userId, stream);
  const video = document.createElement("video");
  call.on("stream", (userVideoStream) => {
    addVideoStream(video, userVideoStream);
  });
  call.on("close", () => {
    video.parentNode.parentNode.removeChild(video.parentNode);
  });

  peers[userId] = call;
}

function addVideoStream(video, stream) {
  video.srcObject = stream;

  const videoWrapper = document.createElement("div");
  const logo = document.createElement("img");
  logo.src = "logo.png";

  videoWrapper.appendChild(video);
  videoWrapper.appendChild(logo);

  video.addEventListener("loadedmetadata", () => {
    video.play();
  });
  videoGrid.append(videoWrapper);
}

// chat messages

const myForm = document.querySelector("form");
const myName = document.getElementById("userName");
const myInput = document.getElementById("message");
const chatMessages = document.getElementById("chat-messages");

myForm.addEventListener("submit", (e) => {
  e.preventDefault();
  if (myName.value && myInput.value) {
    socket.emit("chat", myName.value, myInput.value);
    myInput.value = "";
  }
});

socket.on("chat", (userName, message) => {
  const messageDiv = document.createElement("div");
  messageDiv.innerText = userName + ":" + message;
  chatMessages.appendChild(messageDiv);
});
