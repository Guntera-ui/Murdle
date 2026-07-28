function createMatrixIcon(
    item,
    position
) {

    const wrapper =
        document.createElement(
            "span"
        );

    wrapper.className =
        `matrix-icon-wrapper matrix-icon-wrapper--${position}`;

    wrapper.tabIndex = 0;

    wrapper.setAttribute(
        "aria-label",
        item.name
    );

    const img =
        document.createElement(
            "img"
        );

    img.src =
        item.icon;

    /*
     * The wrapper already has the accessible name,
     * so the image itself does not need to repeat it.
     */
    img.alt = "";

    img.className =
        "matrix-icon";

    const tooltip =
        document.createElement(
            "span"
        );

    tooltip.className =
        "matrix-icon-tooltip";

    tooltip.textContent =
        item.name;

    tooltip.setAttribute(
        "role",
        "tooltip"
    );

    wrapper.append(
        img,
        tooltip
    );

    return wrapper;

}


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
        document.createElement(
            "div"
        );

    matrixElement.className =
        "matrix";


    if (showHeader) {

        const header =
            document.createElement(
                "div"
            );

        header.className =
            "matrix-row";

        if (showRowLabels) {

            const spacer =
                document.createElement(
                    "div"
                );

            spacer.className =
                "header-spacer";

            header.appendChild(
                spacer
            );

        }

        columns.forEach(
            column => {

                const cell =
                    document.createElement(
                        "div"
                    );

                cell.className =
                    "header-cell";

                const icon =
                    createMatrixIcon(
                        column,
                        "column"
                    );

                cell.appendChild(
                    icon
                );

                /*
                 * Do not use cell.title here.
                 * That creates the browser's
                 * black native tooltip.
                 */

                header.appendChild(
                    cell
                );

            }
        );

        matrixElement.appendChild(
            header
        );

    }


    rows.forEach(
        rowItem => {

            const row =
                document.createElement(
                    "div"
                );

            row.className =
                "matrix-row";


            if (showRowLabels) {

                const label =
                    document.createElement(
                        "div"
                    );

                label.className =
                    "row-label";

                const icon =
                    createMatrixIcon(
                        rowItem,
                        "row"
                    );

                label.appendChild(
                    icon
                );

                /*
                 * Do not use label.title here.
                 */

                row.appendChild(
                    label
                );

            }


            columns.forEach(
                column => {

                    const playerValue =
                        flipped
                            ? playerMatrix
                                .grid[column.name][
                                    rowItem.name
                                ]
                            : playerMatrix
                                .grid[rowItem.name][
                                    column.name
                                ];

                    const workingValue =
                        flipped
                            ? workingMatrix
                                .grid[column.name][
                                    rowItem.name
                                ]
                            : workingMatrix
                                .grid[rowItem.name][
                                    column.name
                                ];

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

                                playSound(
                                    "scribing"
                                );

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

                }
            );

            matrixElement.appendChild(
                row
            );

        }
    );

    return matrixElement;

}