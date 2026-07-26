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

    card.dataset.difficulty =
        caseInfo.difficulty.toLowerCase();

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

        <div class="case-divider"></div>

        <section class="case-details">

            <h4 class="section-title">
                Case Details
            </h4>

            <div class="detail-row">
                <span>Suspects</span>
                <span>${caseInfo.suspects}</span>
            </div>

            <div class="detail-row">
                <span>Weapons</span>
                <span>${caseInfo.weapons}</span>
            </div>

            <div class="detail-row">
                <span>Locations</span>
                <span>${caseInfo.locations}</span>
            </div>

            <div class="detail-row">
                <span>Clues</span>
                <span>${caseInfo.clues}</span>
            </div>

        </section>

        <div class="case-divider"></div>

        <section class="case-summary">

            <h4 class="section-title">
                Case Summary
            </h4>

            <p class="case-description">
                ${caseInfo.description}
            </p>

        </section>

        <div class="case-footer">

            <button
                class="blob-btn investigate-button"
                data-id="${caseInfo.id}">

                Begin Investigation

                <span class="blob-btn__inner">

                    <span class="blob-btn__blobs">

                        <span class="blob-btn__blob"></span>
                        <span class="blob-btn__blob"></span>
                        <span class="blob-btn__blob"></span>
                        <span class="blob-btn__blob"></span>

                    </span>

                </span>

            </button>

        </div>
    `;

    card
        .querySelector(".investigate-button")
        .addEventListener("click", () => {
            window.location.href =
                `case.html?id=${caseInfo.id}`;
        });

    return card;
}
async function init() {

    const caseList =
        document.getElementById("case-list");

    const cases =
        await loadCases();

    for (const caseInfo of cases) {

        caseList.appendChild(
            createCaseCard(caseInfo)
        );

    }

}

init();