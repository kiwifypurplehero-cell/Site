package guichaguri.betterfps.patchers;

import guichaguri.betterfps.BetterFpsHelper;
import guichaguri.betterfps.transformers.ASMUtils;
import guichaguri.betterfps.transformers.IClassPatcher;
import guichaguri.betterfps.transformers.Patch;
import guichaguri.betterfps.tweaker.Mappings;
import org.objectweb.asm.tree.AbstractInsnNode;
import org.objectweb.asm.tree.ClassNode;
import org.objectweb.asm.tree.FieldInsnNode;
import org.objectweb.asm.tree.FieldNode;
import org.objectweb.asm.tree.InsnList;
import org.objectweb.asm.tree.MethodNode;

public class MinecraftPatcher implements IClassPatcher {
   @Override
   public void patch(Patch patch) {
      ClassNode target = patch.getTargetClass();
      if (!BetterFpsHelper.getConfig().preallocateMemory) {
         FieldNode memory = ASMUtils.findField(target, Mappings.F_memoryReserve);
         if (memory != null) {
            target.fields.remove(memory);

            for (MethodNode method : target.methods) {
               InsnList list = method.instructions;
               FieldInsnNode f1 = ASMUtils.findNode(list, FieldInsnNode.class, 179, 0, target.name, memory.name, memory.desc);
               if (f1 != null) {
                  AbstractInsnNode f2 = f1.getPrevious();
                  AbstractInsnNode f3 = f2.getPrevious();
                  list.remove(f3);
                  list.remove(f2);
                  list.remove(f1);
               }
            }
         }
      }
   }
}
