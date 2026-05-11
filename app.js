const PUBLIC_DIR = "Public";

const topics = [
  {
    title: "Health Information Systems",
    code: "HIS",
    aliases: ["HIP", "HIS"],
    files: {
      V: ["HIS_V.mp4", "HIS_V2.mp4", "HIS_V3.mp4"],
      P: "HIS_P.m4a",
      I: "HIS_I.png",
      Q: "HIS_Q.csv",
    },
  },
  {
    title: "Electronic Medical Records",
    code: "EMR",
    aliases: ["HMR", "EMR", "EHR"],
    files: {
      V: "EHR_Vx.mp4",
      P: "EMR_P.m4a",
      I: "EMR_Ix.png",
      Q: "EMR_Q.csv",
    },
  },
  {
    title: "Privacy and Security",
    code: "PS",
    aliases: ["PS"],
    files: {
      V: "PS_V.mp4",
      P: "PS_P.m4a",
      I: "PS_Ix.png",
      Q: "PS_Q.csv",
    },
  },
  {
    title: "DataBase and SQL",
    code: "DS",
    aliases: ["DS"],
    files: {
      V: "DS_V.mp4",
      P: "DS_P.m4a",
      I: "DS_Ix.png",
      Q: "DS_Q.csv",
    },
  },
  {
    title: "Data Mining",
    code: "DM",
    aliases: ["DM"],
    files: {
      V: "DM_V.mp4",
      P: "DM_P.m4a",
      I: "DM_Ix.png",
      Q: "DM_Q.csv",
    },
  },
];

const resources = [
  { type: "V", label: "Video", icon: "[V]" },
  { type: "P", label: "Podcast", icon: "[P]" },
  { type: "I", label: "Infographic", icon: "[I]" },
  { type: "Q", label: "Questions", icon: "[Q]" },
];

const extensionsByResource = {
  V: ["mp4"],
  P: ["m4a"],
  I: ["png"],
  Q: ["csv"],
};

const state = {
  activeTopicCode: null,
  activeResourceType: null,
  questions: [],
  questionIndex: 0,
};

const treeElement = document.querySelector("#tree");
const contentElement = document.querySelector("#content");

function renderTree() {
  treeElement.innerHTML = "";

  const root = document.createElement("div");
  root.className = "tree-root";
  root.textContent = "Information Processing";
  treeElement.appendChild(root);

  topics.forEach((topic) => {
    const topicWrapper = document.createElement("div");
    topicWrapper.className = "tree-topic";

    const topicButton = document.createElement("button");
    topicButton.type = "button";
    topicButton.className = "topic-button";
    topicButton.dataset.topic = topic.code;
    topicButton.innerHTML = `<span class="topic-title">${topic.title}</span>`;
    topicButton.addEventListener("click", () => showTopic(topic));

    topicWrapper.appendChild(topicButton);
    treeElement.appendChild(topicWrapper);
  });
}

function showTopic(topic) {
  state.activeTopicCode = topic.code;
  state.activeResourceType = null;
  setActiveTopicButton(topic.code);

  contentElement.innerHTML = `
    <p class="eyebrow">Class</p>
    <h2>${topic.title}</h2>
    <p>Choose the resource you want to open for this class.</p>
    <div class="resource-actions">
      ${resources
        .map(
          (resource) => `
            <button class="content-resource-button" type="button" data-resource="${resource.type}">
              <span class="resource-icon">${resource.icon}</span>
              <span>${resource.label}</span>
            </button>
          `,
        )
        .join("")}
    </div>
  `;

  contentElement.querySelectorAll(".content-resource-button").forEach((button) => {
    const resource = resources.find((item) => item.type === button.dataset.resource);
    button.addEventListener("click", () => openResource(topic, resource));
  });
}

async function openResource(topic, resource) {
  state.activeTopicCode = topic.code;
  state.activeResourceType = resource.type;
  setActiveTopicButton(topic.code);

  if (resource.type === "Q") {
    await openQuestions(topic);
    return;
  }

  const paths = getResourcePaths(topic, resource.type);

  if (resource.type === "V" && paths.length > 1) {
    renderVideoChoices(topic, resource, paths);
    return;
  }

  renderMediaResource(topic, resource, paths[0]);
}

