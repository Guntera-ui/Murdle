function showEndScreen(
    {
        title,
        message,
        details = {},
        buttonText,
        onButtonClick
    }
) {

    const screen =
        document.getElementById(
            "end-screen"
        );

    const caseFile =
        document.getElementById(
            "case-file"
        );

    const titleElement =
        document.getElementById(
            "end-title"
        );

    const messageElement =
        document.getElementById(
            "end-message"
        );

    const detailsElement =
        document.getElementById(
            "end-details"
        );

    const button =
        document.getElementById(
            "end-button"
        );

    const solved =
        title
            .trim()
            .toUpperCase() ===
        "CASE CLOSED";

    titleElement.textContent =
        title;

    messageElement.textContent =
        message;

    caseFile.classList.toggle(
        "case-solved",
        solved
    );

    caseFile.classList.toggle(
        "case-unsolved",
        !solved
    );

    let statusBadge =
        caseFile.querySelector(
            ".case-status-pill"
        );

    if (!statusBadge) {

        statusBadge =
            document.createElement(
                "div"
            );

        statusBadge.className =
            "case-status-pill";

        caseFile.insertBefore(
            statusBadge,
            titleElement
        );

    }

    statusBadge.textContent =
        solved
            ? "Investigation Successful"
            : "Further Investigation Required";

    detailsElement.replaceChildren();

    const findingsTitle =
        document.createElement(
            "h3"
        );

    findingsTitle.className =
        "details-title";

    findingsTitle.textContent =
        solved
            ? "Final Findings"
            : "Your Accusation";

    detailsElement.appendChild(
        findingsTitle
    );

    const findings =
        normalizeEndScreenDetails(
            details
        );

    findings.forEach(
        (
            {
                label,
                value
            }
        ) => {

            const row =
                document.createElement(
                    "div"
                );

            row.className =
                "finding-row";

            if (label === "Solve Time") {

                row.classList.add(
                    "finding-time"
                );

            }

            const labelElement =
                document.createElement(
                    "div"
                );

            labelElement.className =
                "finding-label";

            labelElement.textContent =
                label;

            const valueElement =
                document.createElement(
                    "div"
                );

            valueElement.className =
                "finding-value";

            valueElement.textContent =
                value;

            row.append(
                labelElement,
                valueElement
            );

            detailsElement.appendChild(
                row
            );

        }
    );

    button.textContent =
        buttonText;

    button.onclick = () => {

        screen.classList.add(
            "hidden"
        );

        if (onButtonClick) {

            onButtonClick();

        }

    };

    screen.classList.remove(
        "hidden"
    );

    requestAnimationFrame(
        () => {

            button.focus();

        }
    );

}


function normalizeEndScreenDetails(
    details
) {

    if (
        details &&
        typeof details === "object" &&
        !Array.isArray(details)
    ) {

        const labels = {

            suspect:
                "Suspect",

            weapon:
                "Weapon",

            location:
                "Location",

            motive:
                "Motive",

            solveTime:
                "Solve Time"

        };

        return Object
            .entries(details)
            .filter(
                (
                    [
                        ,
                        value
                    ]
                ) =>
                    value !== undefined &&
                    value !== null &&
                    value !== ""
            )
            .map(
                (
                    [
                        key,
                        value
                    ]
                ) => ({

                    label:
                        labels[key] ??
                        formatFindingLabel(
                            key
                        ),

                    value:
                        String(
                            value
                        )

                })
            );

    }

    if (Array.isArray(details)) {

        return details
            .filter(
                finding =>
                    finding &&
                    finding.value !== undefined &&
                    finding.value !== null &&
                    finding.value !== ""
            )
            .map(
                finding => ({

                    label:
                        String(
                            finding.label ?? ""
                        ),

                    value:
                        String(
                            finding.value
                        )

                })
            );

    }

    if (
        typeof details === "string" &&
        details.trim()
    ) {

        return [
            {
                label:
                    "Result",

                value:
                    details
                        .replace(
                            /<[^>]*>/g,
                            " "
                        )
                        .replace(
                            /\s+/g,
                            " "
                        )
                        .trim()
            }
        ];

    }

    return [];

}


function formatFindingLabel(
    key
) {

    return String(key)
        .replace(
            /([a-z])([A-Z])/g,
            "$1 $2"
        )
        .replace(
            /[_-]+/g,
            " "
        )
        .replace(
            /\b\w/g,
            letter =>
                letter.toUpperCase()
        );

}