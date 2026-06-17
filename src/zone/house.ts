import { Car } from "../car";
import { TIMING } from "../constants";
import { Metric, State } from "../state";
import { Zone } from "./zone";

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