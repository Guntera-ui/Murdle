import {
    getCaseGenre,
    loadGenreRegistry
} from "./genres.js";


function getCaseId() {
    const parameters =
        new URLSearchParams(
            window.location.search
        );

    const caseId =
        Number(
            parameters.get("id")
        );

    if (
        !Number.isInteger(caseId) ||
        caseId <= 0
    ) {
        throw new Error(
            "The case URL contains an invalid case ID."
        );
    }

    return caseId;
}


function applyGenreToPage(genreId) {
    document.documentElement.dataset.genre =
        genreId;
}


function normalizeGenreURL(genreId) {
    const url =
        new URL(
            window.location.href
        );

    if (
        url.searchParams.get("genre") ===
        genreId
    ) {
        return;
    }

    url.searchParams.set(
        "genre",
        genreId
    );

    window.history.replaceState(
        {},
        "",
        url
    );
}


async function initCaseTheme() {
    const registry =
        await loadGenreRegistry();

    const caseId =
        getCaseId();

    const assignedGenre =
        getCaseGenre(
            registry,
            caseId
        );

    applyGenreToPage(
        assignedGenre
    );

    normalizeGenreURL(
        assignedGenre
    );
}


initCaseTheme().catch(error => {
    console.error(
        "Unable to apply case genre:",
        error
    );

    document.documentElement.dataset.genre =
        "classic";
});