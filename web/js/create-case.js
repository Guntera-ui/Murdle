import {
    getEnabledGenres,
    loadGenreRegistry
} from "./genres.js?v=5";

import {
    initAuthoredValidation
} from "./authored-validation.js?v=11";

const form = document.getElementById("case-editor-form");
const categoryNames = ["suspects", "weapons", "locations", "motives"];
const coreCategories = new Set(["suspects", "weapons", "locations"]);
const detailKeys = {
    suspects: "suspectDetails",
    weapons: "weaponDetails",
    locations: "locationDetails",
    motives: "motiveDetails"
};
const editableTopLevelKeys = new Set([
    "id", "caseNumber", "title", "status", "description", "difficulty",
    "victim", "incidentReport", "interviews", "suspects", "suspectIcons",
    "weapons", "locations", "motives", "suspectDetails", "weaponDetails",
    "locationDetails", "motiveDetails", "clues", "solution", "genre",
    "statementRules"
]);

let genreRegistry = null;
let importedExtraFields = {};
let removeTimer = 0;

export function element(id) {
    return document.getElementById(id);
}

function cloneTemplate(id) {
    return element(id).content.firstElementChild.cloneNode(true);
}

export function setStatus(message, state = "") {
    const status = element("editor-status");
    status.textContent = message;

    if (state) {
        status.dataset.state = state;
    } else {
        delete status.dataset.state;
    }
}

function listContainer(category) {
    return element(`${category}-list`);
}

function announceRowsChanged(reason = "update") {
    document.dispatchEvent(new CustomEvent("case-editor:rows-changed", {
        detail: { reason }
    }));
}


const customSelectControllers = new WeakMap();
let openCustomSelect = null;

function closeCustomSelect(controller = openCustomSelect, returnFocus = false) {
    if (!controller) {
        return;
    }

    controller.wrapper.classList.remove("is-open", "opens-upward");
    controller.host?.classList.remove("has-open-select");
    controller.trigger.setAttribute("aria-expanded", "false");
    controller.menu.hidden = true;

    if (returnFocus) {
        controller.trigger.focus();
    }

    if (openCustomSelect === controller) {
        openCustomSelect = null;
    }
}

function selectedOption(select) {
    return select.options[select.selectedIndex] ?? null;
}

function customSelectLabel(select) {
    const field = select.closest(".field, .fact-kind-field, .fact-relation-wrap, .reference-picker");
    return field?.querySelector(":scope > span")?.textContent?.trim() || select.getAttribute("aria-label") || "Choose an option";
}

