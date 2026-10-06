       "use strict";

        let currentType = "url";
        let currentQRCode = null;


const removeLogoButton = document.getElementById("removeLogoButton");
        const logoSize = document.getElementById("logoSize");
const logoSizeValue = document.getElementById("logoSizeValue");

const logoRadius = document.getElementById("logoRadius");
const logoRadiusValue = document.getElementById("logoRadiusValue");

const logoBackground = document.getElementById("logoBackground");

        const dynamicFields = document.getElementById("dynamicFields");
        const generateButton = document.getElementById("generateButton");
        const resetButton = document.getElementById("resetButton");
        const downloadButton = document.getElementById("downloadButton");
        const printButton = document.getElementById("printButton");
        const shareButton = document.getElementById("shareButton");
        const themeButton = document.getElementById("themeButton");
        const qrColor = document.getElementById("qrColor");
        const bgColor = document.getElementById("bgColor");
       const qrSize = document.getElementById("qrSize");
       const qrStyle = document.getElementById("qrStyle");
       const logoUpload = document.getElementById("logoUpload");
const errorCorrection = document.getElementById("errorCorrection");
const qrCode = document.getElementById("qrCode");
        const emptyState = document.getElementById("emptyState");
        const toast = document.getElementById("toast");

        const historyList = document.getElementById("historyList");
        const historyEmpty = document.getElementById("historyEmpty");
        const clearHistoryButton =
            document.getElementById("clearHistoryButton");

        /* New feature elements */
        const downloadSvgButton = document.getElementById("downloadSvgButton");
        const downloadPdfButton = document.getElementById("downloadPdfButton");
        const contrastWarning = document.getElementById("contrastWarning");
        const presetRow = document.getElementById("presetRow");
        const captionInput = document.getElementById("captionInput");
        const miniStats = document.getElementById("miniStats");
        const languageSelect = document.getElementById("languageSelect");

        const HISTORY_KEY = "qrify-history";
        const HISTORY_LIMIT = 12;
        let history = [];

        let toastTimer = null;

        function showToast(message, isError) {
            toast.textContent = message;

            toast.classList.toggle("error", !!isError);

            toast.classList.add("show");

            clearTimeout(toastTimer);

            toastTimer = setTimeout(function () {
                toast.classList.remove("show");
                toast.classList.remove("error");
            }, 2500);
        }

        /* =========================
           VALIDATION HELPERS
        ========================= */

        /*
         * Show a validation error: display the message, highlight the
         * offending field and move focus to it so the user can fix it
         * immediately. Prevents generating broken QR codes.
         */
        function showFieldError(field, message) {
            showToast(message, true);

            if (field && field.focus) {
                field.classList.add("field-error");

                field.focus();

                if (field.select) {
                    try { field.select(); } catch (e) { /* no-op */ }
                }

                // Remove the highlight as soon as the user edits
                field.addEventListener(
                    "input",
                    function clearError() {
                        field.classList.remove("field-error");
                        field.removeEventListener("input", clearError);
                    }
                );
            }
        }

        // Basic email shape check (local@domain.tld)
        function isValidEmail(value) {
            return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value);
        }

        // Basic phone check: digits with optional +, spaces, dashes, parens
        function isValidPhone(value) {
            const digits = value.replace(/[^\d]/g, "");
            return digits.length >= 6;
        }

        // Basic URL check: allow scheme or bare domain
        function isValidUrl(value) {
            if (/\s/.test(value)) return false;

            let candidate = value;

            if (!/^https?:\/\//i.test(candidate)) {
                candidate = "https://" + candidate;
            }

            try {
                const url = new URL(candidate);
                return !!url.hostname && url.hostname.includes(".");
            } catch (error) {
                return false;
            }
        }

        /* =========================
           HISTORY
        ========================= */

        function loadHistory() {
            try {
                const stored = localStorage.getItem(HISTORY_KEY);
                history = stored ? JSON.parse(stored) : [];
                if (!Array.isArray(history)) history = [];
            } catch (error) {
                history = [];
            }
        }

        function saveHistory() {
            try {
                localStorage.setItem(
                    HISTORY_KEY,
                    JSON.stringify(history)
                );
            } catch (error) {
                showToast("Could not save history (storage full).");
            }
        }

        function formatHistoryDate(timestamp) {
            const date = new Date(timestamp);

            return date.toLocaleString(undefined, {
                day: "2-digit",
                month: "short",
                hour: "2-digit",
                minute: "2-digit"
            });
        }

        function escapeHTML(value) {
            return String(value)
                .replace(/&/g, "&amp;")
                .replace(/</g, "&lt;")
                .replace(/>/g, "&gt;")
                .replace(/"/g, "&quot;")
                .replace(/'/g, "&#39;");
        }

        function renderHistory() {
            if (!historyList) return;

            historyList.innerHTML = "";

            if (history.length === 0) {
                historyList.innerHTML =
                    '<p class="history-empty">' +
                    "Your recent QR codes will appear here." +
                    "</p>";
                return;
            }

            history.forEach(function (item) {
                const row = document.createElement("div");
                row.className = "history-item";

                const thumb = document.createElement("img");
                thumb.className = "history-thumb";
                thumb.src = item.image;
                thumb.alt = item.type + " QR code";

                const info = document.createElement("div");
                info.className = "history-info";

                const meta = document.createElement("div");
                meta.className = "history-meta";

                const type = document.createElement("span");
                type.className = "history-type";
                type.textContent = item.type;

                const date = document.createElement("span");
                date.className = "history-date";
                date.textContent = formatHistoryDate(item.createdAt);

                meta.appendChild(type);
                meta.appendChild(date);

                const value = document.createElement("div");
                value.className = "history-value";
                value.textContent = item.label || item.content;
                value.title = item.content;

                info.appendChild(meta);
                info.appendChild(value);

                const actions = document.createElement("div");
                actions.className = "history-actions";

                const reuseBtn = document.createElement("button");
                reuseBtn.type = "button";
                reuseBtn.className = "history-btn reuse";
                reuseBtn.textContent = "Use Again";
                reuseBtn.addEventListener("click", function () {
                    reuseHistoryItem(item.id);
                });

                const deleteBtn = document.createElement("button");
                deleteBtn.type = "button";
                deleteBtn.className = "history-btn delete";
                deleteBtn.textContent = "Delete";
                deleteBtn.addEventListener("click", function () {
                    deleteHistoryItem(item.id);
                });

                actions.appendChild(reuseBtn);
                actions.appendChild(deleteBtn);

                row.appendChild(thumb);
                row.appendChild(info);
                row.appendChild(actions);

                historyList.appendChild(row);
            });
        }

        function addToHistory(entry) {
            // Avoid duplicate consecutive entries for the same content
            history = history.filter(function (item) {
                return item.content !== entry.content;
            });

            history.unshift(entry);

            if (history.length > HISTORY_LIMIT) {
                history = history.slice(0, HISTORY_LIMIT);
            }

            saveHistory();
            renderHistory();
            updateMiniStats();
        }

        function deleteHistoryItem(id) {
            history = history.filter(function (item) {
                return item.id !== id;
            });

            saveHistory();
            renderHistory();
            updateMiniStats();

            showToast("Removed from history.");
        }

        function clearHistory() {
            if (history.length === 0) {
                showToast("History is already empty.");
                return;
            }

            history = [];

            saveHistory();
            renderHistory();
            updateMiniStats();

            showToast("History cleared.");
        }

        function reuseHistoryItem(id) {
            const item = history.find(function (entry) {
                return entry.id === id;
            });

            if (!item) return;

            currentType = item.type.toLowerCase();

            // Restore the QR type button state
            document.querySelectorAll(".type-button").forEach(function (button) {
                button.classList.toggle(
                    "active",
                    button.dataset.type === currentType
                );
            });

            renderFields();

            // Restore saved inputs (best effort)
            if (item.inputs) {
                Object.keys(item.inputs).forEach(function (fieldId) {
                    const field = document.getElementById(fieldId);
                    if (field) field.value = item.inputs[fieldId];
                });
            }

            // Restore visual options
            if (item.options) {
                if (item.options.qrColor) qrColor.value = item.options.qrColor;
                if (item.options.bgColor) bgColor.value = item.options.bgColor;
                if (item.options.qrSize) qrSize.value = item.options.qrSize;
                if (item.options.qrStyle) qrStyle.value = item.options.qrStyle;
                if (item.options.errorCorrection) {
                    errorCorrection.value = item.options.errorCorrection;
                }
            }

            generateQR();

            showToast("Loaded from history.");
        }

        function collectCurrentInputs() {
            const inputs = {};

            if (currentType === "url") {
                const el = document.getElementById("urlInput");
                if (el) inputs.urlInput = el.value;
            } else if (currentType === "text") {
                const el = document.getElementById("textInput");
                if (el) inputs.textInput = el.value;
            } else if (currentType === "email") {
                ["emailInput", "emailSubject", "emailMessage"].forEach(
                    function (fieldId) {
                        const el = document.getElementById(fieldId);
                        if (el) inputs[fieldId] = el.value;
                    }
                );
            } else if (currentType === "phone") {
                const el = document.getElementById("phoneInput");
                if (el) inputs.phoneInput = el.value;
            } else if (currentType === "wifi") {
                ["wifiName", "wifiPassword", "wifiSecurity"].forEach(
                    function (fieldId) {
                        const el = document.getElementById(fieldId);
                        if (el) inputs[fieldId] = el.value;
                    }
                );
            } else if (currentType === "vcard") {
                ["vcardName", "vcardPhone", "vcardEmail", "vcardOrg",
                 "vcardTitle", "vcardUrl"].forEach(function (fieldId) {
                    const el = document.getElementById(fieldId);
                    if (el) inputs[fieldId] = el.value;
                });
            } else if (currentType === "event") {
                ["eventTitle", "eventLocation", "eventStart", "eventEnd",
                 "eventDescription"].forEach(function (fieldId) {
                    const el = document.getElementById(fieldId);
                    if (el) inputs[fieldId] = el.value;
                });
            } else if (currentType === "sms") {
                ["smsPhone", "smsMessage"].forEach(function (fieldId) {
                    const el = document.getElementById(fieldId);
                    if (el) inputs[fieldId] = el.value;
                });
            } else if (currentType === "geo") {
                ["geoLat", "geoLng"].forEach(function (fieldId) {
                    const el = document.getElementById(fieldId);
                    if (el) inputs[fieldId] = el.value;
                });
            }

            return inputs;
        }

        function buildHistoryLabel() {
            const map = {
                url: ["urlInput", "Website URL"],
                text: ["textInput", "Text"],
                email: ["emailInput", "Email"],
                phone: ["phoneInput", "Phone"],
                wifi: ["wifiName", "Wi-Fi"],
                vcard: ["vcardName", "Contact"],
                event: ["eventTitle", "Event"],
                sms: ["smsPhone", "SMS"],
                geo: ["geoLat", "Location"]
            };

            const entry = map[currentType];

            if (!entry) return "";

            const el = document.getElementById(entry[0]);

            return el && el.value.trim() ? el.value.trim() : entry[1];
        }

        function renderFields() {
            if (currentType === "url") {
                dynamicFields.innerHTML = `
                    <div class="field">
                        <label for="urlInput">Website URL</label>
                        <input
                            type="url"
                            id="urlInput"
                            placeholder="https://example.com"
                            autocomplete="url"
                        >
                    </div>
                `;
                return;
            }

            if (currentType === "text") {
                dynamicFields.innerHTML = `
                    <div class="field">
                        <label for="textInput">Your Text</label>
                        <textarea
                            id="textInput"
                            placeholder="Enter your text here..."
                        ></textarea>
                    </div>
                `;
                return;
            }

            if (currentType === "email") {
                dynamicFields.innerHTML = `
                    <div class="field">
                        <label for="emailInput">Email Address</label>
                        <input
                            type="email"
                            id="emailInput"
                            placeholder="hello@example.com"
                        >
                    </div>

                    <div class="field">
                        <label for="emailSubject">Subject</label>
                        <input
                            type="text"
                            id="emailSubject"
                            placeholder="Email subject"
                        >
                    </div>

                    <div class="field">
                        <label for="emailMessage">Message</label>
                        <textarea
                            id="emailMessage"
                            placeholder="Your message..."
                        ></textarea>
                    </div>
                `;
                return;
            }

            if (currentType === "phone") {
                dynamicFields.innerHTML = `
                    <div class="field">
                        <label for="phoneInput">Phone Number</label>
                        <input
                            type="tel"
                            id="phoneInput"
                            placeholder="+234 800 000 0000"
                        >
                    </div>
                `;
                return;
            }

            if (currentType === "wifi") {
                dynamicFields.innerHTML = `
                    <div class="field">
                        <label for="wifiName">Wi-Fi Network Name</label>
                        <input
                            type="text"
                            id="wifiName"
                            placeholder="My Wi-Fi"
                        >
                    </div>

                    <div class="field">
                        <label for="wifiPassword">Wi-Fi Password</label>
                        <input
                            type="text"
                            id="wifiPassword"
                            placeholder="Password"
                        >
                    </div>

                    <div class="field">
                        <label for="wifiSecurity">Security</label>
                        <select id="wifiSecurity">
                            <option value="WPA">WPA/WPA2</option>
                            <option value="WEP">WEP</option>
                            <option value="nopass">No Password</option>
                        </select>
                    </div>
                `;
                return;
            }

            if (currentType === "vcard") {
                dynamicFields.innerHTML = `
                    <div class="field">
                        <label for="vcardName">Full Name</label>
                        <input type="text" id="vcardName" placeholder="Jane Doe">
                    </div>

                    <div class="field">
                        <label for="vcardPhone">Phone</label>
                        <input type="tel" id="vcardPhone" placeholder="+234 800 000 0000">
                    </div>

                    <div class="field">
                        <label for="vcardEmail">Email</label>
                        <input type="email" id="vcardEmail" placeholder="jane@example.com">
                    </div>

                    <div class="field">
                        <label for="vcardOrg">Organisation</label>
                        <input type="text" id="vcardOrg" placeholder="Company Ltd">
                    </div>

                    <div class="field">
                        <label for="vcardTitle">Job Title</label>
                        <input type="text" id="vcardTitle" placeholder="Product Manager">
                    </div>

                    <div class="field">
                        <label for="vcardUrl">Website</label>
                        <input type="url" id="vcardUrl" placeholder="https://example.com">
                    </div>
                `;
                return;
            }

            if (currentType === "event") {
                dynamicFields.innerHTML = `
                    <div class="field">
                        <label for="eventTitle">Event Title</label>
                        <input type="text" id="eventTitle" placeholder="Team Meeting">
                    </div>

                    <div class="field">
                        <label for="eventLocation">Location</label>
                        <input type="text" id="eventLocation" placeholder="Office / Online">
                    </div>

                    <div class="field">
                        <label for="eventStart">Start</label>
                        <input type="datetime-local" id="eventStart">
                    </div>

                    <div class="field">
                        <label for="eventEnd">End</label>
                        <input type="datetime-local" id="eventEnd">
                    </div>

                    <div class="field">
                        <label for="eventDescription">Description</label>
                        <textarea id="eventDescription" placeholder="Notes..."></textarea>
                    </div>
                `;
                return;
            }

            if (currentType === "sms") {
                dynamicFields.innerHTML = `
                    <div class="field">
                        <label for="smsPhone">Phone Number</label>
                        <input type="tel" id="smsPhone" placeholder="+234 800 000 0000">
                    </div>

                    <div class="field">
                        <label for="smsMessage">Message</label>
                        <textarea id="smsMessage" placeholder="Your message..."></textarea>
                    </div>
                `;
                return;
            }

            if (currentType === "geo") {
                dynamicFields.innerHTML = `
                    <div class="field">
                        <label for="geoLat">Latitude</label>
                        <input type="text" id="geoLat" placeholder="6.5244">
                    </div>

                    <div class="field">
                        <label for="geoLng">Longitude</label>
                        <input type="text" id="geoLng" placeholder="3.3792">
                    </div>
                `;
                return;
            }
        }

        function getQRContent() {
            if (currentType === "url") {
                const input = document.getElementById("urlInput");

                if (!input || !input.value.trim()) {
                    showFieldError(input, "Please enter a URL.");
                    return null;
                }

                const value = input.value.trim();

                if (!isValidUrl(value)) {
                    showFieldError(
                        input,
                        "Please enter a valid URL (e.g. example.com)."
                    );
                    return null;
                }

                return value;
            }

            if (currentType === "text") {
                const input = document.getElementById("textInput");

                if (!input || !input.value.trim()) {
                    showFieldError(input, "Please enter some text.");
                    return null;
                }

                return input.value.trim();
            }

            if (currentType === "email") {
                const emailField = document.getElementById("emailInput");
                const subjectField = document.getElementById("emailSubject");
                const messageField = document.getElementById("emailMessage");

                const email = emailField ? emailField.value.trim() : "";
                const subject = subjectField ? subjectField.value.trim() : "";
                const message = messageField ? messageField.value.trim() : "";

                if (!email) {
                    showFieldError(emailField, "Please enter an email address.");
                    return null;
                }

                if (!isValidEmail(email)) {
                    showFieldError(
                        emailField,
                        "Please enter a valid email address."
                    );
                    return null;
                }

                return (
                    "mailto:" +
                    email +
                    "?subject=" +
                    encodeURIComponent(subject) +
                    "&body=" +
                    encodeURIComponent(message)
                );
            }

            if (currentType === "phone") {
                const input = document.getElementById("phoneInput");

                if (!input || !input.value.trim()) {
                    showFieldError(input, "Please enter a phone number.");
                    return null;
                }

                const phone = input.value.trim();

                if (!isValidPhone(phone)) {
                    showFieldError(
                        input,
                        "Please enter a valid phone number."
                    );
                    return null;
                }

                return "tel:" + phone;
            }

            if (currentType === "wifi") {
                const nameField = document.getElementById("wifiName");
                const passwordField = document.getElementById("wifiPassword");
                const securityField = document.getElementById("wifiSecurity");

                const name = nameField ? nameField.value.trim() : "";
                const password = passwordField ? passwordField.value : "";
                const security = securityField
                    ? securityField.value
                    : "nopass";

                if (!name) {
                    showFieldError(
                        nameField,
                        "Please enter the Wi-Fi network name."
                    );
                    return null;
                }

                if (security !== "nopass" && !password) {
                    showFieldError(
                        passwordField,
                        "Please enter the Wi-Fi password, or set Security to No Password."
                    );
                    return null;
                }

                return (
                    "WIFI:T:" +
                    security +
                    ";S:" +
                    name +
                    ";P:" +
                    password +
                    ";;"
                );
            }

            if (currentType === "vcard") {
                const nameField = document.getElementById("vcardName");
                const name = nameField ? nameField.value.trim() : "";

                if (!name) {
                    showFieldError(nameField, "Please enter a name.");
                    return null;
                }

                const phone = (document.getElementById("vcardPhone") || {}).value || "";
                const email = (document.getElementById("vcardEmail") || {}).value || "";
                const org = (document.getElementById("vcardOrg") || {}).value || "";
                const title = (document.getElementById("vcardTitle") || {}).value || "";
                const url = (document.getElementById("vcardUrl") || {}).value || "";

                let vcard =
                    "BEGIN:VCARD\n" +
                    "VERSION:3.0\n" +
                    "FN:" + name + "\n";

                if (org.trim()) vcard += "ORG:" + org.trim() + "\n";
                if (title.trim()) vcard += "TITLE:" + title.trim() + "\n";
                if (phone.trim()) vcard += "TEL:" + phone.trim() + "\n";
                if (email.trim()) vcard += "EMAIL:" + email.trim() + "\n";
                if (url.trim()) vcard += "URL:" + url.trim() + "\n";

                vcard += "END:VCARD";

                return vcard;
            }

            if (currentType === "event") {
                const titleField = document.getElementById("eventTitle");
                const title = titleField ? titleField.value.trim() : "";

                if (!title) {
                    showFieldError(titleField, "Please enter an event title.");
                    return null;
                }

                const startField = document.getElementById("eventStart");
                const start = startField ? startField.value : "";
                const endField = document.getElementById("eventEnd");
                const end = endField ? endField.value : "";
                const location = (document.getElementById("eventLocation") || {}).value || "";
                const description = (document.getElementById("eventDescription") || {}).value || "";

                function toICS(value) {
                    // datetime-local: 2026-01-01T10:00 -> 20260101T100000
                    if (!value) return "";
                    return value.replace(/[-:]/g, "").replace("T", "T") + "00";
                }

                let event =
                    "BEGIN:VEVENT\n" +
                    "SUMMARY:" + title + "\n";

                if (start) event += "DTSTART:" + toICS(start) + "\n";
                if (end) event += "DTEND:" + toICS(end) + "\n";
                if (location.trim()) event += "LOCATION:" + location.trim() + "\n";
                if (description.trim()) event += "DESCRIPTION:" + description.trim() + "\n";

                event += "END:VEVENT";

                return event;
            }

            if (currentType === "sms") {
                const phoneField = document.getElementById("smsPhone");
                const phone = phoneField ? phoneField.value.trim() : "";

                if (!phone) {
                    showFieldError(phoneField, "Please enter a phone number.");
                    return null;
                }

                if (!isValidPhone(phone)) {
                    showFieldError(phoneField, "Please enter a valid phone number.");
                    return null;
                }

                let message = (document.getElementById("smsMessage") || {}).value || "";

                return "SMSTO:" + phone + ":" + message;
            }

            if (currentType === "geo") {
                const latField = document.getElementById("geoLat");
                const lngField = document.getElementById("geoLng");

                const lat = latField ? latField.value.trim() : "";
                const lng = lngField ? lngField.value.trim() : "";

                if (!lat || !lng) {
                    showFieldError(
                        !lat ? latField : lngField,
                        "Please enter both latitude and longitude."
                    );
                    return null;
                }

                if (isNaN(Number(lat)) || isNaN(Number(lng))) {
                    showFieldError(
                        isNaN(Number(lat)) ? latField : lngField,
                        "Latitude and longitude must be numbers."
                    );
                    return null;
                }

                return "geo:" + lat + "," + lng;
            }

            showToast("Please choose a QR code type first.", true);
            return null;
        }
        function applyQRStyle(sourceCanvas, size) {
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;

    const ctx = canvas.getContext("2d");

    // Classic: just redraw the original square-module QR
    if (qrStyle.value === "classic") {
        ctx.drawImage(sourceCanvas, 0, 0, size, size);
        return canvas;
    }

    const sourceSize = sourceCanvas.width;

    const sourceCtx = sourceCanvas.getContext("2d");
    const imageData = sourceCtx.getImageData(
        0,
        0,
        sourceSize,
        sourceSize
    );

    /*
     * QRCode.js renders the QR at an arbitrary pixel size, so each
     * logical module can be a fractional number of pixels. To restyle
     * the modules we first work out how many modules the grid has.
     *
     * A QR "quiet zone" border of 4 modules is included by the library,
     * and the total module count is always 21 + (version - 1) * 4.
     * We estimate the module size by measuring the top-left finder
     * pattern (which is exactly 7 modules wide) in the first dark run.
     */
    function isDark(x, y) {
        const i = (y * sourceSize + x) * 4;
        const d = imageData.data;
        // Treat any clearly non-white pixel as a dark module
        return d[i] < 160 && d[i + 1] < 160 && d[i + 2] < 160;
    }

    // Measure the length of the first dark run on the first row that
    // contains the finder pattern.
    let finderRun = 0;
    for (let y = 0; y < sourceSize && finderRun === 0; y++) {
        let x = 0;
        while (x < sourceSize && !isDark(x, y)) x++;
        let run = 0;
        while (x < sourceSize && isDark(x, y)) { run++; x++; }
        if (run > 0) finderRun = run;
    }

    // Finder pattern = 7 modules wide
    let moduleSize = finderRun > 0 ? finderRun / 7 : sourceSize / 25;
    if (moduleSize < 1) moduleSize = 1;

    // Total modules in the symbol (without quiet zone)
    let moduleCount = Math.round(sourceSize / moduleSize);
    // Normalise to a valid QR module count
    const validCounts = [];
    for (let c = 21; c <= 177; c += 4) {
        if (c <= moduleCount) validCounts.push(c);
    }
    if (validCounts.length) {
        moduleCount = validCounts[validCounts.length - 1];
    } else {
        moduleCount = 21;
    }

    // The quiet zone (4 modules) means the drawn symbol doesn't start
    // at pixel 0. Work out the offset from the measured finder run.
    const totalWithQuiet = moduleCount + 8;
    const fittedModule = size / totalWithQuiet;

    ctx.fillStyle = bgColor.value;
    ctx.fillRect(0, 0, size, size);

    const quiet = 4 * fittedModule;

    for (let my = 0; my < moduleCount; my++) {
        for (let mx = 0; mx < moduleCount; mx++) {

            // Sample the centre of this module from the source render
            const sx = Math.floor(
                (my + 0.5) * (sourceSize / moduleCount)
            );
            const sy = Math.floor(
                (mx + 0.5) * (sourceSize / moduleCount)
            );

            if (!isDark(sx, sy)) continue;

            const px = quiet + mx * fittedModule;
            const py = quiet + my * fittedModule;

            ctx.fillStyle = qrColor.value;

            if (qrStyle.value === "rounded") {
                const radius = fittedModule * 0.35;
                ctx.beginPath();
                ctx.roundRect(px, py, fittedModule, fittedModule, radius);
                ctx.fill();
            } else if (qrStyle.value === "dots") {
                const radius = fittedModule * 0.5;
                ctx.beginPath();
                ctx.arc(
                    px + fittedModule / 2,
                    py + fittedModule / 2,
                    radius,
                    0,
                    Math.PI * 2
                );
                ctx.fill();
            } else {
                ctx.fillRect(px, py, fittedModule, fittedModule);
            }
        }
    }

    return canvas;
}
function generateQR() {
    if (typeof QRCode === "undefined") {
        showToast("QR library could not be loaded.");
        return;
    }

    const content = getQRContent();

    if (!content) {
        return;
    }

    qrCode.innerHTML = "";

    const size = Number(qrSize.value);
    const correctionLevel =
        QRCode.CorrectLevel[errorCorrection.value];

    /*
     * Build the QR code into an off-screen container
     * so we can read its pixels and restyle the modules
     * (classic / rounded / dots).
     */
    const builder = document.createElement("div");

    currentQRCode = new QRCode(builder, {
        text: content,
        width: size,
        height: size,
        colorDark: qrColor.value,
        colorLight: bgColor.value,
        correctLevel: correctionLevel
    });

    const qrCanvas = builder.querySelector("canvas");

    // Apply the selected QR style (classic / rounded / dots)
    let styledCanvas = applyQRStyle(qrCanvas, size);

    // Add an optional caption frame beneath the QR
    if (captionInput && captionInput.value.trim()) {
        styledCanvas = composeWithCaption(styledCanvas, captionInput.value);
    }

    qrCode.appendChild(styledCanvas);

    emptyState.style.display = "none";
    qrCode.style.display = "flex";

    downloadButton.disabled = false;
    printButton.disabled = false;
    shareButton.disabled = false;
    if (downloadSvgButton) downloadSvgButton.disabled = false;
    if (downloadPdfButton) downloadPdfButton.disabled = false;

    // Add uploaded logo after QR is generated
if (logoUpload.files && logoUpload.files[0]) {
    const file = logoUpload.files[0];
    const reader = new FileReader();

    reader.onload = function (event) {
        if (!styledCanvas) {
            showToast("Could not prepare QR code.");
            return;
        }

        const logo = new Image();

        logo.onload = function () {
            const canvas = document.createElement("canvas");
            canvas.width = size;
            canvas.height = size;

            const ctx = canvas.getContext("2d");

            // Draw QR code
            ctx.drawImage(styledCanvas, 0, 0, size, size);

            // Calculate logo size
            const logoPercentage = Number(logoSize.value);
            const logoDimensions = Math.round(
                size * (logoPercentage / 100)
            );

            const logoX = (size - logoDimensions) / 2;
            const logoY = (size - logoDimensions) / 2;

            // Logo background
            if (logoBackground.value === "white") {
                ctx.fillStyle = "#ffffff";

                ctx.beginPath();
                ctx.roundRect(
                    logoX - 8,
                    logoY - 8,
                    logoDimensions + 16,
                    logoDimensions + 16,
                    Number(logoRadius.value)
                );
                ctx.fill();
            }

            // Rounded logo clipping
            ctx.save();

            ctx.beginPath();
            ctx.roundRect(
                logoX,
                logoY,
                logoDimensions,
                logoDimensions,
                Number(logoRadius.value)
            );
            ctx.clip();

            // Draw logo
            ctx.drawImage(
                logo,
                logoX,
                logoY,
                logoDimensions,
                logoDimensions
            );

            ctx.restore();

            // Replace preview
            qrCode.innerHTML = "";
            qrCode.appendChild(canvas);

            saveCurrentToHistory(content);

            showToast("QR code with logo generated!");
        };

        logo.src = event.target.result;
    };

    reader.readAsDataURL(file);
} else {
    saveCurrentToHistory(content);
    showToast("QR code generated successfully!");
}
}

        /*
         * Capture the QR currently displayed in the preview and store
         * it in the Recent QR Codes history (localStorage-backed).
         */
        function saveCurrentToHistory(content) {
            const canvas = qrCode.querySelector("canvas");
            const image = canvas
                ? canvas.toDataURL("image/png")
                : (qrCode.querySelector("img") || {}).src;

            if (!image) return;

            addToHistory({
                id: Date.now() + "-" + Math.random().toString(36).slice(2, 8),
                type: currentType.toUpperCase(),
                label: buildHistoryLabel(),
                content: content || buildHistoryLabel(),
                image: image,
                createdAt: Date.now(),
                inputs: collectCurrentInputs(),
                options: {
                    qrColor: qrColor.value,
                    bgColor: bgColor.value,
                    qrSize: qrSize.value,
                    qrStyle: qrStyle.value,
                    errorCorrection: errorCorrection.value
                }
            });
        }

        function resetGenerator() {
            currentType = "url";

            document.querySelectorAll(".type-button").forEach(function (button) {
                button.classList.remove("active");
            });

            document
                .querySelector('.type-button[data-type="url"]')
                .classList.add("active");

            renderFields();

            qrCode.innerHTML = "";
            qrCode.style.display = "none";
            emptyState.style.display = "block";

            downloadButton.disabled = true;
            printButton.disabled = true;
            shareButton.disabled = true;
            if (downloadSvgButton) downloadSvgButton.disabled = true;
            if (downloadPdfButton) downloadPdfButton.disabled = true;

            qrColor.value = "#000000";
            bgColor.value = "#ffffff";
           errorCorrection.value = "M";
           logoUpload.value = "";
           if (captionInput) captionInput.value = "";

            updateContrastWarning();

            showToast("Generator reset.");
        }

        function getQRImage() {
            const canvas = qrCode.querySelector("canvas");

            if (canvas) {
                return canvas.toDataURL("image/png");
            }

            const image = qrCode.querySelector("img");

            if (image) {
                return image.src;
            }

            return null;
        }

        function downloadQR() {
            const image = getQRImage();

            if (!image) {
                showToast("Generate a QR code first.");
                return;
            }

            const link = document.createElement("a");

            link.href = image;
            link.download = "QRify-QR-Code.png";

            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            showToast("QR code downloaded.");
        }

        /*
         * Convert the current QR (data URL) into a File so it can be
         * passed to the native Web Share API.
         */
        function dataURLToFile(dataURL, filename) {
            const parts = dataURL.split(",");
            const meta = parts[0];
            const base64 = parts[1];

            const mimeMatch = meta.match(/data:([^;]+)/);
            const mime = mimeMatch ? mimeMatch[1] : "image/png";

            const binary = atob(base64);
            const bytes = new Uint8Array(binary.length);

            for (let i = 0; i < binary.length; i++) {
                bytes[i] = binary.charCodeAt(i);
            }

            return new File([bytes], filename, { type: mime });
        }

        async function shareQR() {
            const image = getQRImage();

            if (!image) {
                showToast("Generate a QR code first.");
                return;
            }

            const label = buildHistoryLabel() || "QR Code";

            /*
             * Preferred path: native share sheet (mobile / supported
             * desktop browsers). We share the actual PNG image file.
             */
            if (navigator.share) {
                try {
                    const file = dataURLToFile(image, "QRify-QR-Code.png");

                    if (
                        navigator.canShare &&
                        navigator.canShare({ files: [file] })
                    ) {
                        await navigator.share({
                            files: [file],
                            title: "QRify — QR Code",
                            text: label
                        });
                    } else {
                        await navigator.share({
                            title: "QRify — QR Code",
                            text: label
                        });
                    }

                    showToast("Shared successfully.");
                    return;
                } catch (error) {
                    // User dismissed the share sheet — not an error
                    if (error && error.name === "AbortError") {
                        return;
                    }
                    // Fall through to the copy/download fallback
                }
            }

            /*
             * Fallback (desktop / no native share):
             * copy the image to the clipboard when possible, and offer
             * a download if the Clipboard API isn't available.
             */
            if (
                navigator.clipboard &&
                window.ClipboardItem &&
                typeof navigator.clipboard.write === "function"
            ) {
                try {
                    const blob = await (await fetch(image)).blob();

                    await navigator.clipboard.write([
                        new ClipboardItem({ [blob.type]: blob })
                    ]);

                    showToast("QR code copied to clipboard.");
                    return;
                } catch (error) {
                    // Clipboard write failed — fall back to download
                }
            }

            // Last resort: download the image
            const link = document.createElement("a");

            link.href = image;
            link.download = "QRify-QR-Code.png";

            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            showToast("Sharing not supported — image downloaded instead.");
        }

        function printQR() {
            const image = getQRImage();

            if (!image) {
                showToast("Generate a QR code first.");
                return;
            }

            const printWindow = window.open("", "_blank");

            if (!printWindow) {
                showToast("Please allow pop-ups to print.");
                return;
            }

            printWindow.document.write(
                "<!DOCTYPE html>" +
                "<html>" +
                "<head>" +
                "<title>QRify QR Code</title>" +
                "<style>" +
                "body{margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;font-family:Arial,sans-serif;}" +
                "img{max-width:80vw;max-height:80vh;}" +
                "</style>" +
                "</head>" +
                "<body>" +
                "<img src=\"" +
                image +
                "\" alt=\"QR Code\">" +
                "</body>" +
                "</html>"
            );

            printWindow.document.close();

            setTimeout(function () {
                printWindow.focus();
                printWindow.print();
            }, 300);
        }

        /* =========================
           CONTRAST WARNING
        ========================= */

        function hexToRgb(hex) {
            const clean = hex.replace("#", "");
            const full = clean.length === 3
                ? clean.split("").map(function (c) { return c + c; }).join("")
                : clean;

            return {
                r: parseInt(full.slice(0, 2), 16),
                g: parseInt(full.slice(2, 4), 16),
                b: parseInt(full.slice(4, 6), 16)
            };
        }

        function relativeLuminance(hex) {
            const rgb = hexToRgb(hex);

            const channel = function (value) {
                const v = value / 255;
                return v <= 0.03928
                    ? v / 12.92
                    : Math.pow((v + 0.055) / 1.055, 2.4);
            };

            return (
                0.2126 * channel(rgb.r) +
                0.7152 * channel(rgb.g) +
                0.0722 * channel(rgb.b)
            );
        }

        function contrastRatio(a, b) {
            const l1 = relativeLuminance(a);
            const l2 = relativeLuminance(b);
            const lighter = Math.max(l1, l2);
            const darker = Math.min(l1, l2);

            return (lighter + 0.05) / (darker + 0.05);
        }

        function updateContrastWarning() {
            if (!contrastWarning) return;

            const ratio = contrastRatio(qrColor.value, bgColor.value);

            // QR codes need strong contrast to scan reliably.
            // A ratio below ~3 is risky; below ~2 is likely to fail.
            if (ratio < 3) {
                contrastWarning.classList.remove("hidden");
            } else {
                contrastWarning.classList.add("hidden");
            }
        }

        /* =========================
           CAPTION FRAME
        ========================= */

        function composeWithCaption(sourceCanvas, caption) {
            if (!caption || !caption.trim()) return sourceCanvas;

            const pad = 18;
            const captionHeight = 46;

            const canvas = document.createElement("canvas");
            canvas.width = sourceCanvas.width + pad * 2;
            canvas.height = sourceCanvas.height + pad + captionHeight;

            const ctx = canvas.getContext("2d");

            ctx.fillStyle = bgColor.value;
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            ctx.drawImage(sourceCanvas, pad, pad);

            ctx.fillStyle = qrColor.value;
            ctx.font = "600 20px Inter, Arial, sans-serif";
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillText(caption.trim(), canvas.width / 2, sourceCanvas.height + pad + captionHeight / 2);

            return canvas;
        }

        /* =========================
           SVG EXPORT
        ========================= */

        function buildSVG() {
            const canvas = qrCode.querySelector("canvas");
            if (!canvas) return null;

            const dataURL = canvas.toDataURL("image/png");

            const svg =
                '<?xml version="1.0" encoding="UTF-8"?>\n' +
                '<svg xmlns="http://www.w3.org/2000/svg" ' +
                'xmlns:xlink="http://www.w3.org/1999/xlink" ' +
                'width="' + canvas.width + '" height="' + canvas.height + '" ' +
                'viewBox="0 0 ' + canvas.width + " " + canvas.height + '">\n' +
                '  <image width="' + canvas.width + '" height="' + canvas.height + '" ' +
                'xlink:href="' + dataURL + '"/>\n' +
                '</svg>';

            return svg;
        }

        function downloadSVG() {
            const svg = buildSVG();

            if (!svg) {
                showToast("Generate a QR code first.", true);
                return;
            }

            const blob = new Blob([svg], { type: "image/svg+xml" });
            const url = URL.createObjectURL(blob);

            const link = document.createElement("a");
            link.href = url;
            link.download = "QRify-QR-Code.svg";

            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            URL.revokeObjectURL(url);

            showToast("SVG downloaded.");
        }

        /* =========================
           PDF EXPORT (no external libs)
        ========================= */

        function downloadPDF() {
            const image = getQRImage();

            if (!image) {
                showToast("Generate a QR code first.", true);
                return;
            }

            const canvas = qrCode.querySelector("canvas");
            const size = canvas ? canvas.width : 250;

            /*
             * Minimal, dependency-free PDF:
             * one page, embeds the PNG via a DCTDecode XObject.
             */
            const binary = atob(image.split(",")[1]);
            const imgBytes = new Uint8Array(binary.length);
            for (let i = 0; i < binary.length; i++) {
                imgBytes[i] = binary.charCodeAt(i);
            }

            const pageW = 595; // A4 points
            const pageH = 842;
            const margin = 60;
            const drawSize = Math.min(pageW - margin * 2, pageH - margin * 2);
            const x = (pageW - drawSize) / 2;
            const y = (pageH - drawSize) / 2;

            const encoder = new TextEncoder();
            const chunks = [];
            const offsets = [];
            let length = 0;

            function push(str) {
                const bytes = str instanceof Uint8Array
                    ? str
                    : encoder.encode(str);
                chunks.push(bytes);
                length += bytes.length;
            }

            function startObj() {
                offsets.push(length);
            }

            // 1: Catalog, 2: Pages, 3: Page, 4: Contents, 5: Image
            push("%PDF-1.4\n");

            startObj();
            push("1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n");

            startObj();
            push("2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n");

            startObj();
            push(
                "3 0 obj\n<< /Type /Page /Parent 2 0 R " +
                "/MediaBox [0 0 " + pageW + " " + pageH + "] " +
                "/Resources << /XObject << /Im0 5 0 R >> >> " +
                "/Contents 4 0 R >>\nendobj\n"
            );

            const content = "q " + drawSize + " 0 0 " + drawSize + " " + x + " " + y +
                " cm /Im0 Do Q";

            startObj();
            push(
                "4 0 obj\n<< /Length " + content.length + " >>\nstream\n" +
                content + "\nendstream\nendobj\n"
            );

            startObj();
            push(
                "5 0 obj\n<< /Type /XObject /Subtype /Image " +
                "/Width " + size + " /Height " + size +
                " /ColorSpace /DeviceRGB /BitsPerComponent 8 " +
                "/Filter /DCTDecode /Length " + imgBytes.length + " >>\nstream\n"
            );
            push(imgBytes);
            push("\nendstream\nendobj\n");

            const xrefStart = length;

            let xref = "xref\n0 6\n0000000000 65535 f \n";
            offsets.forEach(function (off) {
                xref += String(off).padStart(10, "0") + " 00000 n \n";
            });

            push(xref);

            push(
                "trailer\n<< /Size 6 /Root 1 0 R >>\n" +
                "startxref\n" + xrefStart + "\n%%EOF"
            );

            const blob = new Blob(chunks, { type: "application/pdf" });
            const url = URL.createObjectURL(blob);

            const link = document.createElement("a");
            link.href = url;
            link.download = "QRify-QR-Code.pdf";

            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            URL.revokeObjectURL(url);

            showToast("PDF downloaded.");
        }

        /* =========================
           SCANNER / DECODER
        ========================= */

        const scanFile = document.getElementById("scanFile");
        const scanVideo = document.getElementById("scanVideo");
        const scanCanvas = document.getElementById("scanCanvas");
        const scanResult = document.getElementById("scanResult");
        const scanType = document.getElementById("scanType");
        const scanText = document.getElementById("scanText");
        const scanCameraButton = document.getElementById("scanCameraButton");
        const scanStopButton = document.getElementById("scanStopButton");
        const scanUseButton = document.getElementById("scanUseButton");
        const scanCopyButton = document.getElementById("scanCopyButton");

        let scanStream = null;
        let scanLoopId = null;

        function initScanner() {
            if (scanFile) {
                scanFile.addEventListener("change", function () {
                    const file = scanFile.files && scanFile.files[0];
                    if (!file) return;

                    const reader = new FileReader();

                    reader.onload = function (event) {
                        const img = new Image();

                        img.onload = function () {
                            const ctx = scanCanvas.getContext("2d");
                            scanCanvas.width = img.width;
                            scanCanvas.height = img.height;
                            ctx.drawImage(img, 0, 0, img.width, img.height);

                            decodeFromCanvas(scanCanvas);
                        };

                        img.src = event.target.result;
                    };

                    reader.readAsDataURL(file);
                });
            }

            if (scanCameraButton) {
                scanCameraButton.addEventListener("click", startCamera);
            }

            if (scanStopButton) {
                scanStopButton.addEventListener("click", stopCamera);
            }

            if (scanUseButton) {
                scanUseButton.addEventListener("click", function () {
                    const decoded = scanText.value;

                    if (!decoded) return;

                    // Reset into generator mode with the decoded text
                    document.querySelectorAll(".mode-tab").forEach(function (t) {
                        t.classList.toggle("active", t.dataset.mode === "generate");
                    });
                    document.querySelectorAll(".mode-panel").forEach(function (p) {
                        p.classList.remove("active");
                    });
                    document.getElementById("modeGenerate").classList.add("active");

                    currentType = "text";
                    document.querySelectorAll(".type-button").forEach(function (b) {
                        b.classList.toggle("active", b.dataset.type === "text");
                    });

                    renderFields();

                    const field = document.getElementById("textInput");
                    if (field) field.value = decoded;

                    generateQR();
                });
            }

            if (scanCopyButton) {
                scanCopyButton.addEventListener("click", async function () {
                    try {
                        await navigator.clipboard.writeText(scanText.value);
                        showToast("Copied to clipboard.");
                    } catch (error) {
                        showToast("Could not copy.", true);
                    }
                });
            }

            /*
             * qrcodejs cannot decode. We implement a compact decoder by
             * attempting to read the QR using the canvas; if a decoder
             * isn't available we show a clear message.
             */
            if (typeof window.jsQR === "undefined") {
                // Decoder is loaded lazily; see tryDecode below.
            }
        }

        async function startCamera() {
            try {
                scanStream = await navigator.mediaDevices.getUserMedia({
                    video: { facingMode: "environment" }
                });

                scanVideo.srcObject = scanStream;
                scanVideo.classList.remove("hidden");
                scanStopButton.classList.remove("hidden");

                await scanVideo.play();

                scanLoopId = setInterval(function () {
                    if (scanVideo.readyState === scanVideo.HAVE_ENOUGH_DATA) {
                        const ctx = scanCanvas.getContext("2d");
                        scanCanvas.width = scanVideo.videoWidth;
                        scanCanvas.height = scanVideo.videoHeight;
                        ctx.drawImage(scanVideo, 0, 0);
                        decodeFromCanvas(scanCanvas);
                    }
                }, 400);
            } catch (error) {
                showToast("Camera unavailable or permission denied.", true);
            }
        }

        function stopCamera() {
            if (scanLoopId) {
                clearInterval(scanLoopId);
                scanLoopId = null;
            }

            if (scanStream) {
                scanStream.getTracks().forEach(function (t) { t.stop(); });
                scanStream = null;
            }

            scanVideo.classList.add("hidden");
            if (scanStopButton) scanStopButton.classList.add("hidden");
        }

        function classifyScanned(text) {
            if (/^https?:\/\//i.test(text)) return "URL";
            if (/^mailto:/i.test(text)) return "Email";
            if (/^tel:/i.test(text)) return "Phone";
            if (/^SMSTO:/i.test(text)) return "SMS";
            if (/^WIFI:/i.test(text)) return "Wi-Fi";
            if (/^BEGIN:VCARD/i.test(text)) return "Contact";
            if (/^BEGIN:VEVENT/i.test(text)) return "Event";
            if (/^geo:/i.test(text)) return "Location";
            return "Text";
        }

        function decodeFromCanvas(canvas) {
            if (typeof window.jsQR !== "function") {
                showToast(
                    "QR decoder not available yet.",
                    true
                );
                return;
            }

            const ctx = canvas.getContext("2d");
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

            const result = window.jsQR(
                imageData.data,
                canvas.width,
                canvas.height
            );

            if (result) {
                scanResult.classList.remove("hidden");
                scanType.textContent = classifyScanned(result.data);
                scanText.value = result.data;
                showToast("QR code decoded!");
                stopCamera();
            }
        }

        /* =========================
           BATCH / BULK GENERATION
        ========================= */

        const batchInput = document.getElementById("batchInput");
        const batchGrid = document.getElementById("batchGrid");
        const batchCount = document.getElementById("batchCount");
        const batchGenerateButton = document.getElementById("batchGenerateButton");
        const batchZipButton = document.getElementById("batchZipButton");
        const batchPrintButton = document.getElementById("batchPrintButton");

        let batchItems = [];

        function initBatch() {
            if (batchGenerateButton) {
                batchGenerateButton.addEventListener("click", buildBatch);
            }

            if (batchZipButton) {
                batchZipButton.addEventListener("click", downloadBatchZip);
            }

            if (batchPrintButton) {
                batchPrintButton.addEventListener("click", printBatchSheet);
            }
        }

        function buildBatch() {
            const lines = batchInput.value
                .split("\n")
                .map(function (l) { return l.trim(); })
                .filter(function (l) { return l.length > 0; });

            batchGrid.innerHTML = "";
            batchItems = [];

            if (lines.length === 0) {
                showToast("Enter at least one line.", true);
                return;
            }

            lines.forEach(function (text, index) {
                const holder = document.createElement("div");
                holder.className = "batch-item";

                const builder = document.createElement("div");

                new QRCode(builder, {
                    text: text,
                    width: 180,
                    height: 180,
                    colorDark: qrColor.value,
                    colorLight: bgColor.value,
                    correctLevel: QRCode.CorrectLevel.M
                });

                const canvas = builder.querySelector("canvas");

                const img = document.createElement("img");
                img.src = canvas ? canvas.toDataURL("image/png") : "";
                img.alt = text;

                const label = document.createElement("span");
                label.className = "batch-label";
                label.textContent = text;

                holder.appendChild(img);
                holder.appendChild(label);
                batchGrid.appendChild(holder);

                batchItems.push({ text: text, dataURL: img.src, index: index + 1 });
            });

            if (batchCount) {
                batchCount.textContent = batchItems.length + " QR codes generated.";
            }

            showToast("Generated " + batchItems.length + " QR codes.");
        }

        /*
         * Build a ZIP archive manually (store, no compression) so we
         * don't need an external library.
         */
        function buildZip(files) {
            const encoder = new TextEncoder();
            const parts = [];
            const central = [];
            let offset = 0;

            function crc32(bytes) {
                let crc = -1;
                for (let i = 0; i < bytes.length; i++) {
                    crc ^= bytes[i];
                    for (let j = 0; j < 8; j++) {
                        crc = (crc >>> 1) ^ (0xEDB88320 & -(crc & 1));
                    }
                }
                return (crc ^ -1) >>> 0;
            }

            files.forEach(function (file) {
                const nameBytes = encoder.encode(file.name);
                const dataBytes = file.bytes;
                const crc = crc32(dataBytes);
                const size = dataBytes.length;

                // Local file header
                const local = new Uint8Array(30 + nameBytes.length);
                const lv = new DataView(local.buffer);
                lv.setUint32(0, 0x04034b50, true);
                lv.setUint16(4, 20, true);
                lv.setUint16(6, 0, true);
                lv.setUint16(8, 0, true);
                lv.setUint16(10, 0, true);
                lv.setUint16(12, 0, true);
                lv.setUint32(14, crc, true);
                lv.setUint32(18, size, true);
                lv.setUint32(22, size, true);
                lv.setUint16(26, nameBytes.length, true);
                lv.setUint16(28, 0, true);
                local.set(nameBytes, 30);

                parts.push(local);
                parts.push(dataBytes);

                // Central directory
                const cd = new Uint8Array(46 + nameBytes.length);
                const cv = new DataView(cd.buffer);
                cv.setUint32(0, 0x02014b50, true);
                cv.setUint16(4, 20, true);
                cv.setUint16(6, 20, true);
                cv.setUint16(8, 0, true);
                cv.setUint16(10, 0, true);
                cv.setUint16(12, 0, true);
                cv.setUint16(14, 0, true);
                cv.setUint32(16, crc, true);
                cv.setUint32(20, size, true);
                cv.setUint32(24, size, true);
                cv.setUint16(28, nameBytes.length, true);
                cv.setUint16(30, 0, true);
                cv.setUint16(32, 0, true);
                cv.setUint16(34, 0, true);
                cv.setUint16(36, 0, true);
                cv.setUint32(38, 0, true);
                cv.setUint32(42, offset, true);
                cd.set(nameBytes, 46);

                central.push(cd);

                offset += local.length + dataBytes.length;
            });

            let centralSize = 0;
            central.forEach(function (c) { centralSize += c.length; });

            const end = new Uint8Array(22);
            const ev = new DataView(end.buffer);
            ev.setUint32(0, 0x06054b50, true);
            ev.setUint16(8, files.length, true);
            ev.setUint16(10, files.length, true);
            ev.setUint32(12, centralSize, true);
            ev.setUint32(16, offset, true);

            const all = parts.concat(central).concat([end]);

            let totalLen = 0;
            all.forEach(function (p) { totalLen += p.length; });

            const out = new Uint8Array(totalLen);
            let pos = 0;
            all.forEach(function (p) {
                out.set(p, pos);
                pos += p.length;
            });

            return out;
        }

        function dataURLToBytes(dataURL) {
            const binary = atob(dataURL.split(",")[1]);
            const bytes = new Uint8Array(binary.length);
            for (let i = 0; i < binary.length; i++) {
                bytes[i] = binary.charCodeAt(i);
            }
            return bytes;
        }

        function downloadBatchZip() {
            if (batchItems.length === 0) {
                showToast("Generate batch QR codes first.", true);
                return;
            }

            const files = batchItems.map(function (item) {
                return {
                    name: "qr-" + String(item.index).padStart(3, "0") + ".png",
                    bytes: dataURLToBytes(item.dataURL)
                };
            });

            const zipBytes = buildZip(files);
            const blob = new Blob([zipBytes], { type: "application/zip" });
            const url = URL.createObjectURL(blob);

            const link = document.createElement("a");
            link.href = url;
            link.download = "QRify-Batch.zip";

            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            URL.revokeObjectURL(url);

            showToast("ZIP downloaded (" + files.length + " files).");
        }

        function printBatchSheet() {
            if (batchItems.length === 0) {
                showToast("Generate batch QR codes first.", true);
                return;
            }

            const win = window.open("", "_blank");

            if (!win) {
                showToast("Please allow pop-ups to print.", true);
                return;
            }

            let html =
                "<!DOCTYPE html><html><head><title>QRify Batch Sheet</title>" +
                "<style>body{font-family:Arial;margin:20px;}" +
                ".grid{display:grid;grid-template-columns:repeat(3,1fr);gap:20px;}" +
                ".cell{text-align:center;border:1px solid #ddd;padding:10px;border-radius:8px;}" +
                "img{width:160px;height:160px;}" +
                ".cap{font-size:11px;word-break:break-all;margin-top:6px;}</style></head><body>" +
                "<h2>QRify — Batch Sheet</h2><div class='grid'>";

            batchItems.forEach(function (item) {
                html +=
                    "<div class='cell'><img src='" + item.dataURL + "'>" +
                    "<div class='cap'>" + item.text.replace(/</g, "&lt;") + "</div></div>";
            });

            html += "</div></body></html>";

            win.document.write(html);
            win.document.close();

            setTimeout(function () {
                win.focus();
                win.print();
            }, 300);
        }

        /* =========================
           MINI ANALYTICS (local)
        ========================= */

        function updateMiniStats() {
            if (!miniStats) return;

            if (history.length === 0) {
                miniStats.innerHTML = "";
                return;
            }

            const counts = {};

            history.forEach(function (item) {
                counts[item.type] = (counts[item.type] || 0) + 1;
            });

            const top = Object.keys(counts)
                .sort(function (a, b) { return counts[b] - counts[a]; })
                .slice(0, 3);

            const chips = top.map(function (type) {
                return (
                    '<span class="stat-chip">' + escapeHTML(type) +
                    " · " + counts[type] + "</span>"
                );
            }).join("");

            miniStats.innerHTML =
                '<span class="stats-label">Total: ' + history.length + "</span>" + chips;
        }

        /* =========================
           i18n
        ========================= */

        const TRANSLATIONS = {
            en: {
                badge: "FREE QR CODE GENERATOR",
                heroTitle1: "Create QR Codes",
                heroTitle2: "Instantly.",
                heroSubtitle: "Generate professional QR codes for websites, text, email, phone numbers and Wi-Fi. Fast, simple and free.",
                tabGenerate: "Generator",
                tabScan: "Scanner",
                tabBatch: "Bulk",
                createTitle: "Create your QR Code",
                colorPresets: "Color Presets",
                qrColor: "QR Color",
                bgColor: "Background",
                contrastWarning: "Low contrast — this QR code may not scan. Try a darker foreground or lighter background.",
                qrStyle: "QR Style",
                qrSize: "QR Size",
                errorCorrection: "Error Correction",
                caption: "Caption (optional)",
                qrLogo: "QR Logo",
                generate: "Generate QR",
                reset: "Reset",
                preview: "Preview",
                emptyTitle: "Your QR code will appear here",
                emptyHint: "Enter your information and click Generate QR.",
                downloadPng: "Download PNG",
                downloadSvg: "Download SVG",
                downloadPdf: "Download PDF",
                share: "Share QR Code",
                print: "Print",
                recent: "📜 Recent QR Codes",
                clearAll: "Clear All",
                scanTitle: "Scan / Decode a QR Code",
                scanUpload: "Upload a QR image",
                scanCamera: "Use Camera",
                scanStop: "Stop Camera",
                scanResultTitle: "Decoded Result",
                scanUse: "Use this content",
                scanCopy: "Copy",
                batchTitle: "Bulk QR Generation",
                batchInput: "Enter one URL or text per line",
                batchGenerate: "Generate All",
                batchDownloadZip: "Download ZIP",
                batchPrint: "Print Sheet"
            },
            fr: {
                badge: "GÉNÉRATEUR DE QR CODE GRATUIT",
                heroTitle1: "Créez des QR Codes",
                heroTitle2: "Instantanément.",
                heroSubtitle: "Générez des QR codes professionnels pour sites web, texte, e-mail, téléphone et Wi-Fi. Rapide, simple et gratuit.",
                tabGenerate: "Générateur",
                tabScan: "Scanner",
                tabBatch: "En lot",
                createTitle: "Créez votre QR Code",
                colorPresets: "Couleurs prédéfinies",
                qrColor: "Couleur du QR",
                bgColor: "Arrière-plan",
                contrastWarning: "Faible contraste — ce QR code risque de ne pas être scanné. Essayez un premier plan plus foncé ou un fond plus clair.",
                qrStyle: "Style du QR",
                qrSize: "Taille du QR",
                errorCorrection: "Correction d'erreur",
                caption: "Légende (facultatif)",
                qrLogo: "Logo du QR",
                generate: "Générer le QR",
                reset: "Réinitialiser",
                preview: "Aperçu",
                emptyTitle: "Votre QR code apparaîtra ici",
                emptyHint: "Entrez vos informations et cliquez sur Générer le QR.",
                downloadPng: "Télécharger PNG",
                downloadSvg: "Télécharger SVG",
                downloadPdf: "Télécharger PDF",
                share: "Partager le QR",
                print: "Imprimer",
                recent: "📜 QR Codes récents",
                clearAll: "Tout effacer",
                scanTitle: "Scanner / Décoder un QR Code",
                scanUpload: "Téléverser une image QR",
                scanCamera: "Utiliser la caméra",
                scanStop: "Arrêter la caméra",
                scanResultTitle: "Résultat décodé",
                scanUse: "Utiliser ce contenu",
                scanCopy: "Copier",
                batchTitle: "Génération en lot",
                batchInput: "Entrez une URL ou un texte par ligne",
                batchGenerate: "Tout générer",
                batchDownloadZip: "Télécharger ZIP",
                batchPrint: "Imprimer la feuille"
            },
            es: {
                badge: "GENERADOR DE QR GRATIS",
                heroTitle1: "Crea Códigos QR",
                heroTitle2: "Al Instante.",
                heroSubtitle: "Genera códigos QR profesionales para sitios web, texto, correo, teléfono y Wi-Fi. Rápido, simple y gratis.",
                tabGenerate: "Generador",
                tabScan: "Escáner",
                tabBatch: "Lote",
                createTitle: "Crea tu Código QR",
                colorPresets: "Colores predefinidos",
                qrColor: "Color del QR",
                bgColor: "Fondo",
                contrastWarning: "Bajo contraste — este código QR podría no escanearse. Prueba un primer plano más oscuro o un fondo más claro.",
                qrStyle: "Estilo del QR",
                qrSize: "Tamaño del QR",
                errorCorrection: "Corrección de errores",
                caption: "Leyenda (opcional)",
                qrLogo: "Logo del QR",
                generate: "Generar QR",
                reset: "Reiniciar",
                preview: "Vista previa",
                emptyTitle: "Tu código QR aparecerá aquí",
                emptyHint: "Ingresa tu información y haz clic en Generar QR.",
                downloadPng: "Descargar PNG",
                downloadSvg: "Descargar SVG",
                downloadPdf: "Descargar PDF",
                share: "Compartir QR",
                print: "Imprimir",
                recent: "📜 Códigos QR recientes",
                clearAll: "Borrar todo",
                scanTitle: "Escanear / Decodificar un QR",
                scanUpload: "Subir una imagen QR",
                scanCamera: "Usar cámara",
                scanStop: "Detener cámara",
                scanResultTitle: "Resultado decodificado",
                scanUse: "Usar este contenido",
                scanCopy: "Copiar",
                batchTitle: "Generación por lotes",
                batchInput: "Ingresa una URL o texto por línea",
                batchGenerate: "Generar todo",
                batchDownloadZip: "Descargar ZIP",
                batchPrint: "Imprimir hoja"
            }
        };

        function applyLanguage(lang) {
            const dict = TRANSLATIONS[lang] || TRANSLATIONS.en;

            document.querySelectorAll("[data-i18n]").forEach(function (el) {
                const key = el.dataset.i18n;
                if (dict[key]) el.textContent = dict[key];
            });

            localStorage.setItem("qrify-lang", lang);
        }

        themeButton.addEventListener("click", function () {
            document.body.classList.toggle("dark");

            const isDark = document.body.classList.contains("dark");

            themeButton.textContent = isDark ? "☀️" : "🌙";

            localStorage.setItem("qrify-theme", isDark ? "dark" : "light");
        });

        if (clearHistoryButton) {
            clearHistoryButton.addEventListener("click", clearHistory);
        }

        document.querySelectorAll(".type-button").forEach(function (button) {
            button.addEventListener("click", function () {
                document.querySelectorAll(".type-button").forEach(function (item) {
                    item.classList.remove("active");
                });

                button.classList.add("active");

                currentType = button.dataset.type;

                renderFields();
            });
        });

        generateButton.addEventListener("click", generateQR);
        resetButton.addEventListener("click", resetGenerator);
        downloadButton.addEventListener("click", downloadQR);
        printButton.addEventListener("click", printQR);
        shareButton.addEventListener("click", shareQR);
        downloadSvgButton.addEventListener("click", downloadSVG);
        downloadPdfButton.addEventListener("click", downloadPDF);

        qrStyle.addEventListener("change", function () {
            if (currentQRCode) {
                generateQR();
            }
        });

        removeLogoButton.addEventListener("click", function () {
            logoUpload.value = "";

            logoSize.value = "22";
            logoSizeValue.textContent = "22%";

            logoRadius.value = "12";
            logoRadiusValue.textContent = "12px";

            logoBackground.value = "white";

            if (currentQRCode) {
                generateQR();
            }

            showToast("Logo removed.");
        });

        /* Color presets */
        if (presetRow) {
            presetRow.querySelectorAll(".preset").forEach(function (btn) {
                btn.addEventListener("click", function () {
                    qrColor.value = btn.dataset.dark;
                    bgColor.value = btn.dataset.light;

                    updateContrastWarning();

                    if (currentQRCode) {
                        generateQR();
                    }
                });
            });
        }

        /* Contrast warning on manual color change */
        qrColor.addEventListener("input", updateContrastWarning);
        bgColor.addEventListener("input", updateContrastWarning);

        /* Caption change regenerates */
        if (captionInput) {
            captionInput.addEventListener("change", function () {
                if (currentQRCode) generateQR();
            });
        }

        /* Mode tabs */
        document.querySelectorAll(".mode-tab").forEach(function (tab) {
            tab.setAttribute("aria-selected", tab.classList.contains("active") ? "true" : "false");

            tab.addEventListener("click", function () {
                document.querySelectorAll(".mode-tab").forEach(function (t) {
                    t.classList.remove("active");
                    t.setAttribute("aria-selected", "false");
                });
                tab.classList.add("active");
                tab.setAttribute("aria-selected", "true");

                document.querySelectorAll(".mode-panel").forEach(function (p) {
                    p.classList.remove("active");
                });

                const mode = tab.dataset.mode;
                const panel = document.getElementById(
                    "mode" + mode.charAt(0).toUpperCase() + mode.slice(1)
                );
                if (panel) panel.classList.add("active");

                if (mode === "generate") updateContrastWarning();
            });
        });

        /* Language switcher */
        if (languageSelect) {
            languageSelect.addEventListener("change", function () {
                applyLanguage(languageSelect.value);
            });
        }

        /* Scanner */
        initScanner();

        /* Batch */
        initBatch();

        const savedTheme = localStorage.getItem("qrify-theme");

        if (savedTheme === "dark") {
            document.body.classList.add("dark");
            themeButton.textContent = "☀️";
        }

        const savedLang = localStorage.getItem("qrify-lang") || "en";
        if (languageSelect) languageSelect.value = savedLang;
        applyLanguage(savedLang);

        loadHistory();
        renderHistory();
        updateMiniStats();
        updateContrastWarning();

        renderFields();

   logoSize.addEventListener("input", function () {
    logoSizeValue.textContent = `${logoSize.value}%`;

    if (logoUpload.files && logoUpload.files[0]) {
        generateQR();
    }
});

logoRadius.addEventListener("input", function () {
    logoRadiusValue.textContent = `${logoRadius.value}px`;

    if (logoUpload.files && logoUpload.files[0]) {
        generateQR();
    }
});