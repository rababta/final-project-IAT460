let creatures = [];
let fft;
let mic;
let interactionMode = 'demo'; // Start with demo mode
let isSetupComplete = false;

function setup() {
  console.log("Starting setup...");
  createCanvas(windowWidth, windowHeight, WEBGL);
  console.log("Canvas created");
  
  // Debug camera position
  console.log(`Camera position: ${getCameraPosition()}`);
  
  // Fallback creatures if audio fails
  createDemoCreatures();
  
  try {
    mic = new p5.AudioIn();
    fft = new p5.FFT();
    console.log("Audio objects created");
    
    mic.start(() => {
      console.log("Microphone access granted");
      fft.setInput(mic);
      isSetupComplete = true;
    }, () => {
      console.warn("Microphone access denied - using demo mode");
      createDemoCreatures();
      isSetupComplete = true;
    });
  } catch (e) {
    console.error("Audio initialization failed:", e);
    createDemoCreatures();
    isSetupComplete = true;
  }
  
  // Visual debug markers
  console.log("Setup complete");
}

function createDemoCreatures() {
  console.log("Creating demo creatures...");
  for (let i = 0; i < 10; i++) {
    creatures.push(new Creature(
      random(-200, 200),
      random(-200, 200),
      random(-100, 100)
    ));
  }
}

function draw() {
  if (!isSetupComplete) {
    background(0);
    drawLoadingScreen();
    return;
  }
  
  background(0);
  orbitControl();
  
  // Debug axes
  push();
  stroke(255, 0, 0);
  line(0, 0, 0, 100, 0, 0); // X-axis (red)
  stroke(0, 255, 0);
  line(0, 0, 0, 0, 100, 0); // Y-axis (green)
  stroke(0, 0, 255);
  line(0, 0, 0, 0, 0, 100); // Z-axis (blue)
  pop();
  
  // Lighting
  ambientLight(60);
  directionalLight(255, 255, 255, 0, -1, -1);
  
  // Update and display creatures
  for (let c of creatures) {
    c.update();
    c.display();
  }
  
  // Debug info
  drawDebugHUD();
}

class Creature {
  constructor(x, y, z) {
    console.log(`New creature at ${x}, ${y}, ${z}`);
    this.pos = createVector(x, y, z);
    this.size = random(10, 30);
    this.color = color(
      random(100, 255),
      random(100, 255),
      random(100, 255)
    );
    this.speed = random(0.5, 2);
  }
  
  update() {
    // Simple floating motion
    this.pos.x += random(-this.speed, this.speed);
    this.pos.y += random(-this.speed, this.speed);
    this.pos.z += random(-this.speed * 0.5, this.speed * 0.5);
  }
  
  display() {
    push();
    translate(this.pos.x, this.pos.y, this.pos.z);
    fill(this.color);
    noStroke();
    sphere(this.size);
    pop();
  }
}

function drawLoadingScreen() {
  push();
  fill(255);
  textSize(24);
  textAlign(CENTER, CENTER);
  text("Initializing ecosystem...", 0, 0);
  pop();
}

function drawDebugHUD() {
  push();
  fill(255);
  noStroke();
  textSize(14);
  textAlign(LEFT, TOP);
  text(`Creatures: ${creatures.length}\n` +
       `Mode: ${interactionMode}\n` +
       `FPS: ${round(frameRate())}`, 
       -width/2 + 20, -height/2 + 20);
  pop();
}

function getCameraPosition() {
  // Helper to debug camera
  let cam = _renderer._curCamera;
  return `X:${cam.eyeX} Y:${cam.eyeY} Z:${cam.eyeZ}`;
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}