function enhanceSelect(select) {
    if (!(select instanceof HTMLSelectElement) || customSelectControllers.has(select)) {
        return;
    }

    const wrapper = document.createElement("div");
    wrapper.className = "custom-select";

    const trigger = document.createElement("button");
    trigger.type = "button";
    trigger.className = "custom-select__trigger";
    trigger.setAttribute("aria-haspopup", "listbox");
    trigger.setAttribute("aria-expanded", "false");
    trigger.setAttribute("aria-label", customSelectLabel(select));
    trigger.innerHTML = `
        <span class="custom-select__value"></span>
        <span class="custom-select__chevron" aria-hidden="true"></span>
    `;

    const menu = document.createElement("div");
    menu.className = "custom-select__menu";
    menu.setAttribute("role", "listbox");
    menu.hidden = true;

    select.parentNode.insertBefore(wrapper, select);
    wrapper.append(select, trigger, menu);
    select.classList.add("native-select");
    select.tabIndex = -1;

    const controller = {
        select,
        wrapper,
        trigger,
        menu,
        value: trigger.querySelector(".custom-select__value"),
        optionButtons: [],
        host: wrapper.closest(".repeater-card, .entity-card, .editor-section")
    };

    function sync() {
        const option = selectedOption(select);
        controller.value.textContent = option?.textContent?.trim() || "Choose an option";
        wrapper.classList.toggle("has-placeholder", !select.value);
        wrapper.classList.toggle("is-disabled", select.disabled);
        trigger.disabled = select.disabled;

        for (const button of controller.optionButtons) {
            const active = button.dataset.value === select.value;
            button.classList.toggle("is-selected", active);
            button.setAttribute("aria-selected", String(active));
        }
    }

    function choose(value) {
        if (select.value === value) {
            closeCustomSelect(controller, true);
            return;
        }

        select.value = value;
        wrapper.classList.remove("is-invalid");
        sync();
        closeCustomSelect(controller, true);
        select.dispatchEvent(new Event("change", { bubbles: true }));
        queueMicrotask(refreshCustomSelects);
    }

    function rebuild() {
        menu.replaceChildren();
        controller.optionButtons = [];

        Array.from(select.options).forEach(option => {
            const button = document.createElement("button");
            button.type = "button";
            button.className = "custom-select__option";
            button.dataset.value = option.value;
            button.textContent = option.textContent;
            button.disabled = option.disabled;
            button.setAttribute("role", "option");
            button.addEventListener("click", event => {
                event.preventDefault();
                event.stopPropagation();
                choose(option.value);
            });
            menu.appendChild(button);
            controller.optionButtons.push(button);
        });

        sync();
    }

    function open() {
        if (select.disabled) {
            return;
        }

        if (openCustomSelect && openCustomSelect !== controller) {
            closeCustomSelect(openCustomSelect);
        }

        const triggerRect = trigger.getBoundingClientRect();
        const roomBelow = window.innerHeight - triggerRect.bottom;
        const openUpward = roomBelow < 290 && triggerRect.top > roomBelow;

        menu.hidden = false;
        wrapper.classList.add("is-open");
        wrapper.classList.toggle("opens-upward", openUpward);
        controller.host?.classList.add("has-open-select");
        trigger.setAttribute("aria-expanded", "true");
        openCustomSelect = controller;
    }

    trigger.addEventListener("click", event => {
        event.preventDefault();
        event.stopPropagation();
        if (wrapper.classList.contains("is-open")) {
            closeCustomSelect(controller);
        } else {
            open();
        }
    });

    trigger.addEventListener("keydown", event => {
        if (["ArrowDown", "ArrowUp", "Enter", " "].includes(event.key)) {
            event.preventDefault();
            open();
            const selected = controller.optionButtons.find(button => button.classList.contains("is-selected") && !button.disabled);
            const first = controller.optionButtons.find(button => !button.disabled);
            (selected || first)?.focus();
        }
    });

    menu.addEventListener("keydown", event => {
        const enabled = controller.optionButtons.filter(button => !button.disabled);
        const index = enabled.indexOf(document.activeElement);

        if (event.key === "Escape") {
            event.preventDefault();
            closeCustomSelect(controller, true);
            return;
        }

        if (event.key === "ArrowDown" || event.key === "ArrowUp") {
            event.preventDefault();
            const direction = event.key === "ArrowDown" ? 1 : -1;
            const next = index < 0
                ? 0
                : (index + direction + enabled.length) % enabled.length;
            enabled[next]?.focus();
        }
    });

    select.addEventListener("change", () => {
        wrapper.classList.remove("is-invalid");
        sync();
    });

    new MutationObserver(rebuild).observe(select, {
        childList: true,
        subtree: true,
        attributes: true,
        characterData: true
    });

    controller.sync = sync;
    controller.rebuild = rebuild;
    customSelectControllers.set(select, controller);
    rebuild();
}

function enhanceSelects(root = document) {
    if (root instanceof HTMLSelectElement) {
        enhanceSelect(root);
        return;
    }

    root.querySelectorAll?.("select").forEach(enhanceSelect);
}

function refreshCustomSelects() {
    document.querySelectorAll("select").forEach(select => {
        enhanceSelect(select);
        customSelectControllers.get(select)?.rebuild?.();
    });
}

function initCustomSelects() {
    enhanceSelects();

    new MutationObserver(records => {
        for (const record of records) {
            for (const node of record.addedNodes) {
                if (node instanceof Element) {
                    enhanceSelects(node);
                }
            }
        }
    }).observe(document.body, { childList: true, subtree: true });

    document.addEventListener("click", event => {
        if (openCustomSelect && !openCustomSelect.wrapper.contains(event.target)) {
            closeCustomSelect(openCustomSelect);
        }
    });

    document.addEventListener("keydown", event => {
        if (event.key === "Escape" && openCustomSelect) {
            closeCustomSelect(openCustomSelect, true);
        }
    });

    form.addEventListener("invalid", event => {
        if (!event.target.matches("select.native-select")) {
            return;
        }

        const controller = customSelectControllers.get(event.target);
        controller?.wrapper.classList.add("is-invalid");
        window.setTimeout(() => controller?.trigger.focus(), 0);
    }, true);
}

function animateIn(node) {
    node.classList.add("is-entering");
    window.setTimeout(() => node.classList.remove("is-entering"), 300);
}

