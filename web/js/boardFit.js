/*
 * Kako Cypher board workspace fitter
 *
 * One workspace, one scale, no internal scroll containers.
 * CSS handles width responsively. JavaScript only applies a uniform scale
 * when the complete sticky workspace cannot fit the usable desktop height.
 */

const BOARD_FIT_BREAKPOINT = "(max-width: 64rem)";
const BOARD_FIT_BOTTOM_GAP = 10;
const BOARD_FIT_EPSILON = 0.002;

let boardFitFrame = 0;
let boardFitResizeObserver = null;
let boardFitMutationObserver = null;
let boardFitElements = null;
let boardFitKey = "";

function unwrapElement(element) {
    const parent = element.parentNode;

    if (!parent) {
        return;
    }

    while (element.firstChild) {
        parent.insertBefore(element.firstChild, element);
    }

    element.remove();
}

function removeLegacyFitStructure(workspace) {
    workspace
        .querySelectorAll(
            ":scope > .workspace-fit-shell, " +
            ":scope > .board-fit-frame"
        )
        .forEach(unwrapElement);

    workspace.classList.remove(
        "board-compact",
        "board-fit-active",
        "workspace-fit-scroll"
    );
}

function ensureBoardFitStructure() {
    const workspace = document.querySelector(".board-workspace");

    if (!workspace) {
        return null;
    }

    let shell = workspace.querySelector(":scope > .board-fit-shell");
    let content = shell?.querySelector(":scope > .board-fit-content");

    if (!shell || !content) {
        removeLegacyFitStructure(workspace);

        const board = workspace.querySelector(".deduction-board-section");
        const reference = workspace.querySelector(".board-reference");

        if (!board || !reference) {
            return null;
        }

        shell = document.createElement("div");
        shell.className = "board-fit-shell";

        content = document.createElement("div");
        content.className = "board-fit-content";

        workspace.insertBefore(shell, board);
        shell.appendChild(content);
        content.appendChild(board);
        content.appendChild(reference);
    }

    const board = content.querySelector(".deduction-board-section");
    const reference = content.querySelector(".board-reference");
    const masterBoard = content.querySelector(".master-board");

    if (!board || !reference) {
        return null;
    }

    return {
        workspace,
        shell,
        content,
        board,
        reference,
        masterBoard
    };
}

function detectCategoryCount(elements) {
    const topLabelCount =
        elements.masterBoard?.querySelectorAll(
            ":scope > .board-row:first-child > .board-label.top"
        ).length ?? 0;

    const categoryCount = topLabelCount > 0
        ? topLabelCount + 1
        : 3;

    elements.content.dataset.categoryCount = String(categoryCount);
}

function getViewportHeight() {
    return window.visualViewport?.height ?? window.innerHeight;
}

function getStickyTop(workspace) {
    const top = Number.parseFloat(
        window.getComputedStyle(workspace).top
    );

    return Number.isFinite(top) ? top : 0;
}

function resetBoardFit(elements) {
    elements.content.style.setProperty("--board-fit-scale", "1");
    elements.shell.style.height = "auto";
    elements.workspace.dataset.fitScale = "1";
}

function floorScale(value) {
    if (value >= 1) {
        return 1;
    }

    return Math.max(
        0.01,
        Math.floor((value - BOARD_FIT_EPSILON) * 1000) / 1000
    );
}

function measureBoardFit() {
    const elements = ensureBoardFitStructure();

    if (!elements) {
        return;
    }

    boardFitElements = elements;
    detectCategoryCount(elements);
    const availableWidth = Math.max(1, elements.shell.clientWidth);
    const naturalWidth = Math.max(1, elements.content.scrollWidth);
    const naturalHeight = Math.max(1, elements.content.scrollHeight);

    const widthScale = availableWidth / naturalWidth;
    const stacked = window.matchMedia(BOARD_FIT_BREAKPOINT).matches;

    let scale = Math.min(1, widthScale);
    let availableHeight = naturalHeight;

    if (!stacked) {
        const workspaceRect = elements.workspace.getBoundingClientRect();
        const stickyTop = getStickyTop(elements.workspace);
        const visibleTop = Math.max(stickyTop, workspaceRect.top);

        availableHeight = Math.max(
            1,
            getViewportHeight() - visibleTop - BOARD_FIT_BOTTOM_GAP
        );

        scale = Math.min(scale, availableHeight / naturalHeight);
    }

    scale = floorScale(scale);

    const fitKey = [
        stacked ? "stacked" : "sticky",
        elements.content.dataset.categoryCount,
        availableWidth.toFixed(1),
        availableHeight.toFixed(1),
        naturalWidth.toFixed(1),
        naturalHeight.toFixed(1),
        scale.toFixed(3)
    ].join("|");

    if (fitKey === boardFitKey) {
        return;
    }

    boardFitKey = fitKey;

    elements.content.style.setProperty(
        "--board-fit-scale",
        scale.toFixed(3)
    );

    elements.shell.style.height =
        `${Math.ceil(naturalHeight * scale)}px`;

    elements.workspace.dataset.fitScale = scale.toFixed(3);
}

function requestBoardFit() {
    window.cancelAnimationFrame(boardFitFrame);
    boardFitFrame = window.requestAnimationFrame(measureBoardFit);
}

function connectBoardFitObservers(elements) {
    boardFitResizeObserver?.disconnect();
    boardFitMutationObserver?.disconnect();

    if ("ResizeObserver" in window) {
        boardFitResizeObserver = new ResizeObserver(requestBoardFit);
        boardFitResizeObserver.observe(elements.workspace);
        boardFitResizeObserver.observe(elements.content);
    }

    if ("MutationObserver" in window) {
        boardFitMutationObserver = new MutationObserver(requestBoardFit);
        boardFitMutationObserver.observe(elements.content, {
            childList: true,
            subtree: true,
            characterData: true
        });
    }
}

function initialiseBoardFit() {
    const elements = ensureBoardFitStructure();

    if (!elements) {
        return;
    }

    boardFitElements = elements;
    connectBoardFitObservers(elements);

    elements.workspace.addEventListener("load", requestBoardFit, true);
    requestBoardFit();
}

window.addEventListener("resize", requestBoardFit, { passive: true });
window.addEventListener("orientationchange", requestBoardFit);
window.visualViewport?.addEventListener("resize", requestBoardFit, {
    passive: true
});

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initialiseBoardFit, {
        once: true
    });
} else {
    initialiseBoardFit();
}

document.fonts?.ready.then(requestBoardFit);
