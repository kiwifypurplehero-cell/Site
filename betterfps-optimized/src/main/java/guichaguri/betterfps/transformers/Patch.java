package guichaguri.betterfps.transformers;

import guichaguri.betterfps.BetterFpsHelper;
import guichaguri.betterfps.transformers.annotations.Copy;
import guichaguri.betterfps.transformers.annotations.Patcher;
import guichaguri.betterfps.transformers.annotations.Reference;
import java.util.HashMap;
import org.objectweb.asm.Type;
import org.objectweb.asm.tree.AnnotationNode;
import org.objectweb.asm.tree.ClassNode;
import org.objectweb.asm.tree.FieldNode;
import org.objectweb.asm.tree.MethodNode;

public class Patch {
   private final ClassNode sourceClass;
   private final ClassNode targetClass;
   private final HashMap<String, MethodNode> refMethods = new HashMap<>();
   private final HashMap<String, FieldNode> refFields = new HashMap<>();

   Patch(ClassNode source, ClassNode target) {
      this.sourceClass = source;
      this.targetClass = target;
   }

   public ClassNode getSourceClass() {
      return this.sourceClass;
   }

   public ClassNode getTargetClass() {
      return this.targetClass;
   }

   public MethodNode getMethod(String refName) {
      return this.refMethods.get(refName);
   }

   public FieldNode getField(String refName) {
      return this.refFields.get(refName);
   }

   protected void copy() {
      for (MethodNode method : this.sourceClass.methods) {
         if (Conditions.shouldPatch(method.invisibleAnnotations)) {
            AnnotationNode copy = ASMUtils.getAnnotation(method.invisibleAnnotations, Copy.class);
            if (copy != null) {
               Copy.Mode mode = ASMUtils.getAnnotationValue(copy, "value", Copy.Mode.class, Copy.Mode.COPY);
               if (mode == Copy.Mode.APPEND) {
                  ASMUtils.appendMethod(this.sourceClass, this.targetClass, method);
               } else if (mode == Copy.Mode.PREPEND) {
                  ASMUtils.prependMethod(this.sourceClass, this.targetClass, method);
               } else {
                  ASMUtils.copyMethod(this.sourceClass, this.targetClass, method, mode == Copy.Mode.REPLACE);
               }
            }
         }
      }

      for (FieldNode field : this.sourceClass.fields) {
         if (Conditions.shouldPatch(field.invisibleAnnotations)) {
            AnnotationNode copy = ASMUtils.getAnnotation(field.invisibleAnnotations, Copy.class);
            if (copy != null) {
               Copy.Mode mode = ASMUtils.getAnnotationValue(copy, "value", Copy.Mode.class, Copy.Mode.COPY);
               ASMUtils.copyField(this.sourceClass, this.targetClass, field, mode == Copy.Mode.REPLACE);
            }
         }
      }

      for (String i : this.sourceClass.interfaces) {
         if (!this.targetClass.interfaces.contains(i)) {
            this.targetClass.interfaces.add(i);
         }
      }
   }

   protected void patch() {
      AnnotationNode patcher = ASMUtils.getAnnotation(this.sourceClass.invisibleAnnotations, Patcher.class);
      if (patcher != null) {
         Type patcherClass = ASMUtils.getAnnotationValue(patcher, "value", Type.class);

         try {
            Class c = Class.forName(patcherClass.getClassName());
            IClassPatcher cp = (IClassPatcher)c.newInstance();
            this.findReferences();
            cp.patch(this);
         } catch (Exception var5) {
            BetterFpsHelper.LOG.error("Couldn't patch class {} with {}", this.targetClass.name, this.sourceClass.name);
            BetterFpsHelper.LOG.catching(var5);
         }
      }
   }

   private void findReferences() {
      for (MethodNode method : this.sourceClass.methods) {
         AnnotationNode reference = ASMUtils.getAnnotation(method.invisibleAnnotations, Reference.class);
         if (reference != null) {
            this.refMethods.put(ASMUtils.getAnnotationValue(reference, "value"), method);
         }
      }

      for (FieldNode field : this.sourceClass.fields) {
         AnnotationNode reference = ASMUtils.getAnnotation(field.invisibleAnnotations, Reference.class);
         if (reference != null) {
            this.refFields.put(ASMUtils.getAnnotationValue(reference, "value"), field);
         }
      }
   }
}
