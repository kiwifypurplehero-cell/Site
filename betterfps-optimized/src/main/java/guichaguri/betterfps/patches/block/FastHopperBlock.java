package guichaguri.betterfps.patches.block;

import guichaguri.betterfps.api.IFastHopper;
import guichaguri.betterfps.transformers.annotations.Condition;
import guichaguri.betterfps.transformers.annotations.Copy;

@Condition("fastHopper")
public abstract class FastHopperBlock extends aow {
   protected FastHopperBlock(bcz materialIn) {
      super(materialIn);
   }

   @Copy(Copy.Mode.APPEND)
   public void a(awt state, amu worldIn, et pos, aow neighborBlock, et pos2) {
      avj te = worldIn.r(pos);
      if (te != null && te instanceof IFastHopper) {
         ((IFastHopper)te).updateFastHopper();
      }
   }
}
