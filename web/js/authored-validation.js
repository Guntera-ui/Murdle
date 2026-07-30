const categoryDefinitions = {
    suspect: { label: "suspect", source: "suspects" },
    weapon: { label: "weapon", source: "weapons" },
    location: { label: "location", source: "locations" },
    motive: { label: "motive", source: "motives" }
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

    const validateButton = document.getElementById("validate-case");
    const resultPanel = document.getElementById("validation-result");
    const jsonDialog = document.getElementById("json-dialog");
    const jsonOutput = document.getElementById("json-output");

    let activeJSONTab = "case";
    let visibleJSON = {};
    let visibleFilename = "case.json";
    let selectorRefreshTimer = 0;

    function entitiesFor(category) {
        return getEntityDraft(categoryDefinitions[category].source);
    }

    function displayAttribute(attribute) {
        if (attribute.kind === "number") {
            return String(attribute.number);
        }
        if (attribute.kind === "bool") {
            return attribute.bool ? "Yes" : "No";
        }
        return attribute.string ?? "";
    }

    function categoryNames(category) {
        return entitiesFor(category).map(entity => entity.name);
    }

    function uniqueDetailOptions(category) {
        const groups = new Map();

        for (const entity of entitiesFor(category)) {
            for (const [attribute, value] of Object.entries(entity.attributes)) {
                const key = `${attribute}\u0000${JSON.stringify(value)}`;
                if (!groups.has(key)) {
                    groups.set(key, { attribute, value, names: [] });
                }
                groups.get(key).names.push(entity.name);
            }
        }

        return Array.from(groups.values())
            .filter(group => group.names.length === 1)
            .map(group => ({
                label: `${group.attribute}: ${displayAttribute(group.value)}`,
                selector: {
                    category,
                    attribute: group.attribute,
                    equals: group.value
                }
            }))
            .sort((a, b) => a.label.localeCompare(b.label));
    }

    function ordinal(number) {
        const mod100 = number % 100;
        if (mod100 >= 11 && mod100 <= 13) {
            return `${number}th`;
        }
        return `${number}${number % 10 === 1 ? "st" : number % 10 === 2 ? "nd" : number % 10 === 3 ? "rd" : "th"}`;
    }

    function rankingLabel(category, attribute, rank, order) {
        const entity = categoryDefinitions[category].label;
        const high = order === "descending";
        const words = {
            weight: high ? "heaviest" : "lightest",
            age: high ? "oldest" : "youngest",
            height: high ? "tallest" : "shortest"
        };

        if (words[attribute]) {
            return rank === 1
                ? `the ${words[attribute]} ${entity}`
                : `the ${ordinal(rank)}-${words[attribute]} ${entity}`;
        }

        const direction = high ? "highest" : "lowest";
        return rank === 1
            ? `the ${entity} with the ${direction} ${attribute}`
            : `the ${entity} with the ${ordinal(rank)}-${direction} ${attribute}`;
    }

    function rankingOptions(category) {
        const entities = entitiesFor(category);
        const numericAttributes = new Map();

        for (const entity of entities) {
            for (const [attribute, value] of Object.entries(entity.attributes)) {
                if (value.kind !== "number") {
                    continue;
                }
                if (!numericAttributes.has(attribute)) {
                    numericAttributes.set(attribute, []);
                }
                numericAttributes.get(attribute).push(value.number);
            }
        }

        const options = [];
        for (const [attribute, values] of numericAttributes) {
            if (values.length !== entities.length || new Set(values).size !== values.length) {
                continue;
            }
            for (const order of ["descending", "ascending"]) {
                for (let rank = 1; rank <= entities.length; rank += 1) {
                    options.push({
                        label: rankingLabel(category, attribute, rank, order),
                        selector: { category, attribute, rank, order }
                    });
                }
            }
        }
        return options;
    }

    function optionsForMode(category, mode) {
        if (mode === "detail") {
            return uniqueDetailOptions(category);
        }
        if (mode === "ranking") {
            return rankingOptions(category);
        }
        return categoryNames(category).map(name => ({
            label: name,
            selector: { category, value: name }
        }));
    }

    function fillSimpleSelect(select, options, placeholder, preferred = "") {
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

        if (Array.from(select.options).some(option => option.value === preferred)) {
            select.value = preferred;
        }
    }

    function fillModeSelect(select, category, preferred = "name") {
        const available = {
            name: categoryNames(category).length > 0,
            detail: uniqueDetailOptions(category).length > 0,
            ranking: rankingOptions(category).length > 0
        };
        select.replaceChildren();

        for (const [value, label] of Object.entries(referenceModes)) {
            const option = document.createElement("option");
            option.value = value;
            option.textContent = label;
            option.disabled = !available[value];
            select.appendChild(option);
        }
        select.value = available[preferred] ? preferred : "name";
    }

    function refreshReferencePicker(picker, category, preserve = true) {
        const modeSelect = picker.querySelector(".reference-mode");
        const valueSelect = picker.querySelector(".reference-value");
        const previousMode = preserve ? modeSelect.value : "name";
        const previousValue = preserve ? valueSelect.value : "";

        picker.dataset.category = category;
        fillModeSelect(modeSelect, category, previousMode);
        fillSimpleSelect(
            valueSelect,
            optionsForMode(category, modeSelect.value),
            `Choose ${categoryDefinitions[category].label}`,
            previousValue
        );
    }

    function fillFactKind(select, preferred = "") {
        const shapeIDs = ["suspect_weapon", "suspect_location", "weapon_location"];
        if (categoryNames("motive").length > 0) {
            shapeIDs.push("suspect_motive");
        }

        select.replaceChildren();
        for (const shapeID of shapeIDs) {
            const option = document.createElement("option");
            option.value = shapeID;
            option.textContent = factShapes[shapeID].label;
            select.appendChild(option);
        }
        select.value = shapeIDs.includes(preferred) ? preferred : shapeIDs[0];
    }

    function fillRelation(select, shapeID, preferred = "is") {
        const shape = factShapes[shapeID];
        select.replaceChildren();
        for (const [value, label] of [["is", shape.positive], ["is_not", shape.negative]]) {
            const option = document.createElement("option");
            option.value = value;
            option.textContent = label;
            select.appendChild(option);
        }
        select.value = ["is", "is_not"].includes(preferred) ? preferred : "is";
    }

    function selectedText(select) {
        return select.options[select.selectedIndex]?.textContent || "";
    }

    function updateFactSummary(panel) {
        const left = selectedText(panel.querySelector(".reference-picker--left .reference-value")) || "choose the first item";
        const relation = selectedText(panel.querySelector(".fact-relation"));
        const right = selectedText(panel.querySelector(".reference-picker--right .reference-value")) || "choose the second item";
        panel.querySelector(".fact-summary").innerHTML = `<strong>Solver fact:</strong> ${left} ${relation} ${right}.`;
    }

    function refreshFactPanel(panel, preserve = true) {
        const kindSelect = panel.querySelector(".fact-kind");
        const relationSelect = panel.querySelector(".fact-relation");
        const previousKind = preserve ? kindSelect.value : "";
        const previousRelation = preserve ? relationSelect.value : "is";

        fillFactKind(kindSelect, previousKind);
        const shape = factShapes[kindSelect.value];
        refreshReferencePicker(panel.querySelector(".reference-picker--left"), shape.leftCategory, preserve);
        fillRelation(relationSelect, kindSelect.value, previousRelation);
        refreshReferencePicker(panel.querySelector(".reference-picker--right"), shape.rightCategory, preserve);
        updateFactSummary(panel);
    }

    function createReferencePicker(side, label) {
        const picker = document.createElement("div");
        picker.className = `reference-picker reference-picker--${side}`;
        picker.innerHTML = `
            <span>${label}</span>
            <select class="reference-mode" aria-label="${label} selection method"></select>
            <select class="reference-value" aria-label="${label} value"></select>
        `;
        return picker;
    }

    function createFactPanel(row, kind) {
        if (row.querySelector(".fact-panel")) {
            return;
        }

        const panel = document.createElement("div");
        panel.className = "fact-panel";
        panel.dataset.enabled = "false";
        const toggleText = kind === "clue"
            ? "This clue affects the solution"
            : "This statement affects the solution";

        panel.innerHTML = `
            <label class="fact-toggle">
                <input class="fact-enabled" type="checkbox">
                <span>${toggleText}</span>
                <span class="fact-state">Narrative only</span>
            </label>
            <div class="fact-builder" hidden>
                <div class="fact-builder__top">
                    <label class="fact-kind-field"><span>Fact type</span><select class="fact-kind"></select></label>
                </div>
                <div class="fact-sentence">
                    <div class="left-picker-slot"></div>
                    <label class="fact-relation-wrap"><span>Relationship</span><select class="fact-relation"></select></label>
                    <div class="right-picker-slot"></div>
                </div>
                <p class="fact-summary"></p>
            </div>
        `;

        panel.querySelector(".left-picker-slot").appendChild(createReferencePicker("left", "First item"));
        panel.querySelector(".right-picker-slot").appendChild(createReferencePicker("right", "Second item"));
        row.appendChild(panel);
        refreshFactPanel(panel, false);
    }

    function ensureFactPanels() {
        document.querySelectorAll("#clues-list .clue-row").forEach(row => createFactPanel(row, "clue"));
        document.querySelectorAll("#interviews-list .interview-row").forEach(row => createFactPanel(row, "interview"));
        updateOverview();
    }

    function refreshAllFactPanels() {
        document.querySelectorAll(".fact-panel").forEach(panel => refreshFactPanel(panel, true));
    }

    function scheduleSelectorRefresh() {
        window.clearTimeout(selectorRefreshTimer);
        selectorRefreshTimer = window.setTimeout(refreshAllFactPanels, 130);
    }

    function selectorFromPicker(picker) {
        const value = picker.querySelector(".reference-value").value;
        if (!value) {
            throw new Error("Choose both items in every enabled solver fact.");
        }
        return JSON.parse(value);
    }

    function collectFact(row, indexKey, index) {
        const panel = row.querySelector(".fact-panel");
        if (!panel?.querySelector(".fact-enabled").checked) {
            return null;
        }
        return {
            [indexKey]: index,
            left: selectorFromPicker(panel.querySelector(".reference-picker--left")),
            relation: panel.querySelector(".fact-relation").value,
            right: selectorFromPicker(panel.querySelector(".reference-picker--right"))
        };
    }

    function collectLogic(strict = false) {
        const collectRows = (selector, indexKey) => Array.from(document.querySelectorAll(selector))
            .map((row, index) => {
                try {
                    return collectFact(row, indexKey, index);
                } catch (error) {
                    if (strict) {
                        throw error;
                    }
                    return null;
                }
            })
            .filter(Boolean);

        const logic = {
            evidence: collectRows("#clues-list .clue-row", "clueIndex"),
            interviews: collectRows("#interviews-list .interview-row", "interviewIndex")
        };

        if (strict && logic.evidence.length === 0 && logic.interviews.length === 0) {
            throw new Error("Enable at least one clue or statement for the solver.");
        }
        return logic;
    }

    function enabledFactPanels() {
        return Array.from(document.querySelectorAll(".fact-enabled:checked"))
            .map(input => input.closest(".fact-panel"));
    }

    function panelIsComplete(panel) {
        return Array.from(panel.querySelectorAll(".reference-value"))
            .every(select => Boolean(select.value));
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
        for (const panel of document.querySelectorAll(".fact-panel")) {
            const enabled = panel.querySelector(".fact-enabled")?.checked;
            const incomplete = enabled && !panelIsComplete(panel);
            panel.classList.toggle("is-incomplete", Boolean(incomplete));

            for (const picker of panel.querySelectorAll(".reference-picker")) {
                const missing = enabled && !picker.querySelector(".reference-value")?.value;
                picker.classList.toggle("is-incomplete", Boolean(missing));
            }
        }
    }

    function updateOverview(state = null) {
        document.getElementById("deduction-clue-count").textContent = String(
            document.querySelectorAll("#clues-list .fact-enabled:checked").length
        );
        document.getElementById("deduction-interview-count").textContent = String(
            document.querySelectorAll("#interviews-list .fact-enabled:checked").length
        );

        const stateLabel = document.getElementById("validation-state-label");
        stateLabel.textContent = state || idleTestState();
        stateLabel.dataset.state = (state || idleTestState())
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/^-|-$/g, "");

        markIncompleteFacts();
        updateEditorOverview();
    }

    function clearValidation() {
        resultPanel.hidden = true;
        delete resultPanel.dataset.status;
        setStatus("");
        updateOverview();
    }

    function validationErrorState(error) {
        const message = String(error?.message || "");
        if (message.includes("Choose both items")) {
            return {
                label: "Incomplete solver fact",
                message: "Choose the first and second item in every enabled solver fact."
            };
        }
        if (message.includes("Enable at least one")) {
            return {
                label: "Add solver facts",
                message
            };
        }
        if (message.includes("required fields") || message.includes("needs") || message.includes("must") || message.includes("Choose")) {
            return {
                label: "Complete case fields",
                message
            };
        }
        return {
            label: "Test could not run",
            message: message || "The mystery test could not run."
        };
    }

    function renderReport(report) {
        const titles = {
            unique: "Unique mystery",
            ambiguous: "Mystery is ambiguous",
            contradictory: "Mystery is contradictory",
            unique_wrong_solution: "Unique result, wrong selected answer"
        };
        const messages = {
            unique: "The enabled facts lead to exactly the answer selected in the Solution section.",
            ambiguous: "At least two answers still fit. Add or strengthen a solver clue or statement.",
            contradictory: "No answer fits every enabled fact. One or more facts conflict.",
            unique_wrong_solution: "The facts lead to one answer, but it differs from the selected solution."
        };

        resultPanel.dataset.status = report.status;
        document.getElementById("validation-result-title").textContent = titles[report.status] || report.status;
        document.getElementById("validation-result-count").textContent = report.solutionCountIsLowerBound
            ? `${report.solutionsFound}+ solutions`
            : `${report.solutionsFound} solution${report.solutionsFound === 1 ? "" : "s"}`;
        document.getElementById("validation-result-message").textContent = messages[report.status] || "Validation completed.";

        const candidates = document.getElementById("validation-candidates");
        candidates.replaceChildren();
        for (const candidate of report.candidates || []) {
            const item = document.createElement("div");
            item.className = "validation-candidate";
            item.textContent = [
                `Culprit: ${candidate.culprit}`,
                `Weapon: ${candidate.weapon}`,
                `Location: ${candidate.location}`,
                candidate.motive ? `Motive: ${candidate.motive}` : ""
            ].filter(Boolean).join(" · ");
            candidates.appendChild(item);
        }

        resultPanel.hidden = false;
        updateOverview(titles[report.status] || report.status);
        resultPanel.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }

    async function validateMystery(puzzle, logic) {
        const response = await fetch("/api/authored-mystery/validate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ puzzle, logic })
        });
        const contentType = response.headers.get("content-type") || "";
        const result = contentType.includes("application/json")
            ? await response.json()
            : { error: await response.text() };

        if (!response.ok) {
            throw new Error(result.error || `Validation failed with status ${response.status}.`);
        }
        return result;
    }

    function jsonForTab(tab, strict = true) {
        const puzzle = buildPuzzle(strict);
        if (tab === "logic") {
            return {
                value: collectLogic(strict),
                filename: `case${puzzle.id}.logic.json`
            };
        }
        return {
            value: puzzle,
            filename: caseFilename(puzzle)
        };
    }

    function setActiveTab(tab) {
        activeJSONTab = tab;
        document.querySelectorAll("[data-json-tab]").forEach(button => {
            const active = button.dataset.jsonTab === tab;
            button.classList.toggle("is-active", active);
            button.setAttribute("aria-selected", String(active));
        });
    }

    function renderJSONDialog() {
        const current = jsonForTab(activeJSONTab, true);
        visibleJSON = current.value;
        visibleFilename = current.filename;
        jsonOutput.textContent = JSON.stringify(visibleJSON, null, 2);
    }

    validateButton.addEventListener("click", async event => {
        event.preventDefault();
        validateButton.disabled = true;
        clearValidation();
        setStatus("Testing every possible accusation…", "working");
        updateOverview("Testing…");

        try {
            const puzzle = buildPuzzle(true);
            const logic = collectLogic(true);
            const report = await validateMystery(puzzle, logic);
            renderReport(report);
            setStatus(
                report.valid
                    ? "The mystery has exactly one solution and matches the selected answer."
                    : "The test completed. Review the result below.",
                report.valid ? "success" : "error"
            );
        } catch (error) {
            const problem = validationErrorState(error);
            updateOverview(problem.label);
            setStatus(problem.message, "error");
            document.querySelector(".fact-panel.is-incomplete")?.scrollIntoView({
                behavior: "smooth",
                block: "center"
            });
        } finally {
            validateButton.disabled = false;
        }
    });

    document.getElementById("show-json").addEventListener("click", event => {
        event.preventDefault();
        try {
            setActiveTab("case");
            renderJSONDialog();
            jsonDialog.showModal();
        } catch (error) {
            setStatus(error.message, "error");
        }
    });

    document.getElementById("close-json-dialog").addEventListener("click", () => jsonDialog.close());
    jsonDialog.addEventListener("click", event => {
        if (event.target === jsonDialog) {
            jsonDialog.close();
        }
    });

    document.addEventListener("click", event => {
        const tab = event.target.closest("[data-json-tab]");
        if (!tab) {
            return;
        }
        try {
            setActiveTab(tab.dataset.jsonTab);
            renderJSONDialog();
        } catch (error) {
            setStatus(error.message, "error");
        }
    });

    document.getElementById("copy-visible-json").addEventListener("click", async () => {
        try {
            await copyText(JSON.stringify(visibleJSON, null, 2));
            setStatus("Displayed JSON copied.", "success");
        } catch (error) {
            setStatus(`Copy failed: ${error.message}`, "error");
        }
    });

    document.getElementById("download-visible-json").addEventListener("click", () => {
        downloadJSON(visibleJSON, visibleFilename);
        setStatus(`${visibleFilename} downloaded.`, "success");
    });

    document.getElementById("download-json").addEventListener("click", event => {
        event.preventDefault();
        try {
            const current = jsonForTab("case", true);
            downloadJSON(current.value, current.filename);
            setStatus("Case file downloaded.", "success");
        } catch (error) {
            setStatus(error.message, "error");
        }
    });

    document.getElementById("download-logic").addEventListener("click", event => {
        event.preventDefault();
        try {
            const current = jsonForTab("logic", true);
            downloadJSON(current.value, current.filename);
            setStatus("Solver file downloaded.", "success");
        } catch (error) {
            setStatus(error.message, "error");
        }
    });

    document.getElementById("copy-json").addEventListener("click", async event => {
        event.preventDefault();
        try {
            const current = jsonForTab("case", true);
            await copyText(JSON.stringify(current.value, null, 2));
            setStatus("Case JSON copied.", "success");
        } catch (error) {
            setStatus(error.message, "error");
        }
    });

    document.addEventListener("change", event => {
        if (event.target.matches(".fact-enabled")) {
            const panel = event.target.closest(".fact-panel");
            const enabled = event.target.checked;
            panel.dataset.enabled = String(enabled);
            panel.querySelector(".fact-builder").hidden = !enabled;
            panel.querySelector(".fact-state").textContent = enabled ? "Used by solver" : "Narrative only";
            clearValidation();
            return;
        }

        if (event.target.matches(".fact-kind")) {
            refreshFactPanel(event.target.closest(".fact-panel"), true);
            clearValidation();
            return;
        }

        if (event.target.matches(".reference-mode")) {
            const picker = event.target.closest(".reference-picker");
            const category = picker.dataset.category;
            fillSimpleSelect(
                picker.querySelector(".reference-value"),
                optionsForMode(category, event.target.value),
                `Choose ${categoryDefinitions[category].label}`
            );
            updateFactSummary(picker.closest(".fact-panel"));
            clearValidation();
            return;
        }

        if (event.target.matches(".reference-value, .fact-relation")) {
            updateFactSummary(event.target.closest(".fact-panel"));
            clearValidation();
            return;
        }

        if (event.target.matches(".entity-name, .attribute-key, .attribute-kind, .attribute-value")) {
            scheduleSelectorRefresh();
        }
        clearValidation();
    });

    document.addEventListener("input", event => {
        if (event.target.matches(".entity-name, .attribute-key, .attribute-value")) {
            scheduleSelectorRefresh();
        }
        if (!event.target.closest("#json-dialog")) {
            clearValidation();
        }
    });

    document.addEventListener("case-editor:rows-changed", event => {
        ensureFactPanels();
        if (event.detail?.reason === "case-imported") {
            clearValidation();
        }
        scheduleSelectorRefresh();
    });

    const observer = new MutationObserver(records => {
        if (records.some(record => record.addedNodes.length > 0)) {
            ensureFactPanels();
        }
    });
    observer.observe(document.getElementById("clues-list"), { childList: true });
    observer.observe(document.getElementById("interviews-list"), { childList: true });

    form.addEventListener("reset", () => window.setTimeout(ensureFactPanels, 0));
    ensureFactPanels();
    updateOverview();
}
