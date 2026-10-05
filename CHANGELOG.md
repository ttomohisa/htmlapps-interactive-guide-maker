# Changelog

All notable changes to Interactive Guide Maker are documented here.

## [Unreleased]

### Fixed

- Keep dialog keyboard shortcuts from undoing/redoing and autosaving changes to the guide behind the dialog; native filename Undo/Redo remains available.
- Preserve deliberately edited export names during the same editing session, including repeated open/close and Ctrl/Cmd+S; reset names only when a new or imported guide replaces the document.
- Refresh Preview and Save from current guide content and keep the required `.html` extension singular.
- Avoid reporting a successful no-opener Preview tab as blocked; show a neutral hint when the browser does not return a window reference.
- Regenerate the root downloadable HTML in normal builds and verify source/readable/self-extract/root behavior and release parity.

## [1.0.0] - 2026-09-22

### Added

- Hover insertion affordances between desktop blocks: a compact `+` button opens an icon-only block picker at the exact insertion point.
- Position-aware image drag & drop: the editor previews the target insertion line and inserts dropped image blocks there.

### Fixed

- Exported guide Contents no longer combine browser list numbering with Step numbering (for example `4. 1. Step 1`).
- Contents now use unnumbered Heading entries with visually indented Step entries; untitled Steps appear as `Step N` / `手順 N`.

### Changed

- The full-screen image-drop overlay is now an unobtrusive status chip so the insertion target stays visible.
- Desktop between-block insertion uses SVG icons and tooltips to avoid repeating long text between every block.
- v1.0.0 is the release-candidate feature freeze before v1.0.0; further work should focus on regression fixes and release assets.


## [0.8.0] - 2026-09-21

### Added

- Initial start screen with Blank guide, Open HTML, and three task-oriented templates.
- **How-to guide**, **Inspection checklist**, and **Troubleshooting** starter structures.
- Document settings for text size, content width, and Auto / Light / Dark reader theme.
- Persistence and round-trip import/export of document settings.
- Export warning when the generated standalone HTML reaches 25 MB or more.
- Post-download completion state showing the generated filename and size.

### Changed

- **New guide** now opens the non-destructive start chooser; the current guide is not replaced until a new choice is confirmed.
- Exported viewers now start with the selected document text size, width, and theme while retaining reader theme switching.
- Help, README, APP_SPEC, and screenshots now describe the template-first start flow.
- The dedicated Structure / Edit / Preview smartphone workspace from v0.7.0 remains unchanged and compatible with the new start screen.

### Not yet included

- Image annotation / numbered markers.
- Persistent checklist progress in exported viewers.
- Table block.

## [0.7.0] - 2026-09-21

### Added

- Dedicated mobile workspace with fixed Structure / Edit / Preview tabs.
- Mobile live preview rendered from the same guide data used for standalone HTML export.
- Bottom-sheet block picker for touch-first block creation.
- Safe-area aware bottom navigation and add-block action.
- Larger touch targets and mobile-first block controls.

### Changed

- Mobile outline navigation switches directly back to the editor when a section is selected.
- Mobile layout no longer stacks the full structure panel above the entire editor.

## [0.6.0] - 2026-09-21

### Added

- Round-trip editing from HTML exported by Interactive Guide Maker.
- **Open HTML** action and local HTML file input.
- Export marker: `<meta name="interactive-guide-maker" content="1">`.
- Versioned editable source payload with app signature, `schemaVersion`, `appVersion`, document state, and referenced image assets.
- Import validation and separate errors for incompatible HTML, damaged source data, and unsupported newer schema versions.
- Migration-layer entry point for future editable-source schema upgrades.
- Replacement confirmation when opening an exported HTML while another guide contains content.

### Changed

- Exported viewer images now hydrate from the embedded editable asset table so image payloads are stored once instead of duplicated between viewer markup and editor source data.
- Export dialog and Help now explain that the generated HTML can be reopened for editing.
- README, APP_SPEC, and offline verification now document the create → export → reopen → edit flow.
- Draft normalization/recovery remains compatible with earlier v0.1.0–v0.5.0 states.

### Not yet included

- Dedicated mobile bottom navigation.
- Starter templates and document appearance settings.
- Image annotation / numbered markers.

## [0.5.0] - 2026-09-21

### Added

