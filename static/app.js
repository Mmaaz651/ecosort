let currentUser = null;
let isManagement = false;
let selectedFile = null;
let selectedBagFile = null;
let selectedSubmitFile = null;
let selectedBagType = 'green';
let selectedSubmitBagType = 'green';

const BIN_CONFIG = {
    recycling: { icon: '♻️', name: 'Recycling', color: '#2196F3' },
    compost: { icon: '🌱', name: 'Compost', color: '#4CAF50' },
    landfill: { icon: '🗑️', name: 'Landfill', color: '#757575' },
    'e-waste': { icon: '🔌', name: 'E-Waste', color: '#F44336' }
};

const PICKUP_COLORS = {
    green: { color: '#4CAF50', label: 'Compost' },
    blue: { color: '#2196F3', label: 'Recycling' },
    white: { color: '#9E9E9E', label: 'Landfill' }
};

function showView(viewId) {
    ['landingView', 'userLoginView', 'mgmtLoginView', 'userDashboard', 'mgmtDashboard'].forEach(id => {
        document.getElementById(id).style.display = 'none';
    });
    document.getElementById(viewId).style.display = 'block';
}

function resetUserSession() {
    selectedFile = null;
    selectedBagFile = null;
    selectedSubmitFile = null;
    selectedBagType = 'green';
    selectedSubmitBagType = 'green';
    
    document.getElementById('imagePreview').src = '';
    document.getElementById('previewContainer').style.display = 'none';
    document.getElementById('dropZone').querySelector('.upload-content').style.display = 'flex';
    document.getElementById('classifyBtn').disabled = true;
    document.getElementById('fileInput').value = '';
    
    document.getElementById('bagImagePreview').src = '';
    document.getElementById('bagPreviewContainer').style.display = 'none';
    document.getElementById('bagUploadContent').style.display = 'flex';
    document.getElementById('checkBagBtn').disabled = true;
    document.getElementById('bagFileInput').value = '';
    
    document.getElementById('submitImagePreview').src = '';
    document.getElementById('submitPreviewContainer').style.display = 'none';
    document.getElementById('submitUploadContent').style.display = 'flex';
    document.getElementById('submitBagBtn').disabled = true;
    document.getElementById('submitFileInput').value = '';
    
    document.getElementById('resultsSection').style.display = 'none';
    document.getElementById('bagResultsSection').style.display = 'none';
    document.getElementById('submitResultsSection').style.display = 'none';
    document.getElementById('bagSubmitSection').style.display = 'none';
    
    document.getElementById('itemScannerSection').style.display = 'block';
    document.getElementById('bagCheckerSection').style.display = 'none';
    
    document.getElementById('itemScannerSteps').style.display = 'flex';
    document.getElementById('bagCheckerSteps').style.display = 'none';
    document.getElementById('bagSubmitSteps').style.display = 'none';
    
    document.querySelectorAll('.user-tabs .tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelector('.user-tabs .tab-btn[data-tab="item-scanner"]').classList.add('active');
    
    document.querySelectorAll('.bag-checker-section .bag-option').forEach(b => b.classList.remove('active'));
    document.querySelector('.bag-checker-section .bag-option[data-bag="green"]').classList.add('active');
    document.querySelectorAll('.submit-bag-options .bag-option').forEach(b => b.classList.remove('active'));
    document.querySelector('.submit-bag-options .bag-option[data-bag="green"]').classList.add('active');
    
    document.getElementById('userName').value = '';
    document.getElementById('houseNumber').value = '';
}

document.getElementById('userAccessBtn').addEventListener('click', () => showView('userLoginView'));
document.getElementById('mgmtAccessBtn').addEventListener('click', () => showView('mgmtLoginView'));
document.getElementById('userCardBtn').addEventListener('click', () => showView('userLoginView'));
document.getElementById('mgmtCardBtn').addEventListener('click', () => showView('mgmtLoginView'));
document.getElementById('userBackBtn').addEventListener('click', () => showView('landingView'));
document.getElementById('mgmtBackBtn').addEventListener('click', () => showView('landingView'));

document.getElementById('userLoginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('userName').value.trim();
    const houseNumber = document.getElementById('houseNumber').value.trim();
    
    try {
        const response = await fetch('/api/user/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, house_number: houseNumber })
        });
        const data = await response.json();
        if (data.error) throw new Error(data.error);
        
        currentUser = data.user;
        isManagement = false;
        resetUserSession();
        showView('userDashboard');
        updateUserDashboard();
    } catch (error) {
        alert('Registration failed: ' + error.message);
    }
});

