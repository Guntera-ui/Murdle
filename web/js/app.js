fetchPuzzle("test4")
    .then(puzzle => {

        document.getElementById(
            "title"
        ).textContent =
            puzzle.title;

        renderList(
            puzzle.suspects,
            "suspects"
        );

        renderList(
            puzzle.weapons,
            "weapons"
        );

        renderList(
            puzzle.locations,
            "locations"
        );

        renderList(
            puzzle.clues,
            "clues"
        );

    const board =
        createBoard(puzzle);

        renderMasterGrid(
            puzzle,
            getWorkingBoard(board)
        );

    })
    .catch(console.error);