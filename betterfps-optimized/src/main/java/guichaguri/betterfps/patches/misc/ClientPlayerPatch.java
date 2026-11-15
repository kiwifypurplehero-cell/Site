package guichaguri.betterfps.patches.misc;

import guichaguri.betterfps.UpdateChecker;
import guichaguri.betterfps.transformers.annotations.Copy;

public abstract class ClientPlayerPatch extends bud {
   public ClientPlayerPatch(bib p_i47378_1_, amu p_i47378_2_, brz p_i47378_3_, qt p_i47378_4_, ql p_i47378_5_) {
      super(p_i47378_1_, p_i47378_2_, p_i47378_3_, p_i47378_4_, p_i47378_5_);
   }

   @Copy(Copy.Mode.REPLACE)
   public void W() {
      UpdateChecker.showChat(this);
      super.W();
   }
}
