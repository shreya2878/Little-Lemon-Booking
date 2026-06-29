/**
 * Little Lemon Chicago Table Booking App
 * Coursera Meta Front-End Capstone Project JS Logic
 */

// --- SEED RUN API SIMULATION (As required by Capstone instructions) ---
const seededRandom = function (seed) {
    var m = Math.pow(2, 35) - 31;
    var a = 185852;
    var c = 0;
    var s = seed % m;
    return function () {
        return (s = (s * a + c) % m) / m;
    };
};

const fetchAPI = function(dateObj) {
    let result = [];
    // seed using day of month + month to vary slots slightly by month too
    let seed = dateObj.getDate() + (dateObj.getMonth() * 31);
    let random = seededRandom(seed);

    for(let i = 17; i <= 23; i++) {
        if(random() < 0.5) {
            result.push(i + ':00');
        }
        if(random() < 0.5) {
            result.push(i + ':30');
        }
    }
    // Guarantee at least some slots if random leads to empty
    if (result.length === 0) {
        result = ['17:00', '18:30', '20:00', '21:30'];
    }
    return result;
};

const submitAPI = function(formData) {
    return true;
};

// --- DATA STRUCTURES ---
const TABLES = [
    { id: 1, name: "Table 1", seating: "Indoor", size: 2 },
    { id: 2, name: "Table 2", seating: "Indoor", size: 4 },
    { id: 3, name: "Table 3", seating: "Indoor", size: 4 },
    { id: 4, name: "Table 4", seating: "Indoor", size: 6 },
    { id: 5, name: "Table 5", seating: "Outdoor", size: 2 },
    { id: 6, name: "Table 6", seating: "Outdoor", size: 4 },
    { id: 7, name: "Table 7", seating: "Outdoor", size: 4 },
    { id: 8, name: "Table 8", seating: "Outdoor", size: 6 },
    { id: 9, name: "Bar 9", seating: "Bar", size: 1 },
    { id: 10, name: "Bar 10", seating: "Bar", size: 1 },
    { id: 11, name: "Bar 11", seating: "Bar", size: 2 },
    { id: 12, name: "Bar 12", seating: "Bar", size: 2 }
];

// --- APP STATE ---
let bookingState = {
    date: '',
    time: '',
    guests: 1,
    occasion: 'None',
    seating: 'Indoor',
    selectedTableId: null,
    guestInfo: {
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        comments: ''
    }
};

let activeSection = 'home';
let activeDashboardTab = 'upcoming';

// --- INITIALIZE PAGE ---
document.addEventListener('DOMContentLoaded', () => {
    initApp();
});

function initApp() {
    // Setup date constraints (min = today)
    const dateInput = document.getElementById('res-date');
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    const todayStr = `${yyyy}-${mm}-${dd}`;
    dateInput.min = todayStr;
    dateInput.value = todayStr;
    
    // Bind date change listener to fetch new slots
    dateInput.addEventListener('change', handleDateChange);
    
    // Initial fetch of slots for today
    bookingState.date = todayStr;
    updateAvailableTimes(today);

    // Mobile Navbar Menu Toggle
    const navToggle = document.getElementById('nav-toggle');
    const navMenu = document.getElementById('nav-menu');
    navToggle.addEventListener('click', () => {
        navMenu.classList.toggle('show');
    });

    // Close menu when clicking links
    document.querySelectorAll('.nav-menu a').forEach(link => {
        link.addEventListener('click', () => {
            navMenu.classList.remove('show');
        });
    });

    // Setup forms submit interception
    const guestForm = document.getElementById('booking-guest-form');
    guestForm.addEventListener('submit', handleBookingSubmit);

    // Modal Close
    document.getElementById('close-confirm-modal').addEventListener('click', () => {
        closeConfirmationAndGoHome();
    });

    // Render bookings board
    renderBookingsDashboard();
}

