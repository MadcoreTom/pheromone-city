import { Group, MeshBasicMaterial, Object3D } from "three";
import { State, TileType } from "../state";
import { ShopZone } from "../zone/shop";
import { FactoryZone } from "../zone/factory";
import { instance } from "three/tsl";
import { HouseZone, HouseZone2 } from "../zone/house";

function noise(x: number, y: number, mod: number): number {
    let hash = Math.imul(x, 374761393) + Math.imul(y, 668265263);
    hash = Math.imul(hash ^ (hash >>> 13), 1274126177);
    hash = hash ^ (hash >>> 16);
    return (hash >>> 0) % mod;
}

export function updateSceneRange(state: State, x: number, y: number, w: number = 1, h: number = 1) {

    state.map.forEachRange(x, y, x + w, y + h, (x, y, v) => {
        v.object = removeFromParent(v.object);


        if (v.zone) {
            if (v.zone instanceof FactoryZone) {
                if (x == v.zone.x && y == v.zone.y) {
                    const m = state.assets["factory"].clone();
                    m.position.set(x, 0, y);
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

                    // main
                    {
                        const name = "house_main" + (noise(x + 5, y + x - 1, 2) + 1);
                        const m = state.assets[name].clone();
                        m.rotateY(noise(y,x,4) * Math.PI/2);
                        m.position.set(x+0.5, 0, y-0.25 + noise(x+7,y+5,100)/200);
                        g.add(m);
                    }

                    
                    // deco
                    if(noise(x+77,y-9,3) > 0){
                        const name = "house_deco" + (noise(x + 1, y + x - 69, 3) + 1);
                        const m = state.assets[name].clone();
                        m.rotateY(noise(y,x,40) * Math.PI/20); // 40 angles
                        m.position.set(x+0.25 + noise(x+7,y+5,100)/200, 0, y -1+ noise(x+7,y+5,100)/200);
                        g.add(m);
                        console.log("Deco", name) // Why is this logging more often?
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
            const m = state.assets["road"].clone();
            m.position.set(x, 0, y);
            state.scene.add(m);
            v.object = m;
        } else if (v.type == TileType.GRASS) {
            const r = noise(x, y, 4);
            if (r < 2) {
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