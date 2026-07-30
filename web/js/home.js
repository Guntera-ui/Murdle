import {
    getEnabledGenres,
    loadGenreRegistry
} from "./genres.js";


function createArchiveChoice(
    genre
) {
    const link =
        document.createElement("a");

    link.className =
        `archive-choice archive-choice--${genre.id}`;

    link.href =
        `/archive.html?genre=${encodeURIComponent(
            genre.id
        )}`;

    const number =
        document.createElement("span");

    number.className =
        "archive-choice-number";

    number.textContent =
        genre.archiveNumber;

    const title =
        document.createElement("strong");

    title.textContent =
        genre.label;

    const description =
        document.createElement("span");

    description.className =
        "archive-choice-description";

    description.textContent =
        genre.description;

    const action =
        document.createElement("span");

    action.className =
        "archive-choice-action";

    action.textContent =
        "Enter Archive";

    link.append(
        number,
        title,
        description,
        action
    );

    return link;
}


async function init() {
    const container =
        document.getElementById(
            "archive-choices"
        );

    if (!container) {
        throw new Error(
            "Missing #archive-choices element."
        );
    }

    const registry =
        await loadGenreRegistry();

    const fragment =
        document.createDocumentFragment();

    for (
        const genre of
        getEnabledGenres(registry)
    ) {
        fragment.appendChild(
            createArchiveChoice(
                genre
            )
        );
    }

    container.replaceChildren(
        fragment
    );
}


init().catch(error => {
    console.error(error);

    const container =
        document.getElementById(
            "archive-choices"
        );

    if (container) {
        container.textContent =
            "The archives could not be loaded.";
    }
});
