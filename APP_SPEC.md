# APP_SPEC.md — Interactive Guide Maker

## 1. Product identity

- **Name:** Interactive Guide Maker
- **Japanese name:** インタラクティブ手順書
- **Current version:** v1.0.0
- **One-sentence purpose:** Build step-by-step guides entirely in the browser, export them as self-contained interactive HTML, and reopen those exported files to continue editing.
- **Primary users:** People creating operating procedures, setup instructions, inspection guides, handover notes, and troubleshooting guides without writing HTML.
- **Release artifacts:** `dist/index.html` and `dist/index.self-extract.html`

## 2. Product direction

The finished v1.0 product will create interactive guides that can be distributed as one HTML file. It is not a general-purpose word processor, website builder, CMS, or Notion replacement.

The product stays focused on this flow:

```text
Create a guide
↓
Arrange guide blocks and local images
↓
Preview / export one HTML file
↓
Open that HTML in a browser
↓
Reopen the same HTML in Interactive Guide Maker to edit again
```

v0.6.0 added round-trip editing, v0.7.0 added the dedicated smartphone workspace, and v0.8.0 added starter templates and document settings. v1.0.0 is the first stable release and includes precise between-block insertion, position-aware image drops, corrected exported Contents navigation, and an icon-organized bottom add-block area.

## 3. v1.0.0 user flow

1. Open the app locally or from static hosting.
2. Start blank, choose How-to / Inspection / Troubleshooting, or open a previously exported HTML.
3. Give the guide a title.
4. Add Paragraph, Heading, Step, Image, Callout, Checklist, Link, Details, Tabs, Code, or Divider blocks. On desktop, hover between blocks and use the compact icon picker when an exact insertion position is needed.
5. Add images with file selection, drag & drop, or clipboard paste. When dragging over the desktop editor, preview the insertion line and drop at the intended position.
6. Add collapsible Details, platform/variant Tabs, and Code blocks where useful.
7. Tabs may contain multiple Paragraph, Callout, Checklist, Link, Code, and Divider blocks; Tabs cannot contain Tabs.
8. Adjust image alt text, caption, display width, and alignment.
9. Edit the remaining guide content and guide-specific settings.
10. Use the Structure panel to jump between Headings and Steps.
11. Duplicate, reorder, or delete blocks.
12. Undo or redo edits.
13. Reload and recover the latest locally saved guide where browser storage is available.
14. Choose Export HTML, review block/image/file-size information, and edit the filename.
15. Preview the generated standalone viewer.
16. Save the viewer as one `.html` file.
17. Open that HTML independently in a browser and use contents, search, checklists, Tabs, Details, code copy, image zoom, theme switching, and Print.
18. Reopen an exported Interactive Guide Maker HTML with **Open HTML**, confirm replacement when needed, and continue editing the restored blocks and images.
19. Re-export the edited guide as the next standalone HTML file.
20. Start a new blank guide after confirming replacement when the current guide contains content.

## 4. v1.0.0 functional requirements

### Document editor

- Use an explicit serializable document state.
- Support block types:
  - `paragraph`
  - `heading`
  - `step`
  - `image`
  - `callout`
  - `checklist`
  - `link`
  - `details`
  - `tabs`
  - `code`
  - `divider`
- Support document title editing.
- Support block add, select, edit, duplicate, delete, move up, move down, and drag-and-drop reorder.
- Keep deletion reversible with `AppToast` Undo instead of pre-delete confirmation.
- Starting a new document is destructive and must use `AppConfirm` if the current document is non-empty.



### Desktop insertion UX

- Render a compact insertion slot before, between, and after top-level blocks on desktop.
- The slot stays visually quiet until hover / keyboard focus; it then exposes a `+` control.
- Activating `+` opens an icon-only picker for every top-level block type with localized `title` and `aria-label` text.
- Selecting a block inserts it at that exact index and focuses the new block.
- Mobile keeps the existing bottom-sheet Add block flow instead of hover insertion controls.
- While image files are dragged over the document editor, compute the nearest top-level insertion index from pointer position and highlight that insertion slot.
- Dropping inserts one or more Image blocks at that index. Dropping directly onto an existing Image block still replaces that block.

### Exported Contents

- Do not combine browser-generated ordered-list numbers with Step numbers.
- Heading links are unnumbered top-level entries.
- Step links are visually indented beneath the flow and use `N. Title` when a title exists, or `手順 N` / `Step N` when the Step title is empty.

### Start screen and templates

