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