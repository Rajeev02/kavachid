import com.vanniktech.maven.publish.SonatypeHost

plugins {
    id("com.android.library") version "8.7.3"
    id("org.jetbrains.kotlin.android") version "2.1.0"
    id("com.vanniktech.maven.publish") version "0.28.0"
}

group = "io.github.rajeev02"
version = "1.0.4"

android {
    namespace = "com.kavach.sdk"
    compileSdk = 35

    defaultConfig {
        minSdk = 24

        testInstrumentationRunner = "androidx.test.runner.AndroidJUnitRunner"
        consumerProguardFiles("consumer-rules.pro")
    }

    buildTypes {
        release {
            isMinifyEnabled = false
            proguardFiles(
                getDefaultProguardFile("proguard-android-optimize.txt"),
                "proguard-rules.pro"
            )
        }
    }
    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }
    kotlinOptions {
        jvmTarget = "17"
    }
}

dependencies {
    implementation("androidx.core:core-ktx:1.15.0")
    implementation("androidx.appcompat:appcompat:1.7.0")
    implementation("com.google.android.material:material:1.12.0")
    
    // Biometrics
    implementation("androidx.biometric:biometric:1.2.0-alpha05")
    
    // Security
    implementation("androidx.security:security-crypto:1.1.0-alpha06")
    
    // Coroutines
    implementation("org.jetbrains.kotlinx:kotlinx-coroutines-android:1.10.1")

    testImplementation("junit:junit:4.13.2")
    androidTestImplementation("androidx.test.ext:junit:1.2.1")
    androidTestImplementation("androidx.test.espresso:espresso-core:3.6.1")
}

mavenPublishing {
    publishToMavenCentral(SonatypeHost.CENTRAL_PORTAL)
    signAllPublications()
    coordinates("io.github.rajeev02.kavach", "kavach-sdk", "1.0.3")

    pom {
        name.set("Kavach Android SDK")
        description.set("The official Kavach Security SDK for Android.")
        inceptionYear.set("2026")
        url.set("https://github.com/Rajeev02/kavachid")
        licenses {
            license {
                name.set("The MIT License")
                url.set("https://opensource.org/licenses/MIT")
            }
        }
        developers {
            developer {
                id.set("rajeev02")
                name.set("Rajeev")
                url.set("https://rajeev02.github.io/")
            }
        }
        scm {
            url.set("https://github.com/Rajeev02/kavachid")
        }
    }
}
