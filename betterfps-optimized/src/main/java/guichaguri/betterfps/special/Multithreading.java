package guichaguri.betterfps.special;

public class Multithreading extends Thread {
   private final Multithreading.IMultithreaded m;
   private final String task;

   public static Thread start(Multithreading.IMultithreaded m, String task, boolean async) {
      if (async) {
         return start(m, task);
      } else {
         m.run(task);
         return null;
      }
   }

   public static Thread start(Multithreading.IMultithreaded m, String task) {
      Multithreading thread = new Multithreading(m, task) {
         @Override
         public void run() {
            super.run();
         }
      };
      thread.start();
      return thread;
   }

   public static void stop(Thread thread) {
      if (thread != null && thread.isAlive()) {
         thread.interrupt();
      }
   }

   public Multithreading(Multithreading.IMultithreaded m, String task) {
      this.m = m;
      this.task = task;
   }

   @Override
   public void run() {
      this.m.run(this.task);
   }

   public interface IMultithreaded {
      void run(String var1);
   }
}
