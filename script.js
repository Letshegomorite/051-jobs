/* 051 Jobs – FINAL CLEAN VERSION */

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
async function loadData(retries = 3) {
    for (let i = 0; i < retries; i++) {
        try {
            const [j, b, c] = await Promise.all([
                fetch('jobs.json').then(r => {
                    if (!r.ok) throw new Error('jobs.json not found');
                    return r.json();
                }),
                fetch('bursaries.json').then(r => {
                    if (!r.ok) throw new Error('bursaries.json not found');
                    return r.json();
                }),
                fetch('courses.json').then(r => {
                    if (!r.ok) throw new Error('courses.json not found');
                    return r.json();
                })
            ]);

            JOBS = j || [];
            BURSARIES = b || [];
            COURSES = c || [];

            console.log(`✅ Loaded: ${JOBS.length} jobs, ${BURSARIES.length} bursaries, ${COURSES.length} courses`);
            return true;

        } catch (e) {
            console.warn(`Attempt ${i + 1} failed:`, e.message);
            await new Promise(res => setTimeout(res, 500));
        }
    }

    console.error("❌ Failed to load JSON files.");
    return false;
}

// ====================== CARD ======================
function createCard(item, type) {
    return `
    <a href="${type}.html?id=${item.id}" class="card-hover bg-white border rounded-3xl overflow-hidden flex flex-col h-full">
        <div class="p-6">
            <div class="flex justify-between items-start">
                <div class="font-semibold text-lg">
                    ${item.company || item.provider || item.institution || 'Unknown'}
                </div>
                <span class="text-xs px-3 py-1 bg-[#00d4ff]/10 text-[#00d4ff] rounded-3xl">
                    ${item.type || item.level || item.mode || 'N/A'}
                </span>
            </div>

            <h3 class="mt-4 text-xl font-medium leading-tight">${item.title}</h3>

            ${
                (item.salary || item.amount || item.fee)
                ? `<p class="mt-3 text-[#00d4ff] font-semibold">
                    ${item.salary || item.amount || item.fee}
                   </p>`
                : ''
            }

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

function performGlobalSearch() {
    const query = document.getElementById('globalSearchInput')?.value.trim();
    if (query) window.location.href = `jobs.html?search=${encodeURIComponent(query)}`;
}

// ====================== JOBS ======================
let jobFilters = { types: [], locations: [], page: 1 };
const JOBS_PER_PAGE = 9;

function renderJobFilters() {
    const types = ['Full-time','Part-time','Contract','Internship'];
    document.getElementById('jobTypeFilters').innerHTML = types.map(t => `
        <label class="flex items-center gap-2 text-sm">
            <input type="checkbox" value="${t}" onchange="toggleJobFilter(this)">
            ${t}
        </label>`).join('');

    const locs = ['Johannesburg','Cape Town','Durban','Pretoria','Bloemfontein','Remote'];
    document.getElementById('jobLocationFilters').innerHTML = locs.map(l => `
        <label class="flex items-center gap-2 text-sm">
            <input type="checkbox" value="${l}" onchange="toggleJobFilter(this)">
            ${l}
        </label>`).join('');
}

function toggleJobFilter(el) {
    const val = el.value;
    const isType = ['Full-time','Part-time','Contract','Internship'].includes(val);

    if (isType) {
        el.checked
            ? jobFilters.types.push(val)
            : jobFilters.types = jobFilters.types.filter(v => v !== val);
    } else {
        el.checked
            ? jobFilters.locations.push(val)
            : jobFilters.locations = jobFilters.locations.filter(v => v !== val);
    }

    jobFilters.page = 1;
    filterAndRenderJobs();
}

const debouncedJobSearch = debounce(() => {
    jobFilters.page = 1;
    filterAndRenderJobs();
}, 250);

function filterAndRenderJobs() {
    const searchTerm = (document.getElementById('jobsSearchInput')?.value || '').toLowerCase();

    let filtered = JOBS.filter(job => {
        return (
            (!searchTerm ||
                job.title?.toLowerCase().includes(searchTerm) ||
                job.company?.toLowerCase().includes(searchTerm) ||
                job.description?.toLowerCase().includes(searchTerm)
            ) &&
            (jobFilters.types.length === 0 || jobFilters.types.includes(job.type)) &&
            (jobFilters.locations.length === 0 ||
                jobFilters.locations.some(loc =>
                    job.location?.toLowerCase().includes(loc.toLowerCase())
                ))
        );
    });

    renderPagination(
        filtered,
        JOBS_PER_PAGE,
        jobFilters.page,
        'jobGrid',
        'jobPagination',
        'jobCount',
        'jobs found',
        'goToJobPage',
        item => createCard(item, 'job')
    );
}

function goToJobPage(p) {
    jobFilters.page = p;
    filterAndRenderJobs();
}

// ====================== SHARED PAGINATION ======================
function renderPagination(data, perPage, page, gridId, paginationId, countId, label, funcName, renderer) {
    const start = (page - 1) * perPage;
    const paginated = data.slice(start, start + perPage);

    document.getElementById(gridId).innerHTML =
        paginated.map(renderer).join('') || `<p>No results found</p>`;

    document.getElementById(countId).textContent =
        `${data.length} ${label}`;

    const totalPages = Math.ceil(data.length / perPage);
    let html = '';

    for (let i = 1; i <= Math.min(totalPages, 5); i++) {
        html += `
        <button onclick="${funcName}(${i})"
            class="${i === page ? 'bg-[#00d4ff] text-white' : 'border'} px-4 py-2 rounded">
            ${i}
        </button>`;
    }

    document.getElementById(paginationId).innerHTML = html;
}

// ====================== FEATURED ======================
async function renderFeatured() {
    await loadData();

    if (document.getElementById('featuredJobs')) {
        document.getElementById('featuredJobs').innerHTML = `
            <h2 class="text-3xl font-semibold mb-8">Featured Jobs</h2>
            <div class="grid gap-6">
                ${JOBS.slice(0, 3).map(j => createCard(j, 'job')).join('')}
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
}

window.onload = start;
