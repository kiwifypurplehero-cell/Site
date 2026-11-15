package guichaguri.betterfps.math;

public class LibGDXMath {
   public static final float BF_PI = (float) Math.PI;
   private static final int BF_SIN_BITS = 14;
   private static final int BF_SIN_MASK = 16383;
   private static final int BF_SIN_COUNT = 16384;
   private static final float BF_radFull = (float) (Math.PI * 2);
   private static final float BF_degFull = 360.0F;
   private static final float BF_radToIndex = 2607.5945F;
   private static final float BF_degToIndex = 45.511112F;
   public static final float BF_degreesToRadians = (float) (Math.PI / 180.0);
   private static final float[] BF_table = new float[16384];

   public static float sin(float radians) {
      return BF_table[(int)(radians * 2607.5945F) & 16383];
   }

   public static float cos(float radians) {
      return BF_table[(int)((radians + (float) (Math.PI / 2)) * 2607.5945F) & 16383];
   }

   static {
      for (int i = 0; i < 16384; i++) {
         BF_table[i] = (float)Math.sin((i + 0.5F) / 16384.0F * (float) (Math.PI * 2));
      }

      for (int i = 0; i < 360; i += 90) {
         BF_table[(int)(i * 45.511112F) & 16383] = (float)Math.sin(i * (float) (Math.PI / 180.0));
      }
   }
}
