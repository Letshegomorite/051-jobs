/* 051 Jobs – FINAL CLEAN & FIXED VERSION (All sections working) */

let JOBS = [], BURSARIES = [], COURSES = [];

// ====================== UTIL ======================
function debounce(func, delay = 300) {
    let timeout;
    return (...args) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => func(...args), delay);
    };
}

// ====================== LOAD DATA ======================
async function loadData() {
    try {
        const [j, b, c] = await Promise.all([
            fetch('jobs.json').then(r => { if (!r.ok) throw new Error('jobs.json'); return r.json(); }),
            fetch('bursaries.json').then(r => { if (!r.ok) throw new Error('bursaries.json'); return r.json(); }),
            fetch('courses.json').then(r => { if (!r.ok) throw new Error('courses.json'); return r.json(); })
        ]);

        JOBS = j || [];
        BURSARIES = b || [];
        COURSES = c || [];

        console.log(`✅ Loaded: ${JOBS.length} jobs, ${BURSARIES.length} bursaries, ${COURSES.length} courses`);
        return true;
    } catch (e) {
        console.error("❌ Failed to load JSON:", e.message);
        return false;
    }
}

// ====================== CARD ======================
function createCard(item, type) {
    return `
    <a href="\( {type}.html?id= \){item.id}" class="card-hover bg-white border rounded-3xl overflow-hidden flex flex-col h-full">
        <div class="p-6">
            <div class="flex justify-between items-start">
                <div class="font-semibold text-lg">${item.company || item.provider || item.institution || 'Unknown'}</div>
                <span class="text-xs px-3 py-1 bg-[#00d4ff]/10 text-[#00d4ff] rounded-3xl">${item.type || item.level || item.mode || 'N/A'}</span>
            </div>
            <h3 class="mt-4 text-xl font-medium leading-tight">${item.title}</h3>
            \( {(item.salary || item.amount || item.fee) ? `<p class="mt-3 text-[#00d4ff] font-semibold"> \){item.salary || item.amount || item.fee}</p>` : ''}
            <p class="mt-4 text-sm text-gray-600 line-clamp-3">${(item.description || '').substring(0, 120)}...</p>
        </div>
        <div class="mt-auto px-6 py-4 border-t text-xs flex justify-between text-[#00d4ff]">
            <span>View Details & Apply</span>
            <i class="fa-solid fa-arrow-right"></i>
        </div>
    </a>`;
}

function performGlobalSearch() {
    const query = document.getElementById('globalSearchInput')?.value.trim();
    if (query) window.location.href = `jobs.html?search=${encodeURIComponent(query)}`;
}

// ====================== SHARED PAGINATION ======================
function renderPagination(data, perPage, currentPage, gridId, paginationId, countId, label, pageFuncName, cardRenderer) {
    const start = (currentPage - 1) * perPage;
    const paginated = data.slice(start, start + perPage);

    document.getElementById(gridId).innerHTML = paginated.map(cardRenderer).join('') || '<p class="col-span-full text-center py-8 text-gray-500">No results found</p>';

    document.getElementById(countId).textContent = `${data.length} ${label}`;

    const totalPages = Math.ceil(data.length / perPage);
    let html = '';
    for (let i = 1; i <= Math.min(totalPages, 5); i++) {
        html += `<button onclick="\( {pageFuncName}( \){i})" class="\( {i === currentPage ? 'bg-[#00d4ff] text-white' : 'border'} px-4 py-2 rounded-3xl mx-1 text-sm"> \){i}</button>`;
    }
    document.getElementById(paginationId).innerHTML = html;
}

// ====================== JOBS ======================
let jobFilters = { search: '', types: [], locations: [], page: 1 };
const JOBS_PER_PAGE = 9;

function renderJobFilters() {
    const types = ['Full-time','Part-time','Contract','Internship'];
    document.getElementById('jobTypeFilters').innerHTML = types.map(t => `
        <label class="flex items-center gap-2 cursor-pointer text-sm">
            <input type="checkbox" value="${t}" onchange="toggleJobFilter(this)" class="accent-[#00d4ff]"> ${t}
        </label>`).join('');

    const locs = ['Johannesburg','Cape Town','Durban','Pretoria','Bloemfontein','Remote'];
    document.getElementById('jobLocationFilters').innerHTML = locs.map(l => `
        <label class="flex items-center gap-2 cursor-pointer text-sm">
            <input type="checkbox" value="${l}" onchange="toggleJobFilter(this)" class="accent-[#00d4ff]"> ${l}
        </label>`).join('');
}

