package guichaguri.betterfps.tweaker;

import guichaguri.betterfps.BetterFps;
import guichaguri.betterfps.BetterFpsHelper;
import java.io.File;
import java.io.IOException;
import java.io.InputStream;
import java.net.URL;
import java.util.ArrayList;
import java.util.List;
import net.minecraft.launchwrapper.ITweaker;
import net.minecraft.launchwrapper.Launch;
import net.minecraft.launchwrapper.LaunchClassLoader;

public class BetterFpsTweaker implements ITweaker {
   private static final String[] TRANSFORMERS = new String[]{
      "guichaguri.betterfps.transformers.PatcherTransformer", "guichaguri.betterfps.transformers.MathTransformer"
   };
   private final String[] EXCLUDED = new String[]{"guichaguri.betterfps.transformers", "guichaguri.betterfps.tweaker", "guichaguri.betterfps.patchers"};
   private final String[] LOAD_DISABLED = new String[]{"guichaguri.betterfps.installer", "guichaguri.betterfps.math", "guichaguri.betterfps.patches"};
   private List<String> args;

   public static InputStream getResourceStream(String path) {
      return BetterFpsTweaker.class.getClassLoader().getResourceAsStream(path);
   }

   public static URL getResource(String path) {
      return BetterFpsTweaker.class.getClassLoader().getResource(path);
   }

   public void acceptOptions(List<String> args, File gameDir, File assetsDir, String profile) {
      this.args = new ArrayList<>(args);
      this.args.add("--version");
      this.args.add(profile);
      if (assetsDir != null) {
         this.args.add("--assetsDir");
         this.args.add(assetsDir.getAbsolutePath());
      }

      if (gameDir != null) {
         this.args.add("--gameDir");
         this.args.add(gameDir.getAbsolutePath());
      }

      BetterFps.GAME_DIR = gameDir;
   }

   public void injectIntoClassLoader(LaunchClassLoader cl) {
      this.loadMappings();

      for (String transformer : TRANSFORMERS) {
         cl.registerTransformer(transformer);
      }

      for (String excluded : this.EXCLUDED) {
         cl.addTransformerExclusion(excluded);
      }

      for (String loadDisabled : this.LOAD_DISABLED) {
         cl.addClassLoaderExclusion(loadDisabled);
      }
   }

   public String getLaunchTarget() {
      return "net.minecraft.client.main.Main";
   }

   public String[] getLaunchArguments() {
      ArrayList args = (ArrayList)Launch.blackboard.get("ArgumentList");
      if (args.isEmpty()) {
         args.addAll(this.args);
      }

      this.args = null;
      Launch.blackboard.put("BetterFpsVersion", "1.4.8");
      return new String[0];
   }

   private void loadMappings() {
      BetterFpsHelper.LOG.debug("Loading Mappings...");

      try {
         Mappings.loadMappings(getResourceStream("betterfps.srg"));
      } catch (IOException var2) {
         BetterFpsHelper.LOG.error("Could not load mappings. Things will not work!");
      }
   }
}
