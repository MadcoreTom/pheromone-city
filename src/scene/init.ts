import { Mesh } from "three";
import { State } from "../state";
import { GLTF, GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';


export async function initScene(state: State): Promise<void> {

	const assets = await loadGltfPromise("assets.glb");
	assets.scene.traverse(ob => {
		if (ob.type === "Mesh") {
			console.log("> ", ob.name);
			state.assets[ob.name] = ob as Mesh;
		}
	});

	assets.scene.traverse((node) => {
    if (node instanceof Mesh && node.material) {
        const mat = node.material;

        // If it is a Standard material, make it perfectly rough/matte
        if (mat.isMeshStandardMaterial) {
            mat.roughness = 1.0;
            mat.metalness = 0.0;
        } 
        // If it is an older Phong material, turn off shininess
        else if (mat.isMeshPhongMaterial) {
            mat.shininess = 0;
            mat.specular.setScalar(0); // Sets specular colour to black
        }
        
        // Tell Three.js the material needs to update
        mat.needsUpdate = true;
    }
});
	console.log("Loaded");
}

async function loadGltfPromise(path: string): Promise<GLTF> {
	return new Promise((resolve, rej) => {
		const loader = new GLTFLoader();
		loader.load(path,
			(gltf) => {
				resolve(gltf);
			},
			undefined,
			err => rej(err)
		);
	});
}