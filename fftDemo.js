// CODE IN A GLOBAL MODE. CHANGE IT IN HTML TOO
//fftVars
let mic, fft;
let numCubes = 128; // number of frequency bins/cubes
let spectrum;
let testSong;
let threshold = 10;
let r = 0;
let xOff = 0;
let fftColorCoefficent = 1;

//midiVars
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

let size = 350;
let minLerpSpeed = 0.2;

// //Camera Animation
let cam;
let camX;
let camY;    
let camZ;
let camDistance = 2000;
let camSpeed = 0.1;
let angle = 0;

let nyquist;
let freqPerBin;
let lowFreq = 80;
let highFreq = 7000;
let lowBin;
let highBin;

let shapeModel; // for single model
let shapeModels = [];
let shapeModelQuantity = 3; //15
let textModels = [];
let textModelQuantity = 3; //18

function preload(){
  testSong = loadSound('Deftones – Knife Prty (Official Visualizer).mp3');
  // shapeModel = loadModel('../Prism.obj');
  for (let i = 0; i<shapeModelQuantity; i++){
    shapeModels[i] = loadModel(`./models/shapes/model (${i}).obj`);
  }
  for (let i = 0; i<textModelQuantity; i++){
    textModels[i] = loadModel(`./models/textModels/textModel (${i}).obj`);
  }
}

function setup() {
  createCanvas(windowWidth, windowHeight, WEBGL);
  angleMode(DEGREES);
  colorMode(HSB);
  noStroke();
  setupMIDI();

  // Normalize loaded 3D model
  // normalizeModel(200);

  // CAMERA SETUP
  cam = createCamera();
  cam.camera(0, 0, 500, 0, 0, 0, 1, 0, 0);

  // FFT ANALYZER
  //Start microphone with device selection
  mic = new p5.AudioIn();
  
  // Get available audio input devices and let user select
  selectAudioDevice();
  
  fft = new p5.FFT(0.8, numCubes); // smoothness=0.8, resolution=16 bins
  if(fft){
    fft.setInput(mic);
  }
  // testSong.play();  
  
  // MIDI ANALYZER
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
        shapeIndex: floor(random(0, shapeModelQuantity-1)),
        textIndex: floor(random(0, textModelQuantity-1)),
      } 
      i++;
    }
  }

  nyquist = sampleRate() / 2;            // ~22050 Hz
  freqPerBin = nyquist / numCubes;       // Hz per bin
  lowBin = floor(lowFreq / freqPerBin);
  highBin = ceil(highFreq / freqPerBin);
}

function draw() {
  background(240, 39, 7);
  // orbitControl();
  normalMaterial();
  // Lighting();

  FFTAnalyze();
  MIDIAnalyze();
  CamAnimation();
  // MIDIBoxSetupDebug();
}

// FUNCTIONS
// function normalizeModel(targetSize) {
//   if (shapeModel) {
//     // Get model bounds (this is approximate - p5.js doesn't provide direct access)
//     // For more precise control, you may need to manually set the scale
//     modelScale = targetSize / 300; // Adjust 300 based on your model's size
//   }
// }

function FFTAnalyze() {
  // Analyze frequencies
  spectrum = fft.analyze();
  for (let i = lowBin; i <= highBin; i++) {
    let amp;  
    let cubeSize = 25;
    r += 0.001;
    xOff += 0.1;

    // if (i > numCubes/8){
    //   amp = spectrum[i]; // loudness of this bin (0–255)
    // }
    // else{
    //   amp = 0;
    // }
    amp = spectrum[i]; // loudness of this bin (0–255)

    // Map loudness to cube size
    // if(amp > threshold){
    //   cubeSize = map(amp, threshold, 255, 15, 300);
    // }
    if (amp < threshold) continue;
    cubeSize = map(amp, 0, 255, 200, 500);
    // Position cubes in a row
    push();
    // let x = map(i, 0, numCubes - 1, -1000, 1000);
    let x = map(i, lowBin, highBin, -1000, 1000);
    translate(x, 0, 0);
    rotateX(r + i * 0.5);
    // Color by loudness
    fill(map(amp, 0, 255, 180*fftColorCoefficent, 300*fftColorCoefficent), map(noise(xOff), 0, 15, 50, 150), 200);
    // Draw cube
    box(50, cubeSize - i * 1.5);
    pop();
  }
  // background(200);
  xOff = 0;
}

