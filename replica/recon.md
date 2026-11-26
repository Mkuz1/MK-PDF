# Recon map: reference PDF reader → MK PDF

Date: 2026-11-09. Kept outside the MK PDF repo on purpose (the product name stays out of MK PDF's code and docs).

Scope agreed with the user: the reference reader's desktop and mobile apps, four slices — editing text, scans and
OCR, export to Word, phone reading. Audience: MK PDF itself (a PDF editor the user ships on Mac, Windows, Android,
iPhone). Method: public help pages only, read one at a time in a browser. Nothing from inside the app: no binaries,
bundles, network calls or account. Its terms forbid reverse engineering, so "how the engine works" below is what the
public docs describe and what the behaviour implies, never its code.

## Sources

| source | url | what it gave |
| --- | --- | --- |
| help: edit scanned PDFs | https://helpx.adobe.com/acrobat/desktop/create-documents/scan-documents-to-pdfs/edit-scans.html | Edit runs OCR automatically; new text matches the scan's font |
| help: scanned PDF settings | https://helpx.adobe.com/acrobat/desktop/create-documents/scan-documents-to-pdfs/scanned-pdf-settings.html | deskew, background removal, descreen, text sharpening, adaptive compression, JBIG2/CCITT, PDF/A |
| help: fix recognition errors | https://helpx.adobe.com/acrobat/desktop/create-documents/scan-documents-to-pdfs/fix-scanned-text.html | uncertain words become "suspects"; a review tool steps through them |
| help: recognize text | https://helpx.adobe.com/acrobat/desktop/create-documents/scan-documents-to-pdfs/recognize-text.html | searchable layer, batch, language (page refused automated fetch; summary from search) |
| help: change text | https://helpx.adobe.com/acrobat/desktop/edit-documents/edit-text-in-pdfs/modify-text.html | click to retype; embedded-but-not-installed font → only colour and size can change |
| help: format text | https://helpx.adobe.com/acrobat/desktop/edit-documents/edit-text-in-pdfs/format-text.html | font, size, colour, B/I/U, super/subscript, alignment incl. justify, line spacing, paragraph spacing, character spacing, horizontal scaling, lists |
| help: adjust text boxes | https://helpx.adobe.com/acrobat/desktop/edit-documents/edit-text-in-pdfs/adjust-text-boxes.html | move (Shift = straight line), resize reflows text without changing size, rotate handle |
| help: lists | https://helpx.adobe.com/acrobat/desktop/edit-documents/edit-text-in-pdfs/edit-lists.html | Enter adds an item, Tab nests, convert paragraph ↔ list item |
| help: fonts / fallback | https://helpx.adobe.com/lu_en/acrobat/using/default-font-pdf-editing-add-text.html | a chosen fallback font for edits when the original is missing |
| help: export selections | https://helpx.adobe.com/acrobat/using/exporting-pdfs-file-formats.html | export a text selection as DOCX/XLSX/CSV/HTML; export all images with "exclude smaller than" |
| help: retain layout | https://helpx.adobe.com/si/acrobat/how-to/convert-pdf-retain-page-layout.html | Word export: Retain Flowing Text vs Retain Page Layout; comments and images on/off |
| help: reflowed reading | https://helpx.adobe.com/acrobat/mobile/view-manage-files/liquid-mode.html | phone reflow view, text size / character / line spacing, limits (200 pages, 10 MB, no scans) |
| blog: reflow launch | https://blog.adobe.com/en/publish/2020/09/23/adobe-unveils-ambitious-multi-year-vision-for-pdf-introduces-liquid-mode | outline from detected headings, collapsible sections, responsive tables |

## Screens (reference, the four slices)

| id | screen | how you get there | purpose | key components | states |
| --- | --- | --- | --- | --- | --- |
| S01 | Edit mode | top bar › Edit | edit text and images in place | blue text box with handles, rotate handle, Edit pane | scan (OCR runs first), font missing, protected |
| S02 | Format text pane | select text in S01 | style the selection | font list, size, colour, B/I/U, sub/super, align ×4, line/paragraph/char spacing, scaling, list buttons | mixed styles, font missing |
| S03 | Find and replace | Edit › find | replace text across the document | find, replace, match case, whole word | no match |
| S04 | Spell check | Edit › spelling | fix misspellings in edited text | word list, accept, ignore | none found |
| S05 | Scan & OCR | All tools › Scan & OCR | add a text layer | language, output type, pages | already has text, protected |
| S06 | Enhance scan | Scan & OCR › Enhance | clean the image before OCR | deskew, background removal, descreen, sharpen, compression | colour, grey, mono |
| S07 | Review recognized text | Scan & OCR › Correct | fix uncertain words | suspect boxes on the page, "Recognized as" field, Accept, next | no suspects |
| S08 | Export to Word | Convert › Word | DOCX/DOC | flowing vs layout, comments, images | scan (OCR first) |
| S09 | Export selection | right-click a selection | part of a page to DOCX/XLSX/CSV | format list | — |
| S10 | Reflow reading view | phone › reflow button | read on a small screen | outline, collapsible sections, text settings, search | unsupported file |

## Flows

```
F01 Retype a sentence            S01 click text → type → click outside            (3 actions)
    edge: font not installed but embedded → only colour/size; font missing → fallback font
F02 Restyle a paragraph          S01 select → S02 change → click outside         (3+)
F03 Widen a text box             S01 select → drag side handle (text reflows, size kept)  (2)
F04 Replace a word everywhere    S03 find → replace → replace all                 (4)
F05 Edit a scan                  S01 on a scan → OCR runs → type; text matches the scan's font  (3)
F06 Clean and recognise a scan   S06 options → S05 language → run                 (4)
F07 Fix OCR mistakes             S07 next suspect → correct → Accept → …          (3 per word)
F08 Export to Word               S08 choose flowing/layout → convert → save       (3)
F09 Copy a table out             select → S09 → CSV/XLSX                          (3)
F10 Read on a phone              open → S10 reflow → outline → section            (2)
```

## How the engine works (from the docs, not the code)

1. **Editing uses the document's own font first.** If the font is installed it is used; if it is only embedded,
   colour and size can change but not the letters (the embedded subset may lack new letters); otherwise a fallback
   font the user picks. MK PDF on Mac already goes further (installed → Office copy → embedded font when it has every
   glyph). MK PDF on Windows, Android and iPhone skips the embedded font and goes straight to bundled Noto, so phones
   always change the look of edited text.
2. **Text boxes are paragraphs with a width.** Resizing reflows lines inside the new width, font size unchanged;
   lists are paragraphs with markers and indent levels.
3. **Scans become editable by OCR + font matching.** The recognised text carries a size and a matched typeface so new
   words look like the scan. Uncertain words are kept as the original image with text behind them and flagged as
   suspects for review.
4. **Scans are cleaned before recognition:** deskew, background removal, descreen, sharpening; then adaptive
   compression (JPEG/JPEG2000 for colour, JBIG2/CCITT for black-and-white).
5. **Word export has two modes:** flowing text (one text stream, wraps in Word) and page layout (text boxes where
   needed to keep the design).
6. **The phone reading view reflows** detected headings, paragraphs, lists and tables into one column, builds an
   outline from the headings, and lets the reader change text size and spacing. It gives up on scans, very large
   files and table-heavy layouts.

## Inferred model (editing)

```
TextBox     page, rect (width drives wrapping), rotation, paragraphs[]        evidence: S01 handles, F03   high
Paragraph   runs[], alignment (left|center|right|justify), line spacing,
            space after, list {type: bullet|number, level} | none            evidence: S02, lists help      high
Run         text, font (installed | embedded | fallback), size, colour,
            bold/italic/underline, baseline shift (sub/super), char spacing,
            horizontal scale                                                   evidence: S02                  high
OCRWord     text, rect, confidence, suspect: bool                             evidence: S07                  high
```

## Not clonable / skipped

- The AI chat editing ("make all headings bold") — the reference uses its own cloud model; MK PDF has on-device AI on Mac only. Skip for now.
- The cloud conversion service and account-gated features (export needs a paid plan there) — MK PDF does it locally, nothing to copy.
- Font licences: the reference ships licensed fallback fonts; MK PDF uses Noto (open licence). Skip.
- JPEG2000 and JBIG2 encoders: no open, small, browser-safe encoder worth bundling. Skip.

## Size

10 screens, 10 flows, 4 entities. Hard parts: (1) writing new text in the PDF's embedded font in the shared engine
(subset fonts, encodings, fonts with no usable character map); (2) a phone reflow view that detects headings and
tables well enough; (3) scan clean-up (deskew) fast enough on a phone. Size: L for everything; M for the
"must" rows.
