// Usa i dati degli eventi importati da events.js
let events = eventsData;

let currentDate = new Date();
currentDate.setDate(1);
let selectedDate = null;

const monthYearElement = document.getElementById('monthYear');
const calendarDaysElement = document.getElementById('calendarDays');
const eventsList = document.getElementById('eventsList');
const eventsTitle = document.getElementById('eventsTitle');
const calendarWrapper = document.querySelector('.calendar-wrapper');
const prevMonthBtn = document.getElementById('prevMonth');
const nextMonthBtn = document.getElementById('nextMonth');
const filterCircuitMenu = document.getElementById('filterCircuitMenu');
const filterOrganizerMenu = document.getElementById('filterOrganizerMenu');
const filterCircuitTrigger = document.getElementById('filterCircuitTrigger');
const filterOrganizerTrigger = document.getElementById('filterOrganizerTrigger');
const filterCircuitOptions = document.getElementById('filterCircuitOptions');
const filterOrganizerOptions = document.getElementById('filterOrganizerOptions');

const selectedFilters = {
    circuits: new Set(),
    organizers: new Set(),
};

prevMonthBtn.addEventListener('click', () => {
    currentDate.setDate(1);
    currentDate.setMonth(currentDate.getMonth() - 1);
    renderCalendar();
    triggerCalendarActionAnimation();
});

nextMonthBtn.addEventListener('click', () => {
    currentDate.setDate(1);
    currentDate.setMonth(currentDate.getMonth() + 1);
    renderCalendar();
    triggerCalendarActionAnimation();
});

setupMultiSelect(filterCircuitMenu, filterCircuitTrigger, 'circuits', 'Tutti i circuiti');
setupMultiSelect(filterOrganizerMenu, filterOrganizerTrigger, 'organizers', 'Tutti gli organizzatori');

document.addEventListener('click', (event) => {
    if (!filterCircuitMenu.contains(event.target)) {
        closeMultiSelect(filterCircuitMenu, filterCircuitTrigger);
    }

    if (!filterOrganizerMenu.contains(event.target)) {
        closeMultiSelect(filterOrganizerMenu, filterOrganizerTrigger);
    }
});

function setupMultiSelect(menuElement, triggerElement, key, defaultLabel) {
    triggerElement.dataset.key = key;
    triggerElement.dataset.defaultLabel = defaultLabel;

    triggerElement.addEventListener('click', () => {
        const isOpen = menuElement.classList.contains('open');

        closeMultiSelect(filterCircuitMenu, filterCircuitTrigger);
        closeMultiSelect(filterOrganizerMenu, filterOrganizerTrigger);

        if (!isOpen) {
            menuElement.classList.add('open');
            triggerElement.setAttribute('aria-expanded', 'true');
        }
    });
}

function closeMultiSelect(menuElement, triggerElement) {
    menuElement.classList.remove('open');
    triggerElement.setAttribute('aria-expanded', 'false');
}

function onFiltersChanged() {
    renderCalendar();
    renderEventsList();
    triggerCalendarActionAnimation();
}

function triggerCalendarActionAnimation() {
    if (!calendarWrapper) {
        return;
    }

    calendarWrapper.classList.remove('action-boost');
    // Force reflow so the animation restarts on every action.
    void calendarWrapper.offsetWidth;
    calendarWrapper.classList.add('action-boost');
}

function getActiveFilters() {
    return {
        circuits: Array.from(selectedFilters.circuits),
        organizers: Array.from(selectedFilters.organizers),
    };
}

function getFilteredEvents() {
    const { circuits, organizers } = getActiveFilters();

    return events.filter(event => {
        const circuitMatch = circuits.length === 0 || circuits.includes(event.circuit);
        const organizerMatch = organizers.length === 0 || organizers.includes(event.organizer);
        return circuitMatch && organizerMatch;
    });
}

function populateFilterOptions() {
    const circuits = [...new Set(events.map(event => event.circuit))].sort((a, b) => a.localeCompare(b, 'it'));
    const organizers = [...new Set(events.map(event => event.organizer))].sort((a, b) => a.localeCompare(b, 'it'));

    renderMultiSelectOptions(filterCircuitOptions, circuits, 'circuits', filterCircuitTrigger);
    renderMultiSelectOptions(filterOrganizerOptions, organizers, 'organizers', filterOrganizerTrigger);
}

function renderMultiSelectOptions(container, values, filterKey, triggerElement) {
    const optionsHtml = values.map((value, index) => {
        const optionId = `${filterKey}-option-${index}`;
        return `
            <label class="multi-select-option" for="${optionId}">
                <input type="checkbox" id="${optionId}" value="${value}" data-filter-key="${filterKey}">
                <span>${value}</span>
            </label>
        `;
    }).join('');

    container.innerHTML = `
        <button type="button" class="multi-select-clear" data-clear-key="${filterKey}">Azzera selezione</button>
        ${optionsHtml}
    `;

    container.querySelectorAll('input[type="checkbox"]').forEach((checkbox) => {
        checkbox.addEventListener('change', (event) => {
            const { value } = event.target;
            if (event.target.checked) {
                selectedFilters[filterKey].add(value);
            } else {
                selectedFilters[filterKey].delete(value);
            }

            updateMultiSelectTrigger(triggerElement, filterKey);
            onFiltersChanged();
        });
    });

    const clearButton = container.querySelector('.multi-select-clear');
    clearButton.addEventListener('click', () => {
        selectedFilters[filterKey].clear();
        container.querySelectorAll('input[type="checkbox"]').forEach((checkbox) => {
            checkbox.checked = false;
        });
        updateMultiSelectTrigger(triggerElement, filterKey);
        onFiltersChanged();
    });

    updateMultiSelectTrigger(triggerElement, filterKey);
}

