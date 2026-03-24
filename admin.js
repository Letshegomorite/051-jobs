const STORAGE_KEYS = {
    jobs: '051_jobs_data',
    bursaries: '051_bursaries_data',
    courses: '051_courses_data'
};

let state = {
    jobs: [],
    bursaries: [],
    courses: [],
    defaults: { jobs: [], bursaries: [], courses: [] }
};

function safeArray(value) {
    return Array.isArray(value) ? value : [];
}

function showMessage(text, isError = false) {
    const el = document.getElementById('adminMessage');
    if (!el) return;
    el.textContent = text;
    el.className = `mt-4 text-sm ${isError ? 'text-red-600' : 'text-gray-600'}`;
}

function persist() {
    localStorage.setItem(STORAGE_KEYS.jobs, JSON.stringify(state.jobs));
    localStorage.setItem(STORAGE_KEYS.bursaries, JSON.stringify(state.bursaries));
    localStorage.setItem(STORAGE_KEYS.courses, JSON.stringify(state.courses));
}

function nextJobId() {
    const maxId = state.jobs.reduce((max, job) => {
        const asNumber = Number(job?.id);
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

function renderJobsTable() {
    const tbody = document.getElementById('jobsAdminTable');
    if (!tbody) return;

    tbody.innerHTML = state.jobs.map(job => `
        <tr class="border-b align-top">
            <td class="py-2 pr-3">${job?.title || ''}</td>
            <td class="py-2 pr-3">${job?.company || ''}</td>
            <td class="py-2 pr-3">${job?.type || ''}</td>
            <td class="py-2 whitespace-nowrap">
                <button class="text-[#00d4ff] mr-3" onclick="editJob('${String(job?.id).replace(/'/g, "\\'")}')">Edit</button>
                <button class="text-red-600" onclick="deleteJob('${String(job?.id).replace(/'/g, "\\'")}')">Delete</button>
            </td>
        </tr>
    `).join('');
}

function resetJobForm() {
    document.getElementById('jobForm').reset();
    document.getElementById('jobId').value = '';
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
    document.getElementById('jobLink').value = match.link ?? '';
    document.getElementById('jobDescription').value = match.description ?? '';
    document.getElementById('jobRequirements').value = safeArray(match.requirements).join(', ');

    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function deleteJob(id) {
    const before = state.jobs.length;
    state.jobs = state.jobs.filter(job => String(job?.id) !== String(id));
    if (state.jobs.length === before) {
        showMessage('Job not found.', true);
        return;
    }

    persist();
    renderJobsTable();
    showMessage('Job deleted successfully.');
}

function collectJobFormData() {
    const requirements = (document.getElementById('jobRequirements').value || '')
        .split(',')
        .map(item => item.trim())
        .filter(Boolean);

    return {
        id: document.getElementById('jobId').value || nextJobId(),
        title: document.getElementById('jobTitle').value.trim(),
        company: document.getElementById('jobCompany').value.trim(),
        location: document.getElementById('jobLocation').value.trim(),
        type: document.getElementById('jobType').value.trim(),
        salary: document.getElementById('jobSalary').value.trim(),
        description: document.getElementById('jobDescription').value.trim(),
        requirements,
        link: document.getElementById('jobLink').value.trim()
    };
}

function onSaveJob(event) {
    event.preventDefault();

    const payload = collectJobFormData();
    if (!payload.title || !payload.company) {
        showMessage('Title and company are required.', true);
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
    renderJobsTable();
    resetJobForm();
}

function importJson() {
    const input = document.getElementById('importFile');
    const file = input?.files?.[0];
    if (!file) {
        showMessage('Select a JSON file to import.', true);
        return;
    }

    const reader = new FileReader();
    reader.onload = () => {
        try {
            const parsed = JSON.parse(String(reader.result || ''));
            if (Array.isArray(parsed)) {
                state.jobs = parsed;
            } else if (parsed && typeof parsed === 'object') {
                if (Array.isArray(parsed.jobs)) state.jobs = parsed.jobs;
                if (Array.isArray(parsed.bursaries)) state.bursaries = parsed.bursaries;
                if (Array.isArray(parsed.courses)) state.courses = parsed.courses;
            } else {
                throw new Error('Invalid JSON format.');
            }

            persist();
            renderJobsTable();
            showMessage('JSON imported successfully.');
            input.value = '';
        } catch (error) {
            console.error('Import error', error);
            showMessage('Failed to import JSON. Check file format.', true);
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
    renderJobsTable();
    resetJobForm();
    showMessage('Data reset to default JSON files.');
}

async function startAdmin() {
    try {
        await loadDefaults();
        renderJobsTable();
        document.getElementById('jobForm').addEventListener('submit', onSaveJob);
    } catch (error) {
        console.error('Admin startup failed', error);
        showMessage('Failed to initialize admin panel.', true);
    }
}

window.addEventListener('DOMContentLoaded', startAdmin);
