function renderAccusation(
    puzzle,
    onNextCase
) {

    const panel =
        document.getElementById(
            "accusation"
        );

    panel.replaceChildren();


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
            key:
                "suspect",

            label:
                "WHO?",

            items:
                puzzle.suspects
        },
        {
            key:
                "weapon",

            label:
                "HOW?",

            items:
                puzzle.weapons
        },
        {
            key:
                "location",

            label:
                "WHERE?",

            items:
                puzzle.locations
        }
    ];


    if (
        Array.isArray(
            puzzle.motives
        ) &&
        puzzle.motives.length > 0
    ) {

        fields.push({
            key:
                "motive",

            label:
                "WHY?",

            items:
                puzzle.motives
        });

    }


    const dropdowns = [];


    fields.forEach(
        field => {

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

        }
    );


    const button =
        document.createElement(
            "button"
        );

    button.type =
        "button";

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

    message.setAttribute(
        "aria-live",
        "polite"
    );

    container.appendChild(
        message
    );


    function lockAccusation() {

        button.disabled =
            true;


        dropdowns.forEach(
            dropdown => {

                const dropdownButton =
                    dropdown.element
                        .querySelector(
                            ".dropdown-button"
                        );

                if (dropdownButton) {

                    dropdownButton.disabled =
                        true;

                }

            }
        );

    }


    function unlockAccusation() {

        button.disabled =
            false;

        button.textContent =
            "MAKE YOUR ACCUSATION";


        dropdowns.forEach(
            dropdown => {

                const dropdownButton =
                    dropdown.element
                        .querySelector(
                            ".dropdown-button"
                        );

                if (dropdownButton) {

                    dropdownButton.disabled =
                        false;

                }

            }
        );


        showMessage(
            "",
            ""
        );

    }


    function getAccusation() {

        const accusation = {};


        dropdowns.forEach(
            (
                dropdown,
                index
            ) => {

                const field =
                    fields[index];

                accusation[
                    field.key
                ] =
                    dropdown.getValue();

            }
        );


        return accusation;

    }


    function createFindings(
        source
    ) {

        const findings = {

            suspect:
                source.suspect,

            weapon:
                source.weapon,

            location:
                source.location

        };


        if (source.motive) {

            findings.motive =
                source.motive;

        }


        return findings;

    }


    button.addEventListener(
        "click",
        () => {

            const accusation =
                getAccusation();


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


            /*
                Stop and freeze the timer only when
                the correct solution is submitted.
            */
            const solveTime =
                solved
                    ? stopCaseTimer()
                    : null;


            lockAccusation();


            if (solved) {

                button.textContent =
                    "CASE CLOSED";

                showMessage(
                    "✓ Accusation confirmed.",
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


            /*
                Show the end screen once.

                solveTime is captured above and remains
                available when this delayed callback runs.
            */
            setTimeout(
                () => {

                    if (solved) {

                        showEndScreen({

                            title:
                                "CASE CLOSED",

                            message:
                                "Your deductions were correct. The investigation has concluded successfully.",

                            details: {
                                ...createFindings(
                                    puzzle.solution
                                ),

                                solveTime:
                                    solveTime
                            },

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
                                createFindings(
                                    accusation
                                ),

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