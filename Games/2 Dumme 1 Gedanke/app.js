const LEVELS = {
  spicy: [
    { id:1, name:'Soft', description:'Null intime & sensible Inhalte', img:'../../Assets/Games/Spicy_Level 1.png', top:'#329BFF', bottom:'#238CF0', accent:'#238CF0' },
    { id:2, name:'Direkt', description:'Leicht intime & sensible Themen', img:'../../Assets/Games/Spicy_Level 2.png', top:'#6E00FA', bottom:'#5A00E6', accent:'#5A00E6' },
    { id:3, name:'Schonungslos', description:'Stark intime & sensible Themen', img:'../../Assets/Games/Spicy_Level 3.png', top:'#FA0AFF', bottom:'#E100E6', accent:'#E100E6' }
  ],
  suff: [
    { id:1, name:'Chillig', img:'../../Assets/Games/Suff_Level 1.png', top:'#329BFF', bottom:'#238CF0', accent:'#238CF0' },
    { id:2, name:'Party', img:'../../Assets/Games/Suff_Level 2.png', top:'#6E00FA', bottom:'#5A00E6', accent:'#5A00E6' },
    { id:3, name:'Abriss', img:'../../Assets/Games/Suff_Level 3.png', top:'#FA0AFF', bottom:'#E100E6', accent:'#E100E6' },
    { id:4, name:'Blackout', img:'../../Assets/Games/Suff_Level 4.png', top:'#FF0A69', bottom:'#EB0055', accent:'#E50055' }
  ]
};

// Welche Text-Pools bei einer gewählten Spicy Intensity ausgespielt werden.
const SPICY_MIX = {
  1: [[1,1]],
  2: [[1,.40],[2,.60]],
  3: [[1,.20],[2,.30],[3,.50]]
};

const RECENT_PROMPT_LIMIT = 15;
const savedSpicy = Number(localStorage.getItem('zweiDummeEinGedanke.spicyLevel'));
const savedSuff = Number(localStorage.getItem('zweiDummeEinGedanke.suffLevel'));
const savedExperimentalSuff = localStorage.getItem('zweiDummeEinGedanke.experimentalSuff');
const savedTeamColor = localStorage.getItem('zweiDummeEinGedanke.teamColor');

const state = {
  started:false,
  spicyLevel:[1,2,3].includes(savedSpicy) ? savedSpicy : 1,
  suffLevel:[1,2,3,4].includes(savedSuff) ? savedSuff : 1,
  // Experimentelle Suff Intensity bleibt auch nach Neuladen/Neustart gespeichert.
  experimentalSuff:savedExperimentalSuff === 'true',
  teamColor:savedTeamColor || '',
  currentData:null,
  nextData:null,
  recentPrompts:[],
  promptLastSeen:new Map(),
  promptSequence:0,
  dragging:false,
  pointerId:null,
  startX:0,
  dx:0,
  swiping:false
};

const card = document.querySelector('#gameCard');
const cardStack = document.querySelector('#cardStack');
const previewCard = document.querySelector('#previewCard');
const instructionText = document.querySelector('#instructionText');
const promptText = document.querySelector('#promptText');
const resultAmount = document.querySelector('#resultAmount');
const previewPromptText = document.querySelector('#previewPromptText');
const previewResultAmount = document.querySelector('#previewResultAmount');
const settingsButton = document.querySelector('#settingsButton');
const settingsSheet = document.querySelector('#settingsSheet');
const sheetScrim = document.querySelector('#sheetScrim');
const doneButton = document.querySelector('#doneButton');
const spicyLevels = document.querySelector('#spicyLevels');
const suffLevels = document.querySelector('#suffLevels');
const spicySummary = document.querySelector('#spicySummary');
const suffSummary = document.querySelector('#suffSummary');
const experimentalSuffToggle = document.querySelector('#experimentalSuffToggle');
const backToGamesButton = document.querySelector('#backToGamesButton');

const thoughtFab = document.querySelector('#thoughtFab');
const thoughtOverlay = document.querySelector('#thoughtOverlay');
const thoughtClose = document.querySelector('#thoughtClose');
const thoughtInput = document.querySelector('#thoughtInput');
const thoughtDisplayText = document.querySelector('#thoughtDisplayText');
const thoughtClearButton = document.querySelector('#thoughtClearButton');
const thoughtTrashIcon = document.querySelector('#thoughtTrashIcon');
const teamColorGrid = document.querySelector('#teamColorGrid');
const teamColorFirstModal = document.querySelector('#teamColorFirstModal');
const teamColorFirstGrid = document.querySelector('#teamColorFirstGrid');



