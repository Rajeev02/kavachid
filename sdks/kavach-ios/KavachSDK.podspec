Pod::Spec.new do |spec|
  spec.name         = "KavachSDK"
  spec.version      = "1.0.1"
  spec.summary      = "Kavach Ecosystem Native iOS SDK"
  spec.description  = "Provides native FaceID/TouchID integrations for the Kavach Shield Engine."
  spec.homepage     = "https://github.com/Rajeev02/kavachid"
  spec.license      = "MIT"
  spec.author       = { "Rajeev Joshi" => "info@kavachid.org" }
  spec.source       = { :git => "https://github.com/Rajeev02/kavachid.git", :tag => "ios-v#{spec.version}" }
  spec.source_files = "Sources/**/*.{h,m,swift}"
  spec.ios.deployment_target = "13.0"
  spec.swift_version = "5.7"
end
