// Grid dimensions
const X_SIZE = 12;
const Y_SIZE = 12;
const Z_SIZE = 9;
const CELL_SIZE = 1; // Units in 3D space

// Three.js setup
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.getElementById("rendererContainer").appendChild(renderer.domElement);

const controls = new THREE.OrbitControls(camera, renderer.domElement);
camera.position.set(X_SIZE / 2, Z_SIZE * 2, Y_SIZE / 2);
controls.update();

// Lighting
const ambientLight = new THREE.AmbientLight(0x404040, 1);
scene.add(ambientLight);
const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
directionalLight.position.set(5, 10, 5).normalize();
scene.add(directionalLight);

// Ground plane
const groundGeometry = new THREE.PlaneGeometry(X_SIZE * CELL_SIZE, Y_SIZE * CELL_SIZE);
const groundMaterial = new THREE.MeshBasicMaterial({ color: 0x8B4513, side: THREE.DoubleSide });
const ground = new THREE.Mesh(groundGeometry, groundMaterial);
ground.rotation.x = Math.PI / 2;
ground.position.set(X_SIZE / 2 - 0.5, -0.5, Y_SIZE / 2 - 0.5);
scene.add(ground);

// Grid and energy
const grid = Array(Z_SIZE).fill().map(() => 
    Array(X_SIZE).fill().map(() => 
        Array(Y_SIZE).fill(null)
    )
);
const energy = Array(Z_SIZE).fill().map((_, z) => 
    Array(X_SIZE).fill().map(() => 
        Array(Y_SIZE).fill().map(() => 
            Math.random() < 0.5 ? (z === 0 || z === 8 ? Math.floor(Math.random() * 6) : Math.floor(Math.random() * 4)) : 0
        )
    )
);

// Protocell class
class Protocell {
    constructor(x, y, z, species, energy = 10, coopFactor = 0.5, isPioneer = false) {
        this.x = x;
        this.y = z; // y is height in 3D
        this.z = y;
        this.species = species;
        this.energy = energy;
        this.coopFactor = coopFactor;
        this.isPioneer = isPioneer;
        const traits = this.assignTraits();
        this.layerType = traits.layer;
        this.symbol = traits.symbol;
        this.color = traits.color;
        this.prefY = traits.prefZ;
        this.age = 0;

        // 3D representation
        const geometry = new THREE.SphereGeometry(0.3, 16, 16);
        const material = new THREE.MeshPhongMaterial({ 
            color: this.color, 
            transparent: true, 
            opacity: 0.7 
        });
        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.position.set(this.x, this.y / 2 + 0.3, this.z);
        scene.add(this.mesh);

        // Add text sprite
        const canvas = document.createElement("canvas");
        canvas.width = 32;
        canvas.height = 32;
        const ctx = canvas.getContext("2d");
        ctx.fillStyle = "black";
        ctx.font = "20px Arial";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(this.symbol, 16, 16);
        const texture = new THREE.CanvasTexture(canvas);
        const spriteMaterial = new THREE.SpriteMaterial({ map: texture });
        this.sprite = new THREE.Sprite(spriteMaterial);
        this.sprite.scale.set(0.2, 0.2, 1);
        this.sprite.position.set(this.x, this.y / 2 + 0.3, this.z);
        scene.add(this.sprite);
    }

