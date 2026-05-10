import { State } from "./state";

export  class Zone {
    public constructor(
        public readonly x: number,
        public readonly y: number,
        public readonly w: number,
        public readonly h: number,
        state:State
    ) {
        // TODO assumes all clear
        for (let xx = 0; xx < this.w; xx++) {
            for (let yy = 0; yy < this.h; yy++) {
                state.map.getIf(this.x + xx, this.y + yy, v => {
                    v.zone = this;
                });
            }
        }
        state.zones.push(this);
    }

    public remove(state: State) {
        for (let xx = 0; xx < this.w; xx++) {
            for (let yy = 0; yy < this.h; yy++) {
                state.map.getIf(this.x + xx, this.y + yy, v => {
                    v.zone = undefined;
                });
            }
        }
        state.zones = state.zones.filter(z=>z!==this);
    }
    
}