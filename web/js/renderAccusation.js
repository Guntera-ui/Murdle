function renderAccusation(
    puzzle,
    onNextCase
) {

    const panel =
        document.getElementById(
            "accusation"
        );

    panel.innerHTML = "";

    const container =
        document.createElement(
            "div"
        );

    container.className =
        "accusation-panel";

    panel.appendChild(
        container
    );

    const fields = [
        {
            key: "suspect",
            label: "WHO?",
            items: puzzle.suspects
        },
        {
            key: "weapon",
            label: "HOW?",
            items: puzzle.weapons
        },
        {
            key: "location",
            label: "WHERE?",
            items: puzzle.locations
        }
    ];

    if (puzzle.motives) {

        fields.push({

            key: "motive",

            label: "WHY?",

            items: puzzle.motives

        });

    }

    const dropdowns = [];

    fields.forEach(field => {

        const dropdown =
            createDropdown(
                field.label,
                field.items
            );

        dropdowns.push(
            dropdown
        );

        container.appendChild(
            dropdown.element
        );

    });

    const button =
        document.createElement(
            "button"
        );

    button.textContent =
        "MAKE YOUR ACCUSATION";

    container.appendChild(
        button
    );

    const message =
        document.createElement(
            "p"
        );

    message.id =
        "accusation-message";

    container.appendChild(
        message
    );

    function lockAccusation() {

        button.disabled = true;

        dropdowns.forEach(dropdown => {

            dropdown.element
                .querySelector(".dropdown-button")
                .disabled = true;

        });

    }

    function unlockAccusation() {

        button.disabled = false;

        button.textContent =
            "MAKE YOUR ACCUSATION";

        dropdowns.forEach(dropdown => {

            dropdown.element
                .querySelector(".dropdown-button")
                .disabled = false;

        });

    }

    button.addEventListener(
        "click",
        () => {

            const accusation = {};

            dropdowns.forEach(
                (
                    dropdown,
                    index
                ) => {

                    accusation[
                        fields[index].key
                    ] =
                        dropdown.getValue();

                }
            );

            if (
                !validateAccusation(
                    accusation
                )
            ) {

                showMessage(

                    "Complete every field before making an accusation.",

                    "warning"

                );

                return;

            }

            const solved =
                checkAccusation(
                    puzzle,
                    accusation
                );

            lockAccusation();

            if (solved) {

                button.textContent =
                    "CASE SOLVED";

                showMessage(

                    "✓ Correct! The mystery has been solved.",

                    "success"

                );

            }
            else {

                button.textContent =
                    "CASE UNSOLVED";

                showMessage(

                    "✗ Incorrect accusation.",

                    "error"

                );

            }

            setTimeout(
                () => {

                    if (solved) {

                        showEndScreen({

                            title:
                                "CASE CLOSED",

                            message:
                                "Your deductions were correct. The investigation has concluded successfully.",

                            details:
                                `
                                <h3>FINAL FINDINGS</h3>

                                <strong>Suspect</strong><br>
                                ${puzzle.solution.suspect}<br><br>

                                <strong>Weapon</strong><br>
                                ${puzzle.solution.weapon}<br><br>

                                <strong>Location</strong><br>
                                ${puzzle.solution.location}

                                ${
                                    puzzle.solution.motive
                                    ? `
                                    <br><br>

                                    <strong>Motive</strong><br>

                                    ${puzzle.solution.motive}
                                    `
                                    : ""
                                }
                                `,

                            buttonText:
                                "OPEN NEXT CASE",

                            onButtonClick:
                                onNextCase

                        });

                    }
                    else {

                        showEndScreen({

                            title:
                                "CASE UNSOLVED",

                            message:
                                "Your accusation was not supported by the available evidence. Review the case file and continue your investigation.",

                            details:
                                `
                                <h3>YOUR ACCUSATION</h3>

                                <strong>Suspect</strong><br>
                                ${accusation.suspect}<br><br>

                                <strong>Weapon</strong><br>
                                ${accusation.weapon}<br><br>

                                <strong>Location</strong><br>
                                ${accusation.location}

                                ${
                                    accusation.motive
                                    ? `
                                    <br><br>

                                    <strong>Motive</strong><br>

                                    ${accusation.motive}
                                    `
                                    : ""
                                }
                                `,

                            buttonText:
                                "RETRY INVESTIGATION",

                            onButtonClick:
                                unlockAccusation

                        });

                    }

                },

                1500

            );

        }

    );

}

