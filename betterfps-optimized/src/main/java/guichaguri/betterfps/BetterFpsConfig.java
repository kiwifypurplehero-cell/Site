package guichaguri.betterfps;

import com.google.gson.annotations.SerializedName;

public class BetterFpsConfig {
    // Default to ULTRA_FAST for maximum performance on weak devices
    public BetterFpsConfig.AlgorithmType algorithm = BetterFpsConfig.AlgorithmType.ULTRA_FAST;
    public boolean updateChecker = true;
    public boolean preallocateMemory = true;  // Enabled by default for weak devices
    public boolean fog = true;
    public boolean fogDisabled = false;  // New: completely disable fog
    public boolean fogFast = false;      // New: simplified fog
    public boolean beaconBeam = true;
    public boolean fastHopper = true;
    public boolean fastBeacon = true;
    public boolean fastSearch = true;
    public boolean asyncSearch = true;

    // Memory optimization settings
    public int memoryReserveMB = 64;     // MB to pre-allocate
    public boolean aggressiveGC = false; // Call System.gc() periodically

    // Hopper update interval (ticks) - higher = less CPU
    public int hopperUpdateInterval = 40; // Default 2 seconds

    // Beacon update interval
    public int beaconUpdateInterval = 2;  // Every 2 ticks

    public static enum AlgorithmType {
        @SerializedName("vanilla")
        VANILLA,
        @SerializedName("java")
        JAVA,
        @SerializedName("libgdx")
        LIBGDX,
        @SerializedName("random")
        RANDOM,
        @SerializedName("rivens-full")
        RIVENS_FULL,
        @SerializedName("rivens-half")
        RIVENS_HALF,
        @SerializedName("rivens")
        RIVENS,
        @SerializedName("taylors")
        TAYLORS,
        @SerializedName("ultra-fast")
        ULTRA_FAST;  // NEW: Best for extremely weak devices
    }
}