function setActiveTopicButton(topicCode) {
  document.querySelectorAll(".topic-button").forEach((button) => {
    button.classList.toggle("active", button.dataset.topic === topicCode);
  });
}

async function openQuestions(topic) {
  if (window.location.protocol === "file:") {
    renderQuestionsFileModeMessage(topic);
    return;
  }

  contentElement.innerHTML = `
    <p class="eyebrow">Questions</p>
    <h2>Loading questions...</h2>
    <p>Reading the questions file.</p>
  `;

  try {
    const csv = await fetchFirstText(topic, "Q");
    state.questions = parseQuestions(csv.text);
    state.questionIndex = 0;

    if (state.questions.length === 0) {
      throw new Error("The questions file does not contain valid questions.");
    }

    renderQuestion(topic);
  } catch (error) {
    contentElement.innerHTML = `
      ${renderBackButtonHtml()}
      <p class="eyebrow">Questions</p>
      <h2>Questions could not be opened</h2>
      <div class="missing-resource">
        <p>${error.message}</p>
        <p>Please check that the questions file is available.</p>
      </div>
    `;
    bindBackButton(topic);
  }
}

function renderQuestionsFileModeMessage(topic) {
  contentElement.innerHTML = `
    ${renderBackButtonHtml()}
    <p class="eyebrow">Questions</p>
    <h2>Questions need the local server</h2>
    <div class="missing-resource">
      <p>
        The question files are available, but the browser blocks CSV loading when
        this page is opened directly from the file system.
      </p>
      <p>Open the app with <strong>start-app.bat</strong> and then use Questions again.</p>
    </div>
  `;

  bindBackButton(topic);
}

function renderQuestion(topic) {
  const current = state.questions[state.questionIndex];
  const total = state.questions.length;
  const currentNumber = state.questionIndex + 1;

  contentElement.innerHTML = `
    ${renderBackButtonHtml()}
    <p class="eyebrow">Questions</p>
    <h2>${topic.title}</h2>
    <div class="question-card">
      <div class="question-number">Question ${currentNumber} / ${total}</div>
      <p class="question-text">${escapeHtml(current.question)}</p>
      <p class="answer">${escapeHtml(current.answer)}</p>
    </div>
    <div class="question-nav">
      <button class="arrow-button" id="previousQuestion" type="button" aria-label="Previous question">←</button>
      <span class="status">${currentNumber} / ${total}</span>
      <button class="arrow-button" id="nextQuestion" type="button" aria-label="Next question">→</button>
    </div>
  `;

  bindBackButton(topic);

  const previousButton = document.querySelector("#previousQuestion");
  const nextButton = document.querySelector("#nextQuestion");

  previousButton.disabled = state.questionIndex === 0;
  nextButton.disabled = state.questionIndex === total - 1;

  previousButton.addEventListener("click", () => {
    if (state.questionIndex > 0) {
      state.questionIndex -= 1;
      renderQuestion(topic);
    }
  });

  nextButton.addEventListener("click", () => {
    if (state.questionIndex < total - 1) {
      state.questionIndex += 1;
      renderQuestion(topic);
    }
  });
}

