#!/bin/bash
# MinimalBrowser - Setup Android SDK and Build APK
# This script downloads Android SDK Command-line Tools, accepts licenses, and builds the debug APK

set -euo pipefail

# Configuration
SDK_VERSION="11076708"  # Latest as of 2024
SDK_URL="https://dl.google.com/android/repository/commandlinetools-linux-${SDK_VERSION}_latest.zip"
ANDROID_HOME="${HOME}/android-sdk"
CMDLINE_TOOLS_DIR="${ANDROID_HOME}/cmdline-tools/latest"
GRADLE_PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

log_info() {
    echo -e "${BLUE}[INFO]${NC} $*"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $*"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $*"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $*"
}

# Check if Java is installed
check_java() {
    log_info "Checking Java installation..."
    if ! command -v java &> /dev/null; then
        log_error "Java is not installed. Please install JDK 11 or higher."
        log_info "On Ubuntu/Debian: sudo apt-get install openjdk-11-jdk"
        log_info "On Fedora: sudo dnf install java-11-openjdk-devel"
        log_info "On Arch: sudo pacman -S jdk11-openjdk"
        exit 1
    fi

    JAVA_VERSION=$(java -version 2>&1 | head -n 1 | cut -d'"' -f2 | cut -d'.' -f1)
    if [[ "$JAVA_VERSION" -lt 11 ]]; then
        log_error "Java 11 or higher is required. Found Java $JAVA_VERSION"
        exit 1
    fi

    log_success "Java $JAVA_VERSION found"
}

# Download and install Android SDK Command-line Tools
install_sdk() {
    log_info "Setting up Android SDK at ${ANDROID_HOME}..."

    # Create directories
    mkdir -p "${ANDROID_HOME}/cmdline-tools"
    cd "${ANDROID_HOME}/cmdline-tools"

    # Download if not already present
    if [[ ! -d "latest/bin" ]]; then
        log_info "Downloading Android SDK Command-line Tools..."
        wget -q --show-progress "${SDK_URL}" -O commandlinetools.zip

        log_info "Extracting..."
        unzip -q commandlinetools.zip
        mv cmdline-tools latest
        rm commandlinetools.zip
        log_success "Android SDK Command-line Tools installed"
    else
        log_info "Android SDK Command-line Tools already installed"
    fi

    # Add to PATH for this session
    export PATH="${CMDLINE_TOOLS_DIR}/bin:${PATH}"
}

# Accept SDK licenses
accept_licenses() {
    log_info "Accepting Android SDK licenses..."

    # Create license directory
    mkdir -p "${ANDROID_HOME}/licenses"

    # Accept licenses by creating license files with known hashes
    # These are the standard license hashes for Android SDK
    echo "8933bad161af4178b1185d1a37fbf41ea5269c55" > "${ANDROID_HOME}/licenses/android-sdk-license"
    echo "d56f5187479451eabf01fb78af6dfcb131a6481e" >> "${ANDROID_HOME}/licenses/android-sdk-license"
    echo "24333f8a63b6825ea9c5514f83c2829b004d1fee" >> "${ANDROID_HOME}/licenses/android-sdk-license"
    echo "84831b9409646a918e30573bab4c9c91346d8abd" > "${ANDROID_HOME}/licenses/android-sdk-preview-license"

    log_success "Licenses accepted"
}

# Install required SDK packages
install_sdk_packages() {
    log_info "Installing required SDK packages (platforms;android-34, build-tools;34.0.0, platform-tools)..."

    export PATH="${CMDLINE_TOOLS_DIR}/bin:${PATH}"

    # Update sdkmanager first
    yes | sdkmanager --update > /dev/null 2>&1 || true

    # Install required packages
    sdkmanager "platforms;android-34" "build-tools;34.0.0" "platform-tools" > /dev/null 2>&1

    log_success "SDK packages installed"
}

# Build the APK
build_apk() {
    log_info "Building APK..."

    cd "${GRADLE_PROJECT_DIR}"

    # Make gradlew executable
    chmod +x gradlew

    # Set environment variables for Gradle
    export ANDROID_HOME="${ANDROID_HOME}"
    export ANDROID_SDK_ROOT="${ANDROID_HOME}"
    export PATH="${CMDLINE_TOOLS_DIR}/bin:${ANDROID_HOME}/platform-tools:${PATH}"

    # Build debug APK
    ./gradlew assembleDebug --no-daemon

    # Find the generated APK
    APK_PATH=$(find "${GRADLE_PROJECT_DIR}" -name "*.apk" -path "*/build/outputs/apk/debug/*" 2>/dev/null | head -n 1)

    if [[ -n "${APK_PATH}" && -f "${APK_PATH}" ]]; then
        APK_SIZE=$(du -h "${APK_PATH}" | cut -f1)
        log_success "APK built successfully!"
        log_info "APK location: ${APK_PATH}"
        log_info "APK size: ${APK_SIZE}"

        # Copy to project root for easy access
        cp "${APK_PATH}" "${GRADLE_PROJECT_DIR}/MinimalBrowser-debug.apk"
        log_info "Copied to: ${GRADLE_PROJECT_DIR}/MinimalBrowser-debug.apk"
    else
        log_error "APK not found after build"
        exit 1
    fi
}

# Main execution
main() {
    log_info "=========================================="
    log_info "MinimalBrowser - Setup and Build Script"
    log_info "=========================================="

    check_java
    install_sdk
    accept_licenses
    install_sdk_packages
    build_apk

    log_info "=========================================="
    log_success "Build completed successfully!"
    log_info "=========================================="
    log_info ""
    log_info "To install on a device/emulator:"
    log_info "  adb install -r ${GRADLE_PROJECT_DIR}/MinimalBrowser-debug.apk"
    log_info ""
    log_info "To run on an emulator:"
    log_info "  emulator -avd <avd_name>"
    log_info "  adb install -r ${GRADLE_PROJECT_DIR}/MinimalBrowser-debug.apk"
}

# Run main
main "$@"