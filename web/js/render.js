function renderList(
    items,
    elementId
) {

    const list =
        document.getElementById(
            elementId
        );

    list.replaceChildren();

    items.forEach(item => {

        const li =
            document.createElement(
                "li"
            );

        const img =
            document.createElement(
                "img"
            );

        img.src =
            item.icon;

        img.alt =
            item.name;

        img.className =
            "list-icon";

        const span =
            document.createElement(
                "span"
            );

        span.textContent =
            item.name;

        li.appendChild(
            img
        );

        li.appendChild(
            span
        );

        list.appendChild(
            li
        );

    });

}


function renderCategories(
    categories
) {

    const container =
        document.getElementById(
            "categories"
        );

    container.replaceChildren();

    categories.forEach(category => {

        const group =
            document.createElement(
                "section"
            );

        group.className =
            "category-group";

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

        group.appendChild(
            heading
        );

        group.appendChild(
            list
        );

        container.appendChild(
            group
        );

        renderList(
            category.items,
            category.id
        );

    });

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

    const interviewsSection =
        document.getElementById(
            "interviews-section"
        );

    if (!interviewsSection) {
        return;
    }

    let section =
        document.getElementById(
            "dossier-facts-section"
        );

    if (!section) {

        section =
            document.createElement(
                "section"
            );

        section.id =
            "dossier-facts-section";

    }

    /*
     * Always place the dossier directly
     * after the interviews section.
     */
    interviewsSection.insertAdjacentElement(
        "afterend",
        section
    );

    section.replaceChildren();

    const categories =
        createCategories(
            puzzle
        ).list;

    const groups = [
        {
            title: "Suspect Details",
            categoryId: "suspects",
            values: puzzle.suspects,
            details:
                puzzle.suspectDetails
        },
        {
            title: "Weapon Details",
            categoryId: "weapons",
            values: puzzle.weapons,
            details:
                puzzle.weaponDetails
        },
        {
            title: "Location Details",
            categoryId: "locations",
            values: puzzle.locations,
            details:
                puzzle.locationDetails
        },
        {
            title: "Motive Details",
            categoryId: "motives",
            values: puzzle.motives,
            details:
                puzzle.motiveDetails
        }
    ];

    const populatedGroups =
        groups.filter(
            group =>
                group.values?.some(
                    value =>
                        Object.keys(
                            group.details?.[
                                value
                            ]?.attributes ?? {}
                        ).length > 0
                )
        );

    if (
        populatedGroups.length === 0
    ) {

        section.remove();
        return;

    }

    const heading =
        document.createElement(
            "h2"
        );

    heading.className =
        "case-heading";

    heading.textContent =
        "DOSSIER FACTS";

    section.appendChild(
        heading
    );

    populatedGroups.forEach(
        group => {

            const category =
                categories.find(
                    item =>
                        item.id ===
                        group.categoryId
                );

            const block =
                document.createElement(
                    "section"
                );

            block.className =
                "dossier-facts-group";

            const groupTitle =
                document.createElement(
                    "h3"
                );

            groupTitle.className =
                "dossier-facts-group-title";

            groupTitle.textContent =
                group.title;

            block.appendChild(
                groupTitle
            );

            const list =
                document.createElement(
                    "div"
                );

            list.className =
                "dossier-facts-list";

            group.values?.forEach(
                entityName => {

                    const attributes =
                        group.details?.[
                            entityName
                        ]?.attributes ?? {};

                    const formatted =
                        formatDossierAttributes(
                            attributes
                        );

                    if (
                        formatted.length === 0
                    ) {
                        return;
                    }

                    const categoryItem =
                        category?.items.find(
                            item =>
                                item.name ===
                                entityName
                        );

                    const row =
                        document.createElement(
                            "article"
                        );

                    row.className =
                        "dossier-fact-row";

                    const identity =
                        document.createElement(
                            "div"
                        );

                    identity.className =
                        "dossier-fact-identity";

                    if (
                        categoryItem?.icon
                    ) {

                        const iconWrapper =
                            document.createElement(
                                "div"
                            );

                        iconWrapper.className =
                            "dossier-fact-icon-wrapper";

                        iconWrapper.tabIndex = 0;

                        iconWrapper.setAttribute(
                            "aria-label",
                            entityName
                        );

                        const icon =
                            document.createElement(
                                "img"
                            );

                        icon.src =
                            categoryItem.icon;

                        icon.alt = "";

                        icon.className =
                            "dossier-fact-icon";

                        const tooltip =
                            document.createElement(
                                "span"
                            );

                        tooltip.className =
                            "dossier-fact-tooltip";

                        tooltip.textContent =
                            entityName;

                        tooltip.setAttribute(
                            "role",
                            "tooltip"
                        );

                        iconWrapper.append(
                            icon,
                            tooltip
                        );

                        identity.appendChild(
                            iconWrapper
                        );

                    } else {

                        const fallbackName =
                            document.createElement(
                                "span"
                            );

                        fallbackName.className =
                            "dossier-fact-name";

                        fallbackName.textContent =
                            entityName;

                        identity.appendChild(
                            fallbackName
                        );

                    }

                    const attributesList =
                        document.createElement(
                            "div"
                        );

                    attributesList.className =
                        "dossier-fact-attributes";

                    formatted.forEach(
                        attribute => {

                            const line =
                                document.createElement(
                                    "span"
                                );

                            line.textContent =
                                attribute;

                            attributesList.appendChild(
                                line
                            );

                        }
                    );

                    row.append(
                        identity,
                        attributesList
                    );

                    list.appendChild(
                        row
                    );

                }
            );

            block.appendChild(
                list
            );

            section.appendChild(
                block
            );

        }
    );

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