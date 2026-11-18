# Publishing MK PDF in the app stores

MK PDF has two kinds of build:

- **Direct builds** are the ones on the GitHub release page. They check that page for new versions and update themselves.
- **Store builds** never update themselves and never connect to the internet. Each store forbids apps that update outside it, and Google Play restricts the permission the Android updater needs.

One code base makes both. What differs is listed per store below, with the command that makes the store build, what the store console will ask, and what only the account holder can do.

## What is the same everywhere

| Item | Value |
| --- | --- |
| Name | MK PDF |
| Bundle / application ID | `com.mkoussa.mkpdf` (decide before the first upload: it can never change afterwards) |
| Category | Productivity |
| Price | your choice; the app has no purchases, ads or accounts |
| Privacy policy URL | `https://github.com/mohamdbeam-star/MK-PDF/blob/main/PRIVACY.md` |
| Support URL | `https://github.com/mohamdbeam-star/MK-PDF/issues` |
| Age rating | lowest (4+ / Everyone / PEGI 3): no user content shared, no web browsing, no purchases |
| Data collected | none |
| Licences | shown in the app: About MK PDF › Open-source licences (Mac: MK PDF menu › Acknowledgements) |

### Listing text (draft)

**Subtitle / short description (30 / 80 characters)**

- `Edit, sign and convert PDFs`
- `Edit real PDF text, sign, scan, recognize text and convert to Word. All offline.`

**Description**

> MK PDF is a complete PDF editor that works entirely on your device.
>
> EDIT THE REAL TEXT
> Tap a paragraph and retype it. MK PDF keeps the document's own font, size and colour, rewraps the text, and lets you change alignment, spacing, lists, and more. Move, resize, replace or delete images. Find and replace across the whole document.
>
> SCANS BECOME EDITABLE
> Recognize text in scanned pages in English and Arabic, straighten and clean crooked scans, review uncertain words, then edit the scan like any other PDF.
>
> CONVERT
> Export to Word, Excel, PowerPoint, web page, Markdown and more, keeping layout, tables and images, or as flowing text that is easy to edit. Export just part of a page. Turn images into PDFs.
>
> FILL, SIGN AND COMMENT
> Fill forms, draw or type your signature, add notes, highlights, shapes and stamps.
>
> ORGANIZE AND PROTECT
> Reorder, rotate, split, combine and extract pages. Add passwords, redact for good, compress, repair damaged files, compare two versions.
>
> PRIVATE BY DESIGN
> No accounts, no ads, no tracking. Your documents never leave your device.

**Keywords (Apple, 100 characters)**

`pdf,editor,edit,sign,scan,ocr,convert,word,fill,form,merge,split,compress,redact,arabic,annotate`

**Notes for the reviewer**

> MK PDF needs no account and no network. To try the main feature: open any PDF, choose Edit Text & Images, tap a paragraph, change the text and press Done. Scan (camera) is under Home › Scan on phones.

### Screenshots still to make

Every store needs screenshots taken from the real app; none are in the repository yet.

| Store | Sizes needed |
| --- | --- |
| iPhone | 6.9-inch (1320 × 2868) and, if you support older phones in the listing, 6.5-inch (1284 × 2778) |
| iPad | 13-inch (2064 × 2752), required because the app runs on iPad |
| Mac | 2880 × 1800 (or 1440 × 900 / 2560 × 1600) |
| Google Play | phone (at least 1080 px on the short side), 7-inch and 10-inch tablet, a 1024 × 500 feature graphic, a 512 × 512 icon |
| Microsoft Store | 1920 × 1080 or larger |

## iPhone and iPad (App Store)

**Done in the code**

- Store build by default: `MKPDF_STORE_BUILD = YES` in the Xcode project turns the update check off. (The GitHub build passes `MKPDF_STORE_BUILD=NO`.)
- Privacy manifest `PrivacyInfo.xcprivacy`: no tracking, no data collected, required-reason APIs declared.
- App icon without an alpha channel (App Store Connect rejects icons that have one).
- Camera and photo permission texts; opens PDFs from Files, Mail and Share.

**You need**

- An Apple Developer Program membership, and an App Store Connect record for `com.mkoussa.mkpdf`.
- Signing: open `cross/ios/App/App.xcodeproj` in Xcode, select your team under Signing & Capabilities.

**Build and upload**

```bash
cd cross && npm ci && npm run build && npx cap sync ios
V=$(cat ../VERSION)
xcodebuild -project ios/App/App.xcodeproj -scheme App -configuration Release -sdk iphoneos \
  -archivePath build/MKPDF.xcarchive MARKETING_VERSION="$V" CURRENT_PROJECT_VERSION="$(git rev-list --count HEAD)" archive
```

