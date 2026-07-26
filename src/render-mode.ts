import { PolarGridHelper } from "three";
import { Car } from "./car";
import { Metric, State, Tile, RenderMode } from "./state";


class RenderModeMetric implements RenderMode {
    public constructor(public readonly metric:Metric, private readonly displayName: string){

    }
    highlightCar(car:Car):boolean{
        return car.target === this.metric;
    }
    getName():string{
        return this.displayName;
    }
    getPower(state: State, tile: Tile): number {
        return (255 - Math.min(255, (Math.abs(tile.buffers[state.readBuffer][this.metric]) * 10)))/255;
    }
}

class RenderModeTraffic implements RenderMode {

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

class RenderModePollution implements RenderMode {

    highlightCar(car:Car):boolean{
        return true;
    }
    getName():string{
        return "Pollution";
    }
    getPower(state: State, tile: Tile): number {
        return Math.min(255, (Math.abs(tile.buffers[state.readBuffer].pollution) * 64 - 32))/255;
    }
}

export const RENDER_MODES:RenderMode[] = [
    new RenderModeMetric("unemployment", "Jobs"),
    new RenderModeMetric("housing", "Housing"),
    new RenderModeMetric("shopping", "Goods"),
    new RenderModeMetric("entertainment", "Entertainment"),
    new RenderModePollution(),
    new RenderModeTraffic()
]