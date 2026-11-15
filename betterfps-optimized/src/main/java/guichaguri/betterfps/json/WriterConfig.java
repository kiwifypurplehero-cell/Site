package guichaguri.betterfps.json;

import java.io.Writer;

public abstract class WriterConfig {
   public static WriterConfig MINIMAL = new WriterConfig() {
      @Override
      JsonWriter createWriter(Writer writer) {
         return new JsonWriter(writer);
      }
   };
   public static WriterConfig PRETTY_PRINT = PrettyPrint.indentWithSpaces(2);

   abstract JsonWriter createWriter(Writer var1);
}
