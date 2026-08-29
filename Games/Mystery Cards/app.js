const LEVELS = {
  spicy:[
    {id:1,name:'Soft',description:'Leichtere Mystery Cards',top:'#329BFF',bottom:'#238CF0',accent:'#238CF0',img:'../../Assets/Games/Spicy_Level 1.png'},
    {id:2,name:'Direkt',description:'Persönlicher & direkter',top:'#6E00FA',bottom:'#5A00E6',accent:'#5A00E6',img:'../../Assets/Games/Spicy_Level 2.png'},
    {id:3,name:'Schonungslos',description:'Intimere & sensible Fragen',top:'#FA0AFF',bottom:'#E100E6',accent:'#E100E6',img:'../../Assets/Games/Spicy_Level 3.png'}
  ],
  suff:[
    {id:1,name:'Chillig',top:'#329BFF',bottom:'#238CF0',accent:'#238CF0',img:'../../Assets/Games/Suff_Level 1.png'},
    {id:2,name:'Party',top:'#6E00FA',bottom:'#5A00E6',accent:'#5A00E6',img:'../../Assets/Games/Suff_Level 2.png'},
    {id:3,name:'Abriss',top:'#FA0AFF',bottom:'#E100E6',accent:'#E100E6',img:'../../Assets/Games/Suff_Level 3.png'},
    {id:4,name:'Blackout',top:'#FF0A69',bottom:'#EB0055',accent:'#E50055',img:'../../Assets/Games/Suff_Level 4.png'}
  ]
};

const SPICY_MIX = {
  1:[[1,100]],
  2:[[1,40],[2,60]],
  3:[[1,20],[2,30],[3,50]]
};
const RECENT_PROMPT_LIMIT = 15;

const savedSpicy = Number(localStorage.getItem('mysteryCards.spicyLevel'));
const savedSuff = Number(localStorage.getItem('mysteryCards.suffLevel'));
const savedExperimental = localStorage.getItem('mysteryCards.experimentalSuff');
const savedMinutes = Number(localStorage.getItem('mysteryCards.roundMinutes'));
const savedDirectness = Number(localStorage.getItem('mysteryCards.directness'));
const savedSpicyCards = localStorage.getItem('mysteryCards.spicyCards');
const savedTipsEnabled = localStorage.getItem('mysteryCards.tipsEnabled');

const state = {
  spicyLevel:[1,2,3].includes(savedSpicy) ? savedSpicy : 1,
  suffLevel:[1,2,3,4].includes(savedSuff) ? savedSuff : 1,
  experimentalSuff:savedExperimental === 'true',
  directness:[0,1,2].includes(savedDirectness) ? savedDirectness : 0,
  spicyCards:savedSpicyCards === 'true',
  tipsEnabled:savedTipsEnabled === 'true',
  tip1Revealed:false,
  tip2Revealed:false,
  tip1Triggered:false,
  tip2Triggered:false,
  timerTotalMs:null,
  roundMinutes:Number.isFinite(savedMinutes) && savedMinutes >= 1 && savedMinutes <= 15 ? savedMinutes : 4,
  started:false,
  currentData:null,
  nextData:null,
  recentPrompts:[],
  promptLastSeen:new Map(),
  promptSequence:0,
  swiping:false,
  revealing:false,
  timerId:null,
  deadline:null,
  remainingMs:null
};

const card = document.querySelector('#gameCard');
const cardStack = document.querySelector('#cardStack');
const previewCard = document.querySelector('#previewCard');
const promptPanel = document.querySelector('#promptPanel');
const secretState = document.querySelector('#secretState');
const revealedState = document.querySelector('#revealedState');
const promptText = document.querySelector('#promptText');
const spicyCallBadge = document.querySelector('#spicyCallBadge');
const wrongGuessPenalty = document.querySelector('#wrongGuessPenalty');
const correctGuessPenalty = document.querySelector('#correctGuessPenalty');
const revealPenalty = document.querySelector('#revealPenalty');
const previewPenaltyPanel = document.querySelector('#previewPenaltyPanel');
const instructionText = document.querySelector('#instructionText');
const timerPill = document.querySelector('#timerPill');
const timerText = document.querySelector('#timerText');
const nextCardSound = document.querySelector('#nextCardSound');
const tipSound = document.querySelector('#tipSound');
const tipBadge = document.querySelector('#tipBadge');
const tipPopover = document.querySelector('#tipPopover');
const tipPopoverClose = document.querySelector('#tipPopoverClose');
const tipEntry1 = document.querySelector('#tipEntry1');
const tipEntry2 = document.querySelector('#tipEntry2');
const tipTime1 = document.querySelector('#tipTime1');
const tipTime2 = document.querySelector('#tipTime2');
const tipBody1 = document.querySelector('#tipBody1');
const tipBody2 = document.querySelector('#tipBody2');
const tipFlash = document.querySelector('#tipFlash');
const tipFlashLabel = document.querySelector('#tipFlashLabel');
const tipFlashText = document.querySelector('#tipFlashText');