    assignTraits() {
        const speciesTraits = {
            "Eucalyptus": { layer: "Canopy", symbol: "E", color: 0x00FFFF, prefZ: 8 },
            "PigeonPea": { layer: "Herbaceous", symbol: "P", color: 0xFF00FF, prefZ: 5 },
            "Comfrey": { layer: "Groundcover", symbol: "C", color: 0x00FF00, prefZ: 4 },
            "Mango": { layer: "Sub-Canopy", symbol: "M", color: 0xFFFF00, prefZ: 7 },
            "Banana": { layer: "Herbaceous", symbol: "B", color: 0x32CD32, prefZ: 5 },
            "SweetPotato": { layer: "Underground", symbol: "S", color: 0xFF4500, prefZ: 3 },
            "PassionFruit": { layer: "Vertical", symbol: "V", color: 0x0000FF, prefZ: 2 },
            "WaterLily": { layer: "Aquatic", symbol: "W", color: 0x00CED1, prefZ: 1 },
            "Mushroom": { layer: "Mycelial", symbol: "F", color: 0xFFFFFF, prefZ: 0 },
            "Papaya": { layer: "Canopy", symbol: "Y", color: 0xFFD700, prefZ: 8 },
            "Coffee": { layer: "Shrub", symbol: "K", color: 0xDC143C, prefZ: 6 },
            "Blueberry": { layer: "Shrub", symbol: "L", color: 0x4169E1, prefZ: 6 },
            "Strawberry": { layer: "Groundcover", symbol: "T", color: 0xFF6347, prefZ: 4 }
        };
        return speciesTraits[this.species] || { layer: "Groundcover", symbol: "C", color: 0x00FF00, prefZ: 4 };
    }

    update() {
        this.energy += energy[this.y][this.x][this.z];
        this.age++;
        const directions = [[-1,0,0], [1,0,0], [0,0,-1], [0,0,1], [0,-1,0], [0,1,0]];
        for (const [dx, dy, dz] of directions) {
            const nx = this.x + dx, ny = this.y + dy, nz = this.z + dz;
            if (nx >= 0 && nx < X_SIZE && ny >= 0 && ny < Z_SIZE && nz >= 0 && nz < Y_SIZE && grid[ny][nx][nz]) {
                const boost = ["PigeonPea", "Comfrey", "Eucalyptus"].includes(this.species) ? 2 : 1;
                grid[ny][nx][nz].energy += this.coopFactor * boost;
            }
        }
        const cost = ["Eucalyptus", "Mango", "Papaya"].includes(this.species) ? 3 : 
                     ["PigeonPea", "Banana", "Coffee"].includes(this.species) ? 2 : 1;
        this.energy -= cost;
        if (this.energy <= 0 || (this.isPioneer && this.age > 10)) {
            scene.remove(this.mesh);
            scene.remove(this.sprite);
            grid[this.y][this.x][this.z] = null;
            return false;
        }
        return true;
    }

    replicate() {
        if (this.energy <= 20) return false;
        const directions = [[-1,0,0], [1,0,0], [0,0,-1], [0,0,1], [0,-1,0], [0,1,0]];
        directions.sort(() => Math.random() - 0.5);
        for (const [dx, dy, dz] of directions) {
            const nx = this.x + dx, ny = this.y + dy, nz = this.z + dz;
            if (nx >= 0 && nx < X_SIZE && ny >= 0 && ny < Z_SIZE && nz >= 0 && nz < Y_SIZE && !grid[ny][nx][nz] && Math.random() < 0.5) {
                if (Math.abs(ny - this.prefY) <= 1) {
                    const newCoop = Math.max(0, Math.min(1, this.coopFactor + (Math.random() * 0.2 - 0.1)));
                    let newSpecies = this.species;
                    let isPioneer = this.isPioneer;
                    if (this.isPioneer && Math.random() < 0.2) {
                        newSpecies = ["Mango", "Banana", "Papaya"][Math.floor(Math.random() * 3)];
                        isPioneer = false;
                    }
                    grid[ny][nx][nz] = new Protocell(nx, nz, ny, newSpecies, 10, newCoop, isPioneer);
                    this.energy -= 10;
                    return true;
                }
            }
        }
        return false;
    }
}

// Initialize grid
const speciesList = ["Eucalyptus", "PigeonPea", "Comfrey", "Mango", "Banana", "SweetPotato", 
                     "PassionFruit", "WaterLily", "Mushroom", "Papaya", "Coffee", "Blueberry", "Strawberry"];
