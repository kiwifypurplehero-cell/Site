package guichaguri.betterfps.installer;

public class VanillaMath {
   private static final float[] SIN_TABLE = new float[65536];

   public static float sin(float value) {
      return SIN_TABLE[(int)(value * 10430.378F) & 65535];
   }

   public static float cos(float value) {
      return SIN_TABLE[(int)(value * 10430.378F + 16384.0F) & 65535];
   }

   static {
      for (int i = 0; i < 65536; i++) {
         SIN_TABLE[i] = (float)Math.sin(i * Math.PI * 2.0 / 65536.0);
      }
   }
}
