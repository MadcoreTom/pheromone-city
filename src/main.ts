import { AmbientLight, BackSide, DirectionalLight, HemisphereLight, InstancedMesh, Line3, Matrix4, Mesh, MeshBasicMaterial, MeshStandardMaterial, Plane, Ray, Raycaster, Scene, Vector2, Vector3, WebGLRenderer } from "three";
import { blur } from "./blur";
import { ASPECT_RATIO, MAX_CAR_RENDER_COUNT, SCALE } from "./constants";
import { render, RENDER_MODES } from "./render";
import { initScene } from "./scene/init";
import { initState, State, TileType } from "./state";
import { ALL_BUILD_TOOLS, ALL_TOOLS } from "./tools";
import { updateSceneRange } from "./scene/util";
import { createRendererDiagnostics } from "./diagnostics";

console.log("Hello main");

const canvas = document.querySelector("canvas")!;
const ctx = canvas.getContext("2d")!;

const state: State = initState();


let lastFrameTime = 0;
function update(state: State, time: number) {
    const delta = Math.min(100, time - lastFrameTime);
    lastFrameTime = time;

    // Swap buffers
    [state.readBuffer, state.writeBuffer] = [state.writeBuffer, state.readBuffer];
    blur(state, delta);

    state.zones.forEach(z => z.update(state, delta));
    // Cars
    state.cars = state.cars.filter((c) => !c.dead);
    state.cars.forEach((c) => c.update(state, delta));

    const aliveCars = state.cars.filter(c => !c.dead);
    const ci: InstancedMesh = state.scene.getObjectByName("instanced_cars")! as InstancedMesh;
    ci.count = aliveCars.length;
    aliveCars.forEach((c, i) => {
        const mat =  new Matrix4();
        mat.makeTranslation(c.x, 0, c.y -1);
        mat.multiply(new Matrix4().makeRotationY(c.yaw))
        ci.setMatrixAt(i,mat);
    })
    ci.instanceMatrix.needsUpdate = true;

    // move mouse pos indicator
    const hov = state.scene.getObjectByName("mouse_hover")!;
    if (state.tool) {
        hov.visible = true;
        hov.position.set(state.mouse[0], 0, state.mouse[1] + state.tool.h - 1);
        hov.scale.set(state.tool.w, 1, state.tool.h);
    } else {
        hov.visible = false;
    }

    // spinning camera
    if (state.cameraAngle != state.cameraAngleTarget) {
        state.cameraAngle = (state.cameraAngle * 4 + state.cameraAngleTarget)/5;
        state.camera.position.set(state.map.width / 2 + Math.sin(state.cameraAngle * Math.PI / 2 + Math.PI / 4) * 10, 10, state.map.height / 2 + Math.cos(state.cameraAngle * Math.PI / 2 + Math.PI / 4) * 10);
        state.camera.lookAt(state.map.width / 2, 0, state.map.height / 2);
    }
    
    // zoom
    if(state.zoom != state.targetZoom){
        state.zoom = (state.zoom * 4 + state.targetZoom)/5;
        state.camera.left = -10 * state.zoom * ASPECT_RATIO;
        state.camera.right = 10 * state.zoom * ASPECT_RATIO;
        state.camera.top = -10 * state.zoom;
        state.camera.bottom = 10 * state.zoom;
        state.camera.updateProjectionMatrix();
    }

    // 3d render modes
    if(state.renderMode){
        state.map.forEach((x,y,t)=>{
            if(t.type === TileType.ROAD && t.object){
                if(t.object instanceof Mesh){
                    // if( t.object.material instanceof MeshBasicMaterial){
                    //     const text = state.renderMode?.getTileFill(state,t)!;
                    //     const [_,r,g,b] = text.split(/[rgb,)(]+/).map(s=>parseFloat(s)/255);
                    // t.object.material.color.setRGB(r,g,b);

                    // } else {
                    //     t.object.material = new MeshBasicMaterial({side:BackSide});
                    // }
                    const i = Math.floor(Math.max(0,Math.min(state.colourMats.length-1, state.renderMode!.getPower(state,t) * state.colourMats.length)))
                    t.object.material = state.colourMats[i];
                }
                // (t.object as Mesh).material.color.setRGB()
            }
        })
    }
}


function tick(time: number) {
    update(state, time);
    render(ctx, state, time);
    renderer.render(state.scene, state.camera)
    diagnosticsUpdate();
    window.requestAnimationFrame(tick);
}

canvas.addEventListener("click", (evt) => {
    const x = Math.floor(evt.offsetX / SCALE);
    const y = Math.floor(evt.offsetY / SCALE);
    console.log("click", x, y);
    //   state.map.getIf( Math.floor(evt.offsetX / SCALE), Math.floor(evt.offsetY / SCALE), v=>console.log(JSON.stringify(v)));
    // state.cars.push(new Car(x+0.5,y+0.5,"housing"));
    if (state.tool && state.tool.onHover(state, x, y)) {
        state.tool.onClick(state, x, y);
    }
});

