package guichaguri.betterfps.math;

public class RivensMath {
   private static final int BF_SIN_BITS = 12;
   private static final int BF_SIN_MASK = ~(-1 << BF_SIN_BITS);
   private static final int BF_SIN_COUNT = BF_SIN_MASK + 1;
   private static final float BF_radFull = (float) (Math.PI * 2);
   private static final float BF_radToIndex = BF_SIN_COUNT / BF_radFull;
   private static final float BF_degFull = 360.0F;
   private static final float BF_degToIndex = BF_SIN_COUNT / BF_degFull;
   private static final float[] BF_sin = new float[BF_SIN_COUNT];
   private static final float[] BF_cos = new float[BF_SIN_COUNT];

   public static float sin(float rad) {
      return BF_sin[(int)(rad * BF_radToIndex) & BF_SIN_MASK];
   }

   public static float cos(float rad) {
      return BF_cos[(int)(rad * BF_radToIndex) & BF_SIN_MASK];
   }

   static {
      for (int i = 0; i < BF_SIN_COUNT; i++) {
         BF_sin[i] = (float)Math.sin((i + 0.5F) / BF_SIN_COUNT * BF_radFull);
         BF_cos[i] = (float)Math.cos((i + 0.5F) / BF_SIN_COUNT * BF_radFull);
      }

      for (int i = 0; i < 360; i += 90) {
         BF_sin[(int)(i * BF_degToIndex) & BF_SIN_MASK] = (float)Math.sin(i * Math.PI / 180.0);
         BF_cos[(int)(i * BF_degToIndex) & BF_SIN_MASK] = (float)Math.cos(i * Math.PI / 180.0);
      }
   }
}
