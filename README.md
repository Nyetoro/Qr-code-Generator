# QRify — QR Code Generator

A free, offline-friendly QR code generator built with vanilla **HTML, CSS, and JavaScript**. Generate, customize, export, batch-produce, and decode QR codes — all in the browser with **no build step, no backend, and no tracking**.

<p>
  <img alt="HTML" src="https://img.shields.io/badge/HTML5-E34F26?logo=html5&logoColor=white">
  <img alt="CSS" src="https://img.shields.io/badge/CSS3-1572B6?logo=css3&logoColor=white">
  <img alt="JavaScript" src="https://img.shields.io/badge/JavaScript-F7DF1E?logo=javascript&logoColor=black">
  <img alt="No dependencies" src="https://img.shields.io/badge/dependencies-0-brightgreen">
  <img alt="License" src="https://img.shields.io/badge/license-MIT-blue">
</p>

---

## ✨ Features

### Generate
- **9 content types** — URL, Text, Email, Phone, Wi-Fi, Contact (vCard), Event (calendar invite), SMS, and Location
- **Live preview** — see the QR code the moment you generate it
- **Smart validation** — clear error messages that focus the exact field to fix, so you never create a broken QR code

### Customize
- **3 styles** — Classic (square), Rounded, and Dots
- **Color presets** — 6 one-click themes (Classic, Ocean, Sunset, Forest, Grape, Mono)
- **Contrast warning** — warns you when foreground/background contrast is too low to scan
- **Sizes** — Small (180px) to Extra Large (500px)
- **Error correction** — Low / Medium / High / Very High
- **Logo upload** — place your own logo in the center, with adjustable size, corner radius, and background
- **Caption frame** — add an optional label beneath the QR code

### Export & Share
- **Download PNG** — raster image
- **Download SVG** — vector, scales to any size
- **Download PDF** — print-ready, generated with zero external libraries
- **Share** — uses the native share sheet when available, with clipboard/download fallback
- **Print** — sends a clean, centered copy to the printer

### Bulk Generation
- Paste many URLs or lines of text (one per line)
- Generate all at once
- **Download ZIP** — every QR as a numbered PNG, packaged into a ZIP built in-browser
- **Print Sheet** — a printable grid of all generated codes

### Scanner / Decoder
- **Upload a QR image** to decode it instantly
- **Use Camera** to scan live (requires HTTPS or `localhost`)
- Copy the decoded content or send it straight into the generator

### Productivity
- **Recent QR Codes history** — auto-saved with `localStorage`
- **Use Again** to reload any past QR (restores the type, inputs, colors, and options)
- **Delete** individual entries or **Clear All**
- **Mini analytics** — total count and your most-used content types

### Quality
- **3 languages** — English, French, and Spanish
- **Dark mode** — with your preference remembered
- **Accessible** — ARIA live regions, labeled controls, keyboard-friendly
- **Fully offline** — every library is bundled locally; no CDN calls

---

## 🚀 Getting Started

### Option 1 — Just open it
Clone or download the repo, then open `index.html` in your browser.

```bash
git clone https://github.com/nyetoro ime/qr-code-generator.git
cd qr-code-generator
# Open index.html in your browser
```

### Option 2 — Serve locally (recommended)
Serving over `http://localhost` unlocks the **camera scanner** (browsers block camera access on `file://`). Any static server works:

```bash
# Python 3
python -m http.server 8000

# Node.js
npx serve
```

Then visit `http://localhost:8000`.

---

## 📁 Project Structure

```
qr-code-generator/
├── index.html            # Markup & UI
├── style.css             # Styling, dark mode, responsive layout
├── script.js             # All application logic
├── favicon.png           # 32x32 favicon
├── favicon.ico           # Multi-size ICO
├── apple-touch-icon.png  # iOS home-screen icon
└── lib/
    ├── qrcode.min.js     # QR generation (davidshimjs/qrcodejs)
    └── jsQR.js           # QR decoding (cozmo/jsQR)
```

---

## 🛠️ Tech Stack

| Purpose | Library |
|---------|---------|
| QR generation | [qrcodejs](https://github.com/davidshimjs/qrcodejs) |
| QR decoding | [jsQR](https://github.com/cozmo/jsQR) |
| Everything else | Vanilla JavaScript — no framework, no build tools |

**Notable:** ZIP archives, PDF files, SVG output, and the QR restyling engine are all implemented from scratch — no extra dependencies.

---

## 🔒 Privacy

QRify runs **entirely in your browser**. There is no backend, no analytics, and no data ever leaves your device. Your history is stored only in your browser's `localStorage`, and you can clear it any time.

---

## 🗺️ Roadmap

- [ ] Vector (non-raster) PDF output
- [ ] Progressive Web App (installable, offline-first)
- [ ] QR frame templates (call-to-action banners)
- [ ] Undo for deleted history items
- [ ] Additional content types

---

## 🤝 Contributing

Contributions, issues, and feature requests are welcome. Feel free to open an issue or submit a pull request.

1. Fork the project
2. Create your branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

Released under the **MIT License**. You're free to use, modify, and distribute it.

---

## 🙏 Acknowledgements

- [davidshimjs/qrcodejs](https://github.com/davidshimjs/qrcodejs) for QR generation
- [cozmo/jsQR](https://github.com/cozmo/jsQR) for QR decoding

---

<p align="center">Built with ❤️ by QRify</p>