- When no draft content exists, show a start screen instead of an unexplained empty editor.
- Offer Blank guide, Open HTML, How-to guide, Inspection checklist, and Troubleshooting.
- Opening the start screen from a non-empty guide must not destroy current work until a replacement choice is confirmed.
- Templates create ordinary editable blocks and do not introduce template-only runtime behavior.

### Document settings

- Store `fontSize`, `contentWidth`, and `theme` under `document.settings`.
- Support Standard / Larger text, Standard / Wider content width, and Auto / Light / Dark theme.
- Preserve settings in local persistence, Undo/Redo state, exported editable source data, and round-trip HTML import.
- Apply reader-facing settings to Preview and standalone exported HTML.

### Export feedback

- Keep showing block count, image count, and exact generated HTML size before save.
- Show an explicit warning when generated HTML is at least 25 MB; never silently reduce image quality.
- After Save HTML is triggered, keep the export dialog available and show the saved filename and generated size as a completion state.

### Mobile workspace

- At `max-width: 640px`, use a fixed bottom navigation with **Structure / Edit / Preview**.
- Show only the current mobile workspace screen; do not vertically stack the entire Structure panel over the editor.
- Keep the bottom navigation above `env(safe-area-inset-bottom)` and reserve enough document padding so it does not hide content.
- In Edit, expose a dedicated **Add block** floating action that opens a bottom-sheet block picker.
- Bottom-sheet choices must cover all top-level block types and use touch-friendly targets.
- Selecting a Heading or Step from Structure switches to Edit and focuses the corresponding block.
- Preview renders the current guide locally without requiring HTML export first and reflects the same source state used by standalone export.
- The Add block action is hidden outside Edit so it cannot obscure Structure or Preview.
- Existing move up/down actions remain available as the reliable touch reorder path even when native drag-and-drop is inconvenient.
- Mobile dialogs, keyboard input, long titles, and editor controls must stay within the viewport without horizontal page scrolling.

### Image block

- Support PNG, JPEG, WebP, and GIF.
- Add images through:
  - file picker
  - drag & drop anywhere in the document workspace
  - drag & drop onto an existing Image block to replace its image
  - clipboard paste for screenshots and other image clipboard data
- Validate the decoded image rather than trusting the extension alone.
- Show a user-facing error for unsupported or unreadable/corrupt images.
- Warn when a single image is at least 10 MB, but do not silently change image quality.
- Preserve the original selected image bytes as a data URL for local persistence and later standalone export.
- Store editable image settings:
  - alt text
  - caption
  - display width: Small / Standard / Large / Full width
  - alignment: Left / Center
- Show source filename, pixel dimensions, and file size when available.
- Allow replacing or removing the image without deleting the Image block.
- Image removal is Undo-capable.
- Duplicating an Image block may share the same immutable image asset in memory/storage until one copy is replaced.

### Image asset storage

Image binary data must not be copied into every Undo history snapshot.

- Image blocks store an `assetId` reference.
- Full image data is held separately from the text/block history state.
- Undo/Redo snapshots contain the document/block references, not repeated Base64 image payloads.
- Persistence serializes only image assets referenced by the current document.
- Replaced/deleted assets may remain in the in-memory session archive so Undo can restore them, but unreferenced assets are excluded from the next persisted draft.

### Step block

- Contains a title and optional body text.
- Step numbers are calculated from current Step block order.
- Moving or deleting steps automatically updates displayed numbering.
- Step titles appear in the Structure panel.

### Callout block

- Contains text plus one of three semantic variants: Note, Caution, Important.
- Variants must differ by label/structure, not color alone in future viewer output.

### Checklist block

- Contains one or more text items.
- Support item add, edit, move up/down, and delete.
- Deleting the last visible item leaves one empty item.
- Item deletion is Undo-capable.

### Link block

- Contains display text and URL.
- Editor-side URL safety validation allows `http:`, `https:`, `mailto:`, `tel:`, page anchors, and relative links.
- Unsafe schemes such as `javascript:` or `data:` must be flagged.

### Details block

- Contains a Summary and body text.
- Shows an in-editor collapsible preview using native `details` / `summary`.
- Does not create arbitrary recursive block nesting in v0.6.0.

### Code block

- Contains an optional language label and code text.
- Uses a monospace editor surface.
- Provides Copy code using the Clipboard API when available with a local fallback.
- Copy failures must be reported without blocking editing.

### Tabs block

- Contains 2–5 tabs.
- Each tab has an editable label and an ordered block list.
- Tab content supports: Paragraph, Callout, Checklist, Link, Code, Divider.
- Tabs inside Tabs are intentionally prohibited.
- Tab add/delete and nested block structural edits participate in Undo / Redo.
- Deleting a tab is disabled when only two tabs remain.
- Adding a tab is disabled when five tabs exist.

