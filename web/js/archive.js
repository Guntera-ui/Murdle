import {
    getCaseGenre,
    getGenre,
    isValidGenre,
    loadGenreRegistry
} from "./genres.js?v=5";


async function loadCases() {
    const response =
        await fetch("/api/cases");

    if (!response.ok) {
        throw new Error(
            `Failed to load cases: ${response.status}`
        );
    }

    return response.json();
}


function getSelectedGenre(registry) {
    const parameters =
        new URLSearchParams(
            window.location.search
        );

    const requestedGenre =
        parameters.get("genre");

    if (
        isValidGenre(
            registry,
            requestedGenre
        )
    ) {
        return requestedGenre;
    }

    return registry.defaultGenre;
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


function applyArchiveGenre(
    registry,
    genreId
) {
    const genre =
        getGenre(
            registry,
            genreId
        );

    document.documentElement.dataset.genre =
        genreId;

    document.title =
        `${genre.title} — Kako Cypher`;

    const heroTitle =
        document.querySelector(
            ".hero-title"
        );

    const heroSubtitle =
        document.querySelector(
            ".hero-subtitle"
        );

    if (heroTitle) {
        heroTitle.textContent =
            genre.title;
    }

    if (heroSubtitle) {
        heroSubtitle.textContent =
            genre.subtitle;
    }
}


function escapeHTML(value) {
    return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}


function createCaseCard(
    registry,
    caseInfo,
    genreId
) {
    const genre =
        getGenre(
            registry,
            genreId
        );

    const difficulty =
        String(
            caseInfo.difficulty ??
            "Unknown"
        );

    const card =
        document.createElement(
            "article"
        );

    card.className =
        "case-card";

    card.dataset.difficulty =
        difficulty.toLowerCase();

    card.dataset.genre =
        genre.cardStyle;

    card.innerHTML = `
        <div class="case-header">
            <span class="case-number">
                CASE FILE ${escapeHTML(
                    caseInfo.caseNumber
                )}
            </span>

            <span class="case-difficulty">
                ${escapeHTML(difficulty)}
            </span>
        </div>

        <h3 class="case-title">
            ${escapeHTML(caseInfo.title)}
        </h3>

        <div
            class="case-divider"
            aria-hidden="true">
        </div>

        <section class="case-details">
            <h4 class="section-title">
                Case Details
            </h4>

            <div class="detail-row">
                <span>Suspects</span>
                <span>${escapeHTML(
                    caseInfo.suspects
                )}</span>
            </div>

            <div class="detail-row">
                <span>Weapons</span>
                <span>${escapeHTML(
                    caseInfo.weapons
                )}</span>
            </div>

            <div class="detail-row">
                <span>Locations</span>
                <span>${escapeHTML(
                    caseInfo.locations
                )}</span>
            </div>

            <div class="detail-row">
                <span>Clues</span>
                <span>${escapeHTML(
                    caseInfo.clues
                )}</span>
            </div>
        </section>

        <div
            class="case-divider"
            aria-hidden="true">
        </div>

        <section class="case-summary">
            <h4 class="section-title">
                Case Summary
            </h4>

            <p class="case-description">
                ${escapeHTML(
                    caseInfo.description
                )}
            </p>
        </section>

        <div class="case-footer">
            <button
                class="
                    blob-btn
                    investigate-button
                "
                type="button"
            >
                Begin Investigation

                <span
                    class="blob-btn__inner"
                    aria-hidden="true"
                >
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
        .querySelector(
            ".investigate-button"
        )
        .addEventListener(
            "click",
            () => {
                const parameters =
                    new URLSearchParams({
                        id: String(
                            caseInfo.id
                        ),
                        genre: genreId
                    });

                window.location.href =
                    `/case.html?${parameters}`;
            }
        );

    return card;
}


function renderEmptyArchive(caseList) {
    const message =
        document.createElement(
            "section"
        );

    message.className =
        "empty-archive-message";

    message.innerHTML = `
        <h2>No cases filed yet</h2>

        <p>
            This archive does not currently
            contain any investigations.
        </p>
    `;

    caseList.appendChild(
        message
    );
}


function renderCases(
    registry,
    caseList,
    cases,
    genreId
) {
    caseList.replaceChildren();

    const matchingCases =
        cases.filter(
            caseInfo =>
                getCaseGenre(
                    registry,
                    caseInfo
                ) === genreId
        );

    if (
        matchingCases.length === 0
    ) {
        renderEmptyArchive(
            caseList
        );

        return;
    }

    const fragment =
        document.createDocumentFragment();

    for (
        const caseInfo of
        matchingCases
    ) {
        fragment.appendChild(
            createCaseCard(
                registry,
                caseInfo,
                genreId
            )
        );
    }

    caseList.appendChild(
        fragment
    );
}


async function init() {
    const caseList =
        document.getElementById(
            "case-list"
        );

    if (!caseList) {
        throw new Error(
            "Missing #case-list element."
        );
    }

    const [
        registry,
        cases
    ] = await Promise.all([
        loadGenreRegistry(),
        loadCases()
    ]);

    const genreId =
        getSelectedGenre(
            registry
        );

    normalizeGenreURL(
        genreId
    );

    applyArchiveGenre(
        registry,
        genreId
    );

    renderCases(
        registry,
        caseList,
        cases,
        genreId
    );
}


init().catch(error => {
    console.error(error);

    const caseList =
        document.getElementById(
            "case-list"
        );

    if (caseList) {
        caseList.textContent =
            "The case archive could not be loaded.";
    }
});