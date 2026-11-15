package guichaguri.betterfps.transformers;

import guichaguri.betterfps.BetterFpsConfig;
import guichaguri.betterfps.BetterFpsHelper;
import guichaguri.betterfps.tweaker.BetterFpsTweaker;
import guichaguri.betterfps.tweaker.Mappings;
import java.io.InputStream;
import java.util.LinkedHashMap;
import net.minecraft.launchwrapper.IClassTransformer;
import org.apache.commons.io.IOUtils;
import org.objectweb.asm.tree.AbstractInsnNode;
import org.objectweb.asm.tree.ClassNode;
import org.objectweb.asm.tree.FieldInsnNode;
import org.objectweb.asm.tree.FieldNode;
import org.objectweb.asm.tree.InsnList;
import org.objectweb.asm.tree.LabelNode;
import org.objectweb.asm.tree.MethodInsnNode;
import org.objectweb.asm.tree.MethodNode;

public class MathTransformer implements IClassTransformer {
    // Ordem de preferência: UltraFastMath (melhor para dispositivos fracos) primeiro
    private static final LinkedHashMap<BetterFpsConfig.AlgorithmType, String> algorithmClasses = new LinkedHashMap<>();
    private final String METHOD_SIN = "sin";
    private final String METHOD_COS = "cos";

    public byte[] transform(String name, String transformedName, byte[] bytes) {
        if (bytes == null) {
            return null;
        } else {
            if (Mappings.C_MathHelper.is(name)) {
                try {
                    return this.patchMath(bytes);
                } catch (Exception var5) {
                    BetterFpsHelper.LOG.error("Couldn't patch math algorithms", var5);
                }
            }

            return bytes;
        }
    }

    private byte[] patchMath(byte[] bytes) throws Exception {
        BetterFpsConfig config = BetterFpsHelper.getConfig();
        String algorithmClass = algorithmClasses.get(config.algorithm);
        if (algorithmClass == null) {
            BetterFpsHelper.LOG.error("The algorithm is invalid. We're going to use UltraFastMath instead.");
            config.algorithm = BetterFpsConfig.AlgorithmType.ULTRA_FAST;
            return bytes;
        } else if (config.algorithm == BetterFpsConfig.AlgorithmType.VANILLA) {
            BetterFpsHelper.LOG.info("No algorithm for patching, Vanilla Algorithm will be used");
            return bytes;
        } else {
            BetterFpsHelper.LOG.info("Patching math utils with \"{}\" algorithm", config.algorithm);
            InputStream in = BetterFpsTweaker.getResourceStream(algorithmClass + ".class");
            if (in == null) {
                BetterFpsHelper.LOG.error("Could not load algorithm class: {}", algorithmClass);
                return bytes;
            } else {
                ClassNode mathClass = ASMUtils.readClass(IOUtils.toByteArray(in), 0);
                ClassNode classNode = ASMUtils.readClass(bytes, 0);
                MethodNode init = ASMUtils.findMethod(classNode, "<clinit>", "()V");
                MethodNode sin = ASMUtils.findMethod(classNode, Mappings.M_sin);
                MethodNode cos = ASMUtils.findMethod(classNode, Mappings.M_cos);
                boolean patchedSin = false;
                boolean patchedCos = false;

                // Copy all fields from algorithm class (lookup tables, constants)
                for (FieldNode f : mathClass.fields) {
                    ASMUtils.copyField(mathClass, classNode, f, true);
                }

                for (MethodNode m : mathClass.methods) {
                    if (m.name.equals("sin")) {
                        if (sin != null) {
                            m.name = sin.name;
                        }
                        ASMUtils.copyMethod(mathClass, classNode, m, sin, true);
                        patchedSin = true;
                    } else if (m.name.equals("cos")) {
                        if (cos != null) {
                            m.name = cos.name;
                        }
                        ASMUtils.copyMethod(mathClass, classNode, m, cos, true);
                        patchedCos = true;
                    } else if (m.name.equals("<clinit>")) {
                        m.name = "init";
                        ASMUtils.appendMethod(mathClass, classNode, m, init);
                    } else {
                        // Copy helper methods (sinDeg, cosDeg, atan2, sqrt, etc.)
                        ASMUtils.copyMethod(mathClass, classNode, m, true);
                    }

                    // Replace calls to old sin/cos with new methods
                    if (sin != null) {
                        this.replaceCallReferences(classNode.name, "sin", sin.name, m);
                    }
                    if (cos != null) {
                        this.replaceCallReferences(classNode.name, "cos", cos.name, m);
                    }
                }

                // Remove vanilla SIN_TABLE field since we use our own lookup tables
                FieldNode sinTable = ASMUtils.findField(classNode, Mappings.F_SIN_TABLE);
                if (patchedSin && patchedCos && sinTable != null && init != null) {
                    classNode.fields.remove(sinTable);
                    InsnList inst = init.instructions;
                    LabelNode currentLabel = null;

                    for (int i = 0; i < inst.size(); i++) {
                        AbstractInsnNode node = inst.get(i);
                        if (node instanceof LabelNode) {
                            currentLabel = (LabelNode)node;
                        } else if (node instanceof FieldInsnNode && currentLabel != null) {
                            FieldInsnNode f = (FieldInsnNode)node;
                            if (classNode.name.equals(f.owner) && sinTable.name.equals(f.name) && sinTable.desc.equals(f.desc)) {
                                i = inst.indexOf(currentLabel);
                                ASMUtils.removeLabelSection(inst, currentLabel);
                            }
                        }
                    }
                }

                Conditions.patched.add(Mappings.C_MathHelper);
                return ASMUtils.writeClass(classNode, 0);
            }
        }
    }

