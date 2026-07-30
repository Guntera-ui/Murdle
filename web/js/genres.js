const GENRE_CONFIG_URL =
    "/config/genres.json";

let registryPromise = null;


function assertObject(value, name) {
    if (
        value === null ||
        typeof value !== "object" ||
        Array.isArray(value)
    ) {
        throw new TypeError(
            `${name} must be an object.`
        );
    }
}


function validateRegistry(registry) {
    assertObject(
        registry,
        "Genre registry"
    );

    assertObject(
        registry.genres,
        "Genre registry.genres"
    );

    assertObject(
        registry.caseGenres,
        "Genre registry.caseGenres"
    );

    if (
        typeof registry.defaultGenre !==
        "string"
    ) {
        throw new TypeError(
            "defaultGenre must be a string."
        );
    }

    if (
        !Object.hasOwn(
            registry.genres,
            registry.defaultGenre
        )
    ) {
        throw new Error(
            "defaultGenre must reference an existing genre."
        );
    }

    for (
        const [genreId, genre] of
        Object.entries(registry.genres)
    ) {
        assertObject(
            genre,
            `Genre "${genreId}"`
        );

        for (
            const field of
            [
                "label",
                "title",
                "subtitle",
                "description",
                "cardStyle"
            ]
        ) {
            if (
                typeof genre[field] !==
                "string"
            ) {
                throw new TypeError(
                    `Genre "${genreId}" is missing "${field}".`
                );
            }
        }
    }

    for (
        const [caseId, genreId] of
        Object.entries(
            registry.caseGenres
        )
    ) {
        if (
            !Object.hasOwn(
                registry.genres,
                genreId
            )
        ) {
            throw new Error(
                `Case ${caseId} references unknown genre "${genreId}".`
            );
        }
    }

    return registry;
}


export function loadGenreRegistry() {
    if (!registryPromise) {
        registryPromise =
            fetch(
                GENRE_CONFIG_URL,
                {
                    cache: "no-store"
                }
            )
                .then(response => {
                    if (!response.ok) {
                        throw new Error(
                            `Failed to load genre registry: ${response.status}`
                        );
                    }

                    return response.json();
                })
                .then(validateRegistry)
                .catch(error => {
                    registryPromise = null;
                    throw error;
                });
    }

    return registryPromise;
}


export function isValidGenre(
    registry,
    genreId
) {
    return (
        typeof genreId === "string" &&
        Object.hasOwn(
            registry.genres,
            genreId
        ) &&
        registry.genres[genreId]
            .enabled !== false
    );
}


export function getGenre(
    registry,
    genreId
) {
    if (
        isValidGenre(
            registry,
            genreId
        )
    ) {
        return registry.genres[
            genreId
        ];
    }

    return registry.genres[
        registry.defaultGenre
    ];
}


export function getCaseGenre(
    registry,
    caseInfoOrId
) {
    const caseId =
        typeof caseInfoOrId ===
        "object"
            ? Number(caseInfoOrId.id)
            : Number(caseInfoOrId);

    const assignedGenre =
        registry.caseGenres[
            String(caseId)
        ];

    if (
        isValidGenre(
            registry,
            assignedGenre
        )
    ) {
        return assignedGenre;
    }

    return registry.defaultGenre;
}


export function getEnabledGenres(
    registry
) {
    return Object.entries(
        registry.genres
    )
        .filter(
            ([, genre]) =>
                genre.enabled !== false
        )
        .sort(
            (
                [idA, genreA],
                [idB, genreB]
            ) => {
                const orderA =
                    Number(
                        genreA.order ??
                        Number.MAX_SAFE_INTEGER
                    );

                const orderB =
                    Number(
                        genreB.order ??
                        Number.MAX_SAFE_INTEGER
                    );

                return (
                    orderA - orderB ||
                    idA.localeCompare(idB)
                );
            }
        )
        .map(
            ([id, genre]) => ({
                id,
                ...genre
            })
        );
}