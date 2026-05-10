import { Arr2 } from "./arr2";
import { Building, StandardBuilding } from "./building";
import { Car } from "./car";

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
            unemployment: -999,
            housing: -999
        },
        {
            unemployment: -999,
            housing: -999
        }
    ]
};

export type State = {
    map: Arr2<Tile>;
    writeBuffer: 0 | 1,
    readBuffer: 0 | 1
    cars: Car[];
    buildings: Building[];
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
                        unemployment: -999,
                        housing: -999
                    },
                    {
                        unemployment: -999,
                        housing: -999
                    }
                ]
            };
        }),
        cars: [
            new Car(8.5, 9.5, "unemployment"),
            new Car(8.5, 13.5, "unemployment"),
            new Car(8.5, 15.5, "unemployment"),
            new Car(8.5, 5.5, "unemployment"),
            new Car(8.5, 10.5, "housing")
        ],
        buildings: [
            new StandardBuilding(6, 15, 2, "unemployment", "housing"),
            new StandardBuilding(11, 15, 2, "unemployment", "housing"),
            new StandardBuilding(2, 3, 3, "housing", "unemployment"),
            new StandardBuilding(8, 4, 1, "housing", "unemployment")
        ]
    }

    state.map.forEachRange(2, 2, 3, 9, (x, y, v) => (v.type = TileType.ROAD));
    state.map.forEachRange(2, 8, 9, 9, (x, y, v) => (v.type = TileType.ROAD));
    state.map.forEachRange(2, 6, 13, 7, (x, y, v) => (v.type = TileType.ROAD));
    state.map.forEachRange(4, 10, 19, 11, (x, y, v) => (v.type = TileType.ROAD));
    state.map.forEachRange(8, 4, 9, 19, (x, y, v) => (v.type = TileType.ROAD));
    state.map.forEachRange(5, 15, 12, 16, (x, y, v) => (v.type = TileType.ROAD));

    return state;
}