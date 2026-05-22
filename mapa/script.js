const slider = document.getElementById('year-slider');
const yearDisplay = document.getElementById('year-display');
const speechBubble = document.getElementById('speech-bubble');
const mascot = document.getElementById('mascot');
const infoText = document.getElementById('info-text');
const stateTitle = document.getElementById('state-title');

const viewSA = document.getElementById('view-south-america');
const viewBR = document.getElementById('view-brazil');
const viewGeneric = document.getElementById('view-generic-country');

let currentTargetId = null;
let currentDialogues = []; 
let emojiClicks = 0;       
let activeLayer = 'south-america'; 

slider.addEventListener('input', (e) => {
    yearDisplay.innerText = e.target.value;
    if (currentTargetId) {
        fetchData(currentTargetId, e.target.value);
    }
});

// Delegação de cliques unificada
document.addEventListener('click', (e) => {
    if (e.target.classList.contains('region') || e.target.classList.contains('country-region')) {
        const id = e.target.id;
        const name = e.target.getAttribute('data-name');
        
        emojiClicks = 0; 

        if (activeLayer === 'south-america') {
            if (id === 'COUNTRY-BR') {
                activeLayer = 'brazil';
                viewSA.classList.add('hidden');
                viewBR.classList.remove('hidden');
                stateTitle.innerText = "Brasil: Selecione um Estado";
                document.getElementById('main-title').innerText = "Navegando: Brasil 🇧🇷";
            } else {
                activeLayer = 'generic';
                viewSA.classList.add('hidden');
                viewGeneric.classList.remove('hidden');
                document.getElementById('generic-country-name').innerText = name;
                document.getElementById('main-title').innerText = `Navegando: ${name}`;
                
                const flags = {'COUNTRY-AR':'🇦🇷','COUNTRY-CL':'🇨🇱','COUNTRY-PE':'🇵🇪','COUNTRY-CO':'🇨🇴','COUNTRY-VE':'🇻🇪','COUNTRY-BO':'🇧🇴','COUNTRY-PY':'🇵🇾','COUNTRY-UY':'🇺🇾','COUNTRY-EC':'🇪🇨'};
                document.getElementById('generic-country-flag').innerText = flags[id] || '🏳️';
                stateTitle.innerText = `${name}: Selecione uma Região`;
            }
        } else {
            currentTargetId = id;
            stateTitle.innerText = name;
            fetchData(currentTargetId, slider.value);
        }
    }
});

function zoomOut() {
    activeLayer = 'south-america';
    viewBR.classList.add('hidden');
    viewGeneric.classList.add('hidden');
    viewSA.classList.remove('hidden');
    
    document.getElementById('main-title').innerText = "América do Sul: Navegação Interativa 🌎";
    stateTitle.innerText = "Selecione um Alvo";
    speechBubble.classList.add('hidden');
    mascot.classList.add('hidden');
    currentTargetId = null;
    currentDialogues = [];
    emojiClicks = 0;
}

function fetchData(id, year) {
    speechBubble.classList.remove('hidden');
    mascot.classList.remove('hidden');
    infoText.innerText = "Sincronizando fuso temporal...";

    fetch(`api.php?id=${id}&year=${year}`)
        .then(response => response.json())
        .then(data => {
            mascot.innerText = data.mascot;
            currentDialogues = data.dialogues;
            infoText.innerText = currentDialogues[0]; 
        })
        .catch(() => {
            infoText.innerText = "Falha de conexão com a central histórica.";
        });
}

mascot.addEventListener('click', () => {
    if (currentDialogues.length === 0) return;

    emojiClicks++;

    if (emojiClicks === 3) {
        infoText.innerText = "Pare de me tocar Roger! 😡👊";
    } else if (emojiClicks > 3) {
        infoText.innerText = "Roger, pare de clicar em mim! Vá usar a barra de tempo para estudar outra época!";
    } else {
        if (currentDialogues[emojiClicks]) {
            infoText.innerText = currentDialogues[emojiClicks];
        }
    }
});