let midiAccess;
let activeNotes = []; // currently pressed notes
let shapes = [];
let numShapes = 25;
// MIDI key mapping (choose 25 consecutive keys)
let midiStartNote = 36; // C2
let midiEndNote = midiStartNote + numShapes - 1;

let numCubes = 25;
let size = 50;
let randomX = [];
let randomY = [];
let positions = [];
function setup(){
  createCanvas(windowWidth, windowHeight, WEBGL);
  // setupMIDI();

  for(let i=0; i<numCubes; i++){
    let position = {
      x: random(-500, 500),
      y: random(-500, 500),
    }
    let overlapping = false;

    for(let j=0; j<positions.length; j++){
      let d = dist(position.x, position.y, positions[j].x, positions[j].y);
      if (d < size * 1.5){
        //boxes are overlapping
        overlapping = true;
        break;
      }
    }
    if (!overlapping){
      positions.push(position); //put this before or after let j loop?
    }
  }
}

function draw(){
  background(50);
  orbitControl();
  for(let i=0; i<positions.length; i++){
    push();
    translate(positions[i].x, positions[i].y);
    box(size);
    pop();
  }
}

// // ---------------- MIDI FUNCTIONS ----------------
// function setupMIDI() {
//   if (navigator.requestMIDIAccess) {
//     navigator.requestMIDIAccess().then(onMIDISuccess, onMIDIFailure);
//   } else {
//     console.log("No MIDI support in this browser.");
//   }
// }

// function onMIDISuccess(midi) {
//   midiAccess = midi;
//   const inputs = midiAccess.inputs.values();
//   for (let input of inputs) {
//     input.onmidimessage = handleMIDIMessage;
//   }
// }

// function onMIDIFailure() {
//   console.log("Could not access MIDI devices.");
// }

// function handleMIDIMessage(message) {
//   let [command, note, velocity] = message.data;

//   if (command === 144 && velocity > 0) { // note on
//     if (!activeNotes.includes(note)) activeNotes.push(note);
//   } else if ((command === 128) || (command === 144 && velocity === 0)) { // note off
//     let index = activeNotes.indexOf(note);
//     if (index > -1) activeNotes.splice(index, 1);
//   }
// }

// // 🎹 MIDI + 3D Shapes Template
// let midiAccess;
// let activeNotes = []; // currently pressed notes
// let shapes = [];
// let numShapes = 25;

// // MIDI key mapping (choose 25 consecutive keys)
// let midiStartNote = 36; // C2
// let midiEndNote = midiStartNote + numShapes - 1;

// function setup() {
//   createCanvas(windowWidth, windowHeight, WEBGL);
//   orbitControl();

//   // Setup MIDI
//   setupMIDI();

//   // Create 25 random shapes
//   for (let i = 0; i < numShapes; i++) {
//     shapes.push({
//       pos: createVector(random(-800, 800), random(-400, 400), random(-800, 800)),
//       type: random(['cube','triangle']),
//       baseColor: [random(50,255), random(50,255), random(50,255)],
//       size: random(50,150),
//       scaleFactor: 1 // current scale factor
//     });
//   }
// }

// // ---------------- MIDI FUNCTIONS ----------------
// function setupMIDI() {
//   if (navigator.requestMIDIAccess) {
//     navigator.requestMIDIAccess().then(onMIDISuccess, onMIDIFailure);
//   } else {
//     console.log("No MIDI support in this browser.");
//   }
// }

// function onMIDISuccess(midi) {
//   midiAccess = midi;
//   const inputs = midiAccess.inputs.values();
//   for (let input of inputs) {
//     input.onmidimessage = handleMIDIMessage;
//   }
// }

// function onMIDIFailure() {
//   console.log("Could not access MIDI devices.");
// }

// function handleMIDIMessage(message) {
//   let [command, note, velocity] = message.data;

//   if (command === 144 && velocity > 0) { // note on
//     if (!activeNotes.includes(note)) activeNotes.push(note);
//   } else if ((command === 128) || (command === 144 && velocity === 0)) { // note off
//     let index = activeNotes.indexOf(note);
//     if (index > -1) activeNotes.splice(index, 1);
//   }
// }

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