- Standalone guide HTML generator with embedded CSS, JavaScript, app icon, and referenced images.
- Export dialog showing block count, referenced-image count, generated file size, and editable filename.
- Viewer preview before download and direct `.html` download.
- Automatic Contents generated from top-level Headings and Steps.
- Full-text viewer search, including nested Tab content with automatic Tab activation on result navigation.
- Interactive viewer Checklists, Details, and Tabs.
- Code copy with Clipboard API and a direct-file-friendly local fallback.
- Image lightbox / zoom.
- Auto / Light / Dark viewer theme switching.
- Print button and print CSS that expands Tab content for printing.
- Ctrl/Cmd+S shortcut for opening the HTML export flow.
- Restrictive exported-viewer CSP with `connect-src 'none'`.

### Changed

- Help, README, and product copy now describe the full create → preview → export flow.
- Draft normalization/recovery remains compatible with v0.1.0 through v0.4.0.

### Not yet included

- Re-import / round-trip editing from an exported guide HTML.
- Dedicated mobile bottom navigation, starter templates, and image annotation.

## [0.4.0] - 2026-09-21

### Added

- Details blocks with editable summary/body and an in-editor collapsible preview.
- Code blocks with optional language labels and one-click copy.
- Tabs blocks supporting 2–5 tabs.
- Multiple Paragraph, Callout, Checklist, Link, Code, and Divider blocks inside each tab.
- Tab add/delete with Undo-compatible structural history.
- Nested content move, duplicate, delete, checklist item operations, and safe-link validation.
- Explicit nesting limit: Tabs cannot be placed inside Tabs.
- New application icon supplied for Interactive Guide Maker, used consistently for `assets/favicon.svg`, the browser favicon, and the upper-left brand icon.

### Changed

- Help, README, and product copy now describe the v0.4.0 interactive-block scope.
- Draft normalization remains compatible with v0.1.0, v0.2.0, and v0.3.0 documents.

### Not yet included

- Standalone guide preview / HTML export.
- Exported-HTML re-import.
- Dedicated mobile bottom navigation and starter templates.

## [0.3.0] - 2026-09-21

### Added

- Image blocks supporting PNG, JPEG, WebP, and GIF.
- Image import through file selection, document-level drag & drop, block-level replacement drop, and clipboard paste.
- Image Alt text, Caption, Display width, and Alignment settings.
- Filename, pixel dimensions, and file-size information for imported images.
- Unsupported/corrupt image errors and a warning for images 10 MB or larger.
- Separate image-asset storage so Base64 image payloads are not duplicated into every Undo history state.
- Persisted image assets are pruned to assets referenced by the current document.
- Responsive image editing UI with 320px-width overflow checks.

### Changed

- Help, README, and product copy now describe local image handling.
- Draft normalization remains compatible with v0.1.0 and v0.2.0 documents.

### Not yet included

- Image annotation.
- Tabs, details, code blocks, preview, guide HTML export, and exported-HTML re-import.

## [0.2.0] - 2026-09-21

### Added

- Step blocks with automatic numbering derived from current block order.
- Callout blocks with Note, Caution, and Important variants.
- Checklist blocks with item add, edit, move, delete, and Undo-compatible structural history.
- Link blocks with display text, URL fields, and unsafe-scheme validation.
- Divider blocks for simple section separation.
- Lightweight paragraph helpers for bold, link, and inline-code markup.
- Structure panel focused on Headings and Steps for faster navigation.
- v0.1.0 draft normalization so existing paragraph/heading drafts continue loading.
- Responsive editor styling for the new guide blocks.

### Changed

- Empty state now suggests Paragraph, Step, or Heading as useful starting blocks.
- Help and product copy now describe the v0.2.0 guide-block scope.

### Not yet included

- Image blocks.
- Tabs, details, code blocks, preview, guide HTML export, and exported-HTML re-import.

## [0.1.0] - 2026-09-21

### Added

- Initial Browser Kitty implementation based on the latest supplied single-HTML template.
- Serializable guide document model with Paragraph and Heading blocks.
- Document title editing and guide structure outline.
- Block add, select, edit, duplicate, delete, move up/down, and drag-and-drop reorder operations.
- Undo / Redo history with keyboard shortcuts and coalesced text-edit history.
- Canonical Browser Kitty Toast + Undo behavior for reversible block deletion.
- Canonical confirmation dialog before replacing a non-empty guide with a new document.
- Local draft persistence using IndexedDB with localStorage fallback.
- Japanese / English UI in the same HTML.
- Responsive desktop and smartphone layouts, keyboard focus, reduced-motion handling, and accessible reorder alternatives.
- App-specific favicon / brand icon using Browser Kitty color `#16624F`.
- Product-specific README files and `APP_SPEC.md` with the v0.1.0-to-v1.0.0 roadmap.

### Not yet included

- Guide HTML export / import.
- Image, checklist, callout, step, tab, details, and code blocks.
- Preview mode and final standalone guide viewer.
