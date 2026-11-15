package guichaguri.betterfps.gui.data;

import com.mojang.realmsclient.gui.ChatFormatting;
import guichaguri.betterfps.BetterFpsConfig;
import guichaguri.betterfps.BetterFpsHelper;
import guichaguri.betterfps.gui.GuiConfigOption;
import guichaguri.betterfps.transformers.Conditions;
import guichaguri.betterfps.tweaker.Mappings;
import java.util.List;

public class OptionManager {
    public static void addButtons(List<GuiConfigOption> buttons) {
        BetterFpsConfig config = BetterFpsHelper.getConfig();
        Boolean[] boolMap = new Boolean[]{true, false};
        String[] enabledNames = new String[]{cey.a("betterfps.options.on", new Object[0]), cey.a("betterfps.options.off", new Object[0])};
        String[] fancyFast = new String[]{cey.a("betterfps.options.fancy", new Object[0]), cey.a("betterfps.options.fast", new Object[0])};
        String[] fogModes = new String[]{cey.a("betterfps.options.fog.normal", new Object[0]), cey.a("betterfps.options.fog.fast", new Object[0]), cey.a("betterfps.options.fog.off", new Object[0])};

        // Algorithm selector - ULTRA_FAST first for weak devices
        GuiConfigOption<BetterFpsConfig.AlgorithmType> algorithm = new GuiConfigOption<>(0, "betterfps.options.algorithm.title");
        algorithm.add(BetterFpsConfig.AlgorithmType.ULTRA_FAST, "betterfps.options.algorithm.ultra-fast");
        algorithm.add(BetterFpsConfig.AlgorithmType.RIVENS_HALF, "betterfps.options.algorithm.rivens-half");
        algorithm.add(BetterFpsConfig.AlgorithmType.RIVENS_FULL, "betterfps.options.algorithm.rivens-full");
        algorithm.add(BetterFpsConfig.AlgorithmType.RIVENS, "betterfps.options.algorithm.rivens");
        algorithm.add(BetterFpsConfig.AlgorithmType.TAYLORS, "betterfps.options.algorithm.taylors");
        algorithm.add(BetterFpsConfig.AlgorithmType.JAVA, "betterfps.options.algorithm.java");
        algorithm.add(BetterFpsConfig.AlgorithmType.LIBGDX, "betterfps.options.algorithm.libgdx");
        algorithm.add(BetterFpsConfig.AlgorithmType.RANDOM, "betterfps.options.algorithm.random");
        algorithm.add(BetterFpsConfig.AlgorithmType.VANILLA, "betterfps.options.algorithm.vanilla");
        algorithm.setRestart(Conditions.isPatched(Mappings.C_MathHelper));
        algorithm.setWide(true);
        algorithm.setDefaults(BetterFpsConfig.AlgorithmType.ULTRA_FAST, BetterFpsConfig.AlgorithmType.ULTRA_FAST, config.algorithm);
        algorithm.setDescription(
            cey.a("betterfps.options.algorithm.desc", new Object[0]), ChatFormatting.YELLOW + cey.a("betterfps.options.algorithm.action", new Object[0])
        );
        algorithm.setShiftClick(new AlgorithmAction(algorithm));
        buttons.add(algorithm);

        // Update checker
        GuiConfigOption<Boolean> updateChecker = new GuiConfigOption<>(1, "betterfps.options.updatechecker.title");
        updateChecker.set(boolMap, enabledNames);
        updateChecker.setDefaults(true, true, config.updateChecker);
        updateChecker.setDescription(
            cey.a("betterfps.options.updatechecker.desc", new Object[0]), ChatFormatting.YELLOW + cey.a("betterfps.options.updatechecker.action", new Object[0])
        );
        updateChecker.setShiftClick(new UpdateCheckAction());
        buttons.add(updateChecker);

        // Preallocate memory
        GuiConfigOption<Boolean> allocMemory = new GuiConfigOption<>(2, "betterfps.options.allocmemory.title");
        allocMemory.set(boolMap, enabledNames);
        allocMemory.setRestart(Conditions.isPatched(Mappings.C_Minecraft));
        allocMemory.setDefaults(true, true, config.preallocateMemory); // Enabled by default now
        allocMemory.setDescription(cey.a("betterfps.options.allocmemory.desc", new Object[0]));
        buttons.add(allocMemory);

        // Fog mode: Normal / Fast / Off
        GuiConfigOption<Integer> fog = new GuiConfigOption<>(3, "betterfps.options.fog.title");
        fog.set(new Integer[]{0, 1, 2}, fogModes);
        fog.setRestart(Conditions.isPatched(Mappings.C_EntityRenderer));
        int fogMode = config.fogDisabled ? 2 : (config.fogFast ? 1 : 0);
        fog.setDefaults(0, 0, fogMode);
        fog.setDescription(cey.a("betterfps.options.fog.desc", new Object[0]));
        buttons.add(fog);

        // Beacon beam
        GuiConfigOption<Boolean> beam = new GuiConfigOption<>(4, "betterfps.options.beaconbeam.title");
        beam.set(boolMap, fancyFast);
        beam.setRestart(Conditions.isPatched(Mappings.C_TileEntityBeaconRenderer));
        beam.setDefaults(true, true, config.beaconBeam);
        beam.setDescription(cey.a("betterfps.options.beaconbeam.desc", new Object[0]));
        buttons.add(beam);

        // Fast Hopper
        GuiConfigOption<Boolean> hopper = new GuiConfigOption<>(5, "betterfps.options.hopper.title");
        hopper.set(boolMap, enabledNames);
        hopper.setRestart(Conditions.isPatched(Mappings.C_TileEntityHopper));
        hopper.setDefaults(false, true, config.fastHopper);
        hopper.setDescription(cey.a("betterfps.options.hopper.desc", new Object[0]));
        hopper.setRestart(true);
        buttons.add(hopper);

        // Fast Beacon
        GuiConfigOption<Boolean> beacon = new GuiConfigOption<>(6, "betterfps.options.beacon.title");
        beacon.set(boolMap, enabledNames);
        beacon.setRestart(Conditions.isPatched(Mappings.C_TileEntityBeacon));
        beacon.setDefaults(false, true, config.fastBeacon);
        beacon.setDescription(cey.a("betterfps.options.beacon.desc", new Object[0]));
        buttons.add(beacon);

        // Fast Creative Search
        GuiConfigOption<Boolean> search = new GuiConfigOption<>(7, "betterfps.options.search.title");
        search.set(boolMap, enabledNames);
        search.setRestart(Conditions.isPatched(Mappings.C_GuiContainerCreative));
        search.setDefaults(false, true, config.fastSearch);
        search.setDescription(cey.a("betterfps.options.search.desc", new Object[0]));
        buttons.add(search);

        // Async Search
        GuiConfigOption<Boolean> asyncSearch = new GuiConfigOption<>(8, "betterfps.options.asyncsearch.title");
        asyncSearch.set(boolMap, enabledNames);
        asyncSearch.setDefaults(false, true, config.asyncSearch);
        asyncSearch.setDescription(cey.a("betterfps.options.asyncsearch.desc", new Object[0]));
        buttons.add(asyncSearch);

        // Memory Reserve (MB) - slider
        GuiConfigOption<Integer> memReserve = new GuiConfigOption<>(9, "betterfps.options.memoryreserve.title");
        memReserve.set(new Integer[]{0, 32, 64, 128, 256, 512},
            new String[]{"Off", "32 MB", "64 MB", "128 MB", "256 MB", "512 MB"});
        memReserve.setRestart(Conditions.isPatched(Mappings.C_Minecraft));
        memReserve.setDefaults(64, 64, config.memoryReserveMB);
        memReserve.setDescription(cey.a("betterfps.options.memoryreserve.desc", new Object[0]));
        buttons.add(memReserve);

        // Aggressive GC
        GuiConfigOption<Boolean> aggressiveGc = new GuiConfigOption<>(10, "betterfps.options.aggressivegc.title");
        aggressiveGc.set(boolMap, enabledNames);
        aggressiveGc.setDefaults(false, false, config.aggressiveGC);
        aggressiveGc.setDescription(cey.a("betterfps.options.aggressivegc.desc", new Object[0]));
        buttons.add(aggressiveGc);

        // Hopper Update Interval
        GuiConfigOption<Integer> hopperInterval = new GuiConfigOption<>(11, "betterfps.options.hopperinterval.title");
        hopperInterval.set(new Integer[]{10, 20, 40, 60, 80, 100},
            new String[]{"0.5s", "1s", "2s", "3s", "4s", "5s"});
        hopperInterval.setRestart(true);
        hopperInterval.setDefaults(40, 40, config.hopperUpdateInterval);
        hopperInterval.setDescription(cey.a("betterfps.options.hopperinterval.desc", new Object[0]));
        buttons.add(hopperInterval);

        // Beacon Update Interval
        GuiConfigOption<Integer> beaconInterval = new GuiConfigOption<>(12, "betterfps.options.beaconinterval.title");
        beaconInterval.set(new Integer[]{1, 2, 4, 8},
            new String[]{"Every tick", "Every 2 ticks", "Every 4 ticks", "Every 8 ticks"});
        beaconInterval.setRestart(true);
        beaconInterval.setDefaults(2, 2, config.beaconUpdateInterval);
        beaconInterval.setDescription(cey.a("betterfps.options.beaconinterval.desc", new Object[0]));
        buttons.add(beaconInterval);
    }

