'use strict';

/* ===================================================================
   EventHub — Application Logic
   Vanilla JavaScript with OOP (Encapsulation, Inheritance, Polymorphism)
   
   Classes:
     1. Event           — Base event class with private fields
     2. FeaturedEvent   — Extends Event (inheritance + polymorphism)
     3. EventManager    — Manages event collection, filtering & sorting
     4. User            — Manages user registrations
     5. UIManager       — Handles DOM rendering & user interactions
   =================================================================== */

/* =========================
   Constants & Config
   ========================= */
const CATEGORY_CONFIG = {
    'Música':       { color: '#8B5CF6', colorDark: '#7C3AED', icon: '♪' },
    'Deportes':     { color: '#F97316', colorDark: '#EA580C', icon: '⚽' },
    'Tecnología':   { color: '#3B82F6', colorDark: '#2563EB', icon: '⚡' },
    'Gastronomía':  { color: '#EC4899', colorDark: '#DB2777', icon: '🍽' },
    'Negocios':     { color: '#14B8A6', colorDark: '#0D9488', icon: '💼' },
    'Arte':         { color: '#F59E0B', colorDark: '#D97706', icon: '🎨' }
};

/* =========================
   1. Event (Base Class)
   Encapsulation: all fields are private (#)
   ========================= */
class Event {
    #id;
    #name;
    #date;
    #location;
    #category;
    #capacity;
    #registeredCount;
    #description;

    constructor(data) {
        // Validate required fields
        if (!data || typeof data !== 'object') {
            throw new Error('Event data is required');
        }
        if (!data.name || data.name.trim() === '') {
            throw new Error('Event name is required');
        }
        if (!data.date || !data.location || !data.category) {
            throw new Error('Event date, location and category are required');
        }

        this.#id = data.id;
        this.#name = data.name.trim();
        this.#date = data.date;
        this.#location = data.location.trim();
        this.#category = data.category;
        this.#capacity = data.capacity || 100;
        this.#registeredCount = data.registeredCount || 0;
        this.#description = data.description || '';
    }