let audioUnlocked = false;

async function unlockAudio(){
  if(audioUnlocked) return;

  const elements = [nextCardSound,tipSound].filter(Boolean);
  if(!elements.length){
    audioUnlocked = true;
    return;
  }

  const oldValues = elements.map(element => ({
    element,
    volume:element.volume,
    muted:element.muted
  }));

  try{
    /*
      Beide Audioelemente werden im selben direkten User-Gesture gestartet.
      Das ist für iOS/PWA wichtig, damit sowohl der bisherige Next-Sound
      als auch der spätere automatische Tipp-Sound abgespielt werden darf.
    */
    const plays = elements.map(element => {
      element.muted = false;
      element.volume = 0;
      element.currentTime = 0;
      return element.play();
    });

    const results = await Promise.allSettled(plays);

    oldValues.forEach(({element,volume,muted}) => {
      element.pause();
      element.currentTime = 0;
      element.volume = volume || 1;
      element.muted = muted;
    });

    audioUnlocked = results.every(result => result.status === 'fulfilled');
  }catch(_){
    oldValues.forEach(({element,volume,muted}) => {
      try{
        element.pause();
        element.currentTime = 0;
        element.volume = volume || 1;
        element.muted = muted;
      }catch(__){}
    });
  }
}



const settingsButton = document.querySelector('#settingsButton');
const settingsSheet = document.querySelector('#settingsSheet');
const sheetScrim = document.querySelector('#sheetScrim');
const doneButton = document.querySelector('#doneButton');
const spicyLevels = document.querySelector('#spicyLevels');
const suffLevels = document.querySelector('#suffLevels');
const spicySummary = document.querySelector('#spicySummary');
const suffSummary = document.querySelector('#suffSummary');
const experimentalSuffToggle = document.querySelector('#experimentalSuffToggle');
const directnessLevels = document.querySelector('#directnessLevels');
const directnessExample = document.querySelector('#directnessExample');
const spicyCardsToggle = document.querySelector('#spicyCardsToggle');
const tipsToggle = document.querySelector('#tipsToggle');
const timerMinus = document.querySelector('#timerMinus');
const timerPlus = document.querySelector('#timerPlus');
const timerSettingValue = document.querySelector('#timerSettingValue');
const backToGamesButton = document.querySelector('#backToGamesButton');

function gradient(level){ return `linear-gradient(180deg, ${level.top}, ${level.bottom})`; }
function getLevel(kind,id){ return LEVELS[kind].find(level => level.id === id); }

function getSuffConfig(){
  return (state.experimentalSuff ? window.SUFF_EXPERIMENTAL : window.SUFF_NORMAL) || {};
}
function getSuffRules(levelId = state.suffLevel){
  return getSuffConfig()[levelId] || {sips:[{value:0,weight:1}],shots:[{value:0,weight:1}]};
}
function normalizedEntries(entries){
  if(!Array.isArray(entries)) return [];
  return entries
    .map(entry => Array.isArray(entry)
      ? {value:Number(entry[0]),weight:Number(entry[1])}
      : {value:Number(entry?.value),weight:Number(entry?.weight)})
    .filter(entry => Number.isFinite(entry.value) && Number.isFinite(entry.weight) && entry.weight > 0);
}
function weightedValue(entries){
  const list = normalizedEntries(entries);
  if(!list.length) return 0;
  const total = list.reduce((sum,item) => sum + item.weight,0);
  let r = Math.random() * total;
  for(const item of list){
    r -= item.weight;
    if(r <= 0) return item.value;
  }
  return list.at(-1).value;
}
function weightedPairValue(entries){
  const total = entries.reduce((sum,[,weight]) => sum + weight,0);
  let r = Math.random() * total;
  for(const [value,weight] of entries){
    r -= weight;
    if(r <= 0) return value;
  }
  return entries.at(-1)?.[0];
}

function getPromptPool(level){
  if(level === 1) return window.MYSTERY_SPICY_LEVEL_1 || [];
  if(level === 2) return window.MYSTERY_SPICY_LEVEL_2 || [];
  if(level === 3) return window.MYSTERY_SPICY_LEVEL_3 || [];
  return [];
}

