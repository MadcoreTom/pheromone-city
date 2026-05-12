import { Car } from "./car";
import { Metric, State, Tile, TileType } from "./state";

export abstract class Zone {
    public cars: Car[] = [];
    public constructor(
        public readonly x: number,
        public readonly y: number,
        public readonly w: number,
        public readonly h: number,
        state: State
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

    public abstract update(state: State, delta: number): void;

    protected emitMetric(state: State, metric: Metric) {
        const write = state.writeBuffer;
        const setMetric = (t: Tile) => t.type == TileType.ROAD && (t.buffers[write][metric] = 0);
        // above and below
        for (let x = this.x; x < this.x + this.w; x++) {
            state.map.getIf(x, this.y - 1, setMetric);
            state.map.getIf(x, this.y + this.h, setMetric);
        }
        // left and right
        for (let y = this.y; y < this.y + this.h; y++) {
            state.map.getIf(this.x - 1, y, setMetric);
            state.map.getIf(this.x + this.w, y, setMetric);
        }
    }

    public remove(state: State) {
        for (let xx = 0; xx < this.w; xx++) {
            for (let yy = 0; yy < this.h; yy++) {
                state.map.getIf(this.x + xx, this.y + yy, v => {
                    v.zone = undefined;
                });
            }
        }
        state.zones = state.zones.filter(z => z !== this);
    }

    public abstract providesNeed(metric: Metric): boolean;


    public abstract getText(): string;

}

export class HouseZone extends Zone {
    private readonly capacity = 2;
    public constructor(x: number, y: number, state: State) {
        super(x, y, 2, 2, state);
    }


    public update(state: State, delta: number) {
        if (this.cars.length < this.capacity) {
            this.emitMetric(state, "housing");
        }

        // then dump the cars out
        // TODO do this better
        if (this.cars.length > 0 && Math.random() < 0.002) {
            const c = this.cars.shift()!;
            c.dead = false;
            c.target = "unemployment"
            state.cars.push(c);
        }
    }


    public providesNeed(metric: Metric): boolean {
        return metric == "housing" && this.cars.length < this.capacity;
    }

    public getText(): string {
        return `House ${this.cars.length}/${this.capacity}`;
    }
}

export class FactoryZone extends Zone {
    private readonly capacity = 3;
    public constructor(x: number, y: number, state: State) {
        super(x, y, 3, 3, state);
    }


    public update(state: State, delta: number) {
        if (this.cars.length < this.capacity) {
            this.emitMetric(state, "unemployment");
        }

        // then dump the cars out
        // TODO do this better
        if (this.cars.length > 0 && Math.random() < 0.003) {
            // TODO put this in the best neighbour
            const c = this.cars.shift()!;
            c.dead = false;
            c.target = "housing"
            state.cars.push(c);
        }
    }


    public providesNeed(metric: Metric): boolean {
        return metric == "unemployment" && this.cars.length < this.capacity;
    }

    public getText(): string {
        return `Factory ${this.cars.length}/${this.capacity}`;
    }
}