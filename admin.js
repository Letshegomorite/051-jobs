const STORAGE_KEYS = {
    jobs: '051_jobs_data',
    bursaries: '051_bursaries_data',
    courses: '051_courses_data'
};

const ADMIN_CREDENTIALS = {
    username: 'admin',
    password: '59862010'
};

let state = {
    jobs: [],
    bursaries: [],
    courses: [],
    defaults: { jobs: [], bursaries: [], courses: [] },
    activeCollection: 'jobs'
};

function safeArray(value) {
    return Array.isArray(value) ? value : [];
}

function safeText(value, fallback = '') {
    return typeof value === 'string' || typeof value === 'number' ? String(value) : fallback;
}

function showMessage(text, isError = false) {
    const el = document.getElementById('adminMessage');
    if (!el) return;
    el.textContent = text;
    el.className = `mt-4 text-sm ${isError ? 'text-red-400' : 'text-slate-300'}`;
}

function persist() {
    localStorage.setItem(STORAGE_KEYS.jobs, JSON.stringify(state.jobs));
    localStorage.setItem(STORAGE_KEYS.bursaries, JSON.stringify(state.bursaries));
    localStorage.setItem(STORAGE_KEYS.courses, JSON.stringify(state.courses));
}

function nextIdFor(collection) {
    const maxId = safeArray(collection).reduce((max, item) => {
        const asNumber = Number(item?.id);
        return Number.isFinite(asNumber) ? Math.max(max, asNumber) : max;
    }, 0);
    return maxId + 1;
}

function readStorageOrDefault(key, fallback) {
    try {
        const raw = localStorage.getItem(key);
        if (!raw) return fallback;
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed : fallback;
    } catch (error) {
        console.error(`Failed to read key ${key}`, error);
        return fallback;
    }
}

async function loadDefaults() {
    const [jobs, bursaries, courses] = await Promise.all([
        fetch('jobs.json').then(r => r.json()),
        fetch('bursaries.json').then(r => r.json()),
        fetch('courses.json').then(r => r.json())
    ]);

    state.defaults.jobs = safeArray(jobs);
    state.defaults.bursaries = safeArray(bursaries);
    state.defaults.courses = safeArray(courses);

    state.jobs = readStorageOrDefault(STORAGE_KEYS.jobs, state.defaults.jobs);
    state.bursaries = readStorageOrDefault(STORAGE_KEYS.bursaries, state.defaults.bursaries);
    state.courses = readStorageOrDefault(STORAGE_KEYS.courses, state.defaults.courses);

    persist();
}

