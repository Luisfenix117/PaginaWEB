document.addEventListener("DOMContentLoaded", () => {
    const bootScreen = document.getElementById("boot-screen");
    const bootLog = document.getElementById("boot-log");
    const progress = document.querySelector(".boot-progress-fill");
    const bootStatus = document.getElementById("boot-status");
    const bootCount = document.getElementById("boot-count");
    const viewport = document.querySelector(".viewport-canvas");

    const messages = [
        "[OK] Mounting legacy volume /dev/sda1...",
        "[OK] Indexing audio & playlist logs...",
        "[OK] Restoring gaming telemetry archive...",
        "[OK] Reading anime/manga field records...",
        "[OK] Verifying checksums on hidden sectors...",
        "",
        "ARCHIVE UNLOCKED // SESSION_01",
        "",
        "WELCOME BACK, LUIS."
    ];

    let current = 0;
    let cursorEl = null;
    let finished = false;
    let timerId = null;

    function createCursor() {
        const span = document.createElement("span");
        span.className = "boot-cursor";
        span.textContent = "_";
        return span;
    }

    function updateMeta(pct, statusText) {
        if (bootCount) {
            bootCount.textContent = `${Math.round(pct)}%`;
        }
        if (bootStatus && statusText) {
            bootStatus.textContent = statusText;
        }
    }

    function nextLine() {
        if (finished) return;

        if (cursorEl) {
            cursorEl.remove();
        }

        if (current >= messages.length) {
            const doneLine = document.createElement("div");
            doneLine.className = "boot-line boot-ready";
            doneLine.textContent = "C:\\ARCHIVE> ";
            cursorEl = createCursor();
            doneLine.appendChild(cursorEl);
            bootLog.appendChild(doneLine);
            bootLog.scrollTop = bootLog.scrollHeight;

            updateMeta(100, "STATUS: READY");
            finishBoot();
            return;
        }

        const text = messages[current];
        const div = document.createElement("div");
        div.className = "boot-line";

        if (text.startsWith("[OK]")) {
            div.innerHTML = `<span class="boot-ok">[OK]</span>${text.slice(4)}`;
        } else if (text.startsWith("ARCHIVE UNLOCKED")) {
            div.classList.add("boot-grant");
            div.textContent = text;
        } else if (text.startsWith("WELCOME BACK")) {
            div.classList.add("boot-welcome");
            div.textContent = text;
        } else {
            div.textContent = text || "\u00A0";
        }

        cursorEl = createCursor();
        div.appendChild(cursorEl);
        bootLog.appendChild(div);
        bootLog.scrollTop = bootLog.scrollHeight;

        const pct = ((current + 1) / messages.length) * 100;
        progress.style.width = `${pct}%`;
        updateMeta(pct, current < 5 ? "STATUS: READING_SECTORS" : "STATUS: ACCESS_GRANTED");

        current++;
        timerId = setTimeout(nextLine, 150);
    }

    function finishBoot(instant = false) {
        if (finished) return;
        finished = true;
        clearTimeout(timerId);

        const revealDelay = instant ? 0 : 420;
        const fadeDuration = instant ? 350 : 850;

        setTimeout(() => {
            if (viewport) {
                viewport.style.visibility = "visible";
                viewport.style.opacity = "1";
            }

            if (bootScreen) {
                bootScreen.style.transition = `opacity ${fadeDuration}ms ease`;
                bootScreen.style.opacity = "0";

                setTimeout(() => {
                    bootScreen.remove();
                }, fadeDuration);
            }
        }, revealDelay);
    }

    if (bootScreen) {
        bootScreen.addEventListener("click", () => finishBoot(true));
    }

    nextLine();
});