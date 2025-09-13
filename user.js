// ===============================
// CivicConnect User.js
// ===============================

// Selectors
const loginForm = document.getElementById("loginForm");
const loginScreen = document.getElementById("loginScreen");
const dashboard = document.getElementById("dashboard");

const newReportBtn = document.getElementById("newReportBtn");
const newReportForm = document.getElementById("newReportForm");
const closeFormBtn = document.getElementById("closeFormBtn");

const reportForm = document.getElementById("reportForm");
const reportsList = document.getElementById("reportsList");

const tabs = document.querySelectorAll(".tab");
const statTotal = document.querySelector(".stat-card:nth-child(1) .stat-number");
const statPending = document.querySelector(".stat-card:nth-child(2) .stat-number");
const statResolved = document.querySelector(".stat-card:nth-child(3) .stat-number");

const fileInput = document.getElementById("fileInput");
const imageUpload = document.getElementById("imageUpload");
const imagePreview = document.getElementById("imagePreview");

const getLocationBtn = document.getElementById("getLocationBtn");
const locationText = document.getElementById("locationText");

// Data
let reports = JSON.parse(localStorage.getItem("reports")) || [];
let currentUser = JSON.parse(localStorage.getItem("user")) || null;

// ===============================
// LOGIN HANDLER
// ===============================
if (currentUser) {
  loginScreen.style.display = "none";
  dashboard.style.display = "block";
  renderReports("all");
  updateStats();
}

loginForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const email = document.getElementById("email").value;
  const name = document.getElementById("name").value;

  currentUser = { email, name };
  localStorage.setItem("user", JSON.stringify(currentUser));

  loginScreen.style.display = "none";
  dashboard.style.display = "block";

  renderReports("all");
  updateStats();
});

// ===============================
// TABS HANDLER
// ===============================
tabs.forEach(tab => {
  tab.addEventListener("click", () => {
    document.querySelector(".tab.active").classList.remove("active");
    tab.classList.add("active");
    renderReports(tab.dataset.tab);
  });
});

// ===============================
// NEW REPORT FORM TOGGLE
// ===============================
newReportBtn.addEventListener("click", () => {
  newReportForm.style.display = "block";
});
closeFormBtn.addEventListener("click", () => {
  newReportForm.style.display = "none";
  reportForm.reset();
  imagePreview.style.display = "none";
});

// ===============================
// IMAGE UPLOAD HANDLER
// ===============================
imageUpload.addEventListener("click", () => fileInput.click());
fileInput.addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = (ev) => {
      imagePreview.src = ev.target.result;
      imagePreview.style.display = "block";
    };
    reader.readAsDataURL(file);
  }
});

// ===============================
// GET LOCATION
// ===============================
getLocationBtn.addEventListener("click", () => {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        locationText.textContent = `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
      },
      (err) => {
        alert("Unable to get location: " + err.message);
      }
    );
  } else {
    alert("Geolocation not supported in this browser.");
  }
});

// ===============================
// SUBMIT NEW REPORT
// ===============================
reportForm.addEventListener("submit", (e) => {
  e.preventDefault();

  const issueType = document.getElementById("issueType").value;
  const description = document.getElementById("description").value;
  const location = locationText.textContent !== "Not set yet" ? locationText.textContent : "Unknown";

  const newReport = {
    id: Date.now(),
    type: issueType,
    description,
    location,
    status: "pending",
    image: imagePreview.src || null,
    createdAt: new Date().toLocaleString(),
    votes: 0 // ✅ initialize votes
  };

  reports.push(newReport);
  localStorage.setItem("reports", JSON.stringify(reports));

  reportForm.reset();
  imagePreview.style.display = "none";
  newReportForm.style.display = "none";

  renderReports("all");
  updateStats();
});

// ===============================
// RENDER REPORTS (with voting)
// ===============================
function renderReports(filter) {
  reportsList.innerHTML = "";

  let filtered = reports;
  if (filter === "pending") {
    filtered = reports.filter(r => r.status === "pending");
  } else if (filter === "resolved") {
    filtered = reports.filter(r => r.status === "resolved");
  }

  if (filtered.length === 0) {
    reportsList.innerHTML = `<p class="empty">No reports found.</p>`;
    return;
  }

  filtered.forEach((report) => {
    const card = document.createElement("div");
    card.className = "report-card";

    card.innerHTML = `
      <h4>${report.type}</h4>
      <p>${report.description}</p>
      ${report.image ? `<img src="${report.image}" class="report-img">` : ""}
      <p><strong>Location:</strong> ${report.location}</p>
      <p><small>${report.createdAt}</small></p>
      <span class="report-status ${report.status}">
        ${report.status === "pending" ? "Pending" : "Resolved"}
      </span>
      <div class="votes">
        <button class="btn-vote" data-id="${report.id}">
          👍 Vote (<span>${report.votes || 0}</span>)
        </button>
      </div>
    `;

    reportsList.appendChild(card);
  });

  // Handle voting
  document.querySelectorAll(".btn-vote").forEach(btn => {
    btn.addEventListener("click", () => {
      const id = btn.dataset.id;
      reports = reports.map(r => {
        if (r.id == id) {
          r.votes = (r.votes || 0) + 1;
        }
        return r;
      });
      localStorage.setItem("reports", JSON.stringify(reports));
      renderReports(document.querySelector(".tab.active").dataset.tab);
    });
  });
}

// ===============================
// UPDATE STATS
// ===============================
function updateStats() {
  statTotal.textContent = reports.length;
  statPending.textContent = reports.filter(r => r.status === "pending").length;
  statResolved.textContent = reports.filter(r => r.status === "resolved").length;
}
