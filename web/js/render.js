let activeReferencePuzzle = null;


function renderList(
    items,
    elementId,
    categoryId,
    puzzle = activeReferencePuzzle
) {

    const list =
        document.getElementById(
            elementId
        );

    if (!list) {
        return;
    }

    list.replaceChildren();

    const details =
        getReferenceDetails(
            puzzle,
            categoryId
        );

    items.forEach(item => {

        const li =
            document.createElement(
                "li"
            );

        li.className =
            "category-reference-item";

        const img =
            document.createElement(
                "img"
            );

        img.src =
            item.icon;

        img.alt = "";

        img.className =
            "list-icon";

        const content =
            document.createElement(
                "div"
            );

        content.className =
            "category-reference-content";

        const name =
            document.createElement(
                "span"
            );

        name.className =
            "category-reference-name";

        name.textContent =
            item.name;

        content.appendChild(
            name
        );

        const attributes =
            details?.[
                item.name
            ]?.attributes ?? {};

        const formattedFacts =
            formatDossierAttributes(
                attributes
            );

        if (
            formattedFacts.length > 0
        ) {

            const facts =
                document.createElement(
                    "div"
                );

            facts.className =
                "category-reference-facts";

            formattedFacts.forEach(
                factText => {

                    const fact =
                        document.createElement(
                            "span"
                        );

                    fact.className =
                        "category-reference-fact";

                    fact.textContent =
                        factText;

                    facts.appendChild(
                        fact
                    );

                }
            );

            content.appendChild(
                facts
            );

            li.classList.add(
                "category-reference-item--has-facts"
            );

        }

        li.append(
            img,
            content
        );

        list.appendChild(
            li
        );

    });

}


function renderCategories(
    categories,
    puzzle = activeReferencePuzzle
) {

    if (puzzle) {

        activeReferencePuzzle =
            puzzle;

    }

    const container =
        document.getElementById(
            "categories"
        );

    if (!container) {
        return;
    }

    container.replaceChildren();

    categories.forEach(category => {

        const group =
            document.createElement(
                "section"
            );

        group.className =
            "category-group";

        const details =
            getReferenceDetails(
                activeReferencePuzzle,
                category.id
            );

        const hasFacts =
            category.items.some(
                item =>
                    Object.keys(
                        details?.[
                            item.name
                        ]?.attributes ?? {}
                    ).length > 0
            );

        if (hasFacts) {

            group.classList.add(
                "category-group--has-facts"
            );

        }

        const heading =
            document.createElement(
                "h3"
            );

        heading.className =
            "category-group-title";

        heading.textContent =
            category.label;

        const list =
            document.createElement(
                "ul"
            );

        list.id =
            category.id;

        list.className =
            "category-list";

        group.append(
            heading,
            list
        );

        container.appendChild(
            group
        );

        renderList(
            category.items,
            category.id,
            category.id,
            activeReferencePuzzle
        );

    });

}


function getReferenceDetails(
    puzzle,
    categoryId
) {

    if (!puzzle) {
        return null;
    }

    const detailsByCategory = {
        suspects:
            puzzle.suspectDetails,
        weapons:
            puzzle.weaponDetails,
        locations:
            puzzle.locationDetails,
        motives:
            puzzle.motiveDetails
    };

    return (
        detailsByCategory[
            categoryId
        ] ?? null
    );

}


function renderVictim(
    victim
) {

    const section =
        document.getElementById(
            "victim-section"
        );

    section.innerHTML = "";

    if (!victim) {
        return;
    }

    section.innerHTML = `
        <h2 class="case-heading">
            VICTIM
        </h2>

        <strong>
            ${victim.name}
        </strong><br>

        ${victim.occupation}<br>

        Cause of death:
        ${victim.causeOfDeath}
    `;

}


