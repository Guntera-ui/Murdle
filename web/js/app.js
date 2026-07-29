let boardFitAnimationFrame = 0;


function ensureBoardFitFrame() {

    const workspace =
        document.querySelector(
            ".board-workspace"
        );

    if (!workspace) {
        return null;
    }

    const deductionSection =
        workspace.querySelector(
            ".deduction-board-section"
        );

    const referenceSection =
        workspace.querySelector(
            ".board-reference"
        );

    if (
        !deductionSection ||
        !referenceSection
    ) {
        return null;
    }

    let frame =
        workspace.querySelector(
            ":scope > .board-fit-frame"
        );

    if (!frame) {

        frame =
            document.createElement(
                "div"
            );

        frame.className =
            "board-fit-frame";

        workspace.insertBefore(
            frame,
            deductionSection
        );

    }

    if (
        deductionSection.parentElement !==
        frame
    ) {

        frame.appendChild(
            deductionSection
        );

    }

    if (
        referenceSection.parentElement ===
        frame
    ) {

        frame.insertAdjacentElement(
            "afterend",
            referenceSection
        );

    }

    return {
        workspace,
        frame,
        deductionSection,
        referenceSection
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

    frame.style.setProperty(
        "--board-fit-scale",
        "1"
    );

    frame.style.removeProperty(
        "--board-fit-height"
    );

}


function measureBoardFit(
    workspace,
    frame,
    deductionSection,
    referenceSection
) {

    const stackedLayout =
        window.matchMedia(
            "(max-width: 900px)"
        ).matches;

    resetBoardFit(
        workspace,
        frame
    );

    if (stackedLayout) {
        return;
    }

    const workspaceBounds =
        workspace.getBoundingClientRect();

    const stickyTop =
        Math.max(
            workspaceBounds.top,
            8
        );

    const availableWorkspaceHeight =
        Math.max(
            520,
            window.innerHeight -
            stickyTop -
            10
        );

    const referenceHeight =
        referenceSection.offsetHeight;

    const availableBoardHeight =
        Math.max(
            300,
            availableWorkspaceHeight -
            referenceHeight -
            18
        );

    const availableBoardWidth =
        Math.max(
            360,
            frame.clientWidth
        );

    const naturalHeightBeforeCompact =
        deductionSection.scrollHeight;

    const naturalWidthBeforeCompact =
        deductionSection.scrollWidth;

    if (
        naturalHeightBeforeCompact >
            availableBoardHeight ||
        naturalWidthBeforeCompact >
            availableBoardWidth
    ) {

        workspace.classList.add(
            "board-compact"
        );

    }

    requestAnimationFrame(() => {

        const naturalHeight =
            deductionSection.scrollHeight;

        const naturalWidth =
            deductionSection.scrollWidth;

        const requiredScale =
            Math.min(
                1,
                availableBoardHeight /
                    naturalHeight,
                availableBoardWidth /
                    naturalWidth
            );

        const finalScale =
            Math.max(
                0.76,
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

            frame.style.setProperty(
                "--board-fit-height",
                `${Math.ceil(
                    naturalHeight *
                    finalScale
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
                    elements.frame,
                    elements.deductionSection,
                    elements.referenceSection
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
    window.ResizeObserver
) {

    const boardResizeObserver =
        new ResizeObserver(
            updateBoardFit
        );

    window.addEventListener(
        "DOMContentLoaded",
        () => {

            const workspace =
                document.querySelector(
                    ".board-workspace"
                );

            if (workspace) {

                boardResizeObserver.observe(
                    workspace
                );

            }

        }
    );

}


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

    const categories =
        createCategories(
            puzzle
        ).list;

    renderDossierFacts(
        puzzle,
        categories
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