# ProGuard rules for MinimalBrowser
# Keep WebView JavaScript interfaces
-keepclassmembers class * {
    @android.webkit.JavascriptInterface <methods>;
}

# Keep WebViewClient and WebChromeClient
-keep class * extends android.webkit.WebViewClient
-keep class * extends android.webkit.WebChromeClient

# Keep our MainActivity
-keep class com.example.minimalbrowser.MainActivity { *; }

# Remove logging in release
-assumenosideeffects class android.util.Log {
    public static *** d(...);
    public static *** v(...);
    public static *** i(...);
}