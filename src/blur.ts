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

            // TODO I bet i can do better than just repeating this section for every metric
            // TODO maybe average -1 is a better approach
            // let a = Math.max(...n.map((nn) => nn.unemployment));
            // v.buffers[writeBuffer].unemployment = Math.max(
            //     v.buffers[readBuffer].unemployment - 1,
            //     a - 1
            // );

            // take the highest neighbout (including self) minus 1
            v.buffers[writeBuffer].unemployment = Math.max(d.buffers[readBuffer].unemployment, ... n.map(nn=>nn.unemployment)) - 1;
            v.buffers[writeBuffer].housing      = Math.max(d.buffers[readBuffer].housing, ... n.map(nn=>nn.housing)) - 1;

            // a = Math.max(...n.map((nn) => nn.housing));
            // v.buffers[writeBuffer].housing = Math.max(
            //     v.buffers[readBuffer].housing - 1,
            //     a - 1
            // );
        }
    );
}
