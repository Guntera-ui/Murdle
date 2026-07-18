function renderMatrix(
    matrix,
    clickHandler,
    showHeader = true,
    showRowLabels = true
) {

    const rows = matrix.categoryA.items;
    const columns = matrix.categoryB.items;
    const state = matrix.grid;

    const matrixElement =
        document.createElement("div");

    matrixElement.className =
        "matrix";



    if (showHeader) {

        const header =
            document.createElement("div");

        header.className =
            "matrix-row";

        if (showRowLabels) {

            const spacer =
                document.createElement("div");

            spacer.className =
                "header-spacer";

            header.appendChild(
                spacer
            );

        }

        columns.forEach(column => {

            const cell =
                document.createElement("div");

            cell.className =
                "header-cell";

            cell.textContent =
                abbreviation(column);

            header.appendChild(
                cell
            );

        });

        matrixElement.appendChild(
            header
        );

    }



    rows.forEach(rowName => {

        const row =
            document.createElement("div");

        row.className =
            "matrix-row";



        if (showRowLabels) {

            const label =
                document.createElement("div");

            label.className =
                "row-label";

            label.textContent =
                abbreviation(rowName);

            row.appendChild(
                label
            );

        }



        columns.forEach(columnName => {

            const cell =
                createCell(
                    state[rowName][columnName]
                );

            cell.addEventListener(
                "click",
                () => clickHandler(
                    rowName,
                    columnName
                )
            );

            row.appendChild(
                cell
            );

        });

        matrixElement.appendChild(
            row
        );

    });

    return matrixElement;

}