for (let i = 0; i < 15; i++) {
    const x = Math.floor(Math.random() * X_SIZE);
    const z = Math.floor(Math.random() * Y_SIZE);
    const species = speciesList[Math.floor(Math.random() * speciesList.length)];
    const tempCell = new Protocell(0, 0, 0, species);
    let y = tempCell.prefY + Math.floor(Math.random() * 3 - 1);
    y = Math.max(0, Math.min(Z_SIZE - 1, y));
    grid[y][x][z] = new Protocell(x, z, y, species, 10, Math.random(), ["Eucalyptus", "PigeonPea"].includes(species));
}

// 2D slice canvases
const xSliceCanvas = document.getElementById("xSliceCanvas");
const ySliceCanvas = document.getElementById("ySliceCanvas");
const zSliceCanvas = document.getElementById("zSliceCanvas");
const xCtx = xSliceCanvas.getContext("2d");
const yCtx = ySliceCanvas.getContext("2d");
const zCtx = zSliceCanvas.getContext("2d");
const SLICE_CELL_SIZE = 10;

// Sliders
const xSliceSlider = document.getElementById("xSlice");
const ySliceSlider = document.getElementById("ySlice");
const zSliceSlider = document.getElementById("zSlice");

// Simulation logic
let generation = 0;
const layerNames = ["Mycelial", "Aquatic", "Vertical", "Underground", "Groundcover", 
                    "Herbaceous", "Shrub", "Sub-Canopy", "Canopy"];
