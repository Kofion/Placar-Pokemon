// script.js

// Data structures
let students = JSON.parse(localStorage.getItem('students')) || [];
let activities = JSON.parse(localStorage.getItem('activities')) || [];
let grades = JSON.parse(localStorage.getItem('grades')) || []; // {studentId, activityId, grade}
let editStudentId = null;
let studentSearchValue = '';

// Pokémon evolution data
const evolutions = {
    bulbasaur: { 0: 'bulbasaur', 100: 'ivysaur', 200: 'venusaur' },
    charmander: { 0: 'charmander', 100: 'charmeleon', 200: 'charizard' },
    squirtle: { 0: 'squirtle', 100: 'wartortle', 200: 'blastoise' }
};

// Function to save data
function saveData() {
    localStorage.setItem('students', JSON.stringify(students));
    localStorage.setItem('activities', JSON.stringify(activities));
    localStorage.setItem('grades', JSON.stringify(grades));
}

// Function to render students
function renderStudents() {
    const list = document.getElementById('studentsList');
    list.innerHTML = '';
    const filter = studentSearchValue.trim().toLowerCase();
    const filtered = students
        .filter(student => {
            if (!filter) return true;
            return student.name.toLowerCase().includes(filter) || student.reg.includes(filter);
        })
        .sort((a, b) => a.name.localeCompare(b.name, 'pt-BR', { sensitivity: 'base' }));

    filtered.forEach(student => {
        const totalGrade = getTotalGrade(student.id);
        const evolution = getEvolution(student.pokemon, totalGrade);
        const div = document.createElement('div');
        div.className = 'student';
        div.innerHTML = `
            <div class="student-header">
                <h3>${student.name} (${student.reg})</h3>
                <button class="small-btn" onclick="startEditStudent(${student.id})">Editar</button>                <button class=\"small-btn delete-btn\" onclick=\"deleteStudent(${student.id})\">Excluir</button>            </div>
            <img src="images/${evolution}.png" alt="${evolution}" class="pokemon-img" id="img-${student.id}">
            <div class="student-activities">
                ${activities.map(activity => {
                    const safeName = activity.name.replace(/"/g, '&quot;');
                    const displayName = activity.name;

                    return `
                    <div class="grade-item">
                        <span class="grade-label" title="${safeName}">${displayName}</span>
                        <input type="number" min="0" max="100" value="${getGrade(student.id, activity.id) || ''}" onchange="updateGrade(${student.id}, ${activity.id}, this.value)">
                    </div>
                `;
                }).join('')}
            </div>
            <div class="student-total-wrap">
                <p class="student-total">Total: ${totalGrade}</p>
            </div>
        `;
        list.appendChild(div);
    });
    renderLeaderboard();
}

// Function to get total grade for student
function getTotalGrade(studentId) {
    return grades.filter(g => g.studentId === studentId).reduce((sum, g) => sum + (parseFloat(g.grade) || 0), 0);
}

// Function to get grade for student-activity
function getGrade(studentId, activityId) {
    const g = grades.find(g => g.studentId === studentId && g.activityId === activityId);
    return g ? g.grade : '';
}

// Function to update grade
function updateGrade(studentId, activityId, grade) {
    const existing = grades.findIndex(g => g.studentId === studentId && g.activityId === activityId);
    if (existing >= 0) {
        grades[existing].grade = grade;
    } else {
        grades.push({ studentId, activityId, grade });
    }
    saveData();
    renderStudents();
}

function showMessage(text, type = 'success') {
    const toast = document.getElementById('toast');
    toast.textContent = text;
    toast.className = `toast show ${type}`;
    setTimeout(() => {
        toast.className = 'toast';
    }, 2800);
}

// Function to get evolution
function getEvolution(pokemon, total) {
    const levels = Object.keys(evolutions[pokemon]).map(Number).sort((a,b)=>b-a);
    for (let level of levels) {
        if (total >= level) return evolutions[pokemon][level];
    }
    return evolutions[pokemon][0];
}

