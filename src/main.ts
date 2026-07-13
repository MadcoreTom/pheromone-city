import { AmbientLight, DirectionalLight, DoubleSide, HemisphereLight, InstancedMesh, Line3, Matrix4, Mesh, MeshBasicMaterial, MeshStandardMaterial, PCFShadowMap, Scene, WebGLRenderer } from "three";
import { blur } from "./blur";
import { DISPLAY_HEIGHT, DISPLAY_WIDTH, MAX_CAR_RENDER_COUNT } from "./constants";
import { initScene } from "./scene/init";
import { BLANK_TILE, initState, State, TileType } from "./state";
import { setMouseFromEventIn3dScene, updateCamera } from "./camera";
import { ALL_TOOLS } from "./tools";
import { updateSceneRange } from "./scene/util";
import { createRendererDiagnostics } from "./diagnostics";
import { EffectComposer, ShaderPass } from "three/examples/jsm/Addons.js";
import { FXAAShader } from "three/examples/jsm/shaders/FXAAShader.js";
import { N8AOPass } from "n8ao";
import { initUI, updateScore } from "./ui";

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
        mat.makeTranslation(c.x, -0.05, c.y -1);
        mat.multiply(new Matrix4().makeRotationY(c.yaw))
        ci.setMatrixAt(i,mat);
    })
    ci.instanceMatrix.needsUpdate = true;

    // move mouse pos indicator
    const hov = state.scene.getObjectByName("mouse_hover")!;
    if (state.tool && state.mouse[0] >=0 && state.mouse[1] >= 0 && state.mouse[0] + state.tool.w <= state.map.width && state.mouse[1] + state.tool.h <= state.map.height) {
        hov.visible = true;
        if(state.tool.name == "Demolish" && state.map.get(state.mouse[0],state.mouse[1], BLANK_TILE).zone != undefined){
            const z = state.map.get(state.mouse[0],state.mouse[1], BLANK_TILE).zone!;
            hov.position.set(z.x , 0, z.y+ z.h -1);
            hov.scale.set(z.w, 1, z.h);
        } else {
            hov.position.set(state.mouse[0], 0, state.mouse[1] + state.tool.h - 1);
            hov.scale.set(state.tool.w, 1, state.tool.h);
        }
    } else {
        hov.visible = false;
    }

    updateCamera(state);

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
        updateScore(state);
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
    ALL_TOOLS.filter(t => t.name === "House (new)")[0].onClick(state, 3, 2);
    ALL_TOOLS.filter(t => t.name === "House (new)")[0].onClick(state, 9, 4);
    ALL_TOOLS.filter(t => t.name === "House (new)")[0].onClick(state, 2, 9);
    ALL_TOOLS.filter(t => t.name === "Factory")[0].onClick(state, 15, 7);
    ALL_TOOLS.filter(t => t.name === "Factory")[0].onClick(state, 12, 14);
    ALL_TOOLS.filter(t => t.name === "Shopping")[0].onClick(state, 3, 14);

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
    h.material = new MeshBasicMaterial({
        color: 0xffee00,
        side: DoubleSide
    })
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


renderer.domElement.addEventListener("mousemove", event=>{
    setMouseFromEventIn3dScene(event, state);
    if(state.tool){
        state.tool.onHover(state, state.mouse[0], state.mouse[1])
    }
});

renderer.domElement.addEventListener("click", event => {
    setMouseFromEventIn3dScene(event, state);
    if (state.tool && state.tool.onHover(state, state.mouse[0], state.mouse[1])) {
        if (state.cash.value >= state.tool.cost) {
            state.tool.onClick(state, state.mouse[0], state.mouse[1]);
            state.cash.value -= state.tool.cost;
        }
    }
});

renderer.domElement.addEventListener("contextmenu", event => {
    event.preventDefault();
    state.focusedTile = [state.mouse[0], state.mouse[1]];
});

renderer.domElement.addEventListener("wheel", event => {
    if (event.deltaY < 0) {
        state.targetZoom /= 1.5;
    } else {
        state.targetZoom *= 1.5;
    }
});

start();
initUI(state);

