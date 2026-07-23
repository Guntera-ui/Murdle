const puzzleOrder = [

    "case1",

    "case2",

    "case3"

];

let currentPuzzleIndex = 0;


function renderPuzzle(
    puzzle
) {

    document.getElementById(
        "case-file-number"
    ).textContent =
        `№${String(
            puzzle.caseNumber ?? puzzle.id
        ).padStart(3, "0")}`;

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

    renderInterviews(
        puzzle.interviews
    );

    const categories =
        createCategories(
            puzzle
        ).list;

    renderList(
        puzzle.clues,
        "clues"
    );

    renderCategories(
        categories
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

}


function loadPuzzle(
    id
) {

    fetchPuzzle(id)
        .then(
            renderPuzzle
        )
        .catch(
            console.error
        );

}


function loadNextPuzzle() {

    if (
        currentPuzzleIndex >=
        puzzleOrder.length - 1
    ) {

        alert(
            "You have completed every available case."
        );

        return;

    }

    currentPuzzleIndex++;

    loadPuzzle(
        puzzleOrder[
            currentPuzzleIndex
        ]
    );

}


loadPuzzle(
    puzzleOrder[
        currentPuzzleIndex
    ]
);