package com.example.minimalbrowser

import android.annotation.SuppressLint
import android.content.Intent
import android.net.Uri
import android.os.Bundle
import android.text.TextUtils
import android.view.KeyEvent
import android.view.View
import android.view.inputmethod.EditorInfo
import android.webkit.CookieManager
import android.webkit.WebResourceRequest
import android.webkit.WebSettings
import android.webkit.WebView
import android.webkit.WebViewClient
import android.widget.EditText
import android.widget.ImageButton
import android.widget.TextView
import androidx.appcompat.app.AppCompatActivity

class MainActivity : AppCompatActivity() {

    private lateinit var webView: WebView
    private lateinit var urlEditText: EditText
    private lateinit var backButton: ImageButton
    private lateinit var goButton: ImageButton
    private lateinit var brandText: TextView

    companion object {
        const val DEFAULT_URL = "https://www.google.com"
    }

    @SuppressLint("SetJavaScriptEnabled")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)

        webView = findViewById(R.id.webView)
        urlEditText = findViewById(R.id.etUrl)
        backButton = findViewById(R.id.btnBack)
        goButton = findViewById(R.id.btnGo)
        brandText = findViewById(R.id.tvBrand)

        setupWebView()
        setupListeners()

        // Handle external intent (links from other apps)
        handleIntent(intent)

        // If no intent data, load default Google
        if (intent.data == null && intent.action != Intent.ACTION_VIEW) {
            webView.loadUrl(DEFAULT_URL)
        }
    }

    private fun setupWebView() {
        val settings: WebSettings = webView.settings
        settings.javaScriptEnabled = true
        settings.domStorageEnabled = true
        settings.databaseEnabled = true
        settings.cacheMode = WebSettings.LOAD_DEFAULT
        settings.loadsImagesAutomatically = true
        settings.mixedContentMode = android.webkit.WebSettings.MIXED_CONTENT_NEVER_ALLOW
        settings.useWideViewPort = true
        settings.loadWithOverviewMode = true
        settings.setSupportZoom(true)
        settings.builtInZoomControls = true
        settings.displayZoomControls = false
        settings.allowFileAccess = false
        settings.allowContentAccess = false
        settings.saveFormData = false
        settings.savePassword = false

        // Cache limit via reflection (deprecated in API 29+)
        try {
            val method = WebSettings::class.java.getMethod("setAppCacheMaxSize", Long::class.java)
            method.invoke(settings, 10 * 1024 * 1024) // 10 MB
        } catch (e: Exception) {
            // Ignore
        }

        webView.webViewClient = object : WebViewClient() {
            override fun shouldOverrideUrlLoading(view: WebView, request: WebResourceRequest): Boolean {
                val url = request.url.toString()
                if (url.startsWith("http://") || url.startsWith("https://")) {
                    view.loadUrl(url)
                    return true
                }
                // Handle other schemes (mailto, tel, etc.)
                try {
                    val intent = Intent(Intent.ACTION_VIEW, Uri.parse(url))
                    startActivity(intent)
                } catch (e: Exception) {
                    // Ignore unsupported schemes
                }
                return true
            }

            override fun onPageStarted(view: WebView, url: String, favicon: android.graphics.Bitmap?) {
                super.onPageStarted(view, url, favicon)
                updateUrlBar(url)
                updateBackButton()
            }

            override fun onPageFinished(view: WebView, url: String) {
                super.onPageFinished(view, url)
                updateUrlBar(url)
                updateBackButton()
            }

            override fun onReceivedError(view: WebView, request: WebResourceRequest, error: android.webkit.WebResourceError) {
                super.onReceivedError(view, request, error)
                // Could show custom error page here
            }
        }
    }

    private fun setupListeners() {
        // Back button (floating)
        backButton.setOnClickListener {
            if (webView.canGoBack()) {
                webView.goBack()
            }
        }

        // Go button in bottom bar
        goButton.setOnClickListener {
            loadUrlFromInput()
        }

        // URL Enter key
        urlEditText.setOnEditorActionListener { _, actionId, _ ->
            if (actionId == EditorInfo.IME_ACTION_GO) {
                loadUrlFromInput()
                true
            } else {
                false
            }
        }

        // Clear URL bar on focus to allow easy typing
        urlEditText.setOnFocusChangeListener { _, hasFocus ->
            if (hasFocus) {
                urlEditText.selectAll()
            }
        }
    }

    private fun loadUrlFromInput() {
        var url = urlEditText.text.toString().trim()
        if (TextUtils.isEmpty(url)) return

        // Hide keyboard
        urlEditText.clearFocus()

        // Add scheme if missing
        if (!url.startsWith("http://") && !url.startsWith("https://")) {
            // Check if it looks like a URL with a dot (domain) or treat as search
            if (url.contains(".") && !url.contains(" ")) {
                url = "https://$url"
            } else {
                // Treat as search query
                url = "https://www.google.com/search?q=${Uri.encode(url)}"
            }
        }
        webView.loadUrl(url)
    }

    private fun updateUrlBar(url: String) {
        // Don't update if user is typing
        if (!urlEditText.hasFocus()) {
            urlEditText.setText(url)
            urlEditText.setSelection(url.length)
        }
        updateBackButton()
    }

    private fun updateBackButton() {
        backButton.visibility = if (webView.canGoBack()) View.VISIBLE else View.GONE
    }

    private fun handleIntent(intent: Intent?) {
        val action = intent?.action
        val data = intent?.data
        if (Intent.ACTION_VIEW == action && data != null) {
            val url = data.toString()
            // Only allow http/https schemes from external intents for security
            if (url.startsWith("http://") || url.startsWith("https://")) {
                webView.loadUrl(url)
            } else {
                webView.loadUrl(DEFAULT_URL)
            }
        }
    }

    override fun onNewIntent(intent: Intent) {
        super.onNewIntent(intent)
        handleIntent(intent)
    }

    override fun onBackPressed() {
        if (webView.canGoBack()) {
            webView.goBack()
        } else {
            super.onBackPressed()
        }
    }

    override fun onKeyDown(keyCode: Int, event: KeyEvent?): Boolean {
        if (keyCode == KeyEvent.KEYCODE_BACK && webView.canGoBack()) {
            webView.goBack()
            return true
        }
        return super.onKeyDown(keyCode, event)
    }

    override fun onPause() {
        super.onPause()
        webView.onPause()
        webView.pauseTimers()
    }

    override fun onResume() {
        super.onResume()
        webView.onResume()
        webView.resumeTimers()
    }

    override fun onDestroy() {
        webView.loadUrl("about:blank")
        webView.destroy()
        super.onDestroy()
    }
}