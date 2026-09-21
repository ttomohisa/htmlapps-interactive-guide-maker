# Offline verification — Interactive Guide Maker

## v1.0.0 verification flow

1. Run the template build on Windows and open `dist/index.html` directly with `file://`.
2. Confirm the supplied favicon / upper-left icon is used and no external runtime request occurs.
3. With no draft, confirm the start screen offers Blank guide, Open HTML, How-to guide, Inspection checklist, and Troubleshooting. Open each template and confirm it creates ordinary editable blocks.
4. From a non-empty guide, choose New guide and confirm the current guide remains intact until a replacement choice is confirmed.
5. Create a guide containing text, a Heading, a Step, an Image, and at least one interactive block.
6. Open Document settings and verify text size, content width, and Auto / Light / Dark theme update Preview and survive export/import.
7. Confirm image file selection, drag & drop, clipboard paste, replace, remove, Undo / Redo, reordering, auto-save, and Japanese / English switching still work.
8. On desktop, hover before/between/after blocks and confirm the compact `+` appears; open it and insert several block types at the selected index.
9. Drag an image over the editor and confirm the insertion line follows the intended before/between/after position. Drop and verify the Image block is inserted there. Drop directly onto an existing Image block and verify replacement behavior remains intact.
10. Choose **Export HTML** and confirm block count, referenced-image count, generated file size, and filename are shown.
11. Save the HTML and open it directly with `file://`. Confirm Contents, search, Checklist, Details, Tabs, code copy, image zoom, theme switching, and Print still work.
12. Confirm exported Contents do not show duplicated numbering such as `4. 1. Step 1`; Heading entries are unnumbered and Step entries are visually indented.
13. Inspect the exported source and confirm `<meta name="interactive-guide-maker" content="1">` exists.
14. Confirm the inert `#interactive-guide-source` element exists with `data-encoding="base64"`. Decode it and verify `signature: "interactive-guide-maker"`, `schemaVersion: 1`, document state, and referenced image assets are present.
15. Confirm viewer image elements are hydrated from the embedded asset payload and full image Base64 data is not duplicated into normal image `src` markup in the exported source.
16. Return to the editor, choose **Open HTML**, select the exported file, and confirm title, blocks, tab contents, and images are restored.
17. Edit the restored guide and export again. Confirm the second exported HTML remains reopenable.
18. While a non-empty guide is open, import another compatible guide and confirm replacement is requested before the current guide changes.
19. Try a generic HTML file and confirm it is rejected without replacing the current guide.
20. Try a source payload with a higher `schemaVersion` and confirm it is rejected as a newer unsupported format.
21. Search for text inside a hidden Tab in the exported viewer and confirm selecting the result activates that Tab before navigation.
22. Test the editor, Export dialog, and exported viewer at 320px width and confirm there is no horizontal page scrolling.
23. Inspect CSP in both editor build and exported viewer and confirm `connect-src 'none'`; confirm no external script, stylesheet, font, image, analytics, or telemetry dependency is present.


## Expected runtime network behavior

The app and exported viewer do not initiate runtime network requests. User-created links may navigate away only when the reader explicitly activates them. Opening an exported guide reads only the user-selected local HTML file.

## Not part of v1.0.0

Image annotation, persistent viewer checklist progress, and table blocks remain later milestones.

## Mobile workspace checks

At 320px and 390px widths, verify:

- Structure / Edit / Preview bottom tabs switch without horizontal page scrolling.
- Add Block opens the bottom sheet and every block choice has a large tap target.
- The bottom bar and Add Block action respect safe-area insets and do not cover the last editor control.
- Selecting a heading or step in Structure opens that block in Edit.
- Preview reflects title, blocks, images, tabs, details, code, and checklists without exporting first.
- Export, help, and confirmation dialogs remain fully scrollable with the software keyboard visible.
