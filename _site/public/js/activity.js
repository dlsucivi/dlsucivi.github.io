
/* =========================================================
   DLSU-CIVI ACTIVITIES PAGE
   File: public/js/activity.js
   ========================================================= */

document.addEventListener("DOMContentLoaded", () => {
    const dataElement = document.getElementById("activity-data");
    const configElement = document.getElementById("activity-config");

    if (!dataElement || !configElement) {
        return;
    }

    let activities = [];

    try {
        activities = JSON.parse(dataElement.textContent || "[]");
    } catch (error) {
        console.error("Unable to parse activity data:", error);
        return;
    }

    if (!Array.isArray(activities)) {
        console.error("The activity data must be an array.");
        return;
    }

    const detailsBase = configElement.dataset.detailsUrl || "/activities/";
    const imageBase = configElement.dataset.imageBase || "/public/images/activities/";
    const fallbackImage =
        configElement.dataset.fallbackImage || "/public/images/civi2026.png";

    const ITEMS_PER_YEAR = 6;

    /*
     * Parse dates such as:
     *   2026 October 17
     *   2025 November 19
     *   October 17, 2026
     *
     * Returns null for dates that cannot be parsed.
     */
    function parseActivityDate(dateValue) {
        if (!dateValue) {
            return null;
        }

        const value = String(dateValue).trim();

        // Format: YYYY Month DD
        let match = value.match(
            /^(\d{4})\s+([A-Za-z]+)\s+(\d{1,2})$/
        );

        if (match) {
            const [, year, month, day] = match;
            const parsed = new Date(`${month} ${day}, ${year}`);

            if (!Number.isNaN(parsed.getTime())) {
                return parsed;
            }
        }

        // Format: Month DD, YYYY
        match = value.match(
            /^([A-Za-z]+)\s+(\d{1,2}),?\s+(\d{4})$/
        );

        if (match) {
            const [, month, day, year] = match;
            const parsed = new Date(`${month} ${day}, ${year}`);

            if (!Number.isNaN(parsed.getTime())) {
                return parsed;
            }
        }

        // Fallback for other browser-parseable date strings.
        const fallback = new Date(value);

        return Number.isNaN(fallback.getTime()) ? null : fallback;
    }

    /*
     * Prepare a normalized record without modifying the source data.
     */
    const normalizedActivities = activities
        .map((activity, originalIndex) => {
            const date = parseActivityDate(activity.date);
            const type = String(activity.type || "").trim().toLowerCase();

            let category = null;

            if (type.includes("lecture")) {
                category = "lecture";
            } else if (type.includes("workshop")) {
                category = "workshop";
            }

            return {
                ...activity,
                _date: date,
                _year: date ? date.getFullYear() : null,
                _category: category,
                _originalIndex: originalIndex
            };
        })
        .filter(activity => activity._category && activity._date);

    /*
     * Sort newest first. The original data order is retained
     * when two activities have the same date.
     */
    normalizedActivities.sort((a, b) => {
        const difference = b._date.getTime() - a._date.getTime();

        return difference || a._originalIndex - b._originalIndex;
    });

    function createElement(tagName, className, text) {
        const element = document.createElement(tagName);

        if (className) {
            element.className = className;
        }

        if (text !== undefined && text !== null) {
            element.textContent = text;
        }

        return element;
    }

    function createActivityCard(activity) {
        const article = createElement("article", "activity-card");
        const link = createElement("a", "activity-card-link");

        const categoryLabel =
            activity._category === "lecture"
                ? "Academic Lecture"
                : "Tech Workshop";

        const categoryClass =
            activity._category === "lecture"
                ? "category-lecture"
                : "category-workshop";

        const title = String(activity.title || "CIVI Activity");
        const slug = String(activity.slug || "");
        const imageName = String(activity.image || "").trim();

        link.href = slug
            ? `${detailsBase}?id=${encodeURIComponent(slug)}`
            : detailsBase;

        link.setAttribute("aria-label", `View ${title}`);

        // Activity image
        const imageContainer = createElement("div", "activity-card-image");
        const image = document.createElement("img");

        image.src = imageName
            ? `${imageBase}${imageName.split("/").map(encodeURIComponent).join("/")}`
            : fallbackImage;

        image.alt = `Image for ${title}`;
        image.loading = "lazy";
        image.decoding = "async";

        image.addEventListener("error", () => {
            if (image.src !== new URL(fallbackImage, window.location.href).href) {
                image.src = fallbackImage;
            }
        }, { once: true });

        imageContainer.appendChild(image);

        // Card content
        const content = createElement("div", "activity-card-content");

        const category = createElement(
            "span",
            `activity-category ${categoryClass}`,
            categoryLabel
        );

        const date = createElement(
            "p",
            "activity-card-date",
            activity.date || ""
        );

        const heading = createElement("h3", "", title);

        content.appendChild(category);
        content.appendChild(date);
        content.appendChild(heading);

        if (activity.presenter) {
            const presenter = createElement("p", "activity-card-presenter");

            const label = createElement("strong", "", "Presenter: ");
            presenter.appendChild(label);
            presenter.appendChild(
                document.createTextNode(String(activity.presenter))
            );

            content.appendChild(presenter);
        }

        const summaryText = activity.abstract || activity.summary;

        if (summaryText) {
            const summary = createElement("p", "activity-card-summary");

            // Abstracts may contain newlines or basic HTML.
            // Strip markup before inserting the text into the card.
            const temporary = document.createElement("div");
            temporary.innerHTML = String(summaryText);

            const plainText = (temporary.textContent || temporary.innerText || "")
                .replace(/\s+/g, " ")
                .trim();

            summary.textContent =
                plainText.length > 180
                    ? `${plainText.slice(0, 177).trimEnd()}…`
                    : plainText;

            content.appendChild(summary);
        }

        const actionLabel =
            activity._category === "lecture"
                ? "View lecture"
                : "View workshop";

        const action = createElement("span", "activity-card-action");
        action.appendChild(document.createTextNode(actionLabel + " "));

        const arrow = createElement("span", "", "→");
        arrow.setAttribute("aria-hidden", "true");
        action.appendChild(arrow);

        content.appendChild(action);

        link.appendChild(imageContainer);
        link.appendChild(content);
        article.appendChild(link);

        return article;
    }

    /*
     * Build and manage one independent section.
     */

function initializeSection({
    category,
    filterId,
    gridId,
    emptyId,
    resultsId
    }) {
        const filter = document.getElementById(filterId);
        const grid = document.getElementById(gridId);
        const emptyMessage = document.getElementById(emptyId);
        const results = document.getElementById(resultsId);

        if (!filter || !grid || !emptyMessage || !results) {
            return;
        }

        const sectionActivities = normalizedActivities.filter(
            activity => activity._category === category
        );

        const years = [
            ...new Set(
                sectionActivities.map(activity => activity._year)
            )
        ].sort((a, b) => b - a);

        // "All" is selected by default.
        let selectedYear = "all";

        filter.replaceChildren();
        grid.replaceChildren();

        if (sectionActivities.length === 0) {
            emptyMessage.hidden = false;
            results.textContent = "";
            return;
        }

        // Create the All button first, followed by individual years.
        const filterOptions = [
            { value: "all", label: "All" },
            ...years.map(year => ({
                value: String(year),
                label: String(year)
            }))
        ];

        const buttons = new Map();

        filterOptions.forEach(option => {
            const button = createElement(
                "button",
                "activity-year-btn",
                option.label
            );

            button.type = "button";
            button.dataset.year = option.value;
            button.setAttribute("aria-pressed", "false");

            button.addEventListener("click", () => {
                selectedYear = option.value;
                render();
            });

            filter.appendChild(button);
            buttons.set(option.value, button);
        });

        function render() {
            buttons.forEach((button, value) => {
                const isActive = value === selectedYear;

                button.classList.toggle("active", isActive);
                button.setAttribute("aria-pressed", String(isActive));

                if (isActive) {
                    button.setAttribute("aria-current", "true");
                } else {
                    button.removeAttribute("aria-current");
                }
            });

            // Activities are already sorted newest first.
            const matchingActivities = sectionActivities
                .filter(activity =>
                    selectedYear === "all" ||
                    String(activity._year) === selectedYear
                )
                .slice(0, ITEMS_PER_YEAR);

            grid.replaceChildren();

            matchingActivities.forEach(activity => {
                grid.appendChild(createActivityCard(activity));
            });

            emptyMessage.hidden = matchingActivities.length > 0;

            if (matchingActivities.length > 0) {
                const activityLabel =
                    category === "lecture" ? "lectures" : "workshops";

                const yearLabel =
                    selectedYear === "all" ? "across all years" : `from ${selectedYear}`;

                results.textContent =
                    `Showing ${matchingActivities.length} latest ${activityLabel} ${yearLabel}.`;
            } else {
                results.textContent = "";
            }
        }

        render();
    }


    initializeSection({
        category: "lecture",
        filterId: "lectures-year-filter",
        gridId: "lectures-grid",
        emptyId: "lectures-empty",
        resultsId: "lectures-results"
    });

    initializeSection({
        category: "workshop",
        filterId: "workshops-year-filter",
        gridId: "workshops-grid",
        emptyId: "workshops-empty",
        resultsId: "workshops-results"
    });
});
