import { Mesh } from "three";
import {  ALL_TOOLS } from "./tools";
import { RENDER_MODES } from "./render-mode";
import { State } from "./state";
import { Zone } from "./zone/zone";
import { Car } from "./car";
import { showPopup } from "./ui/popups";

export function initUI(state: State): void {
    const buildListParent = document.getElementById("menu-list-build") as HTMLElement;
    const allToolButtons: HTMLButtonElement[] = [];
    ALL_TOOLS.forEach(t => {
        const b = document.createElement("button") as HTMLButtonElement;
        let html = `<img src="icons/${t.icon}" width="20" alt="${t.name}"/><br/>`;
        if (t.cost != 0) {
            html += `$${t.cost}<br/>`;
        }
        html += t.name;
        b.innerHTML = html;
        b.addEventListener("click", () => {
            state.tool = t;
            allToolButtons.forEach(bb=>bb.disabled = false);
            b.disabled = true;
        });
        buildListParent.appendChild(b);
        allToolButtons.push(b);
    });

    const inspectListParent = document.getElementById("menu-list-inspect") as HTMLElement;
    [null, ...RENDER_MODES].forEach(mode => {
        const rowElem = document.createElement("div") as HTMLDivElement;
        rowElem.classList.add("field-row");

        const inputElem = document.createElement("input") as HTMLInputElement;
        inputElem.id = "tool-" + (mode ? mode.getName() : "normal");
        inputElem.type = "radio"
        inputElem.name = "inspect-mode-radios"
        inputElem.checked = !mode;
        rowElem.appendChild(inputElem);

        const labelElem = document.createElement("label") as HTMLLabelElement;
        labelElem.setAttribute("for", inputElem.id);
        labelElem.textContent = mode ? mode.getName() : "Normal";
        rowElem.appendChild(labelElem);

        inputElem.addEventListener("change", () => {
            state.map.forEach((x, y, v) => {
                if (v.object) {
                    v.object.traverse(o => {
                        if (o instanceof Mesh) {
                            o.material = state.defaultMat;
                        }
                    })
                }
            })
            state.renderMode = mode ? mode : undefined
            if (!state.renderMode) {
                state.renderMode = undefined;
            }
        });
        inspectListParent.appendChild(rowElem);
    });

    addClickListenerToAllWithDataAttribute(
        document, "data-tool",
        (toolName, elem) => {
            const tool = ALL_TOOLS.filter(t => t.name == toolName)[0];
            if (tool) {
                state.tool = tool;
            } else {
                console.warn("Unknown tool", toolName);
            }
        }
    )

    addClickListenerToAllWithDataAttribute(
        document, "data-action",
        (action, elem) => {
            switch (action) {
                case "zoomIn":
                    state.targetZoom /= 1.5;
                    break;
                case "zoomOut":
                    state.targetZoom *= 1.5;
                    break;
                case "rotCW":
                    state.cameraAngleTarget++;
                    break;
                case "rotCCW":
                    state.cameraAngleTarget--;
                    break;
                case "pause":
                    showPopup(state, "pause");
                    break;
            }
        }
    )

    function addClickListenerToAllWithDataAttribute(root: HTMLElement | Document, attribute: string, onClick: (value: string, elem: HTMLElement) => unknown, onDeselect?: (elem: HTMLElement) => unknown) {
        const elems = [...root.querySelectorAll(`[${attribute}]`)] as HTMLElement[];
        elems.forEach(dt => {
            dt.addEventListener("click", evt => {
                const value = dt.getAttribute(attribute)!;
                onClick(value, dt);
                if (onDeselect) {
                    elems.filter(e => e != dt).forEach(e => onDeselect(e));
                }
            });
        });
    }

    const cashElem = document.getElementById("cash-status") as HTMLElement;
    state.cash.subscribe(cash=>{
        cashElem.innerText = "Funds: $" + cash;
    })
}

export function updateScore(state: State) {
    let emptyHouses = 0;
    let emptyJobs = 0;
    let emptyShops = 0;
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
            if (z.providesNeed("shopping")) {
                emptyShops++;
            }
        }
    });
    if (emptyHouses > 0 && emptyJobs > 0 && emptyShops > 0) {
        console.log("🔼 Looks good");
        const carCount = state.cars.length;
        const carsOut = state.cars.filter(c => !c.hidden).length;
        console.log("Look cars", carCount, carsOut)
        if (carsOut < carCount * 0.5) {
            const z = houses[Math.floor(Math.random() * houses.length)];
            const car = new Car(z.x, z.y, "housing");
            car.tx = car.x;
            car.ty = car.y;
            car.hidden = true;
            state.cars.push(car);
            z.enter(car);
            document.getElementById("population-status")!.textContent = `Population: ${state.cars.length}`
        }
    } else {
        console.log("🔽 Looks bad")
    }
}