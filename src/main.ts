import { blur } from "./blur";
import { SCALE } from "./constants";
import { render, RENDER_MODES } from "./render";
import { initState, Metric, State, TileType } from "./state";
import { ALL_TOOLS } from "./tools";

console.log("Hello main");

const canvas = document.querySelector("canvas")!;
const ctx = canvas.getContext("2d")!;

const state: State = initState();
// Hacky way to add things using tools
ALL_TOOLS[3].onClick(state,3,2);
ALL_TOOLS[3].onClick(state,9,4);
ALL_TOOLS[3].onClick(state,2,9);
ALL_TOOLS[4].onClick(state,15,7);
ALL_TOOLS[4].onClick(state,12,14);
ALL_TOOLS[5].onClick(state,3,14);


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
    state.cars.forEach((c) => c.update(state.readBuffer, state, delta));

}


function tick(time: number) {
    update(state, time);
     render(ctx,state,time);
    window.requestAnimationFrame(tick);
}
window.requestAnimationFrame(tick);

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
            if(rm !== state.renderMode){
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