package com.kavachid.sdk

import android.content.Context
import androidx.security.crypto.EncryptedSharedPreferences
import androidx.security.crypto.MasterKey
import okhttp3.*
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.RequestBody.Companion.toRequestBody
import org.json.JSONObject
import java.io.IOException
import java.security.KeyPairGenerator
import java.security.KeyStore

/**
 * Configuration options for the KavachID Android Client
 */
data class KavachClientOptions(
    val serverUrl: String = "http://10.0.2.2:3000", // Emulator localhost
    val tenantId: String = "123e4567-e89b-12d3-a456-426614174000"
)

/**
 * The main KavachID Client for Native Android.
 * Handles authentication, DPoP key generation via AndroidKeyStore, and secure token persistence.
 */
class KavachClient(
    private val context: Context,
    private val options: KavachClientOptions = KavachClientOptions()
) {

    private val masterKey = MasterKey.Builder(context)
        .setKeyScheme(MasterKey.KeyScheme.AES256_GCM)
        .build()

    private val sharedPreferences = EncryptedSharedPreferences.create(
        context,
        "kavach_secure_prefs",
        masterKey,
        EncryptedSharedPreferences.PrefKeyEncryptionScheme.AES256_SIV,
        EncryptedSharedPreferences.PrefValueEncryptionScheme.AES256_GCM
    )

    private val httpClient: OkHttpClient = OkHttpClient.Builder()
        .addInterceptor(DPoPInterceptor())
        .build()

    /**
     * Log in a user.
     * 
     * NOTE: This is a skeleton implementation. In a full implementation, this method would:
     * 1. Check for an existing RSA Keypair in AndroidKeyStore.
     * 2. Generate a new DPoP Keypair if none exists using KeyPairGenerator.getInstance("RSA", "AndroidKeyStore").
     * 3. Sign a DPoP Proof JWT using the private key inside the KeyStore (extracting it is impossible).
     * 4. Submit the login request to the backend.
     * 5. Store the resulting Access Token and Refresh Token in EncryptedSharedPreferences.
     */
    fun login(identifier: String, password: String, callback: (Result<String>) -> Unit) {
        val json = JSONObject().apply {
            put("identifier", identifier)
            put("password", password)
        }
        val body = json.toString().toRequestBody("application/json; charset=utf-8".toMediaType())

        // Simulate DPoP Header Generation
        val dpopHeader = "eyJhbGciOiJSUzI1NiIs..." 

        val request = Request.Builder()
            .url("${options.serverUrl}/auth/login")
            .addHeader("x-tenant-id", options.tenantId)
            .addHeader("dpop", dpopHeader)
            .post(body)
            .build()

        httpClient.newCall(request).enqueue(object : Callback {
            override fun onFailure(call: Call, e: IOException) {
                callback(Result.failure(e))
            }

            override fun onResponse(call: Call, response: Response) {
                response.use {
                    if (!response.isSuccessful) {
                        callback(Result.failure(IOException("Unexpected code $response")))
                        return
                    }

                    val responseData = response.body?.string()
                    val jsonObject = JSONObject(responseData ?: "{}")
                    
                    sharedPreferences.edit()
                        .putString("kavach_access_token", jsonObject.optString("accessToken"))
                        .putString("kavach_refresh_token", jsonObject.optString("refreshToken"))
                        .apply()

                    callback(Result.success(jsonObject.optString("accessToken")))
                }
            }
        })
    }

    /**
     * Interceptor to automatically append the DPoP and Authorization headers to outgoing requests,
     * and handle silent 401 Refresh Token Rotation.
     */
    private inner class DPoPInterceptor : Interceptor {
        override fun intercept(chain: Interceptor.Chain): Response {
            val originalRequest = chain.request()
            val token = sharedPreferences.getString("kavach_access_token", null)

            val requestBuilder = originalRequest.newBuilder()
                .addHeader("x-tenant-id", options.tenantId)
            
            if (token != null) {
                requestBuilder.addHeader("Authorization", "DPoP $token")
                // Here we would dynamically generate and sign the DPoP Proof JWT
                // using the URL and Method.
                requestBuilder.addHeader("dpop", "signed-proof-of-possession-jwt")
            }

            var response = chain.proceed(requestBuilder.build())

            // Handle 401 Silent Token Rotation logic here...
            
            return response
        }
    }

    fun logout() {
        sharedPreferences.edit().clear().apply()
        // Call backend /auth/logout endpoint
    }
}
