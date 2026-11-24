const STORAGE_KEY = 'sora_tea_bookings_v1';

const SPOTS = [
  { id: 'engawa', name: 'Engawa Deck', note: 'Garden breeze • 2–4p' },
  { id: 'tatami', name: 'Tatami Alcove', note: 'Low table • 2–4p' },
  { id: 'window', name: 'Window Counter', note: 'Solo / duo • 1–2p' },
  { id: 'hearth', name: 'Kettle Hearth', note: 'Warm & quiet • 2–4p' }
];

const SLOTS = ['10:00 AM', '12:00 PM', '02:30 PM', '04:30 PM', '07:00 PM'];

let selectedSpot = SPOTS[0].id;
let selectedSlot = SLOTS[1];
let editingId = null;
let bookings = loadBookings();

const today = new Date().toISOString().slice(0, 10);
const dateInput = document.getElementById('dateInput');
const guestsInput = document.getElementById('guestsInput');
const nameInput = document.getElementById('nameInput');
const emailInput = document.getElementById('emailInput');
const submitBtn = document.getElementById('submitBtn');
const editBanner = document.getElementById('editBanner');
const msg = document.getElementById('msg');

dateInput.min = today;
dateInput.value = today;

function loadBookings() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
  } catch {
    return [];
  }
}

function saveBookings() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(bookings));
  } catch {}
}

function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function renderSpots() {
  const el = document.getElementById('spots');
  el.innerHTML = SPOTS.map(s => `
    <button type="button" class="spot ${s.id === selectedSpot ? 'active' : ''}" data-id="${s.id}">
      <span class="spot-title">${s.name}</span>
      <span class="spot-note">${s.note}</span>
    </button>
  `).join('');

  el.querySelectorAll('.spot').forEach(btn => {
    btn.addEventListener('click', () => {
      selectedSpot = btn.dataset.id;
      renderSpots();
    });
  });
}

function renderSlots() {
  const el = document.getElementById('slots');
  el.innerHTML = SLOTS.map(t => `
    <button type="button" class="slot ${t === selectedSlot ? 'active' : ''}" data-slot="${t}">${t}</button>
  `).join('');

  el.querySelectorAll('.slot').forEach(btn => {
    btn.addEventListener('click', () => {
      selectedSlot = btn.dataset.slot;
      renderSlots();
    });
  });
}

function resetFormMode() {
  editingId = null;
  editBanner.classList.remove('show');
  submitBtn.textContent = 'Confirm Table';
  dateInput.value = today;
  guestsInput.value = '2';
  nameInput.value = '';
  emailInput.value = '';
  selectedSpot = SPOTS[0].id;
  selectedSlot = SLOTS[1];
  renderSpots();
  renderSlots();
}

function startEdit(id) {
  const record = bookings.find(b => b.id === id);
  if (!record) return;

  editingId = record.id;
  selectedSpot = record.spotId;
  selectedSlot = record.slot;
  dateInput.value = record.date;
  guestsInput.value = record.guests;
  nameInput.value = record.name;
  emailInput.value = record.email;

  renderSpots();
  renderSlots();

  document.getElementById('editBannerText').textContent = `Editing reservation ${record.code}`;
  editBanner.classList.add('show');
  submitBtn.textContent = 'Save Changes';
  msg.textContent = '';
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function deleteBooking(id) {
  bookings = bookings.filter(b => b.id !== id);
  saveBookings();
  if (editingId === id) resetFormMode();
  renderRecords();
}

function renderRecords() {
  const list = document.getElementById('recordList');
  document.getElementById('recordCount').textContent = `${bookings.length} Saved`;

  if (!bookings.length) {
    list.innerHTML = `<div class="empty-records">No bookings recorded yet. Confirm a table above to add one.</div>`;
    return;
  }

  list.innerHTML = bookings.map(b => `
    <div class="record-card">
      <div>
        <div class="record-main">
          <span class="record-code">${b.code}</span>
          ${escapeHtml(b.spotName)} &bull; ${b.date} at ${b.slot}
        </div>
        <div class="record-meta">
          ${escapeHtml(b.name)} (${escapeHtml(b.email)}) &bull; ${b.guests} ${Number(b.guests) === 1 ? 'Guest' : 'Guests'}
        </div>
      </div>
      <div class="record-actions">
        <button type="button" class="action-btn edit" data-edit="${b.id}">Edit</button>
        <button type="button" class="action-btn delete" data-delete="${b.id}">Delete</button>
      </div>
    </div>
  `).join('');

  list.querySelectorAll('[data-edit]').forEach(btn => {
    btn.addEventListener('click', () => startEdit(btn.dataset.edit));
  });

  list.querySelectorAll('[data-delete]').forEach(btn => {
    btn.addEventListener('click', () => deleteBooking(btn.dataset.delete));
  });
}

document.getElementById('cancelEditBtn').addEventListener('click', () => {
  msg.textContent = '';
  resetFormMode();
});

document.getElementById('bookingForm').addEventListener('submit', (e) => {
  e.preventDefault();
  const name = nameInput.value.trim();
  const email = emailInput.value.trim();
  const date = dateInput.value;
  const guests = guestsInput.value;
  const spotObj = SPOTS.find(s => s.id === selectedSpot);

  if (!date) return (msg.textContent = 'Please select a date.');
  if (!name) return (msg.textContent = 'Please enter your name.');
  if (!email || !email.includes('@')) return (msg.textContent = 'Please enter a valid email.');

  msg.textContent = '';

  if (editingId) {
    bookings = bookings.map(b =>
      b.id === editingId
        ? { ...b, spotId: spotObj.id, spotName: spotObj.name, date, slot: selectedSlot, guests, name, email }
        : b
    );
  } else {
    bookings.unshift({
      id: String(Date.now()),
      code: `SR-${Math.floor(100 + Math.random() * 900)}`,
      spotId: spotObj.id,
      spotName: spotObj.name,
      date,
      slot: selectedSlot,
      guests,
      name,
      email
    });
  }

  saveBookings();
  resetFormMode();
  renderRecords();
});

renderSpots();
renderSlots();
renderRecords();