function toggleJobFilter(el) {
    const val = el.value;
    const isType = ['Full-time','Part-time','Contract','Internship'].includes(val);
    if (isType) {
        el.checked ? jobFilters.types.push(val) : jobFilters.types = jobFilters.types.filter(v => v !== val);
    } else {
        el.checked ? jobFilters.locations.push(val) : jobFilters.locations = jobFilters.locations.filter(v => v !== val);
    }
    jobFilters.page = 1;
    filterAndRenderJobs();
}

const debouncedJobSearch = debounce(() => { jobFilters.page = 1; filterAndRenderJobs(); }, 250);

function filterAndRenderJobs() {
    const searchTerm = (document.getElementById('jobsSearchInput')?.value || '').toLowerCase().trim();

    let filtered = JOBS.filter(job => {
        const matchesSearch = !searchTerm ||
            job.title.toLowerCase().includes(searchTerm) ||
            (job.company && job.company.toLowerCase().includes(searchTerm)) ||
            (job.description && job.description.toLowerCase().includes(searchTerm));

        const matchesType = jobFilters.types.length === 0 || jobFilters.types.includes(job.type);
        const matchesLocation = jobFilters.locations.length === 0 ||
            jobFilters.locations.some(loc => (job.location || '').toLowerCase().includes(loc.toLowerCase()));

        return matchesSearch && matchesType && matchesLocation;
    });

    renderPagination(
        filtered, JOBS_PER_PAGE, jobFilters.page,
        'jobGrid', 'jobPagination', 'jobCount',
        'jobs found', 'goToJobPage',
        item => createCard(item, 'job')
    );
}

function goToJobPage(p) {
    jobFilters.page = p;
    filterAndRenderJobs();
}

function clearJobFilters() {
    jobFilters = { search: '', types: [], locations: [], page: 1 };
    if (document.getElementById('jobsSearchInput')) document.getElementById('jobsSearchInput').value = '';
    renderJobFilters();
    filterAndRenderJobs();
}

// ====================== BURSARIES ======================
let bursaryFilters = { search: '', levels: [], page: 1 };
const BURSARIES_PER_PAGE = 9;

function renderBursaryFilters() {
    const levels = ['Undergraduate','Postgraduate','TVET','High School'];
    document.getElementById('bursaryLevelFilters').innerHTML = levels.map(l => `
        <label class="flex items-center gap-2 cursor-pointer text-sm">
            <input type="checkbox" value="${l}" onchange="toggleBursaryFilter(this)" class="accent-[#00d4ff]"> ${l}
        </label>`).join('');
}

function toggleBursaryFilter(el) {
    const val = el.value;
    el.checked ? bursaryFilters.levels.push(val) : bursaryFilters.levels = bursaryFilters.levels.filter(v => v !== val);
    bursaryFilters.page = 1;
    filterAndRenderBursaries();
}

const debouncedBursarySearch = debounce(() => { bursaryFilters.page = 1; filterAndRenderBursaries(); }, 250);

function filterAndRenderBursaries() {
    const searchTerm = (document.getElementById('bursariesSearchInput')?.value || '').toLowerCase().trim();

    let filtered = BURSARIES.filter(b => {
        const matchesSearch = !searchTerm ||
            b.title.toLowerCase().includes(searchTerm) ||
            (b.provider && b.provider.toLowerCase().includes(searchTerm)) ||
            (b.description && b.description.toLowerCase().includes(searchTerm));

        const matchesLevel = bursaryFilters.levels.length === 0 || bursaryFilters.levels.includes(b.level);

        return matchesSearch && matchesLevel;
    });

    renderPagination(
        filtered, BURSARIES_PER_PAGE, bursaryFilters.page,
        'bursaryGrid', 'bursaryPagination', 'bursaryCount',
        'bursaries found', 'goToBursaryPage',
        item => createCard(item, 'bursary')
    );
}

