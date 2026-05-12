import { blur } from "./blur";
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


let lastFrameTime = 0;
function update(state: State, time: number) {
    const delta = Math.min(100, time - lastFrameTime);
    lastFrameTime = time;

    // Swap buffers
    [state.readBuffer, state.writeBuffer] = [state.writeBuffer, state.readBuffer];
    blur(state);

    state.zones.forEach(z => z.update(state, delta));
    // Cars
    state.cars = state.cars.filter((c) => !c.dead);
    state.cars.forEach((c) => c.update(state.readBuffer, state));

}

const SCALE = 20;
function render(state: State, time: number) {
    const RED: Metric = "housing";
    const GREEN: Metric = "unemployment";

    // tiles
    state.map.forEach((x, y, v) => {
        const r = 255 - Math.min(255, (Math.abs(v.buffers[state.readBuffer][RED]) * 10));
        const g = 255 - Math.min(255, (Math.abs(v.buffers[state.readBuffer][GREEN]) * 10));
        const b = v.type == TileType.ROAD ? 64 * 3 : 64;
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

    // zones
    ctx.strokeStyle = "yellow";
    ctx.fillStyle = "lime";
    state.zones.forEach((z) => {
        ctx.strokeRect(z.x * SCALE, z.y * SCALE, z.w * SCALE, z.h * SCALE);
        ctx.fillText(z.getText(), z.x * SCALE, z.y * SCALE);
    });

    // hover
    if (state.tool !== undefined) {
        if (state.tool.onHover(state, state.mouse[0], state.mouse[1])) {
            ctx.strokeStyle = time % 400 < 200 ? "yellow" : "limegreen";
        } else {
            ctx.strokeStyle = "red";
            ctx.setLineDash([4, 4]);
        }
        ctx.strokeRect(state.mouse[0] * SCALE, state.mouse[1] * SCALE, state.tool!.w * SCALE, state.tool!.h * SCALE);
        ctx.setLineDash([]);
    }

}

function tick(time: number) {
    update(state, time);
    render(state, time);
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
}
initTools(state);