const TEAM_COLORS = [
  '#FFA600','#F50800','#F500D4','#8717FF','#0032F9','#00B2FF','#00CD4E','#1E2127'
];

function applyTeamColor(){
  const color = TEAM_COLORS.includes(state.teamColor)
    ? state.teamColor
    : '#6B7280';

  document.documentElement.style.setProperty('--team-color',color);

  document.querySelectorAll('[data-team-color]').forEach(button => {
    const active = button.dataset.teamColor === state.teamColor;
    button.classList.toggle('is-active',active);
    button.setAttribute('aria-pressed',String(active));
  });

}

function chooseTeamColor(color){
  if(!TEAM_COLORS.includes(color)) return;

  state.teamColor = color;
  localStorage.setItem('zweiDummeEinGedanke.teamColor',color);

  // Sofort aktualisieren, bevor das Erststart-Popup geschlossen wird.
  document.documentElement.style.setProperty('--team-color',color);
  updateThoughtTrashIcon();
  applyTeamColor();

  if(teamColorFirstModal){
    teamColorFirstModal.hidden = true;
  }
}

function handleTeamColorClick(event){
  const button = event.target.closest('[data-team-color]');
  if(!button) return;
  chooseTeamColor(button.dataset.teamColor);
}

teamColorGrid?.addEventListener('click',handleTeamColorClick);
teamColorFirstGrid?.addEventListener('click',handleTeamColorClick);


function gradient(level){ return `linear-gradient(180deg, ${level.top}, ${level.bottom})`; }
function getLevel(kind,id){ return LEVELS[kind].find(level => level.id === id); }

function getSuffConfig(){
  const config = state.experimentalSuff ? window.SUFF_EXPERIMENTAL : window.SUFF_NORMAL;
  return config || {};
}
function getSuffRules(levelId = state.suffLevel){
  return getSuffConfig()[levelId] || { sips:[{value:0,weight:1}], shots:[{value:0,weight:1}] };
}
function normalizedEntries(entries){
  if(!Array.isArray(entries)) return [];
  return entries
    .map(entry => Array.isArray(entry)
      ? { value:Number(entry[0]), weight:Number(entry[1]) }
      : { value:Number(entry?.value), weight:Number(entry?.weight) })
    .filter(entry => Number.isFinite(entry.value) && Number.isFinite(entry.weight) && entry.weight > 0);
}

function renderLevelButtons(kind){
  const container = kind === 'spicy' ? spicyLevels : suffLevels;
  const current = kind === 'spicy' ? state.spicyLevel : state.suffLevel;
  container.innerHTML = '';
  container.style.gridTemplateColumns = `repeat(${LEVELS[kind].length}, minmax(0, 1fr))`;
  LEVELS[kind].forEach(level => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = `level-button${level.id === current ? ' is-active' : ''}`;
    button.style.setProperty('--level-color',level.accent);
    button.style.setProperty('--level-gradient',gradient(level));
    button.setAttribute('aria-label',`${kind === 'spicy' ? 'Spicy' : 'Suff'} Intensity ${level.id}: ${level.name}`);
    const img = document.createElement('img');
    img.src = level.img;
    img.alt = '';
    button.append(img);
    button.addEventListener('click',() => selectLevel(kind,level.id));
    container.append(button);
  });
}

function selectLevel(kind,id){
  if(kind === 'spicy') {
    state.spicyLevel = id;
    localStorage.setItem('zweiDummeEinGedanke.spicyLevel',String(id));
  } else {
    state.suffLevel = id;
    localStorage.setItem('zweiDummeEinGedanke.suffLevel',String(id));
  }

  applyTeamColor();
renderSettings();
  applyCardColors();

  if(!state.started) return;

  if(kind === 'suff') {
    // Suff-Änderungen wirken sofort auf die bereits sichtbare Karte.
    // Der Spicy-Text bleibt dabei unverändert.
    state.currentData.result = makeSuffResult();
    state.nextData.result = makeSuffResult();
    renderCurrentCard();
    renderPreviewCard();
  } else {
    // Bei Spicy bleibt die sichtbare Karte stehen, nur die nächste wird neu vorbereitet.
    state.nextData = makeCardData();
    renderPreviewCard();
  }
}

