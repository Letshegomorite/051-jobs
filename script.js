let jobs = [];

fetch('jobs.json')
  .then(res => res.json())
  .then(data => {
    jobs = data;
    displayJobs(jobs);
  });

function displayJobs(data) {
  const container = document.getElementById('jobs-container');
  container.innerHTML = '';

  data.forEach(job => {
    const div = document.createElement('div');
    div.classList.add('job-card');

    div.innerHTML = `
      <h3>${job.title}</h3>
      <p><strong>${job.company}</strong></p>
      <p>${job.location}</p>
      <a href="${job.link}" target="_blank">Apply</a>
    `;

    container.appendChild(div);
  });
}

// SEARCH
document.getElementById('searchInput').addEventListener('keyup', (e) => {
  const value = e.target.value.toLowerCase();

  const filtered = jobs.filter(job =>
    job.title.toLowerCase().includes(value) ||
    job.company.toLowerCase().includes(value) ||
    job.location.toLowerCase().includes(value)
  );

  displayJobs(filtered);
});

// FILTER
document.getElementById('locationFilter').addEventListener('change', (e) => {
  const value = e.target.value;

  if (!value) return displayJobs(jobs);

  const filtered = jobs.filter(job => job.location === value);
  displayJobs(filtered);
});