// --- DYNAMIC SLOTS UPDATE ---
function handleDateChange(e) {
    const dateVal = e.target.value;
    if (!dateVal) return;
    
    bookingState.date = dateVal;
    const dateObj = new Date(dateVal);
    updateAvailableTimes(dateObj);
}

function updateAvailableTimes(dateObj) {
    const timeSelect = document.getElementById('res-time');
    timeSelect.innerHTML = '<option value="" disabled selected>Select a time slot</option>';
    
    const slots = fetchAPI(dateObj);
    slots.forEach(slot => {
        const option = document.createElement('option');
        option.value = slot;
        option.textContent = formatTime12h(slot);
        timeSelect.appendChild(option);
    });

    // Sync state
    bookingState.time = '';
    
    // Check if step 2 needs rendering refresh (if visible)
    if (!document.getElementById('booking-step-table').classList.contains('hidden')) {
        renderSeatingMap();
    }
}

// Helper to convert 24h to 12h representation for visual appeal
function formatTime12h(time24) {
    const [hours, minutes] = time24.split(':');
    let h = parseInt(hours);
    const ampm = h >= 12 ? 'PM' : 'AM';
    h = h % 12;
    h = h ? h : 12; // 0 should be 12
    return `${h}:${minutes} ${ampm}`;
}

