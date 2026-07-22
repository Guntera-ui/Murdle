function renderAccusation(
    puzzle
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

    button.textContent =
        "MAKE YOUR ACCUSATION";

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
                    "Complete your accusation.",
                    "warning"
                );

                return;

            }

            if (
                checkAccusation(
                    puzzle,
                    accusation
                )
            ) {

                showMessage(
                    "Case Solved!",
                    "success"
                );

            }
            else {

                showMessage(
                    "That accusation is incorrect.",
                    "error"
                );

            }

        }
    );

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
    )
}
