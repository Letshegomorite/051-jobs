/* 051 Jobs – AdSense Readiness Version */

let JOBS = [];
let BURSARIES = [];
let COURSES = [];

const STORAGE_KEYS = {
    jobs: '051_jobs_data',
    bursaries: '051_bursaries_data',
    courses: '051_courses_data'
};

const FALLBACK_APPLY_LINK = '#';

function safeArray(value) {
    return Array.isArray(value) ? value : [];
}

function safeText(value, fallback = '') {
    return typeof value === 'string' || typeof value === 'number' ? String(value) : fallback;
}

function normalizeId(value) {
    return String(value ?? '').trim();
}

function getSearchParam(name) {
    const params = new URLSearchParams(window.location.search || '');
    return params.get(name) || '';
}

function debounce(func, delay = 300) {
    let timeout;
    return (...args) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => func(...args), delay);
    };
}

function persistData() {
    try {
        localStorage.setItem(STORAGE_KEYS.jobs, JSON.stringify(safeArray(JOBS)));
        localStorage.setItem(STORAGE_KEYS.bursaries, JSON.stringify(safeArray(BURSARIES)));
        localStorage.setItem(STORAGE_KEYS.courses, JSON.stringify(safeArray(COURSES)));
    } catch (error) {
        console.error('Failed to persist data:', error);
    }
}

function readStorage(key) {
    try {
        const raw = localStorage.getItem(key);
        if (!raw) return null;
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed : null;
    } catch (error) {
        console.error(`Failed to parse localStorage key ${key}:`, error);
        return null;
    }
}

async function fetchJson(path) {
    const response = await fetch(path);
    if (!response.ok) throw new Error(`${path} failed with status ${response.status}`);
    const parsed = await response.json();
    return Array.isArray(parsed) ? parsed : [];
}

async function loadData() {
    try {
        const [jobsFallback, bursariesFallback, coursesFallback] = await Promise.all([
            fetchJson('jobs.json'),
            fetchJson('bursaries.json'),
            fetchJson('courses.json')
        ]);

        JOBS = readStorage(STORAGE_KEYS.jobs) || jobsFallback;
        BURSARIES = readStorage(STORAGE_KEYS.bursaries) || bursariesFallback;
        COURSES = readStorage(STORAGE_KEYS.courses) || coursesFallback;

        persistData();
    } catch (error) {
        console.error('Load error:', error);
        JOBS = safeArray(readStorage(STORAGE_KEYS.jobs));
        BURSARIES = safeArray(readStorage(STORAGE_KEYS.bursaries));
        COURSES = safeArray(readStorage(STORAGE_KEYS.courses));
    }
}

function createCard(item, type) {
    const id = encodeURIComponent(normalizeId(item?.id));
    const companyLike = safeText(item?.company || item?.provider || item?.institution, 'Unknown');
    const typeLike = safeText(item?.type || item?.level || item?.mode, 'Open');
    const title = safeText(item?.title, 'Untitled listing');
    const value = safeText(item?.salary || item?.amount || item?.fee);
    const description = safeText(item?.description, 'No description available.');
    const safeDescription = description.length > 160 ? `${description.slice(0, 160)}...` : description;

    return `
    <a href="${type}.html?id=${id}" class="card-hover bg-white border rounded-3xl overflow-hidden flex flex-col h-full">
        <div class="p-6">
            <div class="flex justify-between items-start gap-3">
                <div class="font-semibold text-lg">${companyLike}</div>
                <span class="text-xs px-3 py-1 bg-[#00d4ff]/10 text-[#00d4ff] rounded-3xl whitespace-nowrap">${typeLike}</span>
            </div>

            <h3 class="mt-4 text-xl font-medium leading-tight">${title}</h3>

            ${value ? `<p class="mt-3 text-[#00d4ff] font-semibold">${value}</p>` : ''}

            <p class="mt-4 text-sm text-gray-600 line-clamp-3">${safeDescription}</p>
        </div>

        <div class="mt-auto px-6 py-4 border-t text-xs flex justify-between text-[#00d4ff]">
            <span>View Details & Apply</span>
            <i class="fa-solid fa-arrow-right"></i>
        </div>
    </a>`;
}

