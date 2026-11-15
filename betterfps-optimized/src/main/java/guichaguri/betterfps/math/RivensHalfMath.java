package guichaguri.betterfps.math;

public class RivensHalfMath {
   private static final float BF_SIN_TO_COS = (float) (Math.PI / 2);
   private static final int BF_SIN_BITS = 12;
   private static final int BF_SIN_MASK = ~(-1 << BF_SIN_BITS);
   private static final int BF_SIN_MASK2 = BF_SIN_MASK >> 1;
   private static final int BF_SIN_COUNT = BF_SIN_MASK + 1;
   private static final int BF_SIN_COUNT2 = BF_SIN_MASK2 + 1;
   private static final float BF_radFull = (float) (Math.PI * 2);
   private static final float BF_radToIndex = BF_SIN_COUNT / BF_radFull;
   private static final float[] BF_sinHalf = new float[BF_SIN_COUNT2];

   public static float sin(float rad) {
      int index1 = (int)(rad * BF_radToIndex) & BF_SIN_MASK;
      int index2 = index1 & BF_SIN_MASK2;
      int mul = index1 == index2 ? 1 : -1;
      return BF_sinHalf[index2] * mul;
   }

   public static float cos(float rad) {
      return sin(rad + BF_SIN_TO_COS);
   }

   static {
      for (int i = 0; i < BF_SIN_COUNT2; i++) {
         BF_sinHalf[i] = (float)Math.sin((i + Math.min(1, i % (BF_SIN_COUNT / 4)) * 0.5) / BF_SIN_COUNT * BF_radFull);
      }

      float[] hardcodedAngles = new float[]{(float) (Math.PI / 2), (float) (Math.PI / 2) + BF_SIN_TO_COS};

      for (float angle : hardcodedAngles) {
         int index1 = (int)(angle * BF_radToIndex) & BF_SIN_MASK;
         int index2 = index1 & BF_SIN_MASK2;
         int mul = index1 == index2 ? 1 : -1;
         BF_sinHalf[index2] = (float)(Math.sin(angle) / mul);
      }
   }
}
