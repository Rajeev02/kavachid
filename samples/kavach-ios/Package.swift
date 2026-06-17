// swift-tools-version: 5.9
import PackageDescription

let package = Package(
    name: "KavachID",
    platforms: [
        .iOS(.v14),
        .macOS(.v11)
    ],
    products: [
        .library(
            name: "KavachID",
            targets: ["KavachID"]),
    ],
    dependencies: [
        .package(url: "https://github.com/kishikawakatsumi/KeychainAccess.git", from: "4.2.2"),
        .package(url: "https://github.com/vapor/jwt-kit.git", from: "4.0.0") // For DPoP JWT signing
    ],
    targets: [
        .target(
            name: "KavachID",
            dependencies: [
                "KeychainAccess",
                .product(name: "JWTKit", package: "jwt-kit")
            ]),
        .testTarget(
            name: "KavachIDTests",
            dependencies: ["KavachID"]),
    ]
)
