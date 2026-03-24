/* 051 Jobs – Advanced Search for All Pages */

let JOBS = [], BURSARIES = [], COURSES = [];

function debounce(func, delay = 300) {
    let timeout;
    return (...args) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => func(...args), delay);
    };
}

async function loadData() {
    try {
        const [j, b, c] = await Promise.all([
            fetch('jobs.json').then(r => r.json()),
            fetch('bursaries.json').then(r => r.json()),
            fetch('courses.json').then(r => r.json())
        ]);
        JOBS = j; BURSARIES = b; COURSES = c;
    } catch(e) { console.error(e); }
}

function createCard(item, type) {
    return `
    <a href="\( {type}.html?id= \){item.id}" class="card-hover bg-white border rounded-3xl overflow-hidden flex flex-col h-full">
        <div class="p-6">
            <div class="flex justify-between items-start">
                <div class="font-semibold text-lg">${item.company || item.provider || item.institution}</div>
                <span class="text-xs px-3 py-1 bg-[#00d4ff]/10 text-[#00d4ff] rounded-3xl">${item.type || item.level || item.mode}</span>
            </div>
            <h3 class="mt-4 text-xl font-medium leading-tight">${item.title}</h3>
            \( {item.salary || item.amount || item.fee ? `<p class="mt-3 text-[#00d4ff] font-semibold"> \){item.salary || item.amount || item.fee}</p>` : ''}
            <p class="mt-4 text-sm text-gray-600 line-clamp-3">${item.description.substring(0, 120)}...</p>
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

// JOBS
let jobFilters = { search: '', types: [], locations: [], page: 1 };
const JOBS_PER_PAGE = 9;

function renderJobFilters() {
    const types = ['Full-time','Part-time','Contract','Internship'];
    document.getElementById('jobTypeFilters').innerHTML = types.map(t => `
        <label class="flex items-center gap-2 cursor-pointer text-sm"><input type="checkbox" value="${t}" onchange="toggleJobFilter(this)" class="accent-[#00d4ff]"> ${t}</label>`).join('');

    const locs = ['Johannesburg','Cape Town','Durban','Pretoria','Bloemfontein','Remote'];
    document.getElementById('jobLocationFilters').innerHTML = locs.map(l => `
        <label class="flex items-center gap-2 cursor-pointer text-sm"><input type="checkbox" value="${l}" onchange="toggleJobFilter(this)" class="accent-[#00d4ff]"> ${l}</label>`).join('');
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
            job.description.toLowerCase().includes(searchTerm);
        const matchesType = jobFilters.types.length === 0 || jobFilters.types.includes(job.type);
        const matchesLocation = jobFilters.locations.length === 0 || jobFilters.locations.some(loc => job.location.toLowerCase().includes(loc.toLowerCase()));
        return matchesSearch && matchesType && matchesLocation;
    });

    const start = (jobFilters.page - 1) * JOBS_PER_PAGE;
    const paginated = filtered.slice(start, start + JOBS_PER_PAGE);

    document.getElementById('jobGrid').innerHTML = paginated.map(j => createCard(j, 'job')).join('');
    document.getElementById('jobCount').textContent = `${filtered.length} jobs found`;

    const totalPages = Math.ceil(filtered.length / JOBS_PER_PAGE);
    let html = '';
    for (let i = 1; i <= Math.min(totalPages, 5); i++) {
        html += `<button onclick="goToJobPage(\( {i})" class=" \){i === jobFilters.page ? 'bg-[#00d4ff] text-white' : 'border'} px-5 py-2 rounded-3xl mx-1 text-sm">${i}</button>`;
    }
    document.getElementById('jobPagination').innerHTML = html;
}

function goToJobPage(p) { jobFilters.page = p; filterAndRenderJobs(); }

function clearJobFilters() {
    jobFilters = { search: '', types: [], locations: [], page: 1 };
    document.getElementById('jobsSearchInput').value = '';
    renderJobFilters();
    filterAndRenderJobs();
}

// BURSARIES
let bursaryFilters = { search: '', levels: [], page: 1 };
const BURSARIES_PER_PAGE = 9;

function renderBursaryFilters() {
    const levels = ['Undergraduate','Postgraduate','TVET','High School'];
    document.getElementById('bursaryLevelFilters').innerHTML = levels.map(l => `
        <label class="flex items-center gap-2 cursor-pointer text-sm"><input type="checkbox" value="${l}" onchange="toggleBursaryFilter(this)" class="accent-[#00d4ff]"> ${l}</label>`).join('');
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
            b.description.toLowerCase().includes(searchTerm);
        const matchesLevel = bursaryFilters.levels.length === 0 || bursaryFilters.levels.includes(b.level);
        return matchesSearch && matchesLevel;
    });

    const start = (bursaryFilters.page - 1) * BURSARIES_PER_PAGE;
    const paginated = filtered.slice(start, start + BURSARIES_PER_PAGE);

    document.getElementById('bursaryGrid').innerHTML = paginated.map(b => createCard(b, 'bursary')).join('');
    document.getElementById('bursaryCount').textContent = `${filtered.length} bursaries found`;

    const totalPages = Math.ceil(filtered.length / BURSARIES_PER_PAGE);
    let html = '';
    for (let i = 1; i <= Math.min(totalPages, 5); i++) {
        html += `<button onclick="goToBursaryPage(\( {i})" class=" \){i === bursaryFilters.page ? 'bg-[#00d4ff] text-white' : 'border'} px-5 py-2 rounded-3xl mx-1 text-sm">${i}</button>`;
    }
    document.getElementById('bursaryPagination').innerHTML = html;
}

function goToBursaryPage(p) { bursaryFilters.page = p; filterAndRenderBursaries(); }

function clearBursaryFilters() {
    bursaryFilters = { search: '', levels: [], page: 1 };
    document.getElementById('bursariesSearchInput').value = '';
    renderBursaryFilters();
    filterAndRenderBursaries();
}

// COURSES
let courseFilters = { search: '', modes: [], page: 1 };
const COURSES_PER_PAGE = 9;

function renderCourseFilters() {
    const modes = ['Online','In-person','Hybrid'];
    document.getElementById('courseModeFilters').innerHTML = modes.map(m => `
        <label class="flex items-center gap-2 cursor-pointer text-sm"><input type="checkbox" value="${m}" onchange="toggleCourseFilter(this)" class="accent-[#00d4ff]"> ${m}</label>`).join('');
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
            c.description.toLowerCase().includes(searchTerm);
        const matchesMode = courseFilters.modes.length === 0 || courseFilters.modes.includes(c.mode);
        return matchesSearch && matchesMode;
    });

    const start = (courseFilters.page - 1) * COURSES_PER_PAGE;
    const paginated = filtered.slice(start, start + COURSES_PER_PAGE);

    document.getElementById('courseGrid').innerHTML = paginated.map(c => createCard(c, 'course')).join('');
    document.getElementById('courseCount').textContent = `${filtered.length} courses found`;

    const totalPages = Math.ceil(filtered.length / COURSES_PER_PAGE);
    let html = '';
    for (let i = 1; i <= Math.min(totalPages, 5); i++) {
        html += `<button onclick="goToCoursePage(\( {i})" class=" \){i === courseFilters.page ? 'bg-[#00d4ff] text-white' : 'border'} px-5 py-2 rounded-3xl mx-1 text-sm">${i}</button>`;
    }
    document.getElementById('coursePagination').innerHTML = html;
}

function goToCoursePage(p) { courseFilters.page = p; filterAndRenderCourses(); }

function clearCourseFilters() {
    courseFilters = { search: '', modes: [], page: 1 };
    document.getElementById('coursesSearchInput').value = '';
    renderCourseFilters();
    filterAndRenderCourses();
}

async function renderFeatured() {
    await loadData();
    document.getElementById('featuredJobs').innerHTML = `
        <h2 class="text-3xl font-semibold mb-8">Featured Jobs</h2>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">${JOBS.slice(0,3).map(j => createCard(j,'job')).join('')}</div>`;
    document.getElementById('featuredBursaries').innerHTML = `
        <h2 class="text-3xl font-semibold mb-8">Featured Bursaries</h2>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">${BURSARIES.slice(0,3).map(b => createCard(b,'bursary')).join('')}</div>`;
    document.getElementById('featuredCourses').innerHTML = `
        <h2 class="text-3xl font-semibold mb-8">Featured Short Courses</h2>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">${COURSES.slice(0,3).map(c => createCard(c,'course')).join('')}</div>`;
}

async function start() {
    await loadData();

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