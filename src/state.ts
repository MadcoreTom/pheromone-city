import { Arr2 } from "./arr2";

export enum TileType {
    ROAD,
    GRASS
}

export type TileBuffer = {
    unemployment: number;
    housing: number;
};

export type Metric = keyof TileBuffer;

export type TileBuffers = [TileBuffer, TileBuffer];

export type Tile = {
    type: TileType;
    buffers: TileBuffers;
};

export const BLANK_TILE: Tile = {
    type: TileType.GRASS,
    buffers: [
        {
            unemployment: 0,
            housing: 0
        },
        {
            unemployment: 0,
            housing: 0
        }
    ]
};

export type State = {
    map: Arr2<Tile>;
    writeBuffer: 0 | 1,
    readBuffer: 0 | 1
    //   cars: Car[];
    //   buildings: Building[];
};

export function initState(): State {
    const state: State = {
        writeBuffer: 0,
        readBuffer: 1,
        map: new Arr2<Tile>(20, 20, (x, y) => {
            return {
                type: TileType.GRASS,
                buffers: [
                    {
                        unemployment: 0,
                        housing: 0
                    },
                    {
                        unemployment: 0,
                        housing: 0
                    }
                ]
            };
        }),
    }

    state.map.forEachRange(2, 2, 3, 9, (x, y, v) => (v.type = TileType.ROAD));
    state.map.forEachRange(2, 8, 9, 9, (x, y, v) => (v.type = TileType.ROAD));
    state.map.forEachRange(2, 6, 13, 7, (x, y, v) => (v.type = TileType.ROAD));
    state.map.forEachRange(8, 4, 9, 19, (x, y, v) => (v.type = TileType.ROAD));
    state.map.forEachRange(5, 15, 12, 16, (x, y, v) => (v.type = TileType.ROAD));

    return state;
}