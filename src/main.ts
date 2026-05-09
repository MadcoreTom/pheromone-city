import { blur } from "./blur";
import { initState, Metric, State, TileType } from "./state";

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
    state.map.getIf(2,2,v=>v.buffers[state.writeBuffer].housing = 0); // we should see this value blur
    state.map.getIf(5,15,v=>v.buffers[state.writeBuffer].unemployment = 1); // we should see this value blur
  
    // TODO stuff
    
    //   state.cars = state.cars.filter((c) => !c.dead);
    //   state.cars.forEach((c) => c.update(readBuffer, state));

}

const SCALE = 20;
function render(state: State) {
    const RED: Metric = "housing";
    const GREEN: Metric = "unemployment";

    state.map.forEach((x, y, v) => {
        const r =255 - Math.min(255, (Math.abs(v.buffers[state.readBuffer][RED]) * 10));
        const g =255 - Math.min(255, (Math.abs(v.buffers[state.readBuffer][GREEN]) * 10));
        const b = v.type == TileType.ROAD ? 64 * 3 : 64;
        x == 7 && y == 15 && Math.random()<0.1 && console.log( `rgb(${r},${g},${b})`,v.buffers[state.readBuffer][GREEN]);
        ctx.fillStyle = `rgb(${r},${g},${b})`;
        ctx.fillRect(x * SCALE, y * SCALE, SCALE, SCALE);
    });

}

function tick(time: number) {
    update(state, time);
    render(state);
    window.requestAnimationFrame(tick);
}
window.requestAnimationFrame(tick);

canvas.addEventListener("click", (evt) => {
  console.log("click", Math.floor(evt.offsetX / SCALE), Math.floor(evt.offsetY / SCALE));
  state.map.getIf( Math.floor(evt.offsetX / SCALE), Math.floor(evt.offsetY / SCALE), v=>console.log(JSON.stringify(v)));
});
