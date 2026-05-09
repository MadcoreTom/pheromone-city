import { State, TileType } from "./state";

export function blur(state: State) {
    const { map, readBuffer, writeBuffer } = state;
    map.forEachWithNeighbours(
        {
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
        },
        (x, y, v, l, u, r, d) => {
            if (v.type != TileType.ROAD) {
                return;
            }
            const n = [l, u, r, d].map((q) => q.buffers[readBuffer]);
            v.buffers[writeBuffer].unemployment = n.reduce((x, y) => Math.max(x, y.unemployment), v.buffers[readBuffer].unemployment) - 1;
            v.buffers[writeBuffer].housing = n.reduce((x, y) => Math.max(x, y.housing), v.buffers[readBuffer].housing) - 1;
        }
    );
}
