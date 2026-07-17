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