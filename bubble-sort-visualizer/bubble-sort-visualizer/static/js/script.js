/* =====================================================================
   BubbleLens — Bubble Sort Visualizer
   All sorting + animation logic lives here. The algorithm is a
   standard optimized Bubble Sort; every comparison and swap yields
   control back to the browser (via a Promise + setTimeout) so the
   DOM can repaint and the user can pause/resume mid-sort.
   ===================================================================== */

(() => {
  "use strict";

  /* ---------------------------------------------------------------
     DOM references
  --------------------------------------------------------------- */
  const barsContainer   = document.getElementById("barsContainer");
  const arraySizeInput  = document.getElementById("arraySize");
  const arraySizeValue  = document.getElementById("arraySizeValue");
  const speedInput      = document.getElementById("speed");
  const speedValue      = document.getElementById("speedValue");

  const generateBtn = document.getElementById("generateBtn");
  const startBtn    = document.getElementById("startBtn");
  const pauseBtn    = document.getElementById("pauseBtn");
  const resumeBtn   = document.getElementById("resumeBtn");
  const resetBtn    = document.getElementById("resetBtn");

  const statPass        = document.getElementById("statPass");
  const statComparisons = document.getElementById("statComparisons");
  const statSwaps       = document.getElementById("statSwaps");
  const statTime        = document.getElementById("statTime");
  const statusPill      = document.getElementById("statusPill");

  const explainCurrent = document.getElementById("explainCurrent");
  const explainLog     = document.getElementById("explainLog");

  /* ---------------------------------------------------------------
     State
  --------------------------------------------------------------- */
  let array = [];
  let originalArray = [];      // kept so Reset can restore the same array
  let isSorting = false;
  let isPaused  = false;
  let isSorted  = false;

  let comparisons = 0;
  let swaps = 0;
  let startTime = 0;
  let elapsedBeforePause = 0;
  let timerInterval = null;

  // Speed slider (1-5) -> delay in ms per step. Higher = faster.
  const SPEED_MAP = { 1: 650, 2: 400, 3: 220, 4: 110, 5: 40 };
  const SPEED_LABELS = { 1: "Slow", 2: "Leisurely", 3: "Normal", 4: "Fast", 5: "Turbo" };

  /* ---------------------------------------------------------------
     Pause control — sortStep() awaits this to block while paused
  --------------------------------------------------------------- */
  function waitWhilePaused() {
    return new Promise((resolve) => {
      const check = () => {
        if (!isPaused) {
          resolve();
        } else {
          requestAnimationFrame(check);
        }
      };
      check();
    });
  }

  function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  function currentDelay() {
    return SPEED_MAP[speedInput.value];
  }

  /* ---------------------------------------------------------------
     Array generation & rendering
  --------------------------------------------------------------- */
  function generateArray() {
    if (isSorting) return; // ignore while actively sorting

    const size = parseInt(arraySizeInput.value, 10);
    array = Array.from({ length: size }, () => Math.floor(Math.random() * 95) + 5);
    originalArray = [...array];

    resetStats();
    isSorted = false;
    renderBars();
    setStatus("idle", "Idle");
    setExplanation("A fresh random array is ready. Press <strong>Start</strong> to begin sorting.");
    clearLog();
    toggleControlsForIdle();
  }

  function renderBars() {
    barsContainer.innerHTML = "";
    const max = Math.max(...array, 1);

    array.forEach((value, index) => {
      const bar = document.createElement("div");
      bar.className = "bar";
      bar.id = `bar-${index}`;
      bar.style.height = `${(value / max) * 100}%`;
      bar.title = value;
      barsContainer.appendChild(bar);
    });
  }

  function updateBarHeight(index) {
    const max = Math.max(...array, 1);
    const bar = document.getElementById(`bar-${index}`);
    if (bar) bar.style.height = `${(array[index] / max) * 100}%`;
  }

  /* ---------------------------------------------------------------
     Stats helpers
  --------------------------------------------------------------- */
  function resetStats() {
    comparisons = 0;
    swaps = 0;
    elapsedBeforePause = 0;
    statPass.textContent = "0";
    statComparisons.textContent = "0";
    statSwaps.textContent = "0";
    statTime.textContent = "0.00s";
    stopTimer();
  }

  function startTimer() {
    startTime = performance.now();
    timerInterval = setInterval(() => {
      const elapsed = (performance.now() - startTime + elapsedBeforePause) / 1000;
      statTime.textContent = `${elapsed.toFixed(2)}s`;
    }, 50);
  }

  function stopTimer() {
    if (timerInterval) {
      clearInterval(timerInterval);
      timerInterval = null;
    }
  }

  function pauseTimer() {
    elapsedBeforePause += performance.now() - startTime;
    stopTimer();
  }

  /* ---------------------------------------------------------------
     Explanation panel
  --------------------------------------------------------------- */
  function setExplanation(html) {
    explainCurrent.innerHTML = html;
  }

  function clearLog() {
    explainLog.innerHTML = "";
  }

  function logStep(message, type = "") {
    const entry = document.createElement("div");
    entry.className = `explain-log__item${type ? ` explain-log__item--${type}` : ""}`;
    entry.textContent = message;
    explainLog.appendChild(entry);
    // Cap log length so the DOM doesn't grow unbounded on large arrays
    while (explainLog.children.length > 120) {
      explainLog.removeChild(explainLog.firstChild);
    }
  }

  /* ---------------------------------------------------------------
     Status pill
  --------------------------------------------------------------- */
  function setStatus(state, label) {
    statusPill.className = `status-pill is-${state}`;
    statusPill.innerHTML = `<i class="fa-solid fa-circle status-pill__dot"></i> ${label}`;
  }

  /* ---------------------------------------------------------------
     Button state management
  --------------------------------------------------------------- */
  function toggleControlsForIdle() {
    startBtn.disabled = false;
    pauseBtn.disabled = true;
    resumeBtn.disabled = true;
    generateBtn.disabled = false;
    arraySizeInput.disabled = false;
  }

  function toggleControlsForRunning() {
    startBtn.disabled = true;
    pauseBtn.disabled = false;
    resumeBtn.disabled = true;
    generateBtn.disabled = true;
    arraySizeInput.disabled = true;
  }

  function toggleControlsForPaused() {
    pauseBtn.disabled = true;
    resumeBtn.disabled = false;
  }

  function toggleControlsForDone() {
    startBtn.disabled = true;
    pauseBtn.disabled = true;
    resumeBtn.disabled = true;
    generateBtn.disabled = false;
    arraySizeInput.disabled = false;
  }

  /* ---------------------------------------------------------------
     Core Bubble Sort (async, animated, pausable)
  --------------------------------------------------------------- */
  async function bubbleSort() {
    const n = array.length;
    let swappedInPass;

    for (let i = 0; i < n - 1; i++) {
      swappedInPass = false;
      statPass.textContent = String(i + 1);
      setExplanation(`Pass <strong>${i + 1}</strong>: scanning for the largest remaining value to bubble to position ${n - i}.`);

      for (let j = 0; j < n - i - 1; j++) {
        if (!isSorting) return; // stopped via Reset

        await waitWhilePaused();

        const barA = document.getElementById(`bar-${j}`);
        const barB = document.getElementById(`bar-${j + 1}`);

        // --- Comparison highlight (yellow) ---
        barA.classList.add("is-comparing");
        barB.classList.add("is-comparing");
        comparisons++;
        statComparisons.textContent = String(comparisons);
        logStep(`Compare index ${j} (${array[j]}) with index ${j + 1} (${array[j + 1]})`, "compare");

        await sleep(currentDelay());
        await waitWhilePaused();
        if (!isSorting) return;

        if (array[j] > array[j + 1]) {
          // --- Swap highlight (red) ---
          barA.classList.remove("is-comparing");
          barB.classList.remove("is-comparing");
          barA.classList.add("is-swapping");
          barB.classList.add("is-swapping");

          [array[j], array[j + 1]] = [array[j + 1], array[j]];
          updateBarHeight(j);
          updateBarHeight(j + 1);

          swaps++;
          swappedInPass = true;
          statSwaps.textContent = String(swaps);
          setExplanation(`Swapping index ${j} and ${j + 1} — ${array[j + 1]} was greater than ${array[j]}.`);
          logStep(`Swap indices ${j} and ${j + 1}`, "swap");

          await sleep(currentDelay());
          if (!isSorting) return;

          barA.classList.remove("is-swapping");
          barB.classList.remove("is-swapping");
        } else {
          barA.classList.remove("is-comparing");
          barB.classList.remove("is-comparing");
        }
      }

      // The element now at the end of the unsorted region is in its final place
      const sortedBar = document.getElementById(`bar-${n - i - 1}`);
      if (sortedBar) sortedBar.classList.add("is-sorted");

      // Early exit: already sorted, mark everything remaining as sorted
      if (!swappedInPass) {
        for (let k = 0; k <= n - i - 1; k++) {
          const b = document.getElementById(`bar-${k}`);
          if (b) b.classList.add("is-sorted");
        }
        break;
      }
    }

    // Mark the final (first) element sorted too
    const firstBar = document.getElementById("bar-0");
    if (firstBar) firstBar.classList.add("is-sorted");

    finishSorting();
  }

  function finishSorting() {
    isSorting = false;
    isSorted = true;
    pauseTimer();
    setStatus("sorted", "Sorted");
    setExplanation(`Sorting complete in <strong>${comparisons}</strong> comparisons and <strong>${swaps}</strong> swaps. Every bar is now in order.`);
    logStep("Array fully sorted ✔", "sorted");
    toggleControlsForDone();
  }

  /* ---------------------------------------------------------------
     Control handlers
  --------------------------------------------------------------- */
  function handleStart() {
    if (isSorting || isSorted) return;
    isSorting = true;
    isPaused = false;
    setStatus("running", "Sorting…");
    toggleControlsForRunning();
    startTimer();
    bubbleSort();
  }

  function handlePause() {
    if (!isSorting) return;
    isPaused = true;
    pauseTimer();
    setStatus("paused", "Paused");
    toggleControlsForPaused();
    setExplanation("Sorting paused. Press <strong>Resume</strong> to continue where it left off.");
  }

  function handleResume() {
    if (!isSorting) return;
    isPaused = false;
    startTimer();
    setStatus("running", "Sorting…");
    toggleControlsForRunning();
  }

  function handleReset() {
    isSorting = false;
    isPaused = false;
    isSorted = false;
    stopTimer();
    array = [...originalArray];
    resetStats();
    renderBars();
    setStatus("idle", "Idle");
    setExplanation("Array reset to its original order. Press <strong>Start</strong> to sort again.");
    clearLog();
    toggleControlsForIdle();
  }

  /* ---------------------------------------------------------------
     Input listeners
  --------------------------------------------------------------- */
  arraySizeInput.addEventListener("input", () => {
    arraySizeValue.textContent = arraySizeInput.value;
  });
  arraySizeInput.addEventListener("change", generateArray);

  speedInput.addEventListener("input", () => {
    speedValue.textContent = SPEED_LABELS[speedInput.value];
  });

  generateBtn.addEventListener("click", generateArray);
  startBtn.addEventListener("click", handleStart);
  pauseBtn.addEventListener("click", handlePause);
  resumeBtn.addEventListener("click", handleResume);
  resetBtn.addEventListener("click", handleReset);

  /* ---------------------------------------------------------------
     Init
  --------------------------------------------------------------- */
  window.addEventListener("resize", () => {
    // Bars use % height so no recompute needed, but re-render keeps
    // very small screens crisp if the container's max-height changed.
    if (!isSorting) renderBars();
  });

  generateArray();
})();
