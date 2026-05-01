import { motion } from "framer-motion";
import { Heart, Target, Users, Sparkles } from "lucide-react";
import { Layout } from "@/components/layout/Layout";

const values = [
  {
    icon: Heart,
    title: "Passion for Design",
    description:
      "We curate only the most creative and visually stunning designs that we genuinely love.",
  },
  {
    icon: Target,
    title: "Quality First",
    description:
      "Every design is handpicked for its artistic merit, uniqueness, and print quality.",
  },
  {
    icon: Users,
    title: "Community Driven",
    description:
      "We support independent artists and help connect them with design enthusiasts worldwide.",
  },
  {
    icon: Sparkles,
    title: "Always Fresh",
    description:
      "Our collection is constantly updated with the latest trends and timeless classics.",
  },
];

const About = () => {
  return (
    <Layout>
      {/* Hero */}
      <section className="bg-gradient-to-b from-secondary/50 to-background py-16 md:py-24">
        <div className="container mx-auto px-4 md:px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mx-auto max-w-3xl text-center"
          >
            <h1 className="font-display text-4xl font-bold text-foreground md:text-5xl">
              About DesignVault
            </h1>
            <p className="mt-6 text-lg text-muted-foreground leading-relaxed">
              We're passionate about connecting design lovers with unique,
              high-quality print-on-demand merchandise. Our curated collection
              features the best designs from talented artists around the world.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Mission */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4 md:px-6">
          <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <span className="text-sm font-medium text-primary">Our Mission</span>
              <h2 className="mt-2 font-display text-3xl font-bold text-foreground md:text-4xl">
                Making Great Design Accessible
              </h2>
              <p className="mt-4 text-muted-foreground leading-relaxed">
                DesignVault was born from a simple idea: everyone deserves access
                to beautiful, unique designs that express their personality. We
                scour print-on-demand platforms to find the most creative,
                well-crafted designs and bring them to you in one convenient place.
              </p>
              <p className="mt-4 text-muted-foreground leading-relaxed">
                Whether you're looking for a statement t-shirt, a cozy hoodie, a
                unique coffee mug, or fun stickers, our carefully curated
                collection has something for every style and interest.
              </p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="relative"
            >
              <div className="aspect-square overflow-hidden rounded-2xl bg-secondary">
                <img
                  src="https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&h=600&fit=crop"
                  alt="Design workspace"
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="absolute -bottom-6 -left-6 rounded-xl bg-primary p-4 text-primary-foreground shadow-lg">
                <p className="text-2xl font-bold">100+</p>
                <p className="text-sm">Curated Designs</p>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="bg-secondary/30 py-16 md:py-24">
        <div className="container mx-auto px-4 md:px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center"
          >
            <h2 className="font-display text-3xl font-bold text-foreground md:text-4xl">
              Our Values
            </h2>
            <p className="mt-2 text-muted-foreground">
              What drives us every day
            </p>
          </motion.div>

          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {values.map((value, index) => (
              <motion.div
                key={value.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="rounded-xl bg-card p-6 shadow-card"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                  <value.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="mt-4 font-display text-lg font-semibold text-card-foreground">
                  {value.title}
                </h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  {value.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Affiliate Disclosure */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4 md:px-6">
          <div className="mx-auto max-w-2xl rounded-2xl bg-secondary/50 p-8 text-center">
            <h2 className="font-display text-xl font-semibold text-foreground">
              Affiliate Disclosure
            </h2>
            <p className="mt-4 text-sm text-muted-foreground leading-relaxed">
              DesignVault participates in affiliate programs with TeePublic,
              Redbubble, and other print-on-demand platforms. When you make a
              purchase through our links, we may earn a small commission at no
              extra cost to you. This helps us keep the site running and continue
              discovering great designs for you. Thank you for your support!
            </p>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default About;
