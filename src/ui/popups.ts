import { State } from "../state"

type PopupDetail = {
    name: string,
    content: string,
    buttonText: string
}

const POPUP_CONTENTS = {
    pause: {
        name: "Game Pause",
        content: "The game is paused",
        buttonText: "Resume"
    },
    test: {
        name: "test name",
        content: "test content",
        buttonText: "Cancel"
    },
    intro: {
        name: "Welcome",
        content: `<p>Welcome to <strong>Pheromone City</strong> (working title)<br/>
            This is a casual city-building game, with interesting mechanics.<br/>
            When a car is seeking out a destination, it "follows its nose" to the closes place emmiting the <i>pheromone</i><br/>
            You can see this by using the inspection view. This means that nobody has assigned houses or jobs</p>
            <p>Cars will spawn in a house if you have 1 empty house, one completely empty job, and an empty shop.<br/>
            However, cars will not spawn if more than 50% of cars are caught in traffic</p>
            <p>Build your city, and have fun!</p>`,
        buttonText: "Start"
    }
} as const;

const popupElem = document.getElementById("popup") as HTMLElement;
const popupButtonsElem = document.getElementById("popup-buttons") as HTMLElement;
const popupContentElem = document.getElementById("popup-content") as HTMLElement;

export function showPopup(state: State, popupName: keyof typeof POPUP_CONTENTS) {
    state.paused = true;
    popupElem.style.display = "block";

    const cur = POPUP_CONTENTS[popupName];

    (popupElem.querySelector(".title-bar-text") as HTMLElement).textContent = cur.name;

    popupContentElem.innerHTML = cur.content;

    const button = document.createElement("button");
    button.innerText = cur.buttonText;
    button.addEventListener("click", () => {
        state.paused = false;
        popupElem.style.display = "none";
    })

    popupButtonsElem.innerHTML = "";
    popupButtonsElem.appendChild(button);
}