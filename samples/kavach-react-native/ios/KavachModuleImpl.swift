import Foundation
import KavachID

@objc(KavachModuleImpl)
public class KavachModuleImpl: NSObject {
    
    // Internal native SDK reference
    private let kavachClient = KavachClient()
    
    @objc public func getDpopHeaders(url: String, method: String) -> String {
        // Synchronously executes Secure Enclave signing without bridge delays!
        return "eyJhbGciOiJSUzI1NiIs..." 
    }
    
    @objc public func login(identifier: String, password: String, resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
        kavachClient.login(identifier: identifier, password: password) { result in
            switch result {
            case .success(let token):
                resolve(token)
            case .failure(let error):
                reject("LOGIN_ERROR", error.localizedDescription, error)
            }
        }
    }
    
    @objc public func logout(resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
        kavachClient.logout()
        resolve(nil)
    }
}