function setHtml(id, html) {
    const el = document.getElementById(id);
    if (el) el.innerHTML = html;
}

function setText(id, text) {
    const el = document.getElementById(id);
    if (el) el.textContent = text;
}

function performGlobalSearch() {
    const query = document.getElementById('globalSearchInput')?.value?.trim() || '';
    if (query) window.location.href = `jobs.html?search=${encodeURIComponent(query)}`;
}

function setMeta(title, description) {
    if (title) document.title = title;
    const meta = document.querySelector('meta[name="description"]');
    if (meta && description) meta.setAttribute('content', description);
}

const PAGE_SIZE = 9;

const jobFilters = { search: '', types: [], locations: [], page: 1 };
const bursaryFilters = { search: '', levels: [], page: 1 };
const courseFilters = { search: '', modes: [], page: 1 };

function uniqueValues(items, key) {
    return [...new Set(safeArray(items).map(item => safeText(item?.[key]).trim()).filter(Boolean))];
}

function normalizeSearchInput(inputId, fallback = '') {
    const direct = document.getElementById(inputId)?.value;
    return safeText(direct ?? fallback).toLowerCase().trim();
}

function renderCheckboxFilters(containerId, values, selectedValues, onToggle) {
    const container = document.getElementById(containerId);
    if (!container) return;

    container.innerHTML = values.map(value => {
        const checked = selectedValues.includes(value) ? 'checked' : '';
        return `
            <label class="flex items-center gap-2 text-sm text-gray-700">
                <input type="checkbox" class="accent-[#00d4ff]" value="${value}" ${checked}
                    onchange="${onToggle}(this.value, this.checked)">
                <span>${value}</span>
            </label>`;
    }).join('');
}

function paginate(items, page) {
    const totalPages = Math.max(1, Math.ceil(items.length / PAGE_SIZE));
    const normalizedPage = Math.min(Math.max(page, 1), totalPages);
    const start = (normalizedPage - 1) * PAGE_SIZE;
    return {
        pageItems: items.slice(start, start + PAGE_SIZE),
        totalPages,
        page: normalizedPage
    };
}

function renderPager(containerId, currentPage, totalPages, onClickFnName) {
    const container = document.getElementById(containerId);
    if (!container) return;
    if (totalPages <= 1) {
        container.innerHTML = '';
        return;
    }

    let html = '';
    for (let i = 1; i <= totalPages; i += 1) {
        const activeClass = i === currentPage ? 'bg-[#00d4ff] text-white border-[#00d4ff]' : 'bg-white border';
        html += `<button onclick="${onClickFnName}(${i})" class="px-4 py-2 rounded-xl ${activeClass}">${i}</button>`;
    }
    container.innerHTML = html;
}

function applyJobFilters() {
    const searchTerm = normalizeSearchInput('jobsSearchInput', jobFilters.search);
    jobFilters.search = searchTerm;

    return JOBS.filter(job => {
        const title = safeText(job?.title).toLowerCase();
        const company = safeText(job?.company).toLowerCase();
        const location = safeText(job?.location);
        const type = safeText(job?.type);

        const matchesSearch = !searchTerm || title.includes(searchTerm) || company.includes(searchTerm);
        const matchesType = jobFilters.types.length === 0 || jobFilters.types.includes(type);
        const matchesLocation = jobFilters.locations.length === 0 || jobFilters.locations.includes(location);
        return matchesSearch && matchesType && matchesLocation;
    });
}

function filterAndRenderJobs() {
    const filtered = applyJobFilters();
    const { pageItems, totalPages, page } = paginate(filtered, jobFilters.page);
    jobFilters.page = page;

    setHtml('jobGrid', pageItems.map(j => createCard(j, 'job')).join('') || '<p class="text-gray-600 bg-white border rounded-3xl p-6">No jobs found. Try another keyword or clear your filters.</p>');
    setText('jobCount', `${filtered.length} jobs found`);
    renderPager('jobPagination', jobFilters.page, totalPages, 'goToJobPage');
    renderJobFilterOptions();
}

