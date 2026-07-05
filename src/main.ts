import {  AmbientLight, DirectionalLight, HemisphereLight, InstancedMesh, Line3, Matrix4, Mesh, MeshBasicMaterial, MeshStandardMaterial, PCFShadowMap, Plane, Ray, Raycaster, Scene, Vector2, Vector3, WebGLRenderer } from "three";
import { blur } from "./blur";
import { ASPECT_RATIO, DISPLAY_HEIGHT, DISPLAY_WIDTH, MAX_CAR_RENDER_COUNT } from "./constants";
import { RENDER_MODES } from "./render";
import { initScene } from "./scene/init";
import { initState, State, TileType } from "./state";
import { ALL_BUILD_TOOLS, ALL_TOOLS } from "./tools";
import { updateSceneRange } from "./scene/util";
import { createRendererDiagnostics } from "./diagnostics";
import { EffectComposer, ShaderPass } from "three/examples/jsm/Addons.js";
import { FXAAShader } from "three/examples/jsm/shaders/FXAAShader.js";
import { N8AOPass } from "n8ao";
import { Zone } from "./zone/zone";
import { Car } from "./car";

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
    // state.cars = state.cars.filter((c) => !c.hidden);

    const visibleCars = state.cars.filter(c => !c.hidden);
    visibleCars.forEach((c) => c.update(state, delta));
    const ci: InstancedMesh = state.scene.getObjectByName("instanced_cars")! as InstancedMesh;
    ci.count = visibleCars.length;
    visibleCars.forEach((c, i) => {
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
        state.camera.top = 10 * state.zoom;
        state.camera.bottom = -10 * state.zoom;
        state.camera.updateProjectionMatrix();
    }

    // 3d render modes
    if(state.renderMode){
        state.map.forEach((x,y,t)=>{
            if (state.renderMode?.getName() == "Pollution" && !t.zone) { // TODO add a property to the render mode
                const i = Math.floor(Math.max(0, Math.min(state.colourMats.length - 1, state.renderMode!.getPower(state, t) * state.colourMats.length)))
                t.object!.traverse(ob => {
                    if (ob instanceof Mesh) {
                        ob.material = state.colourMats[i];
                    }
                })
            } else if (t.type === TileType.ROAD && t.object){
                if(t.object instanceof Mesh){
 
                    const i = Math.floor(Math.max(0,Math.min(state.colourMats.length-1, state.renderMode!.getPower(state,t) * state.colourMats.length)))
                    t.object.material = state.colourMats[i];
                }
            }
        })
    }

    if(Math.random() < 0.01){
        calculateScore(state);
    }
}

