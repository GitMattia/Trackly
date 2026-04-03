import { useEffect, useMemo, useRef, useState } from 'react';
import { eventsData } from './data/events.js';

const organizerLinks = {
    Motorace: 'https://www.motoracepeople.com/about',
    'Gully Racing': 'https://www.gullyracing.it/calendario',
    Promoracing: 'https://www.promoracing.it/it/calendario/moto',
    Rossocorsa: 'https://www.rossocorsaonline.com/prove',
};

const monthNames = [
    'Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno',
    'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre'
];

const weekdayLabels = ['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom'];

function formatDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function formatDateItalian(dateStr) {
    const [year, month, day] = dateStr.split('-');
    const date = new Date(year, Number(month) - 1, day);
    const days = ['Domenica', 'Lunedi', 'Martedi', 'Mercoledi', 'Giovedi', 'Venerdi', 'Sabato'];
    const dayName = days[date.getDay()];
    const monthName = monthNames[date.getMonth()];
    return `${dayName}, ${day} ${monthName} ${year}`;
}

function getFilterTriggerLabel(selectedValues, defaultLabel) {
    if (selectedValues.length === 0) {
        return defaultLabel;
    }

    if (selectedValues.length === 1) {
        return selectedValues[0];
    }

    return `${selectedValues.length} selezionati`;
}

function MultiSelect({
    label,
    defaultLabel,
    values,
    selectedValues,
    isOpen,
    onToggle,
    onChange,
    onClear,
    menuRef,
    controlsId,
}) {
    return (
        <div className={`multi-select${isOpen ? ' open' : ''}`} ref={menuRef}>
            <button
                type="button"
                className="multi-select-trigger"
                aria-expanded={isOpen}
                aria-controls={controlsId}
                onClick={onToggle}
            >
                {getFilterTriggerLabel(selectedValues, defaultLabel)}
            </button>
            <div className="multi-select-panel" id={controlsId} role="group" aria-label={label}>
                <button type="button" className="multi-select-clear" onClick={onClear}>
                    Azzera selezione
                </button>
                {values.map((value, index) => {
                    const optionId = `${controlsId}-${index}`;
                    return (
                        <label className="multi-select-option" htmlFor={optionId} key={value}>
                            <input
                                type="checkbox"
                                id={optionId}
                                checked={selectedValues.includes(value)}
                                onChange={() => onChange(value)}
                            />
                            <span>{value}</span>
                        </label>
                    );
                })}
            </div>
        </div>
    );
}

