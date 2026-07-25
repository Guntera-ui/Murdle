function renderMatrix(
    playerMatrix,
    workingMatrix,
    clickHandler,
    verticalCategoryId,
    horizontalCategoryId,
    showHeader = true,
    showRowLabels = true
) {

    const vertical =
        workingMatrix.categoryA.id ===
        verticalCategoryId
            ? workingMatrix.categoryA
            : workingMatrix.categoryB;

    const horizontal =
        workingMatrix.categoryA.id ===
        horizontalCategoryId
            ? workingMatrix.categoryA
            : workingMatrix.categoryB;

    const rows =
        vertical.items;

    const columns =
        horizontal.items;

    const flipped =
        workingMatrix.categoryA.id !==
        vertical.id;

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

            const img =
                document.createElement("img");

            img.src =
                column.icon;

            img.alt =
                column.name;

            img.className =
                "matrix-icon";

            cell.appendChild(
                img
            );

            cell.title =
                column.name;

            header.appendChild(
                cell
            );

        });

        matrixElement.appendChild(
            header
        );

    }



    rows.forEach(rowItem => {

        const row =
            document.createElement("div");

        row.className =
            "matrix-row";



        if (showRowLabels) {

            const label =
                document.createElement("div");

            label.className =
                "row-label";

            const img =
                document.createElement("img");

            img.src =
                rowItem.icon;

            img.alt =
                rowItem.name;

            img.className =
                "matrix-icon";

            label.appendChild(
                img
            );

            label.title =
                rowItem.name;

            row.appendChild(
                label
            );

        }



        columns.forEach(column => {

            const playerValue =
                flipped
                    ? playerMatrix.grid[column.name][rowItem.name]
                    : playerMatrix.grid[rowItem.name][column.name];

            const workingValue =
                flipped
                    ? workingMatrix.grid[column.name][rowItem.name]
                    : workingMatrix.grid[rowItem.name][column.name];

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
                        flipped
                            ? column.name
                            : rowItem.name,
                        flipped
                            ? rowItem.name
                            : column.name
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