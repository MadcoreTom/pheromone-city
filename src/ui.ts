import { Mesh } from "three";
import {  ALL_TOOLS } from "./tools";
import { RENDER_MODES } from "./render-mode";
import { State } from "./state";
import { Car } from "./car";
import { showPopup } from "./ui/popups";
import { ALL_STAR_LEVELS } from "./stars";

export function initUI(state: State): void {
    const buildListParent = document.getElementById("menu-list-build") as HTMLElement;
    const allToolButtons: HTMLButtonElement[] = [];
    ALL_TOOLS.forEach(t => {
        const b = document.createElement("button") as HTMLButtonElement;
        t.enabled.subscribe(v=>b.disabled = !v)
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
    });

    const starsElem = document.getElementById("star-indicator") as HTMLElement;
    state.starCount.subscribe(count => {
        starsElem.innerHTML = "";
        for (let i = 0; i < 5; i++) {
            const img = document.createElement("img");
            img.width = 20;
            img.alt = "Star";
            if (i < count) {
                img.src = `icons/star-filled.svg`;
            } else {
                img.src = `icons/star-empty.svg`;
            }
            img.addEventListener("click",()=>{
                const s= ALL_STAR_LEVELS[i];
                if(s){
                    showPopup(state, s.popup);
                }
            })
            starsElem.appendChild(img)
        }
    });
}

export function updateScore(state: State) {
    const zoneToSpawnInto = state.starLevel.evaluateSpawn(state);
    if(zoneToSpawnInto){
            const car = new Car(zoneToSpawnInto.x, zoneToSpawnInto.y, "housing");
            car.tx = car.x;
            car.ty = car.y;
            car.hidden = true;
            state.cars.push(car);
            zoneToSpawnInto.enter(car);
            document.getElementById("population-status")!.textContent = `Population: ${state.cars.length}`
    }
}