Then Xcode › Window › Organizer › Distribute App › App Store Connect.

**App Store Connect answers**

- App Privacy: **Data Not Collected**.
- Encryption (export compliance): see "One decision for you" below.
- Content rights: the app contains no third-party content.

## Mac (Mac App Store)

**Done in the code**

- `MAS=1 ./build_app.sh` builds the App Store variant into `build-appstore/`: sandboxed (`MKPDF-AppStore.entitlements`: sandbox, files you choose, printing), with the updater, the "Check for Updates" commands and the command-line test modes compiled out. It makes no network connections.
- Checked on this Mac: the sandboxed build opens a PDF and exports it to Word through the Save panel.

**You need**

- The certificates "3rd Party Mac Developer Application" and "3rd Party Mac Developer Installer" (Apple Developer › Certificates), and a Mac App Store provisioning profile for `com.mkoussa.mkpdf`.

**Build and upload**

```bash
MAS=1 UNIVERSAL=1 \
SIGN_IDENTITY="3rd Party Mac Developer Application: YOUR NAME (TEAMID)" \
INSTALLER_IDENTITY="3rd Party Mac Developer Installer: YOUR NAME (TEAMID)" \
PROVISIONING_PROFILE=/path/to/MKPDF_MAS.provisionprofile \
./build_app.sh
```

Upload `build-appstore/MK-PDF-<version>.pkg` with the Transporter app.

**Not yet verified:** a build signed with real App Store certificates (only you have them), and every tool under the sandbox. Opening, editing and Word export were checked; try Batch, Combine, Compare, Print and saving signatures on the signed build before submitting.

## Android (Google Play)

**Done in the code**

- Two flavours. `play` is the Google Play build: no permission to install packages, no update code, an app bundle (`.aab`). `direct` is the self-updating APK for the release page.
- Target API 36, no native libraries (so no 16 KB page-size work), adaptive icon, Android Back closes dialogs and panels before leaving the app.
- The release workflow builds both; the bundle is the `android-play` artifact of each release run.

**You need**

- A Google Play developer account and an app with the package name `com.mkoussa.mkpdf`.
- The same upload key the workflow already uses (repository secrets `ANDROID_KEYSTORE_B64` and friends). Enrol in Play App Signing when you create the app.

**Build locally**

```bash
cd cross && npm ci && npm run build && npx cap sync android
cd android && APP_VERSION_CODE=<next number> KEYSTORE_FILE=… KEYSTORE_PASSWORD=… KEY_ALIAS=… KEY_PASSWORD=… ./gradlew bundlePlayRelease
# → app/build/outputs/bundle/playRelease/app-play-release.aab
```

**Play Console answers**

- Data safety: **No data collected, no data shared.**
- Permissions: Internet (declared but unused by this build; the web view requires it), Notifications ("export finished").
- Ads: no. Target audience: everyone. News app, COVID app, government app: no.

## Windows (Microsoft Store)

Two routes:

1. **Submit the existing installer** (`MK-PDF-<version>-win-x64.exe`) as a Win32 app with silent-install switch `/S`. The Store does not update such apps, so this build keeps its own updater, which the Store allows for this route. It needs a code-signing certificate, or Windows will warn on install.
2. **MSIX package**, updated by the Store. The app already detects it (`process.windowsStore`) and turns its updater off. Build on Windows with your Partner Center identity:

```bash
cd cross && npm ci && npm run build
npx electron-builder --win appx --x64 --publish never \
  -c.appx.identityName="<Package/Identity/Name>" -c.appx.publisher="<Package/Identity/Publisher>" \
  -c.appx.publisherDisplayName="<your publisher name>" -c.appx.applicationId=MKPDF
```

**Not verified:** the MSIX build needs Windows and your Partner Center identity; it has not been built or run.

## One decision for you: encryption (Apple export compliance)

App Store Connect asks whether the app uses encryption. MK PDF can password-protect PDFs with AES-256 and open protected ones.

- **Mac:** protection uses Apple's own PDF code. That is exempt; `ITSAppUsesNonExemptEncryption` is `false`.
- **iPhone / iPad:** protection is done by a library inside the app (qpdf), not by iOS. The iPhone project currently also says `false`. The accurate answer in App Store Connect is more likely "standard encryption algorithms instead of, or in addition to, Apple's". That answer needs no documents for most countries, but selling in France requires a declaration, and US law may expect a yearly self-classification report.

This is a legal answer only the account holder can give. If you would rather avoid the question, password protection on iPhone can be switched to Apple's own PDF code.

## Before every store submission

```bash
cd cross && npm test && npm run e2e     # unit and end-to-end tests
swift run -c release MKPDFSelfTest      # Mac engine self-test
```
