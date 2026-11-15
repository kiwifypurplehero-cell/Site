package guichaguri.betterfps.patches.misc;

import guichaguri.betterfps.BetterFps;
import guichaguri.betterfps.UpdateChecker;
import guichaguri.betterfps.gui.BetterFpsResourcePack;
import guichaguri.betterfps.patchers.MemoryPatcher;
import guichaguri.betterfps.patchers.MinecraftPatcher;
import guichaguri.betterfps.transformers.annotations.Copy;
import guichaguri.betterfps.transformers.annotations.Patcher;
import java.io.IOException;
import org.lwjgl.LWJGLException;

@Patcher(MinecraftPatcher.class)
public abstract class MinecraftPatch extends bib {
    public MinecraftPatch(boz config) {
        super(config);
    }

    @Copy(Copy.Mode.PREPEND)
    public void aq() throws LWJGLException, IOException {
        BetterFps.CLIENT = true;
        this.aD.add(new BetterFpsResourcePack());
        UpdateChecker.check();

        // Pre-allocate memory early to reduce GC pauses during gameplay
        MemoryPatcher.allocateMemory();
    }

    // Call periodic GC if enabled
    @Copy(Copy.Mode.PREPEND)
    public void V() {
        MemoryPatcher.maybeGc();
        super.V();
    }
}