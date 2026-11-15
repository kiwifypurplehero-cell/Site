package guichaguri.betterfps.installer;

import guichaguri.betterfps.math.JavaMath;
import guichaguri.betterfps.math.LibGDXMath;
import guichaguri.betterfps.math.RivensFullMath;
import guichaguri.betterfps.math.RivensHalfMath;
import guichaguri.betterfps.math.RivensMath;
import guichaguri.betterfps.math.TaylorMath;
import java.awt.Dimension;
import java.awt.GridBagConstraints;
import java.awt.GridBagLayout;
import java.awt.GridLayout;
import java.awt.event.ActionEvent;
import java.awt.event.ActionListener;
import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.TimeUnit;
import javax.swing.BorderFactory;
import javax.swing.Box;
import javax.swing.JButton;
import javax.swing.JDialog;
import javax.swing.JLabel;
import javax.swing.JPanel;

public class GuiAlgorithmTester extends JDialog implements ActionListener {
   private final String CHANGE_ALGORITHM = "change_algorithm";
   private final String TEST_AGAIN = "test_again";
   private final JLabel status;
   private final JPanel data;
   private final JButton again;
   private final JButton change;
   private String bestAlgorithm = "rivens-half";

   public static void main(String[] args) {
      warmupClasses();
      Map<String, Long> data = benchmark(1000000000, 5000);
      String bestAlgorithm = null;
      long bestTime = Long.MAX_VALUE;

      for (String key : data.keySet()) {
         long time = data.get(key);
         if (time < bestTime) {
            bestAlgorithm = key;
            bestTime = time;
         }
      }

      System.out.println(bestAlgorithm);
      System.exit(0);
   }

   private static void warmupClasses() {
      JavaMath.sin(0.0F);
      VanillaMath.sin(0.0F);
      LibGDXMath.sin(0.0F);
      RivensMath.sin(0.0F);
      RivensFullMath.sin(0.0F);
      RivensHalfMath.sin(0.0F);
      TaylorMath.sin(0.0F);
   }

   private static Map<String, Long> benchmark(int maxLoops, int maxTime) {
      long javaMath = 0L;
      long vanilla = 0L;
      long libgdx = 0L;
      long rivens = 0L;
      long rivensFull = 0L;
      long rivensHalf = 0L;
      long taylors = 0L;
      long startTime = System.currentTimeMillis();

      for (int i = 0; i < maxLoops; i++) {
         float angle = (float)Math.toRadians(i % 360);
         long time = System.nanoTime();
         JavaMath.sin(angle);
         JavaMath.cos(angle);
         javaMath += System.nanoTime() - time;
         time = System.nanoTime();
         VanillaMath.sin(angle);
         VanillaMath.cos(angle);
         vanilla += System.nanoTime() - time;
         time = System.nanoTime();
         LibGDXMath.sin(angle);
         LibGDXMath.cos(angle);
         libgdx += System.nanoTime() - time;
         time = System.nanoTime();
         RivensMath.sin(angle);
         RivensMath.cos(angle);
         rivens += System.nanoTime() - time;
         time = System.nanoTime();
         RivensFullMath.sin(angle);
         RivensFullMath.cos(angle);
         rivensFull += System.nanoTime() - time;
         time = System.nanoTime();
         RivensHalfMath.sin(angle);
         RivensHalfMath.cos(angle);
         rivensHalf += System.nanoTime() - time;
         time = System.nanoTime();
         TaylorMath.sin(angle);
         TaylorMath.cos(angle);
         taylors += System.nanoTime() - time;
         if (System.currentTimeMillis() - startTime > maxTime) {
            break;
         }
      }

      HashMap<String, Long> results = new HashMap<>();
      results.put("java", javaMath);
      results.put("vanilla", vanilla);
      results.put("rivens", rivens);
      results.put("rivens-full", rivensFull);
      results.put("rivens-half", rivensHalf);
      results.put("libgdx", libgdx);
      results.put("taylors", taylors);
      return results;
   }