### Divider block

- Represents a simple section separator.
- Has no free-form style settings.

### Paragraph inline helpers

- Paragraph blocks provide lightweight helpers for Bold, Link, and Inline Code markup.
- They are intentionally not a full Markdown or rich-text editor.

### Structure panel

- Shows structural navigation only: Headings and Steps.
- Images and other body blocks are intentionally omitted from the outline.

### Persistence / history

- Persist current document locally. Prefer IndexedDB and fall back to localStorage if unavailable.
- Preserve loading of valid v0.1.0, v0.2.0, v0.3.0, and v0.4.0 drafts.
- Show saving / saved / local-save-failed status in an `aria-live` region.
- Provide Undo / Redo with keyboard shortcuts.
- Text edits may be coalesced; structural edits commit immediately.
- Image payloads must not be duplicated into every history entry.

### Language / privacy

- Switch Japanese and English without reloading.
- Keep titles, text, and imported images in the browser.
- Do not make runtime network requests.
- Keep a restrictive CSP with `connect-src 'none'`.
- Preserve direct `file://` operation.
- Ctrl/Cmd+S opens the Export HTML flow rather than implying cloud/project-file save.
- **Open HTML** accepts only HTML files carrying the Interactive Guide Maker marker and embedded editable source payload.
- Import parses the selected HTML with `DOMParser`; scripts in the imported file are not executed.
- Opening a compatible HTML replaces the current guide only after confirmation when the current guide is non-empty.

### Standalone HTML export / viewer

- Provide a primary **Export HTML** action in the editor.
- Export dialog shows current top-level block count, referenced image count, and generated HTML byte size.
- Filename is editable with the `.html` extension shown separately. Repeated `.html` suffixes are normalized to one at download; unsafe characters are replaced and an empty base uses a valid app default.
- Keep a deliberately edited filename across Preview, Save, closing, and reopening Export for the same guide in the current editing session. Until edited, the suggestion follows the guide title. Starting a new guide/template or confirming an HTML import resets the name; cancelling replacement does not.
- Generate Preview and Save from the current document, even if it changed after the Export dialog opened.
- Preview opens the exact generated viewer content before download in a no-opener tab. A null window reference is not treated as proof of failure; a neutral pop-up hint explains what to check if no tab appears.
- The downloaded file must be self-contained: CSS, JavaScript, app icon, referenced images, and editable source data are embedded.
- Add `<meta name="interactive-guide-maker" content="1">` as the export marker.
- Embed editable source data in an inert `<script type="application/json" id="interactive-guide-source" data-encoding="base64">` element.
- The editable payload includes `signature`, `schemaVersion`, `appVersion`, document state, and referenced image assets.
- Viewer images are hydrated from the same embedded asset payload used for round-trip editing, avoiding a second full copy of each image in the exported HTML.
- Viewer runtime must not fetch external assets and must use a restrictive CSP including `connect-src 'none'`.
- Generate an automatic Contents list from top-level Heading and Step blocks.
- Full-text search covers top-level content, including closed Details, and content inside Tabs. Selecting a Details result opens only that matching disclosure before scrolling and highlighting. Selecting a nested Tab result still activates the owning Tab before navigation. Empty or unmatched searches leave content state unchanged.
- Viewer Checklists are interactive but their checked state remains session-only in v1.0.0.
- Details uses native disclosure behavior and starts closed on each viewer load.
- When the generated viewer contains at least two Details blocks, show a native **Expand all details** / **Collapse all details** button beside Print (Japanese: **すべての詳細を開く** / **すべての詳細を閉じる**). With any closed Details, the action opens all; with all open, it closes all. Derive its label and `aria-expanded` from live disclosure states after bulk actions, individual toggles, and search navigation.
- Bulk Details actions keep focus on the button and do not scroll, change Tabs/checklists, or write editor state or persistence. Disclosure states are session-only and do not change the schema-1 editable payload or print behavior. This control is shared by Export Preview and downloaded HTML; it is not added to the editor or inline mobile Preview.
- Tabs are keyboard-focusable buttons / tab panels and preserve the editor-defined 2–5 pane structure.
- Code blocks provide Copy with Clipboard API and a local fallback suitable for direct-file viewing where possible.
- Images open in a local lightbox and never require a source URL outside the file.
- Viewer provides Auto / Light / Dark appearance switching.
- Viewer provides Print and print CSS; all Tab panels become printable.
- User-created safe links remain links and may navigate only when the reader activates them.
- Re-import validates the export marker, signature, schema version, document shape, and supported image asset types before replacing editor state.
- `schemaVersion` newer than the current app is rejected with a specific user-facing message.
- A migration function is present even though v1.0.0 currently supports only schema version 1.

