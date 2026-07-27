function updateBoard(
    puzzle,
    playerBoard,
    matrixId,
    row,
    column
) {

    markCell(
        playerBoard,
        matrixId,
        row,
        column
    );

    renderMasterGrid(
        puzzle,
        playerBoard
    );

}


function renderMasterGrid(
    puzzle,
    playerBoard
) {

    const workingBoard =
        getWorkingBoard(
            playerBoard
        );

    const container =
        document.getElementById(
            "master-grid"
        );

    container.replaceChildren();

    const boardElement =
        document.createElement(
            "div"
        );

    boardElement.className =
        "master-board";


    const categories =
        createCategories(
            puzzle
        ).list;

    const categoryById =
        new Map(
            categories.map(
                category => [
                    category.id,
                    category
                ]
            )
        );


    const topAxis =
        categories.length === 3

            ? [
                "suspects",
                "locations"
            ]

            : [
                "suspects",
                "motives",
                "locations"
            ];


    const leftAxis =
        categories.length === 3

            ? [
                "weapons",
                "locations"
            ]

            : [
                "weapons",
                "locations",
                "motives"
            ];

    const topRow =
        document.createElement(
            "div"
        );

    topRow.className =
        "board-row";


    const spacer =
        document.createElement(
            "div"
        );

    spacer.className =
        "board-label left";

    topRow.appendChild(
        spacer
    );


    topAxis.forEach(topId => {

        const label =
            document.createElement(
                "div"
            );

        label.className =
            "board-label top";


        const topCategorySize =
            categoryById.get(
                topId
            )?.items.length ?? 3;

        label.style.setProperty(
            "--category-size",
            topCategorySize
        );


        label.textContent =
            getCategoryLabel(
                topId
            );


        topRow.appendChild(
            label
        );

    });


    boardElement.appendChild(
        topRow
    );

    const renderedPairs =
        new Set();


    leftAxis.forEach(
        (
            leftId,
            rowIndex
        ) => {

            const boardRow =
                document.createElement(
                    "div"
                );

            boardRow.className =
                "board-row";


            const leftLabel =
                document.createElement(
                    "div"
                );

            leftLabel.className =
                "board-label left";


            const leftCategorySize =
                categoryById.get(
                    leftId
                )?.items.length ?? 3;

            leftLabel.style.setProperty(
                "--category-size",
                leftCategorySize
            );


            leftLabel.textContent =
                getCategoryLabel(
                    leftId
                );


            boardRow.appendChild(
                leftLabel
            );


            topAxis.forEach(
                (
                    topId,
                    columnIndex
                ) => {

                    if (leftId === topId) {
                        return;
                    }


                    const pairKey =
                        [
                            leftId,
                            topId
                        ]
                            .sort()
                            .join("|");

                    if (
                        renderedPairs.has(
                            pairKey
                        )
                    ) {
                        return;
                    }


                    renderedPairs.add(
                        pairKey
                    );


                    const playerMatrix =
                        getMatrixByCategories(
                            playerBoard,
                            leftId,
                            topId
                        );


                    if (!playerMatrix) {
                        return;
                    }


                    const workingMatrix =
                        getMatrixByCategories(
                            workingBoard,
                            leftId,
                            topId
                        );


                    const matrixElement =
                        renderMatrix(

                            playerMatrix,
                            workingMatrix,

                            (
                                row,
                                column
                            ) => {

                                updateBoard(
                                    puzzle,
                                    playerBoard,
                                    playerMatrix.id,
                                    row,
                                    column
                                );

                            },

                            leftId,
                            topId,

                            rowIndex === 0,
                            columnIndex === 0

                        );


                    boardRow.appendChild(
                        matrixElement
                    );

                }
            );

            if (
                boardRow.children.length > 1
            ) {

                boardElement.appendChild(
                    boardRow
                );

            }

        }
    );


    container.appendChild(
        boardElement
    );

}


function getCategoryLabel(id) {

    switch (id) {

        case "suspects":
            return "PERSONS OF INTEREST";

        case "weapons":
            return "KNOWN WEAPONS";

        case "locations":
            return "CRIME SCENES";

        case "motives":
            return "POSSIBLE MOTIVES";

        default:
            return id;

    }

}