function tick(time: number) {
    update(state, time);
    state.composer?.render(time);//state.scene, state.camera)
    diagnosticsUpdate();
    window.requestAnimationFrame(tick);
}

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


    // Add screen space ambient occlusion, to make up for my poor texturing
    const composer = new EffectComposer(renderer);
    const n8aopass = new N8AOPass(
        state.scene,
        state.camera,
        window.innerWidth,
        window.innerHeight,
    );
    n8aopass.configuration.aoSamples = 16;
    n8aopass.configuration.denoiseSamples = 8;
    n8aopass.configuration.aoRadius = 0.15;
    n8aopass.configuration.intensity = 6;
    composer.addPass(n8aopass);
    const fxaaPass = new ShaderPass(FXAAShader);
    fxaaPass.uniforms["resolution"].value.set(1 / window.innerWidth, 1 / window.innerHeight);
    composer.addPass(fxaaPass);
    state.composer = composer;


    // cars
    const cars = new InstancedMesh(state.assets["car"].geometry, state.assets["car"].material, MAX_CAR_RENDER_COUNT);
    cars.name = "instanced_cars";
    cars.castShadow = true;
    state.scene.add(cars);


    const light = new DirectionalLight("#ffffee", 2.4);
    light.position.set(-8, 15, -5)
    light.lookAt(0, 0, 0);
    light.castShadow = true;
    light.shadow.camera.left = -15;
    light.shadow.camera.right = 15;
    light.shadow.camera.top = 25;
    light.shadow.camera.bottom = -15;
    light.shadow.camera.near = 5;
    light.shadow.camera.far = 55;
    light.shadow.mapSize.width = 2048;
    light.shadow.mapSize.height = 2048;
    light.shadow.bias = -0.001;
    // light.shadow.normalBias = 0.02;
    state.scene.add(light);
    state.scene.add(light.target)

    // fill light
    const light2 = new DirectionalLight("#eeeeff", 1.5);
    light2.position.set(8, 10, 7)
    light2.lookAt(0, 0, 0);
    state.scene.add(light2);

    state.scene.add(new HemisphereLight( 0x8888ff, 0x444444, 0.5 ));
    state.scene.add(new AmbientLight(0xFFFFFF,0.2))

    state.camera.position.set(10, 10, 10);
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
renderer.setSize(DISPLAY_WIDTH, DISPLAY_HEIGHT);
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setClearColor("#95CDE9");
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = PCFShadowMap; //  Makes shadow edges smoother
// const menuElem = document.querySelector(".menu") as HTMLElement;
// menuElem.parentNode!.insertBefore(renderer.domElement, menuElem);
const canvasElemPlaceholder = document.getElementById("replace-with-game") as HTMLElement;
canvasElemPlaceholder.replaceWith(renderer.domElement);

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

    const rowElem = document.createElement("div") as HTMLDivElement;
    rowElem.classList.add("field-row");

    const inputElem = document.createElement("input") as HTMLInputElement;
    inputElem.id = "tool-" + t.getName();
    inputElem.type = "radio"
    inputElem.name = "inspect-mode-radios"
    rowElem.appendChild(inputElem);

    const labelElem = document.createElement("label") as HTMLLabelElement;
    labelElem.setAttribute("for", inputElem.id);
    labelElem.textContent = t.getName();
    rowElem.appendChild(labelElem);

    inputElem.addEventListener("change", () => {
        // clear
        state.map.forEach((x, y, v) => {
            if (v.object) {
                v.object.traverse(o => {
                    if (o instanceof Mesh) {
                        o.material = state.defaultMat;
                    }
                })
            }
        })
        // set
        state.renderMode = (state.renderMode == t ? undefined : t)
        if (!state.renderMode) {
            state.renderMode = undefined;

        }
    });
    console.log("ADD", rowElem, "to", inspectListParent)
    inspectListParent.appendChild(rowElem);
});


[...document.querySelectorAll("[data-tool]")].forEach(dt=>{
    console.log("TOOL");
    dt.addEventListener("click", ()=>{
        console.log(dt.getAttribute("data-tool"));
    })
});

[...document.querySelectorAll("[data-action]")].forEach(dt=>{
    console.log("TOOL");
    dt.addEventListener("click", ()=>{
        console.log(dt.getAttribute("data-action"));
    })
});

addClickListenerToAllWithDataAttribute(
    document, "data-tool",
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
    document, "data-action",
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
    }
)

function addClickListenerToAllWithDataAttribute(root: HTMLElement | Document, attribute: string, onClick: (value: string, elem:HTMLElement) => unknown, onDeselect?:(elem:HTMLElement)=>unknown) {
    const elems = [...root.querySelectorAll(`[${attribute}]`)] as HTMLElement[];
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


function calculateScore(state:State){
    let emptyHouses = 0;
    let emptyJobs = 0;
    let emptyShops = 0;
    let houses: Zone[] = [];
    state.zones.forEach(z=>{
        if(z.cars.length === 0) {
            if(z.providesNeed("housing")){
                emptyHouses++;
                houses.push(z);
            }
            if(z.providesNeed("unemployment")){
                emptyJobs++;
            }
            if(z.providesNeed("shopping")){
                     emptyShops ++;
            }
        }
    });
    if(emptyHouses > 0 && emptyJobs > 0 && emptyShops > 0){
        console.log("🔼 Looks good");
        const carCount = state.cars.length;
        const carsOut = state.cars.filter(c => !c.hidden).length;
        console.log("Look cars", carCount, carsOut)
        if (carsOut < carCount * 0.5) { // half the cars need to be in a building
            const z = houses[Math.floor(Math.random() * houses.length)];
            const car = new Car(z.x, z.y, "housing");
            car.tx = car.x;
            car.ty=car.y;
            car.hidden = true;
            state.cars.push(car);
            z.enter(car);
            document.getElementById("population-status")!.textContent = `Population: ${state.cars.length}`
        }
    } else {
        console.log("🔽 Looks bad")
    }
}