## 5. State model

Editor history state keeps image references rather than payloads:

```json
{
  "schemaVersion": 1,
  "document": {
    "id": "uuid",
    "title": "",
    "settings": {
      "fontSize": "normal",
      "contentWidth": "normal",
      "theme": "auto"
    },
    "blocks": [
      { "id": "uuid", "type": "paragraph", "text": "" },
      { "id": "uuid", "type": "heading", "text": "" },
      { "id": "uuid", "type": "step", "title": "", "text": "" },
      {
        "id": "uuid",
        "type": "image",
        "assetId": "uuid-or-null",
        "alt": "",
        "caption": "",
        "width": "normal",
        "alignment": "left"
      },
      { "id": "uuid", "type": "callout", "variant": "note", "text": "" },
      {
        "id": "uuid",
        "type": "checklist",
        "items": [{ "id": "uuid", "text": "" }]
      },
      { "id": "uuid", "type": "link", "label": "", "url": "" },
      { "id": "uuid", "type": "details", "summary": "", "text": "" },
      {
        "id": "uuid",
        "type": "tabs",
        "activeTabId": "pane-1",
        "panes": [
          { "id": "pane-1", "label": "Windows", "blocks": [{ "id": "uuid", "type": "paragraph", "text": "" }] },
          { "id": "pane-2", "label": "macOS", "blocks": [{ "id": "uuid", "type": "code", "language": "", "code": "" }] }
        ]
      },
      { "id": "uuid", "type": "code", "language": "", "code": "" },
      { "id": "uuid", "type": "divider" }
    ]
  }
}
```

The persisted draft adds only referenced image assets:

```json
{
  "schemaVersion": 1,
  "document": { "...": "..." },
  "assets": {
    "asset-uuid": {
      "id": "asset-uuid",
      "name": "screenshot.png",
      "mime": "image/png",
      "size": 123456,
      "width": 1920,
      "height": 1080,
      "data": "data:image/png;base64,..."
    }
  }
}
```

The exported guide embeds the same logical snapshot inside a versioned envelope:

```json
{
  "signature": "interactive-guide-maker",
  "schemaVersion": 1,
  "appVersion": "1.0.0",
  "document": { "...": "..." },
  "assets": { "...": "..." }
}
```

The JSON is UTF-8 encoded, Base64 encoded, and stored in an inert `application/json` script element. The viewer uses the embedded asset table to hydrate image elements, and the editor uses the same payload when the HTML is reopened.

## 6. Persistence

- Primary: IndexedDB.
- Fallback: localStorage.
- Save after edits with a short debounce.
- If local persistence fails, keep editing available and show a non-blocking warning.
- Browser site-data deletion may remove the saved draft and must be disclosed in Help.
- v0.1.0 paragraph/heading drafts, v0.2.0 guide-block drafts, and v0.3.0 image drafts must continue loading.
- Persist only assets referenced by the current document.

## 7. Undo / Redo

- Keep at least 30 serialized document-history states in memory.
- Do not include image binary payloads in each history state.
- Structural changes commit immediately.
- New edits clear Redo history.
- Keyboard shortcuts:
  - Ctrl/Cmd+Z: Undo
  - Ctrl/Cmd+Shift+Z: Redo
  - Ctrl/Cmd+Y: Redo where applicable
- While any native dialog is open (Export, Help, Settings, confirmation, or mobile block sheet), global guide Undo/Redo shortcuts do not run. Native filename Undo/Redo and Escape cancellation remain available.
- Ctrl/Cmd+S opens Export only outside dialogs; inside a dialog it prevents browser Save without opening another dialog or resetting the filename/focus.
- Image replace/remove operations must remain Undo-compatible within the current session.

## 8. Desktop UX

Use a two-column workspace:

- Left: Structure panel showing Headings and Steps.
- Right: document title, block editor, add-block actions.

Image settings remain contextual inside the selected Image block. Do not add a permanent third pane yet.

## 9. Smartphone UX

- Must work from 320px width upward.
- Collapse to one column.
- Keep all main actions reachable without horizontal scrolling.
- Image preview and controls must fit within the viewport.
- Long filenames and captions must wrap safely.
- Image size/alignment fields stack to one column on narrow screens.
- Mobile uses the fixed Structure / Edit / Preview bottom navigation introduced in v0.7.0.

