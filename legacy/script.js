"use strict";

const MAX_DISPLAY = 20;

let appData = null;
let roomInfo = null;
let currentView = "list";
let selectedFilter = null;
let filterCategory = "building";
let searchMode = "rooms";
let canvasCounter = 0;

/**
 * @type {number}
 */
let paginateMax = 0;

/**
 * @type {number}
 */
let displayI = 0;

// DOM Elements
const searchInput = document.getElementById("searchInput");
const loadingIcon = document.querySelector(".loading-icon");
const indexDecreaseButton = document.querySelector("#page-down");
const indexIncreaseButton = document.querySelector("#page-up");
const indexDisplay = document.querySelector("#index-display");

const courseColors = [
  "#2E7D32",
  "#1565C0",
  "#6A1B9A",
  "#C62828",
  "#EF6C00",
  "#00838F",
  "#4527A0",
  "#AD1457",
  "#00695C",
  "#5D4037",
  "#37474F",
  "#1B5E20",
  "#0D47A1",
  "#4A148C",
  "#B71C1C",
];

/**
 *
 * @param {string} courseCode
 * @returns {string}
 */
function getColorForCourse(courseCode) {
  let hash = 0;
  for (let i = 0; i < courseCode.length; i++) {
    hash = courseCode.charCodeAt(i) + ((hash << 5) - hash);
  }
  return courseColors[Math.abs(hash) % courseColors.length];
}

/**
 *
 * @param {string | undefined} scheduleStr
 * @returns
 */
function parseScheduleTime(scheduleStr) {
  if (!scheduleStr || scheduleStr === "TBA") return null;

  const match = scheduleStr.match(
    /^([MTWThFSa]+)\s+(\d{1,2}):(\d{2})\s*(AM|PM)\s*-\s*(\d{1,2}):(\d{2})\s*(AM|PM)$/i,
  );
  if (!match) return null;

  let days = match[1];
  let startHour = parseInt(match[2]);
  let startMin = parseInt(match[3]);
  let startPeriod = match[4].toUpperCase();
  let endHour = parseInt(match[5]);
  let endMin = parseInt(match[6]);
  let endPeriod = match[7].toUpperCase();

  if (startPeriod === "PM" && startHour !== 12) startHour += 12;
  if (startPeriod === "AM" && startHour === 12) startHour = 0;
  if (endPeriod === "PM" && endHour !== 12) endHour += 12;
  if (endPeriod === "AM" && endHour === 12) endHour = 0;

  let formattedStartHour =
    startHour > 12 ? startHour - 12 : startHour === 0 ? 12 : startHour;
  let formattedEndHour =
    endHour > 12 ? endHour - 12 : endHour === 0 ? 12 : endHour;

  let startStr =
    formattedStartHour +
    (startMin > 0 ? ":" + String(startMin).padStart(2, "0") : "");
  let endStr =
    formattedEndHour +
    (endMin > 0 ? ":" + String(endMin).padStart(2, "0") : "");

  return {
    days: days,
    time: startStr + "-" + endStr,
  };
}

async function loadData() {
  try {
    const [appResponse, roomInfoResponse] = await Promise.all([
      fetch("app_data.json"),
      fetch("room_info.json").catch(() => ({ ok: false })),
    ]);

    appData = await appResponse.json();

    if (roomInfoResponse.ok) {
      roomInfo = await roomInfoResponse.json();
    }

    initFilters();
    render();
  } catch (error) {
    document.getElementById("results").innerHTML =
      '<div class="no-results"><h3>Error loading data</h3><p>Could not load room data.</p></div>';
  }
}

function initFilters() {
  document.querySelectorAll(".category-btn").forEach((btn) => {
    btn.onclick = () => {
      document.querySelectorAll(".category-btn").forEach((b) => {
        b.classList.remove("active");
        b.setAttribute("aria-pressed", "false");
      });
      btn.classList.add("active");
      btn.setAttribute("aria-pressed", "true");
      filterCategory = btn.getAttribute("data-category");
      selectedFilter = null;
      renderFilterButtons();
      updateBuildingInfoPanel();
      render();
    };
  });

  renderFilterButtons();
}

