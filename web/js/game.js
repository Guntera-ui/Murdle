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
        )

};

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

    for (const key in puzzle.solution) {

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

    const sound =
        sounds[type];

    if (sound) {

        sound.currentTime = 0;

        sound.play();

    }

}