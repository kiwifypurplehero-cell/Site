package guichaguri.betterfps;

import com.google.gson.JsonArray;
import com.google.gson.JsonObject;
import com.google.gson.JsonParser;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.net.URL;

public class UpdateChecker implements Runnable {
   private static boolean updateCheck = false;
   private static boolean done = false;
   private static String updateVersion = null;
   private static String updateDownload = null;

   public static void check() {
      if (!BetterFpsHelper.getConfig().updateChecker) {
         done = true;
      } else {
         if (!updateCheck) {
            updateCheck = true;
            checkForced();
         }
      }
   }

   public static void checkForced() {
      done = false;
      Thread thread = new Thread(new UpdateChecker(), "BetterFps Update Checker");
      thread.setDaemon(true);
      thread.start();
   }

   public static void showChat(bud player) {
      if (done) {
         if (updateVersion != null || updateDownload != null) {
            if (BetterFps.CLIENT) {
               hp title = new hp("betterfps.update.available", new Object[]{updateVersion});
               title.a(title.b().a(a.k).a(true));
               ho buttons = new ho("  ");
               buttons.a(buttons.b().a(a.o));
               buttons.a(createButton(updateDownload, "betterfps.update.button.download"));
               buttons.a("  ");
               buttons.a(createButton("http://guichaguri.github.io/BetterFps/", "betterfps.update.button.more"));
               int phrase = (int)(Math.random() * 12.0) + 1;
               hp desc = new hp("betterfps.update.phrase." + phrase, new Object[0]);
               desc.a(desc.b().a(a.h));
               if (updateVersion.length() < 8) {
                  title.a(buttons);
                  player.a(title, false);
                  player.a(desc, false);
               } else {
                  player.a(title, false);
                  player.a(buttons, false);
                  player.a(desc, false);
               }

               updateVersion = null;
               updateDownload = null;
            }
         }
      }
   }

   private static void showConsole() {
      if (done) {
         if (updateVersion != null || updateDownload != null) {
            BetterFpsHelper.LOG.info("BetterFps " + updateVersion + " is available");
            BetterFpsHelper.LOG.info("Download: " + updateDownload);
            BetterFpsHelper.LOG.info("More: http://guichaguri.github.io/BetterFps/");
            updateVersion = null;
            updateDownload = null;
         }
      }
   }

   private static hp createButton(String link, String key) {
      hp sib = new hp(key, new Object[0]);
      hn style = sib.b();
      style.a(new hg(hg.a.a, link));
      hp h = new hp(key + ".info", new Object[0]);
      h.a(h.b().a(a.m));
      style.a(new hj(hj.a.a, h));
      sib.a(style);
      return sib;
   }

   @Override
   public void run() {
      try {
         URL url = new URL("http://widget.mcf.li/mc-mods/minecraft/229876-betterfps.json");
         InputStream in = url.openStream();
         JsonParser parser = new JsonParser();
         JsonObject obj = parser.parse(new InputStreamReader(in)).getAsJsonObject();
         JsonObject versions = obj.getAsJsonObject("versions");
         if (!versions.has("1.12.2")) {
            return;
         }

         JsonArray array = versions.getAsJsonArray("1.12.2");
         if (array.size() != 0) {
            JsonObject latest = array.get(0).getAsJsonObject();
            String version = latest.get("name").getAsString();
            if (!version.contains("1.4.8")) {
               updateVersion = version;
               updateDownload = latest.get("url").getAsString();
            }

            done = true;
            if (!BetterFps.CLIENT) {
               showConsole();
            } else if (bib.z().h != null) {
               showChat(bib.z().h);
               return;
            }

            return;
         }
      } catch (Exception var12) {
         BetterFpsHelper.LOG.warn("Could not check for updates: " + var12.getMessage());
         return;
      } finally {
         done = true;
      }
   }
}
