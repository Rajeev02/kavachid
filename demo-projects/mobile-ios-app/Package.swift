// swift-tools-version: 5.9
import PackageDescription

let package = Package(
    name: "KavachIDMobileDemo",
    platforms: [
        .iOS(.v13) // Requires iOS 13+ for modern Swift concurrency and SPM
    ],
    dependencies: [
        // Keychain wrapper library
        .package(url: "https://github.com/kishikawakatsumi/KeychainAccess.git", from: "4.2.2")
    ],
    targets: [
        .target(
            name: "KavachIDMobileDemo",
            dependencies: [
                "KeychainAccess"
            ]
        )
    ]
)