function parseDate(value) {
    if (!value) return null;
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function isExpiredClosingDate(value) {
    const date = parseDate(value);
    if (!date) return false;
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    return date < today;
}

function formatDate(value) {
    const parsed = parseDate(value);
    if (!parsed) return '—';
    return parsed.toLocaleDateString('en-ZA', { year: 'numeric', month: 'short', day: 'numeric' });
}

function getCollectionMeta(name) {
    if (name === 'bursaries') return { orgKey: 'provider', typeKey: 'level', closingKey: 'deadline' };
    if (name === 'courses') return { orgKey: 'institution', typeKey: 'mode', closingKey: 'duration' };
    return { orgKey: 'company', typeKey: 'type', closingKey: 'closingDate' };
}

function renderStats() {
    const target = document.getElementById('statsCards');
    if (!target) return;

    const expiredJobsCount = state.jobs.filter(job => isExpiredClosingDate(job?.closingDate)).length;
    const cards = [
        { label: 'Jobs', value: state.jobs.length, icon: 'fa-briefcase' },
        { label: 'Bursaries', value: state.bursaries.length, icon: 'fa-graduation-cap' },
        { label: 'Courses', value: state.courses.length, icon: 'fa-book-open' },
        { label: 'Expired Jobs', value: expiredJobsCount, icon: 'fa-clock', danger: expiredJobsCount > 0 }
    ];

    target.innerHTML = cards.map(card => `
        <div class="site-card p-5">
            <p class="text-sm text-slate-400 flex items-center gap-2"><i class="fa-solid ${card.icon}"></i>${card.label}</p>
            <p class="text-3xl mt-2 font-semibold ${card.danger ? 'text-red-400' : 'text-slate-100'}">${card.value}</p>
        </div>
    `).join('');
}

function renderExpiredJobs() {
    const target = document.getElementById('expiredJobsList');
    if (!target) return;

    const expiredJobs = state.jobs.filter(job => isExpiredClosingDate(job?.closingDate));
    if (!expiredJobs.length) {
        target.innerHTML = '<p class="text-sm text-slate-400">No expired jobs. Great, your listings are fresh.</p>';
        return;
    }

    target.innerHTML = expiredJobs.map(job => `
        <div class="bg-slate-950 border border-slate-700 rounded-2xl p-4 flex items-center justify-between gap-4">
            <div>
                <p class="font-semibold text-slate-100">${safeText(job?.title, 'Untitled job')}</p>
                <p class="text-xs text-slate-400 mt-1">${safeText(job?.company, 'Unknown company')} • Closed ${formatDate(job?.closingDate)}</p>
            </div>
            <button class="text-sm text-red-400 border border-red-400/40 px-3 py-2 rounded-xl" onclick="deleteJob('${String(job?.id).replace(/'/g, "\\'")}')">Delete</button>
        </div>
    `).join('');
}

function renderCollectionTabs() {
    const tabs = document.querySelectorAll('.collection-tab');
    tabs.forEach(tab => {
        const isActive = tab.dataset.collection === state.activeCollection;
        tab.className = `collection-tab border px-4 py-2 rounded-xl text-sm ${isActive ? 'bg-blue-700 text-white border-blue-700' : 'bg-slate-900 text-slate-200 border-slate-700'}`;
    });
}

function renderContentTable() {
    const tbody = document.getElementById('jobsAdminTable');
    if (!tbody) return;

    const collectionName = state.activeCollection;
    const collection = state[collectionName] || [];
    const meta = getCollectionMeta(collectionName);

    tbody.innerHTML = collection.map(item => {
        const isExpiredJob = collectionName === 'jobs' && isExpiredClosingDate(item?.closingDate);
        const closingValue = safeText(item?.[meta.closingKey]);
        return `
            <tr class="border-b border-slate-800 align-top ${isExpiredJob ? 'bg-red-950/20' : ''}">
                <td class="py-2 pr-3">${safeText(item?.title)}</td>
                <td class="py-2 pr-3">${safeText(item?.[meta.orgKey], '—')}</td>
                <td class="py-2 pr-3">${safeText(item?.[meta.typeKey], '—')}</td>
                <td class="py-2 pr-3 ${isExpiredJob ? 'text-red-300 font-medium' : ''}">${collectionName === 'jobs' ? formatDate(closingValue) : safeText(closingValue, '—')}</td>
                <td class="py-2 whitespace-nowrap">
                    ${collectionName === 'jobs' ? `<button class="text-blue-300 mr-3" onclick="editJob('${String(item?.id).replace(/'/g, "\\'")}')">Edit</button>` : ''}
                    <button class="text-red-400" onclick="deleteCollectionItem('${collectionName}','${String(item?.id).replace(/'/g, "\\'")}')">Delete</button>
                </td>
            </tr>
        `;
    }).join('') || '<tr><td colspan="5" class="py-4 text-slate-400">No listings found for this section.</td></tr>';
}

function refreshAdminView() {
    renderStats();
    renderExpiredJobs();
    renderCollectionTabs();
    renderContentTable();
}

function resetJobForm() {
    document.getElementById('jobForm')?.reset();
    const idField = document.getElementById('jobId');
    if (idField) idField.value = '';
}

function editJob(id) {
    const match = state.jobs.find(job => String(job?.id) === String(id));
    if (!match) return;

    document.getElementById('jobId').value = match.id ?? '';
    document.getElementById('jobTitle').value = match.title ?? '';
    document.getElementById('jobCompany').value = match.company ?? '';
    document.getElementById('jobLocation').value = match.location ?? '';
    document.getElementById('jobType').value = match.type ?? '';
    document.getElementById('jobSalary').value = match.salary ?? '';
    document.getElementById('jobClosingDate').value = match.closingDate ?? '';
    document.getElementById('jobLink').value = match.link ?? '';
    document.getElementById('jobDescription').value = match.description ?? '';
    document.getElementById('jobRequirements').value = safeArray(match.requirements).join(', ');

    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function deleteCollectionItem(collectionName, id) {
    const current = safeArray(state[collectionName]);
    const before = current.length;
    state[collectionName] = current.filter(item => String(item?.id) !== String(id));

    if (state[collectionName].length === before) {
        showMessage('Item not found.', true);
        return;
    }

    persist();
    refreshAdminView();
    showMessage(`${collectionName.slice(0, -1)} deleted successfully.`);
}

function deleteJob(id) {
    deleteCollectionItem('jobs', id);
}

function deleteAllExpiredJobs() {
    const before = state.jobs.length;
    state.jobs = state.jobs.filter(job => !isExpiredClosingDate(job?.closingDate));
    const removed = before - state.jobs.length;

    if (!removed) {
        showMessage('No expired jobs to delete.');
        return;
    }

    persist();
    refreshAdminView();
    showMessage(`${removed} expired job${removed > 1 ? 's were' : ' was'} removed.`);
}

function collectJobFormData() {
    const requirements = (document.getElementById('jobRequirements').value || '')
        .split(',')
        .map(item => item.trim())
        .filter(Boolean);

    return {
        id: document.getElementById('jobId').value || nextIdFor(state.jobs),
        title: document.getElementById('jobTitle').value.trim(),
        company: document.getElementById('jobCompany').value.trim(),
        location: document.getElementById('jobLocation').value.trim(),
        type: document.getElementById('jobType').value.trim(),
        salary: document.getElementById('jobSalary').value.trim(),
        closingDate: document.getElementById('jobClosingDate').value,
        description: document.getElementById('jobDescription').value.trim(),
        requirements,
        link: document.getElementById('jobLink').value.trim()
    };
}

function onSaveJob(event) {
    event.preventDefault();

    const payload = collectJobFormData();
    if (!payload.title || !payload.company) {
        showMessage('Job title and company are required.', true);
        return;
    }

    const idx = state.jobs.findIndex(job => String(job?.id) === String(payload.id));
    if (idx >= 0) {
        state.jobs[idx] = payload;
        showMessage('Job updated successfully.');
    } else {
        state.jobs.unshift(payload);
        showMessage('Job added successfully.');
    }

    persist();
    refreshAdminView();
    resetJobForm();
}

function onSaveBursary(event) {
    event.preventDefault();
    const title = document.getElementById('bursaryTitle').value.trim();
    const provider = document.getElementById('bursaryProvider').value.trim();

    if (!title || !provider) {
        showMessage('Bursary title and provider are required.', true);
        return;
    }

    state.bursaries.unshift({
        id: nextIdFor(state.bursaries),
        title,
        provider,
        level: document.getElementById('bursaryLevel').value.trim(),
        deadline: document.getElementById('bursaryDeadline').value.trim(),
        link: document.getElementById('bursaryLink').value.trim(),
        description: document.getElementById('bursaryDescription').value.trim()
    });

    persist();
    refreshAdminView();
    document.getElementById('bursaryForm').reset();
    showMessage('Bursary added successfully.');
}

function onSaveCourse(event) {
    event.preventDefault();
    const title = document.getElementById('courseTitle').value.trim();
    const institution = document.getElementById('courseInstitution').value.trim();

    if (!title || !institution) {
        showMessage('Course title and institution are required.', true);
        return;
    }

    state.courses.unshift({
        id: nextIdFor(state.courses),
        title,
        institution,
        mode: document.getElementById('courseMode').value.trim(),
        duration: document.getElementById('courseDuration').value.trim(),
        link: document.getElementById('courseLink').value.trim(),
        description: document.getElementById('courseDescription').value.trim()
    });

    persist();
    refreshAdminView();
    document.getElementById('courseForm').reset();
    showMessage('Course added successfully.');
}

function importJson() {
    const input = document.getElementById('importFile');
    const target = document.getElementById('importTarget')?.value || 'all';
    const file = input?.files?.[0];
    if (!file) {
        showMessage('Select a JSON file to upload.', true);
        return;
    }

    const reader = new FileReader();
    reader.onload = () => {
        try {
            const parsed = JSON.parse(String(reader.result || ''));

            if (target === 'all') {
                if (Array.isArray(parsed)) {
                    state.jobs = parsed;
                } else if (parsed && typeof parsed === 'object') {
                    if (Array.isArray(parsed.jobs)) state.jobs = parsed.jobs;
                    if (Array.isArray(parsed.bursaries)) state.bursaries = parsed.bursaries;
                    if (Array.isArray(parsed.courses)) state.courses = parsed.courses;
                } else {
                    throw new Error('Invalid JSON format.');
                }
            } else {
                let collectionData = parsed;
                if (parsed && typeof parsed === 'object' && !Array.isArray(parsed) && Array.isArray(parsed[target])) {
                    collectionData = parsed[target];
                }
                if (!Array.isArray(collectionData)) throw new Error('Expected an array for selected upload target.');
                state[target] = collectionData;
                state.activeCollection = target;
            }

            persist();
            refreshAdminView();
            showMessage(`Upload completed for ${target === 'all' ? 'all sections' : target}.`);
            input.value = '';
        } catch (error) {
            console.error('Import error', error);
            showMessage('Failed to upload JSON. Check file format.', true);
        }
    };

    reader.readAsText(file);
}

function exportJson() {
    const data = {
        jobs: state.jobs,
        bursaries: state.bursaries,
        courses: state.courses
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = '051-jobs-data.json';
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);

    showMessage('JSON exported successfully.');
}

function resetAllData() {
    state.jobs = [...state.defaults.jobs];
    state.bursaries = [...state.defaults.bursaries];
    state.courses = [...state.defaults.courses];
    persist();
    refreshAdminView();
    resetJobForm();
    showMessage('Data reset to default JSON files.');
}

function setupCollectionTabs() {
    const tabs = document.querySelectorAll('.collection-tab');
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            state.activeCollection = tab.dataset.collection || 'jobs';
            refreshAdminView();
        });
    });
}

function setAuthenticatedUI(isAuthenticated) {
    const content = document.getElementById('adminContent');
    const panel = document.getElementById('adminLoginPanel');
    if (content) content.classList.toggle('hidden', !isAuthenticated);
    if (panel) panel.classList.toggle('hidden', isAuthenticated);
}

function onAdminLogin(event) {
    event.preventDefault();
    const username = document.getElementById('adminUsername')?.value?.trim();
    const password = document.getElementById('adminPassword')?.value;
    const loginMessage = document.getElementById('adminLoginMessage');

    if (username !== ADMIN_CREDENTIALS.username || password !== ADMIN_CREDENTIALS.password) {
        if (loginMessage) loginMessage.classList.remove('hidden');
        return;
    }

    if (loginMessage) loginMessage.classList.add('hidden');
    setAuthenticatedUI(true);
    showMessage('Signed in successfully.');
}

async function startAdmin() {
    try {
        await loadDefaults();
        setupCollectionTabs();
        refreshAdminView();

        document.getElementById('jobForm')?.addEventListener('submit', onSaveJob);
        document.getElementById('bursaryForm')?.addEventListener('submit', onSaveBursary);
        document.getElementById('courseForm')?.addEventListener('submit', onSaveCourse);
        document.getElementById('adminLoginForm')?.addEventListener('submit', onAdminLogin);

        setAuthenticatedUI(false);
    } catch (error) {
        console.error('Admin startup failed', error);
        showMessage('Failed to initialize admin panel.', true);
    }
}

window.addEventListener('DOMContentLoaded', startAdmin);