// Function to render activities
function renderActivities() {
    const list = document.getElementById('activitiesList');
    list.innerHTML = '';
    list.className = 'scrollable-list activity-grid';
    activities.forEach(activity => {
        const div = document.createElement('div');
        const safeName = activity.name.replace(/"/g, '&quot;');
        const displayName = activity.name;

        div.className = 'activity-item';
        div.innerHTML = `
            <div class="activity-card">
                <span class="activity-name" title="${safeName}">${displayName}</span>
            </div>
            <div class="activity-actions">
                <button class="small-btn" onclick="editActivity(${activity.id})">Editar</button>
                <button class="small-btn delete-btn" onclick="deleteActivity(${activity.id})">Excluir</button>
            </div>
        `;
        list.appendChild(div);
    });
}

// Function to edit activity
function startEditStudent(id) {
    const student = students.find(s => s.id === id);
    if (!student) return;
    editStudentId = id;
    document.getElementById('studentName').value = student.name;
    document.getElementById('studentReg').value = student.reg;
    document.getElementById('studentPokemon').value = student.pokemon;
    document.getElementById('studentForm').querySelector('button').textContent = 'Atualizar';
    document.getElementById('studentFormTitle').textContent = 'Editar Aluno';
    document.getElementById('student-section').scrollIntoView({ behavior: 'smooth', block: 'start' });
    showMessage('Modo edição de aluno ativado', 'success');
}

function resetStudentForm() {
    editStudentId = null;
    document.getElementById('studentForm').reset();
    document.getElementById('studentForm').querySelector('button').textContent = 'Cadastrar';
    document.getElementById('studentFormTitle').textContent = 'Cadastrar Aluno';
}

// Function to delete student
function deleteStudent(id) {
    if (confirm('Tem certeza que deseja excluir este aluno?')) {
        students = students.filter(s => s.id !== id);
        grades = grades.filter(g => g.studentId !== id);
        saveData();
        renderStudents();
        showMessage('Aluno excluído com sucesso!', 'success');
    }
}

function editActivity(id) {
    const activity = activities.find(a => a.id === id);
    const newName = prompt('Novo nome:', activity.name);
    if (newName) {
        activity.name = newName;
        saveData();
        renderActivities();
        renderStudents();
        showMessage('Atividade editada com sucesso!', 'success');
    }
}

// Function to delete activity
function deleteActivity(id) {
    activities = activities.filter(a => a.id !== id);
    grades = grades.filter(g => g.activityId !== id);
    saveData();
    renderActivities();
    renderStudents();
}

// Function to render leaderboard
function renderLeaderboard() {
    const sorted = students.map(s => ({ ...s, total: getTotalGrade(s.id) })).filter(s => s.total > 0).sort((a,b)=>b.total-a.total);
    const top3 = sorted.slice(0,3);
    const lb = document.getElementById('leaderboard');
    lb.innerHTML = top3.map(s => `<div class="leaderboard-item"><span class="leaderboard-name">${s.name} (${s.reg})</span><span class="leaderboard-score">${s.total}</span></div>`).join('');

    // Top 3 per pokemon
    const topBulb = sorted.filter(s => s.pokemon === 'bulbasaur').slice(0,3);
    document.getElementById('topBulbasaur').innerHTML = topBulb.map(s => `<div class="leaderboard-item"><span class="leaderboard-name">${s.name} (${s.reg})</span><span class="leaderboard-score">${s.total}</span></div>`).join('');

    const topChar = sorted.filter(s => s.pokemon === 'charmander').slice(0,3);
    document.getElementById('topCharmander').innerHTML = topChar.map(s => `<div class="leaderboard-item"><span class="leaderboard-name">${s.name} (${s.reg})</span><span class="leaderboard-score">${s.total}</span></div>`).join('');

    const topSquirt = sorted.filter(s => s.pokemon === 'squirtle').slice(0,3);
    document.getElementById('topSquirtle').innerHTML = topSquirt.map(s => `<div class="leaderboard-item"><span class="leaderboard-name">${s.name} (${s.reg})</span><span class="leaderboard-score">${s.total}</span></div>`).join('');
}

// Event listeners
document.getElementById('studentForm').addEventListener('submit', e => {
    e.preventDefault();
    const name = document.getElementById('studentName').value.trim();
    const reg = document.getElementById('studentReg').value.trim();
    const pokemon = document.getElementById('studentPokemon').value;

    const nameRegex = /^[A-Za-zÀ-ÿ ]+$/u;
    const regRegex = /^\d{7}$/;

    if (!nameRegex.test(name)) {
        showMessage('Nome do aluno deve conter apenas letras e espaços.', 'error');
        return;
    }
    if (!regRegex.test(reg)) {
        showMessage('Matrícula deve conter exatamente 7 dígitos numéricos.', 'error');
        return;
    }

    const exists = students.some(s => s.reg === reg && s.id !== editStudentId);
    if (exists) {
        showMessage('Matrícula já existe!', 'error');
        return;
    }

    if (editStudentId) {
        const student = students.find(s => s.id === editStudentId);
        student.name = name;
        student.reg = reg;
        student.pokemon = pokemon;
        saveData();
        renderStudents();
        resetStudentForm();
        showMessage('Aluno atualizado com sucesso!', 'success');
        return;
    }

    const id = Date.now();
    students.push({ id, name, reg, pokemon });
    saveData();
    renderStudents();
    e.target.reset();
    showMessage('Aluno cadastrado com sucesso!', 'success');
});

document.getElementById('studentSearch').addEventListener('input', e => {
    studentSearchValue = e.target.value;
    renderStudents();
});

document.getElementById('activityForm').addEventListener('submit', e => {
    e.preventDefault();
    const name = document.getElementById('activityName').value.trim();
    const exists = activities.some(a => a.name.toLowerCase() === name.toLowerCase());
    if (exists) {
        showMessage('Já existe uma atividade com este nome!', 'error');
        return;
    }
    const id = Date.now();
    activities.push({ id, name });
    saveData();
    renderActivities();
    renderStudents();
    e.target.reset();
    showMessage('Atividade cadastrada com sucesso!', 'success');
});

// Export CSV
document.getElementById('exportBtn').addEventListener('click', () => {
    const csv = generateCSV();
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'data.csv';
    a.click();
    showMessage('CSV exportado com sucesso!', 'success');
});

// Import CSV file change handler
document.getElementById('importFile').addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
        importCSVFile(file);
    }
});

