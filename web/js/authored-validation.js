const CATEGORY_DEFINITIONS = Object.freeze({
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
});

const FACT_SHAPES = Object.freeze({
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
});

const REFERENCE_MODES = Object.freeze({
    name: "By name",
    detail: "By detail",
    ranking: "By ranking"
});

const REPORT_TITLES = Object.freeze({
    unique: "Unique mystery",
    ambiguous: "Mystery is ambiguous",
    contradictory: "Mystery is contradictory",
    unique_wrong_solution: "Unique result, wrong selected answer"
});

const REPORT_MESSAGES = Object.freeze({
    unique:
        "The enabled facts lead to exactly the answer selected in the Solution section.",
    ambiguous:
        "At least two answers still fit. Add or strengthen a solver clue or statement.",
    contradictory:
        "No answer fits every enabled fact. One or more facts conflict.",
    unique_wrong_solution:
        "The facts lead to one answer, but it differs from the selected solution."
});

const VALID_REPORT_STATUSES = new Set(
    Object.keys(REPORT_TITLES)
);

const REQUIRED_API_FUNCTIONS = Object.freeze([
    "buildPuzzle",
    "setStatus",
    "downloadJSON",
    "copyText",
    "caseFilename",
    "getEntityDraft",
    "updateEditorOverview",
    "collectFormIssues"
]);

let initialized = false;

function requireElement(id) {
    const element = document.getElementById(id);

    if (!element) {
        throw new Error(
            `Authored validation could not start: missing #${id}.`
        );
    }

    return element;
}

function requireAPI(api) {
    if (!api || typeof api !== "object") {
        throw new Error(
            "Authored validation requires an API object."
        );
    }

    if (!(api.form instanceof HTMLFormElement)) {
        throw new Error(
            "Authored validation requires the case editor form."
        );
    }

    for (const name of REQUIRED_API_FUNCTIONS) {
        if (typeof api[name] !== "function") {
            throw new Error(
                `Authored validation requires api.${name}().`
            );
        }
    }
}