/*
  Neue Karten können so gepflegt werden:

  {
    text: "Welche zwei Mitspieler ...?",
    beziehungskiller: 1,
    spiceCall: true,
    tipp1: "Erster Hinweis",
    tipp2: "Zweiter Hinweis"
  }

  Bestehende reine Strings bleiben weiterhin gültig.
  Ein String entspricht automatisch:
  beziehungskiller: 0
  spiceCall: false
  tipp1: ""
  tipp2: ""
*/
function normalizePromptItem(item){
  if(typeof item === 'string'){
    const text = item.trim();
    return text ? {text,beziehungskiller:0,spiceCall:false,tipp1:'',tipp2:''} : null;
  }

  if(!item || typeof item !== 'object') return null;

  const text = typeof item.text === 'string' ? item.text.trim() : '';
  if(!text) return null;

  const rawKiller = Number(item.beziehungskiller);
  const beziehungskiller = [1,2].includes(rawKiller) ? rawKiller : 0;

  const tipp1 = typeof item.tipp1 === 'string'
    ? item.tipp1.trim()
    : (typeof item.tip1 === 'string' ? item.tip1.trim() : '');

  const tipp2 = typeof item.tipp2 === 'string'
    ? item.tipp2.trim()
    : (typeof item.tip2 === 'string' ? item.tip2.trim() : '');

  return {
    text,
    beziehungskiller,
    spiceCall:item.spiceCall === true,
    tipp1,
    tipp2
  };
}

function promptAllowed(item){
  // Direktheit:
  // 0 ("Aus") = Beziehungskiller 0
  // 1 ("Würzig") = Beziehungskiller 0 + 1
  // 2 ("Beziehungskiller") = Beziehungskiller 0 + 1 + 2
  if(item.beziehungskiller > state.directness) return false;

  // Spicy Cards filtert keine Karten mehr.
  // Der Toggle steuert ausschließlich die sichtbare Markierung beim Aufdecken.
  return true;
}

function promptCandidates(){
  return (SPICY_MIX[state.spicyLevel] || SPICY_MIX[1])
    .map(([level,weight]) => ({
      level,
      weight,
      items:getPromptPool(level)
        .map(normalizePromptItem)
        .filter(Boolean)
        .filter(promptAllowed)
    }))
    .filter(group => group.items.length);
}

function promptKey(item){
  return item.text;
}

function choosePrompt(){
  const groups = promptCandidates();
  if(!groups.length) return {text:'Keine passende Mystery Card verfügbar',spiceCall:false,tipp1:'',tipp2:''};

  const blocked = new Set(state.recentPrompts);
  const availableGroups = groups
    .map(group => ({
      ...group,
      available:group.items.filter(item => !blocked.has(promptKey(item)))
    }))
    .filter(group => group.available.length);

  let chosen;
  if(availableGroups.length){
    const chosenLevel = weightedPairValue(availableGroups.map(group => [group.level,group.weight]));
    const group = availableGroups.find(item => item.level === chosenLevel) || availableGroups[0];
    chosen = group.available[Math.floor(Math.random()*group.available.length)];
  } else {
    const allByText = new Map();
    groups.flatMap(group => group.items).forEach(item => allByText.set(promptKey(item),item));
    const all = [...allByText.values()];

    const oldest = Math.min(...all.map(item => state.promptLastSeen.get(promptKey(item)) ?? -Infinity));
    const leastRecent = all.filter(item => (state.promptLastSeen.get(promptKey(item)) ?? -Infinity) === oldest);
    chosen = leastRecent[Math.floor(Math.random()*leastRecent.length)];
  }

  const key = promptKey(chosen);
  state.promptSequence += 1;
  state.promptLastSeen.set(key,state.promptSequence);
  state.recentPrompts.push(key);
  if(state.recentPrompts.length > RECENT_PROMPT_LIMIT) state.recentPrompts.shift();

  return {
    text:chosen.text,
    spiceCall:chosen.spiceCall === true,
    tipp1:chosen.tipp1 || '',
    tipp2:chosen.tipp2 || ''
  };
}

function promptTextValue(prompt){
  return prompt && typeof prompt === 'object' ? (prompt.text || '') : String(prompt || '');
}
function promptIsSpicyCall(prompt){
  return Boolean(prompt && typeof prompt === 'object' && prompt.spiceCall === true);
}

function promptTipValue(prompt,index){
  if(!prompt || typeof prompt !== 'object') return '';
  const value = index === 1 ? prompt.tipp1 : prompt.tipp2;
  return typeof value === 'string' ? value.trim() : '';
}

function currentTipText(index){
  return state.currentData ? promptTipValue(state.currentData.prompt,index) : '';
}

function currentCardHasTips(){
  return Boolean(currentTipText(1) || currentTipText(2));
}

function closeTipPopover(){
  tipPopover.hidden = true;
  tipBadge.setAttribute('aria-expanded','false');
}

function openTipPopover(){
  if(tipBadge.hidden) return;
  unlockAudio();
  renderTipUI(state.remainingMs ?? state.roundMinutes*60*1000);
  tipPopover.hidden = false;
  tipBadge.setAttribute('aria-expanded','true');
}