function renderJobFilterOptions() {
    renderCheckboxFilters('jobTypeFilters', uniqueValues(JOBS, 'type'), jobFilters.types, 'toggleJobTypeFilter');
    renderCheckboxFilters('jobLocationFilters', uniqueValues(JOBS, 'location'), jobFilters.locations, 'toggleJobLocationFilter');
}

function toggleFilterValue(arr, value, checked) {
    const exists = arr.includes(value);
    if (checked && !exists) arr.push(value);
    if (!checked && exists) arr.splice(arr.indexOf(value), 1);
}

function toggleJobTypeFilter(value, checked) {
    toggleFilterValue(jobFilters.types, value, checked);
    jobFilters.page = 1;
    filterAndRenderJobs();
}

function toggleJobLocationFilter(value, checked) {
    toggleFilterValue(jobFilters.locations, value, checked);
    jobFilters.page = 1;
    filterAndRenderJobs();
}

function clearJobFilters() {
    jobFilters.search = '';
    jobFilters.types = [];
    jobFilters.locations = [];
    jobFilters.page = 1;
    const input = document.getElementById('jobsSearchInput');
    if (input) input.value = '';
    filterAndRenderJobs();
}

function goToJobPage(page) {
    jobFilters.page = page;
    filterAndRenderJobs();
}

function applyBursaryFilters() {
    const searchTerm = normalizeSearchInput('bursariesSearchInput', bursaryFilters.search);
    bursaryFilters.search = searchTerm;

    return BURSARIES.filter(item => {
        const title = safeText(item?.title).toLowerCase();
        const provider = safeText(item?.provider).toLowerCase();
        const level = safeText(item?.level);

        const matchesSearch = !searchTerm || title.includes(searchTerm) || provider.includes(searchTerm);
        const matchesLevel = bursaryFilters.levels.length === 0 || bursaryFilters.levels.includes(level);
        return matchesSearch && matchesLevel;
    });
}

function filterAndRenderBursaries() {
    const filtered = applyBursaryFilters();
    const { pageItems, totalPages, page } = paginate(filtered, bursaryFilters.page);
    bursaryFilters.page = page;

    setHtml('bursaryGrid', pageItems.map(b => createCard(b, 'bursary')).join('') || '<p class="text-gray-600 bg-white border rounded-3xl p-6">No bursaries found. Try broader search terms.</p>');
    setText('bursaryCount', `${filtered.length} bursaries found`);
    renderPager('bursaryPagination', bursaryFilters.page, totalPages, 'goToBursaryPage');
    renderCheckboxFilters('bursaryLevelFilters', uniqueValues(BURSARIES, 'level'), bursaryFilters.levels, 'toggleBursaryLevelFilter');
}

function toggleBursaryLevelFilter(value, checked) {
    toggleFilterValue(bursaryFilters.levels, value, checked);
    bursaryFilters.page = 1;
    filterAndRenderBursaries();
}

function clearBursaryFilters() {
    bursaryFilters.search = '';
    bursaryFilters.levels = [];
    bursaryFilters.page = 1;
    const input = document.getElementById('bursariesSearchInput');
    if (input) input.value = '';
    filterAndRenderBursaries();
}

function goToBursaryPage(page) {
    bursaryFilters.page = page;
    filterAndRenderBursaries();
}

function applyCourseFilters() {
    const searchTerm = normalizeSearchInput('coursesSearchInput', courseFilters.search);
    courseFilters.search = searchTerm;

    return COURSES.filter(item => {
        const title = safeText(item?.title).toLowerCase();
        const institution = safeText(item?.institution).toLowerCase();
        const mode = safeText(item?.mode);

        const matchesSearch = !searchTerm || title.includes(searchTerm) || institution.includes(searchTerm);
        const matchesMode = courseFilters.modes.length === 0 || courseFilters.modes.includes(mode);
        return matchesSearch && matchesMode;
    });
}

