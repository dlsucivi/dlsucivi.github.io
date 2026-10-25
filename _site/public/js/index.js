document.addEventListener("DOMContentLoaded", function () {
    const filter = document.querySelector("#news-type-filter");
    if (!filter) return;

    const buttons = filter.querySelectorAll(".news-filter-btn");
    const section = filter.closest(".news");
    const cards = section
        ? Array.from(section.querySelectorAll(".news-card"))
        : [];

    const maxVisible = 3;

    function filterNews(selectedType) {
        let visibleCount = 0;

        cards.forEach(function (card) {
            const matchesType =
                selectedType === "" ||
                card.dataset.newsType === selectedType;

            const shouldShow =
                matchesType && visibleCount < maxVisible;

            card.hidden = !shouldShow;

            if (shouldShow) visibleCount++;
        });

        buttons.forEach(function (button) {
            const isActive = button.dataset.type === selectedType;

            button.classList.toggle("active", isActive);
            button.setAttribute("aria-pressed", String(isActive));
        });
    }

    buttons.forEach(function (button) {
        button.addEventListener("click", function () {
            filterNews(button.dataset.type);
        });
    });

    filterNews("");


});