function syncTipBadge(){
  const visible = Boolean(
    state.started &&
    state.tipsEnabled &&
    currentCardHasTips()
  );

  tipBadge.hidden = !visible;

  if(!visible){
    closeTipPopover();
  }
}

function resetTipProgress(){
  state.tip1Revealed = false;
  state.tip2Revealed = false;
  state.tip1Triggered = false;
  state.tip2Triggered = false;

  closeTipPopover();
  tipFlash.hidden = true;
  tipFlash.classList.remove('is-visible');

  renderTipUI(state.roundMinutes*60*1000);
  syncTipBadge();
}

function tipCountdownMs(index,remainingMs){
  const total = state.timerTotalMs || state.roundMinutes*60*1000;
  const remaining = Math.max(0,Math.min(total,remainingMs ?? total));
  const elapsed = total - remaining;
  const thresholdElapsed = total * (index === 1 ? .60 : .80);
  return Math.max(0,thresholdElapsed - elapsed);
}

function renderTipEntry(index,remainingMs){
  const entry = index === 1 ? tipEntry1 : tipEntry2;
  const time = index === 1 ? tipTime1 : tipTime2;
  const body = index === 1 ? tipBody1 : tipBody2;
  const text = currentTipText(index);
  const revealed = index === 1 ? state.tip1Revealed : state.tip2Revealed;

  entry.classList.toggle('is-missing',!text);
  entry.classList.toggle('is-locked',Boolean(text && !revealed));

  if(!text){
    time.textContent = '';
    body.textContent = 'Kein Tipp hinterlegt';
    return;
  }

  if(revealed){
    time.textContent = 'Verfügbar';
    body.textContent = text;
    return;
  }

  time.textContent = formatTime(tipCountdownMs(index,remainingMs));
  body.textContent = 'Noch verborgen';
}

function renderTipUI(remainingMs){
  renderTipEntry(1,remainingMs);
  renderTipEntry(2,remainingMs);
  syncTipBadge();
}

let tipFlashTimeout = null;

function showTipFlash(index,text){
  if(!text) return;

  if(tipFlashTimeout){
    clearTimeout(tipFlashTimeout);
    tipFlashTimeout = null;
  }

  tipFlashLabel.textContent = `Tipp ${index}`;
  tipFlashText.textContent = text;

  tipFlash.hidden = false;
  tipFlash.classList.remove('is-visible');
  void tipFlash.offsetWidth;
  tipFlash.classList.add('is-visible');

  tipFlashTimeout = setTimeout(() => {
    tipFlash.classList.remove('is-visible');
    tipFlash.hidden = true;
    tipFlashTimeout = null;
  },3050);
}

async function playTipSound(){
  if(!tipSound) return;

  try{
    tipSound.currentTime = 0;
    await tipSound.play();
  }catch(_){}
}

function revealTip(index,{announce=true}={}){
  const text = currentTipText(index);
  if(!text) return;

  if(index === 1){
    if(state.tip1Triggered) return;
    state.tip1Triggered = true;
    state.tip1Revealed = true;
  }else{
    if(state.tip2Triggered) return;
    state.tip2Triggered = true;
    state.tip2Revealed = true;
  }

  renderTipUI(state.remainingMs);

  if(announce){
    playTipSound();
    showTipFlash(index,text);
  }
}

function updateTipProgress(remainingMs,{announce=true}={}){
  renderTipUI(remainingMs);

  if(!state.started || !state.tipsEnabled || !currentCardHasTips()) return;

  const total = state.timerTotalMs || state.roundMinutes*60*1000;
  const remaining = Math.max(0,Math.min(total,remainingMs ?? total));
  const elapsed = total - remaining;

  if(elapsed >= total*.60){
    revealTip(1,{announce});
  }

  if(elapsed >= total*.80){
    revealTip(2,{announce});
  }
}

function formatSips(value){
  return value === 1 ? '1 Strafschluck' : `${value} Strafschlücke`;
}
function formatShots(value){
  return value === 1 ? '1 Shot' : `${value} Shots`;
}
function penaltyMarkup(amount,action,shots=0){
  const amountText = shots > 0
    ? `${formatSips(amount)} & ${formatShots(shots)}`
    : formatSips(amount);

  return `<span class="penalty-value">${amountText} ${action}</span>`;
}

/*
  Mystery Cards benutzt weiterhin dieselben Suff-Dateien wie Word Quicky.
  Aus der dort gezogenen Strafschluck-Anzahl entsteht jetzt EIN einheitliches Basismaß.

  Beispiel Basis = 2:
  - falsch geraten: 2 Strafschlücke trinken      (1x)
  - Karte ansehen:  4 Strafschlücke trinken      (2x)
  - Karte erraten:  6 Strafschlücke verteilen    (3x)

  Dadurch bleiben alle drei Konsequenzen auf derselben Karte logisch miteinander verknüpft.
  Die Suff-Wahrscheinlichkeiten bestimmen nur noch, wie hoch die Basis einer Karte ist.
*/
const MYSTERY_PENALTY_FORMULA = {
  wrong:   { multiplier:1, addition:0,  action:'trinken',    useShots:false },
  correct: { multiplier:3, addition:10, action:'verteilen',  useShots:true  },
  reveal:  { multiplier:2, addition:4,  action:'trinken',    useShots:true  }
};

