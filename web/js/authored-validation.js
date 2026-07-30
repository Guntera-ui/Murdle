const categoryDefinitions = {
    suspect: {
        label: "suspect",
        source: "suspects"
    },
    weapon: {
        label: "weapon",
        source: "weapons"
    },
    location: {
        label: "location",
        source: "locations"
    },
    motive: {
        label: "motive",
        source: "motives"
    }
};

const factShapes = {
    suspect_weapon: {
        label: "A suspect had a weapon",
        leftCategory: "suspect",
        rightCategory: "weapon",
        positive: "had",
        negative: "did not have"
    },
    suspect_location: {
        label: "A suspect was at a location",
        leftCategory: "suspect",
        rightCategory: "location",
        positive: "was at",
        negative: "was not at"
    },
    weapon_location: {
        label: "A weapon was found at a location",
        leftCategory: "weapon",
        rightCategory: "location",
        positive: "was found at",
        negative: "was not found at"
    },
    suspect_motive: {
        label: "A suspect had a motive",
        leftCategory: "suspect",
        rightCategory: "motive",
        positive: "had the motive",
        negative: "did not have the motive"
    }
};

const referenceModes = {
    name: "By name",
    detail: "By detail",
    ranking: "By ranking"
};

const validReportStatuses = new Set([
    "unique",
    "ambiguous",
    "contradictory",
    "unique_wrong_solution"
]);

let initialized = false;

