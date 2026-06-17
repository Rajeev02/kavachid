package com.kavachid.android.demo

import android.os.Bundle
import android.widget.Button
import android.widget.EditText
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import androidx.security.crypto.EncryptedSharedPreferences
import androidx.security.crypto.MasterKeys
import okhttp3.*
import java.io.IOException
import org.json.JSONObject

class MainActivity : AppCompatActivity() {

    private lateinit var client: OkHttpClient
    private var accessToken: String? = null
    private var refreshToken: String? = null

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)

        // 1. Initialize Android Encrypted SharedPreferences for secure storage
        val masterKeyAlias = MasterKeys.getOrCreate(MasterKeys.AES256_GCM_SPEC)
        val securePreferences = EncryptedSharedPreferences.create(
            "kavach_secure_prefs",
            masterKeyAlias,
            applicationContext,
            EncryptedSharedPreferences.PrefKeyEncryptionScheme.AES256_SIV,
            EncryptedSharedPreferences.PrefValueEncryptionScheme.AES256_GCM
        )

        // 2. Setup standard OkHttp Client equipped with a custom DPoP Signing Interceptor
        client = OkHttpClient.Builder()
            .addInterceptor(DpopRequestInterceptor(securePreferences))
            .build()

        val emailInput = findViewById<EditText>(R.id.email_input)
        val passwordInput = findViewById<EditText>(R.id.password_input)
        val loginButton = findViewById<Button>(R.id.login_button)
        val callApiButton = findViewById<Button>(R.id.call_api_button)

        loginButton.setOnClickListener {
            val email = emailInput.text.toString()
            val password = passwordInput.text.toString()
            
            if (email.isNotEmpty() && password.isNotEmpty()) {
                performLogin(email, password, securePreferences)
            }
        }

        callApiButton.setOnClickListener {
            makeAuthenticatedRequest()
        }
    }

    private fun performLogin(email: String, password: String, prefs: android.content.SharedPreferences) {
        val formBody = FormBody.Builder()
            .add("identifier", email)
            .add("password", password)
            .add("fingerprint", "android-device-fingerprint")
            .build()

        val request = Request.Builder()
            .url("http://10.0.2.2:3000/auth/login") // 10.0.2.2 points to local localhost in Android Emulators
            .header("x-tenant-id", "123e4567-e89b-12d3-a456-426614174000")
            .post(formBody)
            .build()

        client.newCall(request).enqueue(object : Callback {
            override fun onFailure(call: Call, e: IOException) {
                runOnUiThread { Toast.makeText(this@MainActivity, "Network error: ${e.message}", Toast.LENGTH_LONG).show() }
            }

            override fun onResponse(call: Call, response: Response) {
                val body = response.body?.string() ?: ""
                if (response.isSuccessful) {
                    val json = JSONObject(body)
                    accessToken = json.getString("accessToken")
                    refreshToken = json.getString("refreshToken")

                    // Save tokens in secure preferences
                    prefs.edit().apply {
                        putString("kavach_access_token", accessToken)
                        putString("kavach_refresh_token", refreshToken)
                        apply()
                    }

                    runOnUiThread { Toast.makeText(this@MainActivity, "Logged in successfully!", Toast.LENGTH_SHORT).show() }
                } else {
                    runOnUiThread { Toast.makeText(this@MainActivity, "Login failed: $body", Toast.LENGTH_LONG).show() }
                }
            }
        })
    }

    private fun makeAuthenticatedRequest() {
        if (accessToken == null) {
            Toast.makeText(this, "Please log in first", Toast.LENGTH_SHORT).show()
            return
        }

        val request = Request.Builder()
            .url("http://10.0.2.2:3001/resource/sensitive-data")
            .header("Authorization", "Bearer $accessToken")
            .header("x-tenant-id", "123e4567-e89b-12d3-a456-426614174000")
            .build()

        client.newCall(request).enqueue(object : Callback {
            override fun onFailure(call: Call, e: IOException) {
                runOnUiThread { Toast.makeText(this@MainActivity, "Request failed", Toast.LENGTH_SHORT).show() }
            }

            override fun onResponse(call: Call, response: Response) {
                val responseData = response.body?.string() ?: ""
                runOnUiThread {
                    Toast.makeText(this@MainActivity, "API Response: $responseData", Toast.LENGTH_LONG).show()
                }
            }
        })
    }
}

/**
 * MOCK DPoP Interceptor representing Android SDK interceptor
 */
class DpopRequestInterceptor(private val prefs: android.content.SharedPreferences) : Interceptor {
    override fun intercept(chain: Interceptor.Chain): Response {
        var request = chain.request()
        
        // In a real application, the Android SDK dynamically signs the method and URL 
        // using an EC key pair stored in the Android Keystore / StrongBox and adds a "dpop" header.
        val method = request.method
        val url = request.url.toString()
        
        // Example mock DPoP proof generation header representation
        val mockDPoPProof = "eyJhbGciOiJFUzI1NiIsInR5cCI6ImRwb3Arand0IiwiandrIjp7Imt0eSI6IkVDIiwiY3J2IjoiUC0yNTYifX0.mock-dpop-payload-signature"
        
        request = request.newBuilder()
            .header("dpop", mockDPoPProof)
            .build()
            
        return chain.proceed(request)
    }
}