function MIDIAnalyze() {
  for (let zAngle = 0; zAngle < 180; zAngle += 30) {
    xR += worldRotationSpeed;
    yR += worldRotationSpeed;
    zR += worldRotationSpeed;
    for (let xAngle = 0; xAngle < 360; xAngle += 30) {
      let currentCycleCube = noteToShape[zAngle / 30][xAngle / 30];
      let note = currentCycleCube.midiNumber;

      let lerpSpeed = minLerpSpeed;

      if (note in activeNotes) {
        currentCycleCube.targetSize = map(activeNotes[note], 0, 127, 0, size);
        lerpSpeed = minLerpSpeed * map(activeNotes[note], 0, 127, 1, 5); //Lerp speed depend on note velocity (How fast u pressed the note) 
      }
      else {
        currentCycleCube.targetSize = 0;
      }

      //Cube animation(lerping)
      currentCycleCube.currentSize = lerp(currentCycleCube.currentSize, currentCycleCube.targetSize, lerpSpeed);

      push();
      rotateZ(zAngle);
      rotateX(xAngle); //Why rotateX and not rotateY
      translate(0, 600, 0);
      fill(currentCycleCube.color); //to change the color later on
      // Box
      // box(currentCycleCube.currentSize);
      // // Loaded Model
      normalMaterial();
      scale(currentCycleCube.currentSize/35);
      // model(shapeModels[currentCycleCube.shapeIndex]);
      model(textModels[currentCycleCube.textIndex]);
      // model(shapeModels[note]);//
      pop();
      rotateX(xR);
      rotateY(yR);
      rotateZ(zR);
    }
  }
}

function Lighting() {
    // ambientLight(60, 60, 80); // Soft base lighting
    // directionalLight(255, 255, 255, -1, 0.5, -1); // Main light from top-left
    // // Optional: Add a colored accent light
    // pointLight(50, 25, 100, -200, -100, 200);
    directionalLight(255, 255, 255, 0.5, 1, -0.5);
    ambientLight(60);
}

