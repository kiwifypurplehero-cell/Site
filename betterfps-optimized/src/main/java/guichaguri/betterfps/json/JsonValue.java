package guichaguri.betterfps.json;

import java.io.IOException;
import java.io.Reader;
import java.io.Serializable;
import java.io.StringWriter;
import java.io.Writer;

public abstract class JsonValue implements Serializable {
   @Deprecated
   public static final JsonValue TRUE = Json.TRUE;
   @Deprecated
   public static final JsonValue FALSE = Json.FALSE;
   @Deprecated
   public static final JsonValue NULL = Json.NULL;

   JsonValue() {
   }

   @Deprecated
   public static JsonValue readFrom(Reader reader) throws IOException {
      return new JsonParser(reader).parse();
   }

   @Deprecated
   public static JsonValue readFrom(String text) {
      try {
         return new JsonParser(text).parse();
      } catch (IOException var2) {
         throw new RuntimeException(var2);
      }
   }

   @Deprecated
   public static JsonValue valueOf(int value) {
      return Json.value(value);
   }

   @Deprecated
   public static JsonValue valueOf(long value) {
      return Json.value(value);
   }

   @Deprecated
   public static JsonValue valueOf(float value) {
      return Json.value(value);
   }

   @Deprecated
   public static JsonValue valueOf(double value) {
      return Json.value(value);
   }

   @Deprecated
   public static JsonValue valueOf(String string) {
      return Json.value(string);
   }

   @Deprecated
   public static JsonValue valueOf(boolean value) {
      return Json.value(value);
   }

   public boolean isObject() {
      return false;
   }

   public boolean isArray() {
      return false;
   }

   public boolean isNumber() {
      return false;
   }

   public boolean isString() {
      return false;
   }

   public boolean isBoolean() {
      return false;
   }

   public boolean isTrue() {
      return false;
   }

   public boolean isFalse() {
      return false;
   }

   public boolean isNull() {
      return false;
   }

   public JsonObject asObject() {
      throw new UnsupportedOperationException("Not an object: " + this.toString());
   }

   public JsonArray asArray() {
      throw new UnsupportedOperationException("Not an array: " + this.toString());
   }

   public int asInt() {
      throw new UnsupportedOperationException("Not a number: " + this.toString());
   }

   public long asLong() {
      throw new UnsupportedOperationException("Not a number: " + this.toString());
   }

   public float asFloat() {
      throw new UnsupportedOperationException("Not a number: " + this.toString());
   }

   public double asDouble() {
      throw new UnsupportedOperationException("Not a number: " + this.toString());
   }

   public String asString() {
      throw new UnsupportedOperationException("Not a string: " + this.toString());
   }

   public boolean asBoolean() {
      throw new UnsupportedOperationException("Not a boolean: " + this.toString());
   }

   public void writeTo(Writer writer) throws IOException {
      this.writeTo(writer, WriterConfig.MINIMAL);
   }

   public void writeTo(Writer writer, WriterConfig config) throws IOException {
      if (writer == null) {
         throw new NullPointerException("writer is null");
      } else if (config == null) {
         throw new NullPointerException("config is null");
      } else {
         WritingBuffer buffer = new WritingBuffer(writer, 128);
         this.write(config.createWriter(buffer));
         buffer.flush();
      }
   }

   @Override
   public String toString() {
      return this.toString(WriterConfig.MINIMAL);
   }

   public String toString(WriterConfig config) {
      StringWriter writer = new StringWriter();

      try {
         this.writeTo(writer, config);
      } catch (IOException var4) {
         throw new RuntimeException(var4);
      }

      return writer.toString();
   }

   @Override
   public boolean equals(Object object) {
      return super.equals(object);
   }

   @Override
   public int hashCode() {
      return super.hashCode();
   }

   abstract void write(JsonWriter var1) throws IOException;
}
