// Scene setup
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Set the background color of the renderer to #b7a8ec
renderer.setClearColor(0xb7a8ec, 1); // 0xb7a8ec is the new background color

// Lighting for better effect
const light = new THREE.AmbientLight(0xFFFFFF, 1); // Ambient light
scene.add(light);

const pointLight = new THREE.PointLight(0xFFFFFF, 1, 100);
pointLight.position.set(5, 5, 5);
scene.add(pointLight);

// Create the base geometry for the cube
const geometry = new THREE.BoxGeometry(2, 2, 2); // Simplified geometry

// Create the particle system material with depthTest disabled for particles
const particleMaterial = new THREE.PointsMaterial({
  size: 0.05,      // Size of the particles
  transparent: true,
  opacity: 0.9,     // Transparency of the particles
  depthTest: false,  // Disable depth testing so particles are always visible
  depthWrite: false  // Ensure particles do not write to the depth buffer
});

// Create the cube's materials (ensure depthWrite is false to see particles through it)
const waterMaterial = new THREE.MeshStandardMaterial({
  color: 0xADD8E6, // Light blue color
  transparent: true,
  opacity: 0.6, // Slight transparency for water-like effect
  side: THREE.DoubleSide,
  refractionRatio: 0.98,
  envMapIntensity: 0.5,
  metalness: 0.1,
  roughness: 0.1,
  depthWrite: false,  // Disable writing to depth buffer so particles can be seen through
  depthTest: true     // Allow depth testing (important for transparent objects)
});

// Create the transparent material for the top face of the cube
const transparentMaterial = new THREE.MeshStandardMaterial({
  color: 0xADD8E6, // Light blue (same as other faces for consistency)
  transparent: true,
  opacity: 0, // Completely see-through
  side: THREE.DoubleSide,
  depthWrite: false,  // Ensure top face is rendered without depth writes
});

// Apply the new material settings to the cube
const cube = new THREE.Mesh(geometry, [
  waterMaterial,  // front
  waterMaterial,  // back
  transparentMaterial,  // top
  waterMaterial,  // bottom
  waterMaterial,  // left
  waterMaterial   // right
]);

scene.add(cube);

// Create particles above the top of the cube (multiple layers)
const particleCount = 10000;  // Total number of particles
const layerCount = 5;         // Number of layers (adjust this for more/less layers)
const particleGeometry = new THREE.BufferGeometry();
const positions = new Float32Array(particleCount * 3); // 3 vertices per particle (x, y, z)

const coverageSize = 2; // The size of the cube's top face (2x2)
const spacing = 0.03;    // Spacing between particles

let index = 0;
for (let layer = 0; layer < layerCount; layer++) {
  const layerHeight = 1.1 + layer * 0.2; // Offset each layer in the Y-axis (height)

  for (let x = -coverageSize / 2; x < coverageSize / 2; x += spacing) {
    for (let z = -coverageSize / 2; z < coverageSize / 2; z += spacing) {
      positions[index * 3] = x;        // X position (spread across the top face)
      positions[index * 3 + 1] = Math.random() * 0.2 + layerHeight;  // Y position (above the cube with layer offset)
      positions[index * 3 + 2] = z;    // Z position (spread across the top face)
      index++;
    }
  }
}

// Ensure we only use the particles generated in the above loop
particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

// Create the particle system
const particles = new THREE.Points(particleGeometry, particleMaterial);

// Parent the particle system to the cube so it moves and rotates with the cube
cube.add(particles);
scene.add(cube);

// Ensure particles are rendered above the cube
particles.renderOrder = 1;  // Make sure particles are rendered last (above the cube)
cube.renderOrder = 0;      // Cube should be rendered before the particles

// Camera position
camera.position.set(3, 3, 5);
camera.lookAt(0, 0, 0);

// Variables for mouse drag interaction
let isDragging = false;
let previousMousePosition = { x: 0, y: 0 };

// Mouse event listeners for drag
document.addEventListener('mousedown', (event) => {
  isDragging = true;
  previousMousePosition = { x: event.clientX, y: event.clientY };
});

document.addEventListener('mousemove', (event) => {
  if (isDragging) {
    const deltaX = event.clientX - previousMousePosition.x;
    const deltaY = event.clientY - previousMousePosition.y;

    // Adjust rotation based on mouse movement
    cube.rotation.y += deltaX * 0.01; // Horizontal rotation
    cube.rotation.x += deltaY * 0.01; // Vertical rotation

    // Update previous mouse position
    previousMousePosition = { x: event.clientX, y: event.clientY };
  }
});

document.addEventListener('mouseup', () => {
  isDragging = false;
});

// Scroll event listener to zoom in and out
document.addEventListener('wheel', (event) => {
  if (event.deltaY > 0) {
    camera.position.z += 0.1; // Zoom in (move closer)
  } else {
    camera.position.z -= 0.1; // Zoom out (move farther)
  }

  // Prevent zooming too close or too far
  camera.position.z = Math.max(2, Math.min(camera.position.z, 10)); // Limits zoom range
});

// Function to interpolate between pastel blue colors
function getPastelBlueColor(time) {
  // Define a set of pastel blue colors
  const colors = [
    new THREE.Color(0xADD8E6), // Light blue
    new THREE.Color(0x87CEFA), // Sky blue
    new THREE.Color(0xB0E0E6), // Powder blue
    new THREE.Color(0xAFEEEE), // Pale turquoise
    new THREE.Color(0x98C8E4)  // Soft light blue
  ];

  // Use modulo to create a looping effect, cycling through the colors
  const cycleTime = time % 5; // This ensures it cycles every 5 seconds
  const index = Math.floor(cycleTime);
  const nextIndex = (index + 1) % colors.length;
  const mixRatio = cycleTime - index;

  // Return the interpolated color
  return colors[index].lerp(colors[nextIndex], mixRatio);
}

// Animation loop
let time = 0; // Variable for time-based animation
function animate() {
  requestAnimationFrame(animate);

  // Update particle colors to create shimmering effect
  const color = getPastelBlueColor(time);
  particleMaterial.color.set(color);  // Apply the new color to the particles

  // Update green side to match the particle color
  cube.material[2].color.set(color);  // Update the green side color dynamically

  // Update particle positions to create wave-like motion
  const positions = particleGeometry.attributes.position.array;
  for (let i = 0; i < particleCount; i++) {
    const x = positions[i * 3];
    const z = positions[i * 3 + 2];

    // Apply wave-like motion using sine function based on position and time
    positions[i * 3 + 1] = Math.sin(x * 2 + time) * 0.1 + Math.sin(z * 2 + time) * 0.1 + 1.1; // Wave effect
  }

  // Update the particle geometry with the new positions
  particleGeometry.attributes.position.needsUpdate = true;

  // Rotate the cube slowly for visibility
  cube.rotation.y += 0.01;

  // Update time for smooth animation
  time += 0.05;

  renderer.render(scene, camera);
}

animate();
