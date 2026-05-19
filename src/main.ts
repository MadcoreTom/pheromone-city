import { AmbientLight, DirectionalLight, InstancedMesh, Matrix4, Mesh, Scene, WebGLRenderer } from "three";
import { blur } from "./blur";
import { MAX_CAR_RENDER_COUNT, SCALE } from "./constants";
import { render, RENDER_MODES } from "./render";
import { initScene } from "./scene/init";
import { initState, State, TileType } from "./state";
import { ALL_TOOLS } from "./tools";

console.log("Hello main");

const canvas = document.querySelector("canvas")!;
const ctx = canvas.getContext("2d")!;

const state: State = initState();


let lastFrameTime = 0;
function update(state: State, time: number) {
    const delta = Math.min(100, time - lastFrameTime);
    lastFrameTime = time;

    // Swap buffers
    [state.readBuffer, state.writeBuffer] = [state.writeBuffer, state.readBuffer];
    blur(state, delta);

    state.zones.forEach(z => z.update(state, delta));
    // Cars
    state.cars = state.cars.filter((c) => !c.dead);
    state.cars.forEach((c) => c.update(state, delta));

    const aliveCars = state.cars.filter(c => !c.dead);
    const ci: InstancedMesh = state.scene.getObjectByName("instanced_cars")! as InstancedMesh;
    ci.count = aliveCars.length;
    aliveCars.forEach((c, i) => {
        const mat =  new Matrix4();
        mat.makeTranslation(c.x - state.map.width/2, 0, c.y - state.map.height/2-1);
        mat.multiply(new Matrix4().makeRotationY(c.yaw))
        ci.setMatrixAt(i,mat);
    })
    ci.instanceMatrix.needsUpdate = true;

    // spinning camera
    state.camera.position.set(Math.sin(time/10000)*10,10,Math.cos(time/10000)*10);
    state.camera.lookAt(0,0,0)
}


function tick(time: number) {
    update(state, time);
    render(ctx, state, time);
    renderer.render(state.scene, state.camera)
    window.requestAnimationFrame(tick);
}

canvas.addEventListener("click", (evt) => {
    const x = Math.floor(evt.offsetX / SCALE);
    const y = Math.floor(evt.offsetY / SCALE);
    console.log("click", x, y);
    //   state.map.getIf( Math.floor(evt.offsetX / SCALE), Math.floor(evt.offsetY / SCALE), v=>console.log(JSON.stringify(v)));
    // state.cars.push(new Car(x+0.5,y+0.5,"housing"));
    if (state.tool && state.tool.onHover(state, x, y)) {
        state.tool.onClick(state, x, y);
    }
});

canvas.addEventListener("mousemove", (evt) => {
    const x = Math.floor(evt.offsetX / SCALE);
    const y = Math.floor(evt.offsetY / SCALE);
    state.mouse[0] = x;
    state.mouse[1] = y;
});

function initTools(state: State) {
    const div = document.getElementById("tools") as HTMLDivElement;
    const toolButtons = ALL_TOOLS.map(t => {
        const b = document.createElement("button");
        b.innerText = t.name;
        b.addEventListener("click", () => {
            console.log("Selected tool", t.name);
            state.tool = t;
            toolButtons.forEach(b => b.classList = "");
            b.classList = "tool-selected";
        });
        return b;
    });
    toolButtons.forEach(t => div.appendChild(t));

    // render modes
    const div2 = document.getElementById("render-modes") as HTMLDivElement;
    const rmButtons = RENDER_MODES.map(rm => {
        const b = document.createElement("button");
        b.innerText = rm.getName();
        b.addEventListener("click", () => {
            console.log("Selected render mode", rm.getName());
            if (rm !== state.renderMode) {
                state.renderMode = rm;
                rmButtons.forEach(b => b.classList = "");
                b.classList = "tool-selected";
            } else {
                state.renderMode = undefined;
                b.classList = "";
            }
        });
        return b;
    });
    rmButtons.forEach(t => div2.appendChild(t));
}
initTools(state);

async function start() {
    await initScene(state);
    // Hacky way to add things using tools
    ALL_TOOLS[3].onClick(state, 3, 2);
    ALL_TOOLS[3].onClick(state, 9, 4);
    ALL_TOOLS[3].onClick(state, 2, 9);
    ALL_TOOLS[4].onClick(state, 15, 7);
    ALL_TOOLS[4].onClick(state, 12, 14);
    ALL_TOOLS[5].onClick(state, 3, 14);


    state.map.forEach((x, y, v) => {
        if (v.zone) {
            const m = state.assets["house"].clone();
            // m.matrix.copy(new Matrix4().makeTranslation(x, 0, y));
            m.position.set(x - state.map.width / 2, 0, y - state.map.height / 2);
            state.scene.add(m);
            v.object = m;
        } else if (v.type == TileType.ROAD) {
            const m = state.assets["road"].clone();
            // m.matrix.copy(new Matrix4().makeTranslation(x, 0, y));
            m.position.set(x - state.map.width / 2, 0, y - state.map.height / 2);
            state.scene.add(m);
            v.object = m;
        } else if (v.type == TileType.GRASS) {
            const m = state.assets["blank"].clone();
            // m.matrix.copy(new Matrix4().makeTranslation(x, 0, y));
            m.position.set(x - state.map.width / 2, 0, y - state.map.height / 2);
            state.scene.add(m);
            v.object = m;
        }
    });

    // cars
    const cars = new InstancedMesh(state.assets["car"].geometry, state.assets["car"].material, MAX_CAR_RENDER_COUNT);
    cars.name = "instanced_cars";
    state.scene.add(cars);


    const light = new DirectionalLight("#ffffff", 3);
    light.position.set(-8, -10, -7)
    light.lookAt(0, 0, 0);
    state.scene.add(light);

    state.scene.add(new AmbientLight(0xffffff, 0.5));

    state.camera.position.set(10, 10, 10);
    state.camera.up.set(0, -1, 0);
    state.camera.lookAt(0, 0, 0);

    console.log("Start")
    window.requestAnimationFrame(tick);
}

// init three.js canvas
// Renderer
const renderer = new WebGLRenderer({ antialias: true });
renderer.setSize(600, 600);
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setClearColor("#95CDE9");
// renderer.shadowMap.enabled = true;
// renderer.shadowMap.type = PCFShadowMap; //  Makes shadow edges smoother
canvas.parentNode!.insertBefore(renderer.domElement, canvas.nextSibling)
renderer.domElement.style.float = "right"
// document.body.appendChild(renderer.domElement);

start();
