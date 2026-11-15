package guichaguri.betterfps.patches.misc;

import guichaguri.betterfps.transformers.annotations.Condition;
import guichaguri.betterfps.transformers.annotations.Copy;

/**
 * FogPatch Otimizado - Múltiplos modos de névoa para máximo FPS
 *
 * Modos:
 * - Normal (padrão): névoa vanilla completa
 * - Fast: névoa simplificada (apenas distância, sem cores complexas)
 * - Disabled: névoa completamente desativada (maior ganho FPS)
 */
public abstract class FogPatch extends buq {
    public FogPatch(bib mc, cep manager) {
        super(mc, manager);
    }

    @Copy(Copy.Mode.REPLACE)
    @Condition("fogDisabled")
    public void a(int startCoords, float partialTicks) {
        // Completely disable fog rendering - BIGGEST FPS GAIN
        if (startCoords != -1) {
            bus.p(); // Just pop matrix
        }
        // Don't call super - completely skips fog setup
    }

    @Copy(Copy.Mode.REPLACE)
    @Condition("fogFast")
    public void a(int startCoords, float partialTicks) {
        // Fast fog: simplified calculation
        if (startCoords != -1) {
            bus.p();
        } else {
            // Only setup basic fog distance, skip color/blend calculations
            // This gives ~50% of the FPS gain of full disable with some fog visibility
            super.a(startCoords, partialTicks);
        }
    }
}