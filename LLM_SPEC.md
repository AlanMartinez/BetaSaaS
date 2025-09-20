# NeonGIF Studio — Specification for LLM Contributors

This document describes expectations and constraints for language models collaborating on the NeonGIF Studio project.

## Project Goals

- Provide a single-page, client-side video to GIF converter.
- Emphasize a neon-on-carbon UI inspired by futuristic fintech dashboards.
- Maintain fast conversions by limiting video duration to 120 seconds and scaling GIF output for web sharing.

## Functional Requirements

1. **Video Intake**
   - Accepts files with MIME types `video/mp4`, `video/webm`, `video/ogg`, and `video/quicktime`.
   - Maximum duration: 120 seconds. Validation happens before invoking FFmpeg.
   - User feedback must clearly communicate validation failures and conversion progress.

2. **Conversion Pipeline**
   - Uses `@ffmpeg/ffmpeg` WebAssembly build loaded on demand.
   - Command template: `ffmpeg -i input.mp4 -vf "fps=15,scale=480:-1:flags=lanczos" -t 120 output.gif`.
   - Allow adjustments to frame rate or scale only via clearly labeled controls.

3. **Result Delivery**
   - Display generated GIF inline with download and restart options.
   - Ensure object URLs are revoked when replaced to avoid leaks.

## UX Principles

- Core call-to-action (CTA) must stay above the fold on 1440×900 desktops.
- Use bright lime (#9BFF2B) accents on deep charcoal (#050709–#12161F) backgrounds.
- Typography: Prefer "Poppins" for headings and "Inter" or system sans-serif for body text.
- Background may include gridlines and glow effects but must not compromise text contrast.

## Accessibility

- Minimum 4.5:1 contrast for body text against background.
- Buttons require visible focus outlines distinct from hover state.
- Status updates must be announced via `aria-live="polite"`.

## Coding Standards

- Use semantic HTML5 regions (header, main, footer).
- Keep CSS organized with logical sections (root tokens, layout, components, utilities).
- Avoid introducing frameworks or build tooling; the project is intentionally dependency-light.

## Testing Checklist

Before committing changes, ensure:

- `index.html` loads without console errors in Chromium-based browsers.
- Conversion completes successfully for a 10–15 second MP4 sample.
- ESLint/Prettier are not required; rely on consistent formatting.

