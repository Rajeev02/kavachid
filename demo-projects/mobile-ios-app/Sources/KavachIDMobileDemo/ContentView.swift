import SwiftUI
import KeychainAccess

struct ContentView: View {
    @State private var email = ""
    @State private var password = ""
    @State private var isAuthenticated = false
    @State private var apiResponse = ""
    @State private var isLoading = false
    
    // 1. Initialize iOS Keychain wrapper for secure persistence
    private let keychain = Keychain(service: "com.kavachid.ios.demo")
    
    var body: some View {
        VStack(spacing: 20) {
            Text("<img src="https://raw.githubusercontent.com/Rajeev02/kavachid/main/assets/logo-icon-only.png" width="24" height="24" alt="KavachID Shield" style="vertical-align: middle;" /> KavachID iOS")
                .font(.largeTitle)
                .fontWeight(.bold)
            
            Text("Native Swift Client Demo")
                .font(.subheadline)
                .foregroundColor(.secondary)
                .padding(.bottom, 30)
            
            if !isAuthenticated {
                VStack(spacing: 15) {
                    TextField("Email", text: $email)
                        .textFieldStyle(RoundedBorderTextFieldStyle())
                        .autocapitalization(.none)
                    
                    SecureField("Password", text: $password)
                        .textFieldStyle(RoundedBorderTextFieldStyle())
                    
                    Button(action: performLogin) {
                        if isLoading {
                            ProgressView()
                        } else {
                            Text("Sign In")
                                .frame(maxWidth: .infinity)
                                .padding()
                                .background(Color.blue)
                                .foregroundColor(.white)
                                .cornerRadius(8)
                        }
                    }
                }
                .padding(.horizontal)
            } else {
                VStack(spacing: 15) {
                    Text("Authenticated using Keychain Storage")
                        .foregroundColor(.green)
                    
                    Button(action: makeAuthenticatedCall) {
                        Text("📡 Call Protected API (with DPoP)")
                            .frame(maxWidth: .infinity)
                            .padding()
                            .background(Color.gray.opacity(0.2))
                            .cornerRadius(8)
                    }
                    
                    Button(action: performLogout) {
                        Text("Logout")
                            .foregroundColor(.red)
                    }
                    
                    if !apiResponse.isEmpty {
                        Text("Response:")
                            .font(.headline)
                            .padding(.top)
                        Text(apiResponse)
                            .font(.system(.body, design: .monospaced))
                            .padding()
                            .background(Color.black.opacity(0.05))
                            .cornerRadius(8)
                    }
                }
                .padding(.horizontal)
            }
            Spacer()
        }
        .padding()
        .onAppear {
            // Check if user is already authenticated
            if (try? keychain.get("kavach_access_token")) != nil {
                isAuthenticated = true
            }
        }
    }
    
    private func performLogin() {
        guard !email.isEmpty, !password.isEmpty else { return }
        isLoading = true
        
        let url = URL(string: "http://localhost:3000/auth/login")!
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.setValue("123e4567-e89b-12d3-a456-426614174000", forHTTPHeaderField: "x-tenant-id")
        
        // 2. iOS DPoP proof generation using Apple's SecKey APIs
        // In a real application, the Swift SDK generates an EC private key inside the iOS Secure Enclave,
        // and signs request method and URL parameters, outputting the custom 'dpop' header proof.
        let mockDPoPProof = "eyJhbGciOiJFUzI1NiIsInR5cCI6ImRwb3Arand0IiwiandrIjp7Imt0eSI6IkVDIiwiY3J2IjoiUC0yNTYifX0.mock-dpop-payload-signature"
        request.setValue(mockDPoPProof, forHTTPHeaderField: "dpop")
        
        let parameters = ["identifier": email, "password": password, "fingerprint": "ios-keychain-device"]
        request.httpBody = try? JSONSerialization.data(withJSONObject: parameters)
        
        URLSession.shared.dataTask(with: request) { data, response, error in
            DispatchQueue.main.async {
                isLoading = false
                guard let data = data, let httpResponse = response as? HTTPURLResponse, httpResponse.statusCode == 201 else {
                    print("Error during iOS network call")
                    return
                }
                
                if let json = try? JSONSerialization.jsonObject(with: data) as? [String: Any],
                   let accessToken = json["accessToken"] as? String,
                   let refreshToken = json["refreshToken"] as? String {
                    
                    // Save in Keychain
                    try? keychain.set(accessToken, key: "kavach_access_token")
                    try? keychain.set(refreshToken, key: "kavach_refresh_token")
                    
                    isAuthenticated = true
                }
            }
        }.resume()
    }
    
    private func makeAuthenticatedCall() {
        guard let token = try? keychain.get("kavach_access_token") else { return }
        
        let url = URL(string: "http://localhost:3001/resource/sensitive-data")!
        var request = URLRequest(url: url)
        request.httpMethod = "GET"
        request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        request.setValue("123e4567-e89b-12d3-a456-426614174000", forHTTPHeaderField: "x-tenant-id")
        
        let mockDPoPProof = "eyJhbGciOiJFUzI1NiIsInR5cCI6ImRwb3Arand0IiwiandrIjp7Imt0eSI6IkVDIiwiY3J2IjoiUC0yNTYifX0.mock-dpop-payload-signature"
        request.setValue(mockDPoPProof, forHTTPHeaderField: "dpop")
        
        URLSession.shared.dataTask(with: request) { data, response, error in
            DispatchQueue.main.async {
                if let data = data, let str = String(data: data, encoding: .utf8) {
                    apiResponse = str
                } else {
                    apiResponse = "Request failed"
                }
            }
        }.resume()
    }
    
    private func performLogout() {
        try? keychain.remove("kavach_access_token")
        try? keychain.remove("kavach_refresh_token")
        isAuthenticated = false
        apiResponse = ""
    }
}
