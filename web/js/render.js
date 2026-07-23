function renderList(items, elementId) {

    const list =
        document.getElementById(elementId);

    list.innerHTML = "";

    items.forEach(item => {

        const li =
            document.createElement("li");

        li.textContent = item;

        list.appendChild(li);
    });
}
function renderCategories(categories) {

    const container =
        document.getElementById(
            "categories"
        );

    container.innerHTML = "";

    categories.forEach(category => {

        const heading =
            document.createElement("h2");

        heading.className =
            "case-heading";

        heading.textContent =
            category.label;

        const list =
            document.createElement("ul");

        list.id =
            category.id;

        container.appendChild(
            heading
        );

        container.appendChild(
            list
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