function removeWithAnimation(node, callback) {
    if (!node) {
        return;
    }

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reducedMotion) {
        node.remove();
        callback?.();
        return;
    }

    node.classList.add("is-removing");
    window.clearTimeout(removeTimer);
    removeTimer = window.setTimeout(() => {
        node.remove();
        callback?.();
    }, 165);
}

function inferAttributeKind(attribute) {
    if (attribute && typeof attribute.kind === "string") {
        return attribute.kind;
    }
    if (attribute && Object.hasOwn(attribute, "number")) {
        return "number";
    }
    if (attribute && Object.hasOwn(attribute, "bool")) {
        return "bool";
    }
    return "string";
}

function attributeValue(attribute, kind) {
    if (!attribute) {
        return "";
    }
    if (kind === "number") {
        return attribute.number ?? "";
    }
    if (kind === "bool") {
        return String(attribute.bool ?? false);
    }
    return attribute.string ?? "";
}

function updateAttributeCount(entityCard) {
    if (!entityCard) {
        return;
    }
    const count = entityCard.querySelectorAll(".attribute-row").length;
    const badge = entityCard.querySelector(".attribute-count");
    if (badge) {
        badge.textContent = String(count);
    }
}

function renderAttributeValue(row, kind, value = "") {
    const holder = row.querySelector(".attribute-value-holder");
    holder.replaceChildren();

    if (kind === "bool") {
        const select = document.createElement("select");
        select.className = "attribute-value";
        select.setAttribute("aria-label", "Attribute value");

        for (const optionValue of ["true", "false"]) {
            const option = document.createElement("option");
            option.value = optionValue;
            option.textContent = optionValue === "true" ? "True" : "False";
            select.appendChild(option);
        }
        select.value = String(value);
        holder.appendChild(select);
        enhanceSelect(select);
        return;
    }

    const input = document.createElement("input");
    input.className = "attribute-value";
    input.required = true;
    input.type = kind === "number" ? "number" : "text";
    input.step = kind === "number" ? "any" : "";
    input.value = value ?? "";
    holder.appendChild(input);
}

function createAttributeRow(key = "", attribute = null) {
    const row = cloneTemplate("attribute-template");
    const kind = inferAttributeKind(attribute);

    row.querySelector(".attribute-key").value = key;
    row.querySelector(".attribute-kind").value = kind;
    renderAttributeValue(row, kind, attributeValue(attribute, kind));
    return row;
}

function createEntityRow(category, data = {}) {
    const row = cloneTemplate("entity-template");
    row.dataset.category = category;
    row.querySelector(".entity-name").value = data.name ?? "";

    const iconField = row.querySelector(".entity-icon-field");
    const iconInput = row.querySelector(".entity-icon");

    if (category === "suspects") {
        iconInput.required = true;
        iconInput.value = data.icon ?? "";
    } else {
        iconField.hidden = true;
        iconInput.required = false;
    }

    for (const [key, attribute] of Object.entries(data.attributes ?? {})) {
        row.querySelector(".attribute-list").appendChild(
            createAttributeRow(key, attribute)
        );
    }

    updateAttributeCount(row);
    return row;
}

function createInterviewRow(interview = {}) {
    const row = cloneTemplate("interview-template");
    row.dataset.speaker = interview.speaker ?? "";
    row.querySelector(".interview-statement").value = interview.statement ?? "";
    return row;
}

function createClueRow(clue = "") {
    const row = cloneTemplate("clue-template");
    row.querySelector(".clue-text").value = clue;
    return row;
}

function canAddEntity(category) {
    const count = listContainer(category).querySelectorAll(".entity-card").length;
    if (count >= 5) {
        setStatus(`A ${category.slice(0, -1)} category can contain at most five entries.`, "error");
        return false;
    }
    return true;
}

function appendEntity(category, data = {}, options = {}) {
    if (!options.force && !canAddEntity(category)) {
        return null;
    }

    const row = createEntityRow(category, data);
    listContainer(category).appendChild(row);
    animateIn(row);
    refreshEntityIndexes();
    refreshDependentSelects();
    updateEditorOverview();
    announceRowsChanged("entity-added");
    return row;
}

function appendInterview(interview = {}) {
    const row = createInterviewRow(interview);
    element("interviews-list").appendChild(row);
    animateIn(row);
    refreshDependentSelects();
    updateEditorOverview();
    announceRowsChanged("interview-added");
    return row;
}

