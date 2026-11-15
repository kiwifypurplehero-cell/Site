package guichaguri.betterfps.transformers;

import guichaguri.betterfps.BetterFpsConfig;
import guichaguri.betterfps.BetterFpsHelper;
import guichaguri.betterfps.transformers.annotations.Condition;
import guichaguri.betterfps.tweaker.Mappings;
import java.util.ArrayList;
import java.util.List;
import org.objectweb.asm.tree.AnnotationNode;

public class Conditions {
    protected static final List<Mappings> patched = new ArrayList<>();
    public static final String FAST_HOPPER = "fastHopper";
    public static final String FAST_BEACON = "fastBeacon";
    public static final String FAST_SEARCH = "fastSearch";
    public static final String FAST_BEAM_RENDER = "fastBeaconBeamRender";
    public static final String FOG_DISABLED = "fogDisabled";
    public static final String FOG_FAST = "fogFast";

    public static boolean shouldPatch(String condition) {
        BetterFpsConfig config = BetterFpsHelper.getConfig();
        if (condition.equals("fastHopper")) {
            return config.fastHopper;
        } else if (condition.equals("fastBeacon")) {
            return config.fastBeacon;
        } else if (condition.equals("fastSearch")) {
            return config.fastSearch;
        } else if (condition.equals("fastBeaconBeamRender")) {
            return !config.beaconBeam;
        } else if (condition.equals("fogDisabled")) {
            return config.fogDisabled;
        } else if (condition.equals("fogFast")) {
            return config.fogFast;
        } else {
            // Legacy: if just "fog" is specified, patch when fog is NOT disabled
            return condition.equals("fog") ? !config.fogDisabled : true;
        }
    }

    public static boolean shouldPatch(List<AnnotationNode> annotations) {
        AnnotationNode condition = ASMUtils.getAnnotation(annotations, Condition.class);
        if (condition == null) {
            return true;
        } else {
            String id = ASMUtils.getAnnotationValue(condition, "value", String.class);
            return id == null || shouldPatch(id);
        }
    }

    public static boolean isPatched(Mappings name) {
        return patched.contains(name);
    }
}