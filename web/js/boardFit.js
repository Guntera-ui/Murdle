let workspaceFitFrame = 0;
let workspaceFitObserver = null;
let workspaceMutationObserver = null;
let lastWorkspaceFit = "";

function getWorkspaceFitElements() {
    const workspace =
        document.querySelector(
            ".board-workspace"
        );

    if (!workspace) {
        return null;
    }

    workspace.classList.remove(
        "workspace-fit-scroll"
    );

    const oldFrame =
        workspace.querySelector(
            ":scope > .board-fit-frame"
        );

    if (oldFrame) {
        const oldBoard =
            oldFrame.querySelector(
                ".deduction-board-section"
            );

        const oldReference =
            oldFrame.querySelector(
                ".board-reference"
            );

        if (oldBoard) {
            workspace.insertBefore(
                oldBoard,
                oldFrame
            );
        }

        if (oldReference) {
            workspace.insertBefore(
                oldReference,
                oldFrame
            );
        }

        oldFrame.remove();
    }

    const board =
        workspace.querySelector(
            ".deduction-board-section"
        );

    const reference =
        workspace.querySelector(
            ".board-reference"
        );

    if (
        !board ||
        !reference
    ) {
        return null;
    }

    let boardShell =
        board.parentElement;

    if (
        !boardShell?.classList.contains(
            "workspace-fit-shell--board"
        )
    ) {
        boardShell =
            document.createElement(
                "div"
            );

        boardShell.className =
            "workspace-fit-shell " +
            "workspace-fit-shell--board";

        workspace.insertBefore(
            boardShell,
            board
        );

        boardShell.appendChild(
            board
        );
    }

    let referenceShell =
        reference.parentElement;

    if (
        !referenceShell?.classList.contains(
            "workspace-fit-shell--reference"
        )
    ) {
        referenceShell =
            document.createElement(
                "div"
            );

        referenceShell.className =
            "workspace-fit-shell " +
            "workspace-fit-shell--reference";

        workspace.insertBefore(
            referenceShell,
            boardShell.nextSibling
        );

        referenceShell.appendChild(
            reference
        );
    }

    return {
        workspace,
        board,
        reference,
        boardShell,
        referenceShell
    };
}

function clampWorkspaceScale(
    value,
    minimum,
    maximum
) {
    return Math.min(
        maximum,
        Math.max(
            minimum,
            value
        )
    );
}

function applyWorkspaceScale(
    shell,
    section,
    scale
) {
    section.style.setProperty(
        "--workspace-fit-scale",
        scale.toFixed(4)
    );

    shell.style.height =
        `${Math.ceil(
            section.scrollHeight *
            scale
        )}px`;
}

function resetWorkspaceFit(
    elements
) {
    const {
        workspace,
        board,
        reference,
        boardShell,
        referenceShell
    } = elements;

    workspace.classList.remove(
        "workspace-fit-scroll"
    );

    board.style.setProperty(
        "--workspace-fit-scale",
        "1"
    );

    reference.style.setProperty(
        "--workspace-fit-scale",
        "1"
    );

    boardShell.style.height =
        "auto";

    referenceShell.style.height =
        "auto";
}

