package guichaguri.betterfps.gui.data;

import guichaguri.betterfps.BetterFpsConfig;
import guichaguri.betterfps.BetterFpsHelper;
import guichaguri.betterfps.gui.GuiConfigOption;
import guichaguri.betterfps.tweaker.BetterFpsTweaker;
import h.a;
import java.io.BufferedReader;
import java.io.File;
import java.io.IOException;
import java.io.InputStreamReader;
import java.util.ArrayList;
import java.util.List;

public class AlgorithmAction implements Runnable {
   private final GuiConfigOption<BetterFpsConfig.AlgorithmType> button;
   private Thread thread;
   private Process process;

   public AlgorithmAction(GuiConfigOption<BetterFpsConfig.AlgorithmType> button) {
      this.button = button;
   }

   private String getJavaDir() {
      String separator = System.getProperty("file.separator");
      String path = System.getProperty("java.home") + separator + "bin" + separator;
      return h.a() == a.c && new File(path + "javaw.exe").isFile() ? path + "javaw.exe" : path + "java";
   }

   private BetterFpsConfig.AlgorithmType parseAlgorithm(String algorithm) {
      if (algorithm == null) {
         return null;
      } else if (algorithm.equals("java")) {
         return BetterFpsConfig.AlgorithmType.JAVA;
      } else if (algorithm.equals("rivens")) {
         return BetterFpsConfig.AlgorithmType.RIVENS;
      } else if (algorithm.equals("rivens-full")) {
         return BetterFpsConfig.AlgorithmType.RIVENS_FULL;
      } else if (algorithm.equals("rivens-half")) {
         return BetterFpsConfig.AlgorithmType.RIVENS_HALF;
      } else if (algorithm.equals("libgdx")) {
         return BetterFpsConfig.AlgorithmType.LIBGDX;
      } else if (algorithm.equals("taylors")) {
         return BetterFpsConfig.AlgorithmType.TAYLORS;
      } else {
         return algorithm.equals("vanilla") ? BetterFpsConfig.AlgorithmType.VANILLA : null;
      }
   }

   @Override
   public void run() {
      if (this.process == null || this.thread == null || !this.thread.isAlive()) {
         BetterFpsHelper.LOG.info("Benchmarking algorithms...");
         this.button.setTitle(cey.a("betterfps.installer.algorithm.working", new Object[0]));
         List<String> args = new ArrayList<>();
         args.add(this.getJavaDir());
         args.add("-cp");
         args.add(BetterFpsTweaker.class.getProtectionDomain().getCodeSource().getLocation().getFile());
         args.add("guichaguri.betterfps.installer.GuiAlgorithmTester");
         this.thread = new Thread(new Runnable() {
            @Override
            public void run() {
               try {
                  AlgorithmAction.this.process.waitFor();
                  BufferedReader in = new BufferedReader(new InputStreamReader(AlgorithmAction.this.process.getInputStream()));
                  String line = in.readLine();
                  BetterFpsHelper.LOG.info("Benchmark is done.");
                  AlgorithmAction.this.button.setValue(AlgorithmAction.this.parseAlgorithm(line));
                  AlgorithmAction.this.button.updateTitle();
                  AlgorithmAction.this.process.destroy();
                  AlgorithmAction.this.process = null;
                  AlgorithmAction.this.thread = null;
               } catch (Exception var3) {
                  var3.printStackTrace();
               }
            }
         });

         try {
            this.process = new ProcessBuilder(args).start();
            this.thread.start();
         } catch (IOException var3) {
            BetterFpsHelper.LOG.error("Couldn't launch the benchmark", var3);
         }
      }
   }
}
