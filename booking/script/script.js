
const airports = {
  "Lebanon": [
    "Beirut — Rafic Hariri International Airport"
  ],
  "Turkey": [
    "Istanbul — Istanbul Airport",
    "Antalya — Antalya Airport"
  ],
  "Greece": [
    "Athens — Eleftherios Venizelos",
    "Thessaloniki — Makedonia Airport"
  ],
  "Kuweit": [
    "Kuwait City — Kuwait International Airport",
    "Al Jahra — Al Jahra Airfield"
  ],
  "Emirates": [
    "Dubai — Dubai International Airport",
    "Abu Dhabi — Abu Dhabi International Airport"
  ],
  "Saudi Arabia": [
    "Riyadh — King Khalid International Airport",
    "Jeddah — King Abdulaziz International Airport"
  ],
  "Egypt": [
    "Cairo — Cairo International Airport",
    "Alexandria — Borg El Arab Airport"
  ],
  "Jordan": [
    "Amman — Queen Alia International Airport",
    "Aqaba — King Hussein International Airport"
  ]
};

const fromSelect = document.getElementById('from-select');
const toSelect = document.getElementById('to-select');
const departInput = document.getElementById('depart-date');
const returnInput = document.getElementById('return-date');
const returnLabel = document.getElementById('return-label');
const whenInfo = document.getElementById('when-info');
const passengerSummary = document.getElementById('passenger-summary');
const adultsInput = document.getElementById('adults');
const minorsInput = document.getElementById('minors');
const form = document.getElementById('booking-form');
const resultsEl = document.getElementById('results');
const resetBtn = document.getElementById('reset-btn');

// base prices per class
const basePrices = {
  economy: 220,
  business: 420,
  first: 980
};

// populate selects using optgroups for countries
function populateSelects() {
  const fragFrom = document.createDocumentFragment();
  const fragTo = document.createDocumentFragment();

  Object.keys(airports).forEach(country=>{
    const og1 = document.createElement('optgroup');
    og1.label = country;
    airports[country].forEach((ap)=>{
      const opt = document.createElement('option');
      opt.value = `${ap} — ${country}`;
      opt.textContent = ap;
      og1.appendChild(opt);
    });
    fragFrom.appendChild(og1);

    const og2 = og1.cloneNode(true);
    fragTo.appendChild(og2);
  });

  fromSelect.appendChild(fragFrom);
  toSelect.appendChild(fragTo);

  // Put placeholder top option
  const placeholderFrom = document.createElement('option');
  placeholderFrom.value = '';
  placeholderFrom.textContent = 'Select origin';
  placeholderFrom.disabled = true;
  placeholderFrom.selected = true;
  fromSelect.prepend(placeholderFrom);

  const placeholderTo = document.createElement('option');
  placeholderTo.value = '';
  placeholderTo.textContent = 'Select destination';
  placeholderTo.disabled = true;
  placeholderTo.selected = true;
  toSelect.prepend(placeholderTo);
}

populateSelects();

// counters
document.querySelectorAll('.counter').forEach(wrapper=>{
  const dec = wrapper.querySelector('.dec');
  const inc = wrapper.querySelector('.inc');
  const input = wrapper.querySelector('input[type="number"]');

  dec.addEventListener('click', ()=>{
    const min = Number(input.min || 0);
    const val = Number(input.value || 0);
    if (val > min) input.value = val - 1;
    updatePassengerSummary();
  });
  inc.addEventListener('click', ()=>{
    const max = Number(input.max || 9);
    const val = Number(input.value || 0);
    if (val < max) input.value = val + 1;
    updatePassengerSummary();
  });
  input.addEventListener('change', ()=>{
    if (input.value === '' || Number(input.value) < Number(input.min)) input.value = input.min;
    if (Number(input.value) > Number(input.max)) input.value = input.max;
    updatePassengerSummary();
  });
});

function updatePassengerSummary() {
  passengerSummary.textContent = `${adultsInput.value} adult${adultsInput.value>1?'s':''} · ${minorsInput.value} minor${minorsInput.value>1?'s':''}`;
}

//lal trip type
document.querySelectorAll('input[name="tripType"]').forEach(r=>{
  r.addEventListener('change', ()=>{
    if (r.value === 'round' && r.checked) {
      returnLabel.classList.remove('hidden');
      returnInput.required = true;
    } else if (r.value === 'oneway' && r.checked) {
      returnLabel.classList.add('hidden');
      returnInput.required = false;
      returnInput.value = '';
    }
  });
});

