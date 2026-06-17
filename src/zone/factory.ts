import { Car } from "../car";
import { TIMING } from "../constants";
import { Metric, State } from "../state";
import { Zone } from "./zone";


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

