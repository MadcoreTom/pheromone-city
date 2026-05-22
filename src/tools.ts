import { Car } from "./car";
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
        update3dScene(x,y,t,state);
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
            if(t.zone){
                t.zone.remove(state);
                t.zone = undefined;
            }
        update3dScene(x,y,t,state);
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
        update3dScene(x,y,t,state);
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
        new HouseZone(x,y,state);
        update3dScene(x,y,state.map.get(x,y,BLANK_TILE),state);
    }
}

class FactoryZoneTool extends Tool {
    public constructor() {
        super("Factory", 3, 3);
    }

    public onClick(state: State, x: number, y: number) {
        new FactoryZone(x,y,state);
        update3dScene(x,y,state.map.get(x,y,BLANK_TILE),state);
    }
}
class ShoppingZoneTool extends Tool {
    public constructor() {
        super("Shopping", 2, 3);
    }

    public onClick(state: State, x: number, y: number) {
        new ShopZone(x,y,state);
        update3dScene(x,y,state.map.get(x,y,BLANK_TILE),state);
    }
}

function update3dScene(x:number,y:number,t:Tile, state:State){
    if(t.object){
        t.object.parent!.remove(t.object);
        t.object = undefined;
    }

         if(t.zone){
               const m = state.assets["house"].clone();
                // m.matrix.copy(new Matrix4().makeTranslation(x, 0, y));
                m.position.set(x , 0, y );
                state.scene.add(m);
                t.object = m;
            } else if (t.type == TileType.ROAD) {
                const m = state.assets["road"].clone();
                // m.matrix.copy(new Matrix4().makeTranslation(x, 0, y));
                m.position.set(x, 0, y);
                state.scene.add(m);
                t.object = m;
            } else     if (t.type == TileType.GRASS) {
                const m = state.assets["blank"].clone();
                // m.matrix.copy(new Matrix4().makeTranslation(x, 0, y));
                m.position.set(x, 0, y);
                state.scene.add(m);
                t.object = m;
            }
}

export const ALL_TOOLS: Tool[] = [new RoadTool(), new DemolishTool(), new CarTool(), new ZoneTool(), new FactoryZoneTool(), new ShoppingZoneTool()];
