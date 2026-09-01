// script.js (com Compare, Quiz, Fato do Dia, Gerar Imagem + funcionalidades anteriores)
const speechBubble = document.getElementById('speech-bubble');
const mascot = document.getElementById('mascot');
const infoText = document.getElementById('info-text');
const stateTitle = document.getElementById('state-title');
const loaderEl = document.getElementById('loader');
const heroCard = document.getElementById('hero-card');
const favBtn = document.getElementById('favorite-btn');
const heroFact = document.getElementById('hero-fact');
const toastEl = document.getElementById('toast');

let currentTargetId = null;
let currentDialogues = [];
let currentExtras = {};
let emojiClicks = 0;
let isMuted = false;
let statesData = {}; // will hold data/states.json
let compareMode = false;
let compareSelected = []; // codes array (max 2)
let quizState = null; // state code for quiz
let quizQuestions = [];
let quizIndex = 0;
let quizScore = 0;

// THEME & SETTINGS (unchanged)
let currentTheme = localStorage.getItem('theme') || 'dark';
const themeDarkBtn = document.getElementById('theme-dark-btn');
const themeLightBtn = document.getElementById('theme-light-btn');

function applyTheme(theme) {
    if (theme === 'light') {
        document.body.classList.add('light-mode');
        localStorage.setItem('theme', 'light');
        if (themeDarkBtn) themeDarkBtn.classList.remove('active');
        if (themeLightBtn) themeLightBtn.classList.add('active');
    } else {
        document.body.classList.remove('light-mode');
        localStorage.setItem('theme', 'dark');
        if (themeDarkBtn) themeDarkBtn.classList.add('active');
        if (themeLightBtn) themeLightBtn.classList.remove('active');
    }
    currentTheme = theme;
}
if (themeDarkBtn) themeDarkBtn.addEventListener('click', () => applyTheme('dark'));
if (themeLightBtn) themeLightBtn.addEventListener('click', () => applyTheme('light'));
applyTheme(currentTheme);

// SETTINGS MENU
const settingsBtn = document.getElementById('settings-btn');
const settingsMenu = document.getElementById('settings-menu');
const closeSettingsBtn = document.getElementById('close-settings');
const muteToggleBtn = document.getElementById('mute-toggle');
const muteStatusDot = document.getElementById('mute-status');

if (settingsBtn) {
    settingsBtn.addEventListener('click', () => {
        const expanded = settingsMenu.classList.toggle('hidden');
        settingsBtn.setAttribute('aria-expanded', String(!expanded));
        settingsMenu.setAttribute('aria-hidden', expanded ? 'true' : 'false');
    });
}
if (closeSettingsBtn) closeSettingsBtn.addEventListener('click', () => {
    settingsMenu.classList.add('hidden');
    settingsBtn.setAttribute('aria-expanded', 'false');
    settingsMenu.setAttribute('aria-hidden', 'true');
});
document.addEventListener('click', (e) => {
    if (!e.target.closest('.settings-container')) {
        settingsMenu.classList.add('hidden');
        settingsBtn.setAttribute('aria-expanded', 'false');
        settingsMenu.setAttribute('aria-hidden', 'true');
    }
}, true);

if (muteToggleBtn) {
    muteToggleBtn.addEventListener('click', () => {
        isMuted = !isMuted;
        muteStatusDot.classList.toggle('green', !isMuted);
        muteStatusDot.classList.toggle('red', isMuted);
        muteToggleBtn.setAttribute('aria-pressed', String(isMuted));
        if (isMuted) window.speechSynthesis.cancel();
    });
}

// TTS
function speak(text) {
    if (isMuted) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'pt-BR';
    u.rate = 0.95;
    window.speechSynthesis.speak(u);
}

// YEAR CONTROLS
const yearSelect = document.getElementById('year-select');
const yearInput = document.getElementById('year-input');
const applyYearBtn = document.getElementById('apply-year-btn');
const yearDisplay = document.getElementById('year-display');

