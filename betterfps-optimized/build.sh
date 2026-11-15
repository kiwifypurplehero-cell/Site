#!/bin/bash
# Build script for BetterFps Optimized

set -e

echo "========================================="
echo "BetterFps Optimized Build Script"
echo "========================================="

# Check Java version
echo "Checking Java version..."
java -version 2>&1 | head -1

# Use Gradle wrapper
if [ ! -f ./gradlew ]; then
    echo "Generating Gradle wrapper..."
    gradle wrapper --gradle-version 4.10.3
fi

chmod +x gradlew

echo ""
echo "Step 1: Setting up Forge decomp workspace..."
echo "This downloads Minecraft/Forge sources (~200MB, may take a few minutes)"
./gradlew setupDecompWorkspace --stacktrace

echo ""
echo "Step 2: Building the mod JAR..."
./gradlew build --stacktrace

echo ""
echo "========================================="
echo "Build complete!"
echo "JAR location: build/libs/BetterFps-Optimized-1.4.8-optimized.jar"
echo "========================================="
ls -la build/libs/
