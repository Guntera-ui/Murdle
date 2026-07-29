let boardFitAnimationFrame = 0;


function ensureBoardFitFrame() {

    const workspace =
        document.querySelector(
            ".board-workspace"
        );

    if (!workspace) {
        return null;
    }

    let frame =
        workspace.querySelector(
            ":scope > .board-fit-frame"
        );

    if (frame) {
        return {
            workspace,
            frame
        };
    }

    frame =
        document.createElement(
            "div"
        );

    frame.className =
        "board-fit-frame";

    while (
        workspace.firstChild
    ) {
        frame.appendChild(
            workspace.firstChild
        );
    }

    workspace.appendChild(
        frame
    );

    return {
        workspace,
        frame
    };

}


function resetBoardFit(
    workspace,
    frame
) {

    workspace.classList.remove(
        "board-compact",
        "board-fit-active"
    );

    workspace.style.removeProperty(
        "--board-fit-height"
    );

    frame.style.setProperty(
        "--board-fit-scale",
        "1"
    );

}


function measureBoardFit(
    workspace,
    frame
) {

    const mobileLayout =
        window.matchMedia(
            "(max-width: 900px)"
        ).matches;

    resetBoardFit(
        workspace,
        frame
    );

    if (mobileLayout) {
        return;
    }

    const workspaceBounds =
        workspace.getBoundingClientRect();

    const stickyTop =
        Math.max(
            workspaceBounds.top,
            8
        );

    const availableHeight =
        Math.max(
            360,
            window.innerHeight -
            stickyTop -
            10
        );

    const availableWidth =
        Math.max(
            320,
            workspace.clientWidth
        );

    const initiallyTooLarge =
        frame.scrollHeight >
            availableHeight ||
        frame.scrollWidth >
            availableWidth;

    if (initiallyTooLarge) {
        workspace.classList.add(
            "board-compact"
        );
    }

    requestAnimationFrame(() => {

        const naturalHeight =
            frame.scrollHeight;

        const naturalWidth =
            frame.scrollWidth;

        const requiredScale =
            Math.min(
                1,
                availableHeight /
                    naturalHeight,
                availableWidth /
                    naturalWidth
            );

        const finalScale =
            Math.max(
                0.72,
                requiredScale
            );

        frame.style.setProperty(
            "--board-fit-scale",
            finalScale.toFixed(3)
        );

        if (
            finalScale < 0.995
        ) {
            workspace.classList.add(
                "board-fit-active"
            );

            const verticalPadding =
                24;

            workspace.style.setProperty(
                "--board-fit-height",
                `${Math.ceil(
                    naturalHeight *
                    finalScale +
                    verticalPadding
                )}px`
            );
        }

    });

}


function updateBoardFit() {

    cancelAnimationFrame(
        boardFitAnimationFrame
    );

    boardFitAnimationFrame =
        requestAnimationFrame(
            () => {

                const elements =
                    ensureBoardFitFrame();

                if (!elements) {
                    return;
                }

                measureBoardFit(
                    elements.workspace,
                    elements.frame
                );

            }
        );

}


window.addEventListener(
    "resize",
    updateBoardFit,
    {
        passive: true
    }
);

if (
    document.fonts?.ready
) {
    document.fonts.ready.then(
        updateBoardFit
    );
}


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

    renderClues(
        puzzle.clues
    );

    renderCategories(
        categories
    );
    renderDossierFacts(
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
    else {
        console.error(
            "Timer failed: startCaseTimer() is unavailable."
        );
    }

    updateBoardFit();

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