function updateBuildingInfoPanel() {
  const panel = document.getElementById("buildingInfoPanel");

  if (
    filterCategory === "building" &&
    selectedFilter &&
    appData.buildings[selectedFilter]
  ) {
    const buildingData = appData.buildings[selectedFilter];
    if (buildingData.directions || buildingData.osm_link) {
      let titleText = selectedFilter;
      if (buildingData.aka) {
        titleText += ` <span class="building-aka">(${buildingData.aka})</span>`;
      }

      let html = `<h3>${titleText}</h3>`;

      if (buildingData.directions) {
        html += `<p>${buildingData.directions}</p>`;
      }

      if (buildingData.lat && buildingData.lon) {
        const mapImageUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${buildingData.lon - 0.002}%2C${buildingData.lat - 0.001}%2C${buildingData.lon + 0.002}%2C${buildingData.lat + 0.001}&layer=mapnik&marker=${buildingData.lat}%2C${buildingData.lon}`;

        html += `
                            <div class="map-container">
                                <iframe 
                                    src="${mapImageUrl}"
                                    class="map-iframe"
                                    loading="lazy"
                                    title="Map showing location of ${selectedFilter}"
                                ></iframe>
                            </div>
                        `;

        const googleMapsLink = `https://www.google.com/maps?q=${buildingData.lat},${buildingData.lon}`;

        html += `
                            <div class="map-links">
                                <a href="${googleMapsLink}" 
                                   target="_blank" 
                                   rel="noopener" 
                                   class="map-link"
                                   aria-label="View ${selectedFilter} on Google Maps">
                                    View on Google Maps
                                </a>
                        `;

        if (buildingData.osm_link) {
          html += `
                                <a href="${buildingData.osm_link}" 
                                   target="_blank" 
                                   rel="noopener" 
                                   class="map-link"
                                   aria-label="View ${selectedFilter} on OpenStreetMap">
                                    View on OpenStreetMap
                                </a>
                            `;
        }

        html += `</div>`;
      }

      panel.innerHTML = html;
      panel.classList.add("visible");
      return;
    }
  }

  panel.classList.remove("visible");
  panel.innerHTML = "";
}

function renderFilterButtons() {
  const filtersContainer = document.getElementById("unitFilters");
  filtersContainer.innerHTML = "";

  let items;
  if (filterCategory === "building") {
    items = Object.keys(appData.buildings || {}).sort();
  } else if (filterCategory === "college") {
    items = Object.keys(appData.colleges || {}).sort();
  } else {
    items = Object.keys(appData.divisions || {}).sort();
  }

  const allBtn = document.createElement("button");
  allBtn.className = "filter-btn" + (selectedFilter === null ? " active" : "");
  allBtn.textContent = "All";
  allBtn.setAttribute(
    "aria-pressed",
    selectedFilter === null ? "true" : "false",
  );
  allBtn.onclick = () => {
    selectedFilter = null;
    document.querySelectorAll(".filter-btn").forEach((b) => {
      b.classList.remove("active");
      b.setAttribute("aria-pressed", "false");
    });
    allBtn.classList.add("active");
    allBtn.setAttribute("aria-pressed", "true");
    updateBuildingInfoPanel();
    displayI = 0
    render();
  };
  filtersContainer.appendChild(allBtn);

  items.forEach((item) => {
    const btn = document.createElement("button");
    btn.className = "filter-btn" + (selectedFilter === item ? " active" : "");
    btn.setAttribute(
      "aria-pressed",
      selectedFilter === item ? "true" : "false",
    );
    let displayName = item;
    if (item.includes(" - ")) {
      displayName = item.split(" - ")[0];
    } else if (item.startsWith("Institute of ")) {
      displayName = item.replace("Institute of ", "");
    } else if (item.startsWith("Institute for ")) {
      displayName = item.replace("Institute for ", "");
    } else if (item.startsWith("College of ")) {
      displayName = item.replace("College of ", "");
    } else if (item.startsWith("Department of ")) {
      displayName = item.replace("Department of ", "D. ");
    } else if (item.endsWith(" Building")) {
      displayName = item.replace(" Building", "");
    }
    btn.textContent = displayName;
    btn.title = item;
    btn.onclick = () => {
      selectedFilter = item;
      document.querySelectorAll(".filter-btn").forEach((b) => {
        b.classList.remove("active");
        b.setAttribute("aria-pressed", "false");
      });
      btn.classList.add("active");
      btn.setAttribute("aria-pressed", "true");
      updateBuildingInfoPanel();
      displayI = 0;
      render();
    };
    filtersContainer.appendChild(btn);
  });
}

