import { Object3D } from "three";
import { State, TileType } from "../state";

export function updateSceneRange(state:State, x:number,y:number, w:number=1,h:number=1){

    state.map.forEachRange(x,y,x+w,y+h,(x, y, v) => {
        v.object = removeFromParent(v.object);


        if (v.zone) {
            const m = state.assets["house"].clone();
            m.position.set(x, 0, y);
            state.scene.add(m);
            v.object = m;
        } else if (v.type == TileType.ROAD) {
            const m = state.assets["road"].clone();
            m.position.set(x, 0, y);
            state.scene.add(m);
            v.object = m;
        } else if (v.type == TileType.GRASS) {
            const m = state.assets["blank"].clone();
            m.position.set(x, 0, y);
            state.scene.add(m);
            v.object = m;
        }
    });
}

/**
 * Attempts to remove the object from its parent in the scene
 * @returns undefined if it was removed, the original object if it was unable to be removed
 */
function removeFromParent(obj: Object3D | undefined): Object3D | undefined {
    if(obj && obj.parent){
        obj.parent.remove(obj);
        return undefined;
    }
    return obj;
}