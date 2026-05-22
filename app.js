let scenarios = [];
let currentScenario = null;
let running = false;
let interval = null;
let logs = [];

const sea = document.getElementById("sea");

function getValue(id) {
    return Number(document.getElementById(id).value);
}

function createSpeedRuns() {
    scenarios = [];

    const scenarioName =
        document.getElementById("scenarioName").value.trim() || "Scenario";

    const minSpeed = getValue("shipSpeedMin");
    const maxSpeed = getValue("shipSpeedMax");

    for (let speed = minSpeed; speed <= maxSpeed; speed++) {
        scenarios.push({
            name: `${scenarioName} - ${speed} knots`,
            friendly: [getValue("friendlyX"), getValue("friendlyY")],
            safeZone: [getValue("safeX"), getValue("safeY")],
            friendlySpeed: speed,
            enemy: [getValue("enemyX"), getValue("enemyY")],
            enemySpeed: getValue("enemySpeed"),
            tick: 0,
            finished: false,
            result: "Not Started",
            messages: []
        });
    }

    renderSpeedButtons();
}

function renderSpeedButtons() {
    const container = document.getElementById("speedRuns");

    container.innerHTML = `
        <div class="speed-header">
            <h2>Available Speed Simulations</h2>
            <button id="toggleSpeedsBtn">Hide Speeds</button>
        </div>
        <div id="speedButtonsContainer" class="speed-buttons-container"></div>
    `;

    const speedContainer = document.getElementById("speedButtonsContainer");

    scenarios.forEach((scenario, index) => {
        const btn = document.createElement("button");
        btn.textContent = `${scenario.friendlySpeed} knots`;

        btn.onclick = () => {
            loadScenario(index);

            document
                .querySelectorAll(".speed-buttons-container button")
                .forEach(button => button.classList.remove("selected-speed"));

            btn.classList.add("selected-speed");
        };

        speedContainer.appendChild(btn);
    });

    document.getElementById("toggleSpeedsBtn").addEventListener("click", () => {
        const isHidden = speedContainer.style.display === "none";

        speedContainer.style.display = isHidden ? "flex" : "none";
        document.getElementById("toggleSpeedsBtn").textContent =
            isHidden ? "Hide Speeds" : "Show Speeds";
    });
}

function loadScenario(index) {
    currentScenario = structuredClone(scenarios[index]);
    logs = [];

    document.getElementById("active-simulation").textContent =
        `Active Simulation: ${currentScenario.name}`;

    addMessage(`Loaded ${currentScenario.name}. Press Play to start.`);

    render();
}

function playSimulation() {
    if (!currentScenario || running) return;

    running = true;

    interval = setInterval(() => {
        tickSimulation();
        render();

        if (currentScenario.finished) {
            pauseSimulation();
        }
    }, 500);
}

function pauseSimulation() {
    running = false;
    clearInterval(interval);
}

function resetSimulation() {
    if (!currentScenario) return;

    const speed = currentScenario.friendlySpeed;
    const index = scenarios.findIndex(s => s.friendlySpeed === speed);

    if (index >= 0) {
        loadScenario(index);
    }
}

function tickSimulation() {
    if (!currentScenario || currentScenario.finished) return;

    currentScenario.tick++;

    moveTowards(
        currentScenario.friendly,
        currentScenario.safeZone,
        currentScenario.friendlySpeed
    );

    moveTowards(
        currentScenario.enemy,
        currentScenario.friendly,
        currentScenario.enemySpeed
    );

    const separation =
        distance(currentScenario.friendly, currentScenario.enemy);

    const safeDistance =
        distance(currentScenario.friendly, currentScenario.safeZone);

    if (separation <= 1) {
        currentScenario.finished = true;
        currentScenario.result = "Mission Fail - Torpedo intercepted ship";
        addMessage("Torpedo intercepted the friendly vessel.");
    } else if (safeDistance <= 1) {
        currentScenario.finished = true;
        currentScenario.result = "Mission Success - Ship reached safe zone";
        addMessage("Friendly vessel reached the safe zone.");
    } else {
        addMessage(`Ship separation from torpedo: ${separation.toFixed(2)} NM`);
    }

    logState(separation, safeDistance);
}

function moveTowards(pos, target, speedKnots) {
    const nmPerMinute = speedKnots / 60;
    const moveDistance = nmPerMinute;

    const dx = target[0] - pos[0];
    const dy = target[1] - pos[1];

    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist === 0) return;

    const ratio = Math.min(moveDistance / dist, 1);

    pos[0] += dx * ratio;
    pos[1] += dy * ratio;
}

function distance(a, b) {
    const dx = a[0] - b[0];
    const dy = a[1] - b[1];

    return Math.sqrt(dx * dx + dy * dy);
}

function addMessage(message) {
    currentScenario.messages.push(
        `Minute ${currentScenario.tick}: ${message}`
    );
}

function logState(separation, safeDistance) {
    const latestMessage =
        currentScenario.messages[currentScenario.messages.length - 1] || "Running";

    logs.push({
        scenario: currentScenario.name,
        minute: currentScenario.tick,
        ship_x: currentScenario.friendly[0].toFixed(2),
        ship_y: currentScenario.friendly[1].toFixed(2),
        torpedo_x: currentScenario.enemy[0].toFixed(2),
        torpedo_y: currentScenario.enemy[1].toFixed(2),
        ship_speed: currentScenario.friendlySpeed,
        torpedo_speed: currentScenario.enemySpeed,
        separation: separation.toFixed(2),
        distance_to_safe_zone: safeDistance.toFixed(2),
        result: latestMessage
    });
}

function render() {
    if (!currentScenario) return;

    const latestMessage =
        currentScenario.messages[currentScenario.messages.length - 1] ||
        "No messages yet";

    document.getElementById("tick").textContent =
        `Minutes passed: ${currentScenario.tick}`;

    document.getElementById("status").textContent =
        `Status: ${latestMessage}`;

    const messageLog = document.getElementById("message-log");

    messageLog.innerHTML =
        currentScenario.messages.map(msg => `<p>${msg}</p>`).join("");

    messageLog.scrollTop = messageLog.scrollHeight;

    renderSea();
}

function renderSea() {
    sea.innerHTML = "";

    const ship = document.createElement("img");
    ship.src = "images/friendly.png";
    ship.className = "unit ship";
    ship.style.left = `${currentScenario.friendly[0]}%`;
    ship.style.top = `${currentScenario.friendly[1]}%`;

    const enemy = document.createElement("img");
    enemy.src = "images/enemy.png";
    enemy.className = "unit enemy";
    enemy.style.left = `${currentScenario.enemy[0]}%`;
    enemy.style.top = `${currentScenario.enemy[1]}%`;

    const safeZone = document.createElement("div");
    safeZone.className = "safe-zone";
    safeZone.style.left = `${currentScenario.safeZone[0]}%`;
    safeZone.style.top = `${currentScenario.safeZone[1]}%`;

    sea.appendChild(safeZone);
    sea.appendChild(ship);
    sea.appendChild(enemy);
}

function downloadLogs() {
    if (logs.length === 0) return;

    const headers = Object.keys(logs[0]);

    const csvRows = [
        headers.join(","),
        ...logs.map(row =>
            headers.map(h => `"${String(row[h]).replaceAll('"', '""')}"`).join(",")
        )
    ];

    const blob = new Blob(
        [csvRows.join("\n")],
        { type: "text/csv" }
    );

    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");

    a.href = url;
    a.download =
        `${currentScenario.name.replaceAll(" ", "_")}_logs.csv`;

    a.click();

    URL.revokeObjectURL(url);
}