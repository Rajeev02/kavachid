package com.kavach.sdk

import androidx.fragment.app.FragmentActivity

class KavachClient(private val baseUrl: String) {

    suspend fun loginWithBiometrics(
        activity: FragmentActivity,
        email: String,
        title: String,
        subtitle: String
    ): String {
        // Placeholder implementation
        return "session_token"
    }
}

class KavachAuthException(message: String) : Exception(message)