function rangeText(entries, singular, plural){
  const values = normalizedEntries(entries).map(entry => entry.value);
  if(!values.length) return `0 ${plural}`;
  const min = Math.min(...values);
  const max = Math.max(...values);
  if(min === max) return `${min} ${min === 1 ? singular : plural}`;
  return `${min}–${max} ${max === 1 ? singular : plural}`;
}
function suffDescription(levelId = state.suffLevel){
  const rules = getSuffRules(levelId);
  const sipText = rangeText(rules.sips,'Strafschluck','Strafschlücke');
  const shotEntries = normalizedEntries(rules.shots);
  const shotValues = shotEntries.map(entry => entry.value);
  const maxShot = shotValues.length ? Math.max(...shotValues) : 0;
  if(maxShot <= 0) return sipText;
  return `${sipText} & ${rangeText(rules.shots,'Shot','Shots')}`;
}

function renderSettings(){
  applyTeamColor();
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
}

function getPromptPool(level){
  if(level === 1) return window.SPICY_LEVEL_1 || [];
  if(level === 2) return window.SPICY_LEVEL_2 || [];
  if(level === 3) return window.SPICY_LEVEL_3 || [];
  return [];
}

function weightedValue(entries){
  const normalized = normalizedEntries(entries);
  if(!normalized.length) return 0;
  const totalWeight = normalized.reduce((sum,entry) => sum + entry.weight,0);
  const r = Math.random() * totalWeight;
  let total = 0;
  for(const entry of normalized){
    total += entry.weight;
    if(r <= total) return entry.value;
  }
  return normalized.at(-1).value;
}

function weightedPairValue(entries){
  const totalWeight = entries.reduce((sum,[,weight]) => sum + weight,0);
  if(totalWeight <= 0) return entries.at(-1)?.[0];
  const r = Math.random() * totalWeight;
  let total = 0;
  for(const [value,weight] of entries){
    total += weight;
    if(r <= total) return value;
  }
  return entries.at(-1)?.[0];
}

function promptCandidates(){
  return (SPICY_MIX[state.spicyLevel] || SPICY_MIX[1])
    .map(([level,weight]) => ({
      level,
      weight,
      items:getPromptPool(level).filter(item => typeof item === 'string' && item.trim())
    }))
    .filter(group => group.items.length);
}

function choosePrompt(){
  const groups = promptCandidates();
  if(!groups.length) return 'Spicy Intensity';

  const blocked = new Set(state.recentPrompts);
  const availableGroups = groups
    .map(group => ({...group, available:group.items.filter(item => !blocked.has(item))}))
    .filter(group => group.available.length);

  let chosen;
  if(availableGroups.length){
    const chosenLevel = weightedPairValue(availableGroups.map(group => [group.level,group.weight]));
    const group = availableGroups.find(item => item.level === chosenLevel) || availableGroups[0];
    chosen = group.available[Math.floor(Math.random() * group.available.length)];
  } else {
    const all = [...new Set(groups.flatMap(group => group.items))];
    const oldestSeen = Math.min(...all.map(item => state.promptLastSeen.get(item) ?? -Infinity));
    const leastRecent = all.filter(item => (state.promptLastSeen.get(item) ?? -Infinity) === oldestSeen);
    chosen = leastRecent[Math.floor(Math.random() * leastRecent.length)];
  }

  state.promptSequence += 1;
  state.promptLastSeen.set(chosen,state.promptSequence);
  state.recentPrompts.push(chosen);
  if(state.recentPrompts.length > RECENT_PROMPT_LIMIT) state.recentPrompts.shift();
  return chosen;
}

function formatSips(value){
  return value === 1 ? '1 Strafschluck' : `${value} Strafschlücke`;
}
function formatShots(value){
  return value === 1 ? '1 Shot' : `${value} Shots`;
}
function makeSuffResult(){
  const rules = getSuffRules();
  const sips = Math.max(0, weightedValue(rules.sips));
  const shots = Math.max(0, weightedValue(rules.shots));

  // Wenn die gezogene Suff-Strafe komplett auf 0 liegt,
  // wird keine 0-Strafe ausgeschrieben.
  if(sips === 0 && shots === 0){
    return 'Keine Strafe';
  }

  // Falls nur ein Shot gezogen wird, vermeiden wir ebenfalls
  // die unschöne Formulierung "0 Strafschlücke & ...".
  if(sips === 0 && shots > 0){
    return formatShots(shots);
  }

  const sipText = formatSips(sips);
  return shots > 0 ? `${sipText} & ${formatShots(shots)}` : sipText;
}
function makeCardData(){
  return { prompt:choosePrompt(), result:makeSuffResult() };
}