document.getElementById('mgmtLoginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('mgmtId').value.trim();
    const key = document.getElementById('mgmtKey').value.trim();
    
    try {
        const response = await fetch('/api/management/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id, key })
        });
        const data = await response.json();
        if (data.error) throw new Error(data.error);
        
        isManagement = true;
        showView('mgmtDashboard');
        updateManagementDashboard();
    } catch (error) {
        alert('Login failed: ' + error.message);
    }
});

document.getElementById('userLogout').addEventListener('click', () => {
    currentUser = null;
    resetUserSession();
    showView('landingView');
});

document.getElementById('mgmtLogout').addEventListener('click', () => {
    isManagement = false;
    showView('landingView');
});

async function updateUserDashboard() {
    if (!currentUser) return;
    
    document.getElementById('userDisplayName').textContent = currentUser.name;
    document.getElementById('userDisplayHouse').textContent = currentUser.house_number;
    
    try {
        const response = await fetch(`/api/user/${currentUser.house_number}/stats`);
        const stats = await response.json();
        
        document.getElementById('userPoints').textContent = stats.total_points || 0;
        document.getElementById('weeklyBags').textContent = stats.weekly_bags || 0;
        document.getElementById('weeklyScore').textContent = stats.weekly_avg_score ? stats.weekly_avg_score.toFixed(0) : '--';
        
        const scheduleDisplay = document.getElementById('scheduleDisplay');
        scheduleDisplay.innerHTML = '';
        const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
        days.forEach(day => {
            const bagType = stats.pickup_schedule[day];
            if (bagType) {
                const config = PICKUP_COLORS[bagType];
                const dayEl = document.createElement('div');
                dayEl.className = 'schedule-day';
                dayEl.innerHTML = `<span class="day-name">${day.substring(0, 3)}</span>
                    <span class="day-bag" style="background: ${config.color}">${config.label}</span>`;
                scheduleDisplay.appendChild(dayEl);
            }
        });
        
        const feedbackSection = document.getElementById('feedbackSection');
        const feedbackList = document.getElementById('feedbackList');
        if (stats.management_feedback && stats.management_feedback.length > 0) {
            feedbackSection.style.display = 'block';
            feedbackList.innerHTML = '';
            stats.management_feedback.forEach(fb => {
                const fbEl = document.createElement('div');
                fbEl.className = 'feedback-item';
                const pointClass = fb.point_adjustment > 0 ? 'positive' : fb.point_adjustment < 0 ? 'negative' : '';
                fbEl.innerHTML = `<p>${fb.feedback}</p>
                    ${fb.point_adjustment !== 0 ? `<span class="point-change ${pointClass}">${fb.point_adjustment > 0 ? '+' : ''}${fb.point_adjustment} points</span>` : ''}`;
                feedbackList.appendChild(fbEl);
            });
        } else {
            feedbackSection.style.display = 'none';
        }
    } catch (error) {
        console.error('Failed to load user stats:', error);
    }
}

