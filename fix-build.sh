#!/bin/bash

# Script to fix React Native Android build CMake codegen errors

echo "Cleaning Android build artifacts..."

# Remove CMake build cache
rm -rf android/app/.cxx

# Remove generated autolinking files
rm -rf android/app/build/generated/autolinking

# Clean Gradle build
cd android
./gradlew clean

echo "Build cleaned. Now try running your build again:"
echo "  cd android && ./gradlew assembleDebug"
echo "or"
echo "  npm run android"