function updateThoughtTrashIcon(){
  if(!thoughtTrashIcon) return;

  const trashByColor = {
    '#FFA600':'../../Assets/Games/2_Dumme_1_Gedanke_Trash_Team_1.svg',
    '#F50800':'../../Assets/Games/2_Dumme_1_Gedanke_Trash_Team_2.svg',
    '#F500D4':'../../Assets/Games/2_Dumme_1_Gedanke_Trash_Team_3.svg',
    '#8717FF':'../../Assets/Games/2_Dumme_1_Gedanke_Trash_Team_4.svg',
    '#0032F9':'../../Assets/Games/2_Dumme_1_Gedanke_Trash_Team_5.svg',
    '#00B2FF':'../../Assets/Games/2_Dumme_1_Gedanke_Trash_Team_6.svg',
    '#00CD4E':'../../Assets/Games/2_Dumme_1_Gedanke_Trash_Team_7.svg',
    '#1E2127':'../../Assets/Games/2_Dumme_1_Gedanke_Trash_Team_8.svg'
  };

  const nextSrc = trashByColor[state.teamColor];
  if(!nextSrc) return;

  // Set both property + attribute immediately.
  // The tiny cache-buster makes iOS refresh the image instantly when switching.
  thoughtTrashIcon.src = `${nextSrc}?v=${Date.now()}`;
  thoughtTrashIcon.setAttribute('src', `${nextSrc}?v=${Date.now()}`);
}

function applyCardColors(){
  updateThoughtTrashIcon();
  const spicy = getLevel('spicy',state.spicyLevel);
  const suff = getLevel('suff',state.suffLevel);
  document.documentElement.style.setProperty('--spicy-top',spicy.top);
  document.documentElement.style.setProperty('--spicy-bottom',spicy.bottom);
  document.documentElement.style.setProperty('--suff-accent',suff.accent);
}
function renderCurrentCard(){
  if(!state.currentData) return;
  promptText.textContent = state.currentData.prompt;
  resultAmount.textContent = state.currentData.result;
}
function renderPreviewCard(){
  if(!state.nextData) return;
  previewPromptText.textContent = state.nextData.prompt;
  previewResultAmount.textContent = state.nextData.result;
}

function rerollVisibleSuff(){
  if(!state.started) return;
  state.currentData.result = makeSuffResult();
  state.nextData.result = makeSuffResult();
  renderCurrentCard();
  renderPreviewCard();
}

function startGame(){
  if(state.started) return;
  state.started = true;
  state.currentData = makeCardData();
  state.nextData = makeCardData();
  applyCardColors();
  renderCurrentCard();
  renderPreviewCard();
  card.classList.add('is-flipped');
  cardStack.classList.add('is-started');
  card.setAttribute('aria-label','Zur nächsten Karte nach links oder rechts wischen');
  instructionText.textContent = 'Zur nächsten Karte wischen';
}

function finishSwipe(direction){
  if(state.swiping) return;
  state.swiping = true;
  const distance = Math.max(window.innerWidth,500) * 1.15 * direction;
  card.style.transition = 'transform 300ms cubic-bezier(.2,.72,.25,1), opacity 250ms ease';
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
  },310);
}

function cancelSwipe(){
  card.style.transition = 'transform 220ms cubic-bezier(.2,.75,.2,1)';
  previewCard.style.transition = 'transform 220ms cubic-bezier(.2,.75,.2,1)';
  card.style.transform = 'translateX(0) rotate(0deg)';
  previewCard.style.transform = 'scale(.94)';
  setTimeout(() => { card.style.transition=''; previewCard.style.transition=''; },230);
}