canvas.addEventListener("mousemove", (evt) => {
    const x = Math.floor(evt.offsetX / SCALE);
    const y = Math.floor(evt.offsetY / SCALE);
    state.mouse[0] = x;
    state.mouse[1] = y;
});

function initTools(state: State) {
    const div = document.getElementById("tools") as HTMLDivElement;
    const toolButtons = ALL_TOOLS.map(t => {
        const b = document.createElement("button");
        b.innerText = t.name;
        b.addEventListener("click", () => {
            console.log("Selected tool", t.name);
            state.tool = t;
            toolButtons.forEach(b => b.classList = "");
            b.classList = "tool-selected";
        });
        return b;
    });
    toolButtons.forEach(t => div.appendChild(t));

    // render modes
    const div2 = document.getElementById("render-modes") as HTMLDivElement;
    const rmButtons = RENDER_MODES.map(rm => {
        const b = document.createElement("button");
        b.innerText = rm.getName();
        b.addEventListener("click", () => {
            console.log("Selected render mode", rm.getName());
            if (rm !== state.renderMode) {
                state.renderMode = rm;
                rmButtons.forEach(b => b.classList = "");
                b.classList = "tool-selected";
            } else {
                console.log("Default")
                state.renderMode = undefined;
                state.map.forEach((x,y,v)=>{
                    if(v.object && v.object instanceof Mesh){
                        v.object!.material = state.defaultMat;
                    }
                })
                b.classList = "";
            }
        });
        return b;
    });
    rmButtons.forEach(t => div2.appendChild(t));
}
initTools(state);

async function start() {
    await initScene(state);
    // Hacky way to add things using tools
    ALL_TOOLS[3].onClick(state, 3, 2);
    ALL_TOOLS[3].onClick(state, 9, 4);
    ALL_TOOLS[3].onClick(state, 2, 9);
    ALL_TOOLS[4].onClick(state, 15, 7);
    ALL_TOOLS[4].onClick(state, 12, 14);
    ALL_TOOLS[5].onClick(state, 3, 14);


    updateSceneRange(state,0,0,state.map.width, state.map.height);

    // cars
    const cars = new InstancedMesh(state.assets["car"].geometry, state.assets["car"].material, MAX_CAR_RENDER_COUNT);
    cars.name = "instanced_cars";
    state.scene.add(cars);


    const light = new DirectionalLight("#ffffff", 2);
    light.position.set(-8, -10, -7)
    light.lookAt(0, 0, 0);
    state.scene.add(light);
    state.scene.add(light.target)

    // fill light
    const light2 = new DirectionalLight("#ffffff", 1.5);
    light2.position.set(8, -10, 7)
    light2.lookAt(0, 0, 0);
    state.scene.add(light2);

    state.scene.add(new HemisphereLight( 0x8888ff, 0x444444, 1.5 ));

    state.camera.position.set(10, 10, 10);
    state.camera.up.set(0, -1, 0);
    state.camera.lookAt(0, 0, 0);

    // DEBUG print materials
    const mats: Set<MeshStandardMaterial> = new Set();
    // state.scene.traverse(o=>{
    //     if("material" in o){
    //         console.log(o.material);
    //         mats.add(o.material as any);
    //     }

    // });
    Object.values(state.assets).forEach(o => {
        if ("material" in o) {
            console.log(o.material);
            mats.add(o.material as any);
        } else {
            console.log("NO", o)
        }

    });
    console.log(mats);
    state.defaultMat = [...mats][0];

    // hover
    const h = state.assets["select"].clone();
    h.name ="mouse_hover"
    state.scene.add(h);

    console.log("Start")
    window.requestAnimationFrame(tick);
}

// init three.js canvas
// Renderer
const renderer = new WebGLRenderer({ antialias: true });
renderer.setSize(800, 600);
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setClearColor("#95CDE9");
// renderer.shadowMap.enabled = true;
// renderer.shadowMap.type = PCFShadowMap; //  Makes shadow edges smoother
canvas.parentNode!.insertBefore(renderer.domElement, canvas.nextSibling)

const diagnosticsUpdate = createRendererDiagnostics(renderer);
// renderer.domElement.style.float = "right"
// document.body.appendChild(renderer.domElement);


// clicky
const clickyPlane = new Plane(new Vector3(0,1,0), 0);
const raycaster = new Raycaster();
const mathRay = new Ray();

