import Foundation
import CryptoKit
import Security
import KeychainAccess

/// Configuration options for the KavachID iOS Client
public struct KavachClientOptions {
    public let serverUrl: String
    public let tenantId: String
    
    public init(serverUrl: String = "http://localhost:3000", tenantId: String = "123e4567-e89b-12d3-a456-426614174000") {
        self.serverUrl = serverUrl
        self.tenantId = tenantId
    }
}

/// The main KavachID Client for Native iOS.
/// Handles authentication, DPoP Secure Enclave key generation, and Keychain persistence.
public class KavachClient {
    private let options: KavachClientOptions
    private let keychain = Keychain(service: "com.kavachid.sdk")
    private let urlSession: URLSession

    public init(options: KavachClientOptions = KavachClientOptions()) {
        self.options = options
        self.urlSession = URLSession(configuration: .default)
    }

    /// Log in a user.
    /// 
    /// NOTE: This is a skeleton implementation. In a full implementation, this method would:
    /// 1. Check for an existing RSA Keypair in the Secure Enclave via `SecKey`.
    /// 2. Generate a new DPoP Keypair if none exists using `SecKeyCreateRandomKey` with `kSecAttrTokenIDSecureEnclave`.
    /// 3. Sign a DPoP Proof JWT using the private key inside the Enclave.
    /// 4. Submit the login request to the backend.
    /// 5. Store the resulting Access Token and Refresh Token in the iOS Keychain.
    public func login(identifier: String, password: String, completion: @escaping (Result<String, Error>) -> Void) {
        guard let url = URL(string: "\(options.serverUrl)/auth/login") else {
            completion(.failure(NSError(domain: "Invalid URL", code: -1, userInfo: nil)))
            return
        }
        
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.setValue(options.tenantId, forHTTPHeaderField: "x-tenant-id")
        
        // Simulate DPoP Header
        request.setValue("eyJhbGciOiJSUzI1NiIs...", forHTTPHeaderField: "dpop")
        
        let body: [String: Any] = [
            "identifier": identifier,
            "password": password
        ]
        
        request.httpBody = try? JSONSerialization.data(withJSONObject: body)
        
        let task = urlSession.dataTask(with: request) { [weak self] data, response, error in
            if let error = error {
                completion(.failure(error))
                return
            }
            
            guard let data = data, let json = try? JSONSerialization.jsonObject(with: data) as? [String: Any] else {
                completion(.failure(NSError(domain: "Invalid Response", code: -1, userInfo: nil)))
                return
            }
            
            if let accessToken = json["accessToken"] as? String,
               let refreshToken = json["refreshToken"] as? String {
                // Store in Keychain securely
                try? self?.keychain.set(accessToken, key: "kavach_access_token")
                try? self?.keychain.set(refreshToken, key: "kavach_refresh_token")
                completion(.success(accessToken))
            } else {
                completion(.failure(NSError(domain: "Login Failed", code: -1, userInfo: json)))
            }
        }
        task.resume()
    }
    
    /// Perform an authenticated HTTP request.
    /// 
    /// In a full implementation, this will:
    /// 1. Read the access token from Keychain.
    /// 2. Generate an ephemeral DPoP header for the specific URL and Method using JWTKit + SecKey.
    /// 3. Automatically catch 401 Unauthorized responses and seamlessly execute
    ///    a Refresh Token Rotation request, then retry.
    public func authenticatedFetch(path: String, method: String = "GET", body: Data? = nil, completion: @escaping (Result<Data, Error>) -> Void) {
        guard let token = try? keychain.get("kavach_access_token") else {
            completion(.failure(NSError(domain: "No Access Token", code: 401, userInfo: nil)))
            return
        }
        
        guard let url = URL(string: "\(options.serverUrl)\(path)") else { return }
        var request = URLRequest(url: url)
        request.httpMethod = method
        request.setValue("DPoP \(token)", forHTTPHeaderField: "Authorization")
        request.setValue(options.tenantId, forHTTPHeaderField: "x-tenant-id")
        request.setValue("signed-proof-of-possession-jwt", forHTTPHeaderField: "dpop") // Stub
        request.httpBody = body
        
        let task = urlSession.dataTask(with: request) { data, response, error in
            // Handle 401 Silent Token Rotation logic here...
            if let error = error {
                completion(.failure(error))
                return
            }
            completion(.success(data ?? Data()))
        }
        task.resume()
    }
    
    /// Log out and revoke the session
    public func logout() {
        try? keychain.remove("kavach_access_token")
        try? keychain.remove("kavach_refresh_token")
        // Call backend /auth/logout endpoint
    }
}