card.addEventListener('click',startGame);
card.addEventListener('pointerdown',event => {
  if(!state.started || state.swiping) return;
  state.dragging = true;
  state.pointerId = event.pointerId;
  state.startX = event.clientX;
  state.dx = 0;
  card.setPointerCapture(event.pointerId);
  card.style.transition = 'none';
  previewCard.style.transition = 'none';
});
card.addEventListener('pointermove',event => {
  if(!state.dragging || event.pointerId !== state.pointerId) return;
  state.dx = event.clientX - state.startX;
  const width = card.getBoundingClientRect().width;
  const progress = Math.min(Math.abs(state.dx)/(width*.8),1);
  const rotation = (state.dx/width)*10;
  card.style.transform = `translateX(${state.dx}px) rotate(${rotation}deg)`;
  previewCard.style.transform = `scale(${.94 + progress*.06})`;
});
card.addEventListener('pointerup',event => {
  if(!state.dragging || event.pointerId !== state.pointerId) return;
  state.dragging = false;
  const width = card.getBoundingClientRect().width;
  if(Math.abs(state.dx) > width*.22) finishSwipe(state.dx < 0 ? -1 : 1);
  else cancelSwipe();
  state.pointerId = null;
});
card.addEventListener('pointercancel',() => {
  if(state.dragging){
    state.dragging=false;
    cancelSwipe();
  }
});

experimentalSuffToggle.addEventListener('change',() => {
  state.experimentalSuff = experimentalSuffToggle.checked;
  localStorage.setItem('zweiDummeEinGedanke.experimentalSuff', String(state.experimentalSuff));
  renderSettings();
  rerollVisibleSuff();
});

function openSettings(){
  renderSettings();
  sheetScrim.hidden=false;
  requestAnimationFrame(() => settingsSheet.classList.add('is-open'));
  settingsSheet.setAttribute('aria-hidden','false');
}
function closeSettings(){
  settingsSheet.classList.remove('is-open');
  settingsSheet.setAttribute('aria-hidden','true');
  setTimeout(() => { sheetScrim.hidden=true; },420);
}
settingsButton.addEventListener('click',openSettings);
sheetScrim.addEventListener('click',closeSettings);
doneButton.addEventListener('click',closeSettings);
document.addEventListener('keydown',event => {
  if(event.key !== 'Escape') return;
  if(!thoughtOverlay.hidden){
    closeThoughtOverlay();
    return;
  }
  closeSettings();
});






function escapeThoughtHtml(value){
  return String(value)
    .replaceAll('&','&amp;')
    .replaceAll('<','&lt;')
    .replaceAll('>','&gt;')
    .replaceAll('"','&quot;')
    .replaceAll("'",'&#039;');
}

function balancedWordLines(words,lineCount){
  if(lineCount <= 1) return [words.join(' ')];
  if(lineCount >= words.length) return words.slice();

  const totalChars = words.reduce((sum,word) => sum + word.length,0) + (words.length - lineCount);
  const target = totalChars / lineCount;

  const lines = [];
  let current = [];
  let currentLength = 0;
  let remainingLines = lineCount;

  words.forEach((word,index) => {
    const remainingWords = words.length - index;
    const wordLength = word.length + (current.length ? 1 : 0);

    const mustBreak = current.length && remainingWords === remainingLines;
    const wouldOvershoot =
      current.length &&
      currentLength + wordLength > target &&
      Math.abs(currentLength - target) <= Math.abs((currentLength + wordLength) - target);

    if((mustBreak || wouldOvershoot) && remainingLines > 1){
      lines.push(current.join(' '));
      current = [word];
      currentLength = word.length;
      remainingLines -= 1;
    }else{
      current.push(word);
      currentLength += wordLength;
    }
  });

  if(current.length) lines.push(current.join(' '));
  return lines;
}

function renderThoughtLines(lines){
  thoughtDisplayText.innerHTML = lines
    .map(line => `<span class="thought-line">${escapeThoughtHtml(line)}</span>`)
    .join('');
}

function maxFontSizeForCurrentLines(rotated,visualWidth,visualHeight){
  let min = 18;
  let max = 900;
  let best = min;

  while(min <= max){
    const size = Math.floor((min + max) / 2);
    thoughtDisplayText.style.fontSize = `${size}px`;

    const rect = thoughtDisplayText.getBoundingClientRect();
    const fits =
      rect.width <= visualWidth &&
      rect.height <= visualHeight &&
      thoughtDisplayText.scrollWidth <= rotated.clientWidth &&
      thoughtDisplayText.scrollHeight <= rotated.clientHeight;

    if(fits){
      best = size;
      min = size + 1;
    }else{
      max = size - 1;
    }
  }

  return best;
}