function goToBursaryPage(p) {
    bursaryFilters.page = p;
    filterAndRenderBursaries();
}

function clearBursaryFilters() {
    bursaryFilters = { search: '', levels: [], page: 1 };
    if (document.getElementById('bursariesSearchInput')) document.getElementById('bursariesSearchInput').value = '';
    renderBursaryFilters();
    filterAndRenderBursaries();
}

// ====================== COURSES ======================
let courseFilters = { search: '', modes: [], page: 1 };
const COURSES_PER_PAGE = 9;

function renderCourseFilters() {
    const modes = ['Online','In-person','Hybrid'];
    document.getElementById('courseModeFilters').innerHTML = modes.map(m => `
        <label class="flex items-center gap-2 cursor-pointer text-sm">
            <input type="checkbox" value="${m}" onchange="toggleCourseFilter(this)" class="accent-[#00d4ff]"> ${m}
        </label>`).join('');
}

function toggleCourseFilter(el) {
    const val = el.value;
    el.checked ? courseFilters.modes.push(val) : courseFilters.modes = courseFilters.modes.filter(v => v !== val);
    courseFilters.page = 1;
    filterAndRenderCourses();
}

const debouncedCourseSearch = debounce(() => { courseFilters.page = 1; filterAndRenderCourses(); }, 250);

function filterAndRenderCourses() {
    const searchTerm = (document.getElementById('coursesSearchInput')?.value || '').toLowerCase().trim();

    let filtered = COURSES.filter(c => {
        const matchesSearch = !searchTerm ||
            c.title.toLowerCase().includes(searchTerm) ||
            (c.institution && c.institution.toLowerCase().includes(searchTerm)) ||
            (c.description && c.description.toLowerCase().includes(searchTerm));

        const matchesMode = courseFilters.modes.length === 0 || courseFilters.modes.includes(c.mode);

        return matchesSearch && matchesMode;
    });

    renderPagination(
        filtered, COURSES_PER_PAGE, courseFilters.page,
        'courseGrid', 'coursePagination', 'courseCount',
        'courses found', 'goToCoursePage',
        item => createCard(item, 'course')
    );
}

function goToCoursePage(p) {
    courseFilters.page = p;
    filterAndRenderCourses();
}

function clearCourseFilters() {
    courseFilters = { search: '', modes: [], page: 1 };
    if (document.getElementById('coursesSearchInput')) document.getElementById('coursesSearchInput').value = '';
    renderCourseFilters();
    filterAndRenderCourses();
}

// ====================== FEATURED ======================
async function renderFeatured() {
    await loadData();

    if (document.getElementById('featuredJobs')) {
        document.getElementById('featuredJobs').innerHTML = `
            <h2 class="text-3xl font-semibold mb-8">Featured Jobs</h2>
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                ${JOBS.slice(0, 3).map(j => createCard(j, 'job')).join('')}
            </div>`;
    }

    if (document.getElementById('featuredBursaries')) {
        document.getElementById('featuredBursaries').innerHTML = `
            <h2 class="text-3xl font-semibold mb-8">Featured Bursaries</h2>
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                ${BURSARIES.slice(0, 3).map(b => createCard(b, 'bursary')).join('')}
            </div>`;
    }

    if (document.getElementById('featuredCourses')) {
        document.getElementById('featuredCourses').innerHTML = `
            <h2 class="text-3xl font-semibold mb-8">Featured Short Courses</h2>
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                ${COURSES.slice(0, 3).map(c => createCard(c, 'course')).join('')}
            </div>`;
    }
}

// ====================== INIT ======================
async function start() {
    const success = await loadData();
    if (!success) return;

    if (document.getElementById('featuredJobs')) renderFeatured();

    if (document.getElementById('jobGrid')) {
        renderJobFilters();
        filterAndRenderJobs();
    }

    if (document.getElementById('bursaryGrid')) {
        renderBursaryFilters();
        filterAndRenderBursaries();
    }

    if (document.getElementById('courseGrid')) {
        renderCourseFilters();
        filterAndRenderCourses();
    }
}

window.onload = start;
