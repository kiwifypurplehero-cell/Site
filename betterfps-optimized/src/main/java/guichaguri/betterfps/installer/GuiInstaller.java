package guichaguri.betterfps.installer;

import java.awt.Desktop;
import java.awt.Dimension;
import java.awt.GridLayout;
import java.awt.event.ActionEvent;
import java.awt.event.ActionListener;
import java.io.File;
import java.io.IOException;
import java.net.URI;
import java.util.concurrent.TimeUnit;
import javax.swing.BorderFactory;
import javax.swing.BoxLayout;
import javax.swing.JButton;
import javax.swing.JFileChooser;
import javax.swing.JFrame;
import javax.swing.JLabel;
import javax.swing.JOptionPane;
import javax.swing.JPanel;

public class GuiInstaller extends JFrame implements ActionListener {
   private final String INSTALL = "install";
   private final String EXTRACT = "extract";
   private final String TEST_ALGORITHMS = "algorithm_test";
   private final String DOWNLOADS = "downloads";
   private final String ISSUES = "issues";
   private final String ISSUES_URL = "https://github.com/Guichaguri/BetterFps/issues";

   public GuiInstaller() {
      this.setTitle(BetterFpsInstaller.i18n("betterfps.installer.title"));
      this.setResizable(false);
      this.setDefaultCloseOperation(3);
      JPanel content = new JPanel();
      content.setLayout(new BoxLayout(content, 1));
      content.setBorder(BorderFactory.createEmptyBorder(25, 25, 25, 25));
      content.add(this.createLabel("betterfps.installer.versions", "1.4.8", "1.12.2"));
      JLabel title = new JLabel("BetterFps");
      title.setFont(title.getFont().deriveFont(32.0F));
      title.setHorizontalAlignment(0);
      title.setAlignmentX(0.5F);
      title.setBorder(BorderFactory.createEmptyBorder(0, 0, 10, 0));
      content.add(title);

      for (int i = 1; i <= 3; i++) {
         content.add(this.createLabel("betterfps.installer.note." + i));
      }

      JPanel actions = new JPanel();
      actions.setLayout(new GridLayout(1, 2, 10, 0));
      actions.setBorder(BorderFactory.createEmptyBorder(5, 10, 5, 10));
      actions.add(this.createButton("betterfps.installer.button.install", "install"));
      actions.add(this.createButton("betterfps.installer.button.extract", "extract"));
      content.add(actions);
      JPanel extras = new JPanel();
      extras.setLayout(new GridLayout(1, 3, 10, 0));
      extras.setBorder(BorderFactory.createEmptyBorder(5, 10, 5, 10));
      extras.add(this.createButton("betterfps.installer.button.algorithm", "algorithm_test"));
      extras.add(this.createButton("betterfps.installer.button.downloads", "downloads"));
      extras.add(this.createButton("betterfps.installer.button.issues", "issues"));
      content.add(extras);
      this.add(content);
      this.pack();
      this.setSize(this.getPreferredSize());
      this.setLocationRelativeTo(null);
   }

   private JLabel createLabel(String key, Object... data) {
      JLabel label = new JLabel(BetterFpsInstaller.i18n(key, data));
      label.setHorizontalAlignment(0);
      label.setAlignmentX(0.5F);
      label.setFont(label.getFont().deriveFont(12.0F));
      return label;
   }

   private JButton createButton(String key, String action) {
      String txt = BetterFpsInstaller.i18n(key);
      JButton button = new JButton(txt);
      button.setActionCommand(action);
      button.addActionListener(this);
      button.setFont(button.getFont().deriveFont(12.0F));
      button.setPreferredSize(new Dimension(150, 30));
      button.setToolTipText(txt);
      return button;
   }

   @Override
   public void actionPerformed(ActionEvent event) {
      String action = event.getActionCommand();
      if (action.equals("install")) {
         GuiInstallOptions options = new GuiInstallOptions(this);
         options.setVisible(true);
      } else if (action.equals("extract")) {
         this.extractMod();
      } else if (action.equals("algorithm_test")) {
         GuiAlgorithmTester tester = new GuiAlgorithmTester(this);
         tester.setVisible(true);
      } else if (action.equals("downloads")) {
         this.openURL("http://guichaguri.github.io/BetterFps/");
      } else if (action.equals("issues")) {
         this.openURL("https://github.com/Guichaguri/BetterFps/issues");
      }
   }

   private void extractMod() {
      JFileChooser chooser = new JFileChooser(BetterFpsInstaller.getSuggestedMinecraftFolder());
      chooser.setDialogTitle(BetterFpsInstaller.i18n("betterfps.installer.button.extract"));
      chooser.setSelectedFile(new File(String.format("BetterFps-%s.jar", "1.4.8")));
      int r = chooser.showSaveDialog(this);
      if (r == 0) {
         File f = chooser.getSelectedFile();

         try {
            long time = System.nanoTime();
            BetterFpsInstaller.copyMod(f);
            time = System.nanoTime() - time;
            String title = BetterFpsInstaller.i18n("betterfps.installer.title");
            String msg = BetterFpsInstaller.i18n("betterfps.installer.done", TimeUnit.NANOSECONDS.toMillis(time));
            JOptionPane.showMessageDialog(this, msg, title, 1);
         } catch (IOException var8) {
            var8.printStackTrace();
            String msgx = "An error ocurred while extracting: %s\nSorry for the inconvenience.";
            msgx = String.format(msgx, var8.getClass().getSimpleName());
            JOptionPane.showMessageDialog(this, msgx, "Oops!", 0);
         }
      }
   }

   private void openURL(String url) {
      try {
         Desktop desktop = Desktop.getDesktop();
         desktop.browse(new URI(url));
      } catch (Exception var3) {
      }
   }
}