function animate() {
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);

    // Update simulation every ~500ms (30 frames at 60fps)
    if (generation % 30 === 0) {
        generation++;
        
        const organisms = [];
        for (let y = 0; y < Z_SIZE; y++) {
            for (let x = 0; x < X_SIZE; x++) {
                for (let z = 0; z < Y_SIZE; z++) {
                    if (grid[y][x][z]) organisms.push([x, y, z, grid[y][x][z]]);
                }
            }
        }
        for (const [x, y, z, cell] of organisms) {
            if (cell && !cell.update()) continue;
            if (cell && cell.replicate()) continue;
        }

        // Stats
        let alive = 0;
        let totalCoop = 0;
        const speciesCount = {};
        speciesList.forEach(s => speciesCount[s] = 0);
        for (let y = 0; y < Z_SIZE; y++) {
            for (let x = 0; x < X_SIZE; x++) {
                for (let z = 0; z < Y_SIZE; z++) {
                    if (grid[y][x][z]) {
                        alive++;
                        totalCoop += grid[y][x][z].coopFactor;
                        speciesCount[grid[y][x][z].species]++;
                    }
                }
            }
        }
        const coopAvg = alive ? totalCoop / alive : 0;

        // Update stats
        const statsDiv = document.getElementById("stats");
        statsDiv.innerHTML = `
            <strong>Generation:</strong> ${Math.floor(generation / 30)}<br>
            <strong>Population:</strong> ${alive}<br>
            <strong>Avg Cooperation:</strong> ${coopAvg.toFixed(2)}<br>
            <strong>Species Counts:</strong><br>
            ${speciesList.map(s => speciesCount[s] > 0 ? 
                `  ${s}: ${speciesCount[s]} (<span style="color:#${new Protocell(0,0,0,s).color.toString(16).padStart(6, '0')}">${new Protocell(0,0,0,s).symbol}</span>)` : 
                "").filter(Boolean).join("<br>")}
        `;
        if (alive === 0) statsDiv.innerHTML += "<br><strong>Ecosystem collapsed!</strong>";

        // Render 2D slices
        const xSlice = parseInt(xSliceSlider.value);
        const ySlice = parseInt(ySliceSlider.value);
        const zSlice = parseInt(zSliceSlider.value);

        // X Slice (Y-Z plane)
        xCtx.clearRect(0, 0, xSliceCanvas.width, xSliceCanvas.height);
        for (let y = 0; y < Z_SIZE; y++) {
            for (let z = 0; z < Y_SIZE; z++) {
                if (grid[y][xSlice][z]) {
                    xCtx.fillStyle = `#${grid[y][xSlice][z].color.toString(16).padStart(6, '0')}`;
                    xCtx.fillRect(z * SLICE_CELL_SIZE, y * SLICE_CELL_SIZE, SLICE_CELL_SIZE, SLICE_CELL_SIZE);
                    xCtx.fillStyle = "black";
                    xCtx.font = "8px Arial";
                    xCtx.textAlign = "center";
                    xCtx.fillText(grid[y][xSlice][z].symbol, z * SLICE_CELL_SIZE + SLICE_CELL_SIZE / 2, y * SLICE_CELL_SIZE + SLICE_CELL_SIZE / 2 + 2);
                } else {
                    xCtx.fillStyle = `rgba(0, ${energy[y][xSlice][z] * 50}, 0, 0.2)`;
                    xCtx.fillRect(z * SLICE_CELL_SIZE, y * SLICE_CELL_SIZE, SLICE_CELL_SIZE, SLICE_CELL_SIZE);
                }
            }
        }

        // Y Slice (X-Z plane)
        yCtx.clearRect(0, 0, ySliceCanvas.width, ySliceCanvas.height);
        for (let x = 0; x < X_SIZE; x++) {
            for (let z = 0; z < Y_SIZE; z++) {
                if (grid[ySlice][x][z]) {
                    yCtx.fillStyle = `#${grid[ySlice][x][z].color.toString(16).padStart(6, '0')}`;
                    yCtx.fillRect(x * SLICE_CELL_SIZE, z * SLICE_CELL_SIZE, SLICE_CELL_SIZE, SLICE_CELL_SIZE);
                    yCtx.fillStyle = "black";
                    yCtx.font = "8px Arial";
                    yCtx.textAlign = "center";
                    yCtx.fillText(grid[ySlice][x][z].symbol, x * SLICE_CELL_SIZE + SLICE_CELL_SIZE / 2, z * SLICE_CELL_SIZE + SLICE_CELL_SIZE / 2 + 2);
                } else {
                    yCtx.fillStyle = `rgba(0, ${energy[ySlice][x][z] * 50}, 0, 0.2)`;
                    yCtx.fillRect(x * SLICE_CELL_SIZE, z * SLICE_CELL_SIZE, SLICE_CELL_SIZE, SLICE_CELL_SIZE);
                }
            }
        }

        // Z Slice (X-Y plane)
        zCtx.clearRect(0, 0, zSliceCanvas.width, zSliceCanvas.height);
        for (let x = 0; x < X_SIZE; x++) {
            for (let y = 0; y < Z_SIZE; y++) {
                if (grid[y][x][zSlice]) {
                    zCtx.fillStyle = `#${grid[y][x][zSlice].color.toString(16).padStart(6, '0')}`;
                    zCtx.fillRect(x * SLICE_CELL_SIZE, y * SLICE_CELL_SIZE, SLICE_CELL_SIZE, SLICE_CELL_SIZE);
                    zCtx.fillStyle = "black";
                    zCtx.font = "8px Arial";
                    zCtx.textAlign = "center";
                    zCtx.fillText(grid[y][x][zSlice].symbol, x * SLICE_CELL_SIZE + SLICE_CELL_SIZE / 2, y * SLICE_CELL_SIZE + SLICE_CELL_SIZE / 2 + 2);
                } else {
                    zCtx.fillStyle = `rgba(0, ${energy[y][x][zSlice] * 50}, 0, 0.2)`;
                    zCtx.fillRect(x * SLICE_CELL_SIZE, y * SLICE_CELL_SIZE, SLICE_CELL_SIZE, SLICE_CELL_SIZE);
                }
            }
        }
    } else {
        generation++;
    }
}

animate();
