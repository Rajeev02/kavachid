plugins { 
    id("com.android.library") 
    id("maven-publish")
}

group = "com.rajeev02.kavach"
version = "1.0.3"

publishing {
    publications {
        create<MavenPublication>("release") {
            afterEvaluate {
                from(components["release"])
            }
        }
    }
}
