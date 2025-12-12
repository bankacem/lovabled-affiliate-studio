import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Calendar, Clock, User, Share2 } from "lucide-react";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { blogPosts } from "@/data/blogPosts";
import { toast } from "sonner";

const BlogPost = () => {
  const { id } = useParams();
  const post = blogPosts.find((p) => p.id === id);

  if (!post) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-20 text-center md:px-6">
          <h1 className="font-display text-2xl font-bold text-foreground">
            المقال غير موجود
          </h1>
          <Button asChild variant="outline" className="mt-4">
            <Link to="/blog">
              <ArrowLeft className="h-4 w-4" />
              العودة للمدونة
            </Link>
          </Button>
        </div>
      </Layout>
    );
  }

  const handleShare = async () => {
    try {
      await navigator.share({
        title: post.title,
        text: post.excerpt,
        url: window.location.href,
      });
    } catch {
      await navigator.clipboard.writeText(window.location.href);
      toast.success("تم نسخ الرابط!");
    }
  };

  return (
    <Layout>
      <article className="py-8 md:py-12">
        <div className="container mx-auto px-4 md:px-6">
          {/* Breadcrumb */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mb-6"
          >
            <Link
              to="/blog"
              className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              العودة للمدونة
            </Link>
          </motion.div>

          <div className="mx-auto max-w-3xl">
            {/* Header */}
            <motion.header
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <span className="inline-block rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
                {post.category}
              </span>
              <h1 className="mt-4 font-display text-3xl font-bold text-foreground md:text-4xl lg:text-5xl">
                {post.title}
              </h1>
              <div className="mt-6 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <User className="h-4 w-4" />
                  {post.author}
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  {new Date(post.date).toLocaleDateString("ar-SA", {
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                  })}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  {post.readTime}
                </span>
                <button
                  onClick={handleShare}
                  className="flex items-center gap-1 text-primary hover:underline"
                >
                  <Share2 className="h-4 w-4" />
                  مشاركة
                </button>
              </div>
            </motion.header>

            {/* Featured Image */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="mt-8 overflow-hidden rounded-2xl"
            >
              <img
                src={post.imageUrl}
                alt={post.title}
                className="h-full w-full object-cover"
              />
            </motion.div>

            {/* Content */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="prose prose-lg mt-10 max-w-none text-foreground prose-headings:font-display prose-headings:text-foreground prose-p:text-muted-foreground prose-a:text-primary"
            >
              {post.content.split("\n\n").map((paragraph, index) => (
                <p key={index}>{paragraph}</p>
              ))}
            </motion.div>
          </div>
        </div>
      </article>
    </Layout>
  );
};

export default BlogPost;
