This JavaScript simulation models a **syntropic agriculture ecosystem** using a **3D grid**, where different plant species (protocells) interact, grow, compete, and reproduce based on **energy availability** and **cooperation factors**. The code initializes a grid, populates it with various species, updates their energy levels, and renders their evolution over time. It is like a game of Go (囲碁) but in 3D and with potentially hundreds of players, plus all of the usual ecosystem dynamics. It would be interesting to teach an AI to "understand" this well enough to help manage such a system in a productive and sustainable manner.

---

## **1. Grid Representation**
The environment is represented as a **3D grid** with the following dimensions:
- **X_SIZE = 12** (width)
- **Y_SIZE = 12** (height)
- **Z_SIZE = 9** (layers, representing different plant strata from soil to canopy)
- Each cell is **20x20 pixels** for visualization.

The grid is stored as a **nested array**:

\[
\text{grid}[z][x][y]
\]

Each cell can either contain a **Protocell object** or be `null`.

**Diagram: 3D Grid Structure**
```
Z (height)
|
|  [ ][ ][ ]  [ ][ ][ ]
|  [ ][P][ ]  [ ][ ][ ]
|  [ ][ ][ ]  [ ][E][ ]
|______________________
      X → (width)
```
- `E`: Eucalyptus (Canopy layer, Z = 8)
- `P`: Pigeon Pea (Herbaceous layer, Z = 5)

---

## **2. Energy Distribution**
Each cell gets a **random energy value** based on its **layer (Z-level)**:
- **Top & Bottom layers (Z=0 or Z=8)** get **0-5 units**.
- **Middle layers (Z=1 to Z=7)** get **0-3 units**.

This is stored in another **3D array** called `energy[z][x][y]`.

**Energy Layer Example (Side View)**
```
Z=8 (Top Canopy)   [3]  [0]  [1]  [2]
Z=7 (Sub-Canopy)   [1]  [0]  [3]  [2]
...
Z=1 (Aquatic)      [0]  [3]  [1]  [0]
Z=0 (Mycelial)     [5]  [2]  [4]  [0]
```

---

## **3. Protocell Class**
Each `Protocell` object represents a **plant species** and contains:
- **Position**: (`x`, `y`, `z`)
- **Species & Traits** (e.g., Eucalyptus prefers the canopy, `prefZ = 8`).
- **Energy**: Each protocell consumes and gains energy.
- **Cooperation Factor** (`coopFactor`): Determines how much energy it shares with nearby cells.
- **Age**: Increments over time; pioneers die faster.

```javascript
class Protocell {
    constructor(x, y, z, species, energy = 10, coopFactor = 0.5, isPioneer = false) {
```

---

## **4. Protocell Behavior**
Each protocell updates every cycle:

### **(a) Energy Uptake & Cooperation**
- Gains energy from its grid cell:
  ```javascript
  this.energy += energy[this.z][this.x][this.y];
  ```
- Shares energy with **neighboring protocells** (6 possible directions: left, right, up, down, front, back):
  ```javascript
  for (const [dx, dy, dz] of directions) {
      if (grid[nz][nx][ny]) {
          grid[nz][nx][ny].energy += this.coopFactor * boost;
      }
  }
  ```
- Energy cost per species:
  ```javascript
  const cost = ["Eucalyptus", "Mango", "Papaya"].includes(this.species) ? 3 : 
               ["PigeonPea", "Banana", "Coffee"].includes(this.species) ? 2 : 1;
  this.energy -= cost;
  ```

### **(b) Death Condition**
If energy drops to `0`, or if the protocell is a **pioneer species** and lives past `10` cycles, it **dies** (`null` is placed in the grid).

---

## **5. Reproduction (Replication)**
If a protocell has **> 20 energy**, it attempts to **replicate into a nearby empty cell** with a small mutation in cooperation factor.

- Prefers **Z-layer close to its preferred height** (`prefZ`).
- Pioneers may **mutate into different species** (e.g., Mango, Banana, Papaya).
- Loses `10` energy when reproducing.

```javascript
if (Math.abs(nz - this.prefZ) <= 1) { 
    grid[nz][nx][ny] = new Protocell(nx, ny, nz, this.species, 10, newCoop, isPioneer);
    this.energy -= 10;
}
```

---

## **6. Initialization**
Fifteen protocells are randomly placed in the grid.

```javascript
for (let i = 0; i < 15; i++) {
    const x = Math.floor(Math.random() * X_SIZE);
    const y = Math.floor(Math.random() * Y_SIZE);
    const species = speciesList[Math.floor(Math.random() * speciesList.length)];
    const tempCell = new Protocell(0, 0, 0, species);
    let z = tempCell.prefZ + Math.floor(Math.random() * 3 - 1);
    grid[z][x][y] = new Protocell(x, y, z, species, 10, Math.random(), ["Eucalyptus", "PigeonPea"].includes(species));
}
```

---

## **7. Visualization**
Each **Z-layer** is drawn on a separate **canvas**.

### **Canvas Layers**
1. **Draw protocells** (filled circles, colored per species).
2. **Draw energy levels** (green-tinted squares).
3. **Display species symbol inside circles**.

```javascript
ctx.fillStyle = grid[z][x][y].color;
ctx.beginPath();
ctx.arc(x * CELL_SIZE + CELL_SIZE / 2, y * CELL_SIZE + CELL_SIZE / 2 + 20, CELL_SIZE / 2 - 2, 0, Math.PI * 2);
ctx.fill();
```

### **Rendered Layers (Example)**
```
[Canopy]   🌳 🌳 🌳
[Sub-Canopy]   🍌 🥭
[Herbaceous]   🌿 🍓
[Groundcover]   🥬 🍠
```

---

## **8. Simulation Logic**
### **(a) Update Organisms**
- Iterate through all protocells, call:
  - `.update()` (Energy gain/loss, death check).
  - `.replicate()` (If energy is high).

### **(b) Render Grid**
- **Alive cells** are drawn as colored circles.
- **Empty cells** show energy as green squares.

### **(c) Display Stats**
- Generation count
- Population size
- Average cooperation factor
- Species counts (Eucalyptus: 🌳3, Mango: 🥭2, etc.)

```javascript
statsDiv.innerHTML = `
    <strong>Generation:</strong> ${generation}<br>
    <strong>Population:</strong> ${alive}<br>
    <strong>Avg Cooperation:</strong> ${coopAvg.toFixed(2)}<br>
`;
```

---

## **9. End Condition**
- If all protocells die → `"Ecosystem collapsed!"`
- Otherwise, simulation continues.

```javascript
if (alive > 0) {
    setTimeout(runSimulation, 500);
} else {
    statsDiv.innerHTML += "<br><strong>Ecosystem collapsed!</strong>";
}
```

---

## **Conclusion**
This **syntropic agriculture simulation** models a **dynamic 3D ecosystem** where:
- Plants compete and cooperate for energy.
- Some species support others (e.g., **PigeonPea & Comfrey boost neighbors**).
- Pioneers colonize first but die early.
- The ecosystem adapts, changes, and evolves over time.

The **visual representation** in multiple canvas layers helps analyze plant interactions in a structured way.
