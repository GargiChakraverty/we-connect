const socket = io('/');

// leave meting option stays hidden until we join the meet
$(".leave").hide();

//options such as whiteboard, participant videos and notepad are hidden until we join the meeting
$(".options-btn").hide();

//option which shows the room id to share to other participants
$(".share-code-btn").hide();

//using jquery selector, selecting the participant video div, whitboard div and notepad div
const d1_pv = $("#d1-pv");
const d2_wb = $("#d2-wb");
const d3_np = $("#d3-np");

let init_canvas_state;
let init_editor_state;

//preVideo -> participant's video before joining the call, videosGrid -> Videos of all the participants
const preVideo = $("#my-video");
const videosGrid = $("#videos-grid");

let username;
let myVideoStream;
let myVideo = document.createElement('video');
myVideo.muted = true;


// Peer JS Setup
// creating the peer object
let peer = new Peer(undefined, {
  //The path where your self-hosted PeerServer is running. Defaults to '/'
  path: '/peerjs',
  //server host
  host: '/',
  //server port default is 443
  port: '443',
  //true if you're using SSL.
  secure: true
});
let peers = {};

// Appending User Videos
function addVideoStream(video, stream, element) {
  //id for storing the videos will be either pre-Video id or the Videos-grid id 
  element = element || videosGrid;
  //setting the source of media of my video element to be the stream of my  video and audio passed.
  video.srcObject = stream
  //when all the metadeta related to my video element has been laoded then this event listener is fired so that my video starts playing
  video.addEventListener('loadedmetadata', () => {
    video.play()
  })
  //apppending the video element to our video-grid.
  element.append(video);
}

// mic, camera vaaste permissions
navigator.mediaDevices.getUserMedia({

  video: true,
  audio: true
}).then((stream) => {
  myVideoStream = stream;
  // adding my video to the video-grid 
  addVideoStream(myVideo, stream, preVideo);

  // when a new user connects to the server the user is called.
  socket.on('user-connected', (userId) => {
    callNewUser(userId, myVideoStream);
  })

  //Emitted when a remote peer attempts to call you. The emitted mediaConnection is not yet active; 
  //you must first answer the call(mediaConnection.answer([stream]);).
  //Then, you can listen for the stream event.
  peer.on('call', (call) => {
    //call is the mediaconnection of the remote peer trying to connect with me.
    //answering that stream with our media stream.
    call.answer(myVideoStream);
    //creating a video element for their media stream
    let video = document.createElement('video');
    //lsitening for their stream and adding it to the video grid of the room.
    call.on('stream', (userVideoStream) => {
      addVideoStream(video, userVideoStream);
    })
  })

  // chat messages functionlity
  let msg_text = $("#apna_msg");
  // When the user enter a message
  $('html').keydown(function (e) {
    //if the user's message is of length>0 and the user enter the "enter key"
    if (e.which == 13 && msg_text.val().length !== 0) {
      //message event emiited and the server.js file recieves the event and emits it to all the user line 96.
      socket.emit('message', msg_text.val(), username);
      //emptying the message area.
      msg_text.val('');
    }
  });

  //when the user recieves a new message
  socket.on("createMessage", (message, un) => {
    //if the message is from themsleves show name as 'You'.
    if (un == username && username != "A User") {
      un = "You";
    }
    //appending the message to the chatbox.
    $(".messages").append(`<li class="message"><b>${un}</b><br/>${message}</li>`);
    scrollToBottom();
  })

}).catch((er) => {
  //appending the message to the chatbox.
  window.console.log("Error in getting audio-video streams.");
  let div = document.createElement('div');
  div.style.textAlign = 'center';
  div.innerText = "Please allow access to camera and microphone and reload the page to allow the app to run properly!";
  document.getElementsByClassName("hide-later")[0].appendChild(div);
})


// fn to connect w/ a new incoming user
function callNewUser(userId, stream) {
  //Calls the remote peer specified by id and returns a media connection.
  let call = peer.call(userId, stream);
  let video = document.createElement('video')
  // vo call answer karega apni video stream ke saath
  //call is the data/media connection to which we add the listener 
  call.on('stream', (userVideoStream) => {
    addVideoStream(video, userVideoStream);
  })
  call.on('close', () => {
    video.remove();
  })

  peers[userId] = call;
}


// disconnect/ meeting left
socket.on('user-disconnected', (userId) => {
  if (peers[userId]) peers[userId].close();
})


//Emitted once a peer connection to the PeerServer is established.
//id is the brokering ID of the peer(which was assigned by the server).
peer.on('open', (id) => {
  //prevideo click event
  $("#enter-btn").click((e) => {
    //if username not defined user assigned name 'A user'
    username = $("#username").val() || "A User";

    videosGrid.append($("#my-video > video"));
    //hide the prevideo div after connecting to the room
    $(".hide-later").hide();
    // $("nav").hide();
    $("body").css("background-color", "rgba(72, 216, 221, 0.801)");
    //show the all the video-grid,notepad,whiteboard and chat components.
    $(".show-later").show();
    //leave meeting button shown
    $(".leave").show();
    //option button for notepad,whiteboard and participant video toggling.
    $(".options-btn").show();
    //show the button for sharing room code.
    $(".share-code-btn").show();
    //room id was obtained from room.ejs earlier
    socket.emit('join-room', room_id, id, username);
  })
})

