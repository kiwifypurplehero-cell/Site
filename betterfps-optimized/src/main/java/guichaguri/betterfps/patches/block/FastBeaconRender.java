package guichaguri.betterfps.patches.block;

import bus.l;
import bus.r;
import guichaguri.betterfps.transformers.annotations.Condition;
import guichaguri.betterfps.transformers.annotations.Copy;

@Condition("fastBeaconBeamRender")
public abstract class FastBeaconRender extends bwv {
   @Copy(Copy.Mode.REPLACE)
   public static void renderBeamSegment(
      double x,
      double y,
      double z,
      double partialTicks,
      double scale,
      double worldTime,
      int beamY,
      int beamHeight,
      float[] colors,
      double p_188205_15_,
      double p_188205_17_
   ) {
      int maxY = beamY + beamHeight;
      bus.b(3553, 10242, 10497);
      bus.b(3553, 10243, 10497);
      bus.g();
      bus.r();
      bus.l();
      bus.a(true);
      bus.a(r.l, l.e, r.e, l.n);
      bve tessellator = bve.a();
      buk vertexbuffer = tessellator.c();
      double time = worldTime + partialTicks;
      double d1 = beamHeight < 0 ? time : -time;
      double d2 = rk.h(d1 * 0.2 - rk.c(d1 * 0.1));
      float r = colors[0];
      float g = colors[1];
      float b = colors[2];
      double d3 = time * 0.025 * -1.5;
      double d4 = 0.5 + Math.cos(d3 + (Math.PI * 3.0 / 4.0)) * p_188205_15_;
      double d5 = 0.5 + Math.sin(d3 + (Math.PI * 3.0 / 4.0)) * p_188205_15_;
      double d6 = 0.5 + Math.cos(d3 + (Math.PI / 4)) * p_188205_15_;
      double d7 = 0.5 + Math.sin(d3 + (Math.PI / 4)) * p_188205_15_;
      double d8 = 0.5 + Math.cos(d3 + (Math.PI * 5.0 / 4.0)) * p_188205_15_;
      double d9 = 0.5 + Math.sin(d3 + (Math.PI * 5.0 / 4.0)) * p_188205_15_;
      double d10 = 0.5 + Math.cos(d3 + (Math.PI * 7.0 / 4.0)) * p_188205_15_;
      double d11 = 0.5 + Math.sin(d3 + (Math.PI * 7.0 / 4.0)) * p_188205_15_;
      double d14 = -1.0 + d2;
      double d15 = beamHeight * scale * (0.5 / p_188205_15_) + d14;
      vertexbuffer.a(7, cdy.i);
      vertexbuffer.b(x + d4, y + maxY, z + d5).a(1.0, d15).a(r, g, b, 1.0F).d();
      vertexbuffer.b(x + d4, y + beamY, z + d5).a(1.0, d14).a(r, g, b, 1.0F).d();
      vertexbuffer.b(x + d6, y + beamY, z + d7).a(0.0, d14).a(r, g, b, 1.0F).d();
      vertexbuffer.b(x + d6, y + maxY, z + d7).a(0.0, d15).a(r, g, b, 1.0F).d();
      vertexbuffer.b(x + d10, y + maxY, z + d11).a(1.0, d15).a(r, g, b, 1.0F).d();
      vertexbuffer.b(x + d10, y + beamY, z + d11).a(1.0, d14).a(r, g, b, 1.0F).d();
      vertexbuffer.b(x + d8, y + beamY, z + d9).a(0.0, d14).a(r, g, b, 1.0F).d();
      vertexbuffer.b(x + d8, y + maxY, z + d9).a(0.0, d15).a(r, g, b, 1.0F).d();
      vertexbuffer.b(x + d6, y + maxY, z + d7).a(1.0, d15).a(r, g, b, 1.0F).d();
      vertexbuffer.b(x + d6, y + beamY, z + d7).a(1.0, d14).a(r, g, b, 1.0F).d();
      vertexbuffer.b(x + d10, y + beamY, z + d11).a(0.0, d14).a(r, g, b, 1.0F).d();
      vertexbuffer.b(x + d10, y + maxY, z + d11).a(0.0, d15).a(r, g, b, 1.0F).d();
      vertexbuffer.b(x + d8, y + maxY, z + d9).a(1.0, d15).a(r, g, b, 1.0F).d();
      vertexbuffer.b(x + d8, y + beamY, z + d9).a(1.0, d14).a(r, g, b, 1.0F).d();
      vertexbuffer.b(x + d4, y + beamY, z + d5).a(0.0, d14).a(r, g, b, 1.0F).d();
      vertexbuffer.b(x + d4, y + maxY, z + d5).a(0.0, d15).a(r, g, b, 1.0F).d();
      tessellator.b();
      bus.f();
      bus.y();
   }
}
