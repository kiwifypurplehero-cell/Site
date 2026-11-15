package guichaguri.betterfps.installer;

import guichaguri.betterfps.json.JsonObject;
import java.awt.Dimension;
import java.awt.GridBagConstraints;
import java.awt.GridBagLayout;
import java.awt.event.ActionEvent;
import java.awt.event.ActionListener;
import java.awt.event.FocusEvent;
import java.awt.event.FocusListener;
import java.io.File;
import java.io.IOException;
import java.util.concurrent.TimeUnit;
import javax.swing.BorderFactory;
import javax.swing.Box;
import javax.swing.JButton;
import javax.swing.JComboBox;
import javax.swing.JDialog;
import javax.swing.JFileChooser;
import javax.swing.JLabel;
import javax.swing.JOptionPane;
import javax.swing.JPanel;
import javax.swing.JTextField;

public class GuiInstallOptions extends JDialog implements ActionListener, FocusListener {
   private final String BROWSE = "browse_directories";
   private final String INSTALL = "install";
   private final String DEFAULT_PROFILE = "BetterFps";
   private final JTextField gameDir;
   private final JComboBox versions;
   private final JComboBox profiles;
   private JsonObject launcherProfiles;

   GuiInstallOptions(GuiInstaller installer) {
      this.setTitle(BetterFpsInstaller.i18n("betterfps.installer.button.install"));
      this.setResizable(false);
      this.setModal(true);
      this.setMinimumSize(new Dimension(300, 200));
      JPanel content = new JPanel();
      content.setLayout(new GridBagLayout());
      content.setBorder(BorderFactory.createEmptyBorder(15, 15, 15, 15));
      GridBagConstraints c = new GridBagConstraints();
      c.gridx = 0;
      c.gridy = 0;
      c.fill = 2;
      content.add(this.createLabel("betterfps.installer.label.game-dir"), c);
      c.gridy++;
      this.gameDir = new JTextField(BetterFpsInstaller.getSuggestedMinecraftFolder().getAbsolutePath());
      this.gameDir.addFocusListener(this);
      content.add(this.gameDir, c);
      c.gridx++;
      JButton browse = new JButton("...");
      browse.setActionCommand("browse_directories");
      browse.addActionListener(this);
      content.add(browse, c);
      c.gridx = 0;
      c.gridy++;
      content.add(Box.createVerticalStrut(10), c);
      c.gridy++;
      content.add(this.createLabel("betterfps.installer.label.version"), c);
      c.gridy++;
      this.versions = new JComboBox();
      content.add(this.versions, c);
      c.gridy++;
      content.add(Box.createVerticalStrut(10), c);
      c.gridy++;
      content.add(this.createLabel("betterfps.installer.label.profile"), c);
      c.gridy++;
      this.profiles = new JComboBox();
      content.add(this.profiles, c);
      c.gridy++;
      content.add(Box.createVerticalStrut(15), c);
      c.gridy++;
      JButton install = new JButton(BetterFpsInstaller.i18n("betterfps.installer.button.install"));
      install.setActionCommand("install");
      install.addActionListener(this);
      content.add(install, c);
      this.updateComboBoxes();
      this.add(content);
      this.pack();
      this.setSize(this.getPreferredSize());
      this.setLocationRelativeTo(installer);
   }

   private JLabel createLabel(String key) {
      JLabel label = new JLabel(BetterFpsInstaller.i18n(key));
      label.setFont(label.getFont().deriveFont(12.0F));
      return label;
   }

   private void updateComboBoxes() {
      File dir = new File(this.gameDir.getText());
      this.versions.removeAllItems();
      this.profiles.removeAllItems();
      if (dir.exists() && dir.isDirectory()) {
         File versionsDir = new File(dir, "versions");
         if (versionsDir.exists() && versionsDir.isDirectory()) {
            for (File ver : versionsDir.listFiles()) {
               if (ver.isDirectory()) {
                  String name = ver.getName();
                  if (name.startsWith("1.12.2")) {
                     this.versions.addItem(name);
                  }
               }
            }
         }

         this.profiles.addItem("BetterFps");

         try {
            this.launcherProfiles = BetterFpsInstaller.loadProfiles(dir);

            for (String name : BetterFpsInstaller.getProfileNames(this.launcherProfiles)) {
               if (!name.equalsIgnoreCase("BetterFps")) {
                  this.profiles.addItem(name);
               }
            }
         } catch (IOException var8) {
         }
      }
   }

   @Override
   public void actionPerformed(ActionEvent event) {
      String action = event.getActionCommand();
      if (action.equals("browse_directories")) {
         JFileChooser chooser = new JFileChooser(BetterFpsInstaller.getSuggestedMinecraftFolder());
         chooser.setFileSelectionMode(1);
         chooser.setDialogTitle(BetterFpsInstaller.i18n("betterfps.installer.label.game-dir"));
         int r = chooser.showOpenDialog(this);
         if (r == 0) {
            this.gameDir.setText(chooser.getSelectedFile().getAbsolutePath());
            this.updateComboBoxes();
         }
      } else if (action.equals("install")) {
         if (this.versions.getSelectedIndex() == -1 || this.profiles.getSelectedIndex() == -1) {
            String msg = "The version or the profile is missing.";
            JOptionPane.showMessageDialog(this, msg, "Oops!", 2);
            return;
         }

         File dir = new File(this.gameDir.getText());
         String version = this.versions.getSelectedItem().toString();
         String profile = this.profiles.getSelectedItem().toString();
         BetterFpsInstaller.info("Installing BetterFps in %s using the profile %s...", version, profile);

         try {
            long time = System.nanoTime();
            BetterFpsInstaller.copyLibrary(dir);
            JsonObject versionJson = BetterFpsInstaller.loadVersion(dir, version);
            version = String.format("%s-BetterFps-%s", version, "1.4.8");
            versionJson = BetterFpsInstaller.generateVersion(versionJson, version);
            BetterFpsInstaller.saveVersion(dir, version, versionJson);
            if (this.launcherProfiles != null) {
               BetterFpsInstaller.addProfile(this.launcherProfiles, profile, version);
               BetterFpsInstaller.saveProfiles(dir, this.launcherProfiles);
            }

            BetterFpsInstaller.GAME_DIR = dir;
            BetterFpsInstaller.saveAlgorithm();
            time = System.nanoTime() - time;
            String title = BetterFpsInstaller.i18n("betterfps.installer.title");
            String msg = BetterFpsInstaller.i18n("betterfps.installer.done", TimeUnit.NANOSECONDS.toMillis(time));
            JOptionPane.showMessageDialog(this, msg, title, 1);
            this.setVisible(false);
         } catch (IOException var11) {
            var11.printStackTrace();
            String msg = "An error ocurred while installing: %s\nSorry for the inconvenience.";
            msg = String.format(msg, var11.getClass().getSimpleName());
            JOptionPane.showMessageDialog(this, msg, "Oops!", 0);
         }
      }
   }

   @Override
   public void focusGained(FocusEvent event) {
   }

   @Override
   public void focusLost(FocusEvent event) {
      this.updateComboBoxes();
   }
}