function App() {
    const initialDate = new Date();
    initialDate.setDate(1);

    const [currentDate, setCurrentDate] = useState(initialDate);
    const [selectedDate, setSelectedDate] = useState(null);
    const [selectedFilters, setSelectedFilters] = useState({
        circuits: [],
        organizers: [],
    });
    const [openMenu, setOpenMenu] = useState(null);

    const circuitMenuRef = useRef(null);
    const organizerMenuRef = useRef(null);
    const calendarWrapperRef = useRef(null);

    const circuits = useMemo(() => {
        return [...new Set(eventsData.map(event => event.circuit))].sort((a, b) => a.localeCompare(b, 'it'));
    }, []);

    const organizers = useMemo(() => {
        return [...new Set(eventsData.map(event => event.organizer))].sort((a, b) => a.localeCompare(b, 'it'));
    }, []);

    const filteredEvents = useMemo(() => {
        return eventsData.filter(event => {
            const circuitMatch = selectedFilters.circuits.length === 0 || selectedFilters.circuits.includes(event.circuit);
            const organizerMatch = selectedFilters.organizers.length === 0 || selectedFilters.organizers.includes(event.organizer);
            return circuitMatch && organizerMatch;
        });
    }, [selectedFilters]);

    useEffect(() => {
        function handleDocumentClick(event) {
            if (circuitMenuRef.current?.contains(event.target) || organizerMenuRef.current?.contains(event.target)) {
                return;
            }

            setOpenMenu(null);
        }

        document.addEventListener('click', handleDocumentClick);
        return () => {
            document.removeEventListener('click', handleDocumentClick);
        };
    }, []);

    function triggerCalendarActionAnimation() {
        if (!calendarWrapperRef.current) {
            return;
        }

        calendarWrapperRef.current.classList.remove('action-boost');
        void calendarWrapperRef.current.offsetWidth;
        calendarWrapperRef.current.classList.add('action-boost');
    }

    function changeMonth(direction) {
        setCurrentDate(prevDate => {
            const nextDate = new Date(prevDate);
            nextDate.setDate(1);
            nextDate.setMonth(nextDate.getMonth() + direction);
            return nextDate;
        });
        triggerCalendarActionAnimation();
    }

    function toggleFilterValue(filterKey, value) {
        setSelectedFilters(prevFilters => {
            const nextValues = prevFilters[filterKey].includes(value)
                ? prevFilters[filterKey].filter(item => item !== value)
                : [...prevFilters[filterKey], value];

            return {
                ...prevFilters,
                [filterKey]: nextValues,
            };
        });
        triggerCalendarActionAnimation();
    }

    function clearFilter(filterKey) {
        setSelectedFilters(prevFilters => ({
            ...prevFilters,
            [filterKey]: [],
        }));
        triggerCalendarActionAnimation();
    }

    function getEventsForDate(dateStr) {
        return filteredEvents.filter(event => event.date === dateStr);
    }

    const today = formatDate(new Date());
    const currentMonthLabel = `${monthNames[currentDate.getMonth()]} ${currentDate.getFullYear()}`;

    const calendarDays = useMemo(() => {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();

        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const prevLastDay = new Date(year, month, 0);

        const firstDayOfWeek = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1;
        const lastDateOfMonth = lastDay.getDate();
        const lastDateOfPrevMonth = prevLastDay.getDate();

        const days = [];

        for (let index = firstDayOfWeek - 1; index >= 0; index -= 1) {
            days.push({
                key: `prev-${index}`,
                type: 'other-month',
                label: lastDateOfPrevMonth - index,
            });
        }

        for (let day = 1; day <= lastDateOfMonth; day += 1) {
            const date = new Date(year, month, day);
            const dateStr = formatDate(date);
            const dayEvents = getEventsForDate(dateStr);
            const uniqueCircuits = [...new Set(dayEvents.map(event => event.circuit))];

            days.push({
                key: dateStr,
                type: 'current-month',
                label: day,
                dateStr,
                isToday: dateStr === today,
                isSelected: selectedDate === dateStr,
                titleText: dayEvents.length > 0
                    ? dayEvents.map(event => `${event.title} - ${event.circuit}`).join(' | ')
                    : '',
                circuits: uniqueCircuits,
                eventCount: dayEvents.length,
            });
        }

        const remainingDays = 42 - (firstDayOfWeek + lastDateOfMonth);
        for (let day = 1; day <= remainingDays; day += 1) {
            days.push({
                key: `next-${day}`,
                type: 'other-month',
                label: day,
            });
        }

        return days;
    }, [currentDate, filteredEvents, selectedDate, today]);

    const selectedDateEvents = selectedDate ? getEventsForDate(selectedDate) : [];
    const eventsTitle = selectedDate ? `Eventi - ${formatDateItalian(selectedDate)}` : 'Eventi';

    return (
        <div className="container">
            <header>
                <h1>Trackly</h1>
                <p className="subtitle">Calendario Trackday Moto</p>
            </header>

            <main>
                <div className="filters">
                    <MultiSelect
                        label="Seleziona circuiti"
                        defaultLabel="Tutti i circuiti"
                        values={circuits}
                        selectedValues={selectedFilters.circuits}
                        isOpen={openMenu === 'circuits'}
                        onToggle={() => setOpenMenu(openMenu === 'circuits' ? null : 'circuits')}
                        onChange={(value) => toggleFilterValue('circuits', value)}
                        onClear={() => clearFilter('circuits')}
                        menuRef={circuitMenuRef}
                        controlsId="filterCircuitOptions"
                    />
                    <MultiSelect
                        label="Seleziona organizzatori"
                        defaultLabel="Tutti gli organizzatori"
                        values={organizers}
                        selectedValues={selectedFilters.organizers}
                        isOpen={openMenu === 'organizers'}
                        onToggle={() => setOpenMenu(openMenu === 'organizers' ? null : 'organizers')}
                        onChange={(value) => toggleFilterValue('organizers', value)}
                        onClear={() => clearFilter('organizers')}
                        menuRef={organizerMenuRef}
                        controlsId="filterOrganizerOptions"
                    />
                </div>

                <div className="controls">
                    <button className="btn btn-prev" type="button" aria-label="Mese precedente" onClick={() => changeMonth(-1)}>
                        &#8249;
                    </button>
                    <h2>{currentMonthLabel}</h2>
                    <button className="btn btn-next" type="button" aria-label="Mese successivo" onClick={() => changeMonth(1)}>
                        &#8250;
                    </button>
                </div>

                <div className="calendar-wrapper" ref={calendarWrapperRef}>
                    <div className="calendar">
                        {weekdayLabels.map(label => (
                            <div className="weekday" key={label}>{label}</div>
                        ))}
                        <div id="calendarDays">
                            {calendarDays.map(day => {
                                if (day.type === 'other-month') {
                                    return <div className="day other-month" key={day.key}>{day.label}</div>;
                                }

                                const classes = [
                                    'day',
                                    day.isToday ? 'today' : '',
                                    day.isSelected ? 'selected' : '',
                                    day.eventCount > 0 ? 'has-event' : '',
                                ].filter(Boolean).join(' ');

                                return (
                                    <div
                                        className={classes}
                                        data-date={day.dateStr}
                                        key={day.key}
                                        title={day.titleText}
                                        onClick={() => setSelectedDate(day.dateStr)}
                                    >
                                        <span className="day-number">{day.label}</span>
                                        {day.eventCount > 0 && (
                                            <>
                                                <div className="day-organizer-list">
                                                    {day.circuits.map(circuit => (
                                                        <span className="day-organizer-item" key={circuit}>{circuit}</span>
                                                    ))}
                                                </div>
                                                <span className="day-event-count">{day.eventCount}</span>
                                            </>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                <div className="events-section">
                    <h3 id="eventsTitle">{eventsTitle}</h3>
                    <div className="events-list">
                        {!selectedDate && <p className="no-events">Nessun evento selezionato</p>}
                        {selectedDate && selectedDateEvents.length === 0 && (
                            <p className="no-events">Nessun evento per questa data</p>
                        )}
                        {selectedDateEvents.map(event => {
                            const organizerUrl = organizerLinks[event.organizer];

                            return (
                                <div className="event-card" key={`${event.date}-${event.organizer}-${event.title}-${event.circuit}`}>
                                    <div className="event-date">{formatDateItalian(event.date)}</div>
                                    <div className="event-title">{event.title}</div>
                                    <div className="event-bottom-row">
                                        <div className="event-details">
                                            <div className="event-detail">
                                                <strong>Circuito:</strong>
                                                <span>{event.circuit}</span>
                                            </div>
                                            <div className="event-detail">
                                                <strong>Organizzatore:</strong>
                                                <span>{event.organizer}</span>
                                            </div>
                                        </div>
                                        {organizerUrl && (
                                            <a
                                                className="organizer-link-btn"
                                                href={organizerUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                            >
                                                Verifica disponibilita, prezzi e prenota
                                            </a>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </main>

            <footer>
                <p>&copy; 2026 Trackly - Calendario Eventi</p>
            </footer>
        </div>
    );
}

export default App;