function updateYearDisplay(value) {
    if (yearDisplay) yearDisplay.innerText = value;
}
function getSelectedYear() {
    const inputVal = parseInt(yearInput.value, 10);
    if (!isNaN(inputVal) && inputVal !== 0) return inputVal;
    return parseInt(yearSelect.value, 10) || 2026;
}
if (yearSelect) {
    yearSelect.addEventListener('change', () => {
        const y = parseInt(yearSelect.value, 10);
        if (!isNaN(y)) {
            yearInput.value = y;
            updateYearDisplay(y);
            if (currentTargetId) fetchData(currentTargetId, y);
        }
    });
}
if (applyYearBtn) {
    applyYearBtn.addEventListener('click', () => {
        const y = getSelectedYear();
        updateYearDisplay(y);
        if (currentTargetId) fetchData(currentTargetId, y);
    });
}
if (yearInput) {
    yearInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') applyYearBtn.click();
    });
}

// FAVORITOS (localStorage)
function getFavs() {
    try { return JSON.parse(localStorage.getItem('mapa_favs') || '[]'); }
    catch { return []; }
}
function toggleFav(stateId) {
    if (!stateId) return;
    const favs = getFavs();
    const idx = favs.indexOf(stateId);
    if (idx === -1) favs.push(stateId); else favs.splice(idx, 1);
    localStorage.setItem('mapa_favs', JSON.stringify(favs));
    updateFavUI(stateId);
    showToast(idx === -1 ? 'Estado adicionado aos favoritos' : 'Estado removido dos favoritos');
}
function updateFavUI(stateId) {
    const favs = getFavs();
    const isFav = stateId && favs.includes(stateId);
    if (favBtn) {
        favBtn.classList.toggle('active', !!isFav);
        favBtn.setAttribute('aria-pressed', String(!!isFav));
        favBtn.innerText = isFav ? '♥ Favorito' : '♡ Favoritar';
    }
}

// TOAST
function showToast(msg, ms = 2500) {
    toastEl.innerText = msg;
    toastEl.classList.remove('hidden');
    toastEl.classList.add('show');
    setTimeout(() => {
        toastEl.classList.add('hidden');
        toastEl.classList.remove('show');
    }, ms);
}

// HERO ACTIONS (buttons)
document.getElementById('btn-random')?.addEventListener('click', () => {
    const stateButtons = Array.from(document.querySelectorAll('.state-btn'));
    if (stateButtons.length === 0) return;
    const rand = Math.floor(Math.random() * stateButtons.length);
    stateButtons[rand].click();
});

document.getElementById('btn-favorites')?.addEventListener('click', () => {
    const favs = getFavs();
    if (favs.length === 0) { showToast('Nenhum favorito salvo'); return; }
    const first = favs[0];
    const button = document.querySelector(`.state-btn[data-id="${first}"]`);
    if (button) button.click();
});

const compareModal = document.getElementById('compare-modal');
const startCompareBtn = document.getElementById('start-compare');
const closeCompareBtn = document.getElementById('close-compare');
const closeCompareBtn2 = document.getElementById('close-compare-2');
const resetCompareBtn = document.getElementById('reset-compare');
const compareResult = document.getElementById('compare-result');
const compareLeft = document.getElementById('compare-left');
const compareRight = document.getElementById('compare-right');

document.getElementById('btn-compare')?.addEventListener('click', () => {
    openModal(compareModal);
});

startCompareBtn?.addEventListener('click', () => {
    compareMode = true;
    compareSelected = [];
    document.getElementById('compare-instructions').innerText = 'Selecione dois estados na lista para comparar.';
    showToast('Modo comparação ativado: clique em 2 estados');
    closeCompareBtn?.classList.remove('hidden');
});
closeCompareBtn?.addEventListener('click', () => closeModal(compareModal));
closeCompareBtn2?.addEventListener('click', () => closeModal(compareModal));
resetCompareBtn?.addEventListener('click', () => {
    compareSelected = [];
    compareResult.classList.add('hidden');
    document.getElementById('compare-instructions').innerText = 'Selecione dois estados na lista para comparar.';
    showToast('Seleção de comparação resetada');
});

