package guichaguri.betterfps.gui;

import com.google.common.collect.ImmutableSet;
import guichaguri.betterfps.tweaker.BetterFpsTweaker;
import java.awt.image.BufferedImage;
import java.io.FileNotFoundException;
import java.io.IOException;
import java.io.InputStream;
import java.util.Set;

public class BetterFpsResourcePack implements cer {
   private final Set<String> DOMAINS = ImmutableSet.of("betterfps");

   private String getPath(nf location) {
      return String.format("assets/%s/%s", location.b(), location.a()).toLowerCase();
   }

   public InputStream a(nf location) throws IOException {
      InputStream stream = BetterFpsTweaker.getResourceStream(this.getPath(location));
      if (stream == null) {
         throw new FileNotFoundException();
      } else {
         return stream;
      }
   }

   public boolean b(nf location) {
      return BetterFpsTweaker.getResource(this.getPath(location)) != null;
   }

   public Set<String> c() {
      return this.DOMAINS;
   }

   public <T extends cfe> T a(cfg serializer, String sectionName) throws IOException {
      return null;
   }

   public BufferedImage a() throws IOException {
      throw new FileNotFoundException();
   }

   public String b() {
      return "BetterFps";
   }
}
