#!/usr/bin/env bash
# Source this:  source scripts/load-mobile-env.sh
export PATH="${HOME}/.local/node/bin:${HOME}/.local/bin:${PATH}"
export JAVA_HOME="${HOME}/.local/opt/jdk-17"
export PATH="${JAVA_HOME}/bin:${PATH}"
export ANDROID_HOME="${HOME}/Library/Android/sdk"
export ANDROID_SDK_ROOT="${ANDROID_HOME}"
export PATH="${ANDROID_HOME}/emulator:${ANDROID_HOME}/platform-tools:${ANDROID_HOME}/cmdline-tools/latest/bin:${PATH}"
export PATH="${HOME}/.rbenv/shims:${HOME}/.rbenv/bin:${PATH}"

echo "Mobile env loaded:"
echo "  JAVA_HOME=$JAVA_HOME"
echo "  ANDROID_HOME=$ANDROID_HOME"
command -v java >/dev/null && java -version 2>&1 | head -1
command -v adb >/dev/null && adb version | head -1
command -v node >/dev/null && echo "  node $(node -v)"
command -v pod >/dev/null && echo "  pod $(pod --version)" || echo "  pod: not installed yet"
if command -v xcodebuild >/dev/null 2>&1; then
  xcodebuild -version 2>&1 | head -2 || echo "  Xcode: not installed (required for iOS)"
else
  echo "  Xcode: not installed (required for iOS)"
fi