function fitThoughtDisplay(){
  const display = document.querySelector('.thought-display');
  const rotated = document.querySelector('.thought-display-rotated');
  if(!display || !rotated || !thoughtDisplayText || thoughtOverlay.hidden) return;

  const style = getComputedStyle(display);
  const paddingTop = parseFloat(style.paddingTop) || 0;
  const paddingRight = parseFloat(style.paddingRight) || 0;
  const paddingBottom = parseFloat(style.paddingBottom) || 0;
  const paddingLeft = parseFloat(style.paddingLeft) || 0;

  const visualWidth = Math.max(60,display.clientWidth - paddingLeft - paddingRight);
  const visualHeight = Math.max(60,display.clientHeight - paddingTop - paddingBottom);

  rotated.style.width = `${visualHeight}px`;
  rotated.style.height = `${visualWidth}px`;

  const rawText = (thoughtInput?.value || '').trim() || 'Dein Gedanke';
  const words = rawText.split(/\s+/).filter(Boolean);

  let maxLines = 1;
  if(words.length >= 3) maxLines = 2;
  if(words.length >= 5) maxLines = 3;
  if(words.length >= 8) maxLines = 4;
  maxLines = Math.min(maxLines,words.length);

  let best = {
    size:18,
    lines:[rawText],
    lineCount:1
  };

  for(let lineCount = 1; lineCount <= maxLines; lineCount += 1){
    const lines = balancedWordLines(words,lineCount);
    renderThoughtLines(lines);

    const size = maxFontSizeForCurrentLines(rotated,visualWidth,visualHeight);

    const improvementNeeded = lineCount === 1 ? 1 : 1.08;
    const isBetter =
      size > best.size * improvementNeeded ||
      (lineCount === 1 && size > best.size);

    if(isBetter){
      best = {size,lines,lineCount};
    }
  }

  renderThoughtLines(best.lines);
  thoughtDisplayText.style.fontSize = `${best.size}px`;
}

function resizeThoughtInput(){
  if(!thoughtInput) return;
  thoughtInput.style.height = 'auto';
  thoughtInput.style.height = `${Math.min(thoughtInput.scrollHeight,128)}px`;
}

function updateThoughtPreview(){
  resizeThoughtInput();

  requestAnimationFrame(() => {
    requestAnimationFrame(fitThoughtDisplay);
  });
}

function openThoughtOverlay(){
  applyTeamColor();
  applyCardColors();
  thoughtOverlay.hidden = false;
  thoughtOverlay.setAttribute('aria-hidden','false');
  document.body.classList.add('thought-is-open');
  if(teamColorFirstModal){
    teamColorFirstModal.hidden = Boolean(state.teamColor);
  }
  updateThoughtPreview();

  // Fokus erst nach dem Öffnen setzen, damit die mobile Tastatur zuverlässig erscheint.
  requestAnimationFrame(() => {
    fitThoughtDisplay();
    thoughtInput.focus({preventScroll:true});
  });

  window.setTimeout(fitThoughtDisplay,180);
}

function closeThoughtOverlay(){
  thoughtOverlay.hidden = true;
  thoughtOverlay.setAttribute('aria-hidden','true');
  document.body.classList.remove('thought-is-open');
  thoughtFab.focus({preventScroll:true});
}

thoughtFab?.addEventListener('click',openThoughtOverlay);
thoughtClose?.addEventListener('click',closeThoughtOverlay);
thoughtInput?.addEventListener('input',updateThoughtPreview);

thoughtClearButton?.addEventListener('click',() => {
  thoughtInput.value = '';
  updateThoughtPreview();
  thoughtInput.focus({preventScroll:true});
});
window.addEventListener('resize',() => requestAnimationFrame(fitThoughtDisplay));
window.addEventListener('orientationchange',() => window.setTimeout(fitThoughtDisplay,120));
window.visualViewport?.addEventListener('resize',() => requestAnimationFrame(fitThoughtDisplay));
document.fonts?.ready?.then(() => requestAnimationFrame(fitThoughtDisplay));

backToGamesButton?.addEventListener('click', () => {
  const confirmed = window.confirm('Möchtest du das Spiel wirklich verlassen und zurück zu Spiele?');
  if (!confirmed) return;

  // Wenn 2 Dumme 1 Gedanke im Spiele-Hub läuft, bleibt die installierte Web-App
  // im selben Top-Level-Dokument und wir schließen nur die Spielansicht.
  if (window.parent && window.parent !== window) {
    window.parent.postMessage({ type:'2-dumme-1-gedanke:exit' }, window.location.origin);
    return;
  }

  // Fallback, falls 2 Dumme 1 Gedanke einmal direkt im Browser geöffnet wird.
  window.location.href = '../../index.html';
});

renderSettings();
applyCardColors();
