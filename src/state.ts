import { Arr2 } from "./arr2";
import { Car } from "./car";
import { Tool } from "./tools";
import { Zone } from "./zone";

export enum TileType {
    ROAD,
    GRASS
}

export type TileBuffer = {
    unemployment: number;
    housing: number;
    shopping: number;
    traffic: number;
};

export type Metric = keyof TileBuffer;

export type TileBuffers = [TileBuffer, TileBuffer];

export type Tile = {
    type: TileType;
    buffers: TileBuffers;
    zone?: Zone;
};

export const BLANK_TILE: Tile = {
    type: TileType.GRASS,
    buffers: [
        {
            unemployment: -999,
            housing: -999,
            shopping: -999,
            traffic:0
        },
        {
            unemployment: -999,
            housing: -999,
            shopping: -999,
            traffic:0
        }
    ]
};

export type State = {
    map: Arr2<Tile>;
    writeBuffer: 0 | 1,
    readBuffer: 0 | 1
    cars: Car[];
    tool?: Tool;
    zones: Zone[],
    mouse: [number, number],
    renderMode?: RenderMode
};

export interface RenderMode {
    getTileFill(state: State, tile: Tile): string;
    highlightCar(car: Car): boolean;
    getName(): string;
}


export function initState(): State {
    const state: State = {
        mouse: [0, 0],
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
                        traffic: 0
                    },
                    {
                        unemployment: -999,
                        housing: -999,
                        shopping: -999,
                        traffic: 0
                    }
                ]
            };
        }),
        cars: [
            new Car(8.5, 9.5, "unemployment"),
            new Car(8.5, 13.5, "unemployment"),
            new Car(8.5, 15.5, "unemployment"),
            new Car(8.5, 9.5, "housing"),
            new Car(8.5, 13.5, "housing"),
            new Car(8.5, 15.5, "housing"),
            new Car(8.5, 5.5, "housing"),
            new Car(8.5, 10.5, "housing")
        ],
        zones: []
    }

    state.map.forEachRange(2, 2, 3, 9, (x, y, v) => (v.type = TileType.ROAD));
    state.map.forEachRange(2, 8, 9, 9, (x, y, v) => (v.type = TileType.ROAD));
    state.map.forEachRange(2, 6, 13, 7, (x, y, v) => (v.type = TileType.ROAD));
    state.map.forEachRange(4, 10, 19, 11, (x, y, v) => (v.type = TileType.ROAD));
    state.map.forEachRange(8, 4, 9, 19, (x, y, v) => (v.type = TileType.ROAD));
    state.map.forEachRange(5, 15, 12, 16, (x, y, v) => (v.type = TileType.ROAD));

    // state.zones.push(new Zone(1, 9, 3, 3, state));

    return state;
}