function updateMultiSelectTrigger(triggerElement, filterKey) {
    const defaultLabel = triggerElement.dataset.defaultLabel;
    const selectedValues = Array.from(selectedFilters[filterKey]);

    if (selectedValues.length === 0) {
        triggerElement.textContent = defaultLabel;
        return;
    }

    if (selectedValues.length === 1) {
        triggerElement.textContent = selectedValues[0];
        return;
    }

    triggerElement.textContent = `${selectedValues.length} selezionati`;
}

function getMonthName(date) {
    const months = [
        'Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno',
        'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre'
    ];
    return months[date.getMonth()];
}

function formatDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function getEventsForDate(dateStr) {
    return getFilteredEvents().filter(event => event.date === dateStr);
}

function getUniqueCircuits(dayEvents) {
    return [...new Set(dayEvents.map(event => event.circuit))];
}

function renderCalendar() {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    monthYearElement.textContent = `${getMonthName(currentDate)} ${year}`;

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const prevLastDay = new Date(year, month, 0);

    const firstDayOfWeek = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1;
    const lastDateOfMonth = lastDay.getDate();
    const lastDateOfPrevMonth = prevLastDay.getDate();

    let html = '';

    // Giorni del mese precedente
    for (let i = firstDayOfWeek - 1; i >= 0; i--) {
        const day = lastDateOfPrevMonth - i;
        html += `<div class="day other-month">${day}</div>`;
    }

    // Giorni del mese corrente
    for (let day = 1; day <= lastDateOfMonth; day++) {
        const date = new Date(year, month, day);
        const dateStr = formatDate(date);
        const today = formatDate(new Date());
        const dayEvents = getEventsForDate(dateStr);
        const uniqueCircuits = getUniqueCircuits(dayEvents);

        let classes = 'day';
        if (dateStr === today) classes += ' today';
        if (selectedDate === dateStr) classes += ' selected';
        if (dayEvents.length > 0) classes += ' has-event';

        const titleText = dayEvents.length > 0
            ? dayEvents.map(event => `${event.title} - ${event.circuit}`).join(' | ')
            : '';

        const organizersHtml = uniqueCircuits
            .map(circuit => `<span class="day-organizer-item">${circuit}</span>`)
            .join('');

        const dayContent = dayEvents.length > 0
            ? `<span class="day-number">${day}</span><div class="day-organizer-list">${organizersHtml}</div><span class="day-event-count">${dayEvents.length}</span>`
            : `<span class="day-number">${day}</span>`;

        html += `<div class="${classes}" data-date="${dateStr}" title="${titleText}">${dayContent}</div>`;
    }

    // Giorni del mese successivo
    const remainingDays = 42 - (firstDayOfWeek + lastDateOfMonth);
    for (let day = 1; day <= remainingDays; day++) {
        html += `<div class="day other-month">${day}</div>`;
    }

    calendarDaysElement.innerHTML = html;

    // Aggiungi event listener ai giorni
    document.querySelectorAll('.day:not(.other-month)').forEach(dayElement => {
        dayElement.addEventListener('click', () => {
            const date = dayElement.getAttribute('data-date');
            selectedDate = date;
            renderCalendar();
            renderEventsList();
        });
    });
}

function renderEventsList() {
    if (!selectedDate) {
        eventsList.innerHTML = '<p class="no-events">Nessun evento selezionato</p>';
        eventsTitle.textContent = 'Eventi';
        return;
    }

    let filteredEvents = getEventsForDate(selectedDate);

    if (filteredEvents.length === 0) {
        eventsList.innerHTML = '<p class="no-events">Nessun evento per questa data</p>';
        eventsTitle.textContent = `Eventi - ${formatDateItalian(selectedDate)}`;
        return;
    }

    eventsTitle.textContent = `Eventi - ${formatDateItalian(selectedDate)}`;

    const html = filteredEvents.map(event => `
        <div class="event-card">
            <div class="event-date">${formatDateItalian(event.date)}</div>
            <div class="event-title">${event.title}</div>
            <div class="event-details">
                <div class="event-detail">
                    <strong>Circuito:</strong>
                    <span>${event.circuit}</span>
                </div>
                <div class="event-detail">
                    <strong>Organizzatore:</strong>
                    <span>${event.organizer}</span>
                </div>
            </div>
        </div>
    `).join('');

    eventsList.innerHTML = html;
}

function formatDateItalian(dateStr) {
    const [year, month, day] = dateStr.split('-');
    const date = new Date(year, parseInt(month) - 1, day);
    const days = ['Domenica', 'Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato'];
    const months = [
        'Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno',
        'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre'
    ];
    const dayName = days[date.getDay()];
    const monthName = months[date.getMonth()];
    return `${dayName}, ${day} ${monthName} ${year}`;
}

// Inizializza il calendario
populateFilterOptions();
renderCalendar();
