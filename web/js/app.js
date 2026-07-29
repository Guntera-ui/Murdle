function renderPuzzle(
    puzzle
) {

    document.getElementById(
        "case-file-number"
    ).textContent =
        `№${String(
            puzzle.caseNumber ??
            puzzle.id
        ).padStart(
            3,
            "0"
        )}`;

    document.getElementById(
        "case-title"
    ).textContent =
        puzzle.title;

    document.getElementById(
        "case-victim"
    ).innerHTML =
        `
        <strong>Victim</strong><br>
        ${puzzle.victim?.name ?? "Unknown"}
        `;

    document.getElementById(
        "case-status-line"
    ).innerHTML =
        `
        <strong>Status</strong><br>
        ${puzzle.status ?? "OPEN"}
        `;

    renderIncident(
        puzzle.incidentReport
    );

    const categories =
        createCategories(
            puzzle
        ).list;

    renderDossierFacts(
        puzzle
    );

    renderClues(
        puzzle.clues
    );

    renderInterviews(
        puzzle.interviews,
        puzzle.statementRules
    );

    renderCategories(
        categories,
        puzzle
    );

    const board =
        createBoard(
            puzzle
        );

    renderMasterGrid(
        puzzle,
        board
    );

    renderAccusation(
        puzzle,
        loadNextPuzzle
    );

    if (
        typeof startCaseTimer ===
        "function"
    ) {
        startCaseTimer();
    }

    if (
        typeof initialiseWorkspaceFit ===
        "function"
    ) {
        initialiseWorkspaceFit();
    }

    if (
        typeof requestWorkspaceFit ===
        "function"
    ) {
        requestWorkspaceFit();
    }

}


function loadPuzzle(
    id
) {

    fetchPuzzle(
        id
    )
        .then(
            renderPuzzle
        )
        .catch(
            console.error
        );

}


function loadNextPuzzle() {

    const nextCaseId =
        getCurrentCaseId() + 1;

    fetchPuzzle(
        `case${nextCaseId}`
    )
        .then(() => {

            window.location.href =
                `case.html?id=${nextCaseId}`;

        })
        .catch(() => {

            window.location.href =
                "index.html";

        });

}


loadPuzzle(
    `case${getCurrentCaseId()}`
);
