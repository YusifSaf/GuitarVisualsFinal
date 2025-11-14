let midiAccess;
let activeNotes = {}; // currently pressed notes
let shapes = [];
let numShapes = 36;
// MIDI key mapping (choose 25 consecutive keys)
let midiStartNote = 36; // C2
let midiEndNote = midiStartNote + numShapes - 1;
let noteToShape = [];

let xR = 0;
let yR = 0;
let zR = 0;
let worldRotationSpeed = 0.0005;

// //Camera Animation
// let camX;
// let camY;    
// let camZ;
// let cameraDistance = 500;
// let angle = 0;

let size = 200;
let minLerpSpeed = 0.2;

function setup() {
  createCanvas(windowWidth, windowHeight, WEBGL);
  angleMode(DEGREES);
  colorMode(HSB);
  noStroke();
  setupMIDI();

  // cam = createCamera();
  // cam.move(0, -50, -50);
  // cam.lookAt(0, 0, 0);
  // tint(255, 0); 

  //helper variables
  let i = 0;
  for (let zAngle=0; zAngle<180; zAngle += 30){
    noteToShape[zAngle/30] = []
    for (let xAngle=0; xAngle<360; xAngle += 30){
      noteToShape[zAngle/30][xAngle/30] = {
        midiNumber: midiStartNote + i,
        currentSize: 0,
        targetSize: 0,
        color: color(random(0, 360), random(60, 80), random(70, 90)),
      } 
      i++;
    }
  }
}

function draw() {
  background(240, 39, 7);
  directionalLight(255, 255, 255, 0.5, 1, -0.5);
  ambientLight(60);
  orbitControl();


  for (let zAngle=0; zAngle<180; zAngle += 30){
    xR += worldRotationSpeed;
    yR += worldRotationSpeed;
    zR += worldRotationSpeed;
    for (let xAngle=0; xAngle<360; xAngle += 30){
      let currentCycleCube = noteToShape[zAngle/30][xAngle/30];
      let note = currentCycleCube.midiNumber;

      let lerpSpeed = minLerpSpeed;

      if(note in activeNotes){
        currentCycleCube.targetSize = map(activeNotes[note], 0, 127, 0, size);
        lerpSpeed = minLerpSpeed * map(activeNotes[note], 0, 127, 1, 5); //Lerp speed depend on note velocity (How fast u pressed the note)
        console.log(lerpSpeed); 
      }
      else{
        currentCycleCube.targetSize = 0;
      }

      //Cube animation(lerping)
      currentCycleCube.currentSize = lerp(currentCycleCube.currentSize, currentCycleCube.targetSize, lerpSpeed);

      push();
      rotateZ(zAngle);
      rotateX(xAngle); //Why rotateX and not rotateY
      translate(0, 300, 0);
      fill(currentCycleCube.color); //to change the color later on
      box(currentCycleCube.currentSize);
      pop();

      // camX = cameraDistance * cos(angle);
      // camY = 100 * sin(angle * 2);
      // camZ = cameraDistance * sin(angle);
      // angle += 0.1
      // camera(camX, camY, camZ, 0, 0, 0, 0, 1, 0)

      rotateX(xR);
      rotateY(yR);
      rotateZ(zR);
    }
  }
}

// ---------------- MIDI FUNCTIONS ----------------
function setupMIDI() {
  if (navigator.requestMIDIAccess) {
    navigator.requestMIDIAccess().then(onMIDISuccess, onMIDIFailure);
  } else {
    console.log("No MIDI support in this browser.");
  }
}

function onMIDISuccess(midi) {
  midiAccess = midi;
  const inputs = midiAccess.inputs.values();
  for (let input of inputs) {
    input.onmidimessage = handleMIDIMessage;
  }
}

function onMIDIFailure() {
  console.log("Could not access MIDI devices.");
}

function handleMIDIMessage(message) {
  let [command, note, velocity] = message.data;

  if (command === 144 && velocity > 0) { // note on
      activeNotes[note] = velocity;
      //Inefficient version
      // activeNotes.push(note); 
      // activeNoteVelocities.push(velocity);
  } else if ((command === 128) || (command === 144 && velocity === 0)) { // note off
    delete activeNotes[note];
    //Inefficient version
    // let index = activeNotes.indexOf(note);
    // if (index > -1) activeNotes.splice(index, 1);
  }
}

//Reference
// ---------------- DRAW ----------------
// function draw() {
//   background(20);

//   for (let i = 0; i < shapes.length; i++) {
//     let s = shapes[i];

//     // Reset scale factor
//     s.scaleFactor = 1;

//     // Check if the corresponding MIDI key is pressed
//     let note = midiStartNote + i;
//     if (activeNotes.includes(note)) {
//       s.scaleFactor = 2; // scale up on key press
//       // optional: change color when pressed
//       s.currentColor = [random(150,255), random(50,255), random(50,255)];
//     } else {
//       s.currentColor = s.baseColor;
//     }

//     push();
//     translate(s.pos.x, s.pos.y, s.pos.z);
//     fill(...s.currentColor);
//     noStroke();
//     if (s.type === 'cube') box(s.size * s.scaleFactor);
//     else if (s.type === 'triangle') {
//       // simple pyramid
//       beginShape();
//       vertex(0, -s.size/2 * s.scaleFactor, 0);
//       vertex(-s.size/2 * s.scaleFactor, s.size/2 * s.scaleFactor, -s.size/2 * s.scaleFactor);
//       vertex(s.size/2 * s.scaleFactor, s.size/2 * s.scaleFactor, -s.size/2 * s.scaleFactor);
//       vertex(0, s.size/2 * s.scaleFactor, s.size/2 * s.scaleFactor);
//       endShape(CLOSE);
//     }
//     pop();
//   }
// }
  

