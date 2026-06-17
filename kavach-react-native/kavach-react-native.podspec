require "json"

package = JSON.parse(File.read(File.join(__dir__, "package.json")))

Pod::Spec.new do |s|
  s.name         = "kavach-react-native"
  s.version      = package["version"]
  s.summary      = package["description"]
  s.homepage     = package["homepage"] || "https://github.com/Rajeev02/kavachid"
  s.license      = package["license"]
  s.authors      = package["author"]

  s.platforms    = { :ios => "14.0" }
  s.source       = { :git => "https://github.com/Rajeev02/kavachid.git", :tag => "#{s.version}" }

  s.source_files = "ios/**/*.{h,m,mm,swift}"

  # React Native Core Dependencies
  s.dependency "React-Core"
  
  # For New Architecture / Turbo Modules
  if ENV['RCT_NEW_ARCH_ENABLED'] == '1'
    install_modules_dependencies(s)
  end

  # Local dependencies on native SDK
  s.dependency "KavachID"
end
