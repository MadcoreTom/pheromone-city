import { Group, Object3D } from "three";
import { State, TileType } from "../state";
import { ShopZone } from "../zone/shop";
import { FactoryZone } from "../zone/factory";
import { HouseZone, HouseZone2 } from "../zone/house";
import { noiseFixed, noiseFloat } from "../rand";


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
                        const yStart = noiseFixed(x,y,147,2)*1.5-1;
                        m.position.set(x + 0.25 + noiseFloat(x, y, 121) * 0.5, 0, y + yStart + noiseFloat(x, y, 122) * 0.5);
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
            const r = noiseFixed(x, y, 4121, 4);
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