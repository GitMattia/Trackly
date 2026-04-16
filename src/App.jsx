import { useEffect, useMemo, useRef, useState } from 'react';
import { supabase } from './lib/supabaseClient.js';
import { fetchEvents } from './lib/events.js';
import AppHeader from './components/AppHeader.jsx';
import AuthPage from './components/AuthPage.jsx';
import ProfilePage from './components/ProfilePage.jsx';
import CalendarPage from './components/CalendarPage.jsx';
import { formatDate, formatDateItalian, monthNames } from './lib/utils.js';

const organizerLinks = {
    Motorace: 'https://www.motoracepeople.com/about',
    'Gully Racing': 'https://www.gullyracing.it/calendario',
    Promoracing: 'https://www.promoracing.it/it/calendario/moto',
    Rossocorsa: 'https://www.rossocorsaonline.com/prove',
};

function App() {
    const initialDate = new Date();
    initialDate.setDate(1);

    const [user, setUser] = useState(null);
    const [authView, setAuthView] = useState('login');
    const [authEmail, setAuthEmail] = useState('');
    const [authPassword, setAuthPassword] = useState('');
    const [authFirstName, setAuthFirstName] = useState('');
    const [authLastName, setAuthLastName] = useState('');
    const [authError, setAuthError] = useState('');
    const [authMessage, setAuthMessage] = useState('');
    const [authResetSuccess, setAuthResetSuccess] = useState(false);
    const [authLoading, setAuthLoading] = useState(false);
    const [authConfirmPassword, setAuthConfirmPassword] = useState('');

    const [profile, setProfile] = useState(null);
    const [profileFirstName, setProfileFirstName] = useState('');
    const [profileLastName, setProfileLastName] = useState('');
    const [profileNickname, setProfileNickname] = useState('');
    const [profileCountry, setProfileCountry] = useState('');
    const [profilePhone, setProfilePhone] = useState('');
    const [profileMessage, setProfileMessage] = useState('');
    const [profileMenuOpen, setProfileMenuOpen] = useState(false);
    const [activePage, setActivePage] = useState('calendar');

    const [currentDate, setCurrentDate] = useState(initialDate);
    const [selectedDate, setSelectedDate] = useState(null);
    const [selectedFilters, setSelectedFilters] = useState({
        circuits: [],
        organizers: [],
    });
    const [openMenu, setOpenMenu] = useState(null);
    const [events, setEvents] = useState([]);

    const circuitMenuRef = useRef(null);
    const organizerMenuRef = useRef(null);
    const profileAvatarRef = useRef(null);
    const profileMenuRef = useRef(null);
    const calendarWrapperRef = useRef(null);

    const circuits = useMemo(() => {
        return [...new Set(events.map((event) => event.circuit))].sort((a, b) => a.localeCompare(b, 'it'));
    }, [events]);

    const organizers = useMemo(() => {
        return [...new Set(events.map((event) => event.organizer))].sort((a, b) => a.localeCompare(b, 'it'));
    }, [events]);

    const filteredEvents = useMemo(() => {
        return events.filter((event) => {
            const circuitMatch = selectedFilters.circuits.length === 0 || selectedFilters.circuits.includes(event.circuit);
            const organizerMatch = selectedFilters.organizers.length === 0 || selectedFilters.organizers.includes(event.organizer);
            return circuitMatch && organizerMatch;
        });
    }, [events, selectedFilters]);

    useEffect(() => {
        function handleDocumentClick(event) {
            if (
                circuitMenuRef.current?.contains(event.target) ||
                organizerMenuRef.current?.contains(event.target) ||
                profileMenuRef.current?.contains(event.target) ||
                profileAvatarRef.current?.contains(event.target)
            ) {
                return;
            }

            setOpenMenu(null);
            setProfileMenuOpen(false);
        }

        document.addEventListener('click', handleDocumentClick);
        return () => {
            document.removeEventListener('click', handleDocumentClick);
        };
    }, []);

    useEffect(() => {
        async function loadEvents() {
            try {
                const { data, error } = await fetchEvents();
                if (error || !data) {
                    console.error('Impossibile caricare gli eventi da Supabase.', error);
                    setEvents([]);
                    return;
                }

                setEvents(data);
            } catch (error) {
                console.error('Errore caricamento eventi Supabase', error);
                setEvents([]);
            }
        }

        loadEvents();
    }, []);

    function triggerCalendarActionAnimation() {
        if (!calendarWrapperRef.current) {
            return;
        }

        calendarWrapperRef.current.classList.remove('action-boost');
        void calendarWrapperRef.current.offsetWidth;
        calendarWrapperRef.current.classList.add('action-boost');
    }

    async function handleLogin(event) {
        event.preventDefault();
        setAuthError('');
        setAuthMessage('');
        setAuthLoading(true);

        const { error } = await supabase.auth.signInWithPassword({
            email: authEmail,
            password: authPassword,
        });

        setAuthLoading(false);

        if (error) {
            setAuthError(error.message);
            return;
        }

        setAuthEmail('');
        setAuthPassword('');
    }

    async function handlePasswordReset(event) {
        event.preventDefault();
        setAuthError('');
        setAuthMessage('');
        setAuthResetSuccess(false);
        setAuthLoading(true);

        const redirectTo = new URL(import.meta.env.BASE_URL || '/', window.location.origin).toString();
        const { error } = await supabase.auth.resetPasswordForEmail(authEmail, {
            redirectTo,
        });

        setAuthLoading(false);

        if (error) {
            setAuthError(error.message);
            return;
        }

        setAuthMessage('Se l\'indirizzo esiste, riceverai una mail per reimpostare la password.');
    }

    async function handleCompletePasswordReset(event) {
        event.preventDefault();
        setAuthError('');
        setAuthMessage('');
        setAuthResetSuccess(false);

        if (authPassword !== authConfirmPassword) {
            setAuthError('Le password non corrispondono.');
            return;
        }

        setAuthLoading(true);
        const { error } = await supabase.auth.updateUser({ password: authPassword });
        setAuthLoading(false);

        if (error) {
            setAuthError(error.message);
            return;
        }

        setAuthPassword('');
        setAuthConfirmPassword('');
        setAuthMessage('Password aggiornata con successo. Puoi ora effettuare il login con la nuova password.');
        setAuthResetSuccess(true);
    }

    async function handleSignup(event) {
        event.preventDefault();
        setAuthError('');
        setAuthMessage('');
        setAuthLoading(true);

        const { data, error } = await supabase.auth.signUp({
            email: authEmail,
            password: authPassword,
        });

        setAuthLoading(false);

        if (error) {
            setAuthError(error.message);
            return;
        }

        if (data.user) {
            const fullName = [authFirstName, authLastName].filter(Boolean).join(' ').trim() || null;
            await supabase.from('profiles').upsert({
                id: data.user.id,
                email: data.user.email,
                full_name: fullName,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
            });
        }

        setAuthEmail('');
        setAuthPassword('');
        setAuthFirstName('');
        setAuthLastName('');
        setAuthView('login');
        setAuthMessage('Registrazione completata! Accedi per iniziare a usare Trackly.');
    }

    async function handleLogout() {
        await supabase.auth.signOut();
        setUser(null);
        setAuthView('login');
        setAuthEmail('');
        setAuthPassword('');
        setAuthConfirmPassword('');
        setAuthError('');
        setAuthMessage('');
        setAuthResetSuccess(false);
    }

    useEffect(() => {
        async function getSession() {
            const {
                data: { session },
            } = await supabase.auth.getSession();
            setUser(session?.user ?? null);
        }

        getSession();

        const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
            setUser(session?.user ?? null);
        });

        return () => {
            authListener.subscription.unsubscribe();
        };
    }, []);

    useEffect(() => {
        async function handleAuthRedirect() {
            const url = new URL(window.location.href);
            const searchParams = url.searchParams;
            const hash = url.hash.startsWith('#') ? url.hash.slice(1) : url.hash;
            const hashParams = new URLSearchParams(hash.startsWith('?') ? hash.slice(1) : hash);

            const errorDescription =
                searchParams.get('error_description') ||
                hashParams.get('error_description') ||
                searchParams.get('error') ||
                hashParams.get('error');

            if (errorDescription) {
                setAuthView('login');
                setAuthError(decodeURIComponent(errorDescription.replace(/\+/g, ' ')));
            }

            const type = searchParams.get('type') || hashParams.get('type');
            if (type === 'recovery') {
                setAuthView('resetPassword');

                const { data, error } = await supabase.auth.getSessionFromUrl();
                if (error) {
                    setAuthError(error.message);
                    return;
                }

                if (data?.session?.user) {
                    setUser(data.session.user);
                }
            }
        }

        handleAuthRedirect();
    }, []);

    useEffect(() => {
        if (!user) {
            setProfile(null);
            setActivePage('calendar');
            setProfileMenuOpen(false);
            return;
        }

        async function loadProfile() {
            const { data, error } = await supabase
                .from('profiles')
                .select('email, full_name, nickname, country, phone')
                .eq('id', user.id)
                .single();

            if (error && error.code !== 'PGRST116') {
                console.error('Profile fetch error', error);
                return;
            }

            const profileData = data || { email: user.email };
            if (!profileData.email) {
                profileData.email = user.email;
            }
            setProfile(profileData);

            const nameParts = (profileData.full_name ?? '').trim().split(/\s+/);
            setProfileFirstName(nameParts[0] ?? '');
            setProfileLastName(nameParts.slice(1).join(' ') ?? '');
            setProfileNickname(profileData.nickname || '');
            setProfileCountry(profileData.country || '');
            setProfilePhone(profileData.phone || '');
            setProfileMenuOpen(false);
        }

        loadProfile();
    }, [user]);

    async function handleProfileSave(event) {
        event.preventDefault();
        setProfileMessage('');

        const fullName = [profileFirstName, profileLastName].filter(Boolean).join(' ').trim() || null;
        const updates = {
            id: user.id,
            email: user.email,
            full_name: fullName,
            nickname: profileNickname || null,
            country: profileCountry || null,
            phone: profilePhone || null,
            updated_at: new Date().toISOString(),
        };

        const { error } = await supabase.from('profiles').upsert(updates);

        if (error) {
            setProfileMessage(error.message);
            return;
        }

        setProfile(updates);
        setProfileMessage('Profilo aggiornato con successo.');
    }

    function changeMonth(direction) {
        setCurrentDate((prevDate) => {
            const nextDate = new Date(prevDate);
            nextDate.setDate(1);
            nextDate.setMonth(nextDate.getMonth() + direction);
            return nextDate;
        });
        triggerCalendarActionAnimation();
    }

    function toggleFilterValue(filterKey, value) {
        setSelectedFilters((prevFilters) => {
            const nextValues = prevFilters[filterKey].includes(value)
                ? prevFilters[filterKey].filter((item) => item !== value)
                : [...prevFilters[filterKey], value];

            return {
                ...prevFilters,
                [filterKey]: nextValues,
            };
        });
        triggerCalendarActionAnimation();
    }

    function clearFilter(filterKey) {
        setSelectedFilters((prevFilters) => ({
            ...prevFilters,
            [filterKey]: [],
        }));
        triggerCalendarActionAnimation();
    }

    function getEventsForDate(dateStr) {
        return filteredEvents.filter((event) => event.date === dateStr);
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
            const uniqueCircuits = [...new Set(dayEvents.map((event) => event.circuit))];

            days.push({
                key: dateStr,
                type: 'current-month',
                label: day,
                dateStr,
                isToday: dateStr === today,
                isSelected: selectedDate === dateStr,
                titleText: dayEvents.length > 0
                    ? dayEvents.map((event) => `${event.title} - ${event.circuit}`).join(' | ')
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

    if (!user || authView === 'resetPassword') {
        return (
            <AuthPage
                authView={authView}
                setAuthView={setAuthView}
                authEmail={authEmail}
                setAuthEmail={setAuthEmail}
                authPassword={authPassword}
                setAuthPassword={setAuthPassword}
                authConfirmPassword={authConfirmPassword}
                setAuthConfirmPassword={setAuthConfirmPassword}
                authFirstName={authFirstName}
                setAuthFirstName={setAuthFirstName}
                authLastName={authLastName}
                setAuthLastName={setAuthLastName}
                authError={authError}
                authMessage={authMessage}
                authLoading={authLoading}
                authResetSuccess={authResetSuccess}
                handleLogin={handleLogin}
                handleSignup={handleSignup}
                handlePasswordReset={handlePasswordReset}
                handleCompletePasswordReset={handleCompletePasswordReset}
            />
        );
    }

    return (
        <div className="container">
            <AppHeader
                profile={profile}
                user={user}
                profileMenuOpen={profileMenuOpen}
                setProfileMenuOpen={setProfileMenuOpen}
                handleLogout={handleLogout}
                setActivePage={setActivePage}
                profileAvatarRef={profileAvatarRef}
                profileMenuRef={profileMenuRef}
            />
            {activePage === 'profile' ? (
                <ProfilePage
                    profile={profile}
                    profileFirstName={profileFirstName}
                    setProfileFirstName={setProfileFirstName}
                    profileLastName={profileLastName}
                    setProfileLastName={setProfileLastName}
                    profileNickname={profileNickname}
                    setProfileNickname={setProfileNickname}
                    profileCountry={profileCountry}
                    setProfileCountry={setProfileCountry}
                    profilePhone={profilePhone}
                    setProfilePhone={setProfilePhone}
                    profileMessage={profileMessage}
                    handleProfileSave={handleProfileSave}
                />
            ) : (
                <CalendarPage
                    circuits={circuits}
                    organizers={organizers}
                    selectedFilters={selectedFilters}
                    openMenu={openMenu}
                    setOpenMenu={setOpenMenu}
                    toggleFilterValue={toggleFilterValue}
                    clearFilter={clearFilter}
                    currentMonthLabel={currentMonthLabel}
                    changeMonth={changeMonth}
                    calendarDays={calendarDays}
                    selectedDate={selectedDate}
                    setSelectedDate={setSelectedDate}
                    selectedDateEvents={selectedDateEvents}
                    eventsTitle={eventsTitle}
                    organizerLinks={organizerLinks}
                    circuitMenuRef={circuitMenuRef}
                    organizerMenuRef={organizerMenuRef}
                />
            )}
            <footer>
                <p>&copy; 2026 Trackly - Calendario Eventi</p>
            </footer>
        </div>
    );
}

export default App;