//function to scroll to the bottom of the chatbox
function scrollToBottom() {
  //selecting the div for the chatbox
  let d = $('.main_chat_window');
  //to scroll to the bottom of the chatbox div
  d.scrollTop(d.prop("scrollHeight"));
}


// Control Bar Functions
function mute_Unmute_my_Mic() {
  //knowing the state of my audio
  let enabled = myVideoStream.getAudioTracks()[0].enabled;
  //if my audio is on change html to mute
  if (enabled) {
    myVideoStream.getAudioTracks()[0].enabled = false;
    //changing my display button to unmute
    setUnmuteButton();
  } else {
    //changing my button to mute
    setMuteButton();
    myVideoStream.getAudioTracks()[0].enabled = true;
  }
}

function play_Stop_my_Video() {
  //knowing the state of my video
  let enabled = myVideoStream.getVideoTracks()[0].enabled;
  //if my video is then change html to stop playing
  if (enabled) {
    myVideoStream.getVideoTracks()[0].enabled = false;
    // myVideoStream.getVideoTracks()[0].stop();
    setPlayVideo();
  } else {
    setStopVideo();
    myVideoStream.getVideoTracks()[0].enabled = true;
  }
}

//changing the html code for muting audio
const setMuteButton = () => {
  let html = `
    <i class="fas fa-microphone"></i>
    <span>Mute</span>
  `
  document.querySelector('.mute-btn').innerHTML = html;
}

//changing the html code for unmuting audio
const setUnmuteButton = () => {
  const html = `
    <i class="unmute-btn fas fa-microphone-slash"></i>
    <span>Unmute</span>
  `
  document.querySelector('.mute-btn').innerHTML = html;
}

//changing the html code for stoping the  audio
const setStopVideo = () => {
  const html = `
    <i class="fas fa-video"></i>
    <span>Turn Off Video</span>
  `
  document.querySelector('.video-btn').innerHTML = html;
}

//changing the html code for playing the video
const setPlayVideo = () => {
  const html = `
  <i class="stop-btn fas fa-video-slash"></i>
    <span>Play Video</span>
  `
  document.querySelector('.video-btn').innerHTML = html;
}


// Control Bar Event Listeners 
$(".leave").click((e) => {
  location.reload();
})

//toggles the options button div 
function show_options() {
  $(".options").toggle();
}

function show_code() {
  $(".meet-code-div").toggle();
  if ($(".meet-code-div").is(":hidden")) {
    $("#copy-code-btn").prop("background-color", "rgb(0, 132, 255)");
    $("#copy-code-btn").text("Copy");
  }
}

//click event added to the share code btn
$("#copy-code-btn").click(function (e) {
  let copyTextarea = document.getElementById("code");
  console.log(copyTextarea);
  let text = copyTextarea.innerText;
  //copying the code to our system clipboard
  navigator.clipboard.writeText(text).then(function () {
    console.log('Async: Copying to clipboard was successful!');
    $("#copy-code-btn").text("Copied!");
  }, function (err) {
    console.error('Async: Could not copy text: ', err);
  });


})

//when we click participant video then hide whiteboard div, notepad div,option div
$("#l1-pv").click(() => {
  d3_np.hide();
  d2_wb.hide();
  d1_pv.show();
  $(".options").hide();
})

//when we click whiteboard then hide participant div, notepad div,option div
$("#l2-wb").click(() => {
  d3_np.hide();
  d1_pv.hide();
  d2_wb.show();
  $(".options").hide();
})

//when we click notepad then hide participant div, whiteboard div,option div
$("#l3-np").click(() => {
  d2_wb.hide();
  d1_pv.hide();
  d3_np.show();
  $(".options").hide();

  let ifr = document.getElementsByTagName("iframe")[0];
  let toolbar = document.getElementById("cke_1_top");

  //When changes are made to the editor then event 'editor change' is emitted and socket in server.js recieves this event and emits 
  //the rest of the people in that room.
  console.log(ifr);
  ifr.contentDocument.body.onkeydown = function () {
    // alert("Change aayo hai!");
    let saamaan = ifr.contentDocument.body.innerHTML;
    // console.log(saamaan);
    socket.emit('editor-change', saamaan);
  }

  toolbar.onclick = function () {
    // alert("Change aayo hai!");
    let saamaan = ifr.contentDocument.body.innerHTML;
    // console.log(saamaan);
    socket.emit('editor-change', saamaan);
  }
})

socket.on('editor-update-kar-rey', (saamaan) => {
  let ifr = document.getElementsByTagName("iframe")[0];
  ifr.contentDocument.body.innerHTML = saamaan;
})