// display selected departure
departInput.addEventListener('change', () => {
  if (!departInput.value) {
    whenInfo.textContent = 'Departure: —';
    return;
  }
  const d = new Date(departInput.value + 'T00:00:00');
  whenInfo.textContent = `Departure: ${d.toLocaleDateString(undefined, {weekday:'short', year:'numeric', month:'short', day:'numeric'})}`;
  // set min for return if present
  if (returnInput) {
    returnInput.min = departInput.value;
  }
});

//random int between min and max inclusive
function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

//andom float between -pct and +pct 
function randPct(pct = 0.1) {
  return (Math.random() * 2 * pct) - pct;
}

// choose LuxAir aw MEA
function randomCarrier(preferredClass) {
  const roll = Math.random();
  if (roll < 0.15) return 'MEA';
  if (preferredClass === 'first') return 'LuxAir Elite';
  if (Math.random() < 0.5) return 'LuxAir';
  return 'LuxAir Elite';
}

// render session id to allow cancelling in-progress sequential rendering ---
let currentRenderSession = 0;

// taaml delay
function sleep(ms){ return new Promise(res=>setTimeout(res, ms)); }

// form submit -> mocked multiple results
form.addEventListener('submit', (ev)=>{
  ev.preventDefault();
  // basic validation
  if (!fromSelect.value || !toSelect.value) {
    showMessage('Please choose both origin and destination.');
    return;
  }
  if (fromSelect.value === toSelect.value) {
    showMessage('Origin and destination cannot be the same.');
    return;
  }
  if (!departInput.value) {
    showMessage('Choose a departure date.');
    return;
  }
  const ticketType = form.querySelector('input[name="ticketType"]:checked').value;
  const tripType = form.querySelector('input[name="tripType"]:checked').value;
  const adults = Number(adultsInput.value);
  const minors = Number(minorsInput.value);
  const persons = adults + minors;

  // determine how many flights to show: 0to5
  const count = randInt(0,5);

  // bump session id to cancel previous renders if any
  currentRenderSession++;
  const thisSession = currentRenderSession;

  if (count === 0) {
    // cancel previous content and immediately show no-flights
    resultsEl.innerHTML = '';
    const noCard = document.createElement('div');
    noCard.className = 'result-card';
    noCard.style.justifyContent = 'center';
    noCard.textContent = 'No flights at the moment — please try different dates or check back later.';
    resultsEl.appendChild(noCard);
    showMessage('No flights found');
    return;
  }

  // build 
  const results = [];
  for (let i=0;i<count;i++) {
    const base = basePrices[ticketType] || basePrices.economy;
    // adult price vary +-10%
    const adultPrice = Math.round(base * (1 + randPct(0.10)));
    // minors cheaper 70 - 85 % adult
    const minorPrice = Math.round(adultPrice * (0.70 + Math.random() * 0.15));
    const carrier = randomCarrier(ticketType);
    const id = `${carrier === 'MEA' ? 'MEA' : 'LX'}-${randInt(1000,9999)}`;
    results.push({
      id,
      carrier,
      ticketClass: ticketType,
      from: fromSelect.value,
      to: toSelect.value,
      depart: departInput.value,
      return: (tripType === 'round' && returnInput.value) ? returnInput.value : null,
      adultPrice,
      minorPrice,
      adults,
      minors,
      persons
    });
  }

  // clear existing results and start sequential rendering
  resultsEl.innerHTML = '';
  // show immediate header message
  showMessage(`Searching — displaying ${results.length} result${results.length>1?'s':''}...`, 1200);

  // sequentially append flights ma3 delay
  (async function renderSequentially(){
    for (let i=0;i<results.length;i++) {
      // if a new search was started, stop rendering this session
      if (thisSession !== currentRenderSession) return;
      // wait random delay 
      await sleep(randInt(800,1800));
      if (thisSession !== currentRenderSession) return;
      appendFlightCard(results[i], {tripType});
    }
    // small final message
    if (thisSession === currentRenderSession) {
      showMessage(`Displayed ${results.length} flight${results.length>1?'s':''}`, 1400);
    }
  })();
});

