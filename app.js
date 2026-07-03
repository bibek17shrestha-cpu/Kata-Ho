let postType = 'offer';
let filter = 'all';
let posts = [];

const listEl = document.getElementById('list');
const overlay = document.getElementById('overlay');

function esc(s){
  const d = document.createElement('div');
  d.textContent = s;
  return d.innerHTML;
}

function fmtDate(dateStr, timeStr){
  if(!dateStr) return 'Date TBD';
  const d = new Date(dateStr + 'T' + (timeStr || '00:00'));
  const dateOut = d.toLocaleDateString(undefined, {weekday:'short', month:'short', day:'numeric'});
  const timeOut = timeStr ? d.toLocaleTimeString(undefined, {hour:'numeric', minute:'2-digit'}) : '';
  return timeOut ? dateOut + ' · ' + timeOut : dateOut;
}

function trailSvg(){
  return `<svg viewBox="0 0 200 14" preserveAspectRatio="none">
    <circle cx="4" cy="7" r="3" fill="#E8A33D"/>
    <line x1="4" y1="7" x2="196" y2="7" stroke="#E8A33D" stroke-width="1.3" stroke-dasharray="1 7" stroke-linecap="round" opacity="0.75"/>
    <circle cx="196" cy="7" r="3" fill="#3E7CB1"/>
  </svg>`;
}

function render(){
  const filtered = posts.filter(p => filter === 'all' || p.type === filter);
  if(filtered.length === 0){
    listEl.innerHTML = `<div class="empty">Nothing posted here yet. Be the first — tap "+ Post" above.</div>`;
    return;
  }
  listEl.innerHTML = filtered.map(p => {
    const isOffer = p.type === 'offer';
    const matched = p.status === 'matched';
    return `
    <div class="card" data-id="${p.id}">
      <div class="card-top">
        <span class="type-tag ${isOffer ? 'type-offer' : 'type-request'}">${isOffer ? 'Offering a ride' : 'Needs a ride'}</span>
        <span class="status ${matched ? 'matched' : ''}">${matched ? '● connected' : '○ open'}</span>
      </div>
      <div class="route">
        <div class="place">${esc(p.from)}</div>
        <div class="line">${trailSvg()}</div>
        <div class="place">${esc(p.to)}</div>
      </div>
      <div class="meta">
        <span>${fmtDate(p.date, p.time)}</span>
        ${isOffer ? `<span>${p.seats} seat${p.seats == 1 ? '' : 's'} free</span>` : ''}
      </div>
      ${p.note ? `<div class="note">${esc(p.note)}</div>` : ''}
      <div class="card-foot">
        <div class="poster">posted by ${esc(p.name)}</div>
        <div class="actions">
          ${matched ? '' : `<button class="btn-connect" data-action="connect" data-id="${p.id}">Connect</button>`}
          <button class="btn-delete" data-action="delete" data-id="${p.id}">Remove</button>
        </div>
      </div>
      <div class="contact-reveal" id="reveal-${p.id}" style="display:none;">
        <b>Reach out:</b> ${esc(p.contact || 'not provided')}
        ${matched ? '' : `<div style="margin-top:8px;"><button class="btn-connect" data-action="markMatched" data-id="${p.id}">Mark as connected</button></div>`}
      </div>
    </div>`;
  }).join('');
}

async function loadPosts(){
  try{
    const res = await fetch('/api/rides');
    if(!res.ok) throw new Error('bad response');
    posts = await res.json();
    render();
  }catch(e){
    listEl.innerHTML = `<div class="empty">Couldn't load the board. Try refreshing.</div>`;
  }
}

document.querySelectorAll('.pill').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.pill').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    filter = btn.dataset.filter;
    render();
  });
});

listEl.addEventListener('click', async (e) => {
  const btn = e.target.closest('button[data-action]');
  if(!btn) return;
  const id = btn.dataset.id;
  const action = btn.dataset.action;

  if(action === 'connect'){
    document.getElementById('reveal-' + id).style.display = 'block';
    btn.style.display = 'none';
  } else if(action === 'markMatched'){
    try{
      await fetch('/api/rides/' + id, {
        method: 'PATCH',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({status: 'matched'})
      });
      const p = posts.find(x => x.id === id);
      if(p) p.status = 'matched';
      render();
    }catch(err){}
  } else if(action === 'delete'){
    if(!confirm('Remove this post from the board?')) return;
    try{
      await fetch('/api/rides/' + id, { method: 'DELETE' });
      posts = posts.filter(x => x.id !== id);
      render();
    }catch(err){}
  }
});

document.getElementById('openModal').addEventListener('click', () => {
  overlay.style.display = 'flex';
});
document.getElementById('cancelModal').addEventListener('click', () => {
  overlay.style.display = 'none';
});
overlay.addEventListener('click', (e) => { if(e.target === overlay) overlay.style.display = 'none'; });

function setType(t){
  postType = t;
  document.getElementById('typeOffer').className = t === 'offer' ? 'sel-offer' : '';
  document.getElementById('typeRequest').className = t === 'request' ? 'sel-request' : '';
  document.getElementById('seatsLabel').style.display = t === 'offer' ? 'block' : 'none';
  document.getElementById('fSeats').style.display = t === 'offer' ? 'block' : 'none';
}
document.getElementById('typeOffer').addEventListener('click', () => setType('offer'));
document.getElementById('typeRequest').addEventListener('click', () => setType('request'));
setType('offer');

document.getElementById('submitPost').addEventListener('click', async () => {
  const name = document.getElementById('fName').value.trim();
  const from = document.getElementById('fFrom').value.trim();
  const to = document.getElementById('fTo').value.trim();
  const date = document.getElementById('fDate').value;
  const time = document.getElementById('fTime').value;
  const seats = document.getElementById('fSeats').value;
  const note = document.getElementById('fNote').value.trim();
  const contact = document.getElementById('fContact').value.trim();
  const errEl = document.getElementById('formErr');

  if(!name || !from || !to || !contact){
    errEl.textContent = 'Please fill in your name, from, to, and how to reach you.';
    return;
  }
  errEl.textContent = '';

  const body = { type: postType, name, from, to, date, time, seats, note, contact };

  const submitBtn = document.getElementById('submitPost');
  submitBtn.disabled = true;
  submitBtn.textContent = 'Posting…';
  try{
    const res = await fetch('/api/rides', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify(body)
    });
    if(!res.ok) throw new Error('failed');
    const ride = await res.json();
    posts.unshift(ride);
    render();
    overlay.style.display = 'none';
    ['fName','fFrom','fTo','fDate','fTime','fNote','fContact'].forEach(id2 => document.getElementById(id2).value = '');
    document.getElementById('fSeats').value = 1;
  }catch(e){
    errEl.textContent = 'Something went wrong posting. Please try again.';
  }
  submitBtn.disabled = false;
  submitBtn.textContent = 'Post to board';
});

loadPosts();