function calculateMysteryPenalty(base, rule){
  return (base * rule.multiplier) + rule.addition;
}

function makePenalties(){
  const rules = getSuffRules();

  // Der Basiswert wird weiterhin per Zufall aus der aktuell aktiven
  // normalen oder experimentellen Suff-Intensity-Datei gezogen.
  const base = Math.max(0, weightedValue(rules.sips));
  const shots = Math.max(0, weightedValue(rules.shots));

  // Basis 0 bedeutet für Mystery Cards vollständig "Keine Strafe".
  // Multiplikator und Addition werden dann bewusst NICHT angewendet.
  if(base === 0){
    return {
      wrong:{amount:0,shots:0,action:'Keine Strafe'},
      correct:{amount:0,shots:0,action:'Keine Strafe'},
      reveal:{amount:0,shots:0,action:'Keine Strafe'}
    };
  }

  const wrongRule = MYSTERY_PENALTY_FORMULA.wrong;
  const correctRule = MYSTERY_PENALTY_FORMULA.correct;
  const revealRule = MYSTERY_PENALTY_FORMULA.reveal;

  return {
    wrong:{
      amount:calculateMysteryPenalty(base, wrongRule),
      shots:wrongRule.useShots ? shots : 0,
      action:wrongRule.action
    },
    correct:{
      amount:calculateMysteryPenalty(base, correctRule),
      shots:correctRule.useShots ? shots : 0,
      action:correctRule.action
    },
    reveal:{
      amount:calculateMysteryPenalty(base, revealRule),
      shots:revealRule.useShots ? shots : 0,
      action:revealRule.action
    }
  };
}
function makeCardData(){
  return {prompt:choosePrompt(),penalties:makePenalties()};
}

function applyCardColors(){
  const spicy = getLevel('spicy',state.spicyLevel);
  const suff = getLevel('suff',state.suffLevel);
  document.documentElement.style.setProperty('--spicy-top',spicy.top);
  document.documentElement.style.setProperty('--spicy-bottom',spicy.bottom);
  document.documentElement.style.setProperty('--suff-accent',suff.accent);
}
function penaltyValueMarkup(data){
  if(!data || data.amount <= 0){
    return '<span class="penalty-value penalty-value-muted">Keine Strafe</span>';
  }
  return penaltyMarkup(data.amount,data.action,data.shots || 0);
}
function penaltyRowsMarkup(p){
  return `
    <div class="penalty-row"><span>Falsch<br>geraten</span><strong>${penaltyValueMarkup(p.wrong)}</strong></div>
    <div class="penalty-row"><span>Richtig<br>geraten</span><strong>${penaltyValueMarkup(p.correct)}</strong></div>
    <div class="penalty-row"><span>Ansehen</span><strong>${penaltyValueMarkup(p.reveal)}</strong></div>
  `;
}
function renderPenaltyValue(element,data){
  if(!data || data.amount <= 0){
    element.innerHTML = '<span class="penalty-value penalty-value-muted">Keine Strafe</span>';
    return;
  }
  element.innerHTML = penaltyMarkup(data.amount,data.action,data.shots || 0);
}
function renderCurrentCard(){
  if(!state.currentData) return;
  promptText.textContent = promptTextValue(state.currentData.prompt);
  spicyCallBadge.hidden = !(state.spicyCards && promptIsSpicyCall(state.currentData.prompt));
  renderPenaltyValue(wrongGuessPenalty,state.currentData.penalties.wrong);
  renderPenaltyValue(correctGuessPenalty,state.currentData.penalties.correct);
  renderPenaltyValue(revealPenalty,state.currentData.penalties.reveal);
  renderTipUI(state.remainingMs ?? state.roundMinutes*60*1000);
}
function renderPreviewCard(){
  if(!state.nextData) return;
  previewPenaltyPanel.innerHTML = penaltyRowsMarkup(state.nextData.penalties);
}
function hidePrompt(){
  state.revealing = false;
  secretState.hidden = false;
  revealedState.hidden = true;
  promptPanel.classList.remove('is-revealed');
}
function showPrompt(){
  if(!state.started || state.swiping) return;
  state.revealing = true;
  secretState.hidden = true;
  revealedState.hidden = false;
  promptPanel.classList.add('is-revealed');
}