function appendFlightCard(f, opts = {}) {
  const card = document.createElement('div');
  card.className = 'result-card';

  const left = document.createElement('div');
  left.className = 'result-left';
  const title = document.createElement('div');
  title.className = 'result-title';
  title.textContent = `${f.carrier} • ${f.id}`;
  const route = document.createElement('div');
  route.className = 'result-sub';
  route.textContent = `${f.from} → ${f.to}`;
  const when = document.createElement('div');
  when.className = 'result-sub';
  const departReadable = new Date(f.depart + 'T00:00:00').toLocaleDateString(undefined, {weekday:'short', month:'short', day:'numeric'});
  let whenText = `Departure: ${departReadable}`;
  if (opts.tripType === 'round' && f.return) {
    const returnReadable = new Date(f.return + 'T00:00:00').toLocaleDateString(undefined, {weekday:'short', month:'short', day:'numeric'});
    whenText += ` • Return: ${returnReadable}`;
  }
  when.textContent = whenText;

  const classLine = document.createElement('div');
  classLine.className = 'result-sub';
  classLine.textContent = `Class: ${capitalize(f.ticketClass)}`;

  // display passengers nicely
  const paxLine = document.createElement('div');
  paxLine.className = 'result-sub';
  // e.g. "Adults: 2 · Minors: 1"
  const adultsText = `${f.adults} adult${f.adults>1?'s':''}`;
  const minorsText = `${f.minors} minor${f.minors>1?'s':''}`;
  paxLine.textContent = `${adultsText} · ${minorsText}`;

  left.appendChild(title);
  left.appendChild(route);
  left.appendChild(when);
  left.appendChild(classLine);
  left.appendChild(paxLine);

  const right = document.createElement('div');
  right.style.textAlign = 'right';
  const price = document.createElement('div');
  const total = (Number(f.adults) * Number(f.adultPrice)) + (Number(f.minors) * Number(f.minorPrice));
  price.textContent = `Total: $${total.toFixed(0)}`;
  price.style.fontWeight = '700';
  price.style.color = '#d4af37'; // gold

  // breakdown price per-person
  const per = document.createElement('div');
  per.className = 'result-sub';
  per.innerHTML = `${f.adults}× $${f.adultPrice} adult${f.adults>1?'s':''}`
                 + (f.minors ? ` · ${f.minors}× $${f.minorPrice} minor${f.minors>1?'s':''}` : '');

  const btn = document.createElement('button');
  btn.className = 'btn primary';
  btn.textContent = 'Reserve';
  //  show alert on reserve then redirect to ../main/index.html
  btn.addEventListener('click', ()=> {
    // show a confirmation alert with booking summary
    const summary = `${f.carrier} ${f.id}\nPassengers: ${f.adults} adult${f.adults>1?'s':''}${f.minors ? ', ' + f.minors + ' minor' + (f.minors>1?'s':'') : ''}\nTotal: $${total.toFixed(0)}\n\nYou have booked successfully.`;
    // use window.alert for the prompt
    window.alert(summary);
    // navigate back to the requested page
    window.location.href = '../main/index.html';
  });

  right.appendChild(price);
  right.appendChild(per);
  right.appendChild(btn);

  card.appendChild(left);
  card.appendChild(right);
  resultsEl.appendChild(card);

  // subtle entrance effect
  card.style.opacity = '0';
  card.style.transform = 'translateY(6px)';
  requestAnimationFrame(()=>{
    card.style.transition = 'opacity .28s ease, transform .28s ease';
    card.style.opacity = '1';
    card.style.transform = 'translateY(0)';
  });
}

function capitalize(s){
  if (!s) return s;
  return s[0].toUpperCase() + s.slice(1);
}

// small toast-like message using results area
function showMessage(text, ms = 2400) {
  // create a transient message element
  const el = document.createElement('div');
  el.className = 'result-card';
  el.style.justifyContent = 'center';
  el.textContent = text;
  resultsEl.prepend(el);
  setTimeout(()=> {
    if (el.parentNode) el.parentNode.removeChild(el);
  }, ms);
}

// reset
resetBtn.addEventListener('click', ()=>{
  form.reset();
  // reset selects to placeholder
  fromSelect.selectedIndex = 0;
  toSelect.selectedIndex = 0;
  departInput.value = '';
  returnInput.value = '';
  returnLabel.classList.add('hidden');
  returnInput.required = false;
  adultsInput.value = 1;
  minorsInput.value = 0;
  whenInfo.textContent = 'Departure: —';
  passengerSummary.textContent = '1 adult · 0 minors';
  resultsEl.innerHTML = '';
  // cancel any in-progress render
  currentRenderSession++;
});



// initialize min dates
(function initDates(){
  const today = new Date().toISOString().slice(0,10);
  departInput.min = today;
  returnInput.min = today;
  updatePassengerSummary();
})();