function CamAnimation() {
  // Orbit around the world's Y-axis, but with X as the up axis
  let camY = camDistance * cos(angle); // Y becomes the horizontal plane now
  let camZ = camDistance * sin(angle);
  let camX = -1250 * sin(-angle); // keep X fixed (the "up" axis)

  cam.setPosition(camX, camY, camZ);
  cam.lookAt(-50, 0, 0); // focus on the center
  angle += camSpeed * (1 + 0.5 * sin(frameCount * 0.01));;
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

// ---------------- AUDIO DEVICE SELECTION ----------------
function selectAudioDevice() {
  navigator.mediaDevices.enumerateDevices()
    .then(devices => {
      const audioInputs = devices.filter(device => device.kind === 'audioinput');
      
      console.log('=== Available audio input devices ===');
      audioInputs.forEach((device, index) => {
        console.log(`${index}: ${device.label || 'Unknown device'} (ID: ${device.deviceId})`);
      });
      console.log('=====================================');
      
      // Option 1: Automatically select a specific device by name
      // Look for your audio interface by name (check console for exact name)
      const audioInterface = audioInputs.find(device => 
        device.label.toLowerCase().includes('focusrite') || // example: Focusrite Scarlett
        device.label.toLowerCase().includes('scarlett') ||
        device.label.toLowerCase().includes('audio interface') ||
        device.label.toLowerCase().includes('behringer') ||
        device.label.toLowerCase().includes('m-audio') ||
        device.label.toLowerCase().includes('presonus') ||
        device.label.toLowerCase().includes('your-device-name-here')
      );
      
      if (audioInterface) {
        const deviceIndex = audioInputs.indexOf(audioInterface);
        console.log(`✓ Using audio interface: ${audioInterface.label} (Index: ${deviceIndex})`);
        mic.setSource(deviceIndex);
        mic.start();
      } else {
        // If specific device not found, use default (index 0)
        console.log('⚠ Audio interface not found by name, using default input (index 0)');
        console.log('To use a different device, either:');
        console.log('1. Update the search terms in selectAudioDevice()');
        console.log('2. Or manually set: mic.setSource(INDEX_NUMBER)');
        mic.start();
      }
    })
    .catch(err => {
      console.error('Error accessing audio devices:', err);
      mic.start(); // Fallback to default
    });
}

function MIDIBoxSetupDebug() {
  for (let zAngle = 0; zAngle < 180; zAngle += 30) {
    xR += worldRotationSpeed;
    yR += worldRotationSpeed;
    zR += worldRotationSpeed;
    for (let xAngle = 0; xAngle < 360; xAngle += 30) {
      push();
      rotateZ(zAngle);
      rotateX(xAngle); //Why rotateX and not rotateY
      translate(0, 600, 0);
      box(250);
      pop();
    }
  }
}

//midi controller values by mrbombmusic. Gonna used to figure out knobs conntction

// let channel, value, on;
// if (navigator.requestMIDIAccess) {
//     console.log('This browser supports WebMIDI!');
// } else {
//     console.log('WebMIDI is not supported in this browser.');
// }

// navigator.requestMIDIAccess()
//     .then(onMIDISuccess, onMIDIFailure);

// function onMIDISuccess(midiAccess) {
//     console.log(midiAccess);

//     var inputs = midiAccess.inputs;
//     var outputs = midiAccess.outputs;
// }

// function onMIDIFailure() {
//     console.log('Could not access your MIDI devices.');
// }

// function onMIDISuccess(midiAccess) {
//     for (var input of midiAccess.inputs.values()) {
//         input.onmidimessage = getMIDIMessage;
//       console.log(input);
//     }
// }

// function getMIDIMessage(midiMessage) {
//   value = midiMessage.data[2];
//   channel = midiMessage.data[1];
  
//   on = midiMessage.data[0];


// }



// p5 in INSTANCE MODE. Change in HTML too
// import { Vector3 } from "three";
// import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

// function sketch(p) {
//   //fftVars
//   let mic, fft;
//   let numCubes = 128;
//   let spectrum;
//   let testSong;
//   let threshold = 10;
//   let r = 0;
//   let xOff = 0;
//   let fftColorCoefficent = 1;

//   //midiVars
//   let midiAccess;
//   let activeNotes = {};
//   let shapes = [];
//   let numShapes = 36;
//   let midiStartNote = 36;
//   let midiEndNote = midiStartNote + numShapes - 1;
//   let noteToShape = [];

//   let xR = 0;
//   let yR = 0;
//   let zR = 0;
//   let worldRotationSpeed = 0.0005;

//   let size = 350;
//   let minLerpSpeed = 0.2;

//   //Camera Animation
//   let cam;
//   let camX;
//   let camY;
//   let camZ;
//   let camDistance = 2000;
//   let camSpeed = 0.1;
//   let angle = 0;

//   let nyquist;
//   let freqPerBin;
//   let lowFreq = 80;
//   let highFreq = 7000;
//   let lowBin;
//   let highBin;

//   let model;

//   p.preload = function() {
//     testSong = p.loadSound('duvet - Aaron Terrapin.wav');
//     // model = loadmodel // Uncomment when you have your model loading function
//   }

//   p.setup = function() {
//     p.createCanvas(p.windowWidth, p.windowHeight, p.WEBGL);
//     p.angleMode(p.DEGREES);
//     p.colorMode(p.HSB);
//     p.noStroke();
//     setupMIDI();

//     // CAMERA SETUP
//     cam = p.createCamera();
//     cam.camera(0, 0, 500, 0, 0, 0, 1, 0, 0);

//     // FFT ANALYZER
//     mic = new p5.AudioIn();
//     selectAudioDevice();
    
//     fft = new p5.FFT(0.8, numCubes);
//     if (fft) {
//       fft.setInput(mic);
//     }

//     // MIDI ANALYZER
//     let i = 0;
//     for (let zAngle = 0; zAngle < 180; zAngle += 30) {
//       noteToShape[zAngle / 30] = [];
//       for (let xAngle = 0; xAngle < 360; xAngle += 30) {
//         noteToShape[zAngle / 30][xAngle / 30] = {
//           midiNumber: midiStartNote + i,
//           currentSize: 0,
//           targetSize: 0,
//           color: p.color(p.random(0, 360), p.random(60, 80), p.random(70, 90)),
//         };
//         i++;
//       }
//     }

//     nyquist = p.sampleRate() / 2;
//     freqPerBin = nyquist / numCubes;
//     lowBin = p.floor(lowFreq / freqPerBin);
//     highBin = p.ceil(highFreq / freqPerBin);
//   }

//   // p.draw = function() {
//   //   p.background(240, 39, 7);
    
//   //   FFTAnalyze();
//   //   MIDIAnalyze();
//   //   Lighting();
//   //   CamAnimation();
//   // }

//   // FUNCTIONS
//   function FFTAnalyze() {
//     spectrum = fft.analyze();
//     for (let i = lowBin; i <= highBin; i++) {
//       let amp;
//       let cubeSize = 25;
//       r += 0.001;
//       xOff += 0.1;

//       amp = spectrum[i];

//       if (amp < threshold) continue;
//       cubeSize = p.map(amp, 0, 255, 200, 500);
      
//       p.push();
//       let x = p.map(i, lowBin, highBin, -1000, 1000);
//       p.translate(x, 0, 0);
//       p.rotateX(r + i * 0.5);
//       p.fill(
//         p.map(amp, 0, 255, 180 * fftColorCoefficent, 300 * fftColorCoefficent),
//         p.map(p.noise(xOff), 0, 15, 50, 150),
//         200
//       );
//       p.box(50, cubeSize - i * 1.5);
//       p.pop();
//     }
//     xOff = 0;
//   }

//   function MIDIAnalyze() {
//     for (let zAngle = 0; zAngle < 180; zAngle += 30) {
//       xR += worldRotationSpeed;
//       yR += worldRotationSpeed;
//       zR += worldRotationSpeed;
//       for (let xAngle = 0; xAngle < 360; xAngle += 30) {
//         let currentCycleCube = noteToShape[zAngle / 30][xAngle / 30];
//         let note = currentCycleCube.midiNumber;

//         let lerpSpeed = minLerpSpeed;

//         if (note in activeNotes) {
//           currentCycleCube.targetSize = p.map(activeNotes[note], 0, 127, 0, size);
//           lerpSpeed = minLerpSpeed * p.map(activeNotes[note], 0, 127, 1, 5);
//         } else {
//           currentCycleCube.targetSize = 0;
//         }

//         currentCycleCube.currentSize = p.lerp(
//           currentCycleCube.currentSize,
//           currentCycleCube.targetSize,
//           lerpSpeed
//         );

//         p.push();
//         p.rotateZ(zAngle);
//         p.rotateX(xAngle);
//         p.translate(0, 600, 0);
//         p.fill(currentCycleCube.color);
//         p.box(currentCycleCube.currentSize);
//         p.pop();
//         p.rotateX(xR);
//         p.rotateY(yR);
//         p.rotateZ(zR);
//       }
//     }
//   }

//   function Lighting() {
//     p.directionalLight(255, 255, 255, 0.5, 1, -0.5);
//     p.ambientLight(60);
//   }

//   function CamAnimation() {
//     let camY = camDistance * p.cos(angle);
//     let camZ = camDistance * p.sin(angle);
//     let camX = -1250 * p.sin(-angle);

//     cam.setPosition(camX, camY, camZ);
//     cam.lookAt(-50, 0, 0);
//     angle += camSpeed * (1 + 0.5 * p.sin(p.frameCount * 0.01));
//   }

//   // ---------------- MODEL LOADER ----------------

//   function renderObject(obj) {
//     switch (obj.type) {
//       case 'Object3D':
//       case 'Group':
//         for (const child of obj.children) {
//           renderObject(child);
//         }
//         break;
//       case 'Mesh':
//         p.push();
//         p.applyMatrix(obj.matrixWorld.elements);
//         p.beginShape(p.TRIANGLES);
//         let pos = new Vector3();
//         let norm = new Vector3();
//         for (const ix of obj.geometry.index.array) {
//           pos.fromBufferAttribute(obj.geometry.attributes.position, ix);
//           norm.fromBufferAttribute(obj.geometry.attributes.normal, ix);

//           p.normal(norm.x, norm.y, norm.z);
//           p.vertex(pos.x, pos.y, pos.z);
//         }

//         p.endShape();
//         p.pop();
//         break;
//       default:
//         throw new Error(`Unsupported Object Type: {obj.type}`);
//     }
//   }

//   const loader = new GLTFLoader();
//   loader.load(
//     '../models/trashBin/scene.gltf',
//     gltf => {
//       p.draw = () => {
//         p.background(240, 39, 7);
//         // p.orbitControl(8, 4, 0.1);
//         p.orbitControl();

//         // p.scale(100);
//         // p.noStroke();
//         p.normalMaterial();
//         renderObject(gltf.scene);

    
//         FFTAnalyze();
//         MIDIAnalyze();
//         Lighting();
//         // CamAnimation();
//       }
//     }
//   );

//   // ---------------- MIDI FUNCTIONS ----------------
//   function setupMIDI() {
//     if (navigator.requestMIDIAccess) {
//       navigator.requestMIDIAccess().then(onMIDISuccess, onMIDIFailure);
//     } else {
//       console.log("No MIDI support in this browser.");
//     }
//   }

//   function onMIDISuccess(midi) {
//     midiAccess = midi;
//     const inputs = midiAccess.inputs.values();
//     for (let input of inputs) {
//       input.onmidimessage = handleMIDIMessage;
//     }
//   }

//   function onMIDIFailure() {
//     console.log("Could not access MIDI devices.");
//   }

//   function handleMIDIMessage(message) {
//     let [command, note, velocity] = message.data;

//     if (command === 144 && velocity > 0) {
//       activeNotes[note] = velocity;
//     } else if (command === 128 || (command === 144 && velocity === 0)) {
//       delete activeNotes[note];
//     }
//   }

//   // ---------------- AUDIO DEVICE SELECTION ----------------
//   function selectAudioDevice() {
//     navigator.mediaDevices
//       .enumerateDevices()
//       .then(devices => {
//         const audioInputs = devices.filter(device => device.kind === 'audioinput');

//         console.log('=== Available audio input devices ===');
//         audioInputs.forEach((device, index) => {
//           console.log(`${index}: ${device.label || 'Unknown device'} (ID: ${device.deviceId})`);
//         });
//         console.log('=====================================');

//         const audioInterface = audioInputs.find(device =>
//           device.label.toLowerCase().includes('focusrite') ||
//           device.label.toLowerCase().includes('scarlett') ||
//           device.label.toLowerCase().includes('audio interface') ||
//           device.label.toLowerCase().includes('behringer') ||
//           device.label.toLowerCase().includes('m-audio') ||
//           device.label.toLowerCase().includes('presonus')
//         );

//         if (audioInterface) {
//           const deviceIndex = audioInputs.indexOf(audioInterface);
//           console.log(`✓ Using audio interface: ${audioInterface.label} (Index: ${deviceIndex})`);
//           mic.setSource(deviceIndex);
//           mic.start();
//         } else {
//           console.log('⚠ Audio interface not found by name, using default input (index 0)');
//           mic.start();
//         }
//       })
//       .catch(err => {
//         console.error('Error accessing audio devices:', err);
//         mic.start();
//       });
//   }

//   function MIDIBoxSetupDebug() {
//     for (let zAngle = 0; zAngle < 180; zAngle += 30) {
//       xR += worldRotationSpeed;
//       yR += worldRotationSpeed;
//       zR += worldRotationSpeed;
//       for (let xAngle = 0; xAngle < 360; xAngle += 30) {
//         p.push();
//         p.rotateZ(zAngle);
//         p.rotateX(xAngle);
//         p.translate(0, 600, 0);
//         p.box(250);
//         p.pop();
//       }
//     }
//   }

//   p.windowResized = function() {
//     p.resizeCanvas(p.windowWidth, p.windowHeight);
//   }
// }

// new p5(sketch);