function appendClue(clue = "") {
    const row = createClueRow(clue);
    element("clues-list").appendChild(row);
    animateIn(row);
    refreshClueIndexes();
    updateEditorOverview();
    announceRowsChanged("clue-added");
    return row;
}

function refreshEntityIndexes() {
    for (const category of categoryNames) {
        listContainer(category).querySelectorAll(".entity-card").forEach((row, index) => {
            row.querySelector(".entity-index").textContent = `${category.slice(0, -1)} ${index + 1}`;
        });
    }
}

function refreshClueIndexes() {
    element("clues-list").querySelectorAll(".clue-row").forEach((row, index) => {
        row.querySelector(".clue-number").textContent = `E-${String(index + 1).padStart(2, "0")}`;
    });
}

export function categoryValues(category) {
    return Array.from(listContainer(category).querySelectorAll(".entity-name"))
        .map(input => input.value.trim())
        .filter(Boolean);
}

function replaceSelectOptions(select, values, placeholder, preferredValue) {
    const currentValue = preferredValue ?? select.value;
    select.replaceChildren();

    const blank = document.createElement("option");
    blank.value = "";
    blank.textContent = placeholder;
    select.appendChild(blank);

    for (const value of values) {
        const option = document.createElement("option");
        option.value = value;
        option.textContent = value;
        select.appendChild(option);
    }

    if (values.includes(currentValue)) {
        select.value = currentValue;
    }
}

export function refreshDependentSelects() {
    const suspects = categoryValues("suspects");
    const weapons = categoryValues("weapons");
    const locations = categoryValues("locations");
    const motives = categoryValues("motives");

    element("interviews-list").querySelectorAll(".interview-speaker").forEach(select => {
        const row = select.closest(".interview-row");
        const preferred = row.dataset.speaker || select.value;
        replaceSelectOptions(select, suspects, "Choose speaker", preferred);
        row.dataset.speaker = select.value;
    });

    replaceSelectOptions(element("solution-suspect"), suspects, "Choose culprit");
    replaceSelectOptions(element("solution-weapon"), weapons, "Choose weapon");
    replaceSelectOptions(element("solution-location"), locations, "Choose location");

    const motiveField = element("solution-motive-field");
    motiveField.hidden = motives.length === 0;
    element("solution-motive").required = motives.length > 0;
    replaceSelectOptions(element("solution-motive"), motives, "Choose motive");
    refreshCustomSelects();
}

function normalizeNameList(category, rows, strict) {
    const names = rows.map(row => row.querySelector(".entity-name").value.trim());

    if (strict && names.some(name => !name)) {
        throw new Error(`${category} contains an empty name.`);
    }

    const usedNames = names.filter(Boolean);
    const normalized = usedNames.map(name => name.toLocaleLowerCase());
    if (strict && new Set(normalized).size !== normalized.length) {
        throw new Error(`${category} contains duplicate names.`);
    }
    return usedNames;
}

function collectAttributes(row, strict) {
    const attributes = {};

    for (const attributeRow of row.querySelectorAll(".attribute-row")) {
        const key = attributeRow.querySelector(".attribute-key").value.trim();
        const kind = attributeRow.querySelector(".attribute-kind").value;
        const valueElement = attributeRow.querySelector(".attribute-value");

        if (!key) {
            if (strict) {
                throw new Error("Every attribute needs a key.");
            }
            continue;
        }
        if (Object.hasOwn(attributes, key)) {
            if (strict) {
                throw new Error(`Duplicate attribute key: ${key}.`);
            }
            continue;
        }

        if (kind === "number") {
            const number = Number(valueElement.value);
            if (!Number.isFinite(number)) {
                if (strict) {
                    throw new Error(`Attribute "${key}" must be a number.`);
                }
                continue;
            }
            attributes[key] = { kind, number };
        } else if (kind === "bool") {
            attributes[key] = { kind, bool: valueElement.value === "true" };
        } else {
            const string = valueElement.value.trim();
            if (!string && strict) {
                throw new Error(`Attribute "${key}" needs a value.`);
            }
            if (string) {
                attributes[key] = { kind: "string", string };
            }
        }
    }

    return attributes;
}

export function getEntityDraft(category) {
    const rows = Array.from(listContainer(category).querySelectorAll(".entity-card"));
    return rows.map(row => ({
        name: row.querySelector(".entity-name").value.trim(),
        icon: row.querySelector(".entity-icon")?.value.trim() ?? "",
        attributes: collectAttributes(row, false)
    })).filter(entity => entity.name);
}

