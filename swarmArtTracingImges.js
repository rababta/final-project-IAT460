let agents = [];
let img;
let sound;
let fft;
let threshold = 50;
let isSoundReady = false;
let isImageReady = false;
let startButton;
let showOriginal = false;

function preload() {
  img = loadImage('reference4.jpg', 
    () => { 
      console.log('Image loaded successfully');
      isImageReady = true;
    },
    () => console.error('Image loading failed - check filename/path')
  );
  
  sound = loadSound('piano.mp3', 
    () => {
      console.log('Sound loaded successfully');
      isSoundReady = true;
    },
    () => console.error('Sound loading failed')
  );
}

function setup() {
  createCanvas(windowWidth, windowHeight, WEBGL);
  pixelDensity(1);
  
  // Start button
  startButton = createButton('START EXPERIENCE');
  startButton.position(20, 20);
  startButton.mousePressed(startExperience);
  startButton.style('padding', '10px 15px');
  
  // Toggle button
  let toggleBtn = createButton('TOGGLE IMAGE VIEW');
  toggleBtn.position(20, 60);
  toggleBtn.mousePressed(() => showOriginal = !showOriginal);
  toggleBtn.style('padding', '10px 15px');
  
  fft = new p5.FFT();
  ambientLight(60);
  directionalLight(255, 255, 255, 0, 0, -1);
  camera(0, 0, (height/2) / tan(PI/6), 0, 0, 0, 0, 1, 0);
}

function startExperience() {
  startButton.hide();
  userStartAudio().then(() => {
    sound.loop();
    processImage();
  });
}

function processImage() {
  img.loadPixels();
  
  // Pre-processing for cleaner edges
  img.filter(BLUR, 0.5); // Mild blur to reduce JPEG artifacts
  img.filter(GRAY); // Convert to grayscale
  
  let scaleFactor = min(1, 800/max(img.width, img.height));
  let edgePixels = [];
  
  // Improved edge detection
  for (let y = 1; y < img.height - 1; y += 2) {
    for (let x = 1; x < img.width - 1; x += 2) {
      let idx = (x + y * img.width) * 4;
      let brightness = img.pixels[idx];
      
      // Compare with 4 neighbors
      let diff = max(
        abs(brightness - img.pixels[idx + 4]), // Right
        abs(brightness - img.pixels[idx + img.width * 4]), // Below
        abs(brightness - img.pixels[idx - 4]), // Left
        abs(brightness - img.pixels[idx - img.width * 4]) // Above
      );
      
      if (diff > threshold) {
        edgePixels.push({
          x: (x - img.width/2) * scaleFactor,
          y: (y - img.height/2) * scaleFactor,
          brightness: brightness
        });
      }
    }
  }
  
  // Create agents at edge positions
  for (let p of edgePixels) {
    agents.push(new Agent(p.x, p.y, p.brightness));
  }
  
  console.log('Agents created:', agents.length);
}

function draw() {
  background(0);
  
  if (showOriginal) {
    push();
    translate(-width/4, -height/4, 0);
    scale(0.5);
    image(img, -img.width/2, -img.height/2);
    pop();
  }
  
  if (!isImageReady) {
    fill(255);
    text('Loading image...', -width/4, 0);
    return;
  }
  
  orbitControl();
  
  let spectrum = fft.analyze();
  let bass = fft.getEnergy("bass");
  let treble = fft.getEnergy("treble");
  
  for (let agent of agents) {
    agent.reactToSound(bass, treble);
    agent.update();
    agent.show();
  }
}

class Agent {
  constructor(x, y, brightness) {
    this.pos = createVector(x, y, 0);
    this.vel = p5.Vector.random3D().mult(0.05);
    this.size = map(brightness, 0, 255, 2, 8);
    this.baseSize = this.size;
    this.color = color(
      map(brightness, 0, 255, 100, 255),
      map(brightness, 0, 255, 50, 200),
      map(brightness, 0, 255, 150, 255)
    );
    this.originalPos = createVector(x, y, 0);
  }

  reactToSound(bass, treble) {
    // Z movement responds to bass
    this.pos.z = map(bass, 0, 255, -30, 30);
    
    // Size pulses with treble
    this.size = this.baseSize * map(treble, 0, 255, 0.8, 1.5);
    
    // Return to original position over time
    this.pos.lerp(this.originalPos, 0.05);
  }

  update() {
    this.pos.add(this.vel);
    
    // Add some randomness
    if (random() < 0.01) {
      this.vel.add(p5.Vector.random3D().mult(0.2));
    }
    
    // Limit speed
    this.vel.limit(0.5);
  }

  show() {
    push();
    translate(this.pos.x, this.pos.y, this.pos.z);
    fill(this.color);
    noStroke();
    sphere(this.size);
    pop();
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  camera(0, 0, (height/2) / tan(PI/6), 0, 0, 0, 0, 1, 0);
}