function measureWorkspaceFit() {
    const elements =
        getWorkspaceFitElements();

    if (!elements) {
        return;
    }

    const {
        workspace,
        board,
        reference,
        boardShell,
        referenceShell
    } = elements;

    const stacked =
        window.matchMedia(
            "(max-width: 900px)"
        ).matches;

    if (stacked) {
        resetWorkspaceFit(
            elements
        );

        lastWorkspaceFit = "";
        return;
    }

    workspace.classList.remove(
        "workspace-fit-scroll"
    );

    const workspaceRect =
        workspace.getBoundingClientRect();

    const top =
        Math.max(
            workspaceRect.top,
            8
        );

    const availableHeight =
        Math.max(
            480,
            window.innerHeight -
            top -
            10
        );

    const availableWidth =
        Math.max(
            360,
            workspace.clientWidth
        );

    const boardWidth =
        Math.max(
            1,
            board.scrollWidth,
            board.offsetWidth
        );

    const referenceWidth =
        Math.max(
            1,
            reference.scrollWidth,
            reference.offsetWidth
        );

    const boardHeight =
        Math.max(
            1,
            board.scrollHeight
        );

    const referenceHeight =
        Math.max(
            1,
            reference.scrollHeight
        );

    const gap = 16;

    const minimumBoardScale =
        0.68;

    const minimumReferenceScale =
        0.82;

    let boardScale =
        clampWorkspaceScale(
            availableWidth /
            boardWidth,
            minimumBoardScale,
            1.08
        );

    let referenceScale =
        clampWorkspaceScale(
            availableWidth /
            referenceWidth,
            minimumReferenceScale,
            1
        );

    const initialHeight =
        boardHeight *
            boardScale +
        referenceHeight *
            referenceScale +
        gap;

    if (
        initialHeight >
        availableHeight
    ) {
        const commonScale =
            availableHeight /
            initialHeight;

        boardScale =
            Math.max(
                minimumBoardScale,
                boardScale *
                commonScale
            );

        referenceScale =
            Math.max(
                minimumReferenceScale,
                referenceScale *
                commonScale
            );
    }

    let fittedHeight =
        boardHeight *
            boardScale +
        referenceHeight *
            referenceScale +
        gap;

    if (
        fittedHeight >
        availableHeight
    ) {
        const remaining =
            fittedHeight -
            availableHeight;

        const boardCapacity =
            boardHeight *
            (
                boardScale -
                minimumBoardScale
            );

        const boardReduction =
            Math.min(
                remaining,
                Math.max(
                    0,
                    boardCapacity
                )
            );

        boardScale -=
            boardReduction /
            boardHeight;

        fittedHeight =
            boardHeight *
                boardScale +
            referenceHeight *
                referenceScale +
            gap;
    }

    const fitKey =
        [
            boardScale.toFixed(4),
            referenceScale.toFixed(4),
            Math.round(
                availableHeight
            ),
            Math.round(
                availableWidth
            ),
            Math.round(
                boardHeight
            ),
            Math.round(
                referenceHeight
            )
        ].join("|");

    if (
        fitKey ===
        lastWorkspaceFit
    ) {
        return;
    }

    lastWorkspaceFit =
        fitKey;

    applyWorkspaceScale(
        boardShell,
        board,
        boardScale
    );

    applyWorkspaceScale(
        referenceShell,
        reference,
        referenceScale
    );
}

function requestWorkspaceFit() {
    cancelAnimationFrame(
        workspaceFitFrame
    );

    workspaceFitFrame =
        requestAnimationFrame(
            measureWorkspaceFit
        );
}

function initialiseWorkspaceFit() {
    const elements =
        getWorkspaceFitElements();

    if (!elements) {
        return;
    }

    if (
        window.ResizeObserver &&
        !workspaceFitObserver
    ) {
        workspaceFitObserver =
            new ResizeObserver(
                requestWorkspaceFit
            );

        workspaceFitObserver.observe(
            elements.workspace
        );

        workspaceFitObserver.observe(
            elements.board
        );

        workspaceFitObserver.observe(
            elements.reference
        );
    }

    if (
        window.MutationObserver &&
        !workspaceMutationObserver
    ) {
        workspaceMutationObserver =
            new MutationObserver(
                requestWorkspaceFit
            );

        workspaceMutationObserver.observe(
            elements.workspace,
            {
                childList: true,
                subtree: true,
                characterData: true
            }
        );
    }

    requestWorkspaceFit();
}

window.addEventListener(
    "resize",
    requestWorkspaceFit,
    {
        passive: true
    }
);

window.addEventListener(
    "orientationchange",
    requestWorkspaceFit
);

window.addEventListener(
    "DOMContentLoaded",
    initialiseWorkspaceFit
);

if (
    document.fonts?.ready
) {
    document.fonts.ready.then(
        () => {
            initialiseWorkspaceFit();
            requestWorkspaceFit();
        }
    );
}