// Drag and drop handlers
const dropZone = document.getElementById('dropZone');

dropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    e.stopPropagation();
    dropZone.classList.add('dragover');
});

dropZone.addEventListener('dragleave', (e) => {
    e.preventDefault();
    e.stopPropagation();
    dropZone.classList.remove('dragover');
});

dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    e.stopPropagation();
    dropZone.classList.remove('dragover');
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
        const file = files[0];
        if (file.type === 'text/csv' || file.name.endsWith('.csv')) {
            importCSVFile(file);
        } else {
            showMessage('Por favor, selecione um arquivo CSV válido!', 'error');
        }
    }
});

// Function to import CSV file
function importCSVFile(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            parseCSV(e.target.result);
            saveData();
            renderStudents();
            renderActivities();
            showMessage('CSV importado com sucesso!', 'success');
            closeModal();
        } catch (error) {
            showMessage('Erro ao importar CSV!', 'error');
        }
    };
    reader.readAsText(file);
}

// Modal functions
function openModal() {
    const modal = document.getElementById('exportImportModal');
    modal.classList.add('open');
}

function closeModal() {
    const modal = document.getElementById('exportImportModal');
    modal.classList.remove('open');
}

// Close modal when clicking outside the content
window.addEventListener('click', (e) => {
    const modal = document.getElementById('exportImportModal');
    if (e.target === modal) {
        closeModal();
    }
});

// Generate CSV (simple format)
function generateCSV() {
    let csv = 'students\n';
    students.forEach(s => csv += `${s.id},${s.name},${s.reg},${s.pokemon}\n`);
    csv += '\nactivities\n';
    activities.forEach(a => csv += `${a.id},${a.name}\n`);
    csv += '\ngrades\n';
    grades.forEach(g => csv += `${g.studentId},${g.activityId},${g.grade}\n`);
    return csv;
}

// Parse CSV
function parseCSV(csv) {
    const sections = csv.split('\n\n');
    students = sections[0].split('\n').slice(1).filter(l=>l).map(l => {
        const [id, name, reg, pokemon] = l.split(',');
        return { id: +id, name, reg, pokemon };
    });
    activities = sections[1].split('\n').slice(1).filter(l=>l).map(l => {
        const [id, name] = l.split(',');
        return { id: +id, name };
    });
    grades = sections[2].split('\n').slice(1).filter(l=>l).map(l => {
        const [studentId, activityId, grade] = l.split(',');
        return { studentId: +studentId, activityId: +activityId, grade };
    });
}

// Initial render
renderStudents();
renderActivities();