function renderMatrix(
    playerMatrix,
    workingMatrix,
    clickHandler,
    showHeader = true,
    showRowLabels = true
){
    const rows =
        workingMatrix.categoryA.items;

    const columns =
        workingMatrix.categoryB.items;

    const state =
        workingMatrix.grid;
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

        const playerValue =
            playerMatrix.grid[rowName][columnName];

        const workingValue =
            workingMatrix.grid[rowName][columnName];
                const {
            element: cell,
            isSolverMark
        } = createCell(
            playerValue,
            workingValue
        );

        cell.addEventListener(
            "click",
            () => {

                if (isSolverMark) {
                    return;
                }

                clickHandler(
                    rowName,
                    columnName
                );

            }
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