function getFilteredRooms() {
  const searchTerm = searchInput.value.toLowerCase().trim();
  let rooms = Object.entries(appData.rooms);

  if (selectedFilter) {
    if (filterCategory === "building") {
      rooms = rooms.filter(([name, data]) => data.building === selectedFilter);
    } else if (filterCategory === "college") {
      rooms = rooms.filter(([name, data]) => data.college === selectedFilter);
    } else {
      rooms = rooms.filter(([name, data]) => data.division === selectedFilter);
    }
  }

  if (searchTerm) {
    rooms = rooms.filter(([name, data]) => {
      if (name.toLowerCase().includes(searchTerm)) return true;

      if (data.building && data.building.toLowerCase().includes(searchTerm))
        return true;

      if (data.college && data.college.toLowerCase().includes(searchTerm))
        return true;

      if (data.division && data.division.toLowerCase().includes(searchTerm))
        return true;

      for (const cls of data.classes) {
        if (cls.course_code.toLowerCase().includes(searchTerm)) return true;
        if (cls.course_title.toLowerCase().includes(searchTerm)) return true;
      }

      return false;
    });
  }

  if (!searchTerm.includes("tba") && !searchTerm.includes("online")) {
    rooms = rooms.filter(
      ([name, data]) => data.building || data.division || data.college,
    );
  }
  paginateMax = Math.floor((rooms.length - 1) / MAX_DISPLAY) + 1;
  return rooms;
}

function render() {
  if (searchMode === "courses") {
    renderCourseSearch();
  } else {
    renderRoomSearch();
  }
  loadingIcon.classList.remove("visible");

  if (displayI === paginateMax - 1) indexIncreaseButton.disabled = true;
  else indexIncreaseButton.disabled = false;

  if (displayI === 0) indexDecreaseButton.disabled = true;
  else indexDecreaseButton.disabled = false;

  indexDisplay.textContent = `${displayI + 1} of ${paginateMax}`;
}

function renderCourseSearch() {
  const searchTerm = searchInput.value.toLowerCase().trim();
  const resultsContainer = document.getElementById("results");
  const statsContainer = document.getElementById("stats");

  if (!searchTerm || searchTerm.length < 2) {
    statsContainer.textContent =
      "Enter a course code to search (e.g., CMSC 21, CHEM 16)";
    resultsContainer.innerHTML = `
                    <div class="no-results">
                        <h3>Search for classes by course code</h3>
                        <p>Type a course code like "CMSC 21" or "CHEM" to find all classes and their rooms.</p>
                    </div>
                `;
    return;
  }

  const matchingClasses = [];
  Object.entries(appData.rooms).forEach(([roomName, roomData]) => {
    roomData.classes.forEach((cls) => {
      if (
        cls.course_code.toLowerCase().includes(searchTerm) ||
        cls.course_title.toLowerCase().includes(searchTerm)
      ) {
        matchingClasses.push({
          ...cls,
          room: roomName,
          building: roomData.building,
          college: roomData.college,
          division: roomData.division,
        });
      }
    });
  });

  matchingClasses.sort((a, b) => {
    const codeCompare = a.course_code.localeCompare(b.course_code);
    if (codeCompare !== 0) return codeCompare;
    return a.section.localeCompare(b.section);
  });

  statsContainer.textContent = `${matchingClasses.length} classes found for "${searchTerm}"`;

  if (matchingClasses.length === 0) {
    resultsContainer.innerHTML = `
                    <div class="no-results">
                        <h3>No classes found</h3>
                        <p>No classes matching "${searchTerm}" were found.</p>
                    </div>
                `;
    return;
  }

  const grouped = {};
  matchingClasses.forEach((cls) => {
    if (!grouped[cls.course_code]) {
      grouped[cls.course_code] = [];
    }
    grouped[cls.course_code].push(cls);
  });

  let html = "";
  Object.keys(grouped)
    .sort()
    .forEach((courseCode) => {
      const classes = grouped[courseCode];
      const title = classes[0].course_title;

      html += `<div class="unit-section">`;
      html += `<div class="unit-header">${courseCode} - ${title} (${classes.length} sections)</div>`;

      classes.forEach((cls) => {
        html += `
<div class="course-result">
    <div class="course-header">
        <div>
            <div class="course-code-title">${cls.course_code} ${cls.type ? `(${cls.type})` : ""}</div>
            <div class="course-title">Section ${cls.section}</div>
        </div>
        <div class="course-room-link" onclick="switchToRoomAndSearch('${cls.room.replace(/'/g, "\\'")}')">
            ${cls.room}
        </div>
    </div>
    <div class="course-details">
        <strong>Schedule:</strong> ${cls.schedule.join(", ") || "TBA"}<br>
        <strong>Building:</strong> ${cls.building || "Unknown"}<br>
        <strong>College:</strong> ${cls.college || "Unknown"}<br>
        <strong>Division:</strong> ${cls.division || "Unknown"}
    </div>
</div>
`;
      });

      html += `</div>`;
    });

  resultsContainer.innerHTML = html;
}

