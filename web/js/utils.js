function abbreviation(text) {

    const words = text.split(" ");

    if (words.length === 1) {
        return text.slice(0, 2).toUpperCase();
    }

    return words
        .map(word => word[0])
        .join("")
        .toUpperCase();
}

function createCell(value) {

    const cell =
        document.createElement("div");

    cell.className =
        "grid-cell";

    cell.textContent =
        value;

    if (value === "✓") {
        cell.classList.add("cell-yes");
    }

    if (value === "✗") {
        cell.classList.add("cell-no");
    }

    return cell;
}