function filterAndRenderCourses() {
    const filtered = applyCourseFilters();
    const { pageItems, totalPages, page } = paginate(filtered, courseFilters.page);
    courseFilters.page = page;

    setHtml('courseGrid', pageItems.map(c => createCard(c, 'course')).join('') || '<p class="text-gray-600 bg-white border rounded-3xl p-6">No courses found. Adjust your search criteria and try again.</p>');
    setText('courseCount', `${filtered.length} courses found`);
    renderPager('coursePagination', courseFilters.page, totalPages, 'goToCoursePage');
    renderCheckboxFilters('courseModeFilters', uniqueValues(COURSES, 'mode'), courseFilters.modes, 'toggleCourseModeFilter');
}

function toggleCourseModeFilter(value, checked) {
    toggleFilterValue(courseFilters.modes, value, checked);
    courseFilters.page = 1;
    filterAndRenderCourses();
}

function clearCourseFilters() {
    courseFilters.search = '';
    courseFilters.modes = [];
    courseFilters.page = 1;
    const input = document.getElementById('coursesSearchInput');
    if (input) input.value = '';
    filterAndRenderCourses();
}

function goToCoursePage(page) {
    courseFilters.page = page;
    filterAndRenderCourses();
}

function renderFeatured() {
    setHtml('featuredJobs', JOBS.slice(0, 3).map(j => createCard(j, 'job')).join(''));
    setHtml('featuredBursaries', BURSARIES.slice(0, 3).map(b => createCard(b, 'bursary')).join(''));
    setHtml('featuredCourses', COURSES.slice(0, 3).map(c => createCard(c, 'course')).join(''));
}

function formatRequirements(req) {
    const list = safeArray(req);
    if (!list.length) return '<li>No specific requirements listed.</li>';
    return list.map(item => `<li>${safeText(item)}</li>`).join('');
}

function formatTips(tips) {
    const list = safeArray(tips);
    if (!list.length) return '<li>Read all instructions carefully and apply before deadlines.</li>';
    return list.map(item => `<li>${safeText(item)}</li>`).join('');
}

function renderRelatedItems(type, currentId) {
    const source = type === 'job' ? JOBS : type === 'bursary' ? BURSARIES : COURSES;
    const related = source.filter(entry => normalizeId(entry?.id) !== normalizeId(currentId)).slice(0, 3);
    return related.map(item => createCard(item, type)).join('');
}