function rangeText(entries,singular,plural){
  const values = normalizedEntries(entries).map(entry => entry.value);
  if(!values.length) return `0 ${plural}`;
  const min = Math.min(...values);
  const max = Math.max(...values);
  if(min === max) return `${min} ${min === 1 ? singular : plural}`;
  return `${min}–${max} ${plural}`;
}
function suffDescription(){
  const rules = getSuffRules();
  const sips = rangeText(rules.sips,'Strafschluck','Strafschlücke');
  const shots = normalizedEntries(rules.shots).map(item => item.value);
  const maxShot = shots.length ? Math.max(...shots) : 0;
  return maxShot > 0 ? `${sips} & ${rangeText(rules.shots,'Shot','Shots')}` : sips;
}

function renderLevelButtons(kind){
  const container = kind === 'spicy' ? spicyLevels : suffLevels;
  const current = kind === 'spicy' ? state.spicyLevel : state.suffLevel;
  container.innerHTML = '';
  container.style.gridTemplateColumns = `repeat(${LEVELS[kind].length},minmax(0,1fr))`;

  LEVELS[kind].forEach(level => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = `level-button${level.id === current ? ' is-active' : ''}`;
    button.style.setProperty('--level-color',level.accent);
    button.style.setProperty('--level-gradient',gradient(level));

    const img = document.createElement('img');
    img.src = level.img;
    img.alt = '';
    button.append(img);
    button.addEventListener('click',() => selectLevel(kind,level.id));
    container.append(button);
  });
}
function renderSettings(){
  renderLevelButtons('spicy');
  renderLevelButtons('suff');

  const spicy = getLevel('spicy',state.spicyLevel);
  const suff = getLevel('suff',state.suffLevel);

  spicySummary.style.setProperty('--summary-gradient',gradient(spicy));
  spicySummary.querySelector('strong').textContent = spicy.name;
  spicySummary.querySelector('span').textContent = spicy.description;

  suffSummary.style.setProperty('--summary-gradient',gradient(suff));
  suffSummary.querySelector('strong').textContent = suff.name;
  suffSummary.querySelector('span').textContent = suffDescription();

  experimentalSuffToggle.checked = state.experimentalSuff;
  spicyCardsToggle.checked = state.spicyCards;
  tipsToggle.checked = state.tipsEnabled;

  directnessLevels.querySelectorAll('[data-directness]').forEach(button => {
    button.classList.toggle('is-active',Number(button.dataset.directness) === state.directness);
    button.setAttribute('aria-pressed',String(Number(button.dataset.directness) === state.directness));
  });

  const directnessExamples = {
    0:'Welche zwei Mitspieler wären das chaotischste WG-Duo?',
    1:'Welche zwei Mitspieler würden sich aus Versehen verloben?',
    2:'Welche zwei Mitspieler sollten gemeinsam Sex haben?'
  };
  directnessExample.textContent = directnessExamples[state.directness];

  timerSettingValue.textContent = state.roundMinutes;
}
function selectLevel(kind,id){
  if(kind === 'spicy'){
    state.spicyLevel = id;
    localStorage.setItem('mysteryCards.spicyLevel',String(id));
  } else {
    state.suffLevel = id;
    localStorage.setItem('mysteryCards.suffLevel',String(id));
  }
  renderSettings();
  applyCardColors();

  if(!state.started) return;

  if(kind === 'suff'){
    state.currentData.penalties = makePenalties();
    state.nextData.penalties = makePenalties();
    renderCurrentCard();
    renderPreviewCard();
  } else {
    state.nextData = makeCardData();
    renderPreviewCard();
  }
}

function formatTime(ms){
  const total = Math.max(0,Math.ceil(ms/1000));
  const minutes = Math.floor(total/60);
  const seconds = total%60;
  return `${String(minutes).padStart(2,'0')}:${String(seconds).padStart(2,'0')}`;
}
function updateTimerVisual(ms){
  timerText.textContent = formatTime(ms);
  timerPill.classList.toggle('is-warning',ms <= 30000 && state.started);
}
function stopTimer(){
  if(state.timerId) clearInterval(state.timerId);
  state.timerId = null;
  state.deadline = null;
  timerPill.classList.remove('is-running','is-warning');
}
function startTimer(){
  stopTimer();
  const total = state.roundMinutes * 60 * 1000;
  state.timerTotalMs = total;
  state.deadline = Date.now() + total;
  state.remainingMs = total;

  resetTipProgress();
  updateTimerVisual(total);
  updateTipProgress(total,{announce:false});
  timerPill.classList.add('is-running');

  state.timerId = setInterval(() => {
    const remaining = Math.max(0,state.deadline - Date.now());
    state.remainingMs = remaining;
    updateTimerVisual(remaining);
    updateTipProgress(remaining);

    if(remaining <= 0){
      stopTimer();
      autoAdvance();
    }
  },250);
}
function resetTimer(){
  if(state.started) startTimer();
  else updateTimerVisual(state.roundMinutes*60*1000);
renderTipUI(state.roundMinutes*60*1000);
}
async function playNextSound(){
  try{
    nextCardSound.currentTime = 0;
    await nextCardSound.play();
  }catch(_){}
}
function autoAdvance(){
  hidePrompt();
  playNextSound();
  const direction = Math.random() < .5 ? -1 : 1;
  finishSwipe(direction,true);
}

