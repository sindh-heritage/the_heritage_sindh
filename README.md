# Muan Jo Daro — A Journey Through Ancient Sindh

A mobile-first cultural exhibition in 13 illustrated chapters, with Muan Jo Daro as the central story. Plain HTML, CSS, and JavaScript; no installation, build, account, or backend required.

## Preview locally

Open `index.html` directly, or run this command from the project folder:

```sh
python3 -m http.server 8080
```

Visit `http://localhost:8080`. To preview on your phone over the same Wi-Fi, use your computer's LAN IP with port 8080 and allow the server through your firewall if needed. Sharing a local preview deliberately explains that a public link is needed.

## Publish for free on GitHub Pages

1. Create a GitHub repository (for example, `sindh-heritage`). Upload this folder's contents, including `index.html` and `.nojekyll`, to the root of its `main` branch.
2. Open the repository's **Settings → Pages**.
3. Under **Build and deployment**, choose **Deploy from a branch**, select `main` and `/ (root)`, and save.
4. Wait for GitHub's Pages deployment to finish. Copy the exact published URL shown by GitHub. It is usually `https://YOUR-USERNAME.github.io/sindh-heritage/`.
5. Open that URL on a phone before printing a QR code. Relative paths support both repository subdirectories and custom domains.

No repository was created or published automatically. These source files are ready to upload to your chosen account and repository.

### Create the exhibition QR code

Use the final HTTPS URL, not the local preview. Chrome's built-in **Create QR code** action can generate a static QR without a subscription. Alternatively, use a QR tool that encodes the URL directly; avoid expiring dynamic redirects. Download the QR image and add a short caption: **Scan to explore Sindh — every scroll tells a story.** Print with a white quiet zone and good contrast, roughly 4–5 cm wide or larger for a tabletop display.

Test the actual print with the iPhone Camera app and an Android camera or Google Lens. Test with mobile data as well as Wi-Fi, in the exhibition lighting, and from a comfortable scanning distance. Confirm that all 13 chapters and craft buttons work. There is deliberately no QR scanner inside this website.

## Project structure

```text
index.html                 Semantic story, SEO metadata, dialogs
css/style.css              Design system and desktop layouts
css/animations.css         Ambient motion and motion preferences
css/responsive.css         Mobile, tablet, and print layouts
css/story-scenes.css       Sticky scene layouts and layered illustrations
js/main.js                 Chapter progress and motion preference
js/animations.js           Reversible layered scenes and optional GSAP smoothing
js/scroll-math.js           Shared scroll and boat-path geometry
js/interactions.js         Dialogs, tabs, audio, sharing
assets/illustrations/      Original optimized SVG artwork
assets/patterns/ajrak.svg   Original decorative Ajrak-inspired tile
.nojekyll                  GitHub Pages static asset support
```

## Edit the experience

- Edit chapter text in `index.html`. Keep the section IDs and the three `.story-beat` elements per scroll scene stable so navigation and animation targets continue to work. The city, river, Ajrak, and poetry scenes use inline SVG groups so individual objects can animate. Edit those SVG groups in the HTML; the standalone illustration files are also used by the hero, finale, and dialogs.
- Edit craft facts and Ajrak/Topi descriptions in `js/interactions.js`.
- Change the palette and fonts in `css/style.css` using its `:root` variables.
- Replace an illustration at its current path, preserving its `viewBox`/aspect ratio, or update the HTML image path and dimensions. Compress photography as WebP/AVIF and provide accurate alt text and usage credits.
- Add a real social preview image after publishing, then set absolute `og:image`, `og:url`, and a canonical URL in the HTML. These are intentionally not filled with invented deployment URLs.

## Animation, audio, and offline behavior

GSAP 3.13.0 and ScrollTrigger load asynchronously from jsDelivr. The city, river, and Ajrak each have a short CSS-sticky illustration alongside three readable story beats. On phones, the illustration occupies roughly 39% of the viewport while text moves below it. On very short screens, stickiness is disabled. There is no scroll interception, scroll snapping, or forced wheel/touch behavior. Each scene has a link to skip to the next chapter. GSAP smooths the playheads; if the CDN is blocked, a requestAnimationFrame renderer provides the same layer-by-layer story. Scrolling backward reverses every scene. No narrative text is hidden. Google Fonts provides Italiana, DM Sans, and Noto Naskh Arabic; system serif, sans-serif, and Arabic fallbacks remain available. All artwork is local SVG.

The application has no build or runtime package dependencies. A completely offline preview uses the native animation and system font fallbacks. For fully offline GSAP, download the exact version from its official distribution, retain its license headers, place the files in `js/vendor/`, and change the two loader paths in `js/animations.js` to relative local URLs.

Audio is off by default. An explicit button starts an original, quiet synthesized interlude using Web Audio. It is labelled as ambient sound, not authentic Sindhi folk music. It stops when the tab is hidden. No recording or microphone access is involved.