async function updateManagementDashboard() {
    try {
        const response = await fetch('/api/management/households');
        const households = await response.json();
        
        document.getElementById('totalHouseholds').textContent = households.length;
        
        const totalBags = households.reduce((sum, h) => sum + h.bags_submitted, 0);
        document.getElementById('totalBagsSubmitted').textContent = totalBags;
        
        const householdsWithBags = households.filter(h => h.bags_submitted > 0);
        const avgScore = householdsWithBags.length > 0 
            ? householdsWithBags.reduce((sum, h) => sum + h.avg_score, 0) / householdsWithBags.length 
            : 0;
        document.getElementById('avgOverallScore').textContent = avgScore > 0 ? avgScore.toFixed(0) : '--';
        
        const tbody = document.getElementById('householdTableBody');
        const noDataMsg = document.getElementById('noHouseholdsMsg');
        
        if (households.length === 0) {
            tbody.innerHTML = '';
            noDataMsg.style.display = 'block';
        } else {
            noDataMsg.style.display = 'none';
            tbody.innerHTML = households.map(h => {
                const statusClass = h.status === 'ok' ? 'status-ok' : h.status === 'review' ? 'status-review' : h.status === 'needs_attention' ? 'status-attention' : 'status-nodata';
                const statusText = h.status === 'ok' ? 'OK' : h.status === 'review' ? 'Review' : h.status === 'needs_attention' ? 'Attention' : 'No Data';
                return `<tr>
                    <td>${h.house_number}</td>
                    <td>${h.name}</td>
                    <td>${h.bags_submitted}</td>
                    <td>${h.avg_score > 0 ? h.avg_score.toFixed(0) : '--'}</td>
                    <td><span class="status-badge ${statusClass}">${statusText}</span></td>
                    <td><button class="feedback-btn" data-house="${h.house_number}">Feedback</button></td>
                </tr>`;
            }).join('');
            
            document.querySelectorAll('.feedback-btn').forEach(btn => {
                btn.addEventListener('click', () => openFeedbackModal(btn.dataset.house));
            });
        }
    } catch (error) {
        console.error('Failed to load households:', error);
    }
}

let currentFeedbackHouse = null;

function openFeedbackModal(houseNumber) {
    currentFeedbackHouse = houseNumber;
    document.getElementById('feedbackHouseNum').textContent = houseNumber;
    document.getElementById('feedbackText').value = '';
    document.getElementById('pointAdjustment').value = '0';
    document.getElementById('feedbackModal').style.display = 'flex';
}

document.getElementById('cancelFeedback').addEventListener('click', () => {
    document.getElementById('feedbackModal').style.display = 'none';
});

document.getElementById('feedbackForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const feedback = document.getElementById('feedbackText').value.trim();
    const pointAdjustment = parseInt(document.getElementById('pointAdjustment').value);
    
    try {
        const response = await fetch('/api/management/feedback', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                house_number: currentFeedbackHouse,
                feedback: feedback,
                point_adjustment: pointAdjustment
            })
        });
        const data = await response.json();
        if (data.error) throw new Error(data.error);
        
        document.getElementById('feedbackModal').style.display = 'none';
        updateManagementDashboard();
        alert('Feedback sent successfully!');
    } catch (error) {
        alert('Failed to send feedback: ' + error.message);
    }
});

document.querySelectorAll('.user-tabs .tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.user-tabs .tab-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        
        const tab = btn.dataset.tab;
        
        document.getElementById('itemScannerSection').style.display = tab === 'item-scanner' ? 'block' : 'none';
        document.getElementById('resultsSection').style.display = 'none';
        document.getElementById('bagCheckerSection').style.display = tab === 'bag-checker' ? 'block' : 'none';
        document.getElementById('bagResultsSection').style.display = 'none';
        document.getElementById('bagSubmitSection').style.display = tab === 'bag-submit' ? 'block' : 'none';
        document.getElementById('submitResultsSection').style.display = 'none';
        
        document.getElementById('itemScannerSteps').style.display = tab === 'item-scanner' ? 'flex' : 'none';
        document.getElementById('bagCheckerSteps').style.display = tab === 'bag-checker' ? 'flex' : 'none';
        document.getElementById('bagSubmitSteps').style.display = tab === 'bag-submit' ? 'flex' : 'none';
    });
});

const dropZone = document.getElementById('dropZone');
const fileInput = document.getElementById('fileInput');
const previewContainer = document.getElementById('previewContainer');
const imagePreview = document.getElementById('imagePreview');
const removeBtn = document.getElementById('removeBtn');
const classifyBtn = document.getElementById('classifyBtn');
const loading = document.getElementById('loading');
const resultsSection = document.getElementById('resultsSection');

