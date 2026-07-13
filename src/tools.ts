import { Car } from "./car";
import { updateSceneRange } from "./scene/util";
import { BLANK_TILE, State, TileType } from "./state";
import { FactoryZone } from "./zone/factory";
import { HouseZone, HouseZone2 } from "./zone/house";
import { ShopZone } from "./zone/shop";

export abstract class Tool {
    public constructor(
        public readonly name: string, 
        public readonly cost: number, 
        public readonly icon: string,
        public readonly w: number = 1, 
        public readonly h: number = 1) {

    }

    public render(context: CanvasRenderingContext2D, x: number, y: number, scale: number): void {

    }

    public abstract onClick(state: State, x: number, y: number): void;

    public onHover(state: State, x: number, y: number): boolean {
        if (x < 0 || y < 0 || x + this.w > state.map.width || y + this.h > state.map.height) {
            return false;
        }
        let okay = true;
        state.map.forEachRange(x, y, x + this.w, y + this.h, (x, y, v) => {
            if (v.type !== TileType.GRASS || v.zone) {
                okay = false;
            }
        });
        return okay;
    }
}

class RoadTool extends Tool {
    public constructor() {
        super("Road", 1, "road.svg");
    }

    public onClick(state: State, x: number, y: number) {
        state.map.getIf(Math.floor(x), Math.floor(y), t => {
            t.type = TileType.ROAD;
            // clear buffers just in case
            t.buffers[0] = {...BLANK_TILE.buffers[0]};
            t.buffers[1] = {...BLANK_TILE.buffers[1]};
            update3dScene(x, y, this, state);
            update3dScene(x-1, y, this, state);
            update3dScene(x+1, y, this, state);
            update3dScene(x, y-1, this, state);
            update3dScene(x, y+1, this, state);
        });
    }
}


class DemolishTool extends Tool {
    public constructor() {
        super("Demolish", 0, "explosion.svg");
    }

    public onClick(state: State, x: number, y: number) {
        state.map.getIf(Math.floor(x), Math.floor(y), t => {
            t.type = TileType.GRASS;
            Object.keys(t.buffers[0]).forEach(k => (t.buffers[0] as any)[k] = -999);
            Object.keys(t.buffers[1]).forEach(k => (t.buffers[1] as any)[k] = -999);
            let w = 1;
            let h = 1;
            if (t.zone) {
                w = t.zone.w;
                h = t.zone.h;
                x = t.zone.x;
                y = t.zone.y;
                t.zone.remove(state);
                t.zone = undefined;
            }
            updateSceneRange(state, x, y, w, h);
        });
    }

    public onHover(state: State, x: number, y: number): boolean {
        return true;
    }
}

class CarTool extends Tool {
    public constructor() {
        super("Spawn Car", 1000, "");
    }

    public onClick(state: State, x: number, y: number) {
        state.map.getIf(Math.floor(x), Math.floor(y), t => {
            if (t.type == TileType.ROAD) {
                state.cars.push(new Car(x + 0.5, y + 0.5, "housing"));
            }
            update3dScene(x, y, this, state);
        });
    }

    public onHover(state: State, x: number, y: number): boolean {
        const t = state.map.get(x, y, BLANK_TILE);
        return t && t.type == TileType.ROAD;
    }
}

class HouseZoneTool extends Tool {
    public constructor() {
        super("House (old)", 50, "house-chimney.svg", 2, 2);
    }

    public onClick(state: State, x: number, y: number) {
        new HouseZone(x, y, state);
        update3dScene(x, y, this, state);
    }
}

class HouseZoneTool2 extends Tool {
    public constructor() {
        super("House (new)", 25, "house-chimney.svg", 1, 2);
    }

    public onClick(state: State, x: number, y: number) {
        new HouseZone2(x, y, state);
        update3dScene(x, y, this, state);
    }
}

class FactoryZoneTool extends Tool {
    public constructor() {
        super("Factory", 100, "industry.svg", 3, 3);
    }

    public onClick(state: State, x: number, y: number) {
        new FactoryZone(x, y, state);
        update3dScene(x, y, this, state);
    }
}
class ShoppingZoneTool extends Tool {
    public constructor() {
        super("Shopping", 75, "shop.svg", 2, 3);
    }

    public onClick(state: State, x: number, y: number) {
        new ShopZone(x, y, state);
        update3dScene(x, y, this, state);
    }
}

function update3dScene(x: number, y: number, tool: Tool, state: State) {
    updateSceneRange(state, x, y, tool.w, tool.h);
}

export const ALL_TOOLS: Tool[] = [new RoadTool(), /*new CarTool(),*/ new HouseZoneTool(), new HouseZoneTool2(), new FactoryZoneTool(), new ShoppingZoneTool(), new DemolishTool()];
