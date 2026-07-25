async function loadCases() {
    const response = await fetch("/api/cases");

    if (!response.ok) {
        throw new Error("Failed to load cases.");
    }

    return await response.json();
}

function createCaseCard(caseInfo) {
    const card = document.createElement("article");
    card.className = "case-card";

    card.innerHTML = `
        <div class="case-header">
            <span class="case-number">
                CASE FILE ${caseInfo.caseNumber}
            </span>

            <span class="case-difficulty">
                ${caseInfo.difficulty}
            </span>
        </div>

        <h3 class="case-title">
            ${caseInfo.title}
        </h3>

        <p class="case-description">
            ${caseInfo.description}
        </p>

        <div class="case-footer">
            <button
                class="investigate-button"
                data-id="${caseInfo.id}">
                Begin Investigation
            </button>
        </div>
    `;

    card
        .querySelector(".investigate-button")
        .addEventListener("click", () => {
            window.location.href = `case.html?id=${caseInfo.id}`;
        });

    return card;
}

async function init() {
    const caseList = document.getElementById("case-list");

    const cases = await loadCases();

    for (const caseInfo of cases) {
        caseList.appendChild(createCaseCard(caseInfo));
    }
}

init();