# WavePing

WavePing is a separate prototype copied from the PAS Tendrils flow.

## Pages
- `index.html`: language selection, recording consent, confirmation and participant profile.
- `translator.html`: viewer translation interface.

## Profile hand-off
The participant profile is saved to `sessionStorage` as `wavepingParticipant` when Save Settings is selected. Continue to Sample App also saves the current profile if it has not already been saved. The translator reads that value and displays the participant name and selected voice.

This is browser-session storage, not a server database. It is available to the translator when opened in the same tab and origin.

## PWA
The folder includes a web app manifest, SVG icon and a service worker that caches the local application shell. The Tailwind, Font Awesome and Google Fonts dependencies still load from their external CDNs, so the first online load requires internet access.

## Prototype limitation
The translation interface remains a demonstration. The microphone, incoming translations and audio output are simulated; no live translation backend is connected yet.