   GuiAlgorithmTester(GuiInstaller installer) {
      this.setTitle(BetterFpsInstaller.i18n("betterfps.installer.algorithm.title"));
      this.setResizable(false);
      this.setModal(true);
      this.setMinimumSize(new Dimension(300, 200));
      JPanel content = new JPanel();
      content.setLayout(new GridBagLayout());
      content.setBorder(BorderFactory.createEmptyBorder(15, 15, 15, 15));
      GridBagConstraints c = new GridBagConstraints();
      c.fill = 2;
      c.gridx = 0;
      c.gridy = 0;
      this.status = new JLabel();
      this.status.setHorizontalAlignment(0);
      this.status.setFont(this.status.getFont().deriveFont(16.0F));
      content.add(this.status, c);
      c.gridy++;
      content.add(Box.createVerticalStrut(15), c);
      c.gridy++;
      this.data = new JPanel();
      this.data.setLayout(new GridLayout(0, 3));
      this.data.setVisible(false);
      content.add(this.data, c);
      c.gridy++;
      content.add(Box.createVerticalStrut(15), c);
      c.gridy++;
      this.again = new JButton(BetterFpsInstaller.i18n("betterfps.installer.algorithm.button.again"));
      this.again.setActionCommand("test_again");
      this.again.addActionListener(this);
      this.again.setVisible(false);
      content.add(this.again, c);
      c.gridy++;
      this.change = new JButton();
      this.change.setActionCommand("change_algorithm");
      this.change.addActionListener(this);
      this.change.setVisible(false);
      content.add(this.change, c);
      this.add(content);
      this.pack();
      this.setSize(this.getPreferredSize());
      this.setLocationRelativeTo(installer);
      this.startBenchmark();
   }

   private void showResults(Map<String, Long> results) {
      BetterFpsInstaller.info("Done! Showing the results");
      this.data.removeAll();
      long bestTime = Long.MAX_VALUE;

      for (String key : results.keySet()) {
         this.data.add(new JLabel(BetterFpsInstaller.i18n("betterfps.options.algorithm." + key)));
         long d = results.get(key);
         if (d < bestTime) {
            this.bestAlgorithm = key;
            bestTime = d;
         }

         JLabel nanoseconds = new JLabel(d + " ns");
         nanoseconds.setHorizontalAlignment(4);
         this.data.add(nanoseconds);
         JLabel miliseconds = new JLabel(TimeUnit.NANOSECONDS.toMillis(d) + " ms");
         miliseconds.setHorizontalAlignment(4);
         this.data.add(miliseconds);
      }

      String algorithmName = BetterFpsInstaller.i18n("betterfps.options.algorithm." + this.bestAlgorithm);
      this.change.setText(BetterFpsInstaller.i18n("betterfps.installer.algorithm.button.change", algorithmName));
      this.data.setVisible(true);
      this.again.setVisible(true);
      this.change.setVisible(true);
      this.status.setText(BetterFpsInstaller.i18n("betterfps.installer.algorithm.title"));
      this.pack();
      this.setSize(this.getPreferredSize());
   }

   private void startBenchmark() {
      Thread t = new Thread(new Runnable() {
         @Override
         public void run() {
            GuiAlgorithmTester.this.status.setText(BetterFpsInstaller.i18n("betterfps.installer.algorithm.working"));
            GuiAlgorithmTester.this.data.setVisible(false);
            GuiAlgorithmTester.this.again.setVisible(false);
            GuiAlgorithmTester.this.change.setVisible(false);
            BetterFpsInstaller.info("Benchmarking algorithms...");
            GuiAlgorithmTester.warmupClasses();
            GuiAlgorithmTester.this.showResults(GuiAlgorithmTester.benchmark(1000000000, 10000));
         }
      });
      t.start();
   }

   @Override
   public void actionPerformed(ActionEvent event) {
      String action = event.getActionCommand();
      if (action.equals("test_again")) {
         this.startBenchmark();
      } else if (action.equals("change_algorithm")) {
         try {
            BetterFpsInstaller.ALGORITHM = this.bestAlgorithm;
            BetterFpsInstaller.saveAlgorithm();
         } catch (Exception var4) {
            BetterFpsInstaller.error("Couldn't save the algorithm: %s", var4.getMessage());
         }

         this.setVisible(false);
      }
   }
}
