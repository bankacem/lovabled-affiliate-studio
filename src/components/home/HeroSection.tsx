import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, Sparkles, Star, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";

export function HeroSection() {
  return (
    <section className="relative overflow-hidden py-20 md:py-32">
      {/* Background */}
      <div className="absolute inset-0 bg-mesh" />
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/50 to-background" />
      
      {/* Decorative elements */}
      <div className="absolute top-20 left-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
      
      {/* Floating elements */}
      <motion.div
        animate={{ y: [0, -15, 0] }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-32 right-[20%] hidden lg:block"
      >
        <div className="glass-card rounded-2xl p-4 shadow-lg">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-500/20 rounded-full flex items-center justify-center">
              <Star className="w-5 h-5 text-amber-500" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">تصاميم مميزة</p>
              <p className="text-xs text-muted-foreground">+100 تصميم</p>
            </div>
          </div>
        </div>
      </motion.div>

      <motion.div
        animate={{ y: [0, 10, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        className="absolute bottom-40 left-[15%] hidden lg:block"
      >
        <div className="glass-card rounded-2xl p-4 shadow-lg">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-500/20 rounded-full flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-emerald-500" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">مبيعات متزايدة</p>
              <p className="text-xs text-muted-foreground">أفضل العروض</p>
            </div>
          </div>
        </div>
      </motion.div>

      <div className="container relative mx-auto px-4 md:px-6">
        <div className="mx-auto max-w-4xl text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-5 py-2 text-sm font-medium text-primary border border-primary/20">
              <Sparkles className="h-4 w-4" />
              مجموعة تصاميم حصرية
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="mt-8 font-display text-4xl font-bold tracking-tight text-foreground sm:text-5xl md:text-6xl lg:text-7xl text-balance"
          >
            اكتشف تصاميم{" "}
            <span className="text-gradient relative">
              فريدة
              <svg className="absolute -bottom-2 left-0 w-full" viewBox="0 0 200 12" fill="none">
                <path d="M2 8C50 2 150 2 198 8" stroke="currentColor" strokeWidth="3" strokeLinecap="round" className="text-primary/30"/>
              </svg>
            </span>{" "}
            للطباعة
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mt-6 text-lg text-muted-foreground md:text-xl max-w-2xl mx-auto"
          >
            تصفح مجموعتنا المختارة من التصاميم المذهلة للتيشيرتات والهوديز والأكواب والملصقات. تسوق من TeePublic و Redbubble
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row"
          >
            <Button asChild variant="hero" size="xl" className="group">
              <Link to="/designs">
                تصفح التصاميم
                <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
              </Link>
            </Button>
            <Button asChild variant="hero-outline" size="xl">
              <Link to="/blog">اقرأ المدونة</Link>
            </Button>
          </motion.div>

          {/* Trust badges */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            className="mt-16 flex flex-wrap items-center justify-center gap-8 text-muted-foreground"
          >
            <div className="flex items-center gap-2">
              <div className="flex -space-x-2">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="w-8 h-8 rounded-full bg-secondary border-2 border-background" />
                ))}
              </div>
              <span className="text-sm">+500 عميل سعيد</span>
            </div>
            <div className="h-6 w-px bg-border hidden sm:block" />
            <div className="flex items-center gap-2">
              <div className="flex text-amber-500">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Star key={i} className="w-4 h-4 fill-current" />
                ))}
              </div>
              <span className="text-sm">تقييم 4.9/5</span>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
