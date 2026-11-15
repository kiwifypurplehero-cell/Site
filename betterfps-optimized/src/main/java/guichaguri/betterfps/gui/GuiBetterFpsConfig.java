package guichaguri.betterfps.gui;

import guichaguri.betterfps.BetterFpsHelper;
import guichaguri.betterfps.gui.data.OptionManager;
import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import org.lwjgl.input.Mouse;

public class GuiBetterFpsConfig extends blk {
   private final blk parent;
   private String title;
   private String titleMouseOver;
   private String titleRightClick;
   private final List<GuiConfigOption> options = new ArrayList<>();
   private float scrollY = 0.0F;
   private float lastScrollY = 0.0F;
   private int pageHeight = 0;

   public GuiBetterFpsConfig() {
      this.parent = null;
   }

   public GuiBetterFpsConfig(blk parent) {
      this.parent = parent;
   }

   public void b() {
      this.title = cey.a("betterfps.options.title", new Object[0]);
      this.titleMouseOver = cey.a("betterfps.options.title.mouseover", new Object[0]);
      this.titleRightClick = cey.a("betterfps.options.title.rightclick", new Object[0]);
      int middleX = this.l / 2;
      int xLeft = middleX - 155;
      int xRight = middleX + 5;
      int y = this.m - 27;
      this.n.add(new bja(-1, xLeft, y, 150, 20, cey.a("gui.done", new Object[0])));
      this.n.add(new bja(-2, xRight, y, 150, 20, cey.a("gui.cancel", new Object[0])));
      this.options.clear();
      OptionManager.addButtons(this.options);
      int var8 = 5;
      boolean left = true;

      for (GuiConfigOption button : this.options) {
         if (button.isWide()) {
            var8 += 25;
            button.h = xLeft;
            button.a(310);
         } else {
            if (left) {
               var8 += 25;
            }

            button.h = left ? xLeft : xRight;
            button.a(150);
            left = !left;
         }

         button.i = var8;
      }

      this.pageHeight = var8 + 60;
   }

   private void updateScroll(float partialTicks) {
      this.scrollY = this.scrollY + Mouse.getDWheel() / 6.0F;
      if (Mouse.isButtonDown(0)) {
         this.scrollY = this.scrollY - (float)Mouse.getDY() / Math.max(this.j.t.aG, 1);
         this.lastScrollY = this.scrollY;
      }

      int pageHeightDelta = this.m - this.pageHeight;
      if (this.scrollY > 0.0F) {
         this.scrollY = 0.0F;
         if (this.lastScrollY > 0.0F) {
            this.lastScrollY = 0.0F;
         }
      } else if (this.scrollY < pageHeightDelta) {
         int scroll = pageHeightDelta > 0 ? 0 : pageHeightDelta;
         this.scrollY = scroll;
         if (this.lastScrollY < pageHeightDelta) {
            this.lastScrollY = scroll;
         }
      }

      this.lastScrollY = this.lastScrollY + (this.scrollY - this.lastScrollY) * partialTicks;
   }

   private int getScrollMouseY(int mouseY) {
      return mouseY >= 30 && this.m - mouseY >= 30 ? mouseY - (int)this.lastScrollY : Integer.MIN_VALUE;
   }

   public void a(int mouseX, int mouseY, float partialTicks) {
      this.c();
      this.updateScroll(partialTicks);
      int mouseYScroll = this.getScrollMouseY(mouseY);
      bus.c(0.0F, this.lastScrollY, 0.0F);

      for (int i = 0; i < this.options.size(); i++) {
         this.options.get(i).a(this.j, mouseX, mouseYScroll, partialTicks);
      }

      bus.c(0.0F, -this.lastScrollY, 0.0F);
      this.a(0, 0, this.l, 30, -938471408, 0);
      this.a(0, this.m - 30, this.l, this.m, 0, -938471408);
      super.a(mouseX, mouseY, partialTicks);
      int x = this.l / 2;
      int y = (30 - this.q.a) / 2;
      if (mouseY < 30) {
         if (Mouse.isButtonDown(1)) {
            this.a(this.q, this.titleRightClick, x, y, 16711680);
         } else {
            this.a(this.q, this.titleMouseOver, x, y, 12632256);
         }
      } else {
         this.a(this.q, this.title, x, y, 16777215);
      }

      if (Mouse.isButtonDown(1)) {
         for (int i = 0; i < this.options.size(); i++) {
            GuiConfigOption button = this.options.get(i);
            if (button.a()) {
               String description = button.getDescription();
               if (description != null) {
                  List<String> lines = this.q.c(description, this.l - 10);
                  int tooltipY = mouseY + 10;
                  int tooltipHeight = lines.size() * this.q.a + 10;
                  int tooltipBottom = tooltipY + tooltipHeight;
                  if (tooltipBottom > this.m) {
                     tooltipY = this.m - tooltipHeight;
                     tooltipBottom = this.m;
                  }

                  a(0, tooltipY, this.l, tooltipBottom, -938471408);
                  tooltipY += 5;
                  int line = 0;

                  for (String l : lines) {
                     this.q.a(l, 5.0F, tooltipY + line * this.q.a, 16777215, true);
                     line++;
                  }
               }
            }
         }
      }
   }

   protected void a(int mouseX, int mouseY, int mouseButton) throws IOException {
      super.a(mouseX, mouseY, mouseButton);
      if (mouseButton == 0) {
         int mouseYScroll = this.getScrollMouseY(mouseY);

         for (int i = 0; i < this.options.size(); i++) {
            GuiConfigOption button = this.options.get(i);
            if (button.b(this.j, mouseX, mouseYScroll)) {
               button.a(this.j.U());
               button.actionPerformed();
               this.a(button);
            }
         }
      }
   }

   public boolean d() {
      return true;
   }

   protected void a(bja button) throws IOException {
      switch (button.k) {
         case -2:
            this.j.a(this.parent);
            break;
         case -1:
            boolean restart = OptionManager.store(this.options);
            BetterFpsHelper.saveConfig();
            this.j.a((blk)(restart ? new GuiRestartDialog(this.parent) : this.parent));
      }
   }
}