// QUIZ modal
const quizModal = document.getElementById('quiz-modal');
const startQuizBtn = document.getElementById('start-quiz-btn');
const closeQuizBtn = document.getElementById('close-quiz');
const quizQuestionArea = document.getElementById('quiz-question-area');

document.getElementById('btn-quiz')?.addEventListener('click', () => {
    openModal(quizModal);
});

startQuizBtn?.addEventListener('click', () => {
    if (!currentTargetId) {
        showToast('Selecione um estado para iniciar o quiz (clique na lista).');
        return;
    }
    setupQuizForState(currentTargetId);
});

// SHARE modal
const shareModal = document.getElementById('share-modal');
const genImageBtn = document.getElementById('gen-image-btn');
const downloadImageBtn = document.getElementById('download-image-btn');
const shareCanvas = document.getElementById('share-canvas');

document.getElementById('btn-share')?.addEventListener('click', () => {
    openModal(shareModal);
});

genImageBtn?.addEventListener('click', () => {
    if (!currentTargetId) { showToast('Selecione um estado primeiro.'); return; }
    generateShareImage(currentTargetId);
});

downloadImageBtn?.addEventListener('click', () => {
    const canvas = shareCanvas;
    const url = canvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = url;
    a.download = `${currentTargetId || 'estado'}-fato.png`;
    a.click();
});

// UTILS: open/close modal
function openModal(modal) {
    modal.classList.remove('hidden');
}
function closeModal(modal) {
    modal.classList.add('hidden');
}

// STATE BUTTON CLICK handling (select, compare mode, quiz)
document.addEventListener('click', (e) => {
    if (e.target.classList && e.target.classList.contains('state-btn')) {
        const id = e.target.getAttribute('data-id');
        const name = e.target.getAttribute('data-name');
        if (compareMode) {
            handleCompareSelection(id);
            return;
        }
        // Normal selection
        emojiClicks = 0;
        currentTargetId = id;
        stateTitle.innerText = name;
        updateFavUI(currentTargetId);
        heroCard?.classList.add('hidden');
        const yearToUse = getSelectedYear();
        updateYearDisplay(yearToUse);
        fetchData(currentTargetId, yearToUse);
    }
});

// Loader helpers
function showLoader() { loaderEl?.classList.remove('hidden'); infoText?.classList.add('hidden'); }
function hideLoader() { loaderEl?.classList.add('hidden'); infoText?.classList.remove('hidden'); }

// FETCH API (existing behavior)
function fetchData(id, year) {
    if (!id) return;
    speechBubble.classList.remove('hidden');
    mascot.classList.remove('hidden');
    showLoader();
    infoText.innerText = "Sincronizando fuso temporal...";
    fetch(`api.php?id=${encodeURIComponent(id)}&year=${encodeURIComponent(year)}`)
        .then(response => {
            if (!response.ok) throw new Error("Erro na requisição");
            return response.json();
        })
        .then(data => {
            hideLoader();
            mascot.innerText = data.mascot || '🦊';
            currentDialogues = data.dialogues || [];
            currentExtras = data.extras || {};
            infoText.innerText = currentDialogues[0] || "Sem dados históricos para este período.";
            updateCarousel(currentExtras);
            updateFavUI(currentTargetId);
            speak(currentDialogues[0] || "Sem dados históricos para este período.");
        })
        .catch(() => {
            hideLoader();
            infoText.innerText = "Falha de conexão com a central histórica.";
            hideCarousel();
        });
}

