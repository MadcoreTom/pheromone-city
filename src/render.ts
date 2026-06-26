import { Car } from "./car";
import { Metric, State, Tile, RenderMode } from "./state";


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
    getPower(state: State, tile: Tile): number {
        return (255 - Math.min(255, (Math.abs(tile.buffers[state.readBuffer][this.metric]) * 10)))/255;
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
    getPower(state: State, tile: Tile): number {
        return (255 - Math.min(255, tile.buffers[state.readBuffer].traffic * 20))/255;
    }
}

export const RENDER_MODES:RenderMode[] = [
    new RenderModeMetric("unemployment"),
    new RenderModeMetric("housing"),
    new RenderModeMetric("shopping"),
    new RenderModeTraffic()
]