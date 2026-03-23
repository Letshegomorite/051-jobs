<!-- FILE: script.js -->

fetch('jobs.json')
  .then(res => res.json())
  .then(data => {
    jobs = data;
    displayJobs();
  });

function displayJobs() {
  const container = document.getElementById('jobs-container');
  container.innerHTML = '';

  const start = (currentPage - 1) * jobsPerPage;
  const end = start + jobsPerPage;
  const paginatedJobs = jobs.slice(start, end);

  paginatedJobs.forEach((job, index) => {
    const div = document.createElement('div');
    div.classList.add('job-card');

    div.innerHTML = `
      <h3>${job.title}</h3>
      <p><strong>${job.company}</strong></p>
      <p>${job.location}</p>
      <a href="job.html?id=${start + index}" class="details-btn">View Details</a>
    `;

    container.appendChild(div);
  });

  document.getElementById('page-info').innerText = `Page ${currentPage}`;
}

function nextPage() {
  if (currentPage * jobsPerPage < jobs.length) {
    currentPage++;
    displayJobs();
  }
}

function prevPage() {
  if (currentPage > 1) {
    currentPage--;
    displayJobs();
  }
}

// SEARCH
const searchInput = document.getElementById('searchInput');
searchInput.addEventListener('keyup', () => {
  const value = searchInput.value.toLowerCase();

  const filtered = jobs.filter(job =>
    job.title.toLowerCase().includes(value) ||
    job.company.toLowerCase().includes(value) ||
    job.location.toLowerCase().includes(value)
  );

  currentPage = 1;
  jobs = filtered;
  displayJobs();
});