dropZone.addEventListener('dragover', (e) => { e.preventDefault(); dropZone.classList.add('dragover'); });
dropZone.addEventListener('dragleave', () => { dropZone.classList.remove('dragover'); });
dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZone.classList.remove('dragover');
    if (e.dataTransfer.files.length > 0 && e.dataTransfer.files[0].type.startsWith('image/')) {
        handleFile(e.dataTransfer.files[0]);
    }
});
dropZone.addEventListener('click', (e) => {
    if (e.target !== removeBtn && !removeBtn.contains(e.target) && !selectedFile) {
        fileInput.click();
    }
});
fileInput.addEventListener('change', (e) => {
    if (e.target.files.length > 0) handleFile(e.target.files[0]);
});

function handleFile(file) {
    selectedFile = file;
    const reader = new FileReader();
    reader.onload = (e) => {
        imagePreview.src = e.target.result;
        dropZone.querySelector('.upload-content').style.display = 'none';
        previewContainer.style.display = 'block';
        classifyBtn.disabled = false;
    };
    reader.readAsDataURL(file);
}

removeBtn.addEventListener('click', (e) => { e.stopPropagation(); clearPreview(); });

function clearPreview() {
    selectedFile = null;
    imagePreview.src = '';
    previewContainer.style.display = 'none';
    dropZone.querySelector('.upload-content').style.display = 'flex';
    classifyBtn.disabled = true;
    fileInput.value = '';
}

classifyBtn.addEventListener('click', async () => {
    if (!selectedFile) return;
    loading.classList.add('active');
    classifyBtn.style.display = 'none';
    
    const formData = new FormData();
    formData.append('image', selectedFile);
    
    try {
        const response = await fetch('/classify-image', { method: 'POST', body: formData });
        const data = await response.json();
        if (data.error) throw new Error(data.error);
        displayResults(data);
    } catch (error) {
        alert('Failed to classify image: ' + error.message);
    } finally {
        loading.classList.remove('active');
        classifyBtn.style.display = 'block';
    }
});

function displayResults(data) {
    const binType = data.bin;
    const binConfig = BIN_CONFIG[binType] || BIN_CONFIG.landfill;
    
    document.getElementById('resultCard').className = 'result-card ' + binType;
    document.getElementById('binIcon').textContent = binConfig.icon;
    document.getElementById('itemName').textContent = data.item;
    
    const binName = document.getElementById('binName');
    binName.textContent = binConfig.name;
    binName.className = 'bin-name ' + binType;
    
    document.getElementById('confidenceLabel').textContent = 'Confidence: ' + (data.confidence || 'Medium').charAt(0).toUpperCase() + (data.confidence || 'medium').slice(1);
    document.getElementById('wasteSaved').textContent = formatWeight(data.waste_saved_grams);
    document.getElementById('co2Saved').textContent = formatWeight(data.co2_saved_grams);
    document.getElementById('moneySaved').textContent = formatMoney(data.money_saved_cents);
    
    resultsSection.style.display = 'block';
    resultsSection.scrollIntoView({ behavior: 'smooth' });
}

document.getElementById('newScanBtn').addEventListener('click', () => {
    clearPreview();
    resultsSection.style.display = 'none';
});

const bagDropZone = document.getElementById('bagDropZone');
const bagFileInput = document.getElementById('bagFileInput');
const bagPreviewContainer = document.getElementById('bagPreviewContainer');
const bagImagePreview = document.getElementById('bagImagePreview');
const bagRemoveBtn = document.getElementById('bagRemoveBtn');
const checkBagBtn = document.getElementById('checkBagBtn');
const bagLoading = document.getElementById('bagLoading');
const bagResultsSection = document.getElementById('bagResultsSection');

document.querySelectorAll('.bag-checker-section .bag-option').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.bag-checker-section .bag-option').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        selectedBagType = btn.dataset.bag;
    });
});

