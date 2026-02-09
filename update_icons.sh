#!/bin/bash
SRC="assets/icon.png"

# iOS (1024x1024)
echo "Generating iOS Icon..."
sips -z 1024 1024 "$SRC" --out "ios/App/App/Assets.xcassets/AppIcon.appiconset/AppIcon-512@2x.png"

# Android
echo "Generating Android Icons..."

# mdpi (48x48)
sips -z 48 48 "$SRC" --setProperty format png --out "android/app/src/main/res/mipmap-mdpi/ic_launcher.png"
sips -z 48 48 "$SRC" --setProperty format png --out "android/app/src/main/res/mipmap-mdpi/ic_launcher_round.png"

# hdpi (72x72)
sips -z 72 72 "$SRC" --setProperty format png --out "android/app/src/main/res/mipmap-hdpi/ic_launcher.png"
sips -z 72 72 "$SRC" --setProperty format png --out "android/app/src/main/res/mipmap-hdpi/ic_launcher_round.png"

# xhdpi (96x96)
sips -z 96 96 "$SRC" --setProperty format png --out "android/app/src/main/res/mipmap-xhdpi/ic_launcher.png"
sips -z 96 96 "$SRC" --setProperty format png --out "android/app/src/main/res/mipmap-xhdpi/ic_launcher_round.png"

# xxhdpi (144x144)
sips -z 144 144 "$SRC" --setProperty format png --out "android/app/src/main/res/mipmap-xxhdpi/ic_launcher.png"
sips -z 144 144 "$SRC" --setProperty format png --out "android/app/src/main/res/mipmap-xxhdpi/ic_launcher_round.png"

# xxxhdpi (192x192)
sips -z 192 192 "$SRC" --setProperty format png --out "android/app/src/main/res/mipmap-xxxhdpi/ic_launcher.png"
sips -z 192 192 "$SRC" --setProperty format png --out "android/app/src/main/res/mipmap-xxxhdpi/ic_launcher_round.png"

echo "Done!"
