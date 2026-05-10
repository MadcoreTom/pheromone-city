import { Car } from "./car";
import { State, TileType } from "./state";

export abstract class Tool {
    public constructor(public readonly name: string) {

    }

    public render(context: CanvasRenderingContext2D, x: number, y: number, scale: number): void {

    }

    public abstract onClick(state: State, x: number, y: number): void;
}

class RoadTool extends Tool {
    public constructor() {
        super("Road");
    }

    public onClick(state: State, x: number, y: number) {
        state.map.getIf(Math.floor(x), Math.floor(y), t => {
            t.type = TileType.ROAD;
        });
    }
}


class DemolishTool extends Tool {
    public constructor() {
        super("Demolish");
    }

    public onClick(state: State, x: number, y: number) {
        state.map.getIf(Math.floor(x), Math.floor(y), t => {
            t.type = TileType.GRASS;
            Object.keys(t.buffers[0]).forEach(k => (t.buffers[0] as any)[k] = -999);
            Object.keys(t.buffers[1]).forEach(k => (t.buffers[1] as any)[k] = -999);
        });
    }
}

class CarTool extends Tool {
    public constructor() {
        super("Spawn Car");
    }

    public onClick(state: State, x: number, y: number) {
        state.map.getIf(Math.floor(x), Math.floor(y), t => {
            if (t.type == TileType.ROAD) {
                state.cars.push(new Car(x + 0.5, y + 0.5, "housing"));
            }
        });
    }
}
export const ALL_TOOLS: Tool[] = [new RoadTool(), new DemolishTool(), new CarTool()];
