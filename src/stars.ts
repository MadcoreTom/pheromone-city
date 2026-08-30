import { Car } from "./car";
import { BLANK_TILE, State } from "./state";
import { ALL_TOOLS_MAP } from "./tools";
import { PopupDetail } from "./ui/popups";
import { Zone } from "./zone/zone";

export interface Star {
    /**
     * Given the car's current target, update it't target with logic specific to this star level
     */
    chooseNextCarTarget(state: State, car: Car): void;
    /**
     * Evaluate whether to spawn a new car. If so, return a Zone to spawn them in
     */
    evaluateSpawn(state: State): null | Zone;
    /**
     * Return true if they can progress to the next star
     */
    evaluateNextStar(state: State): Star;
    /**
     * Returns the list of tool names that are enabled for this star level
     */
    listAvailableToolNames(): string[]; // TODO have better typing here
    get stars(): number;
    get popup(): PopupDetail;
}

export class OneStar implements Star {
    public readonly stars: number = 1;
    public readonly popup: PopupDetail = {
        name: "One Star",
        content: `<p><strong>One Star</strong><br>
        Cars only need a job and a home to spawn.<br>
        Reach a population of 10 to get to the next star rating</p>`,
        buttonText: "Continue"
    };
    chooseNextCarTarget(state: State, car: Car): void {
        // Simply go from work to home
        if (car.target == "housing") {
            car.target = "unemployment"
        } else {
            car.target = "housing";
        }
    }
    evaluateSpawn(state: State): null | Zone {
        // tODO do this elsewhere
        ALL_TOOLS_MAP.house2.enabled.value = true;
        ALL_TOOLS_MAP.factory.enabled.value = true;

        /*
        let emptyHouses = 0;
        let emptyJobs = 0;
        // let emptyShops = 0;
        let houses: Zone[] = [];
        state.zones.forEach(z => {
            if (z.cars.length === 0) {
                if (z.providesNeed("housing")) {
                    emptyHouses++;
                    houses.push(z);
                }
                if (z.providesNeed("unemployment")) {
                    emptyJobs++;
                }
                // if (z.providesNeed("shopping")) {
                //     emptyShops++;
                // }
            }
        });
      //  if (emptyHouses > 0 && emptyJobs > 0 && emptyShops > 0) {
            const carCount = state.cars.length;
            const carsOut = state.cars.filter(c => !c.hidden).length;
            if (carsOut <= carCount * 0.5) {
                return houses[Math.floor(Math.random() * houses.length)];
            }
        }
        return null;
        */
        const housesWithAvailability : Zone[] = [];
        const jobsWithAvailability: Zone[] = [];
        state.zones.forEach(z => {
            if (z.providesNeed("housing")) {
                housesWithAvailability.push(z);
            }
            if (z.providesNeed("unemployment")) {
                jobsWithAvailability.push(z);
            }
        });
        let drivingCarsLookingForHome =0;
        let drivingCarsLookingForWork =0;
        state.cars.filter(c=>!c.hidden).forEach(c=>{
            if(c.target === "housing"){
                drivingCarsLookingForHome++;
            }
            if(c.target === "unemployment"){
                drivingCarsLookingForWork++;
            }
        });

        const enoughHouses = drivingCarsLookingForHome < housesWithAvailability.length;
        const enoughJobs = drivingCarsLookingForWork < jobsWithAvailability.length
        if(!enoughHouses){
            state.prompt.add("Build more homes");
        } 
        if(!enoughJobs){
            state.prompt.add("Build more jobs");
        }
        if(enoughHouses && enoughJobs){
            return housesWithAvailability[Math.floor(Math.random() * housesWithAvailability.length)];
        }

    }
    evaluateNextStar(state: State): Star {
        // when a population of 10 is reached
        return state.cars.length >= 10 ? new TwoStar() : this;
    }
    listAvailableToolNames(): string[] {
        throw new Error("Method not implemented.");
    }

}

