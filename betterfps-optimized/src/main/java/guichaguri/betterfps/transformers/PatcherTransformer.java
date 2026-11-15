package guichaguri.betterfps.transformers;

import guichaguri.betterfps.BetterFpsHelper;
import guichaguri.betterfps.tweaker.BetterFpsTweaker;
import guichaguri.betterfps.tweaker.Mappings;
import java.io.IOException;
import java.io.InputStream;
import java.util.HashMap;
import java.util.Map;
import net.minecraft.launchwrapper.IClassTransformer;
import org.apache.commons.io.IOUtils;
import org.objectweb.asm.tree.ClassNode;

public class PatcherTransformer implements IClassTransformer {
    private static final Map<Mappings, String> patches = new HashMap<>();

    public byte[] transform(String name, String transformedName, byte[] bytes) {
        if (bytes == null) {
            return null;
        } else {
            ClassNode patchClass = this.findPatch(name);
            if (patchClass == null) {
                return bytes;
            } else if (!Conditions.shouldPatch(patchClass.invisibleAnnotations)) {
                return bytes;
            } else {
                ClassNode classNode = ASMUtils.readClass(bytes, 0);
                Patch patch = new Patch(patchClass, classNode);
                BetterFpsHelper.LOG.info("Patching {}... ({})", transformedName, name);
                patch.copy();
                patch.patch();
                return ASMUtils.writeClass(classNode, 2);
            }
        }
    }

    private ClassNode findPatch(String name) {
        for (Mappings m : patches.keySet()) {
            if (m.is(name)) {
                Conditions.patched.add(m);
                return this.loadPatch(patches.get(m));
            }
        }

        return null;
    }

    private ClassNode loadPatch(String className) {
        String path = className + ".class";
        InputStream in = null;

        try {
            in = BetterFpsTweaker.getResourceStream(path);
            return ASMUtils.readClass(IOUtils.toByteArray(in), 0);
        } catch (IOException var8) {
            BetterFpsHelper.LOG.error("Couldn't load patch from {}", className);
        } finally {
            IOUtils.closeQuietly(in);
        }

        return null;
    }

    static {
        patches.put(Mappings.C_Block, "guichaguri/betterfps/patches/block/BlockPatch");
        patches.put(Mappings.C_TileEntityHopper, "guichaguri/betterfps/patches/block/FastHopper");
        patches.put(Mappings.C_BlockHopper, "guichaguri/betterfps/patches/block/FastHopperBlock");
        patches.put(Mappings.C_TileEntityBeacon, "guichaguri/betterfps/patches/block/FastBeacon");
        patches.put(Mappings.C_TileEntityBeaconRenderer, "guichaguri/betterfps/patches/block/FastBeaconRender");
        patches.put(Mappings.C_EntityRenderer, "guichaguri/betterfps/patches/misc/FogPatch");
        patches.put(Mappings.C_GuiOptions, "guichaguri/betterfps/patches/misc/OptionsButton");
        patches.put(Mappings.C_Minecraft, "guichaguri/betterfps/patches/misc/MinecraftPatch");
        patches.put(Mappings.C_DedicatedServer, "guichaguri/betterfps/patches/misc/ServerPatch");
        patches.put(Mappings.C_EntityPlayerSP, "guichaguri/betterfps/patches/misc/ClientPlayerPatch");
        patches.put(Mappings.C_GuiContainerCreative, "guichaguri/betterfps/patches/misc/FastCreativeSearch");
    }
}