async function fetchFirstText(topic, type) {
  const candidates = getCandidates(topic, type);
  let lastError = null;

  for (const candidate of candidates) {
    try {
      const response = await fetch(candidate, { cache: "no-store" });
      if (response.ok) {
        return {
          path: candidate,
          text: await response.text(),
        };
      }
      lastError = new Error("The requested resource was not found.");
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError || new Error("The requested resource was not found.");
}

function getCandidates(topic, type) {
  const extensions = extensionsByResource[type] || [];
  const codes = [...new Set([topic.code, ...topic.aliases])];
  const configuredFile = topic.files?.[type];
  const configuredFiles = Array.isArray(configuredFile)
    ? configuredFile
    : [configuredFile].filter(Boolean);
  const configuredPath = configuredFiles.map((file) => `${PUBLIC_DIR}/${file}`);
  const suffixes = getSuffixes(type);

  if (configuredPath.length > 0) {
    return configuredPath;
  }

  const generatedPaths = codes.flatMap((code) =>
    suffixes.flatMap((suffix) =>
      extensions.map((extension) => `${PUBLIC_DIR}/${code}_${suffix}.${extension}`),
    ),
  );

  return [...new Set([...configuredPath, ...generatedPaths])];
}

function getResourcePaths(topic, type) {
  return getCandidates(topic, type);
}

function getSuffixes(type) {
  if (type === "V" || type === "I") {
    return [type, `${type}x`];
  }

  return [type];
}

function renderMediaResource(topic, resource, path, backOptions = {}) {
  const extension = path.split(".").pop().toLowerCase();
  const title = `${topic.title} - ${resource.label}`;

  let body = "";

  if (resource.type === "V") {
    body = `
      <video class="media" controls>
        <source src="${path}" type="video/${extension}">
        Your browser does not support HTML5 video.
      </video>
    `;
  } else if (resource.type === "P") {
    body = `
      <audio class="media" controls src="${path}">
        Your browser does not support HTML5 audio.
      </audio>
    `;
  } else if (["png", "jpg", "jpeg", "webp", "gif", "svg"].includes(extension)) {
    body = `<img class="media" src="${path}" alt="${title}" />`;
  } else {
    body = `<iframe class="resource-frame" src="${path}" title="${title}"></iframe>`;
  }

  contentElement.innerHTML = `
    ${renderBackButtonHtml(backOptions.label)}
    <p class="eyebrow">${resource.label}</p>
    <h2>${title}</h2>
    ${body}
  `;

  bindBackButton(topic, backOptions.onBack);
}

function renderVideoChoices(topic, resource, paths) {
  contentElement.innerHTML = `
    ${renderBackButtonHtml()}
    <p class="eyebrow">Video</p>
    <h2>${topic.title}</h2>
    <p>Choose the video you want to open.</p>
    <div class="resource-actions">
      ${paths
        .map(
          (_path, index) => `
            <button class="content-resource-button" type="button" data-video-index="${index}">
              <span class="resource-icon">[V]</span>
              <span>Video ${index + 1}</span>
            </button>
          `,
        )
        .join("")}
    </div>
  `;

  bindBackButton(topic);

  contentElement.querySelectorAll("[data-video-index]").forEach((button) => {
    const path = paths[Number(button.dataset.videoIndex)];
    button.addEventListener("click", () =>
      renderMediaResource(topic, resource, path, {
        label: "Back to videos",
        onBack: () => renderVideoChoices(topic, resource, paths),
      }),
    );
  });
}

function renderMissingResource(topic, resource) {
  contentElement.innerHTML = `
    ${renderBackButtonHtml()}
    <p class="eyebrow">${resource.label}</p>
    <h2>Resource not found</h2>
    <div class="missing-resource">
      <p>This resource could not be opened. Please check that the file is available.</p>
    </div>
  `;
  bindBackButton(topic);
}

function renderBackButtonHtml(label = "Back to resources") {
  return `
    <button class="back-button" id="backToResources" type="button">
      ← ${label}
    </button>
  `;
}

function bindBackButton(topic, onBack = () => showTopic(topic)) {
  const backButton = document.querySelector("#backToResources");

  if (backButton) {
    backButton.addEventListener("click", onBack);
  }
}

function parseQuestions(csvText) {
  return parseCsv(csvText)
    .map((row) => ({
      question: (row[0] || "").trim(),
      answer: (row[1] || "").trim(),
    }))
    .filter((item) => item.question && item.answer);
}

function parseCsv(text) {
  const rows = [];
  let currentRow = [];
  let currentValue = "";
  let insideQuotes = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const nextChar = text[index + 1];

    if (char === '"' && insideQuotes && nextChar === '"') {
      currentValue += '"';
      index += 1;
      continue;
    }

    if (char === '"') {
      insideQuotes = !insideQuotes;
      continue;
    }

    if (char === "," && !insideQuotes) {
      currentRow.push(currentValue);
      currentValue = "";
      continue;
    }

    if ((char === "\n" || char === "\r") && !insideQuotes) {
      if (char === "\r" && nextChar === "\n") {
        index += 1;
      }

      currentRow.push(currentValue);
      rows.push(currentRow);
      currentRow = [];
      currentValue = "";
      continue;
    }

    currentValue += char;
  }

  if (currentValue || currentRow.length > 0) {
    currentRow.push(currentValue);
    rows.push(currentRow);
  }

  return rows;
}

function escapeHtml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

renderTree();
