const sounds = {
    success: new Audio(
        "/sounds/success.wav?v=3"
    ),

    error: new Audio(
        "/sounds/error.wav?v=3"
    ),

    warning: new Audio(
        "/sounds/warning.wav?v=3"
    ),

    scribing: new Audio(
        "/sounds/scribing.wav?v=3"
    )
};


Object.entries(
    sounds
).forEach(
    ([name, sound]) => {

        sound.preload = "auto";

        sound.addEventListener(
            "error",
            () => {

                console.error(
                    `Failed to load sound: ${name}`,
                    sound.error,
                    sound.src
                );

            }
        );

    }
);


sounds.scribing.volume = 0.4;


function playSound(
    type
) {

    const sound =
        sounds[type];

    if (!sound) {

        console.warn(
            `Unknown sound type: ${type}`
        );

        return;

    }

    sound.pause();
    sound.currentTime = 0;

    const playback =
        sound.play();

    if (
        playback instanceof Promise
    ) {

        playback.catch(
            error => {

                console.error(
                    `Failed to play sound: ${type}`,
                    error
                );

            }
        );

    }

}


function validateAccusation(
    accusation
) {

    for (
        const key in accusation
    ) {

        if (
            !accusation[key]
        ) {

            return false;

        }

    }

    return true;

}


function checkAccusation(
    puzzle,
    accusation
) {

    for (
        const key in puzzle.solution
    ) {

        if (
            accusation[key] !==
            puzzle.solution[key]
        ) {

            return false;

        }

    }

    return true;

}


function showMessage(
    text,
    type
) {

    const message =
        document.getElementById(
            "accusation-message"
        );

    if (!message) {

        console.error(
            "Missing #accusation-message element."
        );

        return;

    }

    message.className = "";

    void message.offsetWidth;

    message.textContent =
        text;

    message.classList.add(
        type
    );

    playSound(
        type
    );

}