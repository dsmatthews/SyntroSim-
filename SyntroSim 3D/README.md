### **3D Syntropic Agriculture Simulation Explanation**
This simulation models a **syntropic agriculture ecosystem** in a **3D environment using Three.js**, where plant species interact, grow, compete, and cooperate within a voxel-based grid. It builds upon the 2D version by adding a **3D representation, interactive controls, and slicing views**.

---

## **1. Grid Representation**
The simulation space is a **3D voxel grid** with:
- **X_SIZE = 12** (width)
- **Y_SIZE = 12** (depth)
- **Z_SIZE = 9** (height, representing vertical plant layers)

Each grid cell is a **voxel (a small cube)** that can be:
1. **Empty**
2. **Occupied by a plant (Protocell)**
3. **Containing an energy value** (available for plant growth)

The grid is stored as a **3D array**:
```javascript
const grid = Array(Z_SIZE).fill().map(() => 
    Array(X_SIZE).fill().map(() => 
        Array(Y_SIZE).fill(null)
    )
);
```
The energy map is also a **3D array**:
```javascript
const energy = Array(Z_SIZE).fill().map((_, z) => 
    Array(X_SIZE).fill().map(() => 
        Array(Y_SIZE).fill().map(() => 
            Math.random() < 0.5 ? (z === 0 || z === 8 ? Math.floor(Math.random() * 6) : Math.floor(Math.random() * 4)) : 0
        )
    )
);
```
- **Higher energy** at **Z=0 (Mycelial layer)** and **Z=8 (Canopy layer)**.
- **Lower energy** in the **middle layers**.

---

## **2. Three.js Setup & Visualization**
The simulation is **fully rendered in 3D** using Three.js.

- **Scene & Camera**:
  - The `scene` contains all 3D elements.
  - The `camera` is positioned to give a clear perspective.
  - `OrbitControls` allows interactive rotation.

- **Lighting**:
  ```javascript
  const ambientLight = new THREE.AmbientLight(0x404040, 1);
  const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
  ```
  - **Ambient Light** provides general illumination.
  - **Directional Light** simulates sunlight.

- **Ground Plane** (Reference for positioning):
  ```javascript
  const groundGeometry = new THREE.PlaneGeometry(X_SIZE * CELL_SIZE, Y_SIZE * CELL_SIZE);
  const groundMaterial = new THREE.MeshBasicMaterial({ color: 0x8B4513, side: THREE.DoubleSide });
  const ground = new THREE.Mesh(groundGeometry, groundMaterial);
  ```
  - Represents the **soil surface**.

---

## **3. Protocell Class (Plant Species)**
Each **plant** is represented as a **Protocell object**, which has:
- **Position** (`x, y, z`).
- **Species** (e.g., Eucalyptus, PigeonPea).
- **Energy levels** (for survival and reproduction).
- **Cooperation Factor** (`coopFactor` → energy-sharing rate).
- **Age & lifecycle management**.

```javascript
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
```
### **Species Characteristics**
Each species has **specific layer preferences**, symbols, and colors:
```javascript
const speciesTraits = {
    "Eucalyptus": { layer: "Canopy", symbol: "E", color: 0x00FFFF, prefZ: 8 },
    "PigeonPea": { layer: "Herbaceous", symbol: "P", color: 0xFF00FF, prefZ: 5 },
    "Comfrey": { layer: "Groundcover", symbol: "C", color: 0x00FF00, prefZ: 4 },
    "Mango": { layer: "Sub-Canopy", symbol: "M", color: 0xFFFF00, prefZ: 7 },
    "Banana": { layer: "Herbaceous", symbol: "B", color: 0x32CD32, prefZ: 5 },
    "SweetPotato": { layer: "Underground", symbol: "S", color: 0xFF4500, prefZ: 3 },
    "PassionFruit": { layer: "Vertical", symbol: "V", color: 0x0000FF, prefZ: 2 },
    "WaterLily": { layer: "Aquatic", symbol: "W", color: 0x00CED1, prefZ: 1 },
    "Mushroom": { layer: "Mycelial", symbol: "F", color: 0xFFFFFF, prefZ: 0 }
};
```
Each plant is represented as a **semi-transparent sphere** in 3D:
```javascript
const geometry = new THREE.SphereGeometry(0.3, 16, 16);
const material = new THREE.MeshPhongMaterial({ color: this.color, transparent: true, opacity: 0.7 });
this.mesh = new THREE.Mesh(geometry, material);
scene.add(this.mesh);
```
A **floating text label** displays the species symbol:
```javascript
ctx.fillText(this.symbol, 16, 16);
```

---

## **4. Protocell Lifecycle**
### **(a) Energy Uptake & Cooperation**
Plants **gain energy** from their grid cell:
```javascript
this.energy += energy[this.y][this.x][this.z];
```
Plants **share energy** with neighbors based on their `coopFactor`:
```javascript
for (const [dx, dy, dz] of directions) {
    if (grid[nz][nx][ny]) {
        grid[nz][nx][ny].energy += this.coopFactor * boost;
    }
}
```
- **"Support Species" (PigeonPea, Comfrey, Eucalyptus) give a boost**.

### **(b) Energy Cost & Death**
Plants **lose energy per cycle**:
```javascript
const cost = ["Eucalyptus", "Mango", "Papaya"].includes(this.species) ? 3 : 
             ["PigeonPea", "Banana", "Coffee"].includes(this.species) ? 2 : 1;
this.energy -= cost;
```
If energy **drops to 0**, or if a pioneer species **ages beyond 10 cycles**, it **dies**.

---

## **5. Reproduction (Replication)**
If a plant has **>20 energy**, it tries to reproduce:
```javascript
if (Math.abs(ny - this.prefY) <= 1) { 
    grid[ny][nx][nz] = new Protocell(nx, nz, ny, this.species, 10, newCoop, isPioneer);
    this.energy -= 10;
}
```
- **Prefers nearby empty cells**.
- **Pioneers may mutate into other species**.

---

## **6. Interactive Features**
### **2D Slices for Analysis**
The simulation provides **interactive slice views**:
- **X-Slice (Y-Z plane)**
- **Y-Slice (X-Z plane)**
- **Z-Slice (X-Y plane)**

These are drawn on **HTML5 canvas elements**:
```javascript
const xSliceCanvas = document.getElementById("xSliceCanvas");
const ySliceCanvas = document.getElementById("ySliceCanvas");
const zSliceCanvas = document.getElementById("zSliceCanvas");
```

Users **adjust the slicing plane** using sliders:
```html
<label>X Slice: <input type="range" id="xSlice" min="0" max="11" value="5"></label>
```

---

## **7. Simulation Logic**
### **(a) Update Organisms**
Each plant:
- **Consumes energy**
- **Shares energy**
- **Dies if necessary**
- **Attempts to reproduce**

### **(b) Rendering**
- **3D view (Three.js)**
- **2D slice views (Canvas)**
- **Statistical display**:
```javascript
statsDiv.innerHTML = `<strong>Generation:</strong> ${generation}<br>...`;
```

---

## **Conclusion**
This **3D syntropic agriculture simulation**:
- **Models plant interactions in 3D space**.
- **Includes real-time rendering with Three.js**.
- **Allows slicing for internal analysis**.
- **Demonstrates syntropic agriculture principles dynamically**.
