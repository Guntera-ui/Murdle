# Murdle

A browser-based deduction game inspired by Murdle.

The project consists of a Go backend that serves puzzle data and a vanilla JavaScript frontend responsible for rendering the game board and handling gameplay.

---

## Requirements

- Go 1.24+
- Modern web browser

---

## Running

Clone the repository.

```bash
git clone https://github.com/Guntera-ui/Murdle.git
cd Murdle
```

Start the server.

```bash
go run ./cmd/server
```

Open:

```
http://localhost:8080
```

---

## Project Structure

```
cmd/
    server/

internal/
    handlers/
    models/
    storage/

puzzles/

web/
    assets/
    js/
    archive.css
    style.css
    index.html
    case.html
```

---

## Architecture

### Backend

Responsible for:

- serving static files
- loading puzzle JSON files
- exposing REST endpoints

Endpoints:

```
GET /api/cases
GET /api/puzzle/{id}
```

---

### Frontend

Implemented using vanilla JavaScript.

Responsibilities include:

- rendering puzzle data
- board generation
- clue rendering
- accusation system
- archive page

The frontend contains no framework dependencies.

---

## Puzzle Format

Each puzzle is stored as an individual JSON document.

Example:

```
puzzles/
    case1.json
    case2.json
    case3.json
```

Puzzle files contain:

- metadata
- categories
- clues
- interviews
- incident report
- solution

---

## Adding a New Case

1. Create a new puzzle JSON.

```
puzzles/case#.json
```

2. Ensure the puzzle contains a unique:

```
"id"
```

and

```
"caseNumber"
```

3. Restart the server.

The archive endpoint automatically discovers available cases.

---

## Development

Static assets use cache versioning.

Example:

```
app.js?v=1
style.css?v=1
```

Increment the version whenever JavaScript or CSS changes are deployed.

---

## Design Goals

- no frontend framework
- minimal dependencies
- data-driven puzzles
- readable code
- modular rendering
- separation between rendering and game logic

---

## License

This project is licensed under the MIT License.