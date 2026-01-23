const dropZone = document.getElementById('dropZone');
const fileInput = document.getElementById('fileInput');
const previewContainer = document.getElementById('previewContainer');
const imagePreview = document.getElementById('imagePreview');
const removeBtn = document.getElementById('removeBtn');
const classifyBtn = document.getElementById('classifyBtn');
const loading = document.getElementById('loading');
const resultsSection = document.getElementById('resultsSection');
const newScanBtn = document.getElementById('newScanBtn');
const resetBtn = document.getElementById('resetBtn');

let selectedFile = null;

const BIN_CONFIG = {
    recycling: {
        icon: '♻️',
        name: 'Recycling',
        color: '#2196F3'
    },
    compost: {
        icon: '🌱',
        name: 'Compost',
        color: '#4CAF50'
    },
    landfill: {
        icon: '🗑️',
        name: 'Landfill',
        color: '#757575'
    },
    'e-waste': {
        icon: '🔌',
        name: 'E-Waste',
        color: '#F44336'
    }
};

function initStats() {
    const stats = localStorage.getItem('ecosortStats');
    if (!stats) {
        localStorage.setItem('ecosortStats', JSON.stringify({
            itemsCount: 0,
            totalWaste: 0,
            totalCo2: 0,
            totalMoney: 0
        }));
    }
    updateTotalDisplay();
}

function updateStats(wasteSaved, co2Saved, moneySaved) {
    const stats = JSON.parse(localStorage.getItem('ecosortStats'));
    stats.itemsCount += 1;
    stats.totalWaste += wasteSaved;
    stats.totalCo2 += co2Saved;
    stats.totalMoney += moneySaved;
    localStorage.setItem('ecosortStats', JSON.stringify(stats));
    updateTotalDisplay();
}

function updateTotalDisplay() {
    const stats = JSON.parse(localStorage.getItem('ecosortStats'));
    document.getElementById('totalWaste').textContent = stats.itemsCount;
    document.getElementById('totalWasteDiverted').textContent = formatWeight(stats.totalWaste);
    document.getElementById('totalCo2').textContent = formatWeight(stats.totalCo2);
    document.getElementById('totalMoney').textContent = formatMoney(stats.totalMoney);
}

function formatWeight(grams) {
    if (grams >= 1000) {
        return (grams / 1000).toFixed(1) + 'kg';
    }
    return grams + 'g';
}

function formatMoney(cents) {
    return '$' + (cents / 100).toFixed(2);
}

function resetStats() {
    if (confirm('Are you sure you want to reset all your stats?')) {
        localStorage.setItem('ecosortStats', JSON.stringify({
            itemsCount: 0,
            totalWaste: 0,
            totalCo2: 0,
            totalMoney: 0
        }));
        updateTotalDisplay();
    }
}

dropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropZone.classList.add('dragover');
});

dropZone.addEventListener('dragleave', () => {
    dropZone.classList.remove('dragover');
});

dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZone.classList.remove('dragover');
    const files = e.dataTransfer.files;
    if (files.length > 0 && files[0].type.startsWith('image/')) {
        handleFile(files[0]);
    }
});

dropZone.addEventListener('click', (e) => {
    if (e.target !== removeBtn && !removeBtn.contains(e.target)) {
        if (!selectedFile) {
            fileInput.click();
        }
    }
});

fileInput.addEventListener('change', (e) => {
    if (e.target.files.length > 0) {
        handleFile(e.target.files[0]);
    }
});

function handleFile(file) {
    selectedFile = file;
    const reader = new FileReader();
    reader.onload = (e) => {
        imagePreview.src = e.target.result;
        document.querySelector('.upload-content').style.display = 'none';
        previewContainer.style.display = 'block';
        classifyBtn.disabled = false;
    };
    reader.readAsDataURL(file);
}

removeBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    clearPreview();
});

function clearPreview() {
    selectedFile = null;
    imagePreview.src = '';
    previewContainer.style.display = 'none';
    document.querySelector('.upload-content').style.display = 'flex';
    classifyBtn.disabled = true;
    fileInput.value = '';
}

classifyBtn.addEventListener('click', classifyImage);

async function classifyImage() {
    if (!selectedFile) return;
    
    loading.classList.add('active');
    classifyBtn.style.display = 'none';
    resultsSection.style.display = 'none';
    
    const formData = new FormData();
    formData.append('image', selectedFile);
    
    try {
        const response = await fetch('/classify-image', {
            method: 'POST',
            body: formData
        });
        
        const data = await response.json();
        
        if (data.error) {
            throw new Error(data.error);
        }
        
        displayResults(data);
        updateStats(data.waste_saved_grams, data.co2_saved_grams, data.money_saved_cents);
        
    } catch (error) {
        console.error('Error:', error);
        alert('Failed to classify image: ' + error.message);
    } finally {
        loading.classList.remove('active');
        classifyBtn.style.display = 'block';
    }
}

function displayResults(data) {
    const binType = data.bin;
    const binConfig = BIN_CONFIG[binType] || BIN_CONFIG.landfill;
    
    const resultCard = document.getElementById('resultCard');
    resultCard.className = 'result-card ' + binType;
    
    document.getElementById('binIcon').textContent = binConfig.icon;
    document.getElementById('itemName').textContent = data.item;
    
    const binName = document.getElementById('binName');
    binName.textContent = binConfig.name;
    binName.className = 'bin-name ' + binType;
    
    document.getElementById('confidenceLabel').textContent = 
        'Confidence: ' + (data.confidence || 'Medium').charAt(0).toUpperCase() + 
        (data.confidence || 'medium').slice(1);
    
    document.getElementById('wasteSaved').textContent = formatWeight(data.waste_saved_grams);
    document.getElementById('co2Saved').textContent = formatWeight(data.co2_saved_grams);
    document.getElementById('moneySaved').textContent = formatMoney(data.money_saved_cents);
    
    resultsSection.style.display = 'block';
    resultsSection.scrollIntoView({ behavior: 'smooth' });
}

newScanBtn.addEventListener('click', () => {
    clearPreview();
    resultsSection.style.display = 'none';
    document.querySelector('.upload-section').scrollIntoView({ behavior: 'smooth' });
});

resetBtn.addEventListener('click', resetStats);

initStats();
