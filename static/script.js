// ============================================================
// TripPlanner AI - Frontend Logic
// ============================================================

// Keep the current LangGraph conversation thread
let currentThreadId = localStorage.getItem("travel_thread_id") || null;

let latestAnswerMarkdown = "";

// ============================================================
// QUICK PROMPTS
// ============================================================

function setPrompt(text) {
  const input = document.getElementById("userInput");

  input.value = text;

  // Put cursor inside textarea
  input.focus();

  // Move cursor to the end
  input.setSelectionRange(input.value.length, input.value.length);
}

// ============================================================
// LOADING STATE
// ============================================================

function setLoading(isLoading) {
  const sendBtn = document.getElementById("sendBtn");
  const btnText = document.getElementById("btnText");
  const btnLoader = document.getElementById("btnLoader");

  if (!sendBtn || !btnText || !btnLoader) {
    return;
  }

  sendBtn.disabled = isLoading;

  if (isLoading) {
    btnText.textContent = "Planning...";

    btnText.classList.remove("hidden");

    btnLoader.classList.remove("hidden");
  } else {
    btnText.textContent = "Generate Plan";

    btnText.classList.remove("hidden");

    btnLoader.classList.add("hidden");
  }
}

// ============================================================
// ERROR HANDLING
// ============================================================

function showError(message) {
  const errorBox = document.getElementById("errorBox");

  if (!errorBox) {
    return;
  }

  errorBox.textContent = message;

  errorBox.classList.remove("hidden");

  errorBox.scrollIntoView({
    behavior: "smooth",
    block: "center",
  });
}

function hideError() {
  const errorBox = document.getElementById("errorBox");

  if (!errorBox) {
    return;
  }

  errorBox.classList.add("hidden");

  errorBox.textContent = "";
}

// ============================================================
// DISPLAY RESULT
// ============================================================

function showResult(answer, threadId) {
  latestAnswerMarkdown = answer;

  const resultSection = document.getElementById("resultSection");

  const resultBox = document.getElementById("resultBox");

  const threadInfo = document.getElementById("threadInfo");

  if (!resultSection || !resultBox) {
    return;
  }

  // Render Markdown returned by the backend
  if (typeof marked !== "undefined" && typeof marked.parse === "function") {
    resultBox.innerHTML = marked.parse(answer);
  } else {
    resultBox.innerText = answer;
  }

  // Display LangGraph thread ID
  if (threadInfo) {
    threadInfo.textContent = `Thread ID: ${threadId}`;
  }

  // Show result section
  resultSection.classList.remove("hidden");

  // Scroll to generated plan
  setTimeout(() => {
    resultSection.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }, 100);
}

// ============================================================
// SEND TRAVEL REQUEST
// ============================================================

async function sendMessage() {
  hideError();

  const input = document.getElementById("userInput");

  if (!input) {
    return;
  }

  const message = input.value.trim();

  // Don't send empty requests
  if (!message) {
    showError("Please describe your trip first.");

    input.focus();

    return;
  }

  // Prevent duplicate requests
  const sendBtn = document.getElementById("sendBtn");

  if (sendBtn && sendBtn.disabled) {
    return;
  }

  setLoading(true);

  try {
    const response = await fetch("/api/travel", {
      method: "POST",

      headers: {
        "Content-Type": "application/json",
      },

      body: JSON.stringify({
        message: message,
        thread_id: currentThreadId,
      }),
    });

    // Try to parse JSON
    let data;

    try {
      data = await response.json();
    } catch {
      throw new Error("The server returned an invalid response.");
    }

    // Backend returned an error
    if (!response.ok || !data.success) {
      throw new Error(data.error || "Unable to generate your travel plan.");
    }

    // ----------------------------------------------------
    // Save LangGraph thread ID
    // ----------------------------------------------------

    currentThreadId = data.thread_id;

    localStorage.setItem("travel_thread_id", currentThreadId);

    // ----------------------------------------------------
    // Display result
    // ----------------------------------------------------

    showResult(data.answer, data.thread_id);
  } catch (error) {
    console.error("TripMate request failed:", error);

    showError(
      error.message || "Something went wrong while generating your trip.",
    );
  } finally {
    setLoading(false);
  }
}

// ============================================================
// COPY RESULT
// ============================================================

async function copyResult() {
  const resultBox = document.getElementById("resultBox");

  if (!resultBox) {
    return;
  }

  const text = resultBox.innerText.trim();

  if (!text) {
    showError("There is no travel plan to copy.");

    return;
  }

  try {
    await navigator.clipboard.writeText(text);

    const copyBtn = document.querySelector(".copy-btn");

    if (!copyBtn) {
      return;
    }

    const oldText = copyBtn.textContent;

    copyBtn.textContent = "Copied ✓";

    setTimeout(() => {
      copyBtn.textContent = oldText;
    }, 1400);
  } catch (error) {
    console.error("Copy failed:", error);

    showError("Could not copy the travel plan.");
  }
}

// ============================================================
// DOWNLOAD PDF
// ============================================================

function downloadPDF() {
  const pdfContent = document.getElementById("pdfContent");

  if (!latestAnswerMarkdown || !pdfContent) {
    showError("No travel plan available to download.");

    return;
  }

  if (typeof html2pdf === "undefined") {
    showError("PDF library could not be loaded.");

    return;
  }

  const downloadBtn = document.querySelector(".download-btn");

  const oldText = downloadBtn ? downloadBtn.textContent : "Download PDF";

  if (downloadBtn) {
    downloadBtn.textContent = "Preparing PDF...";

    downloadBtn.disabled = true;
  }

  const options = {
    margin: 0.5,

    filename: "tripmate-ai-travel-plan.pdf",

    image: {
      type: "jpeg",
      quality: 0.98,
    },

    html2canvas: {
      scale: 2,
      useCORS: true,

      // PDF should remain readable
      backgroundColor: "#ffffff",
    },

    jsPDF: {
      unit: "in",
      format: "a4",
      orientation: "portrait",
    },

    pagebreak: {
      mode: ["avoid-all", "css", "legacy"],
    },
  };

  html2pdf()
    .set(options)
    .from(pdfContent)
    .save()

    .then(() => {
      if (downloadBtn) {
        downloadBtn.textContent = oldText;

        downloadBtn.disabled = false;
      }
    })

    .catch((error) => {
      console.error("PDF generation failed:", error);

      if (downloadBtn) {
        downloadBtn.textContent = oldText;

        downloadBtn.disabled = false;
      }

      showError("Could not generate the PDF.");
    });
}

// ============================================================
// KEYBOARD SHORTCUT
// Ctrl + Enter → Generate Trip
// ============================================================

document.addEventListener("keydown", function (event) {
  if (event.ctrlKey && event.key === "Enter") {
    event.preventDefault();

    sendMessage();
  }
});

// ============================================================
// INITIAL PAGE SETUP
// ============================================================

document.addEventListener("DOMContentLoaded", function () {
  const input = document.getElementById("userInput");

  if (!input) {
    return;
  }

  // Ctrl + Enter hint
  input.title = "Press Ctrl + Enter to generate your travel plan";

  // Enter alone should create a new line.
  // Ctrl + Enter sends the request.
  input.addEventListener("keydown", function (event) {
    if (event.ctrlKey && event.key === "Enter") {
      event.preventDefault();

      sendMessage();
    }
  });
});