    private void replaceCallReferences(String clazz, String needle, String replacement, MethodNode method) {
        InsnList list = method.instructions;

        for (int i = 0; i < list.size(); i++) {
            AbstractInsnNode node = list.get(i);
            if (node instanceof MethodInsnNode) {
                MethodInsnNode m = (MethodInsnNode)node;
                if (m.owner.equals(clazz) && m.name.equals(needle)) {
                    m.name = replacement;
                }
            }
        }
    }

    static {
        // ULTRA_FAST primeiro - melhor para dispositivos fracos (2KB RAM, ~5x speedup)
        algorithmClasses.put(BetterFpsConfig.AlgorithmType.ULTRA_FAST, "guichaguri/betterfps/math/UltraFastMath");

        // RivensHalf - equilíbrio memória/precisão (8KB RAM, ~3x speedup)
        algorithmClasses.put(BetterFpsConfig.AlgorithmType.RIVENS_HALF, "guichaguri/betterfps/math/RivensHalfMath");

        // RivensFull - precisão total (16KB RAM, ~3x speedup)
        algorithmClasses.put(BetterFpsConfig.AlgorithmType.RIVENS_FULL, "guichaguri/betterfps/math/RivensFullMath");

        // Rivens - versão original (16KB RAM)
        algorithmClasses.put(BetterFpsConfig.AlgorithmType.RIVENS, "guichaguri/betterfps/math/RivensMath");

        // Taylor - sem lookup table,纯计算 (0KB extra, ~2x speedup)
        algorithmClasses.put(BetterFpsConfig.AlgorithmType.TAYLORS, "guichaguri/betterfps/math/TaylorMath");

        // JavaMath - fallback para Math.sin/cos nativo
        algorithmClasses.put(BetterFpsConfig.AlgorithmType.JAVA, "guichaguri/betterfps/math/JavaMath");

        // Random - para testes
        algorithmClasses.put(BetterFpsConfig.AlgorithmType.RANDOM, "guichaguri/betterfps/math/RandomMath");

        // LibGDX - se disponível
        algorithmClasses.put(BetterFpsConfig.AlgorithmType.LIBGDX, "guichaguri/betterfps/math/LibGDXMath");
    }
}