/**
 *
 * @param {string} roomName
 */
function switchToRoomAndSearch(roomName) {
  document.querySelector('input[name="searchMode"][value="rooms"]').checked =
    true;
  searchMode = "rooms";
  searchInput.value = roomName;
  render();
}

function renderRoomSearch() {
  const rooms = getFilteredRooms();
  const resultsContainer = document.getElementById("results");
  const statsContainer = document.getElementById("stats");

  const totalClasses = rooms.reduce(
    (sum, [_, data]) => sum + data.classes.length,
    0,
  );
  statsContainer.textContent = `${rooms.length} rooms found, ${totalClasses} classes this semester`;

  if (rooms.length === 0) {
    resultsContainer.innerHTML = `
                    <div class="no-results">
                        <h3>No rooms found</h3>
                        <p>Try a different search term or filter.</p>
                    </div>
                `;
    return;
  }
  if (currentView === "grouped") {
    renderGrouped(
      rooms.slice(displayI * MAX_DISPLAY, (displayI + 1) * MAX_DISPLAY),
      resultsContainer,
    );
  } else {
    renderList(
      rooms.slice(displayI * MAX_DISPLAY, (displayI + 1) * MAX_DISPLAY),
      resultsContainer,
    );
  }
}

function renderList(rooms, container) {
  rooms.sort((a, b) => a[0].localeCompare(b[0]));

  container.innerHTML = rooms
    .map(([name, data]) => createRoomCard(name, data))
    .join("");
  attachCardListeners();
}

function renderGrouped(rooms, container) {
  const grouped = {};
  rooms.forEach(([name, data]) => {
    let groupKey;
    if (filterCategory === "building") {
      groupKey = data.building || "Unknown Building";
    } else if (filterCategory === "college") {
      groupKey = data.college || "Unknown College";
    } else {
      groupKey = data.division || "Unknown Division";
    }
    if (!grouped[groupKey]) {
      grouped[groupKey] = [];
    }
    grouped[groupKey].push([name, data]);
  });

  const sortedGroups = Object.keys(grouped).sort();

  let html = "";
  sortedGroups.forEach((group) => {
    const groupRooms = grouped[group].sort((a, b) => a[0].localeCompare(b[0]));
    html += `
                    <div class="unit-section">
                        <div class="unit-header">${group} (${groupRooms.length})</div>
                        ${groupRooms.map(([name, data]) => createRoomCard(name, data)).join("")}
                    </div>
                `;
  });

  container.innerHTML = html;
  attachCardListeners();
}

function getRoomInfo(roomName) {
  let result = null;

  if (roomInfo && roomInfo.rooms && roomInfo.rooms[roomName]) {
    result = { ...roomInfo.rooms[roomName] };
  }

  if (!result && roomInfo) {
    for (const [pattern, info] of Object.entries(
      roomInfo.room_code_patterns || {},
    )) {
      if (roomName.startsWith(pattern) || roomName.includes(pattern)) {
        result = {
          building: info.building,
          floor_hint: info.floor_hint,
          pattern_meaning: info.meaning,
        };
        break;
      }
    }
  }

  if (appData && appData.rooms && appData.rooms[roomName]) {
    const roomData = appData.rooms[roomName];
    if (!result) result = {};

    if (roomData.building && !result.building) {
      result.building = roomData.building;
    }
    if (roomData.directions) {
      result.directions = roomData.directions;
    }
    if (roomData.floor) {
      result.floor = roomData.floor;
    }
    if (roomData.note) {
      result.note = roomData.note;
    }
  }

  if (
    result &&
    result.building &&
    !result.directions &&
    appData &&
    appData.buildings
  ) {
    const buildingData = appData.buildings[result.building];
    if (buildingData && buildingData.directions) {
      result.building_directions = buildingData.directions;
    }
  }

  return result;
}