// CAROUSEL update (unchanged)
function updateCarousel(extras) {
    const carouselContainer = document.getElementById('carousel-container');
    if (!extras || Object.keys(extras).length === 0) { hideCarousel(); return; }
    carouselContainer.classList.remove('hidden');
    updateCarouselSection('curiosidades', extras.curiosidades || []);
    updateDestaques(extras.destaques || {});
    updateCarouselSection('personalidades', extras.personalidades || []);
    updateCarouselSection('economia', extras.economia || []);
    updateCarouselSection('turismo', extras.turismo || []);
}
function updateCarouselSection(sectionId, items) {
    const listElement = document.getElementById(`${sectionId}-list`);
    if (!listElement) return;
    listElement.innerHTML = '';
    if (!items || items.length === 0) { listElement.innerHTML = '<li>Dados não disponíveis para este período.</li>'; return; }
    items.forEach(item => {
        const li = document.createElement('li');
        li.textContent = item;
        listElement.appendChild(li);
    });
}
function updateDestaques(destaques) {
    const destaquesContent = document.getElementById('destaques-content');
    if (!destaquesContent) return;
    destaquesContent.innerHTML = '';
    if (!destaques || Object.keys(destaques).length === 0) { destaquesContent.innerHTML = '<p>Dados não disponíveis para este período.</p>'; return; }
    const subTabsContainer = document.createElement('div');
    subTabsContainer.className = 'sub-tabs-container';
    const subTabs = document.createElement('div');
    subTabs.className = 'sub-tabs';
    let firstTab = true;
    for (const [key, value] of Object.entries(destaques)) {
        if (Array.isArray(value) && value.length > 0) {
            const btn = document.createElement('button');
            btn.className = `sub-tab ${firstTab ? 'active' : ''}`;
            btn.setAttribute('data-subtab', key);
            btn.textContent = getSubTabLabel(key);
            btn.addEventListener('click', function() { switchSubTab(this); });
            subTabs.appendChild(btn);
            firstTab = false;
        }
    }
    subTabsContainer.appendChild(subTabs);
    const subContent = document.createElement('div');
    subContent.className = 'sub-tabs-content';
    firstTab = true;
    for (const [key, value] of Object.entries(destaques)) {
        if (Array.isArray(value) && value.length > 0) {
            const subItem = document.createElement('div');
            subItem.className = `sub-tab-item ${firstTab ? 'active' : ''}`;
            subItem.setAttribute('data-subtab', key);
            const ul = document.createElement('ul');
            value.forEach(item => {
                const li = document.createElement('li');
                li.textContent = item;
                ul.appendChild(li);
            });
            subItem.appendChild(ul);
            subContent.appendChild(subItem);
            firstTab = false;
        }
    }
    subTabsContainer.appendChild(subContent);
    destaquesContent.appendChild(subTabsContainer);
}
function getSubTabLabel(key) {
    const labels = { 'positivos': '✅ Dados Positivos', 'desafios': '⚠️ Desafios', 'geografia': '🌍 Geografia', 'numeros': '📊 Números' };
    return labels[key] || key;
}
function switchSubTab(button) {
    const subtabName = button.getAttribute('data-subtab');
    const destaquesContent = document.getElementById('destaques-content');
    if (!destaquesContent) return;
    destaquesContent.querySelectorAll('.sub-tab').forEach(tab => tab.classList.remove('active'));
    destaquesContent.querySelectorAll('.sub-tab-item').forEach(item => item.classList.remove('active'));
    button.classList.add('active');
    const activeItem = destaquesContent.querySelector(`[data-subtab="${subtabName}"]`);
    if (activeItem) activeItem.classList.add('active');
}
function hideCarousel() { const carouselContainer = document.getElementById('carousel-container'); carouselContainer.classList.add('hidden'); }

