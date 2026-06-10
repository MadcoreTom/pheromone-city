import { Car } from "./car";
import { updateSceneRange } from "./scene/util";
import { BLANK_TILE, State, Tile, TileType } from "./state";
import { FactoryZone, HouseZone, ShopZone, Zone } from "./zone";

export abstract class Tool {
    public constructor(public readonly name: string, public readonly w: number = 1, public readonly h: number = 1) {

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
        super("Road");
    }

    public onClick(state: State, x: number, y: number) {
        state.map.getIf(Math.floor(x), Math.floor(y), t => {
            t.type = TileType.ROAD;
           update3dScene(x,y,this,state);
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
        super("Spawn Car");
    }

    public onClick(state: State, x: number, y: number) {
        state.map.getIf(Math.floor(x), Math.floor(y), t => {
            if (t.type == TileType.ROAD) {
                state.cars.push(new Car(x + 0.5, y + 0.5, "housing"));
            }
        update3dScene(x,y,this,state);
        });
    }

    public onHover(state: State, x: number, y: number): boolean {
        const t = state.map.get(x,y,BLANK_TILE);
        return t && t.type == TileType.ROAD;
    }
}

class ZoneTool extends Tool {
    public constructor() {
        super("House", 2, 2);
    }

    public onClick(state: State, x: number, y: number) {
        const z=new HouseZone(x,y,state);
        z.cars.push( [100, new Car(0,0,"housing")]);
        z.cars.push( [200, new Car(0,0,"housing")]);
        update3dScene(x,y,this,state);
    }
}

class FactoryZoneTool extends Tool {
    public constructor() {
        super("Factory", 3, 3);
    }

    public onClick(state: State, x: number, y: number) {
        new FactoryZone(x,y,state);
        update3dScene(x,y,this,state);
    }
}
class ShoppingZoneTool extends Tool {
    public constructor() {
        super("Shopping", 2, 3);
    }

    public onClick(state: State, x: number, y: number) {
        new ShopZone(x,y,state);
        update3dScene(x,y,this,state);
    }
}

function update3dScene(x:number,y:number,tool:Tool, state:State){
    updateSceneRange(state,x,y,tool.w, tool.h);
}

export const ALL_TOOLS: Tool[] = [new RoadTool(), new DemolishTool(), new CarTool(), new ZoneTool(), new FactoryZoneTool(), new ShoppingZoneTool()];

export const ALL_BUILD_TOOLS: Tool[] = [new RoadTool(), new ZoneTool(), new FactoryZoneTool(), new ShoppingZoneTool()];
