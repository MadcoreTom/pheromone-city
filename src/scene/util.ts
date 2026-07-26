import { Group, Object3D } from "three";
import { BLANK_TILE, State, TileType } from "../state";
import { ShopZone } from "../zone/shop";
import { FactoryZone } from "../zone/factory";
import { HouseZone, HouseZone2 } from "../zone/house";
import { noiseFixed, noiseFloat } from "../rand";
import { ParkZone } from "../zone/park";


export function updateSceneRange(state: State, x: number, y: number, w: number = 1, h: number = 1) {

    state.map.forEachRange(x, y, x + w, y + h, (x, y, v) => {
        v.object = removeFromParent(v.object);


        if (v.zone) {
            if (v.zone instanceof FactoryZone) {
                if (x == v.zone.x && y == v.zone.y) {
                    const name = ["factory","Kitch_factory"][noiseFixed(x,y,139,2)];
                    const m = state.assets[name].clone();
                    const angle = noiseFixed(x,y,919,4);
                    m.rotateY(angle*Math.PI/2);
                    const offset = [[0,0],[1,2],[3,1],[2,-1]][angle]
                    m.position.set(x + offset[0], 0, y + offset[1]);
                    
                    state.scene.add(m);
                    v.object = m;

                }
            } else if (v.zone instanceof ShopZone) {
                if (x == v.zone.x && y == v.zone.y) {
                    const m = state.assets["shop"].clone();
                    m.position.set(x, 0, y);
                    state.scene.add(m);
                    v.object = m;

                }
            }else if (v.zone instanceof ParkZone) {
                if (x == v.zone.x && y == v.zone.y) {
                    const m = state.assets["park1"].clone();
                    m.position.set(x+1, 0, y);
                    state.scene.add(m);
                    v.object = m;

                }
            } else if (v.zone instanceof HouseZone2) {
                if (x == v.zone.x && y == v.zone.y) {
                    // root group
                    const g = new Group();
                    v.object = g;

                    // base
                    const m = state.assets["house_base"].clone();
                    m.position.set(x, 0, y+1);
                    m.scale.set(1,1,2);
                    g.add(m);

                    if (v.zone.capacity === 0) {
                        const m = state.assets["house_abandoned"].clone();
                        m.position.set(x + 0.5, 0, y);
                        g.add(m);
                    } else {

                        // main
                        {
                            const name = "house_main" + (noiseFixed(x, y, 123, 2) + 1);
                            const m = state.assets[name].clone();
                            m.rotateY(noiseFixed(y, x, 4, 4) * Math.PI / 2);
                            m.position.set(x + 0.5, 0, y - 0.25 + noiseFloat(x, y, 0) * 0.5);
                            g.add(m);
                        }


                        // deco
                        if (noiseFixed(x, y, 77, 3) > 0) {
                            const name = "house_deco" + (noiseFixed(x, y, 354, 3) + 1);
                            const m = state.assets[name].clone();
                            m.rotateY(noiseFixed(y, x, 99, 40) * Math.PI / 20); // 40 angles
                            // front or back
                            const yStart = noiseFixed(x, y, 147, 2) * 1.5 - 1;
                            m.position.set(x + 0.25 + noiseFloat(x, y, 121) * 0.5, 0, y + yStart + noiseFloat(x, y, 122) * 0.5);
                            g.add(m);
                            console.log("Deco", name) // Why is this logging more often?
                        }
                    }

                    
                    state.scene.add(g);
                }
            } else {
                const m = state.assets["house"].clone();
                m.position.set(x, 0, y);
                m.scale.setY(v.zone instanceof HouseZone ? v.zone.height + 1 : 1)
                state.scene.add(m);
                v.object = m;

                //                 m.material= new MeshBasicMaterial({
                //   color: 0x00ff00
                // });
            }
        } else if (v.type == TileType.ROAD) {
            const udlr = state.map.getNeighboursUDLR(x, y, BLANK_TILE)
                .map(t => t.type == TileType.ROAD) // just roads
                .reduce((acc, current) => (acc << 1) | (current ? 1 : 0), 0); // convert to binary 0x1010

            const ROAD_MAP: Record<number, [string, number]> = {
                0b0000: ["road-null", 0],

                
                0b0001: ["road-end", 2],
                0b0010: ["road-end", 0],
                0b0100: ["road-end", 1],
                0b1000: ["road-end", 3],

                0b1100: ["road-straight", 1],
                0b0011: ["road-straight", 0],

                
                0b1110: ["road-t", 3],
                0b1101: ["road-t", 1],
                0b1011: ["road-t", 2],
                0b0111: ["road-t", 0],

                
                0b1010: ["road-corner", 3],
                0b1001: ["road-corner", 2],
                0b0110: ["road-corner", 0],
                0b0101: ["road-corner", 1],
                
                0b1111: ["road-x", 0]
                // TODO more
            };
            const name = (ROAD_MAP[udlr] || ROAD_MAP[0])[0];
            const rotation = (ROAD_MAP[udlr] || ROAD_MAP[0])[1];
            const offset = [[0,0],[1,0],[1,-1],[0,-1]][rotation];
            const m = state.assets[name].clone();
            m.position.set(x + offset[0], 0, y + offset[1]);
            m.rotateY(rotation * Math.PI/2)
            state.scene.add(m);
            v.object = m;
        } else if (v.type == TileType.GRASS) {
            const r = noiseFixed(x, y, 4121, 4);
            if (r < 2 || v.buffers[state.readBuffer].pollution > -3) { // tODO -3 as a constant
                const m = state.assets["blank"].clone();
                m.position.set(x, 0, y);
                state.scene.add(m);
                v.object = m;
            } else {
                const g = new Group();
                v.object = g;

                const block = state.assets["blank"].clone();
                block.position.set(x, 0, y);
                g.add(block)
                const tree = state.assets[r == 2 ? "tree1" : "tree2"].clone();
                tree.position.set(x, 0, y);
                g.add(tree)

                state.scene.add(g);
            }
        }
    });
}

/**
 * Attempts to remove the object from its parent in the scene
 * @returns undefined if it was removed, the original object if it was unable to be removed
 */
function removeFromParent(obj: Object3D | undefined): Object3D | undefined {
    if (obj && obj.parent) {
        obj.parent.remove(obj);
        return undefined;
    }
    return obj;
}