export function initAuthoredValidation(api) {
    if (initialized) {
        return;
    }

    initialized = true;

    const {
        form,
        buildPuzzle,
        setStatus,
        downloadJSON,
        copyText,
        caseFilename,
        getEntityDraft,
        updateEditorOverview
    } = api;

    const validateButton =
        document.getElementById("validate-case");

    const resultPanel =
        document.getElementById("validation-result");

    const jsonDialog =
        document.getElementById("json-dialog");

    const jsonOutput =
        document.getElementById("json-output");

    const stateLabel =
        document.getElementById("validation-state-label");

    const resultTitle =
        document.getElementById("validation-result-title");

    const resultCount =
        document.getElementById("validation-result-count");

    const resultMessage =
        document.getElementById("validation-result-message");

    const candidateContainer =
        document.getElementById("validation-candidates");

    let activeJSONTab = "case";
    let visibleJSON = {};
    let visibleFilename = "case.json";

    let selectorRefreshTimer = 0;
    let overviewFrame = 0;
    let validationRequestController = null;

    const pendingRefreshCategories = new Set();
    const selectorCache = new Map();
    const entityCache = new Map();

    function assertRequiredElements() {
        const required = {
            validateButton,
            resultPanel,
            jsonDialog,
            jsonOutput,
            stateLabel,
            resultTitle,
            resultCount,
            resultMessage,
            candidateContainer
        };

        for (const [name, value] of Object.entries(required)) {
            if (!value) {
                throw new Error(
                    `Authored validation could not start: missing ${name}.`
                );
            }
        }
    }

    assertRequiredElements();

    function invalidateSelectorCache(category = null) {
        if (!category) {
            selectorCache.clear();
            entityCache.clear();
            return;
        }

        entityCache.delete(category);

        for (const key of selectorCache.keys()) {
            if (key.startsWith(`${category}:`)) {
                selectorCache.delete(key);
            }
        }
    }

    function entitiesFor(category) {
        if (!categoryDefinitions[category]) {
            return [];
        }

        if (!entityCache.has(category)) {
            const source =
                categoryDefinitions[category].source;

            const entities =
                getEntityDraft(source);

            entityCache.set(
                category,
                Array.isArray(entities)
                    ? entities
                    : []
            );
        }

        return entityCache.get(category);
    }

    function displayAttribute(attribute) {
        if (!attribute || typeof attribute !== "object") {
            return "";
        }

        if (attribute.kind === "number") {
            return String(attribute.number);
        }

        if (attribute.kind === "bool") {
            return attribute.bool
                ? "Yes"
                : "No";
        }

        return attribute.string ?? "";
    }

    function categoryNames(category) {
        return entitiesFor(category)
            .map(entity =>
                String(entity?.name ?? "").trim()
            )
            .filter(Boolean);
    }

    function uniqueDetailOptions(category) {
        const groups = new Map();

        for (const entity of entitiesFor(category)) {
            const entityName =
                String(entity?.name ?? "").trim();

            if (!entityName) {
                continue;
            }

            const attributes =
                entity?.attributes &&
                typeof entity.attributes === "object"
                    ? entity.attributes
                    : {};

            for (
                const [attribute, value] of
                Object.entries(attributes)
            ) {
                if (
                    !attribute ||
                    !value ||
                    typeof value !== "object"
                ) {
                    continue;
                }

                const key =
                    `${attribute}\u0000${JSON.stringify(value)}`;

                if (!groups.has(key)) {
                    groups.set(key, {
                        attribute,
                        value,
                        names: []
                    });
                }

                groups.get(key).names.push(entityName);
            }
        }

        return Array.from(groups.values())
            .filter(group =>
                group.names.length === 1
            )
            .map(group => ({
                label:
                    `${group.attribute}: ${displayAttribute(group.value)}`,
                selector: {
                    category,
                    attribute:
                        group.attribute,
                    equals:
                        group.value
                }
            }))
            .sort((first, second) =>
                first.label.localeCompare(second.label)
            );
    }

    function ordinal(number) {
        const mod100 =
            number % 100;

        if (
            mod100 >= 11 &&
            mod100 <= 13
        ) {
            return `${number}th`;
        }

        const suffixes = {
            1: "st",
            2: "nd",
            3: "rd"
        };

        return (
            `${number}${suffixes[number % 10] ?? "th"}`
        );
    }

    function rankingLabel(
        category,
        attribute,
        rank,
        order
    ) {
        const entity =
            categoryDefinitions[category].label;

        const high =
            order === "descending";

        const specialWords = {
            weight:
                high
                    ? "heaviest"
                    : "lightest",
            age:
                high
                    ? "oldest"
                    : "youngest",
            height:
                high
                    ? "tallest"
                    : "shortest"
        };

        if (specialWords[attribute]) {
            return rank === 1
                ? `the ${specialWords[attribute]} ${entity}`
                : `the ${ordinal(rank)}-${specialWords[attribute]} ${entity}`;
        }

        const direction =
            high
                ? "highest"
                : "lowest";

        return rank === 1
            ? `the ${entity} with the ${direction} ${attribute}`
            : `the ${entity} with the ${ordinal(rank)}-${direction} ${attribute}`;
    }

    function rankingOptions(category) {
        const entities =
            entitiesFor(category);

        const numericAttributes =
            new Map();

        for (const entity of entities) {
            const attributes =
                entity?.attributes &&
                typeof entity.attributes === "object"
                    ? entity.attributes
                    : {};

            for (
                const [attribute, value] of
                Object.entries(attributes)
            ) {
                if (
                    value?.kind !== "number" ||
                    !Number.isFinite(value.number)
                ) {
                    continue;
                }

                if (!numericAttributes.has(attribute)) {
                    numericAttributes.set(
                        attribute,
                        []
                    );
                }

                numericAttributes
                    .get(attribute)
                    .push(value.number);
            }
        }

        const options = [];

        for (
            const [attribute, values] of
            numericAttributes
        ) {
            const complete =
                entities.length > 0 &&
                values.length === entities.length;

            const unique =
                new Set(values).size ===
                values.length;

            if (!complete || !unique) {
                continue;
            }

            for (
                const order of
                ["descending", "ascending"]
            ) {
                for (
                    let rank = 1;
                    rank <= entities.length;
                    rank += 1
                ) {
                    options.push({
                        label:
                            rankingLabel(
                                category,
                                attribute,
                                rank,
                                order
                            ),
                        selector: {
                            category,
                            attribute,
                            rank,
                            order
                        }
                    });
                }
            }
        }

        return options;
    }

    function optionsForMode(category, mode) {
        const cacheKey =
            `${category}:${mode}`;

        if (selectorCache.has(cacheKey)) {
            return selectorCache.get(cacheKey);
        }

        let options = [];

        if (mode === "detail") {
            options =
                uniqueDetailOptions(category);
        } else if (mode === "ranking") {
            options =
                rankingOptions(category);
        } else {
            options =
                categoryNames(category)
                    .map(name => ({
                        label: name,
                        selector: {
                            category,
                            value: name
                        }
                    }));
        }

        selectorCache.set(
            cacheKey,
            options
        );

        return options;
    }

    function optionExists(select, value) {
        return Array.from(select.options)
            .some(option =>
                option.value === value
            );
    }

    function fillSimpleSelect(
        select,
        options,
        placeholder,
        preferred = ""
    ) {
        select.replaceChildren();

        const blank =
            document.createElement("option");

        blank.value = "";
        blank.textContent = placeholder;

        select.appendChild(blank);

        for (const optionData of options) {
            const option =
                document.createElement("option");

            option.value =
                JSON.stringify(optionData.selector);

            option.textContent =
                optionData.label;

            select.appendChild(option);
        }

        if (
            preferred &&
            optionExists(select, preferred)
        ) {
            select.value = preferred;
        } else {
            select.value = "";
        }
    }

    function fillModeSelect(
        select,
        category,
        preferred = "name"
    ) {
        const available = {
            name:
                optionsForMode(
                    category,
                    "name"
                ).length > 0,
            detail:
                optionsForMode(
                    category,
                    "detail"
                ).length > 0,
            ranking:
                optionsForMode(
                    category,
                    "ranking"
                ).length > 0
        };

        select.replaceChildren();

        for (
            const [value, label] of
            Object.entries(referenceModes)
        ) {
            const option =
                document.createElement("option");

            option.value = value;
            option.textContent = label;
            option.disabled =
                !available[value];

            select.appendChild(option);
        }

        if (available[preferred]) {
            select.value = preferred;
        } else if (available.name) {
            select.value = "name";
        } else {
            const firstAvailable =
                Object.keys(available)
                    .find(mode =>
                        available[mode]
                    );

            select.value =
                firstAvailable ?? "name";
        }
    }

    function refreshReferencePicker(
        picker,
        category,
        preserve = true
    ) {
        const modeSelect =
            picker.querySelector(
                ".reference-mode"
            );

        const valueSelect =
            picker.querySelector(
                ".reference-value"
            );

        if (!modeSelect || !valueSelect) {
            return;
        }

        const previousMode =
            preserve
                ? modeSelect.value
                : "name";

        const previousValue =
            preserve
                ? valueSelect.value
                : "";

        picker.dataset.category =
            category;

        fillModeSelect(
            modeSelect,
            category,
            previousMode
        );

        fillSimpleSelect(
            valueSelect,
            optionsForMode(
                category,
                modeSelect.value
            ),
            `Choose ${categoryDefinitions[category].label}`,
            previousValue
        );
    }

    function availableFactShapeIDs() {
        const shapeIDs = [
            "suspect_weapon",
            "suspect_location",
            "weapon_location"
        ];

        if (
            categoryNames("motive").length > 0
        ) {
            shapeIDs.push(
                "suspect_motive"
            );
        }

        return shapeIDs;
    }

    function fillFactKind(
        select,
        preferred = ""
    ) {
        const shapeIDs =
            availableFactShapeIDs();

        select.replaceChildren();

        for (const shapeID of shapeIDs) {
            const option =
                document.createElement("option");

            option.value = shapeID;
            option.textContent =
                factShapes[shapeID].label;

            select.appendChild(option);
        }

        select.value =
            shapeIDs.includes(preferred)
                ? preferred
                : shapeIDs[0];
    }

    function fillRelation(
        select,
        shapeID,
        preferred = "is"
    ) {
        const shape =
            factShapes[shapeID];

        if (!shape) {
            return;
        }

        select.replaceChildren();

        const relations = [
            ["is", shape.positive],
            ["is_not", shape.negative]
        ];

        for (
            const [value, label] of
            relations
        ) {
            const option =
                document.createElement("option");

            option.value = value;
            option.textContent = label;

            select.appendChild(option);
        }

        select.value =
            preferred === "is_not"
                ? "is_not"
                : "is";
    }

    function selectedText(select) {
        if (!select) {
            return "";
        }

        return (
            select.options[
                select.selectedIndex
            ]?.textContent ?? ""
        );
    }

    function updateFactSummary(panel) {
        const left =
            selectedText(
                panel.querySelector(
                    ".reference-picker--left .reference-value"
                )
            ) ||
            "choose the first item";

        const relation =
            selectedText(
                panel.querySelector(
                    ".fact-relation"
                )
            );

        const right =
            selectedText(
                panel.querySelector(
                    ".reference-picker--right .reference-value"
                )
            ) ||
            "choose the second item";

        const summary =
            panel.querySelector(
                ".fact-summary"
            );

        if (!summary) {
            return;
        }

        summary.replaceChildren();

        const heading =
            document.createElement("strong");

        heading.textContent =
            "Solver fact:";

        summary.append(
            heading,
            ` ${left} ${relation} ${right}.`
        );
    }

    function refreshFactPanel(
        panel,
        preserve = true
    ) {
        const kindSelect =
            panel.querySelector(
                ".fact-kind"
            );

        const relationSelect =
            panel.querySelector(
                ".fact-relation"
            );

        if (
            !kindSelect ||
            !relationSelect
        ) {
            return;
        }

        const previousKind =
            preserve
                ? kindSelect.value
                : "";

        const previousRelation =
            preserve
                ? relationSelect.value
                : "is";

        fillFactKind(
            kindSelect,
            previousKind
        );

        const shape =
            factShapes[kindSelect.value];

        if (!shape) {
            return;
        }

        refreshReferencePicker(
            panel.querySelector(
                ".reference-picker--left"
            ),
            shape.leftCategory,
            preserve
        );

        fillRelation(
            relationSelect,
            kindSelect.value,
            previousRelation
        );

        refreshReferencePicker(
            panel.querySelector(
                ".reference-picker--right"
            ),
            shape.rightCategory,
            preserve
        );

        updateFactSummary(panel);
    }

    function createReferencePicker(
        side,
        label
    ) {
        const picker =
            document.createElement("div");

        picker.className =
            `reference-picker reference-picker--${side}`;

        const heading =
            document.createElement("span");

        heading.textContent = label;

        const modeSelect =
            document.createElement("select");

        modeSelect.className =
            "reference-mode";

        modeSelect.setAttribute(
            "aria-label",
            `${label} selection method`
        );

        const valueSelect =
            document.createElement("select");

        valueSelect.className =
            "reference-value";

        valueSelect.setAttribute(
            "aria-label",
            `${label} value`
        );

        picker.append(
            heading,
            modeSelect,
            valueSelect
        );

        return picker;
    }

    function createFactPanel(row, kind) {
        if (row.querySelector(".fact-panel")) {
            return;
        }

        const panel =
            document.createElement("div");

        panel.className =
            "fact-panel";

        panel.dataset.enabled =
            "false";

        const toggleText =
            kind === "clue"
                ? "This clue affects the solution"
                : "This statement affects the solution";

        panel.innerHTML = `
            <label class="fact-toggle">
                <input
                    class="fact-enabled"
                    type="checkbox"
                >

                <span class="fact-toggle-label"></span>

                <span class="fact-state">
                    Narrative only
                </span>
            </label>

            <div
                class="fact-builder"
                hidden
            >
                <div class="fact-builder__top">
                    <label class="fact-kind-field">
                        <span>Fact type</span>

                        <select
                            class="fact-kind"
                            aria-label="Fact type"
                        ></select>
                    </label>
                </div>

                <div class="fact-sentence">
                    <div class="left-picker-slot"></div>

                    <label class="fact-relation-wrap">
                        <span>Relationship</span>

                        <select
                            class="fact-relation"
                            aria-label="Relationship"
                        ></select>
                    </label>

                    <div class="right-picker-slot"></div>
                </div>

                <p class="fact-summary"></p>
            </div>
        `;

        panel.querySelector(
            ".fact-toggle-label"
        ).textContent =
            toggleText;

        panel.querySelector(
            ".left-picker-slot"
        ).appendChild(
            createReferencePicker(
                "left",
                "First item"
            )
        );

        panel.querySelector(
            ".right-picker-slot"
        ).appendChild(
            createReferencePicker(
                "right",
                "Second item"
            )
        );

        row.appendChild(panel);

        refreshFactPanel(
            panel,
            false
        );
    }

    function ensureFactPanels() {
        document
            .querySelectorAll(
                "#clues-list .clue-row"
            )
            .forEach(row =>
                createFactPanel(
                    row,
                    "clue"
                )
            );

        document
            .querySelectorAll(
                "#interviews-list .interview-row"
            )
            .forEach(row =>
                createFactPanel(
                    row,
                    "interview"
                )
            );

        updateOverview();
    }

    function panelUsesCategory(
        panel,
        category
    ) {
        const shapeID =
            panel.querySelector(
                ".fact-kind"
            )?.value;

        const shape =
            factShapes[shapeID];

        return (
            !category ||
            shape?.leftCategory === category ||
            shape?.rightCategory === category
        );
    }

    function refreshAffectedFactPanels(
        category = null
    ) {
        const refreshAll =
            !category ||
            category === "motive";

        document
            .querySelectorAll(
                ".fact-panel"
            )
            .forEach(panel => {
                if (
                    refreshAll ||
                    panelUsesCategory(
                        panel,
                        category
                    )
                ) {
                    refreshFactPanel(
                        panel,
                        true
                    );
                }
            });
    }

    function scheduleSelectorRefresh(
        category = null
    ) {
        invalidateSelectorCache(category);

        if (category) {
            pendingRefreshCategories.add(
                category
            );
        } else {
            pendingRefreshCategories.clear();
            pendingRefreshCategories.add(
                "*"
            );
        }

        window.clearTimeout(
            selectorRefreshTimer
        );

        selectorRefreshTimer =
            window.setTimeout(() => {
                selectorRefreshTimer = 0;

                if (
                    pendingRefreshCategories
                        .has("*")
                ) {
                    refreshAffectedFactPanels();
                } else {
                    for (
                        const pendingCategory of
                        pendingRefreshCategories
                    ) {
                        refreshAffectedFactPanels(
                            pendingCategory
                        );
                    }
                }

                pendingRefreshCategories.clear();
            }, 90);
    }

    function flushSelectorRefresh() {
        if (!selectorRefreshTimer) {
            return;
        }

        window.clearTimeout(
            selectorRefreshTimer
        );

        selectorRefreshTimer = 0;
        pendingRefreshCategories.clear();

        invalidateSelectorCache();
        refreshAffectedFactPanels();
    }

    function selectorFromPicker(picker) {
        const value =
            picker?.querySelector(
                ".reference-value"
            )?.value;

        if (!value) {
            throw new Error(
                "Choose both items in every enabled solver fact."
            );
        }

        try {
            return JSON.parse(value);
        } catch {
            throw new Error(
                "One solver fact contains an invalid selector. Re-select its items."
            );
        }
    }

    function collectFact(
        row,
        indexKey,
        index
    ) {
        const panel =
            row.querySelector(
                ".fact-panel"
            );

        const enabled =
            panel
                ?.querySelector(
                    ".fact-enabled"
                )
                ?.checked;

        if (!enabled) {
            return null;
        }

        const relation =
            panel.querySelector(
                ".fact-relation"
            )?.value;

        if (
            relation !== "is" &&
            relation !== "is_not"
        ) {
            throw new Error(
                "One enabled solver fact has an invalid relationship."
            );
        }

        return {
            [indexKey]: index,
            left:
                selectorFromPicker(
                    panel.querySelector(
                        ".reference-picker--left"
                    )
                ),
            relation,
            right:
                selectorFromPicker(
                    panel.querySelector(
                        ".reference-picker--right"
                    )
                )
        };
    }

    function collectRows(
        selector,
        indexKey,
        strict
    ) {
        return Array.from(
            document.querySelectorAll(
                selector
            )
        )
            .map((row, index) => {
                try {
                    return collectFact(
                        row,
                        indexKey,
                        index
                    );
                } catch (error) {
                    if (strict) {
                        throw error;
                    }

                    return null;
                }
            })
            .filter(Boolean);
    }

    function collectLogic(strict = false) {
        const logic = {
            evidence:
                collectRows(
                    "#clues-list .clue-row",
                    "clueIndex",
                    strict
                ),
            interviews:
                collectRows(
                    "#interviews-list .interview-row",
                    "interviewIndex",
                    strict
                )
        };

        if (
            strict &&
            logic.evidence.length === 0 &&
            logic.interviews.length === 0
        ) {
            throw new Error(
                "Enable at least one clue or statement for the solver."
            );
        }

        return logic;
    }

    function enabledFactPanels() {
        return Array.from(
            document.querySelectorAll(
                ".fact-enabled:checked"
            )
        )
            .map(input =>
                input.closest(
                    ".fact-panel"
                )
            )
            .filter(Boolean);
    }

    function panelIsComplete(panel) {
        return Array.from(
            panel.querySelectorAll(
                ".reference-value"
            )
        )
            .every(select =>
                Boolean(select.value)
            );
    }

    function idleTestState() {
        const panels =
            enabledFactPanels();

        if (panels.length === 0) {
            return "Add solver facts";
        }

        return panels.every(
            panelIsComplete
        )
            ? "Ready to test"
            : "Finish solver facts";
    }

    function stateSlug(value) {
        return String(value)
            .toLowerCase()
            .replace(
                /[^a-z0-9]+/g,
                "-"
            )
            .replace(
                /^-|-$/g,
                ""
            );
    }

    function markIncompleteFacts() {
        for (
            const panel of
            document.querySelectorAll(
                ".fact-panel"
            )
        ) {
            const enabled =
                panel.querySelector(
                    ".fact-enabled"
                )?.checked;

            const incomplete =
                enabled &&
                !panelIsComplete(panel);

            panel.classList.toggle(
                "is-incomplete",
                Boolean(incomplete)
            );

            for (
                const picker of
                panel.querySelectorAll(
                    ".reference-picker"
                )
            ) {
                const missing =
                    enabled &&
                    !picker.querySelector(
                        ".reference-value"
                    )?.value;

                picker.classList.toggle(
                    "is-incomplete",
                    Boolean(missing)
                );
            }
        }
    }

    function updateOverview(state = null) {
        const clueCount =
            document.querySelectorAll(
                "#clues-list .fact-enabled:checked"
            ).length;

        const interviewCount =
            document.querySelectorAll(
                "#interviews-list .fact-enabled:checked"
            ).length;

        document.getElementById(
            "deduction-clue-count"
        ).textContent =
            String(clueCount);

        document.getElementById(
            "deduction-interview-count"
        ).textContent =
            String(interviewCount);

        const label =
            state || idleTestState();

        stateLabel.textContent =
            label;

        stateLabel.dataset.state =
            stateSlug(label);

        markIncompleteFacts();
        updateEditorOverview();
    }

    function cancelOverviewFrame() {
        if (!overviewFrame) {
            return;
        }

        window.cancelAnimationFrame(
            overviewFrame
        );

        overviewFrame = 0;
    }

    function hideValidationResult() {
        resultPanel.hidden = true;
        delete resultPanel.dataset.status;
        candidateContainer.replaceChildren();
    }

    function clearValidation() {
        hideValidationResult();

        if (overviewFrame) {
            return;
        }

        overviewFrame =
            window.requestAnimationFrame(() => {
                overviewFrame = 0;
                setStatus("");
                updateOverview();
            });
    }

    function beginValidationState() {
        cancelOverviewFrame();
        hideValidationResult();

        setStatus(
            "Testing every possible accusation…",
            "working"
        );

        updateOverview("Testing…");
    }

    function validationErrorState(error) {
        const message =
            String(
                error?.message || ""
            );

        if (
            message.includes(
                "Choose both items"
            ) ||
            message.includes(
                "invalid selector"
            ) ||
            message.includes(
                "invalid relationship"
            )
        ) {
            return {
                label:
                    "Incomplete solver fact",
                message:
                    message.includes(
                        "Choose both items"
                    )
                        ? "Choose the first and second item in every enabled solver fact."
                        : message
            };
        }

        if (
            message.includes(
                "Enable at least one"
            )
        ) {
            return {
                label:
                    "Add solver facts",
                message
            };
        }

        if (
            message.includes(
                "timed out"
            )
        ) {
            return {
                label:
                    "Server timed out",
                message
            };
        }

        if (
            message.includes(
                "required fields"
            ) ||
            message.includes("needs") ||
            message.includes("must") ||
            message.includes("Choose") ||
            message.includes("empty") ||
            message.includes("duplicate")
        ) {
            return {
                label:
                    "Complete case fields",
                message
            };
        }

        return {
            label:
                "Test could not run",
            message:
                message ||
                "The mystery test could not run."
        };
    }

    function normalizeCandidate(candidate) {
        if (
            !candidate ||
            typeof candidate !== "object"
        ) {
            return null;
        }

        return {
            culprit:
                String(
                    candidate.culprit ??
                    candidate.suspect ??
                    ""
                ),
            weapon:
                String(
                    candidate.weapon ?? ""
                ),
            location:
                String(
                    candidate.location ?? ""
                ),
            motive:
                candidate.motive == null
                    ? ""
                    : String(candidate.motive)
        };
    }

    function normalizeReport(report) {
        if (
            !report ||
            typeof report !== "object" ||
            Array.isArray(report)
        ) {
            throw new Error(
                "The server returned an invalid validation report."
            );
        }

        if (
            typeof report.status !== "string" ||
            !validReportStatuses.has(
                report.status
            )
        ) {
            throw new Error(
                "The validation report contains an unknown status."
            );
        }

        const solutionsFound =
            Number(report.solutionsFound);

        if (
            !Number.isFinite(
                solutionsFound
            ) ||
            solutionsFound < 0
        ) {
            throw new Error(
                "The validation report is missing a valid solution count."
            );
        }

        return {
            ...report,
            status:
                report.status,
            valid:
                Boolean(report.valid),
            solutionsFound,
            solutionCountIsLowerBound:
                Boolean(
                    report.solutionCountIsLowerBound
                ),
            candidates:
                Array.isArray(report.candidates)
                    ? report.candidates
                        .map(
                            normalizeCandidate
                        )
                        .filter(Boolean)
                    : []
        };
    }

    function candidateKey(candidate) {
        return JSON.stringify({
            culprit:
                candidate.culprit,
            weapon:
                candidate.weapon,
            location:
                candidate.location,
            motive:
                candidate.motive
        });
    }

    function uniqueVisibleCandidates(
        candidates
    ) {
        const unique =
            new Map();

        for (const candidate of candidates) {
            const key =
                candidateKey(candidate);

            if (!unique.has(key)) {
                unique.set(
                    key,
                    candidate
                );
            }
        }

        return Array.from(
            unique.values()
        );
    }

    function renderCandidate(candidate) {
        const item =
            document.createElement("div");

        item.className =
            "validation-candidate";

        item.textContent = [
            candidate.culprit
                ? `Culprit: ${candidate.culprit}`
                : "",
            candidate.weapon
                ? `Weapon: ${candidate.weapon}`
                : "",
            candidate.location
                ? `Location: ${candidate.location}`
                : "",
            candidate.motive
                ? `Motive: ${candidate.motive}`
                : ""
        ]
            .filter(Boolean)
            .join(" · ");

        return item;
    }

    function renderReport(rawReport) {
        const report =
            normalizeReport(rawReport);

        const titles = {
            unique:
                "Unique mystery",
            ambiguous:
                "Mystery is ambiguous",
            contradictory:
                "Mystery is contradictory",
            unique_wrong_solution:
                "Unique result, wrong selected answer"
        };

        const messages = {
            unique:
                "The enabled facts lead to exactly the answer selected in the Solution section.",
            ambiguous:
                "At least two answers still fit. Add or strengthen a solver clue or statement.",
            contradictory:
                "No answer fits every enabled fact. One or more facts conflict.",
            unique_wrong_solution:
                "The facts lead to one answer, but it differs from the selected solution."
        };

        const visibleCandidates =
            uniqueVisibleCandidates(
                report.candidates
            );

        resultPanel.dataset.status =
            report.status;

        resultTitle.textContent =
            titles[report.status];

        resultCount.textContent =
            report.solutionCountIsLowerBound
                ? `${report.solutionsFound}+ solutions`
                : `${report.solutionsFound} solution${report.solutionsFound === 1 ? "" : "s"}`;

        if (
            report.status === "ambiguous" &&
            visibleCandidates.length === 1 &&
            report.solutionsFound > 1
        ) {
            resultMessage.textContent =
                "The final accusation is fixed, but multiple complete board arrangements still satisfy the enabled facts.";
        } else {
            resultMessage.textContent =
                messages[report.status];
        }

        candidateContainer.replaceChildren();

        for (
            const candidate of
            visibleCandidates
        ) {
            candidateContainer.appendChild(
                renderCandidate(candidate)
            );
        }

        resultPanel.hidden = false;

        updateOverview(
            titles[report.status]
        );

        resultPanel.scrollIntoView({
            behavior: "smooth",
            block: "nearest"
        });

        return report;
    }

    async function validateMystery(
        puzzle,
        logic
    ) {
        if (validationRequestController) {
            validationRequestController.abort();
        }

        const controller =
            new AbortController();

        validationRequestController =
            controller;

        const timeout =
            window.setTimeout(
                () => controller.abort(),
                15000
            );

        try {
            const response =
                await fetch(
                    "/api/authored-mystery/validate",
                    {
                        method: "POST",
                        headers: {
                            "Content-Type":
                                "application/json"
                        },
                        body:
                            JSON.stringify({
                                puzzle,
                                logic
                            }),
                        signal:
                            controller.signal
                    }
                );

            const contentType =
                response.headers.get(
                    "content-type"
                ) || "";

            let result;

            if (
                contentType.includes(
                    "application/json"
                )
            ) {
                try {
                    result =
                        await response.json();
                } catch {
                    throw new Error(
                        "The server returned invalid JSON."
                    );
                }
            } else {
                result = {
                    error:
                        await response.text()
                };
            }

            if (!response.ok) {
                throw new Error(
                    result.error ||
                    `Validation failed with status ${response.status}.`
                );
            }

            return normalizeReport(result);
        } catch (error) {
            if (
                error.name === "AbortError"
            ) {
                throw new Error(
                    "The mystery test timed out. Check that the server is running."
                );
            }

            throw error;
        } finally {
            window.clearTimeout(timeout);

            if (
                validationRequestController ===
                controller
            ) {
                validationRequestController =
                    null;
            }
        }
    }

    function jsonForTab(
        tab,
        strict = true
    ) {
        if (tab === "logic") {
            flushSelectorRefresh();
        }

        const puzzle =
            buildPuzzle(strict);

        if (tab === "logic") {
            return {
                value:
                    collectLogic(strict),
                filename:
                    `case${puzzle.id}.logic.json`
            };
        }

        return {
            value:
                puzzle,
            filename:
                caseFilename(puzzle)
        };
    }

    function setActiveTab(tab) {
        const normalized =
            tab === "logic"
                ? "logic"
                : "case";

        activeJSONTab =
            normalized;

        document
            .querySelectorAll(
                "[data-json-tab]"
            )
            .forEach(button => {
                const active =
                    button.dataset.jsonTab ===
                    normalized;

                button.classList.toggle(
                    "is-active",
                    active
                );

                button.setAttribute(
                    "aria-selected",
                    String(active)
                );
            });
    }

    function renderJSONDialog() {
        const current =
            jsonForTab(
                activeJSONTab,
                true
            );

        visibleJSON =
            current.value;

        visibleFilename =
            current.filename;

        jsonOutput.textContent =
            JSON.stringify(
                visibleJSON,
                null,
                2
            );
    }

    validateButton.addEventListener(
        "click",
        async event => {
            event.preventDefault();

            flushSelectorRefresh();
            beginValidationState();

            validateButton.disabled = true;

            try {
                const puzzle =
                    buildPuzzle(true);

                const logic =
                    collectLogic(true);

                const rawReport =
                    await validateMystery(
                        puzzle,
                        logic
                    );

                const report =
                    renderReport(
                        rawReport
                    );

                setStatus(
                    report.valid
                        ? "The mystery has exactly one solution and matches the selected answer."
                        : "The test completed. Review the result below.",
                    report.valid
                        ? "success"
                        : "error"
                );
            } catch (error) {
                const problem =
                    validationErrorState(
                        error
                    );

                updateOverview(
                    problem.label
                );

                setStatus(
                    problem.message,
                    "error"
                );

                document
                    .querySelector(
                        ".fact-panel.is-incomplete"
                    )
                    ?.scrollIntoView({
                        behavior:
                            "smooth",
                        block:
                            "center"
                    });
            } finally {
                validateButton.disabled =
                    false;
            }
        }
    );

    document
        .getElementById(
            "show-json"
        )
        .addEventListener(
            "click",
            event => {
                event.preventDefault();

                try {
                    setActiveTab("case");
                    renderJSONDialog();

                    if (
                        typeof jsonDialog
                            .showModal ===
                        "function"
                    ) {
                        jsonDialog.showModal();
                    } else {
                        jsonDialog.setAttribute(
                            "open",
                            ""
                        );
                    }
                } catch (error) {
                    setStatus(
                        error.message,
                        "error"
                    );
                }
            }
        );

    document
        .getElementById(
            "close-json-dialog"
        )
        .addEventListener(
            "click",
            () => {
                if (
                    typeof jsonDialog.close ===
                    "function"
                ) {
                    jsonDialog.close();
                } else {
                    jsonDialog.removeAttribute(
                        "open"
                    );
                }
            }
        );

    jsonDialog.addEventListener(
        "click",
        event => {
            if (
                event.target !==
                jsonDialog
            ) {
                return;
            }

            if (
                typeof jsonDialog.close ===
                "function"
            ) {
                jsonDialog.close();
            } else {
                jsonDialog.removeAttribute(
                    "open"
                );
            }
        }
    );

    document.addEventListener(
        "click",
        event => {
            const tab =
                event.target.closest(
                    "[data-json-tab]"
                );

            if (!tab) {
                return;
            }

            try {
                setActiveTab(
                    tab.dataset.jsonTab
                );

                renderJSONDialog();
            } catch (error) {
                setStatus(
                    error.message,
                    "error"
                );
            }
        }
    );

    document
        .getElementById(
            "copy-visible-json"
        )
        .addEventListener(
            "click",
            async () => {
                try {
                    await copyText(
                        JSON.stringify(
                            visibleJSON,
                            null,
                            2
                        )
                    );

                    setStatus(
                        "Displayed JSON copied.",
                        "success"
                    );
                } catch (error) {
                    setStatus(
                        `Copy failed: ${error.message}`,
                        "error"
                    );
                }
            }
        );

    document
        .getElementById(
            "download-visible-json"
        )
        .addEventListener(
            "click",
            () => {
                try {
                    downloadJSON(
                        visibleJSON,
                        visibleFilename
                    );

                    setStatus(
                        `${visibleFilename} downloaded.`,
                        "success"
                    );
                } catch (error) {
                    setStatus(
                        `Download failed: ${error.message}`,
                        "error"
                    );
                }
            }
        );

    document
        .getElementById(
            "download-json"
        )
        .addEventListener(
            "click",
            event => {
                event.preventDefault();

                try {
                    const current =
                        jsonForTab(
                            "case",
                            true
                        );

                    downloadJSON(
                        current.value,
                        current.filename
                    );

                    setStatus(
                        "Case file downloaded.",
                        "success"
                    );
                } catch (error) {
                    setStatus(
                        error.message,
                        "error"
                    );
                }
            }
        );

    document
        .getElementById(
            "download-logic"
        )
        .addEventListener(
            "click",
            event => {
                event.preventDefault();

                try {
                    const current =
                        jsonForTab(
                            "logic",
                            true
                        );

                    downloadJSON(
                        current.value,
                        current.filename
                    );

                    setStatus(
                        "Solver file downloaded.",
                        "success"
                    );
                } catch (error) {
                    setStatus(
                        error.message,
                        "error"
                    );
                }
            }
        );

    document
        .getElementById(
            "copy-json"
        )
        .addEventListener(
            "click",
            async event => {
                event.preventDefault();

                try {
                    const current =
                        jsonForTab(
                            "case",
                            true
                        );

                    await copyText(
                        JSON.stringify(
                            current.value,
                            null,
                            2
                        )
                    );

                    setStatus(
                        "Case JSON copied.",
                        "success"
                    );
                } catch (error) {
                    setStatus(
                        error.message,
                        "error"
                    );
                }
            }
        );

    document.addEventListener(
        "change",
        event => {
            if (
                event.target.matches(
                    ".fact-enabled"
                )
            ) {
                const panel =
                    event.target.closest(
                        ".fact-panel"
                    );

                if (!panel) {
                    return;
                }

                const enabled =
                    event.target.checked;

                panel.dataset.enabled =
                    String(enabled);

                const builder =
                    panel.querySelector(
                        ".fact-builder"
                    );

                if (builder) {
                    builder.hidden =
                        !enabled;
                }

                const factState =
                    panel.querySelector(
                        ".fact-state"
                    );

                if (factState) {
                    factState.textContent =
                        enabled
                            ? "Used by solver"
                            : "Narrative only";
                }

                clearValidation();
                return;
            }

            if (
                event.target.matches(
                    ".fact-kind"
                )
            ) {
                refreshFactPanel(
                    event.target.closest(
                        ".fact-panel"
                    ),
                    true
                );

                clearValidation();
                return;
            }

            if (
                event.target.matches(
                    ".reference-mode"
                )
            ) {
                const picker =
                    event.target.closest(
                        ".reference-picker"
                    );

                if (!picker) {
                    return;
                }

                const category =
                    picker.dataset.category;

                fillSimpleSelect(
                    picker.querySelector(
                        ".reference-value"
                    ),
                    optionsForMode(
                        category,
                        event.target.value
                    ),
                    `Choose ${categoryDefinitions[category].label}`
                );

                updateFactSummary(
                    picker.closest(
                        ".fact-panel"
                    )
                );

                clearValidation();
                return;
            }

            if (
                event.target.matches(
                    ".reference-value, .fact-relation"
                )
            ) {
                updateFactSummary(
                    event.target.closest(
                        ".fact-panel"
                    )
                );

                clearValidation();
                return;
            }

            if (
                event.target.matches(
                    ".entity-name, .attribute-key, .attribute-kind, .attribute-value"
                )
            ) {
                const source =
                    event.target.closest(
                        ".entity-card"
                    )?.dataset.category;

                const category =
                    source
                        ? source.replace(
                            /s$/,
                            ""
                        )
                        : null;

                scheduleSelectorRefresh(
                    category
                );
            }

            clearValidation();
        }
    );

    document.addEventListener(
        "input",
        event => {
            if (
                event.target.matches(
                    ".entity-name, .attribute-key, .attribute-value"
                )
            ) {
                const source =
                    event.target.closest(
                        ".entity-card"
                    )?.dataset.category;

                const category =
                    source
                        ? source.replace(
                            /s$/,
                            ""
                        )
                        : null;

                scheduleSelectorRefresh(
                    category
                );
            }

            if (
                !event.target.closest(
                    "#json-dialog"
                )
            ) {
                clearValidation();
            }
        }
    );

    document.addEventListener(
        "case-editor:rows-changed",
        event => {
            ensureFactPanels();

            if (
                event.detail?.reason ===
                "case-imported"
            ) {
                clearValidation();
            }

            scheduleSelectorRefresh();
        }
    );

    form.addEventListener(
        "reset",
        () => {
            window.setTimeout(() => {
                invalidateSelectorCache();
                ensureFactPanels();
                refreshAffectedFactPanels();
                clearValidation();
            }, 0);
        }
    );

    window.addEventListener(
        "beforeunload",
        () => {
            if (
                validationRequestController
            ) {
                validationRequestController
                    .abort();
            }

            window.clearTimeout(
                selectorRefreshTimer
            );

            cancelOverviewFrame();
        }
    );

    ensureFactPanels();
    updateOverview();
}