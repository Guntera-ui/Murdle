// function renderList(items, elementId) {

//     const list =
//         document.getElementById(elementId);

//     list.innerHTML = "";

//     items.forEach(item => {

//         const li =
//             document.createElement("li");

//         li.textContent = item;

//         list.appendChild(li);
//     });
// }

// function createGrid(rows, columns) {

//     const grid = {};

//     rows.forEach(row => {

//         grid[row] = {};

//         columns.forEach(column => {

//             grid[row][column] = "";

//         });
//     });

//     return grid;
// }

// function getNextState(currentState) {

//     if (currentState === "") {
//         return "✓";
//     }

//     if (currentState === "✓") {
//         return "✗";
//     }

//     return "";
// }

// function abbreviation(text) {

//     const words = text.split(" ");

//     if (words.length === 1) {
//         return text.slice(0, 2).toUpperCase();
//     }

//     return words
//         .map(word => word[0])
//         .join("")
//         .toUpperCase();
// }

// function createCell(value) {

//     const cell =
//         document.createElement("div");

//     cell.className =
//         "grid-cell";

//     cell.textContent =
//         value;

//     if (value === "✓") {
//         cell.classList.add("cell-yes");
//     }

//     if (value === "✗") {
//         cell.classList.add("cell-no");
//     }

//     return cell;
// }
// function renderMatrix(
//     rows,
//     columns,
//     state,
//     clickHandler,
//     showHeader = true,
//     showRowLabels = true
// ) {

//     const matrix =
//         document.createElement("div");

//     matrix.className =
//         "matrix";



//     if (showHeader) {

//         const header =
//             document.createElement("div");

//         header.className =
//             "matrix-row";

//         if (showRowLabels) {

//             const spacer =
//                 document.createElement("div");

//             spacer.className =
//                 "header-spacer";

//             header.appendChild(
//                 spacer
//             );
//         }

//         columns.forEach(column => {

//             const cell =
//                 document.createElement("div");

//             cell.className =
//                 "header-cell";

//             cell.textContent =
//                 abbreviation(column);

//             header.appendChild(
//                 cell
//             );
//         });

//         matrix.appendChild(
//             header
//         );
//     }



//     rows.forEach(rowName => {

//         const row =
//             document.createElement("div");

//         row.className =
//             "matrix-row";



//         if (showRowLabels) {

//             const label =
//                 document.createElement("div");

//             label.className =
//                 "row-label";

//             label.textContent =
//                 abbreviation(rowName);

//             row.appendChild(
//                 label
//             );
//         }



//         columns.forEach(columnName => {

//             const cell =
//                 createCell(
//                     state[rowName][columnName]
//                 );

//             cell.addEventListener(
//                 "click",
//                 () => clickHandler(
//                     rowName,
//                     columnName
//                 )
//             );

//             row.appendChild(
//                 cell
//             );
//         });

//         matrix.appendChild(
//             row
//         );
//     });

//     return matrix;
// }



// function renderMasterGrid(
//     suspects,
//     weapons,
//     locations,
//     weaponGrid,
//     locationGrid,
//     weaponLocationGrid
// ) {

//     const container =
//         document.getElementById(
//             "master-grid"
//         );

//     container.innerHTML = "";



//     const board =
//         document.createElement("div");

//     board.className =
//         "master-board";



//     const weaponSuspectMatrix =
//         renderMatrix(
//             weapons,
//             suspects,
//             weaponGrid,
//             (weapon, suspect) => {

//                 weaponGrid[weapon][suspect] =
//                     getNextState(
//                         weaponGrid[weapon][suspect]
//                     );

//                 renderMasterGrid(
//                     suspects,
//                     weapons,
//                     locations,
//                     weaponGrid,
//                     locationGrid,
//                     weaponLocationGrid
//                 );
//             },
//             true,
//             true
//         );



//     const weaponLocationMatrix =
//         renderMatrix(
//             weapons,
//             locations,
//             weaponLocationGrid,
//             (weapon, location) => {

//                 weaponLocationGrid[weapon][location] =
//                     getNextState(
//                         weaponLocationGrid[weapon][location]
//                     );

//                 renderMasterGrid(
//                     suspects,
//                     weapons,
//                     locations,
//                     weaponGrid,
//                     locationGrid,
//                     weaponLocationGrid
//                 );
//             },
//             true,
//             false
//         );



//     const locationSuspectMatrix =
//         renderMatrix(
//             locations,
//             suspects,
//             locationGrid,
//             (location, suspect) => {

//                 locationGrid[location][suspect] =
//                     getNextState(
//                         locationGrid[location][suspect]
//                     );

//                 renderMasterGrid(
//                     suspects,
//                     weapons,
//                     locations,
//                     weaponGrid,
//                     locationGrid,
//                     weaponLocationGrid
//                 );
//             },
//             false,
//             true
//         );



//     const topRow =
//         document.createElement("div");

//     topRow.className =
//         "board-top";

//     topRow.appendChild(
//         weaponSuspectMatrix
//     );

//     topRow.appendChild(
//         weaponLocationMatrix
//     );



//     const bottomRow =
//         document.createElement("div");

//     bottomRow.className =
//         "board-bottom";

//     bottomRow.appendChild(
//         locationSuspectMatrix
//     );



//     board.appendChild(
//         topRow
//     );

//     board.appendChild(
//         bottomRow
//     );



//     container.appendChild(
//         board
//     );
// }

// fetch("/api/puzzle/test4")
//     .then(response => response.json())
//     .then(puzzle => {

//         document.getElementById(
//             "title"
//         ).textContent =
//             puzzle.title;

//         renderList(
//             puzzle.suspects,
//             "suspects"
//         );

//         renderList(
//             puzzle.weapons,
//             "weapons"
//         );

//         renderList(
//             puzzle.locations,
//             "locations"
//         );

//         renderList(
//             puzzle.clues,
//             "clues"
//         );

//         const weaponGrid =
//             createGrid(
//                 puzzle.weapons,
//                 puzzle.suspects
//             );

//         const locationGrid =
//             createGrid(
//                 puzzle.locations,
//                 puzzle.suspects
//             );

//         const weaponLocationGrid =
//             createGrid(
//                 puzzle.weapons,
//                 puzzle.locations
//             );

//         renderMasterGrid(
//             puzzle.suspects,
//             puzzle.weapons,
//             puzzle.locations,
//             weaponGrid,
//             locationGrid,
//             weaponLocationGrid
//         );

//     })
//     .catch(error => {

//         console.error(error);

//     });