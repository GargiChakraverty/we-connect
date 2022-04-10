// let socket = io();

// canvas element
let canvas = $("canvas")[0];
let colors = $(".color");
let clearb = $("#clear");
let eraser = $("#eraser");

//The canvas is initially blank. To display something, a script first needs to access the rendering context
// and draw on it.The < canvas > element has a method called getContext(), 
//used to obtain the rendering context and its drawing functions.getContext() 
//takes one parameter, the type of context.

let context = canvas.getContext('2d');

// background color is made white
context.fillStyle = "white";
//the dimensions of the canvas 
context.fillRect(0, 0, canvas.width, canvas.height);

let current = {
  color: 'black',
  lineWidth: 2
};
let drawing = false;
let erasing = false;

canvas.addEventListener('mousedown', onMouseDown, false);
canvas.addEventListener('mouseup', onMouseUp, false);
canvas.addEventListener('mouseout', onMouseUp, false);
canvas.addEventListener('mousemove', throttle(onMouseMove, 10), false);

//Touch support for mobile devices
canvas.addEventListener('touchstart', onMouseDown, false);
canvas.addEventListener('touchend', onMouseUp, false);
canvas.addEventListener('touchcancel', onMouseUp, false);
canvas.addEventListener('touchmove', throttle(onMouseMove, 10), false);

//adding a event listener for click events to each pencil color div 
for (let i = 0; i < colors.length; i++) {
  //color of 
  colors[i].addEventListener('click', onColorUpdate, false);
}

//recieving the drawing event from server and caliing the draweventfunc.
socket.on('drawing', onDrawingEvent);

function drawLine(x0, y0, x1, y1, color, emit) {
  //starting a new path by emptying the list of subpaths in canvas
  context.beginPath();
  //intial coordiantes for line
  context.moveTo(x0, y0);
  //final coordinates of line
  context.lineTo(x1, y1);
  //color of line
  context.strokeStyle = color;
  //thickness of line
  context.lineWidth = 2;
  //drawing it
  context.stroke();
  //closing the path
  context.closePath();
  //to prevent an infinite loop

  if (!emit) { return; }
  let w = canvas.width;
  let h = canvas.height;

  //sending the data to server side for emitting to other users..
  socket.emit('drawing', {
    x0: x0 / w,
    y0: y0 / h,
    x1: x1 / w,
    y1: y1 / h,
    color: color,
    lineWidth: current.lineWidth
  });
}


// Event Listeners for Drawing
//when a user presses down the mouse
function onMouseDown(e) {
  //selecting the whiteboard and calculating the X and Y offset
  let canvasOffset = $(".whiteboard").offset();
  let offsetX = canvasOffset.left;
  let offsetY = canvasOffset.top;
  console.log(offsetX, offsetY);

  drawing = true;
  //giving the starting coordinates wrt to the canvas for drawing purpose.
  current.x = parseInt(e.clientX - offsetX);
  current.y = parseInt(e.clientY - offsetY);
  console.log(current);
}

//After dragging the mouse(ie after mousedown)-->mousemove-->mousedown 
//this event fired for the last line joining 2 points.
function onMouseUp(e) {
  //finding the coordinates for canvas
  let canvasOffset = $(".whiteboard").offset();
  let offsetX = canvasOffset.left;
  let offsetY = canvasOffset.top;
  console.log(offsetX, offsetY);
  //if no drawing happened return else set drawing to its default false value
  if (!drawing) { return; }
  drawing = false;
  //finding the current position of mouse so that we can draw a line from initial to ending position.
  let x = parseInt(e.clientX - offsetX);
  let y = parseInt(e.clientY - offsetY);
  //drawing the line
  drawLine(current.x, current.y, x, y, current.color, true);
}

//when mouse is being dragged and pressed small lines are being joined to give the big line
function onMouseMove(e) {
  if (!drawing) { return; }

  // let canvasOffset = $("#canvas").offset();
  let canvasOffset = $(".whiteboard").offset();
  let offsetX = canvasOffset.left;
  let offsetY = canvasOffset.top;
  let x = parseInt(e.clientX - offsetX);
  let y = parseInt(e.clientY - offsetY);

  drawLine(current.x, current.y, x, y, current.color, true);
  current.x = x;
  current.y = y;
}


let color_map = {
  "black": "black",
  "red": "red",
  "blue": "#3498db",
  "green": "green",
  "yellow": "rgb(253, 236, 0)",
  "orange": "#e67e22",
  "purple": "#9b59b6",
  "pink": "#fd79a8",
  "brown": "#834c32",
  "grey": "rgb(194, 194, 194)"
};

//event for changing color of pencil
function onColorUpdate(e) {
  //class name for the div :- 'color color-name' so changing the pencil color to event color_name.
  current.color = color_map[e.target.className.split(' ')[1]];
  document.querySelector(
    ".whiteboard"
  ).style = `cursor: unset;`;
  current.lineWidth = 2;
}


//to limit the number of events per second
function throttle(callback, delay) {
  let previousCall = new Date().getTime();
  return function () {
    let time = new Date().getTime();
    //call onMouseMove if the delay time limit crossed.
    if ((time - previousCall) >= delay) {
      previousCall = time;
      callback.apply(null, arguments);
    }
  };
}

// socket event, collaborative whiteboard function called to refelct changes made in whiteboard. fo other users.
function onDrawingEvent(data) {
  let w = canvas.width;
  let h = canvas.height;
  drawLine(data.x0 * w, data.y0 * h, data.x1 * w, data.y1 * h, data.color);
}


// review later
// make the canvas fill its parent
function onResize() {
  // let ww = $("#canvas").parent().width();
  // let hh = $("#canvas").parent().height();
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}


// eraser functionality
// improve in terms of pen width
function setEraser() {
  current.color = "white";
  document.querySelector(
    ".whiteboard"
  ).style = `cursor:url('../Images/erase.png'),auto;`;
  current.lineWidth = 10;
}

//clear board
function clearBoard() {
  context.clearRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = "white";
  context.fillRect(0, 0, canvas.width, canvas.height);
  //now emit the same for ohter users.on server.
  socket.emit('clearBoard');
}

//event recieved from server to clear board.
socket.on('clearBoard', () => {
  context.clearRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = "white";
  context.fillRect(0, 0, canvas.width, canvas.height);
})

//func to download the whiteboard image.
function download_wb() {
  //A DOMString containing the requested data URI is stored in image
  let image = canvas.toDataURL("image/jpg");
  //creating an anchor tag with download attribute
  let file = document.createElement('a');
  //file will be downloaded as the given name below.

  file.download = "meeting_whiteboard.jpeg";
  file.href = image;
  //mouse click 
  file.click();
}