function collectCategory(category, strict) {
    const rows = Array.from(listContainer(category).querySelectorAll(".entity-card"));
    const names = normalizeNameList(category, rows, strict);
    const details = {};
    const icons = {};

    rows.forEach(row => {
        const name = row.querySelector(".entity-name").value.trim();
        if (!name) {
            return;
        }
        details[name] = { attributes: collectAttributes(row, strict) };

        if (category === "suspects") {
            const icon = row.querySelector(".entity-icon").value.trim();
            if (strict && !icon) {
                throw new Error(`Suspect "${name}" needs an icon ID.`);
            }
            icons[name] = icon;
        }
    });

    return { names, details, icons };
}

function collectInterviews(strict) {
    const interviews = Array.from(element("interviews-list").querySelectorAll(".interview-row")).map(row => ({
        speaker: row.querySelector(".interview-speaker").value,
        statement: row.querySelector(".interview-statement").value.trim()
    }));

    if (strict) {
        for (const interview of interviews) {
            if (!interview.speaker) {
                throw new Error("Every interview needs a speaker.");
            }
            if (!interview.statement) {
                throw new Error(`Interview for "${interview.speaker}" has no statement.`);
            }
        }
    }
    return interviews.filter(interview => interview.speaker || interview.statement);
}

function collectClues(strict) {
    const clues = Array.from(element("clues-list").querySelectorAll(".clue-text"))
        .map(input => input.value.trim());

    if (strict && clues.some(clue => !clue)) {
        throw new Error("Every clue card needs text.");
    }
    return clues.filter(Boolean);
}

function validateCategoryCounts(suspects, weapons, locations, motives) {
    if (suspects.length < 3 || suspects.length > 5) {
        throw new Error("Use between three and five suspects.");
    }
    if (weapons.length !== suspects.length || locations.length !== suspects.length) {
        throw new Error("Suspects, weapons and locations must have equal counts.");
    }
    if (motives.length > 0 && motives.length !== suspects.length) {
        throw new Error("Motives must be empty or match the other category counts.");
    }
}

function parsePositiveInteger(rawValue, fieldName) {
    const normalized = String(rawValue).trim();
    if (!/^\d+$/.test(normalized)) {
        throw new Error(`${fieldName} must be a positive integer.`);
    }
    const value = Number(normalized);
    if (!Number.isSafeInteger(value) || value <= 0) {
        throw new Error(`${fieldName} must be a positive safe integer.`);
    }
    return value;
}

function validatePuzzleReferences(puzzle) {
    if (!/^\d+$/.test(puzzle.caseNumber)) {
        throw new Error("Case number must contain digits only.");
    }
    if (puzzle.clues.length === 0) {
        throw new Error("Add at least one clue.");
    }
    if (!puzzle.suspects.includes(puzzle.solution.suspect)) {
        throw new Error("Choose the culprit in the Solution section.");
    }
    if (!puzzle.weapons.includes(puzzle.solution.weapon)) {
        throw new Error("Choose the solution weapon.");
    }
    if (!puzzle.locations.includes(puzzle.solution.location)) {
        throw new Error("Choose the solution location.");
    }
    if (puzzle.motives && !puzzle.motives.includes(puzzle.solution.motive)) {
        throw new Error("Choose the solution motive.");
    }
    for (const interview of puzzle.interviews) {
        if (!puzzle.suspects.includes(interview.speaker)) {
            throw new Error(`Interview speaker "${interview.speaker}" is not a suspect.`);
        }
    }
}