// --- ROUTER (SPA VIEWS SWITCHER) ---
function navigateTo(sectionId) {
    activeSection = sectionId;
    
    // Hide all sections
    document.querySelectorAll('.page-section').forEach(sec => {
        sec.classList.add('hidden');
    });
    
    // Show target section
    document.getElementById(`section-${sectionId}`).classList.remove('hidden');
    
    // Update nav links active class
    document.querySelectorAll('.nav-menu a').forEach(link => {
        link.classList.remove('active');
    });
    
    const targetLink = document.getElementById(`nav-${sectionId}`);
    if (targetLink) {
        targetLink.classList.add('active');
    }
    
    // Reset booking forms when navigating to booking section
    if (sectionId === 'booking') {
        resetBookingFlow();
    }
    
    // Render dashboard if navigating to dashboard
    if (sectionId === 'my-bookings') {
        renderBookingsDashboard();
    }
    
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function scrollToSection(elemId) {
    if (activeSection !== 'home') {
        navigateTo('home');
        // Let transition happen then scroll
        setTimeout(() => {
            const el = document.getElementById(elemId);
            if (el) el.scrollIntoView({ behavior: 'smooth' });
        }, 150);
    } else {
        const el = document.getElementById(elemId);
        if (el) el.scrollIntoView({ behavior: 'smooth' });
    }
}

// --- BOOKING FLOW STEP ACTIONS ---

function resetBookingFlow() {
    bookingState = {
        date: document.getElementById('res-date').value,
        time: '',
        guests: 1,
        occasion: 'None',
        seating: 'Indoor',
        selectedTableId: null,
        guestInfo: { firstName: '', lastName: '', email: '', phone: '', comments: '' }
    };
    
    // Reset forms
    document.getElementById('booking-details-form').reset();
    document.getElementById('booking-guest-form').reset();
    
    // Show step 1 panel
    document.getElementById('booking-step-details').classList.remove('hidden');
    document.getElementById('booking-step-table').classList.add('hidden');
    document.getElementById('booking-step-guest').classList.add('hidden');
    
    // Set step numbers styling
    document.getElementById('progress-step-1').className = 'step-active';
    document.getElementById('progress-step-2').className = '';
    document.getElementById('progress-step-3').className = '';
    
    // Re-verify date & time defaults
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    const todayStr = `${yyyy}-${mm}-${dd}`;
    document.getElementById('res-date').value = todayStr;
    bookingState.date = todayStr;
    updateAvailableTimes(today);
}

// Step 1 -> Step 2
function proceedToStep2() {
    if (validateStep1()) {
        // Collect step 1 form data
        bookingState.date = document.getElementById('res-date').value;
        bookingState.time = document.getElementById('res-time').value;
        bookingState.guests = parseInt(document.getElementById('guests').value || 1);
        bookingState.occasion = document.getElementById('occasion').value;
        
        // Seating radio buttons collection
        const seatingRadios = document.getElementsByName('seating');
        for (const radio of seatingRadios) {
            if (radio.checked) {
                bookingState.seating = radio.value;
                break;
            }
        }
        
        // Render seating layout map based on selections
        renderSeatingMap();
        
        // Switch Panels
        document.getElementById('booking-step-details').classList.add('hidden');
        document.getElementById('booking-step-table').classList.remove('hidden');
        
        // Switch Progress step classes
        document.getElementById('progress-step-1').className = 'step-done';
        document.getElementById('progress-step-2').className = 'step-active';
    }
}

// Back Step 2 -> Step 1
function goBackToStep1() {
    document.getElementById('booking-step-table').classList.add('hidden');
    document.getElementById('booking-step-details').classList.remove('hidden');
    
    document.getElementById('progress-step-1').className = 'step-active';
    document.getElementById('progress-step-2').className = '';
}

// Step 2 -> Step 3
function proceedToStep3() {
    if (bookingState.selectedTableId !== null) {
        document.getElementById('booking-step-table').classList.add('hidden');
        document.getElementById('booking-step-guest').classList.remove('hidden');
        
        document.getElementById('progress-step-2').className = 'step-done';
        document.getElementById('progress-step-3').className = 'step-active';
    }
}

// Back Step 3 -> Step 2
function goBackToStep2() {
    document.getElementById('booking-step-guest').classList.add('hidden');
    document.getElementById('booking-step-table').classList.remove('hidden');
    
    document.getElementById('progress-step-2').className = 'step-active';
    document.getElementById('progress-step-3').className = '';
}

// --- FORM VALIDATION ---

function validateStep1() {
    let isValid = true;
    
    // Date validation
    const dateInput = document.getElementById('res-date');
    const dateGroup = dateInput.closest('.form-group');
    const selectedDate = new Date(dateInput.value);
    const today = new Date();
    today.setHours(0,0,0,0);
    
    if (!dateInput.value || selectedDate < today) {
        dateGroup.classList.add('invalid');
        isValid = false;
    } else {
        dateGroup.classList.remove('invalid');
    }
    
    // Time validation
    const timeSelect = document.getElementById('res-time');
    const timeGroup = timeSelect.closest('.form-group');
    if (!timeSelect.value) {
        timeGroup.classList.add('invalid');
        isValid = false;
    } else {
        timeGroup.classList.remove('invalid');
    }
    
    // Guests validation
    const guestsInput = document.getElementById('guests');
    const guestsGroup = guestsInput.closest('.form-group');
    const guestVal = parseInt(guestsInput.value);
    if (!guestsInput.value || guestVal < 1 || guestVal > 10) {
        guestsGroup.classList.add('invalid');
        isValid = false;
    } else {
        guestsGroup.classList.remove('invalid');
    }
    
    return isValid;
}

function validateStep3() {
    let isValid = true;
    
    // First Name
    const firstName = document.getElementById('first-name');
    const firstGroup = firstName.closest('.form-group');
    if (!firstName.value.trim()) {
        firstGroup.classList.add('invalid');
        isValid = false;
    } else {
        firstGroup.classList.remove('invalid');
    }
    
    // Last Name
    const lastName = document.getElementById('last-name');
    const lastGroup = lastName.closest('.form-group');
    if (!lastName.value.trim()) {
        lastGroup.classList.add('invalid');
        isValid = false;
    } else {
        lastGroup.classList.remove('invalid');
    }
    
    // Email Regex Validation
    const email = document.getElementById('email');
    const emailGroup = email.closest('.form-group');
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.value)) {
        emailGroup.classList.add('invalid');
        isValid = false;
    } else {
        emailGroup.classList.remove('invalid');
    }
    
    // Phone Regex Validation (Allowing spaces/dashes, min 10 digits)
    const phone = document.getElementById('phone');
    const phoneGroup = phone.closest('.form-group');
    const cleanPhone = phone.value.replace(/\D/g, '');
    if (cleanPhone.length < 10) {
        phoneGroup.classList.add('invalid');
        isValid = false;
    } else {
        phoneGroup.classList.remove('invalid');
    }
    
    // Terms Checkbox
    const agree = document.getElementById('agree-terms');
    const termsWrapper = agree.closest('.terms-checkbox');
    if (!agree.checked) {
        termsWrapper.classList.add('invalid');
        isValid = false;
    } else {
        termsWrapper.classList.remove('invalid');
    }
    
    return isValid;
}