function renderIncident(
    report
) {

    const section =
        document.getElementById(
            "incident-section"
        );

    section.innerHTML = "";

    if (!report) {
        return;
    }

    const heading =
        document.createElement(
            "h2"
        );

    heading.className =
        "case-heading";

    heading.textContent =
        "INCIDENT REPORT";

    const paragraph =
        document.createElement(
            "p"
        );

    paragraph.textContent =
        report;

    section.appendChild(
        heading
    );

    section.appendChild(
        paragraph
    );

}


function renderDossierFacts(
    puzzle
) {

    activeReferencePuzzle =
        puzzle ?? null;

    document
        .getElementById(
            "dossier-facts-section"
        )
        ?.remove();

    const referenceContainer =
        document.getElementById(
            "categories"
        );

    if (
        puzzle &&
        referenceContainer &&
        referenceContainer
            .children
            .length > 0
    ) {

        renderCategories(
            createCategories(
                puzzle
            ).list,
            puzzle
        );

    }

}


function formatDossierAttributes(
    attributes
) {

    return Object.entries(
        attributes ?? {}
    )
        .map(
            ([name, value]) =>
                formatDossierAttribute(
                    name,
                    value
                )
        )
        .filter(Boolean);

}


function formatDossierAttribute(
    name,
    value
) {

    if (
        !value ||
        !value.kind
    ) {
        return "";
    }

    if (
        name === "indoors" &&
        value.kind === "bool"
    ) {

        return value.bool
            ? "Indoor"
            : "Outdoor";

    }

    const label =
        formatDossierAttributeName(
            name
        );

    if (
        value.kind === "string"
    ) {

        return `${label}: ${
            value.string
        }`;

    }

    if (
        value.kind === "number"
    ) {

        return `${label}: ${
            value.number
        }`;

    }

    if (
        value.kind === "bool"
    ) {

        return `${label}: ${
            value.bool
                ? "Yes"
                : "No"
        }`;

    }

    return "";

}


function formatDossierAttributeName(
    name
) {

    return name
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
            character =>
                character
                    .toUpperCase()
        );

}


function renderInterviews(
    interviews,
    statementRules
) {

    const section =
        document.getElementById(
            "interviews-section"
        );

    section.innerHTML = "";

    if (
        !interviews?.length
    ) {
        return;
    }

    const heading =
        document.createElement(
            "h2"
        );

    heading.className =
        "case-heading";

    heading.textContent =
        "WITNESS INTERVIEWS";

    section.appendChild(
        heading
    );

    const ruleText =
        formatStatementRule(
            statementRules
        );

    if (ruleText) {

        const rule =
            document.createElement(
                "p"
            );

        rule.className =
            "statement-rule";

        rule.textContent =
            ruleText;

        section.appendChild(
            rule
        );

    }

    interviews.forEach(
        interview => {

            const speaker =
                document.createElement(
                    "strong"
                );

            speaker.textContent =
                interview.speaker;

            const statement =
                document.createElement(
                    "p"
                );

            statement.textContent =
                `"${interview.statement}"`;

            section.appendChild(
                speaker
            );

            section.appendChild(
                statement
            );

        }
    );

}


function formatStatementRule(
    rules
) {

    if (
        rules?.culpritLies &&
        rules?.innocentsTellTruth
    ) {

        return (
            "The murderer is lying. " +
            "Everyone else is telling the truth."
        );

    }

    if (
        rules?.culpritLies
    ) {

        return (
            "The murderer is lying."
        );

    }

    if (
        rules?.innocentsTellTruth
    ) {

        return (
            "Every innocent suspect " +
            "is telling the truth."
        );

    }

    return "";

}


function renderClues(
    clues
) {

    const list =
        document.getElementById(
            "clues"
        );

    list.innerHTML = "";

    (
        clues ?? []
    ).forEach(
        clue => {

            const li =
                document.createElement(
                    "li"
                );

            li.textContent =
                clue;

            list.appendChild(
                li
            );

        }
    );

}