package guichaguri.betterfps.patchers;

import guichaguri.betterfps.BetterFpsHelper;
import guichaguri.betterfps.transformers.IClassPatcher;
import guichaguri.betterfps.transformers.Patch;

/**
 * MemoryPatcher - Pre-allocates memory on startup to reduce GC pauses during gameplay
 *
 * This is CRUCIAL for weak devices with limited RAM:
 * - Allocates a large byte[] array on startup (configurable, default 64MB)
 * - Forces JVM to commit memory pages early
 * - Reduces "stop-the-world" GC pauses during gameplay
 * - Can optionally call System.gc() periodically
 */
public class MemoryPatcher implements IClassPatcher {
    private static boolean memoryAllocated = false;
    private static byte[] memoryReserve = null;
    private static long lastGcTime = 0;
    private static final long GC_INTERVAL_MS = 30000; // 30 seconds

    @Override
    public void patch(Patch patch) {
        // This patcher doesn't modify bytecode - it's called at runtime
    }

    /**
     * Call this early in game startup (e.g., from MinecraftPatch.aq())
     */
    public static void allocateMemory() {
        if (memoryAllocated) return;

        BetterFpsConfig config = BetterFpsHelper.getConfig();
        if (!config.preallocateMemory) return;

        int mb = config.memoryReserveMB;
        if (mb <= 0) mb = 64;

        try {
            // Allocate in chunks to avoid OOM on very weak devices
            int chunkSize = 1024 * 1024; // 1MB chunks
            int chunks = mb;
            memoryReserve = new byte[chunks * chunkSize];

            // Touch every page to force OS to commit physical memory
            for (int i = 0; i < memoryReserve.length; i += 4096) {
                memoryReserve[i] = 1;
            }

            BetterFpsHelper.LOG.info("Pre-allocated {} MB of memory to reduce GC pauses", mb);
            memoryAllocated = true;
        } catch (OutOfMemoryError e) {
            BetterFpsHelper.LOG.warn("Failed to pre-allocate {} MB, trying smaller amount", mb);
            try {
                // Try half
                int fallbackMb = mb / 2;
                memoryReserve = new byte[fallbackMb * 1024 * 1024];
                for (int i = 0; i < memoryReserve.length; i += 4096) {
                    memoryReserve[i] = 1;
                }
                BetterFpsHelper.LOG.info("Pre-allocated {} MB (fallback)", fallbackMb);
                memoryAllocated = true;
            } catch (OutOfMemoryError e2) {
                BetterFpsHelper.LOG.error("Could not pre-allocate any memory", e2);
            }
        }
    }

    /**
     * Call periodically (e.g., from a tick handler) to suggest GC
     */
    public static void maybeGc() {
        BetterFpsConfig config = BetterFpsHelper.getConfig();
        if (!config.aggressiveGC) return;

        long now = System.currentTimeMillis();
        if (now - lastGcTime > GC_INTERVAL_MS) {
            lastGcTime = now;
            Runtime.getRuntime().gc();
            BetterFpsHelper.LOG.debug("Forced GC at tick {}", now);
        }
    }

    /**
     * Release reserved memory if needed (e.g., before loading large world)
     */
    public static void releaseMemory() {
        if (memoryReserve != null) {
            memoryReserve = null;
            memoryAllocated = false;
            System.gc();
            BetterFpsHelper.LOG.info("Released pre-allocated memory");
        }
    }

    /**
     * Get current memory stats for debug display
     */
    public static String getMemoryStats() {
        Runtime rt = Runtime.getRuntime();
        long max = rt.maxMemory() / 1024 / 1024;
        long total = rt.totalMemory() / 1024 / 1024;
        long free = rt.freeMemory() / 1024 / 1024;
        long used = total - free;
        long reserved = memoryReserve != null ? memoryReserve.length / 1024 / 1024 : 0;

        return String.format("Mem: %d/%d MB used (max: %d, reserved: %d)", used, total, max, reserved);
    }
}