bagDropZone.addEventListener('dragover', (e) => { e.preventDefault(); bagDropZone.classList.add('dragover'); });
bagDropZone.addEventListener('dragleave', () => { bagDropZone.classList.remove('dragover'); });
bagDropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    bagDropZone.classList.remove('dragover');
    if (e.dataTransfer.files.length > 0 && e.dataTransfer.files[0].type.startsWith('image/')) {
        handleBagFile(e.dataTransfer.files[0]);
    }
});
bagDropZone.addEventListener('click', (e) => {
    if (e.target !== bagRemoveBtn && !bagRemoveBtn.contains(e.target) && !selectedBagFile) {
        bagFileInput.click();
    }
});
bagFileInput.addEventListener('change', (e) => {
    if (e.target.files.length > 0) handleBagFile(e.target.files[0]);
});

function handleBagFile(file) {
    selectedBagFile = file;
    const reader = new FileReader();
    reader.onload = (e) => {
        bagImagePreview.src = e.target.result;
        document.getElementById('bagUploadContent').style.display = 'none';
        bagPreviewContainer.style.display = 'block';
        checkBagBtn.disabled = false;
    };
    reader.readAsDataURL(file);
}

bagRemoveBtn.addEventListener('click', (e) => { e.stopPropagation(); clearBagPreview(); });

function clearBagPreview() {
    selectedBagFile = null;
    bagImagePreview.src = '';
    bagPreviewContainer.style.display = 'none';
    document.getElementById('bagUploadContent').style.display = 'flex';
    checkBagBtn.disabled = true;
    bagFileInput.value = '';
}

checkBagBtn.addEventListener('click', async () => {
    if (!selectedBagFile) return;
    bagLoading.classList.add('active');
    checkBagBtn.style.display = 'none';
    
    const formData = new FormData();
    formData.append('image', selectedBagFile);
    formData.append('bag_type', selectedBagType);
    
    try {
        const response = await fetch('/check-bag', { method: 'POST', body: formData });
        const data = await response.json();
        if (data.error) throw new Error(data.error);
        displayBagResults(data);
    } catch (error) {
        alert('Failed to analyze bag: ' + error.message);
    } finally {
        bagLoading.classList.remove('active');
        checkBagBtn.style.display = 'block';
    }
});

function displayBagResults(data) {
    document.getElementById('scoreCard').className = 'score-card grade-' + data.grade.toLowerCase();
    document.getElementById('scoreValue').textContent = data.score;
    document.getElementById('gradeBadge').textContent = data.grade;
    
    const verdict = document.getElementById('verdict');
    if (data.is_properly_sorted) {
        verdict.className = 'verdict pass';
        document.getElementById('verdictIcon').innerHTML = '&#10004;';
        document.getElementById('verdictText').textContent = 'Properly Sorted';
    } else {
        verdict.className = 'verdict fail';
        document.getElementById('verdictIcon').innerHTML = '&#10008;';
        document.getElementById('verdictText').textContent = 'Needs Improvement';
    }
    
    const itemsContainer = document.getElementById('itemsDetected');
    itemsContainer.innerHTML = (data.items_detected || []).map(item => `<span class="item-tag">${item}</span>`).join('');
    
    const issuesCard = document.getElementById('issuesCard');
    const issuesList = document.getElementById('issuesList');
    if (data.contamination_issues && data.contamination_issues.length > 0) {
        issuesCard.style.display = 'block';
        issuesList.innerHTML = data.contamination_issues.map(i => `<li>${i}</li>`).join('');
    } else {
        issuesCard.style.display = 'none';
    }
    
    document.getElementById('explanationText').textContent = data.explanation;
    document.getElementById('suggestionsList').innerHTML = (data.suggestions || []).map(s => `<li>${s}</li>`).join('');
    
    const confidenceNotice = document.getElementById('confidenceNotice');
    if (data.confidence === 'low' || data.confidence === 'medium') {
        confidenceNotice.style.display = 'flex';
        document.getElementById('confidenceText').textContent = data.confidence === 'low' ? 'Low Confidence - Image may be unclear' : 'Medium Confidence - Some items may not be visible';
    } else {
        confidenceNotice.style.display = 'none';
    }
    
    bagResultsSection.style.display = 'block';
    bagResultsSection.scrollIntoView({ behavior: 'smooth' });
}

document.getElementById('newBagCheckBtn').addEventListener('click', () => {
    clearBagPreview();
    bagResultsSection.style.display = 'none';
});

