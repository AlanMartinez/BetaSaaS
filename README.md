# NeonGIF Studio

NeonGIF Studio is a single-page web application for converting short video clips into animated GIFs directly in the browser. It uses the `@ffmpeg/ffmpeg` WebAssembly build so users can process files without uploading them to a server.

## Features

- Drag-and-drop upload area with real-time validation for supported video formats.
- Client-side conversion to GIF with configurable frame-rate and scaling tuned for performance.
- Visual feedback for conversion progress, completion state, and error handling.
- Modern neon-on-dark UI inspired by crypto dashboards, optimized for desktop and tablet viewports.

## Technology

- HTML5, CSS3, and vanilla JavaScript.
- [`@ffmpeg/ffmpeg`](https://github.com/ffmpegwasm/ffmpeg.wasm) loaded via CDN for WebAssembly-based transcoding.

## Usage

1. Open `index.html` in a modern Chromium, Firefox, or Safari browser.
2. Drag a video file (mp4, webm, ogg, quicktime) into the upload panel or use the file picker.
3. Click **Convert to GIF** to start processing. Progress updates will appear beneath the button.
4. Download the generated GIF or preview it directly on the page.

> **Note:** Videos longer than 120 seconds are rejected to keep conversions fast and memory-friendly.

## Development

No build step is required. Modify `styles.css` and `app.js` as needed, then refresh the browser to see changes.

## Specification for LLM Integrations

See [`LLM_SPEC.md`](./LLM_SPEC.md) for detailed guidance on extending or integrating automated agents with this project.
