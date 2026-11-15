package guichaguri.betterfps.gui;

import com.mojang.realmsclient.gui.ChatFormatting;
import org.lwjgl.input.Keyboard;

public class GuiConfigOption<T> extends GuiCycleButton<T> {
   private String description;
   private boolean wide = false;
   private boolean restart = false;
   private int originalValue = -1;
   private T defaultVanilla;
   private T defaultBetterFps;
   private Runnable shiftClick;

   public GuiConfigOption(int id, String title) {
      super(id, cey.a(title, new Object[0]));
   }

   public boolean isWide() {
      return this.wide;
   }

   public void setWide(boolean wide) {
      this.wide = wide;
   }

   public boolean shouldRestart() {
      return this.restart && this.originalValue != this.index;
   }

   public void setRestart(boolean restart) {
      this.restart = restart;
   }

   public void setShiftClick(Runnable shiftClick) {
      this.shiftClick = shiftClick;
   }

   public void setDefaults(T defaultVanilla, T defaultBetterFps, T originalValue) {
      this.defaultVanilla = defaultVanilla;
      this.defaultBetterFps = defaultBetterFps;
      this.setValue(originalValue);
      this.originalValue = this.index;
   }

   public String getDescription() {
      return this.description;
   }

   public void setDescription(String... lines) {
      StringBuilder builder = new StringBuilder();

      for (String line : lines) {
         builder.append(line);
         builder.append('\n');
      }

      builder.append('\n');
      builder.append(ChatFormatting.GRAY);
      if (this.defaultVanilla == this.defaultBetterFps) {
         builder.append(cey.a("betterfps.options.default", new Object[]{this.toDisplayName(this.defaultBetterFps)}));
      } else {
         builder.append(cey.a("betterfps.options.default.vanilla", new Object[]{this.toDisplayName(this.defaultVanilla)}));
         builder.append('\n');
         builder.append(cey.a("betterfps.options.default.betterfps", new Object[]{this.toDisplayName(this.defaultBetterFps)}));
      }

      if (this.restart) {
         builder.append('\n');
         builder.append(ChatFormatting.RED);
         builder.append(cey.a("betterfps.options.restart", new Object[0]));
      }

      this.description = builder.toString();
   }

   @Override
   public void add(T value, String displayName) {
      super.add(value, cey.a(displayName, new Object[0]));
   }

   @Override
   public void actionPerformed() {
      if ((Keyboard.isKeyDown(42) || Keyboard.isKeyDown(54)) && this.shiftClick != null) {
         this.shiftClick.run();
      } else {
         super.actionPerformed();
      }
   }
}
