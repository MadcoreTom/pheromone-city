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
            const lv = l.buffers[readBuffer];
            const uv = u.buffers[readBuffer];
            const rv = r.buffers[readBuffer];
            const dv = d.buffers[readBuffer];
            const cur = v.buffers[readBuffer];
            v.buffers[writeBuffer].unemployment =
                Math.max(cur.unemployment, lv.unemployment, uv.unemployment, rv.unemployment, dv.unemployment) - 1;
            v.buffers[writeBuffer].housing =
                Math.max(cur.housing, lv.housing, uv.housing, rv.housing, dv.housing) - 1;
        }
    );
}
