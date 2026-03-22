// ══════════════════════════════════════════════
//  SPA Router
// ══════════════════════════════════════════════
const navLinks = document.querySelectorAll('.nav-link');
const pages    = document.querySelectorAll('.page');

navLinks.forEach(link => {
  link.addEventListener('click', () => {
    const target = link.dataset.page;
    navLinks.forEach(l => l.classList.remove('active'));
    pages.forEach(p => p.classList.remove('active'));
    link.classList.add('active');
    const page = document.getElementById('page-' + target);
    if (page) page.classList.add('active');
  });
});

// ══════════════════════════════════════════════
//  Assessment — Live Indicators
// ══════════════════════════════════════════════
function updateIndicators() {
  const age     = parseFloat(document.getElementById('age').value);
  const glucose = parseFloat(document.getElementById('avg_glucose_level').value);
  const bmi     = parseFloat(document.getElementById('bmi').value);
  const hyp     = document.getElementById('hypertension').value;
  const heart   = document.getElementById('heart_disease').value;
  const smoke   = document.getElementById('smoking_status').value;

  const setInd = (id, cls) => { const el = document.getElementById(id); if(el) el.className = 'ind' + (cls ? ' ' + cls : ''); };
  const setFill = (id, pct, color) => {
    const el = document.getElementById(id); if(!el) return;
    el.style.width = Math.min(pct, 100) + '%';
    el.style.background = color === 'bad' ? '#f87171' : color === 'warn' ? '#fbbf24' : '#34d399';
  };

  if (!isNaN(age)) {
    const c = age > 65 ? 'bad' : age > 45 ? 'warn' : 'ok';
    setInd('ind-age', c); setFill('fill-age', Math.min((age/100)*100, 100), c);
  }
  if (!isNaN(glucose)) {
    const c = glucose > 180 ? 'bad' : glucose > 126 ? 'warn' : 'ok';
    setInd('ind-glucose', c); setFill('fill-glucose', Math.min((glucose/300)*100, 100), c);
  }
  if (!isNaN(bmi)) {
    const c = bmi > 30 ? 'bad' : bmi > 25 ? 'warn' : 'ok';
    setInd('ind-bmi', c); setFill('fill-bmi', Math.min((bmi/45)*100, 100), c);
  }
  setInd('ind-hyp',   hyp   === '1' ? 'bad' : 'ok');
  setInd('ind-heart', heart === '1' ? 'bad' : 'ok');
  setInd('ind-smoke', smoke === 'smokes' ? 'bad' : smoke === 'formerly smoked' ? 'warn' : 'ok');
}

['age','avg_glucose_level','bmi','hypertension','heart_disease','smoking_status'].forEach(id => {
  const el = document.getElementById(id);
  if (el) { el.addEventListener('input', updateIndicators); el.addEventListener('change', updateIndicators); }
});

// ══════════════════════════════════════════════
//  Assessment — Reset
// ══════════════════════════════════════════════
document.getElementById('resetBtn').addEventListener('click', () => {
  ['age','avg_glucose_level','bmi'].forEach(id => document.getElementById(id).value = '');
  ['hypertension','heart_disease','gender','ever_married','Residence_type','work_type','smoking_status']
    .forEach(id => { const el = document.getElementById(id); if(el) el.selectedIndex = 0; });

  document.getElementById('gaugeArc').style.strokeDashoffset = '628.3';
  const pct = document.getElementById('riskPercent');
  pct.innerText = '—'; pct.style.color = '';
  document.getElementById('probabilityText').innerText = 'Enter vitals above and run the analysis';
  document.getElementById('riskLabel').innerText = 'Awaiting Input';
  document.getElementById('riskBadge').className = 'risk-badge idle';
  const thumb = document.getElementById('specThumb');
  thumb.style.opacity = '0'; thumb.style.left = '0%';
  ['fill-age','fill-glucose','fill-bmi'].forEach(id => { const el = document.getElementById(id); if(el) el.style.width = '0%'; });
  document.querySelectorAll('.ind').forEach(el => el.className = 'ind');
});

