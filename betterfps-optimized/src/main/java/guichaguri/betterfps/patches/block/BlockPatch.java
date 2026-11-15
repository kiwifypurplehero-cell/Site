package guichaguri.betterfps.patches.block;

import guichaguri.betterfps.api.IBlock;
import guichaguri.betterfps.transformers.annotations.Copy;
import javax.annotation.Nullable;

public abstract class BlockPatch extends aow implements IBlock {
   public BlockPatch(bcz m) {
      super(m);
   }

   @Copy(Copy.Mode.COPY)
   @Override
   public boolean isBeaconBase(amy worldObj, et pos, et beacon) {
      return this == aox.bT || this == aox.R || this == aox.ah || this == aox.S;
   }

   @Nullable
   @Copy(Copy.Mode.COPY)
   @Override
   public float[] getBeaconColorMultiplier(awt state, amu world, et pos, et beaconPos) {
      return null;
   }
}