export class TwoStar extends OneStar {
    public readonly stars = 2;
    public readonly popup: PopupDetail = {
        name: "Two Stars",
        content: `<p><strong>Two Stars</strong><br>
        Cars sometimes drive from their home to shops. Build some shops.<br>
        For new cars to spawn, there must be sufficient jobs, shops and homes</p>`,
        buttonText: "Continue"
    };
    evaluateSpawn(state: State): null | Zone {
        // tODO do this elsewhere
        ALL_TOOLS_MAP.shop.enabled.value = true;
        // an empty house, an empty job, and an empty shop, with <50% cars as traffic
        // let emptyHouses = 0;
        // let emptyJobs = 0;
        // // let emptyShops = 0;
        // let houses: Zone[] = [];
        // state.zones.forEach(z => {
        //     if (z.cars.length === 0) {
        //         if (z.providesNeed("housing")) {
        //             emptyHouses++;
        //             houses.push(z);
        //         }
        //         if (z.providesNeed("unemployment")) {
        //             emptyJobs++;
        //         }
        //         // if (z.providesNeed("shopping")) {
        //         //     emptyShops++;
        //         // }
        //     }
        // });

                const housesWithAvailability : Zone[] = [];
        const jobsWithAvailability: Zone[] = [];
        state.zones.forEach(z => {
            if (z.providesNeed("housing")) {
                housesWithAvailability.push(z);
            }
            if (z.providesNeed("unemployment")) {
                jobsWithAvailability.push(z);
            }
        });

        let drivingCarsLookingForHome =0;
        let drivingCarsLookingForWork =0;
        let happiness = 0;
        state.cars.filter(c=>!c.hidden).forEach(c=>{
            if(c.target === "housing"){
                drivingCarsLookingForHome++;
            }
            if(c.target === "unemployment"){
                drivingCarsLookingForWork++;
            }
            happiness += c.happiness;
        });

        const enoughHouses = drivingCarsLookingForHome < housesWithAvailability.length;
        const enoughJobs = drivingCarsLookingForWork < jobsWithAvailability.length;
        const happyEnough = (happiness / state.cars.length) > 0.45; // TODO base this on the happiness metric players see in the ui
        const trafficOk = state.cars.map(c => c.happiness).reduce((a, b) => a + b, 0) / state.cars.length <= 0.6;

        // reasons
        if (!enoughHouses) {
            state.prompt.add("Not enough empty houses");
        } if (!enoughJobs) {
            state.prompt.add("Not enough jobs");
        } if (!trafficOk) {
            state.prompt.add("Too much trafffic");
        } if (!happyEnough) {
            state.prompt.add("Not happy enoguh. Build shops");
        }
        if (enoughHouses && enoughJobs && trafficOk && happyEnough) {
            const carCount = state.cars.length;
            const carsOut = state.cars.filter(c => !c.hidden).length;
            if (carsOut < carCount * 0.5) {
                return housesWithAvailability[Math.floor(Math.random() * housesWithAvailability.length)];
            }
        }
        return null;
    }
    evaluateNextStar(state: State): Star {
        // when a population of 10 is reached
        return this;
    }
    chooseNextCarTarget(state: State, car: Car): void {
        // reduce happiness8654
        const tile = state.map.get(car.tx, car.ty, BLANK_TILE);
        // Look for shops if unhappy, or 5% chance. if you can't find one, reduce happiness0
        if (car.happiness < 0.5 || Math.random() < 0.1) {
            if(tile.buffers[state.readBuffer].shopping > -999){
                console.log("🚗 shop");
            car.target = "shopping";
return;
            } else {
                console.log("🚗⚠️ No shop found");
                car.happiness = Math.max(car.happiness - 0.1, 0)
            }
            // TODO if there's no shopping available (via pathing) at this point in time, reduce happiness
        }
        
         if (car.target == "housing") {
                console.log("🚗 work");
            car.target = "unemployment";
        } else {
                console.log("🚗 home");
            car.target = "housing";
        }
    }
}

export const ALL_STAR_LEVELS: Star[] = [new OneStar(), new TwoStar()];