// MASCOTE CLICK (unchanged)
mascot?.addEventListener('click', () => {
    if (!currentDialogues || currentDialogues.length === 0) return;
    emojiClicks++;
    if (emojiClicks === 3) {
        infoText.innerText = "Pare de me tocar Roger! 😡👊";
        speak("Pare de me tocar Roger!");
    } else if (emojiClicks > 3) {
        infoText.innerText = "Roger, pare de clicar em mim! Vá usar a barra de tempo para estudar outra época!";
        speak("Roger, pare de clicar em mim! Vá usar a barra de tempo para estudar outra época!");
    } else {
        if (currentDialogues[emojiClicks]) {
            infoText.innerText = currentDialogues[emojiClicks];
            speak(currentDialogues[emojiClicks]);
        }
    }
});

// Audio toggle
function toggleAudio() {
    const audioBtn = document.getElementById('audio-btn');
    if (window.speechSynthesis.speaking) {
        window.speechSynthesis.cancel();
        if (audioBtn) audioBtn.innerText = '🔊 Ouvir Novamente';
    } else if (infoText.innerText) {
        speak(infoText.innerText);
        if (audioBtn) audioBtn.innerText = '⏹️ Parar';
    }
}

// COMPARE flow
function handleCompareSelection(code) {
    if (compareSelected.includes(code)) {
        compareSelected = compareSelected.filter(c => c !== code);
        highlightCompareButton(code, false);
        showToast('Estado removido da seleção de comparação');
        return;
    }
    if (compareSelected.length >= 2) {
        showToast('Já existem 2 estados selecionados — reset para escolher outros');
        return;
    }
    compareSelected.push(code);
    highlightCompareButton(code, true);
    showToast(`Selecionado para comparar: ${code}`);
    if (compareSelected.length === 2) {
        // show results
        showCompareResult(compareSelected[0], compareSelected[1]);
        compareMode = false;
    }
}
function highlightCompareButton(code, on) {
    const btn = document.querySelector(`.state-btn[data-id="${code}"]`);
    if (btn) {
        btn.classList.toggle('compare-selected', on);
    }
}
function showCompareResult(a, b) {
    compareResult.classList.remove('hidden');
    const left = buildCompareColumn(a);
    const right = buildCompareColumn(b);
    compareLeft.innerHTML = left;
    compareRight.innerHTML = right;
    document.getElementById('compare-instructions').innerText = 'Comparação pronta:';
    // scroll into view
    compareResult.scrollIntoView({ behavior: 'smooth' });
}
function buildCompareColumn(code) {
    const s = statesData[code];
    if (!s) return `<div class="compare-missing">Dados não encontrados para ${code}</div>`;
    const title = `<div class="compare-title">${code} - ${s.name || ''} ${s.mascot || ''}</div>`;
    const cur = (s.extras && s.extras.curiosidades && s.extras.curiosidades.length) ? `<p><strong>Curiosidade:</strong> ${s.extras.curiosidades[0]}</p>` : `<p>Sem curiosidades</p>`;
    const nums = (s.extras && s.extras.destaques && s.extras.destaques.numeros && s.extras.destaques.numeros.length) ? `<ul>${s.extras.destaques.numeros.map(x => `<li>${x}</li>`).join('')}</ul>` : `<p>Sem números disponíveis</p>`;
    return `${title}${cur}${nums}`;
}