// ══════════════════════════════════════════════
//  Assessment — Predict
// ══════════════════════════════════════════════
document.getElementById('predictBtn').addEventListener('click', async function () {
  const age     = parseFloat(document.getElementById('age').value);
  const glucose = parseFloat(document.getElementById('avg_glucose_level').value);
  const bmi     = parseFloat(document.getElementById('bmi').value);

  if (isNaN(age) || isNaN(glucose) || isNaN(bmi)) { shakeAndHighlight(); return; }

  this.classList.add('loading');
  this.innerHTML = '<span class="btn-shine"></span><span class="spinner"></span> Analyzing…';

  try {
    const payload = {
      gender:            document.getElementById('gender').value,
      age, hypertension: parseInt(document.getElementById('hypertension').value),
      heart_disease:     parseInt(document.getElementById('heart_disease').value),
      ever_married:      document.getElementById('ever_married').value,
      work_type:         document.getElementById('work_type').value,
      Residence_type:    document.getElementById('Residence_type').value,
      avg_glucose_level: glucose, bmi,
      smoking_status:    document.getElementById('smoking_status').value,
    };

    const res = await fetch('https://stroke-prediction-4nkn.onrender.com/predict', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error('API error ' + res.status);
    const result = await res.json();
    const prob = result.stroke_probability * 100;

    animateGauge(prob);

    const thumb = document.getElementById('specThumb');
    thumb.style.opacity = '1'; thumb.style.left = Math.min(prob, 98) + '%';

    const badge = document.getElementById('riskBadge');
    const label = result.risk_level || (prob < 20 ? 'Low Risk' : prob < 50 ? 'Moderate Risk' : 'High Risk');
    document.getElementById('riskLabel').innerText = label;
    badge.className = 'risk-badge ' + (prob < 20 ? 'low' : prob < 50 ? 'medium' : 'high');
    document.getElementById('riskPercent').style.color = prob < 20 ? '#34d399' : prob < 50 ? '#fbbf24' : '#f87171';
    document.getElementById('probabilityText').innerText = `Probability score: ${prob.toFixed(1)}%`;

    // Save to history
    saveToHistory(payload, prob, label);

  } catch (err) {
    document.getElementById('riskLabel').innerText = 'Connection Error';
    document.getElementById('riskBadge').className = 'risk-badge idle';
    document.getElementById('probabilityText').innerText = 'Could not reach API. Please try again.';
    console.error(err);
  } finally {
    this.classList.remove('loading');
    this.innerHTML = `<span class="btn-shine"></span>
      <svg viewBox="0 0 16 16" fill="currentColor" width="14"><path d="M8 1.5a6.5 6.5 0 100 13 6.5 6.5 0 000-13zM0 8a8 8 0 1116 0A8 8 0 010 8z"/><path d="M6.271 5.055a.5.5 0 01.52.038l3.5 2.5a.5.5 0 010 .814l-3.5 2.5A.5.5 0 016 10.5v-5a.5.5 0 01.271-.445z"/></svg>
      Analyze Risk`;
  }
});

function animateGauge(pct) {
  const circ = 628.3;
  document.getElementById('gaugeArc').style.strokeDashoffset = circ - (pct/100)*circ;
  const el = document.getElementById('riskPercent');
  const dur = 1300, start = performance.now();
  (function tick(now) {
    const t = Math.min((now - start)/dur, 1);
    el.innerText = Math.round((1-Math.pow(1-t,4))*pct) + '%';
    if (t < 1) requestAnimationFrame(tick);
  })(performance.now());
}

function shakeAndHighlight() {
  const btn = document.getElementById('predictBtn');
  ['-8px','8px','-5px','5px','0px'].forEach((x,i) => setTimeout(() => btn.style.transform = `translateX(${x})`, i*70));
  ['age','avg_glucose_level','bmi'].forEach(id => {
    const input = document.getElementById(id);
    if (isNaN(parseFloat(input.value))) {
      const card = input.closest('.vcard');
      card.style.borderColor = 'rgba(248,113,113,0.45)';
      card.style.boxShadow   = '0 0 0 3px rgba(248,113,113,0.08)';
      setTimeout(() => { card.style.borderColor=''; card.style.boxShadow=''; }, 1400);
    }
  });
}

// ══════════════════════════════════════════════
//  History — data store
// ══════════════════════════════════════════════
let historyRecords = [
  { id:'#PT-2024-0090', age:52, glucose:148, bmi:27.4, hyp:'No',  smoke:'formerly smoked', score:43, label:'Moderate Risk', date:'Mar 21, 2024' },
  { id:'#PT-2024-0089', age:35, glucose:95,  bmi:22.1, hyp:'No',  smoke:'never smoked',    score:8,  label:'Low Risk',      date:'Mar 21, 2024' },
  { id:'#PT-2024-0088', age:44, glucose:112, bmi:24.9, hyp:'No',  smoke:'never smoked',    score:12, label:'Low Risk',      date:'Mar 20, 2024' },
  { id:'#PT-2024-0087', age:71, glucose:195, bmi:29.8, hyp:'Yes', smoke:'smokes',          score:82, label:'High Risk',     date:'Mar 20, 2024' },
  { id:'#PT-2024-0086', age:60, glucose:162, bmi:30.1, hyp:'Yes', smoke:'formerly smoked', score:61, label:'High Risk',     date:'Mar 19, 2024' },
  { id:'#PT-2024-0085', age:38, glucose:88,  bmi:21.3, hyp:'No',  smoke:'never smoked',    score:6,  label:'Low Risk',      date:'Mar 19, 2024' },
];

let nextId = 91;

function saveToHistory(payload, prob, label) {
  const record = {
    id: `#PT-2024-0${nextId++}`,
    age: payload.age,
    glucose: payload.avg_glucose_level,
    bmi: payload.bmi,
    hyp: payload.hypertension === 1 ? 'Yes' : 'No',
    smoke: payload.smoking_status,
    score: Math.round(prob),
    label,
    date: new Date().toLocaleDateString('en-US', { month:'short', day:'numeric', year:'numeric' }),
  };
  historyRecords.unshift(record);
  renderHistory();
}

function renderHistory(filter = '') {
  const body = document.getElementById('historyBody');
  const rows = historyRecords.filter(r => r.id.toLowerCase().includes(filter.toLowerCase()));
  body.innerHTML = rows.map(r => {
    const cls = r.score < 20 ? 'low' : r.score < 50 ? 'med' : 'high';
    const scoreCls = r.score < 20 ? 'low-s' : r.score < 50 ? 'med-s' : 'high-s';
    return `<div class="ht-row">
      <div class="ht-id">${r.id}</div>
      <div>${r.age}</div>
      <div>${r.glucose}</div>
      <div>${r.bmi}</div>
      <div>${r.hyp}</div>
      <div>${r.smoke}</div>
      <div class="ht-score ${scoreCls}">${r.score}%</div>
      <div><span class="ht-tag ${cls}">${r.label}</span></div>
      <div class="ht-date">${r.date}</div>
    </div>`;
  }).join('');
  if (rows.length === 0) body.innerHTML = '<div style="padding:30px;text-align:center;color:var(--sub);font-size:13px">No records found</div>';
}

// Search
document.getElementById('historySearch').addEventListener('input', function () {
  renderHistory(this.value);
});

// Initial render
renderHistory();