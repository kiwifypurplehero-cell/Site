package guichaguri.betterfps.gui;

import org.apache.commons.lang3.ArrayUtils;

public class GuiCycleButton<T> extends bja {
   protected final String title;
   protected int index = 0;
   protected Object[] values = new Object[0];
   protected String[] displayNames = new String[0];

   public GuiCycleButton(int id, String title) {
      super(id, 0, 0, title);
      this.title = title;
      this.updateTitle();
   }

   public void set(T[] values, String[] displayNames) {
      this.values = values;
      this.displayNames = displayNames;
   }

   public void add(T value, String displayName) {
      this.displayNames = (String[])ArrayUtils.add(this.displayNames, displayName);
      this.values = ArrayUtils.add(this.values, value);
   }

   public T getValue() {
      return (T)this.values[this.index];
   }

   public void setValue(T elem) {
      for (int i = 0; i < this.values.length; i++) {
         if (this.values[i] == elem) {
            this.index = i;
            this.updateTitle();
            break;
         }
      }
   }

   public String toDisplayName(T elem) {
      for (int i = 0; i < this.values.length; i++) {
         if (this.values[i] == elem) {
            return this.displayNames[i];
         }
      }

      return null;
   }

   public void actionPerformed() {
      this.index++;
      if (this.index >= this.values.length) {
         this.index = 0;
      }

      this.updateTitle();
   }

   public void setTitle(String title) {
      this.j = title;
   }

   public void updateTitle() {
      if (this.index < this.displayNames.length) {
         this.j = String.format("%s: %s", this.title, this.displayNames[this.index]);
      }
   }
}