// QUIZ flow: create 3 questions that ask "a qual estado pertence esta curiosidade?"
function setupQuizForState(stateCode) {
    const s = statesData[stateCode];
    if (!s) { showToast('Dados do estado não disponíveis para quiz'); return; }
    // collect curiosities for this state
    const curios = (s.extras && s.extras.curiosidades) ? s.extras.curiosidades.slice() : [];
    if (curios.length === 0) {
        // fallback: use first dialogue or generic
        curios.push((s.dialogues && s.dialogues[0]) || `Fato sobre ${stateCode}`);
    }
    // build pool of other state codes for distractors
    const otherCodes = Object.keys(statesData).filter(c => c !== stateCode);
    // questions array
    quizQuestions = [];
    const qCount = Math.min(3, curios.length);
    for (let i = 0; i < qCount; i++) {
        const fact = curios[i];
        // pick two random other states to serve as wrong options
        const opts = [stateCode];
        shuffleArray(otherCodes);
        opts.push(otherCodes[0] || 'BR-SP');
        opts.push(otherCodes[1] || 'BR-RJ');
        // shuffle options
        const options = shuffleArray(opts.slice());
        quizQuestions.push({ fact, correct: stateCode, options });
    }
    quizIndex = 0;
    quizScore = 0;
    quizState = stateCode;
    renderQuizQuestion();
}
function renderQuizQuestion() {
    quizQuestionArea.innerHTML = '';
    quizQuestionArea.classList.remove('hidden');
    if (quizIndex >= quizQuestions.length) {
        // show results
        quizQuestionArea.innerHTML = `<div class="quiz-results"><p>Você acertou ${quizScore} de ${quizQuestions.length}.</p><div class="modal-actions"><button id="quiz-close-btn" class="btn primary">Fechar</button></div></div>`;
        document.getElementById('quiz-close-btn')?.addEventListener('click', () => closeModal(quizModal));
        // award badge if full score
        if (quizScore === quizQuestions.length) {
            awardBadge(quizState);
        }
        return;
    }
    const q = quizQuestions[quizIndex];
    const qHtml = document.createElement('div');
    qHtml.innerHTML = `<p class="quiz-question">Qual estado corresponde ao fato: <em>${q.fact}</em> ?</p>`;
    const ul = document.createElement('ul');
    ul.className = 'quiz-options';
    q.options.forEach(opt => {
        const li = document.createElement('li');
        const labelState = (statesData[opt] && statesData[opt].name) ? `${opt} - ${statesData[opt].name}` : opt;
        li.innerHTML = `<button class="answer-btn btn outline" data-val="${opt}">${labelState}</button>`;
        ul.appendChild(li);
    });
    qHtml.appendChild(ul);
    quizQuestionArea.appendChild(qHtml);

    // attach listeners
    quizQuestionArea.querySelectorAll('.answer-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const val = e.currentTarget.getAttribute('data-val');
            if (val === q.correct) { quizScore++; showToast('Acertou!'); }
            else showToast('Resposta errada');
            quizIndex++;
            setTimeout(renderQuizQuestion, 600);
        });
    });
}

// BADGES (local)
function awardBadge(stateCode) {
    const key = 'mapa_badges';
    const badges = JSON.parse(localStorage.getItem(key) || '[]');
    if (!badges.includes(stateCode)) {
        badges.push(stateCode);
        localStorage.setItem(key, JSON.stringify(badges));
        showToast(`Badge desbloqueado para ${stateCode}!`);
    }
}

// SHARE image generator (canvas)
function generateShareImage(stateCode) {
    const canvas = shareCanvas;
    const ctx = canvas.getContext('2d');
    // clear
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0,0,canvas.width, canvas.height);
    // background gradient
    const g = ctx.createLinearGradient(0,0,canvas.width,canvas.height);
    g.addColorStop(0, '#f0f9ff');
    g.addColorStop(1, '#e6fffa');
    ctx.fillStyle = g;
    ctx.fillRect(0,0,canvas.width,canvas.height);

    const s = statesData[stateCode] || {};
    const mascotEmoji = s.mascot || '🦊';
    const title = `${stateCode} - ${s.name || ''}`;
    const year = getSelectedYear();
    const fact = (s.extras && s.extras.curiosidades && s.extras.curiosidades[0]) ? s.extras.curiosidades[0] : (s.dialogues && s.dialogues[0]) || 'Fato indisponível';

    // draw mascot big
    ctx.font = '72px serif';
    ctx.fillText(mascotEmoji, 40, 120);

    // draw title
    ctx.font = '28px Arial';
    ctx.fillStyle = '#022c43';
    ctx.fillText(title, 140, 90);

    // year
    ctx.font = '18px Arial';
    ctx.fillStyle = '#023047';
    ctx.fillText(`Ano: ${year}`, 140, 120);

    // fact text (wrapped)
    ctx.font = '20px Arial';
    ctx.fillStyle = '#073b4c';
    wrapText(ctx, fact, 40, 180, canvas.width - 80, 26);

    // footer small
    ctx.font = '14px Arial';
    ctx.fillStyle = '#0f172a';
    ctx.fillText('Fonte: Mapa Interativo (demo)', 40, canvas.height - 24);

    // show canvas and allow download
    canvas.classList.remove('hidden');
    downloadImageBtn.classList.remove('hidden');
    showToast('Imagem gerada — clique em "Baixar Imagem"');
}