## 10. Accessibility

- Visible keyboard focus.
- Proper labels / accessible names.
- `aria-live` for save status.
- Reorder available through buttons, not drag only.
- Image inputs expose accessible names for Alt text, Caption, Display width, and Alignment.
- Imported image preview uses the current alt text.
- Help and confirm dialogs close with Escape and restore focus where appropriate.
- Respect `prefers-reduced-motion`.

## 11. Privacy

- Guide title, block content, and imported images stay in browser memory/local storage.
- No server upload.
- No analytics or telemetry.
- No runtime CDN, API, external font, or hidden network dependency.
- No third-party runtime dependencies are required in v0.6.0.

## 12. Non-goals for v0.6.0

- Image annotation / numbered markers.
- Automatic image compression or quality changes.
- Arbitrary deep block nesting; Tabs inside Tabs are not supported.
- Templates.
- Cloud sync or collaboration.
- Arbitrary HTML/CSS/JavaScript editing.
- General-purpose rich-text editing.

## 13. Performance expectations

- Editing should remain responsive with 300 simple blocks on a typical desktop browser.
- Adding images must not replicate their Base64 payload across every Undo history state.
- Image reading/decoding is asynchronous.
- Long filenames must not create horizontal overflow.
- Large images show a size warning rather than being silently recompressed.

## 14. Browser target

- Primary: current stable Chrome and Edge on desktop.
- Also target current Firefox and Safari where browser storage behavior permits.
- Smartphone: current Chrome Android and Safari iOS.
- Direct `file://` opening is required.

## 15. v1.0.0 acceptance criteria

- Template build produces readable and self-extracting standalone HTML on the supported Windows environment.
- At 390px and 320px widths, Structure / Edit / Preview switch independently with no page-level horizontal scroll.
- The mobile Add block action opens a bottom sheet containing all eleven top-level block choices.
- Selecting an outline entry on mobile returns to Edit and focuses the corresponding block.
- Mobile Preview updates from current guide state without exporting and renders text, steps, images, callouts, checklists, details, tabs, code, links, and dividers.
- Safe-area padding keeps the fixed bottom navigation and Add block action from covering the final editable controls.
- Runtime CSP contains `connect-src 'none'` and no external runtime resources.
- All eleven top-level block types can be created and edited without console errors.
- Details summary/body editing and collapse preview work.
- Code language/code editing and Copy code work.
- Tabs enforce a 2–5 tab range and support the documented nested basic blocks without nested Tabs.
- PNG, JPEG, WebP, and GIF can be selected and decoded.
- File selection, drag & drop, and clipboard-paste image input work.
- Unsupported and corrupt image files show understandable errors.
- Image alt text, caption, width, and alignment persist in the document state.
- Image removal can be undone.
- Image data is stored separately from document history snapshots and included in persisted drafts only when referenced.
- v0.1.0, v0.2.0, v0.3.0, v0.4.0, and v0.5.0 drafts remain normalizable/loadable.
- Export dialog reports block count, image count, and generated HTML size and supports an editable filename.
- Preview and downloaded HTML render the same viewer feature set without console errors.
- Exported HTML includes no external runtime resource and contains `connect-src 'none'`.
- Viewer Contents, search, Checklist, Details, Tabs, code copy, image lightbox, theme switching, and Print work.
- Search can locate nested Tab text and navigate to the correct Tab.
- Body-only and summary search results reveal closed Details before scroll, preserve unrelated disclosures, and work after repeated collapse/search cycles.
- Zero or one Details block has no bulk control; two or many support localized all-open, all-closed, mixed-state, rapid-repeat and native-toggle synchronization without scrolling or persistence.
- Editor, Export dialog, and viewer remain usable at 320px width without horizontal scrolling.
- Exported HTML contains the Interactive Guide Maker marker and versioned editable source payload.
- Exported HTML can be reopened through **Open HTML**, restoring title, all supported blocks, and referenced images.
- Importing a compatible HTML while another guide is non-empty requires replacement confirmation.
- Generic/non-Interactive-Guide-Maker HTML is rejected without replacing the current guide.
- A newer unsupported `schemaVersion` is rejected without replacing the current guide.
- Re-export after import preserves the round-trip path.
- Help explains that the exported HTML itself is the file used to resume editing.

## 16. Planned milestones after v1.0.0

- **v0.8.0:** starter templates, polished empty/complete states, document appearance settings.
- **v1.0.0:** first stable release, full regression, icon-organized bottom add-block area, between-block insertion, position-aware image drops, and exported Contents fix.