function setMouseFromEventIn3dScne(event:MouseEvent){
    const rect = renderer.domElement.getBoundingClientRect();

    // Convert screen pixels to Normalized Device Coordinates (-1 to +1)
    const  mouse = new Vector2();
    mouse.x = ((event.offsetX) / rect.width) * 2 - 1;
    mouse.y = -((event.offsetY) / rect.height) * 2 + 1;

    // 3. Update the raycaster using your Orthographic Camera
    raycaster.setFromCamera(mouse, state.camera);

    // 4. Extract the underlying, pure mathematical THREE.Ray
    // This ray updates its origin and direction automatically!
    mathRay.copy(raycaster.ray);
    
    const pt = new Vector3(9,9,9)
    const hit = mathRay.intersectPlane(clickyPlane, pt);
    if(hit ){
        state.mouse = [Math.floor(pt.x), Math.floor(pt.z)+1];
        // state.tool.onHover(state,Math.round(pt.x), Math.round(pt.z))
    }
    // consol
}

renderer.domElement.addEventListener("mousemove", event=>{
    setMouseFromEventIn3dScne(event);
    if(state.tool){
        state.tool.onHover(state, state.mouse[0], state.mouse[1])
    }
});

renderer.domElement.addEventListener("click", event=>{
    setMouseFromEventIn3dScne(event);
    if(state.tool && state.tool.onHover(state, state.mouse[0], state.mouse[1])){
        state.tool.onClick(state, state.mouse[0], state.mouse[1])
    }
});

start();


// TODO buttons

const menu = document.querySelector(".menu") as HTMLDivElement;

const buildListParent = document.getElementById("menu-list-build") as HTMLElement;
ALL_BUILD_TOOLS.forEach(t=>{
    const b = document.createElement("button") as HTMLButtonElement;
    b.textContent = t.name;
    b.addEventListener("click",()=>{
        state.tool = t;
    });
    buildListParent.appendChild(b);
});

const inspectListParent = document.getElementById("menu-list-inspect") as HTMLElement;
RENDER_MODES.forEach(t=>{
    const b = document.createElement("button") as HTMLButtonElement;
    b.textContent = t.getName();
    b.addEventListener("click",()=>{
        state.renderMode = (state.renderMode == t ? undefined : t)
        if(!state.renderMode){
            
                console.log("Default")
                state.renderMode = undefined;
                state.map.forEach((x,y,v)=>{
                    if(v.object && v.object instanceof Mesh){
                        v.object!.material = state.defaultMat;
                    }
                })
        }
    });
    inspectListParent.appendChild(b);
});
inspectListParent.style.display = "none";

[...menu.querySelectorAll("[data-tool]")].forEach(dt=>{
    console.log("TOOL");
    dt.addEventListener("click", ()=>{
        console.log(dt.getAttribute("data-tool"));
    })
});

[...menu.querySelectorAll("[data-action]")].forEach(dt=>{
    console.log("TOOL");
    dt.addEventListener("click", ()=>{
        console.log(dt.getAttribute("data-action"));
    })
})
;

addClickListenerToAllWithDataAttribute(
    menu, "data-mode",
    (mode, elem)=>{
        console.log("MODE", mode);
        elem.style.border = "2px solid yellow";
        switch(mode){
            case "build":
                buildListParent.style.display = "flex";
                inspectListParent.style.display = "none";
                break;
            case "inspect":
                buildListParent.style.display = "none";
                inspectListParent.style.display = "flex";
                break;
        }
    },
    (elem)=>{
        elem.style.border = "";
    }
);


addClickListenerToAllWithDataAttribute(
    menu, "data-tool",
    (toolName, elem)=>{
        console.log("TOOL", toolName);
        const tool = ALL_TOOLS.filter(t=>t.name == toolName)[0];
        if(tool){
            state.tool = tool;
        } else {
            console.warn("Unknown tool", toolName);
        }
    }
)

addClickListenerToAllWithDataAttribute(
    menu, "data-action",
    (action, elem) => {
        switch (action) {
            case "zoomIn":
                state.targetZoom /= 1.5;
                break;
            case "zoomOut":
                state.targetZoom *= 1.5;
                break;
            case "rotCW":
                state.cameraAngleTarget ++;
                break;
            case "rotCCW":
                state.cameraAngleTarget --;
                break;
        }
        console.log("ZOOM", state.targetZoom);
    }
)

function addClickListenerToAllWithDataAttribute(root: HTMLElement, attribute: string, onClick: (value: string, elem:HTMLElement) => unknown, onDeselect?:(elem:HTMLElement)=>unknown) {
    const elems = [...menu.querySelectorAll(`[${attribute}]`)] as HTMLElement[];
    elems.forEach(dt => {
        dt.addEventListener("click", evt => {
            const value = dt.getAttribute(attribute)!;
            onClick(value, dt);
            if(onDeselect){
                elems.filter(e=>e!=dt).forEach(e=>onDeselect(e));
            }
        });
    });

}