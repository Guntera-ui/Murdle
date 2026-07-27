function renderList(items, elementId) {

    const list =
        document.getElementById(elementId);

    list.innerHTML = "";

    items.forEach(item => {

        const li =
            document.createElement("li");

        const img =
            document.createElement("img");

        img.src =
            item.icon;

        img.alt =
            item.name;

        img.className =
            "list-icon";

        const span =
            document.createElement("span");

        span.textContent =
            item.name;

        li.appendChild(img);
        li.appendChild(span);

        list.appendChild(li);

    });

}
function renderCategories(categories) {

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
function renderVictim(victim) {

    const section =
        document.getElementById(
            "victim-section"
        );

    section.innerHTML = "";

    if (!victim) {
        return;
    }

    section.innerHTML = `
        <h2 class="case-heading">VICTIM</h2>

        <strong>${victim.name}</strong><br>

        ${victim.occupation}<br>

        Cause of death:
        ${victim.causeOfDeath}
    `;
}

function renderIncident(report) {

    const section =
        document.getElementById(
            "incident-section"
        );

    section.innerHTML = "";

    if (!report) {
        return;
    }

    section.innerHTML = `
        <h2 class="case-heading">
            INCIDENT REPORT
        </h2>

        <p>${report}</p>
    `;
}

function renderInterviews(interviews) {

    const section =
        document.getElementById(
            "interviews-section"
        );

    section.innerHTML = "";

    if (!interviews?.length) {
        return;
    }

    const heading =
        document.createElement("h2");

    heading.className =
        "case-heading";

    heading.textContent =
        "WITNESS INTERVIEWS";

    section.appendChild(
        heading
    );

    interviews.forEach(interview => {

        const speaker =
            document.createElement("strong");

        speaker.textContent =
            interview.speaker;

        const statement =
            document.createElement("p");

        statement.textContent =
            `"${interview.statement}"`;

        section.appendChild(
            speaker
        );

        section.appendChild(
            statement
        );

    });

}


function renderClues(clues) {

    const list =
        document.getElementById("clues");

    list.innerHTML = "";

    clues.forEach((clue, index) => {

        const li =
            document.createElement("li");

        li.textContent =
            clue;

        list.appendChild(li);

    });

}