// --- RENDER DYNAMIC SEATING MAP ---
function renderSeatingMap() {
    const grid = document.getElementById('seating-tables-grid');
    const summary = document.getElementById('table-summary-info');
    const nextBtn = document.getElementById('btn-to-step3');
    
    grid.innerHTML = '';
    bookingState.selectedTableId = null;
    nextBtn.disabled = true;
    summary.innerHTML = `<i class="fa-solid fa-circle-info"></i> Please select a table to seat ${bookingState.guests} guests.`;
    
    // Filter tables matching selected Seating Preference
    const filteredTables = TABLES.filter(t => t.seating === bookingState.seating);
    
    // Determine reservation status for each table in advance
    let reservedCount = 0;
    const tableStates = filteredTables.map(table => {
        let dateObj = new Date(bookingState.date);
        let timeSeed = bookingState.time.replace(':', '');
        let seed = dateObj.getDate() + dateObj.getMonth() + parseInt(timeSeed) + table.id;
        let random = seededRandom(seed);
        
        // Simulating booking density (35% tables reserved by default)
        const isReserved = random() < 0.35;
        if (isReserved) reservedCount++;
        return { table, isReserved };
    });
    
    // UX Safeguard: If all tables in this section are reserved, make the best match table available so the user never gets stuck!
    if (reservedCount === filteredTables.length && filteredTables.length > 0) {
        let bestMatch = filteredTables[0];
        let minDiff = Infinity;
        filteredTables.forEach(t => {
            if (t.size >= bookingState.guests) {
                let diff = t.size - bookingState.guests;
                if (diff < minDiff) {
                    minDiff = diff;
                    bestMatch = t;
                }
            } else {
                // If it doesn't fit, add a penalty, but still rank it
                let diff = (bookingState.guests - t.size) * 10;
                if (diff < minDiff) {
                    minDiff = diff;
                    bestMatch = t;
                }
            }
        });
        
        // Force this best match table to be available
        const stateObj = tableStates.find(s => s.table.id === bestMatch.id);
        if (stateObj) {
            stateObj.isReserved = false;
        }
    }
    
    tableStates.forEach(({ table, isReserved }) => {
        // Match state classes
        let statusClass = 'standard'; // available but not perfect size match
        if (isReserved) {
            statusClass = 'reserved';
        } else {
            // Check if this table matches or exceeds size nicely
            // Perfect match is when table capacity fits guest count, and is closest to it
            // Highlight table in yellow as "Available & Recommended" if capacity >= guests and <= guests + 2
            if (table.size >= bookingState.guests && table.size <= bookingState.guests + 2) {
                statusClass = 'available';
            }
        }
        
        // Create Table Node
        const tblEl = document.createElement('div');
        tblEl.className = `table-element size-${table.size} ${statusClass}`;
        tblEl.id = `table-node-${table.id}`;
        
        tblEl.innerHTML = `
            <span class="table-label">${table.name}</span>
            <span class="table-capacity"><i class="fa-solid fa-users"></i> ${table.size}</span>
        `;
        
        if (!isReserved) {
            tblEl.addEventListener('click', () => {
                selectSeatingTable(table, filteredTables);
            });
        }
        
        grid.appendChild(tblEl);
    });
}

