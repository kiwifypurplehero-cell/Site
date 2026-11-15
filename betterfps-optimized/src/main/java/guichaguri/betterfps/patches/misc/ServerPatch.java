package guichaguri.betterfps.patches.misc;

import com.mojang.authlib.GameProfileRepository;
import com.mojang.authlib.minecraft.MinecraftSessionService;
import com.mojang.authlib.yggdrasil.YggdrasilAuthenticationService;
import guichaguri.betterfps.UpdateChecker;
import guichaguri.betterfps.transformers.annotations.Copy;
import java.io.File;
import java.io.IOException;
import java.net.Proxy;
import net.minecraft.server.MinecraftServer;

public abstract class ServerPatch extends MinecraftServer {
   public ServerPatch(
      File anvil,
      Proxy proxy,
      ry fixer,
      YggdrasilAuthenticationService auth,
      MinecraftSessionService session,
      GameProfileRepository profiles,
      ph offlineProfiles
   ) {
      super(anvil, proxy, fixer, auth, session, profiles, offlineProfiles);
   }

   @Copy(Copy.Mode.APPEND)
   public boolean j() throws IOException {
      UpdateChecker.check();
      return true;
   }
}