function startGame(){
  unlockAudio();
  if(state.started) return;
  state.started = true;
  state.currentData = makeCardData();
  state.nextData = makeCardData();
  applyCardColors();
  renderCurrentCard();
  renderPreviewCard();
  hidePrompt();

  card.classList.add('is-flipped');
  cardStack.classList.add('is-started');
  card.setAttribute('aria-label','Mystery Card nach links oder rechts wischen');
  instructionText.textContent = 'Zur nächsten Karte wischen';
  startTimer();
}
function finishSwipe(direction,fromTimer=false){
  if(state.swiping || !state.started) return;
  closeTipPopover();
  state.swiping = true;
  hidePrompt();

  const distance = Math.max(window.innerWidth,500)*1.15*direction;
  card.style.transition = 'transform 300ms cubic-bezier(.2,.72,.25,1),opacity 250ms ease';
  previewCard.style.transition = 'transform 300ms cubic-bezier(.2,.72,.25,1)';
  card.style.transform = `translateX(${distance}px) rotate(${direction*15}deg)`;
  card.style.opacity = '0';
  previewCard.style.transform = 'scale(1)';

  setTimeout(() => {
    state.currentData = state.nextData;
    state.nextData = makeCardData();
    renderCurrentCard();
    renderPreviewCard();

    card.style.transition = 'none';
    previewCard.style.transition = 'none';
    card.style.transform = 'translateX(0) rotate(0deg)';
    card.style.opacity = '1';
    previewCard.style.transform = 'scale(.94)';
    void card.offsetWidth;
    card.style.transition = '';
    previewCard.style.transition = '';
    state.swiping = false;
    startTimer();
  },310);
}
function cancelSwipe(){
  card.style.transition = 'transform 220ms cubic-bezier(.2,.75,.2,1)';
  previewCard.style.transition = 'transform 220ms cubic-bezier(.2,.75,.2,1)';
  card.style.transform = 'translateX(0) rotate(0deg)';
  previewCard.style.transform = 'scale(.94)';
  setTimeout(() => {
    card.style.transition = '';
    previewCard.style.transition = '';
  },230);
}

let drag = null;
card.addEventListener('pointerdown',event => {
  unlockAudio();
  if(!state.started){
    startGame();
    return;
  }
  if(event.target.closest('#promptPanel')) return;
  if(state.swiping) return;

  drag = {id:event.pointerId,startX:event.clientX,lastX:event.clientX,startY:event.clientY};
  card.setPointerCapture?.(event.pointerId);
});
card.addEventListener('pointermove',event => {
  if(!drag || drag.id !== event.pointerId || state.swiping) return;
  const dx = event.clientX - drag.startX;
  const dy = event.clientY - drag.startY;
  if(Math.abs(dy) > Math.abs(dx)*1.2) return;

  drag.lastX = event.clientX;
  const progress = Math.min(1,Math.abs(dx)/150);
  card.style.transition = 'none';
  previewCard.style.transition = 'none';
  card.style.transform = `translateX(${dx}px) rotate(${dx/28}deg)`;
  previewCard.style.transform = `scale(${.94 + .06*progress})`;
});
function endDrag(event){
  if(!drag || drag.id !== event.pointerId) return;
  const dx = drag.lastX - drag.startX;
  drag = null;

  if(Math.abs(dx) >= 82){
    finishSwipe(dx < 0 ? -1 : 1);
  } else {
    cancelSwipe();
  }
}
card.addEventListener('pointerup',endDrag);
card.addEventListener('pointercancel',event => {
  if(drag && drag.id === event.pointerId) drag = null;
  cancelSwipe();
});

promptPanel.addEventListener('pointerdown',event => {
  if(!state.started || state.swiping) return;
  event.preventDefault();
  event.stopPropagation();
  promptPanel.setPointerCapture?.(event.pointerId);
  showPrompt();
});
promptPanel.addEventListener('pointerup',event => {
  event.preventDefault();
  event.stopPropagation();
  hidePrompt();
});
promptPanel.addEventListener('pointercancel',hidePrompt);
promptPanel.addEventListener('lostpointercapture',hidePrompt);
promptPanel.addEventListener('pointerleave',event => {
  if(event.buttons === 0) hidePrompt();
});
promptPanel.addEventListener('contextmenu',event => event.preventDefault());
window.addEventListener('blur',hidePrompt);
document.addEventListener('visibilitychange',() => {
  if(document.hidden) hidePrompt();
});