function selectSeatingTable(table, allFiltered) {
    const summary = document.getElementById('table-summary-info');
    const nextBtn = document.getElementById('btn-to-step3');
    
    // Remove previous selection formatting
    allFiltered.forEach(t => {
        const node = document.getElementById(`table-node-${t.id}`);
        if (node) {
            node.classList.remove('selected');
            // Restore previous matching state
            if (!node.classList.contains('reserved')) {
                if (t.size >= bookingState.guests && t.size <= bookingState.guests + 2) {
                    node.classList.add('available');
                } else {
                    node.classList.add('standard');
                }
            }
        }
    });
    
    // Select this one
    bookingState.selectedTableId = table.id;
    const selectedNode = document.getElementById(`table-node-${table.id}`);
    selectedNode.classList.remove('available', 'standard');
    selectedNode.classList.add('selected');
    
    // Enable button
    nextBtn.disabled = false;
    
    // Show details
    summary.innerHTML = `<i class="fa-solid fa-circle-check" style="color: var(--success-color)"></i> <strong>Selected:</strong> ${table.name} (${table.seating} area) - fits up to ${table.size} guests.`;
}

// --- BOOKING SUBMISSION & LOCALSTORAGE ---

function handleBookingSubmit(e) {
    e.preventDefault();
    
    if (validateStep3()) {
        // Collect guest info
        bookingState.guestInfo.firstName = document.getElementById('first-name').value.trim();
        bookingState.guestInfo.lastName = document.getElementById('last-name').value.trim();
        bookingState.guestInfo.email = document.getElementById('email').value.trim();
        bookingState.guestInfo.phone = document.getElementById('phone').value.trim();
        bookingState.guestInfo.comments = document.getElementById('comments').value.trim();
        
        // Mock api submit
        const success = submitAPI(bookingState);
        
        if (success) {
            // Generate ticket details
            const refCode = 'LL-' + Math.floor(100000 + Math.random() * 900000);
            const tableObj = TABLES.find(t => t.id === bookingState.selectedTableId);
            
            const bookingRecord = {
                refCode: refCode,
                date: bookingState.date,
                time: bookingState.time,
                guests: bookingState.guests,
                occasion: bookingState.occasion,
                seating: bookingState.seating,
                tableName: tableObj ? tableObj.name : 'Selected Table',
                guestName: `${bookingState.guestInfo.firstName} ${bookingState.guestInfo.lastName}`,
                email: bookingState.guestInfo.email,
                phone: bookingState.guestInfo.phone,
                comments: bookingState.guestInfo.comments,
                createdAt: new Date().toISOString()
            };
            
            // Save in localStorage
            saveBookingToLocalStorage(bookingRecord);
            
            // Render modal values
            document.getElementById('conf-guest-name').textContent = bookingRecord.guestName;
            document.getElementById('conf-ref-code').textContent = bookingRecord.refCode;
            document.getElementById('conf-date').textContent = formatDateVisual(bookingRecord.date);
            document.getElementById('conf-time').textContent = formatTime12h(bookingRecord.time);
            document.getElementById('conf-guests').textContent = `${bookingRecord.guests} People`;
            document.getElementById('conf-table').textContent = `${bookingRecord.tableName} (${bookingRecord.seating})`;
            document.getElementById('conf-occasion').textContent = bookingRecord.occasion;
            document.getElementById('conf-seating').textContent = `${bookingRecord.seating} Seating`;
            
            // Show modal
            document.getElementById('confirmation-modal').classList.remove('hidden');
        }
    }
}

function saveBookingToLocalStorage(booking) {
    let bookings = [];
    const saved = localStorage.getItem('little_lemon_bookings');
    if (saved) {
        bookings = JSON.parse(saved);
    }
    bookings.push(booking);
    localStorage.setItem('little_lemon_bookings', JSON.stringify(bookings));
}

function closeConfirmationAndGoHome() {
    document.getElementById('confirmation-modal').classList.add('hidden');
    navigateTo('home');
}

