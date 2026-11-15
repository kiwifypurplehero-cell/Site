package guichaguri.betterfps.tweaker;

import java.io.IOException;
import java.io.InputStream;
import org.apache.commons.io.IOUtils;
import org.apache.commons.lang3.StringUtils;
import org.objectweb.asm.tree.FieldInsnNode;
import org.objectweb.asm.tree.FieldNode;
import org.objectweb.asm.tree.MethodInsnNode;
import org.objectweb.asm.tree.MethodNode;

public enum Mappings {
   M_StaticBlock(Mappings.Type.METHOD, "StaticBlock", "<clinit>"),
   M_Constructor(Mappings.Type.METHOD, "Constructor", "<init>"),
   C_Minecraft(Mappings.Type.CLASS, "Minecraft"),
   C_World(Mappings.Type.CLASS, "World"),
   C_Chunk(Mappings.Type.CLASS, "Chunk"),
   C_Block(Mappings.Type.CLASS, "Block"),
   C_EntityPlayer(Mappings.Type.CLASS, "EntityPlayer"),
   C_EntityPlayerSP(Mappings.Type.CLASS, "EntityPlayerSP"),
   C_MathHelper(Mappings.Type.CLASS, "MathHelper"),
   C_PrimedTNT(Mappings.Type.CLASS, "EntityTNTPrimed"),
   C_ClientBrandRetriever(Mappings.Type.CLASS, "ClientBrandRetriever"),
   C_GuiOptions(Mappings.Type.CLASS, "GuiOptions"),
   C_WorldClient(Mappings.Type.CLASS, "WorldClient"),
   C_WorldServer(Mappings.Type.CLASS, "WorldServer"),
   C_IntegratedServer(Mappings.Type.CLASS, "IntegratedServer"),
   C_DedicatedServer(Mappings.Type.CLASS, "DedicatedServer"),
   C_TileEntityBeacon(Mappings.Type.CLASS, "TileEntityBeacon"),
   C_TileEntityBeaconRenderer(Mappings.Type.CLASS, "TileEntityBeaconRenderer"),
   C_BeamSegment(Mappings.Type.CLASS, "TileEntityBeacon$BeamSegment"),
   C_TileEntityHopper(Mappings.Type.CLASS, "TileEntityHopper"),
   C_BlockHopper(Mappings.Type.CLASS, "BlockHopper"),
   C_ModelBox(Mappings.Type.CLASS, "ModelBox"),
   C_EntityRenderer(Mappings.Type.CLASS, "EntityRenderer"),
   C_IInventory(Mappings.Type.CLASS, "IInventory"),
   C_GuiContainerCreative(Mappings.Type.CLASS, "GuiContainerCreative"),
   C_RenderPlayer(Mappings.Type.CLASS, "RenderPlayer"),
   M_startGame(Mappings.Type.METHOD, "startGame"),
   M_sin(Mappings.Type.METHOD, "sin"),
   M_cos(Mappings.Type.METHOD, "cos"),
   M_tick(Mappings.Type.METHOD, "tick"),
   M_onUpdate(Mappings.Type.METHOD, "onUpdate"),
   M_updateBlocks(Mappings.Type.METHOD, "updateBlocks"),
   M_getClientModName(Mappings.Type.METHOD, "getClientModName"),
   M_freeMemory(Mappings.Type.METHOD, "freeMemory"),
   M_initGui(Mappings.Type.METHOD, "initGui"),
   M_startServer(Mappings.Type.METHOD, "startServer"),
   M_captureDroppedItems(Mappings.Type.METHOD, "captureDroppedItems"),
   M_getHopperInventory(Mappings.Type.METHOD, "getHopperInventory"),
   F_memoryReserve(Mappings.Type.FIELD, "memoryReserve"),
   F_SIN_TABLE(Mappings.Type.FIELD, "SIN_TABLE");

   public final Mappings.Type type;
   public final String identifier;
   protected String deobfName;
   protected String obfName;
   protected String ownerDeobfName;
   protected String ownerObfName;
   protected String deobfDesc;
   protected String obfDesc;

   public static void loadMappings(InputStream srg) throws IOException {
      for (String line : IOUtils.readLines(srg, "UTF-8")) {
         String[] m = line.split(" ");
         String identifier = m[m.length - 1];

         for (Mappings mp : values()) {
            if (m[0].equals("CL:")) {
               if (m.length >= 4 && mp.type == Mappings.Type.CLASS && mp.identifier.equals(identifier)) {
                  mp.deobfName = m[2];
                  mp.obfName = m[1];
               }
            } else if (m[0].equals("FD:")) {
               if (m.length >= 4 && mp.type == Mappings.Type.FIELD && mp.identifier.equals(identifier)) {
                  loadNames(m, mp, 2, 1);
               }
            } else if (m[0].equals("MD:") && m.length >= 6 && mp.type == Mappings.Type.METHOD && mp.identifier.equals(identifier)) {
               loadNames(m, mp, 3, 1);
               mp.deobfDesc = m[4];
               mp.obfDesc = m[2];
            }
         }
      }
   }

   private static void loadNames(String[] m, Mappings mp, int deobf, int obf) {
      String[] name = m[deobf].split("/");
      mp.deobfName = name[name.length - 1];
      mp.ownerDeobfName = StringUtils.join(name, "/", 0, name.length - 1);
      name = m[obf].split("/");
      mp.obfName = name[name.length - 1];
      mp.ownerObfName = StringUtils.join(name, "/", 0, name.length - 1);
   }

   private Mappings(Mappings.Type type, String identifier) {
      this.type = type;
      this.identifier = identifier;
   }

   private Mappings(Mappings.Type type, String identifier, String name) {
      this(type, identifier);
      this.deobfName = name;
      this.obfName = name;
   }

   public boolean is(String n) {
      n = n.replaceAll("\\.", "/");
      return this.deobfName.equals(n) || this.obfName.equals(n);
   }

   public boolean isObf(String n) {
      return !this.deobfName.equals(this.obfName) && this.obfName.equals(n.replaceAll("\\.", "/"));
   }

   public boolean isDesc(String n) {
      return this.deobfDesc != null && n.equals(this.deobfDesc) || this.obfDesc != null && n.equals(this.obfDesc);
   }

   public boolean isOwner(String n) {
      n = n.replaceAll("\\.", "/");
      return this.ownerDeobfName == null || this.ownerObfName == null || n.equals(this.ownerDeobfName) || n.equals(this.ownerObfName);
   }

   public boolean is(String n, String d) {
      return this.is(n) && this.isDesc(d);
   }

   public boolean is(MethodNode method) {
      return (method.name.equals(this.deobfName) || method.name.equals(this.obfName)) && this.isDesc(method.desc);
   }

   public boolean is(FieldNode field) {
      return (field.name.equals(this.deobfName) || field.name.equals(this.obfName)) && this.isDesc(field.desc);
   }

   public boolean is(MethodInsnNode method) {
      return this.is(method.name) && this.isDesc(method.desc) && this.isOwner(method.owner);
   }

   public boolean is(FieldInsnNode field) {
      return this.is(field.name) && this.isDesc(field.desc) && this.isOwner(field.owner);
   }

   @Override
   public String toString() {
      return this.identifier;
   }

   static enum Type {
      CLASS,
      METHOD,
      FIELD;
   }
}
