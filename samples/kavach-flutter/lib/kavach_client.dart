import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

/// Configuration options for the KavachID Flutter Client
class KavachClientOptions {
  final String serverUrl;
  final String tenantId;

  KavachClientOptions({
    this.serverUrl = 'http://localhost:3000',
    this.tenantId = '123e4567-e89b-12d3-a456-426614174000',
  });
}

/// The main KavachID Client for Flutter
/// Handles authentication, DPoP key generation, and secure hardware storage.
class KavachClient {
  final KavachClientOptions options;
  final FlutterSecureStorage _storage;
  
  // ignore: unused_field
  final http.Client _httpClient;

  KavachClient({
    required this.options,
    http.Client? httpClient,
  })  : _storage = const FlutterSecureStorage(),
        _httpClient = httpClient ?? http.Client();

  /// Log in a user.
  /// 
  /// NOTE: This is a skeleton implementation. In a full implementation, 
  /// this method would:
  /// 1. Check for an existing RSA Keypair in flutter_secure_storage.
  /// 2. Generate a new DPoP Keypair if none exists using the cryptography library.
  /// 3. Sign a DPoP Proof JWT.
  /// 4. Submit the login request to the backend.
  /// 5. Store the resulting Access Token and Refresh Token in Secure Storage.
  Future<Map<String, dynamic>> login(String identifier, String password) async {
    // Skeleton implementation
    final url = Uri.parse('${options.serverUrl}/auth/login');
    
    // Simulate DPoP Header Generation
    final dpopHeader = 'eyJhbGciOiJSUzI1NiIs...'; 

    final response = await _httpClient.post(
      url,
      headers: {
        'Content-Type': 'application/json',
        'x-tenant-id': options.tenantId,
        'dpop': dpopHeader,
      },
      body: jsonEncode({
        'identifier': identifier,
        'password': password,
      }),
    );

    if (response.statusCode >= 200 && response.statusCode < 300) {
      final data = jsonDecode(response.body);
      await _storage.write(key: 'kavach_access_token', value: data['accessToken']);
      await _storage.write(key: 'kavach_refresh_token', value: data['refreshToken']);
      return data;
    } else {
      throw Exception('Login failed: ${response.body}');
    }
  }

  /// Perform an authenticated HTTP request.
  /// 
  /// In a full implementation, this will:
  /// 1. Read the access token.
  /// 2. Generate an ephemeral DPoP header for the specific URL and Method.
  /// 3. Send the request.
  /// 4. Automatically catch 401 Unauthorized responses and seamlessly execute
  ///    a Refresh Token Rotation request, then retry the original request.
  Future<http.Response> authenticatedFetch(String path, {String method = 'GET', Map<String, String>? headers, Object? body}) async {
    final token = await _storage.read(key: 'kavach_access_token');
    if (token == null) throw Exception('No access token found');

    final url = Uri.parse('${options.serverUrl}$path');
    final reqHeaders = {
      ...?headers,
      'Authorization': 'DPoP $token',
      'x-tenant-id': options.tenantId,
      'dpop': 'signed-proof-of-possession-jwt', // Stub
    };

    if (method == 'GET') {
      return _httpClient.get(url, headers: reqHeaders);
    } else if (method == 'POST') {
      return _httpClient.post(url, headers: reqHeaders, body: body);
    }
    
    throw UnimplementedError('Method $method not implemented in skeleton');
  }

  /// Log out and revoke the session
  Future<void> logout() async {
    await _storage.delete(key: 'kavach_access_token');
    await _storage.delete(key: 'kavach_refresh_token');
    // Call backend /auth/logout endpoint
  }
}
