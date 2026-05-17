import { Car } from "./car";
import { SCALE } from "./constants";
import { Metric, State, TileType, Tile, RenderMode } from "./state";

export function render(ctx: CanvasRenderingContext2D, state: State, time: number) {
  
    // const RED: Metric = "housing";
    // const GREEN: Metric = "unemployment";

    const tileColour = state.renderMode ? (t:Tile)=>state.renderMode!.getTileFill(state,t) : (tile:Tile)=>"grey";

    // tiles
    state.map.forEach((x, y, v) => {
        // const r = 255 - Math.min(255, (Math.abs(v.buffers[state.readBuffer][RED]) * 10));
        // const g = 255 - Math.min(255, (Math.abs(v.buffers[state.readBuffer][GREEN]) * 10));
        // const b = v.type == TileType.ROAD ? 0 : 255;
        // ctx.fillStyle = `rgb(${r},${g},${b})`;
        ctx.fillStyle = v.type == TileType.ROAD ? tileColour(v) : "blue";
        ctx.fillRect(x * SCALE, y * SCALE, SCALE, SCALE);
    });

    // Cars
    const carSize = state.renderMode ? (car:Car)=>state.renderMode!.highlightCar(car) : (car:Car)=>false;
    state.cars.forEach((c) => {
        const s = carSize(c) ? 4 : 2
        ctx.fillStyle = "blue";
        ctx.fillRect(c.x * SCALE - s, c.y * SCALE - s, s*2+1, s*2+1);
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
class RenderModeMetric implements RenderMode {
    public constructor(public readonly metric:Metric){

    }
    getTileFill(state: State, tile: Tile): string {
        const g = 255 - Math.min(255, (Math.abs(tile.buffers[state.readBuffer][this.metric]) * 10));
        const r = 255 - g;
        return `rgb(${r},${g}, 0)`;
    }
    highlightCar(car:Car):boolean{
        return car.target === this.metric;
    }
    getName():string{
        return this.metric;
    }
}

class RenderModeTraffic implements RenderMode {

    getTileFill(state: State, tile: Tile): string {
        const g = 255 - Math.min(255, tile.buffers[state.readBuffer].traffic * 20);
        const r = 255 - g;
        return `rgb(${r},${g}, 0)`;
    }
    highlightCar(car:Car):boolean{
        return true;
    }
    getName():string{
        return "Traffic";
    }
}

export const RENDER_MODES:RenderMode[] = [
    new RenderModeMetric("unemployment"),
    new RenderModeMetric("housing"),
    new RenderModeMetric("shopping"),
    new RenderModeTraffic()
]