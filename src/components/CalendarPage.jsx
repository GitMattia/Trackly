import MultiSelect from './MultiSelect.jsx';
import { formatDateItalian } from '../lib/utils.js';

function CalendarPage({
    circuits,
    organizers,
    selectedFilters,
    openMenu,
    setOpenMenu,
    toggleFilterValue,
    clearFilter,
    currentMonthLabel,
    changeMonth,
    calendarDays,
    selectedDate,
    setSelectedDate,
    selectedDateEvents,
    eventsTitle,
    organizerLinks,
    circuitMenuRef,
    organizerMenuRef,
}) {
    return (
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

            <div className="calendar-wrapper">
                <div className="calendar">
                    {['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom'].map(label => (
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
                            <div className="event-card" key={event.id || `${event.date}-${event.organizer}-${event.title}-${event.circuit}`}>
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
    );
}

export default CalendarPage;
