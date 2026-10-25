
document.addEventListener("DOMContentLoaded", function () {
    function attachFilter(config) {
        const filter = document.getElementById(config.filterId);
        const section = document.querySelector(config.sectionSelector);

        if (!filter || !section) {
            return;
        }

        const buttons = Array.from(
            filter.querySelectorAll(".news-filter-btn")
        );

        const cards = Array.from(
            section.querySelectorAll(config.cardSelector)
        );

        function applyFilter(selectedType) {
            let visibleCount = 0;

            cards.forEach(function (card) {
                const cardType = (
                    card.getAttribute("data-news-type") || ""
                ).trim();

                const matchesCategory =
                    selectedType === "" || cardType === selectedType;

                const withinLimit =
                    visibleCount < config.maxVisible;

                const shouldShow = matchesCategory && withinLimit;

                card.hidden = !shouldShow;

                if (shouldShow) {
                    visibleCount++;
                }
            });

            buttons.forEach(function (button) {
                const buttonType = (
                    button.getAttribute("data-type") || ""
                ).trim();

                const isActive = buttonType === selectedType;

                button.classList.toggle("active", isActive);
                button.setAttribute(
                    "aria-pressed",
                    String(isActive)
                );
            });
        }

        buttons.forEach(function (button) {
            button.addEventListener("click", function () {
                const selectedType = (
                    button.getAttribute("data-type") || ""
                ).trim();

                applyFilter(selectedType);
            });
        });

        // Apply the default "All" filter on page load.
        applyFilter("");
    }

    // News: show a maximum of three matching cards.
    attachFilter({
        filterId: "news-type-filter",
        sectionSelector: "section.news",
        cardSelector: ".news-card",
        maxVisible: 3
    });

    // Activities: show all matching cards.
    attachFilter({
        filterId: "activities-type-filter",
        sectionSelector: "section.activities",
        cardSelector: ".activities-card",
        maxVisible: 3
    });
});
