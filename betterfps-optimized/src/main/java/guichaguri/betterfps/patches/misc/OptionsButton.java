package guichaguri.betterfps.patches.misc;

import guichaguri.betterfps.gui.GuiBetterFpsConfig;
import guichaguri.betterfps.transformers.annotations.Copy;
import java.io.IOException;

public abstract class OptionsButton extends blk {
   @Copy(Copy.Mode.REPLACE)
   public void a(bib mc, int width, int height) {
      super.a(mc, width, height);
      int x_BF = this.l / 2 + 5;
      int y_BF = this.m / 6 + 24 - 8;
      int width_BF = 150;
      if (this.hasButtonInPosition(x_BF, y_BF, width_BF)) {
         x_BF = this.l / 2 - 155;
         if (this.hasButtonInPosition(x_BF, y_BF, width_BF)) {
            bja language = null;

            for (bja b : this.n) {
               if (b.k == 102) {
                  language = b;
                  break;
               }
            }

            if (language == null) {
               x_BF = 0;
               y_BF = 0;
               width_BF = 100;
            } else {
               this.n.remove(language);
               bja var10 = new bji(language.k, language.h, language.i);
               this.n.add(var10);
               x_BF = var10.h + var10.b();
               y_BF = var10.i;
               width_BF -= var10.b();
            }
         }
      }

      this.n.add(new bja(72109, x_BF, y_BF, width_BF, 20, cey.a("betterfps.options.title", new Object[0])));
   }

   @Copy
   private boolean hasButtonInPosition(int x, int y, int width) {
      int x2 = x + width;
      int y2 = y + 20;

      for (bja b : this.n) {
         int bX = b.h;
         int bY = b.i;
         if (x2 > bX && y2 > bY && x < bX + b.b() && y < bY + 20) {
            return true;
         }
      }

      return false;
   }

   @Copy(Copy.Mode.APPEND)
   protected void a(bja button) throws IOException {
      if (button.k == 72109) {
         this.j.t.b();
         this.j.a(new GuiBetterFpsConfig(this));
      }
   }
}
