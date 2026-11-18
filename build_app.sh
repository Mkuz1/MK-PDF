#!/bin/zsh
# Builds a release MK PDF.app next to this script.
set -euo pipefail
cd "$(dirname "$0")"

# The macOS 27 SDK in Command Line Tools needs SwiftUI macro plugins that only ship with Xcode,
# so fall back to the newest SDK that still builds without them.
if ! xcodebuild -version >/dev/null 2>&1; then
  for sdk in /Library/Developer/CommandLineTools/SDKs/MacOSX26.5.sdk /Library/Developer/CommandLineTools/SDKs/MacOSX26.sdk; do
    [[ -d $sdk ]] && export SDKROOT=$sdk && break
  done
fi

VERSION=$(tr -d '[:space:]' < VERSION 2>/dev/null || echo 1.0.0)
BUILD=${BUILD_NUMBER:-$(git rev-list --count HEAD 2>/dev/null || echo 1)}

# The document conversion engine (shared with the Windows and Android apps) runs inside the app.
(cd cross && { [[ -d node_modules ]] || npm ci --no-audit --no-fund; } && npm run --silent build:core && node scripts/copy-assets.mjs >/dev/null)

# UNIVERSAL=1 builds one binary for Apple Silicon and Intel.
ARCH_FLAGS=()
[[ ${UNIVERSAL:-0} == 1 ]] && ARCH_FLAGS=(--arch arm64 --arch x86_64)
# MAS=1 builds the Mac App Store variant: sandboxed, no self-updater, no network use (see STORE.md). It goes to its
# own folder so it never replaces the regular build.
MAS=${MAS:-0}
ENTITLEMENTS=MKPDF.entitlements
OUT=.
if [[ $MAS == 1 ]]; then
  ARCH_FLAGS+=(-Xswiftc -DAPPSTORE --scratch-path .build-appstore)
  ENTITLEMENTS=MKPDF-AppStore.entitlements
  OUT=build-appstore
  mkdir -p "$OUT"
fi
swift build -c release --product MKPDF "${ARCH_FLAGS[@]}"
BIN=$(swift build -c release "${ARCH_FLAGS[@]}" --show-bin-path)/MKPDF
APP="$OUT/MK PDF.app"
rm -rf "$APP"
mkdir -p "$APP/Contents/MacOS" "$APP/Contents/Resources"
cp "$BIN" "$APP/Contents/MacOS/MKPDF"
cp cross/dist-core/core.js "$APP/Contents/Resources/core.js"
cp cross/public/licenses.txt "$APP/Contents/Resources/licenses.txt"

ICONSET=$(mktemp -d)/AppIcon.iconset
mkdir -p "$ICONSET"
swift scripts/make_icon.swift "$ICONSET/icon_512x512@2x.png"
for s in 16 32 128 256 512; do
  sips -z $s $s "$ICONSET/icon_512x512@2x.png" --out "$ICONSET/icon_${s}x${s}.png" >/dev/null
  sips -z $((s*2)) $((s*2)) "$ICONSET/icon_512x512@2x.png" --out "$ICONSET/icon_${s}x${s}@2x.png" >/dev/null
done
iconutil -c icns "$ICONSET" -o "$APP/Contents/Resources/AppIcon.icns"

cat > "$APP/Contents/Info.plist" <<PLIST
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>CFBundleName</key><string>MK PDF</string>
  <key>CFBundleDisplayName</key><string>MK PDF</string>
  <key>CFBundleIdentifier</key><string>com.mkoussa.mkpdf</string>
  <key>CFBundleExecutable</key><string>MKPDF</string>
  <key>CFBundleIconFile</key><string>AppIcon</string>
  <key>CFBundlePackageType</key><string>APPL</string>
  <key>CFBundleShortVersionString</key><string>$VERSION</string>
  <key>CFBundleVersion</key><string>$BUILD</string>
  <key>LSMinimumSystemVersion</key><string>15.0</string>
  <key>LSApplicationCategoryType</key><string>public.app-category.productivity</string>
  <key>NSHighResolutionCapable</key><true/>
  <key>ITSAppUsesNonExemptEncryption</key><false/>
  <key>NSHumanReadableCopyright</key><string>© $(date +%Y) MK PDF</string>
  <key>NSPrincipalClass</key><string>NSApplication</string>
  <key>CFBundleDocumentTypes</key>
  <array>
    <dict>
      <key>CFBundleTypeName</key><string>PDF Document</string>
      <key>CFBundleTypeRole</key><string>Editor</string>
      <key>LSHandlerRank</key><string>Default</string>
      <key>LSItemContentTypes</key><array><string>com.adobe.pdf</string></array>
    </dict>
  </array>
</dict>
</plist>
PLIST

# Ad-hoc signature (required to run on Apple Silicon). Set SIGN_IDENTITY to a Developer ID certificate
# for a build Gatekeeper accepts without the right-click → Open step.
# The App Store build also carries its provisioning profile (PROVISIONING_PROFILE=path) when one is given.
[[ $MAS == 1 && -n ${PROVISIONING_PROFILE:-} ]] && cp "$PROVISIONING_PROFILE" "$APP/Contents/embedded.provisionprofile"
codesign --force --deep --options runtime --entitlements "$ENTITLEMENTS" --sign "${SIGN_IDENTITY:--}" "$APP"
echo "Built $(pwd)/$APP (version $VERSION, build $BUILD)"
# With INSTALLER_IDENTITY ("3rd Party Mac Developer Installer: …") the App Store build is wrapped in the .pkg that
# Transporter or `xcrun altool` uploads.
if [[ $MAS == 1 && -n ${INSTALLER_IDENTITY:-} ]]; then
  productbuild --component "$APP" /Applications --sign "$INSTALLER_IDENTITY" "$OUT/MK-PDF-$VERSION.pkg"
  echo "Packaged $(pwd)/$OUT/MK-PDF-$VERSION.pkg"
fi
