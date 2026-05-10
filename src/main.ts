import { blur } from "./blur";
import { Car } from "./car";
import { initState, Metric, State, TileType } from "./state";
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
    blur(state);
    // state.map.getIf(2,2,v=>v.buffers[state.writeBuffer].housing = 0); // we should see this value blur
    // state.map.getIf(5,15,v=>v.buffers[state.writeBuffer].unemployment = 1); // we should see this value blur
  
    // TODO stuff
    // Buidlings
    state.buildings.forEach(b=>{
        b.update(state, state.writeBuffer)
    })
    // Cars
    state.cars = state.cars.filter((c) => !c.dead);
    state.cars.forEach((c) => c.update(state.readBuffer, state));

}

const SCALE = 20;
function render(state: State) {
    const RED: Metric = "housing";
    const GREEN: Metric = "unemployment";

    // tiles
    state.map.forEach((x, y, v) => {
        const r =255 - Math.min(255, (Math.abs(v.buffers[state.readBuffer][RED]) * 10));
        const g =255 - Math.min(255, (Math.abs(v.buffers[state.readBuffer][GREEN]) * 10));
        const b = v.type == TileType.ROAD ? 64 * 3 : 64;
        x == 7 && y == 15 && Math.random()<0.1 && console.log( `rgb(${r},${g},${b})`,v.buffers[state.readBuffer][GREEN]);
        ctx.fillStyle = `rgb(${r},${g},${b})`;
        ctx.fillRect(x * SCALE, y * SCALE, SCALE, SCALE);
    });

    // Cars
    state.cars.forEach((c) => {
        ctx.fillStyle = "blue";
        ctx.fillRect(c.x * SCALE - 2, c.y * SCALE - 2, 5, 5);
        ctx.fillStyle = "white";
        ctx.fillRect(c.x * SCALE - 1, c.y * SCALE - 1, 3, 3);
    });

    // Buidlings
    ctx.strokeStyle = "red";
    ctx.fillStyle = "limegreen";
    state.buildings.forEach((c) => {
        ctx.strokeRect(c.x * SCALE, c.y * SCALE, SCALE, SCALE);
        ctx.fillText(c.getText(), c.x * SCALE, c.y * SCALE);
    });

    // zones
     ctx.strokeStyle = "yellow";
    state.zones.forEach((z) => {
        ctx.strokeRect(z.x * SCALE, z.y * SCALE, z.w*SCALE, z.h*SCALE);
    });

}

function tick(time: number) {
    update(state, time);
    render(state);
    window.requestAnimationFrame(tick);
}
window.requestAnimationFrame(tick);

canvas.addEventListener("click", (evt) => {
    const x = Math.floor(evt.offsetX / SCALE);
    const y = Math.floor(evt.offsetY / SCALE);
    console.log("click", x, y);
    //   state.map.getIf( Math.floor(evt.offsetX / SCALE), Math.floor(evt.offsetY / SCALE), v=>console.log(JSON.stringify(v)));
    // state.cars.push(new Car(x+0.5,y+0.5,"housing"));
    if(state.tool){
        state.tool.onClick(state, x, y);
    }
});


function initTools(state:State){
    const div = document.getElementById("tools") as HTMLDivElement;
    const toolButtons = ALL_TOOLS.map(t=>{
        const b = document.createElement("button");
        b.innerText = t.name;
        b.addEventListener("click", ()=>{
            console.log("Selected tool", t.name);
            state.tool = t;
        });
        return b;
    });
    toolButtons.forEach(t=>div.appendChild(t));
}
initTools(state);