
document.addEventListener("DOMContentLoaded", function () {
    const filterConfigs = [
        {
            filterId: "news-type-filter",
            maxVisible: 3
        },
        {
            filterId: "activites-type-filter",
            maxVisible: 3
        }
    ];

    filterConfigs.forEach(function (config) {
        const filter = document.getElementById(config.filterId);
        if (!filter) return;

        const section = filter.closest("section.news");
        if (!section) return;

        const buttons = filter.querySelectorAll(".news-filter-btn");
        const cards = Array.from(
            section.querySelectorAll(".news-card")
        );

        function applyFilter(selectedType) {
            let visibleCount = 0;

            cards.forEach(function (card) {
                const matchesType =
                    selectedType === "" ||
                    card.dataset.newsType === selectedType;

                const shouldShow =
                    matchesType &&
                    visibleCount < config.maxVisible;

                card.hidden = !shouldShow;

                if (shouldShow) {
                    visibleCount++;
                }
            });

            buttons.forEach(function (button) {
                const isActive =
                    button.dataset.type === selectedType;

                button.classList.toggle("active", isActive);
                button.setAttribute(
                    "aria-pressed",
                    String(isActive)
                );
            });
        }

        buttons.forEach(function (button) {
            button.addEventListener("click", function () {
                applyFilter(button.dataset.type || "");
            });
        });

        applyFilter("");
    });
});
