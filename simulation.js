// Grid dimensions
const X_SIZE = 12;
const Y_SIZE = 12;
const Z_SIZE = 9;
const CELL_SIZE = 20; // Pixels per cell
const grid = Array(Z_SIZE).fill().map(() => 
    Array(X_SIZE).fill().map(() => 
        Array(Y_SIZE).fill(null)
    )
);

// Energy distribution
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
        this.y = y;
        this.z = z;
        this.species = species;
        this.energy = energy;
        this.coopFactor = coopFactor;
        this.isPioneer = isPioneer;
        const traits = this.assignTraits();
        this.layerType = traits.layer;
        this.symbol = traits.symbol;
        this.color = traits.color;
        this.prefZ = traits.prefZ;
        this.age = 0;
    }

    assignTraits() {
        const speciesTraits = {
            "Eucalyptus": { layer: "Canopy", symbol: "E", color: "#00FFFF", prefZ: 8 },
            "PigeonPea": { layer: "Herbaceous", symbol: "P", color: "#FF00FF", prefZ: 5 },
            "Comfrey": { layer: "Groundcover", symbol: "C", color: "#00FF00", prefZ: 4 },
            "Mango": { layer: "Sub-Canopy", symbol: "M", color: "#FFFF00", prefZ: 7 },
            "Banana": { layer: "Herbaceous", symbol: "B", color: "#32CD32", prefZ: 5 },
            "SweetPotato": { layer: "Underground", symbol: "S", color: "#FF4500", prefZ: 3 },
            "PassionFruit": { layer: "Vertical", symbol: "V", color: "#0000FF", prefZ: 2 },
            "WaterLily": { layer: "Aquatic", symbol: "W", color: "#00CED1", prefZ: 1 },
            "Mushroom": { layer: "Mycelial", symbol: "F", color: "#FFFFFF", prefZ: 0 },
            "Papaya": { layer: "Canopy", symbol: "Y", color: "#FFD700", prefZ: 8 },
            "Coffee": { layer: "Shrub", symbol: "K", color: "#DC143C", prefZ: 6 },
            "Blueberry": { layer: "Shrub", symbol: "L", color: "#4169E1", prefZ: 6 },
            "Strawberry": { layer: "Groundcover", symbol: "T", color: "#FF6347", prefZ: 4 }
        };
        return speciesTraits[this.species] || { layer: "Groundcover", symbol: "C", color: "#00FF00", prefZ: 4 };
    }

    update() {
        this.energy += energy[this.z][this.x][this.y];
        this.age++;
        const directions = [[-1,0,0], [1,0,0], [0,-1,0], [0,1,0], [0,0,-1], [0,0,1]];
        for (const [dx, dy, dz] of directions) {
            const nx = this.x + dx, ny = this.y + dy, nz = this.z + dz;
            if (nx >= 0 && nx < X_SIZE && ny >= 0 && ny < Y_SIZE && nz >= 0 && nz < Z_SIZE && grid[nz][nx][ny]) {
                const boost = ["PigeonPea", "Comfrey", "Eucalyptus"].includes(this.species) ? 2 : 1;
                grid[nz][nx][ny].energy += this.coopFactor * boost;
            }
        }
        const cost = ["Eucalyptus", "Mango", "Papaya"].includes(this.species) ? 3 : 
                     ["PigeonPea", "Banana", "Coffee"].includes(this.species) ? 2 : 1;
        this.energy -= cost;
        if (this.energy <= 0 || (this.isPioneer && this.age > 10)) {
            grid[this.z][this.x][this.y] = null;
            return false;
        }
        return true;
    }

    replicate() {
        if (this.energy <= 20) return false;
        const directions = [[-1,0,0], [1,0,0], [0,-1,0], [0,1,0], [0,0,-1], [0,0,1]];
        directions.sort(() => Math.random() - 0.5);
        for (const [dx, dy, dz] of directions) {
            const nx = this.x + dx, ny = this.y + dy, nz = this.z + dz;
            if (nx >= 0 && nx < X_SIZE && ny >= 0 && ny < Y_SIZE && nz >= 0 && nz < Z_SIZE && !grid[nz][nx][ny] && Math.random() < 0.5) {
                if (Math.abs(nz - this.prefZ) <= 1) {
                    const newCoop = Math.max(0, Math.min(1, this.coopFactor + (Math.random() * 0.2 - 0.1)));
                    let newSpecies = this.species;
                    let isPioneer = this.isPioneer;
                    if (this.isPioneer && Math.random() < 0.2) {
                        newSpecies = ["Mango", "Banana", "Papaya"][Math.floor(Math.random() * 3)];
                        isPioneer = false;
                    }
                    grid[nz][nx][ny] = new Protocell(nx, ny, nz, newSpecies, 10, newCoop, isPioneer);
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
    const y = Math.floor(Math.random() * Y_SIZE);
    const species = speciesList[Math.floor(Math.random() * speciesList.length)];
    const tempCell = new Protocell(0, 0, 0, species);
    let z = tempCell.prefZ + Math.floor(Math.random() * 3 - 1);
    z = Math.max(0, Math.min(Z_SIZE - 1, z));
    grid[z][x][y] = new Protocell(x, y, z, species, 10, Math.random(), ["Eucalyptus", "PigeonPea"].includes(species));
}

// Canvas setup
const layerNames = ["Mycelial", "Aquatic", "Vertical", "Underground", "Groundcover", 
                    "Herbaceous", "Shrub", "Sub-Canopy", "Canopy"];
const canvases = [];
const ctxs = [];
const container = document.getElementById("canvasContainer");
for (let z = 0; z < Z_SIZE; z++) {
    const canvas = document.createElement("canvas");
    canvas.width = X_SIZE * CELL_SIZE;
    canvas.height = Y_SIZE * CELL_SIZE + 20;
    canvas.title = layerNames[z];
    container.appendChild(canvas);
    canvases.push(canvas);
    ctxs.push(canvas.getContext("2d"));
}

// Simulation logic
let generation = 0;
function runSimulation() {
    generation++;
    
    // Update all cells
    const organisms = [];
    for (let z = 0; z < Z_SIZE; z++) {
        for (let x = 0; x < X_SIZE; x++) {
            for (let y = 0; y < Y_SIZE; y++) {
                if (grid[z][x][y]) organisms.push([x, y, z, grid[z][x][y]]);
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
    for (let z = 0; z < Z_SIZE; z++) {
        for (let x = 0; x < X_SIZE; x++) {
            for (let y = 0; y < Y_SIZE; y++) {
                if (grid[z][x][y]) {
                    alive++;
                    totalCoop += grid[z][x][y].coopFactor;
                    speciesCount[grid[z][x][y].species]++;
                }
            }
        }
    }
    const coopAvg = alive ? totalCoop / alive : 0;

    // Render
    for (let z = 0; z < Z_SIZE; z++) {
        const ctx = ctxs[z];
        ctx.clearRect(0, 0, canvases[z].width, canvases[z].height);
        ctx.fillStyle = "#000";
        ctx.font = "14px Arial";
        ctx.textAlign = "center";
        ctx.fillText(layerNames[z], canvases[z].width / 2, 15);
        for (let x = 0; x < X_SIZE; x++) {
            for (let y = 0; y < Y_SIZE; y++) {
                if (grid[z][x][y]) {
                    ctx.fillStyle = grid[z][x][y].color;
                    ctx.beginPath();
                    ctx.arc(x * CELL_SIZE + CELL_SIZE / 2, y * CELL_SIZE + CELL_SIZE / 2 + 20, CELL_SIZE / 2 - 2, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.fillStyle = "#000";
                    ctx.font = "12px Arial";
                    ctx.textAlign = "center";
                    ctx.fillText(grid[z][x][y].symbol, x * CELL_SIZE + CELL_SIZE / 2, y * CELL_SIZE + CELL_SIZE / 2 + 24);
                } else {
                    ctx.fillStyle = `rgba(0, ${energy[z][x][y] * 50}, 0, 0.2)`;
                    ctx.fillRect(x * CELL_SIZE, y * CELL_SIZE + 20, CELL_SIZE, CELL_SIZE);
                }
            }
        }
    }

    // Update stats
    const statsDiv = document.getElementById("stats");
    statsDiv.innerHTML = `
        <strong>Generation:</strong> ${generation}<br>
        <strong>Population:</strong> ${alive}<br>
        <strong>Avg Cooperation:</strong> ${coopAvg.toFixed(2)}<br>
        <strong>Species Counts:</strong><br>
        ${speciesList.map(s => speciesCount[s] > 0 ? 
            `  ${s}: ${speciesCount[s]} (<span style="color:${new Protocell(0,0,0,s).color}">${new Protocell(0,0,0,s).symbol}</span>)` : 
            "").filter(Boolean).join("<br>")}
    `;

    if (alive > 0) {
        setTimeout(runSimulation, 500);
    } else {
        statsDiv.innerHTML += "<br><strong>Ecosystem collapsed!</strong>";
    }
}

// Start simulation
runSimulation();

