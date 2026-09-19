# Question PDF implementation

Question export has no library or font-file dependencies. `question-report.mjs`
uses the existing app renderers and CSS in a fixed-width offscreen document,
then captures the two visual sections through native SVG foreignObject and canvas.
Same-origin images are inlined before capture.

AI prose is PDF text, using generated Type3 fonts with Unicode CMaps. The browser
rasterizes regular and bold glyph masks at export time using its installed fonts.
Each font holds at most 220 Unicode codepoints; supplementary characters map to
UTF-16 surrogate pairs in ToUnicode. Glyph coverage follows the browser's font
fallback support. No TTF/WOFF files are read, copied, embedded, or downloaded.

Visual pages use landscape A3; paginated text uses portrait A4. Mệnh keeps its
existing canvasReport/buildImagePdf path. Mobile file sharing still depends on
browser support. Native foreignObject-to-canvas rendering should be smoke tested
on target mobile browsers; capture errors are reported by the export UI.
