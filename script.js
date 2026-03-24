/* 051 Jobs – FIXED VERSION */

let JOBS = [], BURSARIES = [], COURSES = [];

// ================= UTIL =================
function debounce(func, delay = 300) {
    let timeout;
    return (...args) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => func(...args), delay);
    };
}

// ================= LOAD DATA =================
async function loadData() {
    try {
        const [j, b, c] = await Promise.all([
            fetch('jobs.json').then(r => {
                if (!r.ok) throw new Error('jobs.json failed');
                return r.json();
            }),
            fetch('bursaries.json').then(r => {
                if (!r.ok) throw new Error('bursaries.json failed');
                return r.json();
            }),
            fetch('courses.json').then(r => {
                if (!r.ok) throw new Error('courses.json failed');
                return r.json();
            })
        ]);

        JOBS = j || [];
        BURSARIES = b || [];
        COURSES = c || [];

        console.log("✅ Data loaded");
    } catch (e) {
        console.error("❌ Load error:", e);
    }
}

// ================= CARD =================
function createCard(item, type) {
    return `
    <a href="${type}.html?id=${item.id}" class="card-hover bg-white border rounded-3xl overflow-hidden flex flex-col h-full">
        <div class="p-6">
            <div class="flex justify-between items-start">
                <div class="font-semibold text-lg">
                    ${item.company || item.provider || item.institution || ''}
                </div>
                <span class="text-xs px-3 py-1 bg-[#00d4ff]/10 text-[#00d4ff] rounded-3xl">
                    ${item.type || item.level || item.mode || ''}
                </span>
            </div>

            <h3 class="mt-4 text-xl font-medium leading-tight">
                ${item.title || ''}
            </h3>

            ${(item.salary || item.amount || item.fee) ? `
                <p class="mt-3 text-[#00d4ff] font-semibold">
                    ${item.salary || item.amount || item.fee}
                </p>` : ''}

            <p class="mt-4 text-sm text-gray-600 line-clamp-3">
                ${(item.description || '').substring(0, 120)}...
            </p>
        </div>

        <div class="mt-auto px-6 py-4 border-t text-xs flex justify-between text-[#00d4ff]">
            <span>View Details & Apply</span>
            <i class="fa-solid fa-arrow-right"></i>
        </div>
    </a>`;
}

// ================= GLOBAL SEARCH =================
function performGlobalSearch() {
    const query = document.getElementById('globalSearchInput')?.value.trim();
    if (query) window.location.href = `jobs.html?search=${encodeURIComponent(query)}`;
}

// ================= JOBS =================
let jobFilters = { search: '', types: [], locations: [], page: 1 };
const JOBS_PER_PAGE = 9;

function filterAndRenderJobs() {
    const searchTerm = (document.getElementById('jobsSearchInput')?.value || '').toLowerCase();

    let filtered = JOBS.filter(job => {
        return (
            job.title.toLowerCase().includes(searchTerm) ||
            (job.company || '').toLowerCase().includes(searchTerm)
        );
    });

    const start = (jobFilters.page - 1) * JOBS_PER_PAGE;
    const paginated = filtered.slice(start, start + JOBS_PER_PAGE);

    document.getElementById('jobGrid').innerHTML =
        paginated.map(j => createCard(j, 'job')).join('');

    document.getElementById('jobCount').textContent =
        `${filtered.length} jobs found`;

    renderPagination(filtered.length);
}

function renderPagination(total) {
    const totalPages = Math.ceil(total / JOBS_PER_PAGE);
    let html = '';

    for (let i = 1; i <= totalPages; i++) {
        html += `
            <button onclick="goToJobPage(${i})"
            class="px-4 py-2 mx-1 rounded-xl ${i === jobFilters.page ? 'bg-[#00d4ff] text-white' : 'border'}">
                ${i}
            </button>`;
    }

    document.getElementById('jobPagination').innerHTML = html;
}

function goToJobPage(p) {
    jobFilters.page = p;
    filterAndRenderJobs();
}

// ================= BURSARIES =================
function filterAndRenderBursaries() {
    document.getElementById('bursaryGrid').innerHTML =
        BURSARIES.map(b => createCard(b, 'bursary')).join('');
}

// ================= COURSES =================
function filterAndRenderCourses() {
    document.getElementById('courseGrid').innerHTML =
        COURSES.map(c => createCard(c, 'course')).join('');
}

// ================= HOME =================
function renderFeatured() {
    document.getElementById('featuredJobs').innerHTML =
        JOBS.slice(0, 3).map(j => createCard(j, 'job')).join('');

    document.getElementById('featuredBursaries').innerHTML =
        BURSARIES.slice(0, 3).map(b => createCard(b, 'bursary')).join('');

    document.getElementById('featuredCourses').innerHTML =
        COURSES.slice(0, 3).map(c => createCard(c, 'course')).join('');
}

// ================= INIT =================
async function start() {
    await loadData();

    if (document.getElementById('featuredJobs')) renderFeatured();

    if (document.getElementById('jobGrid')) filterAndRenderJobs();
    if (document.getElementById('bursaryGrid')) filterAndRenderBursaries();
    if (document.getElementById('courseGrid')) filterAndRenderCourses();
}

window.onload = start;