function createRoomCard(name, data) {
  const classCount = data.classes.length;
  const classCountText =
    classCount === 0
      ? "No classes"
      : classCount === 1
        ? "1 class"
        : `${classCount} classes`;

  const canvasId = "schedule-" + ++canvasCounter;
  const safeRoomName = name.replace(/'/g, "\\'").replace(/"/g, "&quot;");

  const hasSchedule =
    classCount > 0 &&
    data.classes.some(
      (cls) =>
        cls.schedule &&
        cls.schedule.length > 0 &&
        cls.schedule.some((s) => s && s !== "TBA" && parseScheduleTime(s)),
    );

  let detailsHtml = "";

  const info = getRoomInfo(name);
  let roomInfoHtml = "";

  if (info) {
    roomInfoHtml = `<div class="room-info">`;

    if (info.full_name || info.pattern_meaning) {
      roomInfoHtml += `<div class="room-info-grid">`;

      if (info.full_name) {
        roomInfoHtml += `
                            <div class="room-info-label">Full Name:</div>
                            <div class="room-info-value">${info.full_name}</div>
                        `;
      }
      if (info.building) {
        roomInfoHtml += `
                            <div class="room-info-label">Building:</div>
                            <div class="room-info-value">${info.building}</div>
                        `;
      }
      if (info.floor) {
        roomInfoHtml += `
                            <div class="room-info-label">Floor:</div>
                            <div class="room-info-value">${info.floor}</div>
                        `;
      }
      if (info.floor_hint) {
        roomInfoHtml += `
                            <div class="room-info-label">Floor Hint:</div>
                            <div class="room-info-value">${info.floor_hint}</div>
                        `;
      }
      if (info.type) {
        roomInfoHtml += `
                            <div class="room-info-label">Type:</div>
                            <div class="room-info-value">${info.type}</div>
                        `;
      }
      if (info.coordinates) {
        roomInfoHtml += `
                            <div class="room-info-label">Coordinates:</div>
                            <div class="room-info-value">${info.coordinates}</div>
                        `;
      }

      roomInfoHtml += `</div>`;
    }

    if (info.directions) {
      roomInfoHtml += `
                        <div class="room-directions">
                            <div class="room-directions-title">📍 Directions</div>
                            <div class="room-directions-text">${info.directions}</div>
                        </div>
                    `;
    } else if (info.building_directions) {
      roomInfoHtml += `
                        <div class="room-directions">
                            <div class="room-directions-title">📍 How to Get to ${info.building}</div>
                            <div class="room-directions-text">${info.building_directions}</div>
                        </div>
                    `;
    } else if (
      info.building &&
      roomInfo &&
      roomInfo.buildings &&
      roomInfo.buildings[info.building]
    ) {
      const buildingInfo = roomInfo.buildings[info.building];
      roomInfoHtml += `
                        <div class="room-directions">
                            <div class="room-directions-title">📍 How to Get There</div>
                            <div class="room-directions-text">${buildingInfo.general_directions}</div>
                        </div>
                    `;
    }

    if (info.note) {
      roomInfoHtml += `
                        <div class="room-note">
                            <strong>💡 Note:</strong> ${info.note}
                        </div>
                    `;
    }

    roomInfoHtml += `</div>`;
  }

  if (classCount > 0) {
    let scheduleHtml = "";
    if (hasSchedule) {
      scheduleHtml = `
                        <div class="schedule-canvas-container">
                            <canvas id="${canvasId}" width="800" height="450"></canvas>
                        </div>
                    `;
    } else {
      scheduleHtml = `<div class="no-schedule">No fixed schedule available for this room</div>`;
    }

    detailsHtml = `
                    <div class="room-details">
                        ${roomInfoHtml}
                        ${scheduleHtml}
                        <div class="class-list-header">Classes in this room</div>
                        <div class="class-list">
                            ${data.classes
                              .map(
                                (cls) => `
                                <div class="class-item">
                                    <div class="class-info">
                                        <div class="class-code">${cls.course_code} ${cls.type ? `(${cls.type})` : ""}</div>
                                        <div class="class-title">${cls.course_title}</div>
                                        <div class="class-section">Section ${cls.section}</div>
                                    </div>
                                    <div class="class-schedule">${cls.schedule.join("<br>") || "TBA"}</div>
                                </div>
                            `,
                              )
                              .join("")}
                        </div>
                    </div>
                `;
  } else if (roomInfoHtml) {
    detailsHtml = `
                    <div class="room-details">
                        ${roomInfoHtml}
                        <div class="no-schedule">No classes scheduled in this room this semester</div>
                    </div>
                `;
  }

  let locationParts = [];
  if (data.building) locationParts.push(data.building);
  if (data.college) locationParts.push(data.college.replace("College of ", ""));
  if (data.division) {
    let div = data.division
      .replace("Institute of ", "")
      .replace("Institute for ", "")
      .replace("Department of ", "D. ");
    locationParts.push(div);
  }

  let locationText =
    locationParts.length > 0 ? locationParts.join(" • ") : "Unknown Location";

  if (data.floor) {
    locationText += ` (${data.floor})`;
  }

  let roomDirectionsHtml = "";
  if (data.directions) {
    roomDirectionsHtml = `<div class="room-directions">${data.directions}</div>`;
  }

  return `
                <div class="room-card" data-room="${safeRoomName}" data-canvas="${hasSchedule ? canvasId : ""}" data-has-schedule="${hasSchedule}">
                    <div class="room-header">
                        <div>
                            <div class="room-name">${name}</div>
                            <div class="room-unit">${locationText}</div>
                            ${roomDirectionsHtml}
                        </div>
                        <div class="room-class-count">${classCountText}</div>
                    </div>
                    ${detailsHtml}
                </div>
            `;
}