function openSettings(){
  closeTipPopover();
  renderSettings();
  sheetScrim.hidden = false;
  settingsSheet.classList.add('is-open');
  settingsSheet.setAttribute('aria-hidden','false');
}
function closeSettings(){
  settingsSheet.classList.remove('is-open');
  settingsSheet.setAttribute('aria-hidden','true');
  setTimeout(() => { sheetScrim.hidden = true; },320);
}
settingsButton.addEventListener('click',openSettings);
doneButton.addEventListener('click',closeSettings);
sheetScrim.addEventListener('click',closeSettings);


function refreshPromptsAfterFilterChange(){
  // Alte Repeat-Historie darf die neu eingeschränkte Auswahl nicht unnötig blockieren.
  state.recentPrompts = [];

  if(!state.started) return;

  state.currentData.prompt = choosePrompt();
  state.nextData.prompt = choosePrompt();
  resetTipProgress();
  hidePrompt();
  renderCurrentCard();
  renderPreviewCard();
  if(state.started) updateTipProgress(state.remainingMs,{announce:false});
}

directnessLevels.addEventListener('click',event => {
  const button = event.target.closest('[data-directness]');
  if(!button) return;

  const value = Number(button.dataset.directness);
  if(![0,1,2].includes(value) || value === state.directness) return;

  state.directness = value;
  localStorage.setItem('mysteryCards.directness',String(value));
  renderSettings();
  refreshPromptsAfterFilterChange();
});

spicyCardsToggle.addEventListener('change',() => {
  state.spicyCards = spicyCardsToggle.checked;
  localStorage.setItem('mysteryCards.spicyCards',String(state.spicyCards));
  renderSettings();

  // Keine Karte wird neu gezogen oder herausgefiltert.
  // Nur der sichtbare "Spicy Call"-Hinweis wird an/ausgeschaltet.
  if(state.started) renderCurrentCard();
});

tipsToggle.addEventListener('change',() => {
  state.tipsEnabled = tipsToggle.checked;
  localStorage.setItem('mysteryCards.tipsEnabled',String(state.tipsEnabled));
  renderSettings();

  if(!state.tipsEnabled){
    closeTipPopover();
    syncTipBadge();
    return;
  }

  /*
    Wird die Funktion mitten in einer laufenden Karte aktiviert,
    werden bereits vergangene Schwellen still nachgezogen.
    Der Tipp ist dann im Menü verfügbar, ohne verspätete Vollbild-Einblendung.
  */
  if(state.started){
    updateTipProgress(state.remainingMs,{announce:false});
  }else{
    syncTipBadge();
  }
});

tipBadge.addEventListener('click',event => {
  event.preventDefault();
  event.stopPropagation();

  if(tipPopover.hidden){
    openTipPopover();
  }else{
    closeTipPopover();
  }
});

tipPopoverClose.addEventListener('click',event => {
  event.preventDefault();
  event.stopPropagation();
  closeTipPopover();
});

tipPopover.addEventListener('pointerdown',event => {
  event.stopPropagation();
});

document.addEventListener('pointerdown',event => {
  if(tipPopover.hidden) return;
  if(event.target.closest('#tipPopover') || event.target.closest('#tipBadge')) return;
  closeTipPopover();
});

document.addEventListener('keydown',event => {
  if(event.key === 'Escape') closeTipPopover();
});

experimentalSuffToggle.addEventListener('change',() => {
  state.experimentalSuff = experimentalSuffToggle.checked;
  localStorage.setItem('mysteryCards.experimentalSuff',String(state.experimentalSuff));
  renderSettings();

  if(state.started){
    state.currentData.penalties = makePenalties();
    state.nextData.penalties = makePenalties();
    renderCurrentCard();
    renderPreviewCard();
  }
});

function changeTimer(delta){
  state.roundMinutes = Math.min(15,Math.max(1,state.roundMinutes + delta));
  localStorage.setItem('mysteryCards.roundMinutes',String(state.roundMinutes));
  timerSettingValue.textContent = state.roundMinutes;
  resetTimer();
}
timerMinus.addEventListener('click',() => changeTimer(-1));
timerPlus.addEventListener('click',() => changeTimer(1));

backToGamesButton.addEventListener('click',() => {
  const confirmed = window.confirm('Möchtest du Mystery Cards wirklich verlassen und zurück zu Spiele?');
  if(!confirmed) return;

  stopTimer();
  if(window.parent && window.parent !== window){
    window.parent.postMessage({type:'mystery-cards:exit'},window.location.origin === 'null' ? '*' : window.location.origin);
    return;
  }
  window.location.href = '../../index.html';
});


applyCardColors();
renderSettings();
updateTimerVisual(state.roundMinutes*60*1000);