Reduced motion follows the device's preference and can also be selected using the floating motion control. Switching to reduced motion restores complete illustrations and compact normal-flow layouts, and attempts to preserve the reader’s position. The complete narrative remains in the HTML without JavaScript. Dialog controls and extra craft facts require JavaScript. No tracking, cookies, or analytics are included; localStorage stores only the optional motion preference.

## Content and sources

Original educational narration, original stylized SVG illustrations, and original synthesized audio. Ancient and architectural scenes are artistic interpretations rather than exact archaeological reconstructions. Ajrak motifs and craft depictions are decorative interpretations. No historical quotation is invented.

- UNESCO, Archaeological Ruins at Moenjodaro: https://whc.unesco.org/en/list/138/
- UNESCO, Historical Monuments at Makli, Thatta: https://whc.unesco.org/en/list/143/
- Culture Department, Government of Sindh: https://sindhculture.gov.pk/

Before a formal exhibition, invite a Sindhi language teacher or local cultural expert to review the narration and pronunciation of names.

## Quick verification checklist

- Test at 320, 390, 768, and 1440 pixels wide; check for horizontal overflow.
- Scroll forward and backward through 13 chapters; use every chapter-menu link.
- Use only the keyboard to open/close dialogs, change cultural tabs, and toggle audio.
- Turn on the device's reduced-motion preference; also test the on-page toggle.
- Tap all four objects and inspect their facts.
- Test with the CDN blocked and with JavaScript disabled; the core story must remain readable.
- Test share/copy on the deployed HTTPS URL and cancel the native share sheet.
- Test the printed QR on both Android and iPhone.


## Scroll choreography

- **Welcome:** the sunrise introduction leads into layered scenery and birds.
- **Ancient city:** 16 building groups rise in sequence; an illustrative drainage line draws; the Great Bath emerges. A keyboard-accessible discovery button opens its story.
- **Indus:** the boat follows a cubic path, with fields, a village, hills, and foreground trees moving at different speeds.
- **Ajrak:** cloth unfolds, a carved block stamps 24 motifs, and the Topi appears. This compresses a complex craft process into an artistic sequence; it is not a literal production tutorial.
- **Poetry:** a manuscript opens, the title of Shah jo Risalo appears, and instrument strings gently shift with scrolling. No new quote is attributed to the poet.
- **Living traditions:** objects arrive in a courtyard and retain their tap/keyboard interactions.
- **Finale:** city, boat, textiles, poetry, and crafts come together.

River ripples blend into an Ajrak pattern between chapters, followed by a textile-to-manuscript transition. Animation uses transforms and opacity, plus one SVG stroke reveal. An observer suspends offscreen decorative updates. Reduced-motion and no-JavaScript layouts show complete scenes.

## Automated checks

No package installation is required:

```sh
node --test tests/scroll-motion.test.cjs
python3 tests/validate-site.py
node --check js/main.js
node --check js/animations.js
node --check js/interactions.js
```

The Node checks cover boat-path bounds, forward/backward/fast scrolling, mobile and short viewport geometry, reduced-motion cleanup, and repeated GSAP setup/teardown using test doubles. They do not render a browser or prove browser compatibility. The Python check validates HTML nesting, inline SVG, references, and assets. Browser/device visual QA remains necessary; the authoring environment blocked local HTTP serving and file-URL browser previews.


## Muan Jo Daro as the main story

The first eight chapters introduce the city and explain its significance:
1. Welcome to Muan Jo Daro (also spelled Mohenjo-daro / Moenjodaro).
2. Its location near Larkana and place within the Indus Civilization.
3. Planned homes and streets, with the existing interactive city scene.
4. Wells, drainage, and daily water needs.
5. The Great Bath: construction, clues, and uncertain purpose.
6. People and objects: pottery, ornaments, toys, and weights.
7. Archaeological excavation from 1922, undeciphered inscriptions, and questions about urban change.
8. World Heritage recognition in 1980 and caring for fragile remains.

The Indus River, Ajrak/Topi, poetry, living traditions, and the finale follow as a continuation into wider Sindh heritage. They do not assert uninterrupted practices from the Indus Civilization to the present. The QR URL and existing chapter anchors are unchanged.

New chapters have layered inline SVG illustrations, reversible scroll reveals, and native HTML details for student questions. Figures are schematic or artistic; they are not site plans or artifact replicas. Reduced-motion and no-JavaScript modes retain the text and complete artwork.

Additional references:
- Great Bath construction: https://www.harappa.com/content/great-bath-mohenjo-daro-b
- Indus inscriptions: https://www.harappa.com/content/inscribed-objects-harappa-excavations-1986-2007
- Objects and daily life: https://www.nationalmuseumindia.gov.in/en/collections/index/6
- Urban transformation: https://www.harappa.com/sites/default/files/pdf/kenoyer2003%20Scientific%20American.pdf
- Conservation: https://whc.unesco.org/en/news/2669/