function normalizeCandidate(candidate) {
    if (
        !candidate ||
        typeof candidate !== "object" ||
        Array.isArray(candidate)
    ) {
        return null;
    }

    return {
        culprit: String(
            candidate.culprit ??
            candidate.suspect ??
            ""
        ),
        weapon: String(candidate.weapon ?? ""),
        location: String(candidate.location ?? ""),
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

    if (!VALID_REPORT_STATUSES.has(report.status)) {
        throw new Error(
            "The validation report contains an unknown status."
        );
    }

    const solutionsFound = Number(report.solutionsFound);

    if (
        !Number.isFinite(solutionsFound) ||
        solutionsFound < 0
    ) {
        throw new Error(
            "The validation report is missing a valid solution count."
        );
    }

    return {
        status: report.status,
        valid: Boolean(report.valid),
        solutionsFound,
        solutionCountIsLowerBound:
            Boolean(report.solutionCountIsLowerBound),
        candidates:
            Array.isArray(report.candidates)
                ? report.candidates
                    .map(normalizeCandidate)
                    .filter(Boolean)
                : []
    };
}

function candidateKey(candidate) {
    return JSON.stringify({
        culprit: candidate.culprit,
        weapon: candidate.weapon,
        location: candidate.location,
        motive: candidate.motive
    });
}

function uniqueCandidates(candidates) {
    const unique = new Map();

    for (const candidate of candidates) {
        const key = candidateKey(candidate);

        if (!unique.has(key)) {
            unique.set(key, candidate);
        }
    }

    return Array.from(unique.values());
}

export function initAuthoredValidation(api) {
    if (initialized) {
        return;
    }

    requireAPI(api);

    const {
        form,
        buildPuzzle,
        setStatus,
        downloadJSON,
        copyText,
        caseFilename,
        getEntityDraft,
        updateEditorOverview,
        collectFormIssues
    } = api;

    const elements = {
        validateButton: requireElement("validate-case"),
        showJSONButton: requireElement("show-json"),
        downloadCaseButton: requireElement("download-json"),
        downloadLogicButton: requireElement("download-logic"),
        copyCaseButton: requireElement("copy-json"),
        closeDialogButton: requireElement("close-json-dialog"),
        copyVisibleButton: requireElement("copy-visible-json"),
        downloadVisibleButton: requireElement("download-visible-json"),
        resultPanel: requireElement("validation-result"),
        resultTitle: requireElement("validation-result-title"),
        resultCount: requireElement("validation-result-count"),
        resultMessage: requireElement("validation-result-message"),
        candidateContainer: requireElement("validation-candidates"),
        jsonDialog: requireElement("json-dialog"),
        jsonOutput: requireElement("json-output"),
        clueCount: requireElement("deduction-clue-count"),
        interviewCount: requireElement("deduction-interview-count"),
        validationState: requireElement("validation-state-label")
    };

    initialized = true;

    const eventController = new AbortController();
    const eventOptions = {
        signal: eventController.signal
    };

    const selectorCache = new Map();
    const entityCache = new Map();
    const pendingRefreshCategories = new Set();

    let activeJSONTab = "case";
    let visibleJSON = {};
    let visibleFilename = "case.json";
    let selectorRefreshTimer = 0;
    let overviewFrame = 0;
    let validationRequest = null;
    let validationSequence = 0;

    function emitSelectOptionsChanged(select) {
        select.dispatchEvent(
            new CustomEvent(
                "case-editor:select-options-changed",
                {
                    bubbles: true
                }
            )
        );
    }

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
        const definition = CATEGORY_DEFINITIONS[category];

        if (!definition) {
            return [];
        }

        if (!entityCache.has(category)) {
            const draft = getEntityDraft(definition.source);

            entityCache.set(
                category,
                Array.isArray(draft)
                    ? draft
                    : []
            );
        }

        return entityCache.get(category);
    }

    function categoryNames(category) {
        return entitiesFor(category)
            .map(entity =>
                String(entity?.name ?? "").trim()
            )
            .filter(Boolean);
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

        return String(attribute.string ?? "");
    }

    function uniqueDetailOptions(category) {
        const groups = new Map();

        for (const entity of entitiesFor(category)) {
            const name = String(entity?.name ?? "").trim();
            const attributes =
                entity?.attributes &&
                typeof entity.attributes === "object"
                    ? entity.attributes
                    : {};

            if (!name) {
                continue;
            }

            for (
                const [attribute, value] of
                Object.entries(attributes)
            ) {
                if (!attribute || !value) {
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

                groups.get(key).names.push(name);
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
                    attribute: group.attribute,
                    equals: group.value
                }
            }))
            .sort((first, second) =>
                first.label.localeCompare(second.label)
            );
    }

    function ordinal(number) {
        const mod100 = number % 100;

        if (mod100 >= 11 && mod100 <= 13) {
            return `${number}th`;
        }

        const suffix = {
            1: "st",
            2: "nd",
            3: "rd"
        }[number % 10] ?? "th";

        return `${number}${suffix}`;
    }

    function rankingLabel(
        category,
        attribute,
        rank,
        order
    ) {
        const entity =
            CATEGORY_DEFINITIONS[category].label;

        const high =
            order === "descending";

        const special = {
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
        }[attribute];

        if (special) {
            return rank === 1
                ? `the ${special} ${entity}`
                : `the ${ordinal(rank)}-${special} ${entity}`;
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
        const entities = entitiesFor(category);
        const numericAttributes = new Map();

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
                    numericAttributes.set(attribute, []);
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
                new Set(values).size === values.length;

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
        const cacheKey = `${category}:${mode}`;

        if (selectorCache.has(cacheKey)) {
            return selectorCache.get(cacheKey);
        }

        let options;

        if (mode === "detail") {
            options = uniqueDetailOptions(category);
        } else if (mode === "ranking") {
            options = rankingOptions(category);
        } else {
            options = categoryNames(category)
                .map(name => ({
                    label: name,
                    selector: {
                        category,
                        value: name
                    }
                }));
        }

        selectorCache.set(cacheKey, options);
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

        const blank = document.createElement("option");
        blank.value = "";
        blank.textContent = placeholder;
        select.appendChild(blank);

        for (const optionData of options) {
            const option = document.createElement("option");
            option.value = JSON.stringify(optionData.selector);
            option.textContent = optionData.label;
            select.appendChild(option);
        }

        select.value =
            preferred && optionExists(select, preferred)
                ? preferred
                : "";

        emitSelectOptionsChanged(select);
    }

    function fillModeSelect(
        select,
        category,
        preferred = "name"
    ) {
        const available = {
            name:
                optionsForMode(category, "name").length > 0,
            detail:
                optionsForMode(category, "detail").length > 0,
            ranking:
                optionsForMode(category, "ranking").length > 0
        };

        select.replaceChildren();

        for (
            const [value, label] of
            Object.entries(REFERENCE_MODES)
        ) {
            const option = document.createElement("option");
            option.value = value;
            option.textContent = label;
            option.disabled = !available[value];
            select.appendChild(option);
        }

        if (available[preferred]) {
            select.value = preferred;
        } else if (available.name) {
            select.value = "name";
        } else {
            select.value =
                Object.keys(available)
                    .find(mode => available[mode]) ??
                "name";
        }

        emitSelectOptionsChanged(select);
    }

    function refreshReferencePicker(
        picker,
        category,
        preserve = true
    ) {
        if (!picker) {
            return;
        }

        const modeSelect =
            picker.querySelector(".reference-mode");

        const valueSelect =
            picker.querySelector(".reference-value");

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

        picker.dataset.category = category;

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
            `Choose ${CATEGORY_DEFINITIONS[category].label}`,
            previousValue
        );
    }

    function availableFactShapeIDs() {
        const shapeIDs = [
            "suspect_weapon",
            "suspect_location",
            "weapon_location"
        ];

        if (categoryNames("motive").length > 0) {
            shapeIDs.push("suspect_motive");
        }

        return shapeIDs;
    }

    function fillFactKind(
        select,
        preferred = ""
    ) {
        const shapeIDs = availableFactShapeIDs();

        select.replaceChildren();

        for (const shapeID of shapeIDs) {
            const option = document.createElement("option");
            option.value = shapeID;
            option.textContent = FACT_SHAPES[shapeID].label;
            select.appendChild(option);
        }

        select.value =
            shapeIDs.includes(preferred)
                ? preferred
                : shapeIDs[0];

        emitSelectOptionsChanged(select);
    }

    function fillRelation(
        select,
        shapeID,
        preferred = "is"
    ) {
        const shape = FACT_SHAPES[shapeID];

        if (!shape) {
            return;
        }

        select.replaceChildren();

        for (
            const [value, label] of
            [
                ["is", shape.positive],
                ["is_not", shape.negative]
            ]
        ) {
            const option = document.createElement("option");
            option.value = value;
            option.textContent = label;
            select.appendChild(option);
        }

        select.value =
            preferred === "is_not"
                ? "is_not"
                : "is";

        emitSelectOptionsChanged(select);
    }

    function selectedText(select) {
        if (!select) {
            return "";
        }

        return (
            select.options[
                select.selectedIndex
            ]?.textContent ??
            ""
        );
    }

    function updateFactSummary(panel) {
        if (!panel) {
            return;
        }

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
            panel.querySelector(".fact-summary");

        if (!summary) {
            return;
        }

        summary.replaceChildren();

        const heading = document.createElement("strong");
        heading.textContent = "Solver fact:";

        summary.append(
            heading,
            ` ${left} ${relation} ${right}.`
        );
    }

    function refreshFactPanel(
        panel,
        preserve = true
    ) {
        if (!panel) {
            return;
        }

        const kindSelect =
            panel.querySelector(".fact-kind");

        const relationSelect =
            panel.querySelector(".fact-relation");

        if (!kindSelect || !relationSelect) {
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

        fillFactKind(kindSelect, previousKind);

        const shape =
            FACT_SHAPES[kindSelect.value];

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

    function createReferencePicker(side, label) {
        const picker = document.createElement("div");
        picker.className =
            `reference-picker reference-picker--${side}`;

        const heading = document.createElement("span");
        heading.textContent = label;

        const modeSelect = document.createElement("select");
        modeSelect.className = "reference-mode";
        modeSelect.setAttribute(
            "aria-label",
            `${label} selection method`
        );

        const valueSelect = document.createElement("select");
        valueSelect.className = "reference-value";
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
        if (
            !row ||
            row.querySelector(".fact-panel")
        ) {
            return;
        }

        const panel = document.createElement("div");
        panel.className = "fact-panel";
        panel.dataset.enabled = "false";

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
        ).textContent = toggleText;

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
        refreshFactPanel(panel, false);
    }

    function ensureFactPanels() {
        document.querySelectorAll(
            "#clues-list .clue-row"
        ).forEach(row =>
            createFactPanel(row, "clue")
        );

        document.querySelectorAll(
            "#interviews-list .interview-row"
        ).forEach(row =>
            createFactPanel(row, "interview")
        );

        updateOverview();
    }

    function panelUsesCategory(panel, category) {
        const shapeID =
            panel.querySelector(".fact-kind")?.value;

        const shape = FACT_SHAPES[shapeID];

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

        document.querySelectorAll(
            ".fact-panel"
        ).forEach(panel => {
            if (
                refreshAll ||
                panelUsesCategory(panel, category)
            ) {
                refreshFactPanel(panel, true);
            }
        });
    }

    function scheduleSelectorRefresh(
        category = null
    ) {
        invalidateSelectorCache(category);

        if (category) {
            pendingRefreshCategories.add(category);
        } else {
            pendingRefreshCategories.clear();
            pendingRefreshCategories.add("*");
        }

        window.clearTimeout(selectorRefreshTimer);

        selectorRefreshTimer =
            window.setTimeout(() => {
                selectorRefreshTimer = 0;

                if (
                    pendingRefreshCategories.has("*")
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
            }, 100);
    }

    function flushSelectorRefresh() {
        if (!selectorRefreshTimer) {
            return;
        }

        window.clearTimeout(selectorRefreshTimer);
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
                "A solver selector became invalid. Re-select both items."
            );
        }
    }

    function collectFact(
        row,
        indexKey,
        index
    ) {
        const panel =
            row.querySelector(".fact-panel");

        const enabled =
            panel?.querySelector(
                ".fact-enabled"
            )?.checked;

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
            document.querySelectorAll(selector)
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
                input.closest(".fact-panel")
            )
            .filter(Boolean);
    }

    function panelIsComplete(panel) {
        return Array.from(
            panel.querySelectorAll(
                ".reference-value"
            )
        ).every(select => Boolean(select.value));
    }

    function idleTestState() {
        const panels = enabledFactPanels();

        if (panels.length === 0) {
            return "Add solver facts";
        }

        return panels.every(panelIsComplete)
            ? "Ready to test"
            : "Finish solver facts";
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
                Boolean(enabled) &&
                !panelIsComplete(panel);

            panel.classList.toggle(
                "is-incomplete",
                incomplete
            );

            for (
                const picker of
                panel.querySelectorAll(
                    ".reference-picker"
                )
            ) {
                const missing =
                    Boolean(enabled) &&
                    !picker.querySelector(
                        ".reference-value"
                    )?.value;

                picker.classList.toggle(
                    "is-incomplete",
                    missing
                );
            }
        }
    }

    function stateSlug(value) {
        return String(value)
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/^-|-$/g, "");
    }

    function updateOverview(state = null) {
        elements.clueCount.textContent = String(
            document.querySelectorAll(
                "#clues-list .fact-enabled:checked"
            ).length
        );

        elements.interviewCount.textContent = String(
            document.querySelectorAll(
                "#interviews-list .fact-enabled:checked"
            ).length
        );

        const label = state || idleTestState();

        elements.validationState.textContent = label;
        elements.validationState.dataset.state =
            stateSlug(label);

        markIncompleteFacts();
        updateEditorOverview();
    }

    function cancelOverviewFrame() {
        if (!overviewFrame) {
            return;
        }

        window.cancelAnimationFrame(overviewFrame);
        overviewFrame = 0;
    }

    function hideValidationResult() {
        elements.resultPanel.hidden = true;
        delete elements.resultPanel.dataset.status;
        elements.candidateContainer.replaceChildren();
    }

    function clearValidation() {
        cancelValidationForEdit();
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

        elements.validateButton.disabled = true;
        elements.validateButton.setAttribute(
            "aria-busy",
            "true"
        );

        setStatus(
            "Testing every possible accusation…",
            "working"
        );

        updateOverview("Testing…");
    }

    function endValidationState() {
        elements.validateButton.disabled = false;
        elements.validateButton.removeAttribute(
            "aria-busy"
        );
    }

    function cancelValidationForEdit() {
        if (!validationRequest) {
            return;
        }

        validationRequest.reason = "case-changed";
        validationRequest.controller.abort();
        endValidationState();
    }

    function validationErrorState(error) {
        const message = String(error?.message || "");

        if (
            message.includes("Choose both items") ||
            message.includes("selector became invalid") ||
            message.includes("invalid relationship")
        ) {
            return {
                label: "Incomplete solver fact",
                message
            };
        }

        if (message.includes("Enable at least one")) {
            return {
                label: "Add solver facts",
                message
            };
        }

        if (message.includes("timed out")) {
            return {
                label: "Server timed out",
                message
            };
        }

        if (message.includes("cancelled")) {
            return {
                label: "Test cancelled",
                message
            };
        }

        return {
            label: "Test could not run",
            message:
                message ||
                "The mystery test could not run."
        };
    }

    function formatSolutionCount(report) {
        const suffix =
            report.solutionsFound === 1
                ? "solution"
                : "solutions";

        return report.solutionCountIsLowerBound
            ? `${report.solutionsFound}+ ${suffix}`
            : `${report.solutionsFound} ${suffix}`;
    }

    function renderCandidate(candidate) {
        const item = document.createElement("div");
        item.className = "validation-candidate";

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
        const report = normalizeReport(rawReport);
        const candidates = uniqueCandidates(
            report.candidates
        );

        elements.resultPanel.dataset.status =
            report.status;

        elements.resultTitle.textContent =
            REPORT_TITLES[report.status];

        elements.resultCount.textContent =
            formatSolutionCount(report);

        if (
            report.status === "ambiguous" &&
            candidates.length === 1 &&
            report.solutionsFound > 1
        ) {
            elements.resultMessage.textContent =
                "The final accusation is fixed, but multiple complete board arrangements still satisfy the enabled facts.";
        } else {
            elements.resultMessage.textContent =
                REPORT_MESSAGES[report.status];
        }

        elements.candidateContainer.replaceChildren();

        for (const candidate of candidates) {
            elements.candidateContainer.appendChild(
                renderCandidate(candidate)
            );
        }

        elements.resultPanel.hidden = false;
        updateOverview(REPORT_TITLES[report.status]);

        elements.resultPanel.scrollIntoView({
            behavior: "smooth",
            block: "nearest"
        });

        return report;
    }

    function focusIssue(issue) {
        if (!issue?.target) {
            return;
        }

        let target;

        try {
            target = document.querySelector(issue.target);
        } catch {
            target = null;
        }

        if (!target) {
            return;
        }

        target.scrollIntoView({
            behavior: "smooth",
            block: "center"
        });

        const focusTarget =
            target.matches(
                "input, textarea, button, select"
            )
                ? target
                : target.querySelector(
                    "[required]:invalid, .is-incomplete .custom-select__trigger, input, textarea, .custom-select__trigger, button"
                );

        target.classList.add("validation-attention");

        window.setTimeout(() => {
            target.classList.remove(
                "validation-attention"
            );
        }, 1300);

        window.setTimeout(() => {
            focusTarget?.focus?.({
                preventScroll: true
            });
        }, 280);
    }

    function renderFormIssues(
        issues,
        fallbackMessage =
            "Complete the required case fields before testing the mystery."
    ) {
        const normalized =
            Array.isArray(issues)
                ? issues.filter(Boolean)
                : [];

        const total = normalized.reduce(
            (sum, issue) =>
                sum +
                Math.max(
                    1,
                    Number(issue.count) || 1
                ),
            0
        );

        elements.resultPanel.dataset.status =
            "form_incomplete";

        elements.resultTitle.textContent =
            "Complete the case first";

        elements.resultCount.textContent =
            total > 0
                ? `${total} item${total === 1 ? "" : "s"} left`
                : "Needs attention";

        elements.resultMessage.textContent =
            normalized.length > 0
                ? "Finish the items below, then test the mystery again."
                : fallbackMessage;

        elements.candidateContainer.replaceChildren();

        for (const issue of normalized) {
            const button = document.createElement("button");
            const heading = document.createElement("strong");
            const message = document.createElement("span");
            const count = document.createElement("b");

            button.type = "button";
            button.className =
                "validation-candidate validation-candidate--issue";

            heading.textContent =
                issue.section || "Form";

            message.textContent =
                issue.message ||
                "Complete this section.";

            count.className =
                "validation-candidate__count";

            count.textContent = String(
                Math.max(
                    1,
                    Number(issue.count) || 1
                )
            );

            button.append(
                heading,
                message,
                count
            );

            button.addEventListener(
                "click",
                () => focusIssue(issue),
                eventOptions
            );

            elements.candidateContainer.appendChild(
                button
            );
        }

        elements.resultPanel.hidden = false;
        updateOverview("Complete case fields");

        elements.resultPanel.scrollIntoView({
            behavior: "smooth",
            block: "nearest"
        });
    }

    function createFallbackIssue(error) {
        return {
            section: "Case",
            message:
                String(error?.message || "") ||
                "Complete the case before testing.",
            target: "#case-editor-form",
            count: 1
        };
    }

    function prepareValidationPayload() {
        flushSelectorRefresh();
        cancelOverviewFrame();

        const issues = collectFormIssues();

        if (!Array.isArray(issues)) {
            throw new Error(
                "collectFormIssues() must return an array."
            );
        }

        if (issues.length > 0) {
            return {
                issues
            };
        }

        try {
            return {
                puzzle: buildPuzzle(true),
                logic: collectLogic(true)
            };
        } catch (error) {
            const refreshedIssues = collectFormIssues();

            return {
                issues:
                    refreshedIssues.length > 0
                        ? refreshedIssues
                        : [createFallbackIssue(error)]
            };
        }
    }

    async function validateMystery(
        puzzle,
        logic
    ) {
        if (validationRequest) {
            validationRequest.controller.abort();
        }

        const sequence = ++validationSequence;
        const controller = new AbortController();
        let timedOut = false;

        const request = {
            sequence,
            controller,
            reason: ""
        };

        validationRequest = request;

        const timeout = window.setTimeout(() => {
            timedOut = true;
            controller.abort();
        }, 15000);

        try {
            const response = await fetch(
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
                    result = await response.json();
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
            if (error.name === "AbortError") {
                if (timedOut) {
                    throw new Error(
                        "The mystery test timed out. Check that the server is running."
                    );
                }

                if (request.reason === "case-changed") {
                    const cancelled = new Error(
                        "The mystery test was cancelled because the case changed."
                    );
                    cancelled.code = "CASE_CHANGED";
                    throw cancelled;
                }

                const cancelled = new Error(
                    "The previous mystery test was cancelled."
                );
                cancelled.code = "VALIDATION_CANCELLED";
                throw cancelled;
            }

            throw error;
        } finally {
            window.clearTimeout(timeout);

            if (
                validationRequest?.sequence ===
                sequence
            ) {
                validationRequest = null;
            }
        }
    }

    function createFormIssuesError(
        issues,
        fallbackMessage = "Complete the case before continuing."
    ) {
        const error = new Error(fallbackMessage);
        error.code = "FORM_ISSUES";
        error.issues = Array.isArray(issues)
            ? issues.filter(Boolean)
            : [];
        return error;
    }

    function jsonForTab(
        tab,
        strict = true
    ) {
        const normalizedTab =
            tab === "logic"
                ? "logic"
                : "case";

        const requireSolverFacts =
            normalizedTab === "logic";

        if (requireSolverFacts) {
            flushSelectorRefresh();
        }

        const issues = collectFormIssues({
            requireSolverFacts
        });

        if (!Array.isArray(issues)) {
            throw new Error(
                "collectFormIssues() must return an array."
            );
        }

        if (issues.length > 0) {
            throw createFormIssuesError(issues);
        }

        try {
            const puzzle = buildPuzzle(strict);

            if (normalizedTab === "logic") {
                return {
                    value: collectLogic(strict),
                    filename:
                        `case${puzzle.id}.logic.json`
                };
            }

            return {
                value: puzzle,
                filename: caseFilename(puzzle)
            };
        } catch (error) {
            const refreshedIssues = collectFormIssues({
                requireSolverFacts
            });

            throw createFormIssuesError(
                refreshedIssues.length > 0
                    ? refreshedIssues
                    : [createFallbackIssue(error)],
                error.message
            );
        }
    }

    function setActiveTab(tab) {
        activeJSONTab =
            tab === "logic"
                ? "logic"
                : "case";

        document.querySelectorAll(
            "[data-json-tab]"
        ).forEach(button => {
            const active =
                button.dataset.jsonTab ===
                activeJSONTab;

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

    function renderJSONTab(tab) {
        const normalizedTab =
            tab === "logic"
                ? "logic"
                : "case";

        const current = jsonForTab(
            normalizedTab,
            true
        );

        setActiveTab(normalizedTab);
        visibleJSON = current.value;
        visibleFilename = current.filename;

        elements.jsonOutput.textContent =
            JSON.stringify(
                visibleJSON,
                null,
                2
            );
    }

    function openJSONDialog() {
        if (
            typeof elements.jsonDialog.showModal ===
            "function"
        ) {
            elements.jsonDialog.showModal();
        } else {
            elements.jsonDialog.setAttribute(
                "open",
                ""
            );
        }
    }

    function closeJSONDialog() {
        if (
            typeof elements.jsonDialog.close ===
            "function"
        ) {
            elements.jsonDialog.close();
        } else {
            elements.jsonDialog.removeAttribute(
                "open"
            );
        }
    }

    function handleOperationError(
        error,
        fallbackMessage = "The action could not be completed."
    ) {
        if (
            error?.code === "FORM_ISSUES" &&
            Array.isArray(error.issues)
        ) {
            hideValidationResult();
            renderFormIssues(
                error.issues,
                error.message || fallbackMessage
            );
            setStatus(
                "The case is incomplete. Review the items below.",
                "error"
            );
            return;
        }

        setStatus(
            error?.message || fallbackMessage,
            "error"
        );
    }

    async function handleValidate(event) {
        event.preventDefault();
        event.stopPropagation();

        if (elements.validateButton.disabled) {
            return;
        }

        let prepared;

        try {
            prepared = prepareValidationPayload();
        } catch (error) {
            hideValidationResult();
            renderFormIssues(
                [createFallbackIssue(error)]
            );
            setStatus(
                "The case could not be prepared for testing.",
                "error"
            );
            return;
        }

        if (prepared.issues?.length) {
            hideValidationResult();
            renderFormIssues(prepared.issues);
            setStatus(
                "The case is incomplete. Review the items below.",
                "error"
            );
            return;
        }

        beginValidationState();

        try {
            const report = await validateMystery(
                prepared.puzzle,
                prepared.logic
            );

            const rendered = renderReport(report);

            setStatus(
                rendered.valid
                    ? "The mystery has exactly one solution and matches the selected answer."
                    : "The test completed. Review the result below.",
                rendered.valid
                    ? "success"
                    : "error"
            );
        } catch (error) {
            if (error.code === "CASE_CHANGED") {
                return;
            }

            const problem = validationErrorState(error);
            hideValidationResult();
            updateOverview(problem.label);
            setStatus(problem.message, "error");
        } finally {
            endValidationState();
        }
    }

    async function handleCopyVisibleJSON() {
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

    function handleDownloadVisibleJSON() {
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

    function handleDownload(tab) {
        try {
            const current = jsonForTab(tab, true);

            downloadJSON(
                current.value,
                current.filename
            );

            setStatus(
                tab === "logic"
                    ? "Solver file downloaded."
                    : "Case file downloaded.",
                "success"
            );
        } catch (error) {
            handleOperationError(
                error,
                "The file could not be downloaded."
            );
        }
    }

    elements.validateButton.addEventListener(
        "click",
        handleValidate,
        eventOptions
    );

    elements.showJSONButton.addEventListener(
        "click",
        event => {
            event.preventDefault();

            try {
                renderJSONTab("case");
                openJSONDialog();
            } catch (error) {
                handleOperationError(
                    error,
                    "The JSON preview could not be generated."
                );
            }
        },
        eventOptions
    );

    elements.closeDialogButton.addEventListener(
        "click",
        closeJSONDialog,
        eventOptions
    );

    elements.jsonDialog.addEventListener(
        "click",
        event => {
            if (event.target === elements.jsonDialog) {
                closeJSONDialog();
            }
        },
        eventOptions
    );

    document.addEventListener(
        "click",
        event => {
            const tab = event.target.closest(
                "[data-json-tab]"
            );

            if (!tab) {
                return;
            }

            try {
                renderJSONTab(tab.dataset.jsonTab);
            } catch (error) {
                handleOperationError(
                    error,
                    "The selected JSON file could not be generated."
                );
            }
        },
        eventOptions
    );

    elements.copyVisibleButton.addEventListener(
        "click",
        handleCopyVisibleJSON,
        eventOptions
    );

    elements.downloadVisibleButton.addEventListener(
        "click",
        handleDownloadVisibleJSON,
        eventOptions
    );

    elements.downloadCaseButton.addEventListener(
        "click",
        event => {
            event.preventDefault();
            handleDownload("case");
        },
        eventOptions
    );

    elements.downloadLogicButton.addEventListener(
        "click",
        event => {
            event.preventDefault();
            handleDownload("logic");
        },
        eventOptions
    );

    elements.copyCaseButton.addEventListener(
        "click",
        async event => {
            event.preventDefault();

            try {
                const current = jsonForTab(
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
                handleOperationError(
                    error,
                    "The case JSON could not be copied."
                );
            }
        },
        eventOptions
    );

    document.addEventListener(
        "change",
        event => {
            if (
                event.target.matches(
                    ".fact-enabled"
                )
            ) {
                const panel = event.target.closest(
                    ".fact-panel"
                );

                if (!panel) {
                    return;
                }

                const enabled = event.target.checked;
                panel.dataset.enabled = String(enabled);

                const builder = panel.querySelector(
                    ".fact-builder"
                );

                const state = panel.querySelector(
                    ".fact-state"
                );

                if (builder) {
                    builder.hidden = !enabled;
                }

                if (state) {
                    state.textContent = enabled
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
                const picker = event.target.closest(
                    ".reference-picker"
                );

                if (!picker) {
                    return;
                }

                const category = picker.dataset.category;

                fillSimpleSelect(
                    picker.querySelector(
                        ".reference-value"
                    ),
                    optionsForMode(
                        category,
                        event.target.value
                    ),
                    `Choose ${CATEGORY_DEFINITIONS[category].label}`
                );

                updateFactSummary(
                    picker.closest(".fact-panel")
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

                const category = source
                    ? source.replace(/s$/, "")
                    : null;

                scheduleSelectorRefresh(category);
            }

            clearValidation();
        },
        eventOptions
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

                const category = source
                    ? source.replace(/s$/, "")
                    : null;

                scheduleSelectorRefresh(category);
            }

            if (
                !event.target.closest(
                    "#json-dialog"
                )
            ) {
                clearValidation();
            }
        },
        eventOptions
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
        },
        eventOptions
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
        },
        eventOptions
    );

    window.addEventListener(
        "beforeunload",
        () => {
            eventController.abort();
            validationRequest?.controller.abort();
            window.clearTimeout(selectorRefreshTimer);
            cancelOverviewFrame();
        },
        {
            once: true
        }
    );

    ensureFactPanels();
    updateOverview();
}
