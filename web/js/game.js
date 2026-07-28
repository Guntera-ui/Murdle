const sounds = {

    success:
        new Audio(
            "sounds/success.wav?v=2"
        ),

    error:
        new Audio(
            "sounds/error.wav?v=2"
        ),

    warning:
        new Audio(
            "sounds/warning.wav?v=2"
        ),

    scribing:
        new Audio(
            "sounds/scribing.wav?v=2"
        )

};

sounds.scribing.volume = 0.4;

function playSound(
    type
) {

    const sound =
        sounds[type];

    if (!sound) {
        return;
    }

    sound.currentTime = 0;

    sound
        .play()
        .catch(() => {});

}

function validateAccusation(
    accusation
) {

    for (const key in accusation) {

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