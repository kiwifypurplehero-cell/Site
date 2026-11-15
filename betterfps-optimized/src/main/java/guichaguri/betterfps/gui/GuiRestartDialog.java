package guichaguri.betterfps.gui;

import java.io.IOException;

public class GuiRestartDialog extends blk {
   private final blk parent;

   public GuiRestartDialog(blk parent) {
      this.parent = parent;
   }

   public void b() {
      this.n.add(new bja(1, this.l / 2 - 205, this.m - 27, cey.a("gui.yes", new Object[0])));
      this.n.add(new bja(2, this.l / 2 + 5, this.m - 27, cey.a("gui.no", new Object[0])));
   }

   public void a(int mouseX, int mouseY, float partialTicks) {
      this.c();
      int centerX = this.l / 2;
      int centerY = this.m / 2;
      int dialogTextAmount = 2;

      for (int i = 0; i < dialogTextAmount; i++) {
         String msg = cey.a("betterfps.options.restart.dialog." + (i + 1), new Object[0]);
         this.a(this.q, msg, centerX, centerY - (dialogTextAmount - i) * this.q.a, 16777215);
      }

      super.a(mouseX, mouseY, partialTicks);
   }

   public boolean d() {
      return true;
   }

   protected void a(bja button) throws IOException {
      switch (button.k) {
         case 1:
            this.j.n();
            break;
         case 2:
            this.j.a(this.parent);
      }
   }
}