// Helper to convert yyyy-mm-dd to readable visual string
function formatDateVisual(dateStr) {
    const parts = dateStr.split('-');
    const date = new Date(parts[0], parts[1] - 1, parts[2]);
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
}

// --- MY BOOKINGS DASHBOARD RENDER ---

function switchDashboardTab(tabType) {
    activeDashboardTab = tabType;
    
    document.getElementById('tab-upcoming').classList.remove('active');
    document.getElementById('tab-past').classList.remove('active');
    
    document.getElementById(`tab-${tabType}`).classList.add('active');
    renderBookingsDashboard();
}

function renderBookingsDashboard() {
    const container = document.getElementById('bookings-list-container');
    container.innerHTML = '';
    
    // Retrieve from localStorage
    const saved = localStorage.getItem('little_lemon_bookings');
    let bookings = saved ? JSON.parse(saved) : [];
    
    // Sort bookings by date and time (ascending)
    bookings.sort((a, b) => {
        const dateTimeA = new Date(`${a.date}T${a.time}`);
        const dateTimeB = new Date(`${b.date}T${b.time}`);
        return dateTimeA - dateTimeB;
    });
    
    const now = new Date();
    
    // Filter based on selected tab
    const filtered = bookings.filter(b => {
        const bDateTime = new Date(`${b.date}T${b.time}`);
        if (activeDashboardTab === 'upcoming') {
            return bDateTime >= now;
        } else {
            return bDateTime < now;
        }
    });
    
    if (filtered.length === 0) {
        container.innerHTML = `
            <div class="no-bookings">
                <i class="fa-regular fa-calendar-times"></i>
                <p>No ${activeDashboardTab} reservations found.</p>
                ${activeDashboardTab === 'upcoming' ? '<button class="btn btn-primary" onclick="navigateTo(\'booking\')">Book a Table Now</button>' : ''}
            </div>
        `;
        return;
    }
    
    filtered.forEach(booking => {
        const card = document.createElement('div');
        card.className = 'booking-item-card';
        
        card.innerHTML = `
            <div class="booking-item-details">
                <div class="booking-item-ref">
                    <span class="label">Booking REF</span>
                    <span class="val">${booking.refCode}</span>
                </div>
                <div class="booking-data-block">
                    <span class="label">Date & Time</span>
                    <span class="val"><i class="fa-regular fa-calendar"></i> ${formatDateVisual(booking.date)} at ${formatTime12h(booking.time)}</span>
                </div>
                <div class="booking-data-block">
                    <span class="label">Table Details</span>
                    <span class="val"><i class="fa-solid fa-chair"></i> ${booking.tableName} (${booking.seating} area)</span>
                </div>
                <div class="booking-data-block">
                    <span class="label">Party & Occasion</span>
                    <span class="val"><i class="fa-solid fa-user-group"></i> ${booking.guests} Guests ${booking.occasion !== 'None' ? `| ${booking.occasion}` : ''}</span>
                </div>
            </div>
            <div class="booking-item-actions">
                ${activeDashboardTab === 'upcoming' ? `
                    <button class="btn-cancel" onclick="cancelReservation('${booking.refCode}')">
                        <i class="fa-solid fa-trash-can"></i> Cancel
                    </button>
                ` : `
                    <span class="val" style="color: #888888; font-weight: 700; font-size: 0.95rem;">
                        <i class="fa-solid fa-circle-check" style="color: #a3a3a3"></i> Completed
                    </span>
                `}
            </div>
        `;
        
        container.appendChild(card);
    });
}

function cancelReservation(refCode) {
    if (confirm(`Are you sure you want to cancel reservation ${refCode}?`)) {
        const saved = localStorage.getItem('little_lemon_bookings');
        if (saved) {
            let bookings = JSON.parse(saved);
            bookings = bookings.filter(b => b.refCode !== refCode);
            localStorage.setItem('little_lemon_bookings', JSON.stringify(bookings));
            renderBookingsDashboard();
        }
    }
}
