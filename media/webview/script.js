// @ts-nocheck
/* TermSnap webview script — preview logic, theme switching, export */

const vscode = acquireVsCodeApi();

function initTermSnap(initialData) {
  const { config } = initialData;

  // DOM elements
  const captureArea = document.getElementById("capture-area");
  const terminalWindow = document.getElementById("terminal-window");
  const terminalBody = document.getElementById("terminal-body");
  const terminalText = document.getElementById("terminal-text");
  const titleBar = document.getElementById("title-bar");

  // Controls
  const themeSelect = document.getElementById("theme-select");
  const fontSizeSlider = document.getElementById("font-size");
  const fontSizeValue = document.getElementById("font-size-value");
  const paddingSlider = document.getElementById("padding");
  const paddingValue = document.getElementById("padding-value");
  const windowControlsCheckbox = document.getElementById("window-controls");
  const lineNumbersCheckbox = document.getElementById("line-numbers");

  // Buttons
  const btnSave = document.getElementById("btn-save");
  const btnCopy = document.getElementById("btn-copy");
  const btnCopyText = document.getElementById("btn-copy-text");

  // Store the raw text (unescaped) for line-number toggling
  const rawText = terminalText.textContent;

  // ── Apply initial styles via JS (inline style attrs are blocked by CSP) ──
  captureArea.style.backgroundColor = config.backgroundColor;
  terminalBody.style.fontSize = config.fontSize + "px";
  terminalBody.style.padding = config.padding + "px";
  if (!config.showWindowControls) {
    titleBar.style.display = "none";
  }

  // ── Custom theme colors ────────────────────────────────
  function applyCustomColors() {
    terminalWindow.style.setProperty("--custom-bg", config.customBackground);
    terminalWindow.style.setProperty("--custom-text", config.customTextColor);
    terminalWindow.style.setProperty("--custom-titlebar", config.customTitleBarColor);
  }

  if (config.theme === "custom") {
    applyCustomColors();
  }

  // ── Theme switching ──────────────────────────────────
  themeSelect.addEventListener("change", () => {
    const theme = themeSelect.value;
    terminalWindow.className = "terminal-window theme-" + theme;
    if (theme === "custom") {
      applyCustomColors();
    }
    notifySettingsChanged("theme", theme);
  });

  // ── Font size ────────────────────────────────────────
  fontSizeSlider.addEventListener("input", () => {
    const size = fontSizeSlider.value;
    fontSizeValue.textContent = size;
    terminalBody.style.fontSize = size + "px";
    notifySettingsChanged("fontSize", Number(size));
  });

  // ── Padding ──────────────────────────────────────────
  paddingSlider.addEventListener("input", () => {
    const pad = paddingSlider.value;
    paddingValue.textContent = pad;
    terminalBody.style.padding = pad + "px";
    notifySettingsChanged("padding", Number(pad));
  });

  // ── Window controls toggle ───────────────────────────
  windowControlsCheckbox.addEventListener("change", () => {
    const show = windowControlsCheckbox.checked;
    titleBar.style.display = show ? "" : "none";
    notifySettingsChanged("showWindowControls", show);
  });

  // ── Line numbers toggle ──────────────────────────────
  lineNumbersCheckbox.addEventListener("change", () => {
    renderText(lineNumbersCheckbox.checked);
    notifySettingsChanged("showLineNumbers", lineNumbersCheckbox.checked);
  });

  function renderText(showLineNumbers) {
    if (!showLineNumbers) {
      terminalText.textContent = rawText;
      return;
    }

    const lines = rawText.split("\n");
    terminalText.innerHTML = "";
    lines.forEach((line, i) => {
      const lineNumSpan = document.createElement("span");
      lineNumSpan.className = "line-number";
      lineNumSpan.textContent = String(i + 1);

      const textNode = document.createTextNode(escapeHtml(line) + "\n");

      terminalText.appendChild(lineNumSpan);
      // Use a text node so content stays escaped
      const span = document.createElement("span");
      span.textContent = line + "\n";
      terminalText.appendChild(span);
    });
  }

  function escapeHtml(str) {
    return str
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  // Apply initial line numbers if configured
  if (config.showLineNumbers) {
    renderText(true);
  }

  // ── Save as PNG ──────────────────────────────────────
  btnSave.addEventListener("click", async () => {
    btnSave.disabled = true;
    btnSave.textContent = "Exporting...";
    try {
      const dataUrl = await htmlToImage.toPng(captureArea, {
        pixelRatio: 4,
      });
      vscode.postMessage({ type: "save", dataUrl });
    } catch (err) {
      console.error("TermSnap export error:", err);
    } finally {
      btnSave.disabled = false;
      btnSave.textContent = "Save as PNG";
    }
  });

  // ── Copy to clipboard ────────────────────────────────
  btnCopy.addEventListener("click", async () => {
    btnCopy.disabled = true;
    btnCopy.textContent = "Copying...";
    try {
      const dataUrl = await htmlToImage.toPng(captureArea, {
        pixelRatio: 4,
      });

      // Convert data URL to blob and use Clipboard API
      const res = await fetch(dataUrl);
      const blob = await res.blob();
      await navigator.clipboard.write([
        new ClipboardItem({ "image/png": blob }),
      ]);

      vscode.postMessage({ type: "copy", dataUrl });
    } catch (err) {
      // Fallback: send to extension for handling
      console.error("TermSnap clipboard error:", err);
      try {
        const dataUrl = await htmlToImage.toPng(captureArea, {
          pixelRatio: 4,
        });
        vscode.postMessage({ type: "copy", dataUrl });
      } catch (e) {
        console.error("TermSnap fallback error:", e);
      }
    } finally {
      btnCopy.disabled = false;
      btnCopy.textContent = "Copy Image";
    }
  });

  // ── Copy text ────────────────────────────────────────
  btnCopyText.addEventListener("click", () => {
    vscode.postMessage({ type: "copyText", text: rawText });
    btnCopyText.textContent = "Copied!";
    setTimeout(() => { btnCopyText.textContent = "Copy Text"; }, 1500);
  });

  // ── Notify extension of settings changes ─────────────
  function notifySettingsChanged(key, value) {
    vscode.postMessage({ type: "settingsChanged", key, value });
  }

  // ── Listen for messages from extension ───────────────
  window.addEventListener("message", (event) => {
    const message = event.data;
    if (message.type === "updateText") {
      terminalText.textContent = message.text;
      if (lineNumbersCheckbox.checked) {
        renderText(true);
      }
    }
  });
}