    public static boolean store(List<GuiConfigOption> buttons) {
        BetterFpsConfig config = BetterFpsHelper.getConfig();
        boolean restart = false;

        config.algorithm = getButtonValue(buttons, 0, BetterFpsConfig.AlgorithmType.ULTRA_FAST);
        config.updateChecker = getButtonValue(buttons, 1);
        config.preallocateMemory = getButtonValue(buttons, 2);

        // Fog mode: 0=normal, 1=fast, 2=off
        int fogMode = getButtonValue(buttons, 3, 0);
        config.fogDisabled = (fogMode == 2);
        config.fogFast = (fogMode == 1);
        config.fog = (fogMode != 2); // fog enabled unless disabled

        config.beaconBeam = getButtonValue(buttons, 4);
        config.fastHopper = getButtonValue(buttons, 5);
        config.fastBeacon = getButtonValue(buttons, 6);
        config.fastSearch = getButtonValue(buttons, 7);
        config.asyncSearch = getButtonValue(buttons, 8);
        config.memoryReserveMB = getButtonValue(buttons, 9, 64);
        config.aggressiveGC = getButtonValue(buttons, 10);
        config.hopperUpdateInterval = getButtonValue(buttons, 11, 40);
        config.beaconUpdateInterval = getButtonValue(buttons, 12, 2);

        for (GuiConfigOption button : buttons) {
            if (button.shouldRestart()) {
                return true;
            }
        }

        return restart;
    }

    private static boolean getButtonValue(List<GuiConfigOption> buttons, int id) {
        return getButtonValue(buttons, id, true);
    }

    private static <T> T getButtonValue(List<GuiConfigOption> buttons, int id, T def) {
        for (GuiConfigOption button : buttons) {
            if (button.k == id) {
                return (T)button.getValue();
            }
        }

        return def;
    }
}