// HELPERS
function shuffleArray(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}
function wrapText(ctx, text, x, y, maxWidth, lineHeight) {
    const words = text.split(' ');
    let line = '';
    for (let n = 0; n < words.length; n++) {
        const testLine = line + words[n] + ' ';
        const metrics = ctx.measureText(testLine);
        const testWidth = metrics.width;
        if (testWidth > maxWidth && n > 0) {
            ctx.fillText(line, x, y);
            line = words[n] + ' ';
            y += lineHeight;
        } else {
            line = testLine;
        }
    }
    ctx.fillText(line, x, y);
}

// FATO DO DIA — usa data/states.json
function pickFactOfTheDay() {
    const key = 'mapa_fact_of_day';
    const today = new Date().toISOString().slice(0,10);
    const stored = JSON.parse(localStorage.getItem(key) || '{}');
    if (stored.date === today && stored.fact) {
        heroFact.innerText = stored.fact;
        return;
    }
    // build pool of curiosities
    const pool = [];
    Object.entries(statesData).forEach(([code, s]) => {
        const curios = s.extras && s.extras.curiosidades ? s.extras.curiosidades : [];
        if (curios.length) curios.forEach(c => pool.push({ code, name: s.name || code, fact: c }));
    });
    if (pool.length === 0) {
        heroFact.innerText = 'Nenhuma curiosidade disponível no momento.';
        return;
    }
    shuffleArray(pool);
    const pick = pool[0];
    const msg = `${pick.fact} — (${pick.name})`;
    heroFact.innerText = msg;
    localStorage.setItem(key, JSON.stringify({ date: today, fact: msg }));
}

// FETCH states.json on init to power features (quiz, compare, fact)
function loadStatesJson() {
    fetch('data/states.json')
        .then(r => r.json())
        .then(json => {
            // add name friendly if missing
            Object.keys(json).forEach(code => {
                if (!json[code].name) {
                    // try derive readable name from region groups; otherwise use code
                    json[code].name = code;
                }
            });
            statesData = json;
            pickFactOfTheDay();
        })
        .catch(err => {
            console.error('Erro ao carregar data/states.json', err);
            heroFact.innerText = 'Fato do dia indisponível.';
        });
}

// QUIZ helpers (randomize, show results) done above

// INIT
(function init() {
    heroCard?.classList.remove('hidden');
    updateFavUI(null);
    loadStatesJson();
})();

// Accessibility / carousel tabs behavior (same as prior)
document.addEventListener('click', (e) => {
    if (e.target.classList && e.target.classList.contains('carousel-tab')) {
        const tabName = e.target.getAttribute('data-tab');
        document.querySelectorAll('.carousel-tab').forEach(tab => {
            tab.classList.remove('active'); tab.setAttribute('aria-selected', 'false');
        });
        document.querySelectorAll('.carousel-item').forEach(item => item.classList.remove('active'));
        e.target.classList.add('active'); e.target.setAttribute('aria-selected', 'true');
        const contentElement = document.getElementById(tabName);
        if (contentElement) contentElement.classList.add('active');
    }
});

// compareMode cancellation: clicking anywhere outside compare modal resets compareMode
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        compareMode = false;
        compareSelected = [];
        closeModal(compareModal);
        closeModal(quizModal);
        closeModal(shareModal);
    }
});