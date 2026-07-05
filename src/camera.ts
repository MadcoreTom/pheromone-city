import { Plane, Ray, Raycaster, Vector2, Vector3 } from "three";
import { State } from "./state";
import { ASPECT_RATIO } from "./constants";

const clickyPlane = new Plane(new Vector3(0, 1, 0), 0);
const raycaster = new Raycaster();
const mathRay = new Ray();

export function setMouseFromEventIn3dScene(event: MouseEvent, state: State) {
    const target = event.currentTarget as HTMLElement;
    const rect = target.getBoundingClientRect();
    const mouse = new Vector2();
    mouse.x = ((event.offsetX) / rect.width) * 2 - 1;
    mouse.y = -((event.offsetY) / rect.height) * 2 + 1;
    raycaster.setFromCamera(mouse, state.camera);
    mathRay.copy(raycaster.ray);
    const pt = new Vector3(9, 9, 9);
    const hit = mathRay.intersectPlane(clickyPlane, pt);
    if (hit) {
        state.mouse = [Math.floor(pt.x), Math.floor(pt.z) + 1];
    }
}

export function updateCamera(state: State) {
    if (state.zoom != state.targetZoom) {
        state.zoom = (state.zoom * 4 + state.targetZoom) / 5;
        state.camera.left = -10 * state.zoom * ASPECT_RATIO;
        state.camera.right = 10 * state.zoom * ASPECT_RATIO;
        state.camera.top = 10 * state.zoom;
        state.camera.bottom = -10 * state.zoom;
        state.camera.updateProjectionMatrix();
    }

    if (state.cameraAngle != state.cameraAngleTarget) {
        state.cameraAngle = (state.cameraAngle * 4 + state.cameraAngleTarget) / 5;
    }

    state.camera.position.set(
        state.focusedTile[0] + Math.sin(state.cameraAngle * Math.PI / 2 + Math.PI / 4) * 10,
        10,
        state.focusedTile[1] + Math.cos(state.cameraAngle * Math.PI / 2 + Math.PI / 4) * 10
    );
    state.camera.lookAt(state.focusedTile[0], 0, state.focusedTile[1]);
}