export function buildPuzzle(strict = true) {
    if (strict && !form.reportValidity()) {
        throw new Error("Complete the highlighted required fields.");
    }

    const suspects = collectCategory("suspects", strict);
    const weapons = collectCategory("weapons", strict);
    const locations = collectCategory("locations", strict);
    const motives = collectCategory("motives", strict);

    if (strict) {
        validateCategoryCounts(suspects.names, weapons.names, locations.names, motives.names);
    }

    const id = strict
        ? parsePositiveInteger(element("case-id").value, "Case ID")
        : Number(element("case-id").value) || 0;

    const puzzle = {
        id,
        caseNumber: element("case-number").value.trim(),
        title: element("case-title").value.trim(),
        status: element("case-status").value,
        description: element("case-description").value.trim(),
        difficulty: element("case-difficulty").value,
        victim: {
            name: element("victim-name").value.trim(),
            occupation: element("victim-occupation").value.trim(),
            causeOfDeath: element("victim-cause").value.trim()
        },
        incidentReport: element("incident-report").value.trim(),
        interviews: collectInterviews(strict),
        suspects: suspects.names,
        suspectIcons: suspects.icons,
        weapons: weapons.names,
        locations: locations.names,
        suspectDetails: suspects.details,
        weaponDetails: weapons.details,
        locationDetails: locations.details,
        statementRules: {
            culpritLies: true,
            innocentsTellTruth: true
        }
    };

    if (motives.names.length > 0) {
        puzzle.motives = motives.names;
        puzzle.motiveDetails = motives.details;
    }

    if (element("preserve-extra-fields").checked) {
        Object.assign(puzzle, structuredClone(importedExtraFields));
    }

    puzzle.clues = collectClues(strict);
    puzzle.solution = {
        suspect: element("solution-suspect").value,
        weapon: element("solution-weapon").value,
        location: element("solution-location").value
    };

    if (motives.names.length > 0) {
        puzzle.solution.motive = element("solution-motive").value;
    }

    if (strict) {
        validatePuzzleReferences(puzzle);
    }
    return puzzle;
}

export function puzzleJSON(puzzle) {
    return JSON.stringify(puzzle, null, 2);
}

export function caseFilename(puzzle) {
    return Number.isFinite(Number(puzzle.id)) ? `case${Number(puzzle.id)}.json` : "case.json";
}