function renderDetail(targetId, item, type) {
    const target = document.getElementById(targetId);
    if (!target) return;

    if (!item) {
        target.innerHTML = `
            <div class="bg-white border rounded-3xl p-8 text-center">
                <h1 class="text-3xl font-semibold mb-3">Not found</h1>
                <p class="text-gray-600 mb-6">The requested ${type} listing was not found.</p>
                <a href="${type}s.html" class="text-[#00d4ff] hover:underline">Back to all listings</a>
            </div>`;
        return;
    }

    const provider = safeText(item.company || item.provider || item.institution, 'Unknown provider');
    const badge = safeText(item.type || item.level || item.mode, 'Open');
    const money = safeText(item.salary || item.amount || item.fee);
    const deadlineOrDuration = safeText(item.deadline || item.duration || 'Not specified');
    const link = safeText(item.link, FALLBACK_APPLY_LINK) || FALLBACK_APPLY_LINK;
    const guideLink = type === 'job' ? 'how-to-write-a-cv-south-africa.html' : type === 'bursary' ? 'top-bursaries-2026.html' : 'highest-paying-jobs-south-africa.html';

    setMeta(
        `${safeText(item.title)} | 051 Jobs`,
        `${safeText(item.title)} in ${safeText(item.location, 'South Africa')}. Requirements, salary insights, application process and practical applicant tips.`
    );

    target.innerHTML = `
        <article class="bg-white border rounded-3xl p-8 space-y-8">
            <header class="flex items-start justify-between gap-4 flex-wrap">
                <div>
                    <p class="text-sm text-gray-500 mb-2">${provider}</p>
                    <h1 class="text-3xl font-semibold">${safeText(item.title, 'Untitled')}</h1>
                    <p class="mt-2 text-sm text-gray-600">Location: ${safeText(item.location, 'South Africa')}</p>
                </div>
                <span class="text-xs px-3 py-1 bg-[#00d4ff]/10 text-[#00d4ff] rounded-3xl">${badge}</span>
            </header>

            ${money ? `<p class="text-[#00d4ff] font-semibold">${money}</p>` : ''}

            <section>
                <h2 class="text-xl font-semibold mb-3">Detailed Description</h2>
                <p class="text-gray-700 leading-relaxed">${safeText(item.description, 'No description provided.')}</p>
            </section>

            <section class="grid md:grid-cols-2 gap-6">
                <div class="bg-gray-50 rounded-2xl p-5">
                    <h2 class="font-semibold mb-2">Key information</h2>
                    <p class="text-sm text-gray-700"><strong>Location:</strong> ${safeText(item.location, 'N/A')}</p>
                    <p class="text-sm text-gray-700"><strong>Deadline/Duration:</strong> ${deadlineOrDuration}</p>
                    <p class="text-sm text-gray-700"><strong>Salary/Funding insight:</strong> ${safeText(item.salaryInsight, 'Compensation depends on qualification and employer policy.')}</p>
                </div>
                <div class="bg-gray-50 rounded-2xl p-5">
                    <h2 class="font-semibold mb-2">Requirements</h2>
                    <ul class="text-sm text-gray-700 list-disc pl-5 space-y-1">${formatRequirements(item.requirements)}</ul>
                </div>
            </section>

            <section>
                <h2 class="text-xl font-semibold mb-3">Application Process</h2>
                <p class="text-gray-700 leading-relaxed">${safeText(item.applicationProcess, 'Visit the official provider website and follow the listed application steps before deadline.')}</p>
            </section>

            <section>
                <h2 class="text-xl font-semibold mb-3">Tips for Applicants</h2>
                <ul class="text-gray-700 list-disc pl-5 space-y-2">${formatTips(item.tips)}</ul>
            </section>

            <section class="flex flex-wrap gap-3">
                <a href="${link}" target="_blank" rel="noopener noreferrer" class="inline-flex items-center gap-2 bg-[#00d4ff] text-white px-5 py-3 rounded-2xl font-medium">
                    Official Application Link <i class="fa-solid fa-arrow-up-right-from-square"></i>
                </a>
                <a href="${guideLink}" class="inline-flex items-center gap-2 border px-5 py-3 rounded-2xl font-medium text-gray-700">
                    Read related guide
                </a>
            </section>
        </article>

        <section class="mt-10">
            <h2 class="text-2xl font-semibold mb-4">Related ${type === 'job' ? 'Jobs' : type === 'bursary' ? 'Bursaries' : 'Courses'}</h2>
            <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                ${renderRelatedItems(type, item.id)}
            </div>
        </section>`;
}

function renderDetailsPage(type) {
    const id = getSearchParam('id');
    const normalized = normalizeId(id);
    if (!normalized) return;

    const dataset = type === 'job' ? JOBS : type === 'bursary' ? BURSARIES : COURSES;
    const item = dataset.find(entry => normalizeId(entry?.id) === normalized);
    renderDetail(`${type}Detail`, item, type);
}

const debouncedJobSearch = debounce(() => {
    jobFilters.page = 1;
    filterAndRenderJobs();
}, 250);

const debouncedBursarySearch = debounce(() => {
    bursaryFilters.page = 1;
    filterAndRenderBursaries();
}, 250);

const debouncedCourseSearch = debounce(() => {
    courseFilters.page = 1;
    filterAndRenderCourses();
}, 250);

async function start() {
    await loadData();

    if (document.getElementById('featuredJobs')) renderFeatured();

    if (document.getElementById('jobGrid')) {
        const prefill = getSearchParam('search');
        if (prefill) {
            const input = document.getElementById('jobsSearchInput');
            if (input) input.value = prefill;
            jobFilters.search = prefill.toLowerCase();
        }
        filterAndRenderJobs();
    }

    if (document.getElementById('bursaryGrid')) filterAndRenderBursaries();
    if (document.getElementById('courseGrid')) filterAndRenderCourses();

    if (document.getElementById('jobDetail')) renderDetailsPage('job');
    if (document.getElementById('bursaryDetail')) renderDetailsPage('bursary');
    if (document.getElementById('courseDetail')) renderDetailsPage('course');
}

window.addEventListener('DOMContentLoaded', () => {
    start().catch(error => console.error('Startup error:', error));
});
