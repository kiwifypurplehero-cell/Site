package guichaguri.betterfps.patchers;

import guichaguri.betterfps.transformers.ASMUtils;
import guichaguri.betterfps.transformers.IClassPatcher;
import guichaguri.betterfps.transformers.Patch;
import guichaguri.betterfps.tweaker.Mappings;
import java.util.List;
import org.objectweb.asm.tree.AbstractInsnNode;
import org.objectweb.asm.tree.ClassNode;
import org.objectweb.asm.tree.InsnList;
import org.objectweb.asm.tree.JumpInsnNode;
import org.objectweb.asm.tree.LocalVariableNode;
import org.objectweb.asm.tree.MethodNode;
import org.objectweb.asm.tree.VarInsnNode;

public class FastHopperPatcher implements IClassPatcher {
   public static final String PICKUP_ITEMS = "pickupItems";

   @Override
   public void patch(Patch patch) {
      ClassNode source = patch.getSourceClass();
      ClassNode target = patch.getTargetClass();
      MethodNode method = ASMUtils.findMethod(target, Mappings.M_captureDroppedItems);
      if (method != null) {
         MethodNode pickupItem = patch.getMethod("pickupItems");
         InsnList inst = method.instructions;
         List<JumpInsnNode> ifNullNodes = ASMUtils.findNodes(inst, JumpInsnNode.class, 198);
         LocalVariableNode inv = ASMUtils.findVariable(method, Mappings.C_IInventory);
         if (ifNullNodes != null && !ifNullNodes.isEmpty() && inv != null) {
            JumpInsnNode ifNull = null;
            JumpInsnNode ifEnd = null;

            for (JumpInsnNode node : ifNullNodes) {
               AbstractInsnNode previous = node.getPrevious();
               if (previous instanceof VarInsnNode && ((VarInsnNode)previous).var == inv.index) {
                  ifNull = node;
                  break;
               }
            }

            if (ifNull != null) {
               for (int i = inst.indexOf(ifNull.label) - 1; i >= 0; i--) {
                  AbstractInsnNode nodex = inst.get(i);
                  if (nodex instanceof JumpInsnNode && nodex.getOpcode() == 167) {
                     ifEnd = (JumpInsnNode)nodex;
                     break;
                  }
               }

               if (ifEnd != null) {
                  InsnList ifCanPickupItems = ASMUtils.insertMethod(source, pickupItem, target, method, ifNull.label, false);
                  ifCanPickupItems.add(new JumpInsnNode(153, ifEnd.label));
                  inst.insert(ifNull.label, ifCanPickupItems);
               }
            }
         }
      }
   }
}