function attachCardListeners() {
  document.querySelectorAll(".room-card").forEach((card) => {
    card.onclick = () => {
      const wasExpanded = card.classList.contains("expanded");
      const roomName = card.getAttribute("data-room");
      const canvasId = card.getAttribute("data-canvas");
      const hasSchedule = card.getAttribute("data-has-schedule") === "true";

      document
        .querySelectorAll(".room-card")
        .forEach((c) => c.classList.remove("expanded"));

      if (!wasExpanded) {
        card.classList.add("expanded");

        if (hasSchedule && canvasId && roomName && appData.rooms[roomName]) {
          setTimeout(() => {
            drawRoomSchedule(canvasId, appData.rooms[roomName].classes);
          }, 50);
        }
      }
    };
  });
}

function drawRoomSchedule(canvasId, classes) {
  try {
    const renderer = new ScheduleRenderer(canvasId, {
      width: 800,
      height: 450,
    });

    classes.forEach((cls) => {
      if (!cls.schedule || cls.schedule.length === 0) return;

      cls.schedule.forEach((schedStr) => {
        const parsed = parseScheduleTime(schedStr);
        if (!parsed) return;

        const color = getColorForCourse(cls.course_code);
        const label = cls.course_code + (cls.type ? " (" + cls.type + ")" : "");

        renderer.addCourse({
          day: parsed.days,
          time: parsed.time,
          courseCode: label,
          section: cls.section,
          color: color,
        });
      });
    });
  } catch (e) {
    console.error("Failed to draw schedule:", e);
  }
}

const handleRender = debounce(render, 500);

/**
 *
 * @param {"increment" | "decrement"} type
 * @returns {EventListener}
 */
function handlePagination(type) {
  return function (e) {
    if (type === "increment" && displayI < paginateMax - 1) displayI++;
    else if (type === "decrement" && displayI > 0) displayI--;
    else {
      e.currentTarget.disabled = true;
      return;
    }
    console.log();

    render();

    window.scrollTo({
      top:
        window.scrollY +
        document.querySelector(".stats").getBoundingClientRect().top,
      behavior: "smooth",
    });
  };
}

searchInput.addEventListener("input", () => {
  loadingIcon.classList.add("visible");
  displayI = 0;
  indexDisplay.textContent = displayI + 1;
  handleRender();
});

indexDecreaseButton.addEventListener("click", handlePagination("decrement"));
indexIncreaseButton.addEventListener("click", handlePagination("increment"));

document.querySelectorAll('input[name="searchMode"]').forEach((radio) => {
  radio.addEventListener("change", (e) => {
    searchMode = e.target.value;
    render();
  });
});

document.querySelectorAll(".view-btn").forEach((btn) => {
  btn.onclick = () => {
    document
      .querySelectorAll(".view-btn")
      .forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    currentView = btn.dataset.view;
    render();
  };
});

loadData();
