import { Car } from "./car";
import { CAR_RETRY_DELAY_MS, TIMING } from "./constants";
import { Metric, State, Tile, TileType } from "./state";

type ScheduledCar = [number, Car];

export abstract class Zone {
    public cars: ScheduledCar[] = [];
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

    protected releaseCars(state: State) {
        const carsToReturn:ScheduledCar[] = [];
        if (this.cars.length > 0 && this.cars[0][0] <= 0) {
            const [_, car] = this.cars.shift()!;
            car.chooseNextTarget();
            // place back on a good tile
            const options: { x: number, y: number, value: number, road: boolean }[] = [];
            // above and below
            for (let x = this.x; x < this.x + this.w; x++) {
                state.map.getIf(x, this.y - 1, t => options.push({ x, y: this.y - 1, value: t.buffers[state.readBuffer][car.target], road: t.type == TileType.ROAD }));
                state.map.getIf(x, this.y + this.h, t => options.push({ x, y: this.y + this.h, value: t.buffers[state.readBuffer][car.target], road: t.type == TileType.ROAD }));
            }
            // left and right
            for (let y = this.y; y < this.y + this.h; y++) {
                state.map.getIf(this.x - 1, y, t => options.push({ x: this.x, y, value: t.buffers[state.readBuffer][car.target], road: t.type == TileType.ROAD }));
                state.map.getIf(this.x + this.w, y, t => options.push({ x: this.x + this.w, y, value: t.buffers[state.readBuffer][car.target], road: t.type == TileType.ROAD }));
            }

            // Sort by the target and pick the best one
            const best = options.filter(t => t.road).sort((a, b) => b.value - a.value)[0];
            if (best) {
                car.tx = best.x;
                car.ty = best.y;
                car.x = best.x;
                car.y = best.y;
                console.log("BEST", best)
                car.dead = false;// TODO rename dead to hidden
                state.cars.push(car);
            } else {
                console.log("A car tried to leave a house but there was no road, try again in "), CAR_RETRY_DELAY_MS;
                carsToReturn.push([CAR_RETRY_DELAY_MS,car])
            }


        }

        if(carsToReturn.length > 0){
            carsToReturn.forEach(sc=>this.cars.unshift(sc));
        }
    }

    public abstract providesNeed(metric: Metric): boolean;

    public abstract enter(car:Car):any;


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


        this.cars.forEach(c=>c[0] -= delta);
        this.releaseCars(state);

    }

    public enter(car:Car){
        this.cars.push([TIMING.HOME_MS,car]);
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
        

        this.cars.forEach(c=>c[0] -= delta);
        this.releaseCars(state);
    }


    public enter(car:Car){
        this.cars.push([TIMING.FACTORY_WORK_MS, car]);
    }


    public providesNeed(metric: Metric): boolean {
        return metric == "unemployment" && this.cars.length < this.capacity;
    }

    public getText(): string {
        return `Factory ${this.cars.length}/${this.capacity}`;
    }
}


export class ShopZone extends Zone {
    private readonly capacity = 1;
    public constructor(x: number, y: number, state: State) {
        super(x, y, 2, 3, state);
    }


    public update(state: State, delta: number) {
        if (this.cars.length < this.capacity) {
            this.emitMetric(state, "shopping");
        }
        

        this.cars.forEach(c=>c[0] -= delta);
        this.releaseCars(state);
    }


    public enter(car:Car){
        this.cars.push([TIMING.SHOP_SHOPPING_MS,car]);
    }


    public providesNeed(metric: Metric): boolean {
        return metric == "shopping" && this.cars.length < this.capacity;
    }

    public getText(): string {
        return `Shop ${this.cars.length}/${this.capacity}`;
    }
}