export function downloadJSON(value, filename) {
    const blob = new Blob([JSON.stringify(value, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 0);
}

export async function copyText(text) {
    if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
        return;
    }

    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand("copy");
    textarea.remove();
}

function updatedRegistryForPuzzle(puzzle) {
    const copy = structuredClone(genreRegistry);
    const caseId = String(puzzle.id);
    const selectedGenre = element("case-genre").value;

    if (selectedGenre === copy.defaultGenre) {
        delete copy.caseGenres[caseId];
    } else {
        copy.caseGenres[caseId] = selectedGenre;
    }
    return copy;
}

function resetDynamicLists() {
    for (const category of categoryNames) {
        listContainer(category).replaceChildren();
    }
    element("interviews-list").replaceChildren();
    element("clues-list").replaceChildren();
}

function setInputValue(id, value = "") {
    element(id).value = value ?? "";
}

function populateEntityCategory(category, data) {
    const names = Array.isArray(data[category]) ? data[category] : [];
    const details = data[detailKeys[category]] ?? {};
    const icons = category === "suspects" ? data.suspectIcons ?? {} : {};

    for (const name of names) {
        appendEntity(category, {
            name,
            icon: icons[name] ?? "",
            attributes: details[name]?.attributes ?? {}
        }, { force: true });
    }
}

function populateForm(data) {
    resetDynamicLists();

    setInputValue("case-id", data.id);
    setInputValue("case-number", data.caseNumber ?? data.id);
    element("case-number").dataset.manual = "true";
    setInputValue("case-title", data.title);
    setInputValue("case-status", data.status ?? "OPEN");
    setInputValue("case-difficulty", data.difficulty ?? "Easy");
    setInputValue("case-description", data.description);
    setInputValue("victim-name", data.victim?.name);
    setInputValue("victim-occupation", data.victim?.occupation);
    setInputValue("victim-cause", data.victim?.causeOfDeath);
    setInputValue("incident-report", data.incidentReport);

    for (const category of categoryNames) {
        populateEntityCategory(category, data);
    }
    for (const interview of Array.isArray(data.interviews) ? data.interviews : []) {
        appendInterview(interview);
    }
    for (const clue of Array.isArray(data.clues) ? data.clues : []) {
        appendClue(clue);
    }

    refreshDependentSelects();
    element("solution-suspect").value = data.solution?.suspect ?? "";
    element("solution-weapon").value = data.solution?.weapon ?? "";
    element("solution-location").value = data.solution?.location ?? "";
    element("solution-motive").value = data.solution?.motive ?? "";

    const numericCaseId = String(Number.parseInt(data.id, 10));
    const assignedGenre = data.genre || genreRegistry.caseGenres[numericCaseId] || genreRegistry.defaultGenre;
    if (genreRegistry.genres[assignedGenre]) {
        element("case-genre").value = assignedGenre;
    }

    importedExtraFields = Object.fromEntries(
        Object.entries(data).filter(([key]) => !editableTopLevelKeys.has(key))
    );
    const hasExtras = Object.keys(importedExtraFields).length > 0;
    element("imported-fields-panel").hidden = !hasExtras;
    element("preserve-extra-fields").checked = false;

    refreshEntityIndexes();
    refreshClueIndexes();
    updateEditorOverview();
    refreshCustomSelects();
    announceRowsChanged("case-imported");
}

async function importJSONFile(file) {
    const text = await file.text();
    const data = JSON.parse(text);
    if (!data || typeof data !== "object" || Array.isArray(data)) {
        throw new Error("The imported file must contain one case object.");
    }
    populateForm(data);
}

function updateProgress() {
    const requiredFields = Array.from(form.querySelectorAll("[required]"))
        .filter(field => !field.closest("[hidden]"));
    const completedRequired = requiredFields.filter(field => field.value.trim() && field.checkValidity()).length;

    const counts = {
        suspects: categoryValues("suspects").length,
        weapons: categoryValues("weapons").length,
        locations: categoryValues("locations").length,
        motives: categoryValues("motives").length
    };
    const countsReady = counts.suspects >= 3 && counts.suspects <= 5 &&
        counts.weapons === counts.suspects && counts.locations === counts.suspects &&
        (counts.motives === 0 || counts.motives === counts.suspects);
    const cluesReady = element("clues-list").querySelectorAll(".clue-text").length > 0;

    const fieldScore = requiredFields.length ? completedRequired / requiredFields.length : 0;
    const structuralScore = (Number(countsReady) + Number(cluesReady)) / 2;
    const percent = Math.round((fieldScore * 0.82 + structuralScore * 0.18) * 100);

    element("editor-progress-value").textContent = `${percent}%`;
    element("editor-progress-bar").style.width = `${percent}%`;
    element("editor-progress-label").textContent = percent >= 100
        ? "Ready to test"
        : percent >= 70
            ? "Finish the deduction"
            : percent >= 35
                ? "Case taking shape"
                : "Start the file";
}

function updateCounts() {
    const map = {
        suspects: "rail-suspect-count",
        weapons: "rail-weapon-count",
        locations: "rail-location-count",
        motives: "rail-motive-count"
    };
    for (const [category, id] of Object.entries(map)) {
        element(id).textContent = String(listContainer(category).querySelectorAll(".entity-card").length);
    }
}

function updateEditorOverview() {
    updateCounts();
    updateProgress();
    document.querySelectorAll(".entity-card").forEach(updateAttributeCount);
}

function removeEntity(button) {
    const card = button.closest(".entity-card");
    const category = card.dataset.category;
    const count = listContainer(category).querySelectorAll(".entity-card").length;

    if (coreCategories.has(category) && count <= 3) {
        setStatus(`Keep at least three ${category}.`, "error");
        return;
    }

    removeWithAnimation(card, () => {
        refreshEntityIndexes();
        refreshDependentSelects();
        updateEditorOverview();
        announceRowsChanged("entity-removed");
    });
}

function bindCoreEvents() {
    form.addEventListener("submit", event => event.preventDefault());

    document.addEventListener("click", event => {
        const addEntity = event.target.closest("[data-add-entity]");
        if (addEntity) {
            appendEntity(addEntity.dataset.addEntity);
            return;
        }

        const removeEntityButton = event.target.closest("[data-remove-entity]");
        if (removeEntityButton) {
            removeEntity(removeEntityButton);
            return;
        }

        const addAttribute = event.target.closest("[data-add-attribute]");
        if (addAttribute) {
            const card = addAttribute.closest(".entity-card");
            const row = createAttributeRow();
            card.querySelector(".attribute-list").appendChild(row);
            card.querySelector(".attribute-editor").open = true;
            updateAttributeCount(card);
            animateIn(row);
            announceRowsChanged("attribute-added");
            return;
        }

        const removeAttribute = event.target.closest("[data-remove-attribute]");
        if (removeAttribute) {
            const row = removeAttribute.closest(".attribute-row");
            const card = row.closest(".entity-card");
            removeWithAnimation(row, () => {
                updateAttributeCount(card);
                announceRowsChanged("attribute-removed");
            });
            return;
        }

        const removeInterview = event.target.closest("[data-remove-interview]");
        if (removeInterview) {
            removeWithAnimation(removeInterview.closest(".interview-row"), () => {
                updateEditorOverview();
                announceRowsChanged("interview-removed");
            });
            return;
        }

        const removeClue = event.target.closest("[data-remove-clue]");
        if (removeClue) {
            removeWithAnimation(removeClue.closest(".clue-row"), () => {
                refreshClueIndexes();
                updateEditorOverview();
                announceRowsChanged("clue-removed");
            });
        }
    });

    document.addEventListener("change", event => {
        if (event.target.matches(".attribute-kind")) {
            renderAttributeValue(event.target.closest(".attribute-row"), event.target.value);
            announceRowsChanged("attribute-type-changed");
        }
        if (event.target.matches(".interview-speaker")) {
            event.target.closest(".interview-row").dataset.speaker = event.target.value;
        }
        updateEditorOverview();
    });

    let dependentRefreshTimer = 0;
    document.addEventListener("input", event => {
        if (event.target.matches(".entity-name")) {
            window.clearTimeout(dependentRefreshTimer);
            dependentRefreshTimer = window.setTimeout(() => {
                refreshDependentSelects();
                announceRowsChanged("entity-name-changed");
            }, 90);
        }
        updateEditorOverview();
    });

    element("add-interview").addEventListener("click", () => appendInterview());
    element("add-clue").addEventListener("click", () => appendClue());

    element("case-id").addEventListener("input", event => {
        if (element("case-number").dataset.manual === "true") {
            return;
        }
        const digits = event.target.value.replace(/\D/g, "");
        element("case-number").value = digits ? digits.padStart(3, "0") : "";
        updateEditorOverview();
    });

    element("case-number").addEventListener("input", () => {
        element("case-number").dataset.manual = "true";
    });

    element("download-registry").addEventListener("click", () => {
        try {
            const puzzle = buildPuzzle(true);
            downloadJSON(updatedRegistryForPuzzle(puzzle), "genres.json");
            setStatus("Updated genre registry downloaded.", "success");
        } catch (error) {
            setStatus(error.message, "error");
        }
    });

    element("import-json").addEventListener("change", async event => {
        const file = event.target.files?.[0];
        if (!file) {
            return;
        }
        try {
            await importJSONFile(file);
            setStatus("Existing case imported. Solver facts remain separate and can now be rebuilt.", "success");
        } catch (error) {
            setStatus(`Import failed: ${error.message}`, "error");
        } finally {
            event.target.value = "";
        }
    });

    const sectionObserver = new IntersectionObserver(entries => {
        for (const entry of entries) {
            if (!entry.isIntersecting) {
                continue;
            }
            document.querySelectorAll(".workshop-nav a").forEach(link => {
                link.classList.toggle("is-active", link.getAttribute("href") === `#${entry.target.id}`);
            });
        }
    }, { rootMargin: "-18% 0px -68% 0px", threshold: 0 });

    document.querySelectorAll(".editor-section[id]").forEach(section => sectionObserver.observe(section));
}

function populateGenres() {
    const select = element("case-genre");
    select.replaceChildren();

    const genres = getEnabledGenres(genreRegistry);
    for (const genre of genres) {
        const option = document.createElement("option");
        option.value = genre.id;
        option.textContent = genre.label;
        select.appendChild(option);
    }
    select.value = genreRegistry.defaultGenre;
}

function populateDefaults() {
    for (let index = 0; index < 3; index += 1) {
        appendEntity("suspects", {}, { force: true });
        appendEntity("weapons", {}, { force: true });
        appendEntity("locations", {}, { force: true });
        appendInterview();
    }
    appendClue();
    appendClue();
}

async function init() {
    try {
        genreRegistry = await loadGenreRegistry();
    } catch (error) {
        console.warn("Genre registry unavailable; using a safe fallback.", error);
        genreRegistry = {
            defaultGenre: "classic",
            caseGenres: {},
            genres: {
                classic: {
                    label: "Classic Mystery",
                    enabled: true
                }
            }
        };
    }

    populateGenres();
    initCustomSelects();
    bindCoreEvents();
    populateDefaults();

    initAuthoredValidation({
        form,
        buildPuzzle,
        setStatus,
        downloadJSON,
        copyText,
        caseFilename,
        getEntityDraft,
        updateEditorOverview
    });

    updateEditorOverview();
    refreshCustomSelects();
    setStatus("");
}

init().catch(error => {
    console.error(error);
    setStatus(`The editor could not start: ${error.message}`, "error");
});
