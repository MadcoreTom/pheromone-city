import { BackSide, Camera, Color, FrontSide, Material, Mesh, MeshBasicMaterial, Object3D, OrthographicCamera, Scene } from "three";
import { Arr2 } from "./arr2";
import { Car } from "./car";
import { Tool } from "./tools";
import { Zone } from "./zone/zone";
import { ASPECT_RATIO } from "./constants";
import { EffectComposer } from "three/examples/jsm/Addons.js";
import { CommonTag, OnChange } from "./onchange";
import { OneStar, Star } from "./stars";

export enum TileType {
    ROAD,
    GRASS
}

export type TileBuffer = {
    unemployment: number;
    housing: number;
    shopping: number;
    traffic: number;
    pollution: number;
    entertainment: number;
};

export type Metric = keyof TileBuffer;

export type TileBuffers = [TileBuffer, TileBuffer];

export type Tile = {
    type: TileType;
    buffers: TileBuffers;
    zone?: Zone;
    object?: Object3D
};

export const BLANK_TILE: Tile = {
    type: TileType.GRASS,
    buffers: [
        {
            unemployment: -999,
            housing: -999,
            shopping: -999,
            traffic: 0,
            pollution: -999,
            entertainment: -999
        },
        {
            unemployment: -999,
            housing: -999,
            shopping: -999,
            traffic: 0,
            pollution: -999,
            entertainment: -999
        }
    ]
};

export type State = {
    paused: boolean,
    starLevel: Star,
    map: Arr2<Tile>;
    writeBuffer: 0 | 1,
    readBuffer: 0 | 1
    cars: Car[];
    tool?: Tool;
    zones: Zone[],
    mouse: [number, number],
    focusedTile: [number, number],
    renderMode?: RenderMode,
    assets: { [name: string]: Mesh },
    scene: Scene,
    camera: OrthographicCamera,
    targetZoom: number,
    zoom: number,
    cameraAngle: number,
    cameraAngleTarget: number,
    defaultMat: Material,
    colourMats: Material[],
    composer?: EffectComposer,
    cash: OnChange<number>,
    starCount: OnChange<number>,
    prompt:CommonTag<string>
};

export interface RenderMode {
    highlightCar(car: Car): boolean;
    getName(): string;
    getPower(state: State, tile: Tile): number;
}

function createColouredMats(): Material[] {
    const result: Material[] = [];
    const count = 100;
    for (let i = 0; i < count; i++) {
        const m = new MeshBasicMaterial({ side: FrontSide, color: new Color().setRGB(1 - i / count, i / count, 0) });
        result.push(m);
    }
    return result;
}


export function initState(): State {
    const state: State = {
        paused: false,
        starLevel: new OneStar(),
        mouse: [0, 0],
        focusedTile: [0, 0],
        writeBuffer: 0,
        readBuffer: 1,
        map: new Arr2<Tile>(20, 20, (x, y) => {
            return {
                type: TileType.GRASS,
                buffers: [
                    {
                        unemployment: -999,
                        housing: -999,
                        shopping: -999.,
                        traffic: 0,
                        pollution: -999,
                        entertainment: -999
                    },
                    {
                        unemployment: -999,
                        housing: -999,
                        shopping: -999,
                        traffic: 0,
                        pollution: -999,
                        entertainment: -999
                    }
                ]
            };
        }),
        cars: [],
        zones: [],
        assets: {},
        scene: new Scene(),
        camera: new OrthographicCamera(-10 * ASPECT_RATIO, 10 * ASPECT_RATIO, 10, -10, 0.1, 100),
        targetZoom: 1,
        zoom: 1,
        cameraAngle: -0.1,
        cameraAngleTarget: 0,
        defaultMat: new MeshBasicMaterial({ side: BackSide, color: new Color().setRGB(1, 1, 0) }),
        colourMats: createColouredMats(),
        cash: new OnChange(20000),
        starCount: new OnChange(1),
        prompt: new CommonTag<string>("", 10)
    }

    // state.map.forEachRange(2, 2, 3, 9, (x, y, v) => (v.type = TileType.ROAD));
    // state.map.forEachRange(2, 8, 9, 9, (x, y, v) => (v.type = TileType.ROAD));
    // state.map.forEachRange(2, 6, 13, 7, (x, y, v) => (v.type = TileType.ROAD));
    // state.map.forEachRange(4, 10, 19, 11, (x, y, v) => (v.type = TileType.ROAD));
    // state.map.forEachRange(8, 4, 9, 19, (x, y, v) => (v.type = TileType.ROAD));
    // state.map.forEachRange(5, 15, 12, 16, (x, y, v) => (v.type = TileType.ROAD));

    // state.zones.push(new Zone(1, 9, 3, 3, state));

    state.focusedTile = [state.map.width / 2, state.map.height / 2];

    return state;
}