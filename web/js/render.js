function renderList(items, elementId) {

    const list =
        document.getElementById(elementId);

    list.innerHTML = "";

    items.forEach(item => {

        const li =
            document.createElement("li");

        li.textContent = item;

        list.appendChild(li);
    });
}

function renderCategories(categories) {

    const container =
        document.getElementById(
            "categories"
        );

    container.innerHTML = "";

    categories.forEach(category => {

        const section =
            document.createElement("section");

        section.className =
            "case-section";

        const heading =
            document.createElement("h2");

        heading.textContent =
            category.label;

        const list =
            document.createElement("ul");

        list.id =
            category.id;

        section.appendChild(
            heading
        );

        section.appendChild(
            list
        );

        container.appendChild(
            section
        );

        renderList(
            category.items,
            category.id
        );

    });

}