# Kavach Publishing Guide

This guide outlines the step-by-step terminal commands required to manually publish all 7 Kavach SDKs to their respective global registries.

> [!IMPORTANT]
> Ensure you have bumped the version number using `node bump-version.js` before executing any of these publish commands!

---

## 1. Web & React Native (NPM)

The web and React Native SDKs are published using the root shell script.
**Note:** If you have 2FA enabled on NPM, your browser will open to request an OTP.

```bash
# From the root directory
./publish.sh
```

---

## 2. iOS (CocoaPods)

The Swift SDK is published via the CocoaPods Trunk API. You must have a registered session (`pod trunk register`).

```bash
cd sdks/kavach-ios
pod trunk push KavachSDK.podspec
```

---

## 3. Android (Maven Central)

The Kotlin SDK is published to Sonatype Maven Central via the Gradle publishing plugin. This requires your GPG signing keys to be configured.

```bash
cd sdks/kavach-android
./gradlew publish
```
*After publishing, you must log into the [Sonatype Publisher Dashboard](https://central.sonatype.com/publishing) to manually validate and release the deployment.*

---

## 4. Flutter (Pub.dev)

The Dart SDK is published to Pub.dev. This command will analyze the package and prompt you for confirmation before uploading.

```bash
# From the root directory
./publish-flutter.sh

# Or manually:
# cd sdks/kavach-flutter && dart pub publish
```

---

## 5. Python (PyPI)

The Python SDK is published to the Python Package Index using `twine`. This requires your PyPI API token (`__token__`).

```bash
# From the root directory
./publish-python.sh

# Or manually:
# cd sdks/kavach-python
# python3 setup.py sdist bdist_wheel
# twine upload dist/*
```

---

## 6. Go (pkg.go.dev)

The Go SDK is heavily tied to GitHub tags. To publish a new version of the Go SDK, you simply need to push the Git tag, and Go's proxy will automatically cache it.

```bash
# Replace v1.0.4 with your target version
git tag sdks/kavach-go/v1.0.4
git push origin sdks/kavach-go/v1.0.4
```
*To force the Go module indexer to update immediately, visit: `https://pkg.go.dev/github.com/Rajeev02/kavachid/sdks/kavach-go@latest`*
