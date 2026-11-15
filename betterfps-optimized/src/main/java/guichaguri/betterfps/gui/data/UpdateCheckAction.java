package guichaguri.betterfps.gui.data;

import guichaguri.betterfps.BetterFpsHelper;
import guichaguri.betterfps.UpdateChecker;

public class UpdateCheckAction implements Runnable {
   @Override
   public void run() {
      BetterFpsHelper.LOG.info("Checking for updates...");
      bud player = bib.z().h;
      if (player != null) {
         player.a(new hp("betterfps.installer.update.check", new Object[0]), true);
      }

      UpdateChecker.checkForced();
   }
}