    /* --- Getters --- */
    getId()          { return this.#id; }
    getName()        { return this.#name; }
    getDate()        { return this.#date; }
    getLocation()    { return this.#location; }
    getCategory()    { return this.#category; }
    getDescription() { return this.#description; }
    getCapacity()    { return this.#capacity; }
    getRegisteredCount() { return this.#registeredCount; }

    /* --- Setters (encapsulation: controlled access) --- */
    setRegisteredCount(count) {
        if (typeof count !== 'number' || count < 0) {
            throw new Error('Registered count must be a non-negative number');
        }
        this.#registeredCount = count;
    }

    /* --- Derived properties --- */
    getAvailableSpots() {
        return this.#capacity - this.#registeredCount;
    }

    isFull() {
        return this.#registeredCount >= this.#capacity;
    }

    isPastEvent() {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return new Date(this.#date) < today;
    }

    getCapacityPercentage() {
        return Math.min(100, Math.round((this.#registeredCount / this.#capacity) * 100));
    }

    getDateFormatted() {
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        return new Date(this.#date + 'T00:00:00').toLocaleDateString('es-ES', options);
    }

    getDateShort() {
        const date = new Date(this.#date + 'T00:00:00');
        return {
            day: date.getDate().toString().padStart(2, '0'),
            month: date.toLocaleDateString('es-ES', { month: 'short' }).toUpperCase()
        };
    }

    getCategoryConfig() {
        return CATEGORY_CONFIG[this.#category] || { color: '#4F46E5', colorDark: '#4338CA', icon: '•' };
    }

    /* --- Business actions --- */
    canRegister() {
        return !this.isFull() && !this.isPastEvent();
    }

    register() {
        if (this.isPastEvent()) {
            return { success: false, reason: 'Este evento ya ha pasado' };
        }
        if (this.isFull()) {
            return { success: false, reason: 'El evento no tiene cupos disponibles' };
        }
        this.#registeredCount++;
        return { success: true };
    }

    cancelRegistration() {
        if (this.#registeredCount > 0) {
            this.#registeredCount--;
            return { success: true };
        }
        return { success: false, reason: 'No hay inscripciones para cancelar' };
    }

    /* --- Polymorphic: overridden by FeaturedEvent --- */
    getDetails() {
        return {
            name: this.getName(),
            date: this.getDateFormatted(),
            location: this.getLocation(),
            category: this.getCategory(),
            description: this.getDescription(),
            capacity: this.getCapacity(),
            registered: this.getRegisteredCount(),
            available: this.getAvailableSpots(),
            isFeatured: false
        };
    }
}

/* =========================
   2. FeaturedEvent (Inheritance + Polymorphism)
   Extends Event, overrides getDetails()
   ========================= */
class FeaturedEvent extends Event {
    #badgeLabel;
    #highlightText;

    constructor(data) {
        super(data);
        this.#badgeLabel = data.badgeLabel || 'Destacado';
        this.#highlightText = data.highlightText || 'Evento destacado por el organizador';
    }

    getBadgeLabel()      { return this.#badgeLabel; }
    getHighlightText()   { return this.#highlightText; }
    isFeatured()         { return true; }

    /* --- Polymorphism: override getDetails --- */
    getDetails() {
        const base = super.getDetails();
        return {
            ...base,
            isFeatured: true,
            badgeLabel: this.#badgeLabel,
            highlightText: this.#highlightText
        };
    }
}

/* =========================
   3. EventManager
   Manages the collection of events, filtering, and sorting
   ========================= */
class EventManager {
    #events = [];
    #filters = {
        search: '',
        category: 'all',
        sort: 'date-asc'
    };

    constructor(events = []) {
        events.forEach(event => this.addEvent(event));
    }

    addEvent(event) {
        if (!(event instanceof Event)) {
            throw new Error('Only Event instances can be added');
        }
        this.#events.push(event);
    }

    getById(id) {
        return this.#events.find(event => event.getId() === id) || null;
    }

    getAll() {
        return [...this.#events];
    }

    getFeatured() {
        return this.#events.filter(event => event instanceof FeaturedEvent);
    }

    getCategories() {
        const categories = [];
        this.#events.forEach(event => {
            const cat = event.getCategory();
            if (!categories.includes(cat)) {
                categories.push(cat);
            }
        });
        return categories.sort();
    }

    /* --- Filter management --- */
    setFilter(type, value) {
        if (!this.#filters.hasOwnProperty(type)) {
            throw new Error(`Unknown filter type: ${type}`);
        }
        this.#filters[type] = value;
    }

    getFilter(type) {
        return this.#filters[type];
    }

    clearFilters() {
        this.#filters = {
            search: '',
            category: 'all',
            sort: 'date-asc'
        };
    }

    /* --- Apply filters + sort --- */
    getFilteredEvents() {
        let result = [...this.#events];

        // Apply search filter
        const search = this.#filters.search.toLowerCase().trim();
        if (search !== '') {
            result = result.filter(event => {
                const nameMatch = event.getName().toLowerCase().includes(search);
                const locationMatch = event.getLocation().toLowerCase().includes(search);
                return nameMatch || locationMatch;
            });
        }

        // Apply category filter
        if (this.#filters.category !== 'all') {
            result = result.filter(event => event.getCategory() === this.#filters.category);
        }

        // Apply sorting
        result = this.#sortEvents(result, this.#filters.sort);
        return result;
    }

    #sortEvents(events, sortBy) {
        const sorted = [...events];
        switch (sortBy) {
            case 'date-asc':
                return sorted.sort((a, b) => new Date(a.getDate()) - new Date(b.getDate()));
            case 'date-desc':
                return sorted.sort((a, b) => new Date(b.getDate()) - new Date(a.getDate()));
            case 'name-asc':
                return sorted.sort((a, b) => a.getName().localeCompare(b.getName(), 'es'));
            case 'name-desc':
                return sorted.sort((a, b) => b.getName().localeCompare(a.getName(), 'es'));
            case 'availability':
                return sorted.sort((a, b) => b.getAvailableSpots() - a.getAvailableSpots());
            default:
                return sorted;
        }
    }

    get count() {
        return this.#events.length;
    }
}

/* =========================
   4. User
   Manages user registrations (in-memory, resets on reload)
   ========================= */
class User {
    #name;
    #registrations = []; // Array of event IDs

    constructor(name = 'Invitado') {
        this.#name = name;
    }

    getName() { return this.#name; }

    isRegistered(eventId) {
        return this.#registrations.includes(eventId);
    }

    register(eventId) {
        if (!eventId) {
            return { success: false, reason: 'ID de evento no válido' };
        }
        if (this.isRegistered(eventId)) {
            return { success: false, reason: 'Ya estás inscrito en este evento' };
        }
        this.#registrations.push(eventId);
        return { success: true };
    }

    cancelRegistration(eventId) {
        if (!this.isRegistered(eventId)) {
            return { success: false, reason: 'No estás inscrito en este evento' };
        }
        const index = this.#registrations.indexOf(eventId);
        this.#registrations.splice(index, 1);
        return { success: true };
    }

    getRegistrations() {
        return [...this.#registrations];
    }

    getRegistrationCount() {
        return this.#registrations.length;
    }
}

/* =========================
   5. UIManager
   Handles all DOM rendering and event binding
   ========================= */
class UIManager {
    #eventManager;
    #user;
    #elements = {};
    #lastFocusedElement = null;
    #focusTrapHandler = null;

    constructor(eventManager, user) {
        this.#eventManager = eventManager;
        this.#user = user;
    }

    /* --- Initialize --- */
    init() {
        this.#cacheElements();
        this.#renderCategoryFilters();
        this.#renderEvents();
        this.#renderRegistrations();
        this.#updateStats();
        this.#bindEvents();
    }

    /* --- Cache DOM elements --- */
    #cacheElements() {
        this.#elements = {
            eventsGrid:       document.getElementById('events-grid'),
            eventsCount:      document.getElementById('events-count'),
            eventsEmpty:      document.getElementById('events-empty'),
            searchInput:      document.getElementById('search-input'),
            searchClear:      document.getElementById('search-clear'),
            sortSelect:       document.getElementById('sort-select'),
            categoryFilters:  document.getElementById('category-filters'),
            registrationsList:    document.getElementById('registrations-list'),
            registrationsEmpty:    document.getElementById('registrations-empty'),
            registrationsCount:    document.getElementById('registrations-count'),
            registrationsBadge:   document.getElementById('registrations-badge'),
            eventModal:       document.getElementById('event-modal'),
            modalOverlay:     document.getElementById('modal-overlay'),
            modalDialog:      document.getElementById('modal-dialog'),
            modalBody:        document.getElementById('modal-body'),
            modalClose:       document.getElementById('modal-close'),
            toastContainer:   document.getElementById('toast-container'),
            menuToggle:       document.getElementById('menu-toggle'),
            headerNav:        document.getElementById('header-nav'),
            navLinks:         document.querySelectorAll('.header__link'),
            clearFiltersBtn:  document.getElementById('clear-filters-btn'),
            statTotal:         document.getElementById('stat-total'),
            statCategories:    document.getElementById('stat-categories'),
            statRegistered:    document.getElementById('stat-registered'),
            exploreBtn:       document.getElementById('explore-btn')
        };
    }

    /* --- Bind DOM events --- */
    #bindEvents() {
        // Search input (with debounce)
        let searchTimeout;
        this.#elements.searchInput.addEventListener('input', (e) => {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                const value = e.target.value.trim();
                this.#eventManager.setFilter('search', value);
                this.#eventManager.setFilter('category', 'all');

                // Sync category chips
                this.#renderCategoryFilters();

                this.#updateSearchClearButton(value);
                this.#renderEvents();
            }, 300);
        });

        // Clear search
        this.#elements.searchClear.addEventListener('click', () => {
            this.#elements.searchInput.value = '';
            this.#eventManager.setFilter('search', '');
            this.#updateSearchClearButton('');
            this.#renderEvents();
            this.#elements.searchInput.focus();
        });

        // Sort select
        this.#elements.sortSelect.addEventListener('change', (e) => {
            this.#eventManager.setFilter('sort', e.target.value);
            this.#renderEvents();
        });

        // Clear filters button
        this.#elements.clearFiltersBtn.addEventListener('click', () => {
            this.#clearAllFilters();
        });

        // Explore button (in empty registrations state)
        this.#elements.exploreBtn.addEventListener('click', () => {
            this.#closeMobileMenu();
        });

        // Mobile menu toggle
        this.#elements.menuToggle.addEventListener('click', () => {
            const isOpen = this.#elements.headerNav.classList.contains('header__nav--open');
            this.#elements.menuToggle.setAttribute('aria-expanded', String(!isOpen));
            this.#elements.headerNav.classList.toggle('header__nav--open');
        });

        // Nav links active state + close mobile menu on click
        this.#elements.navLinks.forEach(link => {
            link.addEventListener('click', () => {
                this.#closeMobileMenu();
                this.#setActiveNavLink(link);
            });
        });

        // Event delegation: events grid
        this.#elements.eventsGrid.addEventListener('click', (e) => {
            const btn = e.target.closest('[data-action]');
            if (!btn) return;

            const eventId = btn.dataset.eventId;
            const action = btn.dataset.action;

            switch (action) {
                case 'details':
                    this.#openModal(eventId);
                    break;
                case 'register':
                    this.#handleRegister(eventId);
                    break;
                case 'cancel-from-card':
                    this.#handleCancel(eventId);
                    break;
                default:
                    break;
            }
        });

        // Event delegation: registrations list
        this.#elements.registrationsList.addEventListener('click', (e) => {
            const btn = e.target.closest('[data-action="cancel-from-reg"]');
            if (!btn) return;
            const eventId = btn.dataset.eventId;
            this.#handleCancel(eventId);
        });

        // Modal close: button, overlay click, escape key
        this.#elements.modalClose.addEventListener('click', () => this.#closeModal());
        this.#elements.modalOverlay.addEventListener('click', () => this.#closeModal());

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && !this.#elements.eventModal.hasAttribute('hidden')) {
                this.#closeModal();
            }
        });

        // Scroll-spy for nav active state
        const observerOptions = { rootMargin: '-40% 0px -55% 0px' };
        const sections = document.querySelectorAll('section[id]');
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const id = entry.target.id;
                    const link = document.querySelector(`.header__link[data-section="${id}"]`);
                    if (link) {
                        this.#setActiveNavLink(link);
                    }
                }
            });
        }, observerOptions);
        sections.forEach(section => observer.observe(section));
    }

    /* --- Render category filter chips --- */
    #renderCategoryFilters() {
        const categories = this.#eventManager.getCategories();
        const activeCategory = this.#eventManager.getFilter('category');

        const chipsHTML = [`
            <button class="filter-chip ${activeCategory === 'all' ? 'filter-chip--active' : ''}" data-category="all">
                Todos los eventos
            </button>
        `];

        categories.forEach(cat => {
            const config = CATEGORY_CONFIG[cat] || { color: '#4F46E5', icon: '•' };
            const isActive = activeCategory === cat;
            chipsHTML.push(`
                <button class="filter-chip ${isActive ? 'filter-chip--active' : ''}" data-category="${cat}">
                    <span class="filter-chip__dot" style="background: ${config.color}"></span>
                    ${cat}
                </button>
            `);
        });

        this.#elements.categoryFilters.innerHTML = chipsHTML.join('');

        // Bind chip clicks
        this.#elements.categoryFilters.querySelectorAll('.filter-chip').forEach(chip => {
            chip.addEventListener('click', () => {
                this.#eventManager.setFilter('category', chip.dataset.category);
                this.#renderCategoryFilters();
                this.#renderEvents();
            });
        });
    }

    /* --- Render event cards --- */
    #renderEvents() {
        const events = this.#eventManager.getFilteredEvents();
        const totalEvents = this.#eventManager.count;

        // Update count text
        if (events.length === 0) {
            this.#elements.eventsCount.textContent = '';
        } else if (events.length === 1) {
            this.#elements.eventsCount.textContent = '1 evento encontrado';
        } else {
            this.#elements.eventsCount.textContent = `${events.length} de ${totalEvents} eventos`;
        }

        // Toggle empty state
        if (events.length === 0) {
            this.#elements.eventsGrid.innerHTML = '';
            this.#elements.eventsEmpty.hidden = false;
            return;
        }

        this.#elements.eventsEmpty.hidden = true;

        // Build cards
        this.#elements.eventsGrid.innerHTML = events.map(event => this.#buildEventCard(event)).join('');
    }

    /* --- Build a single event card HTML --- */
    #buildEventCard(event) {
        const config = event.getCategoryConfig();
        const date = event.getDateShort();
        const isRegistered = this.#user.isRegistered(event.getId());
        const isFeatured = event instanceof FeaturedEvent;
        const isPast = event.isPastEvent();
        const capacityPct = event.getCapacityPercentage();
        const available = event.getAvailableSpots();

        // Capacity color
        let capacityColor = '--color-success';
        if (capacityPct >= 100) {
            capacityColor = '--color-error';
        } else if (capacityPct >= 80) {
            capacityColor = '--color-warning';
        }

        // Footer: registered status, register button, cancel button, or full
        let footerHTML;
        if (isRegistered) {
            footerHTML = `
                <span class="event-card__status">✓ Inscrito</span>
                <button class="event-card__btn-cancel" data-action="cancel-from-card" data-event-id="${event.getId()}" aria-label="Cancelar inscripción a ${event.getName()}">
                    Cancelar
                </button>
            `;
        } else if (isPast) {
            footerHTML = `
                <button class="event-card__btn-details" data-action="details" data-event-id="${event.getId()}" aria-label="Ver detalles de ${event.getName()}">
                    Ver detalles
                </button>
                <button class="event-card__btn-register" disabled aria-label="Evento finalizado">
                    Evento finalizado
                </button>
            `;
        } else if (event.isFull()) {
            footerHTML = `
                <button class="event-card__btn-details" data-action="details" data-event-id="${event.getId()}" aria-label="Ver detalles de ${event.getName()}">
                    Ver detalles
                </button>
                <button class="event-card__btn-register" disabled aria-label="Sin cupo disponible">
                    Sin cupo
                </button>
            `;
        } else {
            footerHTML = `
                <button class="event-card__btn-details" data-action="details" data-event-id="${event.getId()}" aria-label="Ver detalles de ${event.getName()}">
                    Ver detalles
                </button>
                <button class="event-card__btn-register" data-action="register" data-event-id="${event.getId()}" aria-label="Inscribirse en ${event.getName()}">
                    Inscribirse
                </button>
            `;
        }

        const cardClass = isRegistered ? 'event-card event-card--registered' : 'event-card';

        return `
            <article class="${cardClass}" style="--card-color: ${config.color}; --card-color-dark: ${config.colorDark}">
                <div class="event-card__banner">
                    <span class="event-card__category">
                        <span class="event-card__category-dot"></span>
                        ${event.getCategory()}
                    </span>
                    ${isFeatured ? `<span class="event-card__featured-badge">★ ${event.getBadgeLabel()}</span>` : ''}
                </div>
                <div class="event-card__body">
                    <div class="event-card__date">
                        <svg class="event-card__date-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                            <rect x="3" y="4" width="18" height="17" rx="2" stroke="currentColor" stroke-width="1.5"/>
                            <line x1="3" y1="9" x2="21" y2="9" stroke="currentColor" stroke-width="1.5"/>
                            <line x1="8" y1="2" x2="8" y2="6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
                            <line x1="16" y1="2" x2="16" y2="6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
                        </svg>
                        ${event.getDateFormatted()}
                    </div>
                    <h3 class="event-card__title">${event.getName()}</h3>
                    <div class="event-card__location">
                        <svg class="event-card__location-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                            <path d="M12 21s-7-6.5-7-11a7 7 0 0 1 14 0c0 4.5-7 11-7 11z" stroke="currentColor" stroke-width="1.5"/>
                            <circle cx="12" cy="10" r="2.5" stroke="currentColor" stroke-width="1.5"/>
                        </svg>
                        ${event.getLocation()}
                    </div>
                    <div class="event-card__capacity">
                        <div class="event-card__capacity-bar">
                            <div class="event-card__capacity-fill" style="width: ${capacityPct}%; background: var(${capacityColor});"></div>
                        </div>
                        <span class="event-card__capacity-text">${available} disponibles</span>
                    </div>
                </div>
                <div class="event-card__footer">
                    ${footerHTML}
                </div>
            </article>
        `;
    }

    /* --- Render user's registrations --- */
    #renderRegistrations() {
        const registrations = this.#user.getRegistrations();
        const count = registrations.length;

        // Update count and badge
        this.#elements.registrationsCount.textContent = count === 1 ? '1 inscripción' : `${count} inscripciones`;
        this.#elements.registrationsBadge.textContent = count;
        this.#elements.registrationsBadge.hidden = count === 0;

        // Toggle empty state
        if (count === 0) {
            this.#elements.registrationsList.innerHTML = '';
            this.#elements.registrationsEmpty.hidden = false;
            return;
        }

        this.#elements.registrationsEmpty.hidden = true;

        // Build registration items
        const itemsHTML = registrations.map(eventId => {
            const event = this.#eventManager.getById(eventId);
            if (!event) return '';
            const config = event.getCategoryConfig();
            const details = event.getDetails();

            return `
                <div class="reg-item" style="--item-color: ${config.color}">
                    <div class="reg-item__header">
                        <span class="reg-item__category">
                            <span class="reg-item__category-dot"></span>
                            ${event.getCategory()}
                        </span>
                        <span class="reg-item__status">✓ Inscrito</span>
                    </div>
                    <h3 class="reg-item__title">${event.getName()}</h3>
                    <div class="reg-item__detail">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                            <rect x="3" y="4" width="18" height="17" rx="2" stroke="currentColor" stroke-width="1.5"/>
                            <line x1="3" y1="9" x2="21" y2="9" stroke="currentColor" stroke-width="1.5"/>
                            <line x1="8" y1="2" x2="8" y2="6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
                            <line x1="16" y1="2" x2="16" y2="6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
                        </svg>
                        ${event.getDateFormatted()}
                    </div>
                    <div class="reg-item__detail">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                            <path d="M12 21s-7-6.5-7-11a7 7 0 0 1 14 0c0 4.5-7 11-7 11z" stroke="currentColor" stroke-width="1.5"/>
                            <circle cx="12" cy="10" r="2.5" stroke="currentColor" stroke-width="1.5"/>
                        </svg>
                        ${event.getLocation()}
                    </div>
                    <div class="reg-item__footer">
                        <button class="reg-item__btn-cancel" data-action="cancel-from-reg" data-event-id="${event.getId()}" aria-label="Cancelar inscripción a ${event.getName()}">
                            Cancelar inscripción
                        </button>
                    </div>
                </div>
            `;
        }).join('');

        this.#elements.registrationsList.innerHTML = itemsHTML;
    }

    /* --- Handle register action --- */
    #handleRegister(eventId) {
        const event = this.#eventManager.getById(eventId);
        if (!event) {
            this.#showToast('error', 'Evento no encontrado');
            return;
        }

        // Validate: already registered
        if (this.#user.isRegistered(eventId)) {
            this.#showToast('warning', 'Ya estás inscrito en este evento');
            return;
        }

        // Validate: past event
        if (event.isPastEvent()) {
            this.#showToast('error', 'No puedes inscribirte en un evento que ya pasó');
            return;
        }

        // Validate: event full
        if (event.isFull()) {
            this.#showToast('error', 'El evento no tiene cupos disponibles');
            return;
        }

        // Execute registration
        const userResult = this.#user.register(eventId);
        if (!userResult.success) {
            this.#showToast('error', userResult.reason);
            return;
        }

        const eventResult = event.register();
        if (!eventResult.success) {
            // Rollback user registration
            this.#user.cancelRegistration(eventId);
            this.#showToast('error', eventResult.reason);
            return;
        }

        // Success
        this.#showToast('success', `Te has inscrito en "${event.getName()}"`);
        this.#renderEvents();
        this.#renderRegistrations();
        this.#updateStats();
    }

    /* --- Handle cancel action --- */
    #handleCancel(eventId) {
        const event = this.#eventManager.getById(eventId);
        if (!event) {
            this.#showToast('error', 'Evento no encontrado');
            return;
        }

        // Validate: not registered
        if (!this.#user.isRegistered(eventId)) {
            this.#showToast('warning', 'No estás inscrito en este evento');
            return;
        }

        // Execute cancel
        const userResult = this.#user.cancelRegistration(eventId);
        if (!userResult.success) {
            this.#showToast('error', userResult.reason);
            return;
        }

        event.cancelRegistration();

        // Success
        this.#showToast('info', `Has cancelado tu inscripción a "${event.getName()}"`);
        this.#renderEvents();
        this.#renderRegistrations();
        this.#updateStats();
    }

    /* --- Open modal --- */
    #openModal(eventId) {
        const event = this.#eventManager.getById(eventId);
        if (!event) return;

        // Store last focused element for restoration
        this.#lastFocusedElement = document.activeElement;

        const config = event.getCategoryConfig();
        const details = event.getDetails();
        const isFeatured = details.isFeatured;
        const isRegistered = this.#user.isRegistered(eventId);
        const isPast = event.isPastEvent();
        const capacityPct = event.getCapacityPercentage();

        let capacityColor = '--color-success';
        if (capacityPct >= 100) capacityColor = '--color-error';
        else if (capacityPct >= 80) capacityColor = '--color-warning';

        // Action buttons
        let actionHTML;
        if (isRegistered) {
            actionHTML = `
                <span class="event-card__status" style="flex:1; text-align:center; padding: 0.75rem;">✓ Ya estás inscrito</span>
                <button class="btn btn--danger" id="modal-cancel-btn" style="flex:1;">Cancelar inscripción</button>
            `;
        } else if (isPast) {
            actionHTML = `
                <button class="btn btn--secondary" disabled style="flex:1; opacity:0.7;">Evento finalizado</button>
            `;
        } else if (event.isFull()) {
            actionHTML = `
                <button class="btn btn--secondary" disabled style="flex:1; opacity:0.7;">Sin cupos disponibles</button>
            `;
        } else {
            actionHTML = `
                <button class="btn btn--primary" id="modal-register-btn" style="flex:1;">Inscribirse ahora</button>
            `;
        }

        const bannerClass = isFeatured ? 'modal__banner modal__banner--featured' : 'modal__banner';
        const featuredInfo = isFeatured
            ? `
                <div class="modal__info-row" style="background: var(--color-accent-light); padding: 0.75rem; border-radius: var(--radius-md); margin-top: -0.5rem;">
                    <strong>★ ${details.badgeLabel}</strong><br>
                    <span style="font-size: var(--font-size-sm); color: var(--color-text-secondary);">${details.highlightText}</span>
                </div>
            `
            : '';

        this.#elements.modalBody.innerHTML = `
            <div class="${bannerClass}" style="--card-color: ${config.color}; --card-color-dark: ${config.colorDark};"></div>
            <div class="modal__body">
                <span class="modal__category">
                    <span class="event-card__category-dot" style="background: ${config.color}"></span>
                    ${event.getCategory()}
                </span>
                <h2 class="modal__title" id="modal-title">${event.getName()}</h2>
                <div class="modal__info">
                    <div class="modal__info-row">
                        <span class="modal__info-label">Fecha:</span>
                        <span class="modal__info-value">${event.getDateFormatted()}</span>
                    </div>
                    <div class="modal__info-row">
                        <span class="modal__info-label">Lugar:</span>
                        <span class="modal__info-value">${event.getLocation()}</span>
                    </div>
                    <div class="modal__info-row">
                        <span class="modal__info-label">Cupos:</span>
                        <span class="modal__info-value">${event.getRegisteredCount()} / ${event.getCapacity()} inscritos</span>
                    </div>
                </div>
                <div class="modal__capacity-row">
                    <div class="modal__capacity-bar">
                        <div class="modal__capacity-fill" style="width: ${capacityPct}%; background: var(${capacityColor});"></div>
                    </div>
                    <span class="modal__capacity-text">${event.getAvailableSpots()} disponibles</span>
                </div>
                <p class="modal__description">${details.description}</p>
                ${featuredInfo}
                <div class="modal__actions">
                    ${actionHTML}
                </div>
            </div>
        `;

        this.#elements.eventModal.hidden = false;

        // Bind modal action buttons
        const modalRegisterBtn = document.getElementById('modal-register-btn');
        const modalCancelBtn = document.getElementById('modal-cancel-btn');

        if (modalRegisterBtn) {
            modalRegisterBtn.addEventListener('click', () => {
                this.#handleRegister(eventId);
                this.#closeModal();
            });
        }
        if (modalCancelBtn) {
            modalCancelBtn.addEventListener('click', () => {
                this.#handleCancel(eventId);
                this.#closeModal();
            });
        }

        // Focus the close button
        this.#elements.modalClose.focus();

        // Trap focus inside modal
        this.#trapFocus();
    }

    /* --- Close modal --- */
    #closeModal() {
        this.#elements.eventModal.hidden = true;
        this.#elements.modalBody.innerHTML = '';

        // Restore focus
        if (this.#lastFocusedElement) {
            this.#lastFocusedElement.focus();
        }

        // Remove focus trap
        this.#elements.modalDialog.removeEventListener('keydown', this.#focusTrapHandler);
    }

    /* --- Trap focus inside modal (accessibility) --- */
    #trapFocus() {
        this.#focusTrapHandler = (e) => {
            if (e.key !== 'Tab') return;

            const focusable = this.#elements.modalDialog.querySelectorAll(
                'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
            );
            if (focusable.length === 0) return;

            const firstFocusable = focusable[0];
            const lastFocusable = focusable[focusable.length - 1];

            if (e.shiftKey) {
                if (document.activeElement === firstFocusable) {
                    e.preventDefault();
                    lastFocusable.focus();
                }
            } else {
                if (document.activeElement === lastFocusable) {
                    e.preventDefault();
                    firstFocusable.focus();
                }
            }
        };

        this.#elements.modalDialog.addEventListener('keydown', this.#focusTrapHandler);
    }

    /* --- Show toast notification --- */
    #showToast(type, message) {
        const icons = {
            success: '✓',
            error: '✕',
            warning: '⚠',
            info: 'ℹ'
        };

        const toast = document.createElement('div');
        toast.className = `toast toast--${type}`;
        toast.setAttribute('role', 'status');
        toast.innerHTML = `<span class="toast__icon">${icons[type] || 'ℹ'}</span><span>${message}</span>`;

        this.#elements.toastContainer.appendChild(toast);

        // Auto-dismiss after 3.5 seconds
        setTimeout(() => {
            toast.classList.add('toast--fadeout');
            setTimeout(() => toast.remove(), 250);
        }, 3500);
    }

    /* --- Update stats --- */
    #updateStats() {
        this.#elements.statTotal.textContent = this.#eventManager.count;
        this.#elements.statCategories.textContent = this.#eventManager.getCategories().length;
        this.#elements.statRegistered.textContent = this.#user.getRegistrationCount();
    }

    /* --- Update search clear button visibility --- */
    #updateSearchClearButton(value) {
        this.#elements.searchClear.hidden = value === '';
    }

    /* --- Clear all filters --- */
    #clearAllFilters() {
        this.#eventManager.clearFilters();
        this.#elements.searchInput.value = '';
        this.#updateSearchClearButton('');
        this.#renderCategoryFilters();
        this.#renderEvents();
        this.#elements.sortSelect.value = 'date-asc';
    }

    /* --- Close mobile menu --- */
    #closeMobileMenu() {
        this.#elements.headerNav.classList.remove('header__nav--open');
        this.#elements.menuToggle.setAttribute('aria-expanded', 'false');
    }

    /* --- Set active nav link --- */
    #setActiveNavLink(activeLink) {
        this.#elements.navLinks.forEach(link => {
            link.classList.remove('header__link--active');
        });
        activeLink.classList.add('header__link--active');
    }
}

/* =========================
   Seed Data
   ========================= */
function seedEvents() {
    return [
        new FeaturedEvent({
            id: 'evt-01',
            name: 'Festival de Jazz de Lima',
            date: '2026-07-15',
            location: 'Teatro Municipal de Lima',
            category: 'Música',
            capacity: 300,
            registeredCount: 245,
            description: 'Disfruta de una noche única con los mejores artistas del jazz nacional e internacional. Un experiencia musical que combina clasicismo y vanguardia en el histórico Teatro Municipal.',
            badgeLabel: 'Agotando localidades',
            highlightText: '¡Solo quedan 55 entradas! No te pierdas el evento musical del año.'
        }),
        new Event({
            id: 'evt-02',
            name: 'Hackathon IDAT 2026',
            date: '2026-08-20',
            location: 'Campus IDAT — Lima',
            category: 'Tecnología',
            capacity: 150,
            registeredCount: 78,
            description: '48 horas de programación intensa para crear soluciones innovadoras. Premios para los mejores proyectos, networking con empresas tecnológicas y talleres gratuitos.'
        }),
        new FeaturedEvent({
            id: 'evt-03',
            name: 'Conferencia de Liderazgo Ejecutivo',
            date: '2026-08-05',
            location: 'Convention Center Lima',
            category: 'Negocios',
            capacity: 500,
            registeredCount: 410,
            description: 'La conferencia más importante del año para líderes y emprendedores. Aprende de CEOs de empresas internacionales, participa en mesas redondas y amplía tu red de contactos.',
            badgeLabel: 'Plazas limitadas',
            highlightText: 'Conferencia confirmada con 5 CEOs del Fortune 500.'
        }),
        new Event({
            id: 'evt-04',
            name: 'Maratón Costa Verde',
            date: '2026-09-10',
            location: 'Costa Verde, Magdalena',
            category: 'Deportes',
            capacity: 1000,
            registeredCount: 320,
            description: 'Recorre 21 km bordeando la costa de Lima. Medallas para todos los finalistas, hidratación en cada punto de control y certificado oficial de participación.'
        }),
        new Event({
            id: 'evt-05',
            name: 'Cata de Vinos Peruano',
            date: '2026-07-28',
            location: 'Hotel Sheraton, Lima',
            category: 'Gastronomía',
            capacity: 80,
            registeredCount: 80,
            description: 'Una velada de maridaje con vinos de las mejores bodegas peruanas. Sommeliers expertos guiarán la degustación de 8 vinos acompañados de tapas locales.'
        }),
        new Event({
            id: 'evt-06',
            name: 'Exposición de Arte Contemporáneo',
            date: '2026-07-01',
            location: 'MALI — Museo de Arte de Lima',
            category: 'Arte',
            capacity: 200,
            registeredCount: 95,
            description: 'Una selección de obras de los artistas contemporáneos más influyentes del país. La exposición incluye instalaciones, pintura y escultura con recorrido guiado.'
        }),
        new Event({
            id: 'evt-07',
            name: 'Concierto Sinfónico de Primavera',
            date: '2026-10-15',
            location: 'Gran Teatro Nacional',
            category: 'Música',
            capacity: 1200,
            registeredCount: 460,
            description: 'La Orquesta Sinfónica Nacional presenta un programa dedicado a la primavera con obras de Vivaldi, Mahler y compositores peruanos contemporáneos.'
        }),
        new FeaturedEvent({
            id: 'evt-08',
            name: 'Workshop Intensivo de React',
            date: '2026-07-22',
            location: 'IDAT Labs — Lima',
            category: 'Tecnología',
            capacity: 50,
            registeredCount: 38,
            description: 'Aprende React desde los fundamentos hasta patrones avanzados en un día intensivo. Incluye material de apoyo, certificado y almuerzo. Requiere conocimientos básicos de JavaScript.',
            badgeLabel: 'Incluye certificado',
            highlightText: 'Workshop práctico con proyecto real para añadir a tu portafolio.'
        }),
        new Event({
            id: 'evt-09',
            name: 'Torneo de Fútbol Empresarial',
            date: '2026-08-12',
            location: 'Estadio Unión, Surco',
            category: 'Deportes',
            capacity: 22,
            registeredCount: 14,
            description: 'Torneo relámpago 5v5 entre equipos corporativos. Trofeo para el campeón, refrigerios y un día de deporte y networking. ¡Inscríbete con tu equipo!'
        }),
        new FeaturedEvent({
            id: 'evt-10',
            name: 'Festival Gastronómico Mistura',
            date: '2026-09-20',
            location: 'Parque de la Exposición',
            category: 'Gastronomía',
            capacity: 2000,
            registeredCount: 1850,
            description: 'El festival de cocina más grande del país. Más de 50 restaurantes, carretillas y productores en un solo lugar. Shows en vivo, demostraciones de cocina y charlas.',
            badgeLabel: 'Entradas limitadas',
            highlightText: 'El festival gastronómico más esperado con chefs galardonados.'
        }),
        new Event({
            id: 'evt-11',
            name: 'Networking Empresarial 2026',
            date: '2026-08-30',
            location: 'Hotel Hilton, Miraflores',
            category: 'Negocios',
            capacity: 100,
            registeredCount: 62,
            description: 'Conecta con empresarios, inversores y emprendedores en una sesión de networking estructurado. Incluye presentaciones de 3 startups emergentes y ronda de preguntas.'
        }),
        new Event({
            id: 'evt-12',
            name: 'Noche de Cine de Arte',
            date: '2026-07-18',
            location: 'CinePlanet, San Isidro',
            category: 'Arte',
            capacity: 120,
            registeredCount: 30,
            description: 'Proyección especial de tres cortometrajes premiados en festivales internacionales, seguida de un coloquio con los directores. Una experiencia cinematográfica única.'
        })
    ];
}

/* =========================
   Application Bootstrap
   ========================= */
document.addEventListener('DOMContentLoaded', () => {
    // Create data
    const events = seedEvents();
    const eventManager = new EventManager(events);
    const user = new User('Invitado');
    const ui = new UIManager(eventManager, user);

    // Initialize UI
    ui.init();
});