const submitDropZone = document.getElementById('submitDropZone');
const submitFileInput = document.getElementById('submitFileInput');
const submitPreviewContainer = document.getElementById('submitPreviewContainer');
const submitImagePreview = document.getElementById('submitImagePreview');
const submitRemoveBtn = document.getElementById('submitRemoveBtn');
const submitBagBtn = document.getElementById('submitBagBtn');
const submitLoading = document.getElementById('submitLoading');
const submitResultsSection = document.getElementById('submitResultsSection');

document.querySelectorAll('.submit-bag-options .bag-option').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.submit-bag-options .bag-option').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        selectedSubmitBagType = btn.dataset.bag;
    });
});

submitDropZone.addEventListener('dragover', (e) => { e.preventDefault(); submitDropZone.classList.add('dragover'); });
submitDropZone.addEventListener('dragleave', () => { submitDropZone.classList.remove('dragover'); });
submitDropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    submitDropZone.classList.remove('dragover');
    if (e.dataTransfer.files.length > 0 && e.dataTransfer.files[0].type.startsWith('image/')) {
        handleSubmitFile(e.dataTransfer.files[0]);
    }
});
submitDropZone.addEventListener('click', (e) => {
    if (e.target !== submitRemoveBtn && !submitRemoveBtn.contains(e.target) && !selectedSubmitFile) {
        submitFileInput.click();
    }
});
submitFileInput.addEventListener('change', (e) => {
    if (e.target.files.length > 0) handleSubmitFile(e.target.files[0]);
});

function handleSubmitFile(file) {
    selectedSubmitFile = file;
    const reader = new FileReader();
    reader.onload = (e) => {
        submitImagePreview.src = e.target.result;
        document.getElementById('submitUploadContent').style.display = 'none';
        submitPreviewContainer.style.display = 'block';
        submitBagBtn.disabled = false;
    };
    reader.readAsDataURL(file);
}

submitRemoveBtn.addEventListener('click', (e) => { e.stopPropagation(); clearSubmitPreview(); });

function clearSubmitPreview() {
    selectedSubmitFile = null;
    submitImagePreview.src = '';
    submitPreviewContainer.style.display = 'none';
    document.getElementById('submitUploadContent').style.display = 'flex';
    submitBagBtn.disabled = true;
    submitFileInput.value = '';
}

submitBagBtn.addEventListener('click', async () => {
    if (!selectedSubmitFile || !currentUser) return;
    submitLoading.classList.add('active');
    submitBagBtn.style.display = 'none';
    
    const formData = new FormData();
    formData.append('image', selectedSubmitFile);
    formData.append('bag_type', selectedSubmitBagType);
    formData.append('house_number', currentUser.house_number);
    
    try {
        const response = await fetch('/api/bag/submit', { method: 'POST', body: formData });
        const data = await response.json();
        if (data.error) throw new Error(data.error);
        displaySubmitResults(data);
        updateUserDashboard();
    } catch (error) {
        alert('Failed to submit bag: ' + error.message);
    } finally {
        submitLoading.classList.remove('active');
        submitBagBtn.style.display = 'block';
    }
});

function displaySubmitResults(data) {
    document.getElementById('pointsEarned').textContent = data.points_earned;
    document.getElementById('submitScoreCard').className = 'score-card grade-' + data.grade.toLowerCase();
    document.getElementById('submitScoreValue').textContent = data.score;
    document.getElementById('submitGradeBadge').textContent = data.grade;
    document.getElementById('submitExplanationText').textContent = data.explanation;
    
    document.getElementById('bagSubmitSection').style.display = 'none';
    submitResultsSection.style.display = 'block';
    submitResultsSection.scrollIntoView({ behavior: 'smooth' });
}

document.getElementById('newSubmitBtn').addEventListener('click', () => {
    clearSubmitPreview();
    submitResultsSection.style.display = 'none';
    document.getElementById('bagSubmitSection').style.display = 'block';
});

function formatWeight(grams) {
    return grams >= 1000 ? (grams / 1000).toFixed(1) + 'kg' : grams + 'g';
}

function formatMoney(cents) {
    return '$' + (cents / 100).toFixed(2);
}

showView('landingView');
