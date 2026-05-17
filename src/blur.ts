import { TRAFFIC_DECAY_RATE } from "./constants";
import { BLANK_TILE, State, TileType } from "./state";

export function blur(state: State, delta: number) {
    const { map, readBuffer, writeBuffer } = state;
    map.forEachWithNeighbours(
        BLANK_TILE,
        (x, y, v, l, u, r, d) => {
            if (v.type != TileType.ROAD) {
                return;
            }
            const lv = l.buffers[readBuffer];
            const uv = u.buffers[readBuffer];
            const rv = r.buffers[readBuffer];
            const dv = d.buffers[readBuffer];
            const cur = v.buffers[readBuffer];
            const trafficEffect = 1+cur.traffic / 10;
            v.buffers[writeBuffer].unemployment =
                Math.max(cur.unemployment, lv.unemployment, uv.unemployment, rv.unemployment, dv.unemployment) - trafficEffect;
            v.buffers[writeBuffer].housing =
                Math.max(cur.housing, lv.housing, uv.housing, rv.housing, dv.housing) - trafficEffect;
            v.buffers[writeBuffer].shopping =
                Math.max(cur.shopping, lv.shopping, uv.shopping, rv.shopping, dv.shopping) - trafficEffect;

                // traffic blurs differently
                // tODO not framerate independent
                // decay current traffic value
                const t = Math.max(0, cur.traffic - (delta * TRAFFIC_DECAY_RATE));
                // then blue
                v.buffers[writeBuffer].traffic = Math.max(t,Math.max(lv.traffic, uv.traffic,rv.traffic,dv.traffic) / 2.7);
        }
    );
}
