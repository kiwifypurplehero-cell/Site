package guichaguri.betterfps.math;

public class RivensFullMath {
   private static final float BF_SIN_TO_COS = (float) (Math.PI / 2);
   private static final int BF_SIN_BITS = 12;
   private static final int BF_SIN_MASK = ~(-1 << BF_SIN_BITS);
   private static final int BF_SIN_COUNT = BF_SIN_MASK + 1;
   private static final float BF_radFull = (float) (Math.PI * 2);
   private static final float BF_radToIndex = BF_SIN_COUNT / BF_radFull;
   private static final float[] BF_sinFull = new float[BF_SIN_COUNT];

   public static float sin(float rad) {
      return BF_sinFull[(int)(rad * BF_radToIndex) & BF_SIN_MASK];
   }

   public static float cos(float rad) {
      return sin(rad + BF_SIN_TO_COS);
   }

   static {
      for (int i = 0; i < BF_SIN_COUNT; i++) {
         BF_sinFull[i] = (float)Math.sin((i + Math.min(1, i % (BF_SIN_COUNT / 4)) * 0.5) / BF_SIN_COUNT * BF_radFull);
      }
   }
}
