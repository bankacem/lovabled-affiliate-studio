import { useState } from "react";
import { motion } from "framer-motion";
import { Lock, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";

interface AdminLoginProps {
  onSuccess: () => void;
}

// Simple admin password - change this to your own secret password
const ADMIN_PASSWORD = "designvault2025";

export function AdminLogin({ onSuccess }: AdminLoginProps) {
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    // Simulate a small delay for security feel
    await new Promise((resolve) => setTimeout(resolve, 500));

    if (password === ADMIN_PASSWORD) {
      // Store auth in session (will be cleared when browser closes)
      sessionStorage.setItem("admin_auth", "true");
      onSuccess();
    } else {
      setError("كلمة المرور غير صحيحة");
    }
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-secondary via-background to-secondary/50 p-4">
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5 }}
      >
        <Card className="w-full max-w-md p-8 shadow-lg">
          <div className="text-center mb-8">
            <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
              <Lock className="w-8 h-8 text-primary" />
            </div>
            <h1 className="font-display text-2xl font-bold text-foreground">
              لوحة التحكم
            </h1>
            <p className="text-muted-foreground mt-2 text-sm">
              أدخل كلمة المرور للوصول إلى لوحة الإدارة
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative">
              <Input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="كلمة المرور"
                className="pr-10 text-right"
                dir="rtl"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>

            {error && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-destructive text-sm text-center"
              >
                {error}
              </motion.p>
            )}

            <Button
              type="submit"
              variant="coral"
              className="w-full"
              disabled={isLoading || !password}
            >
              {isLoading ? "جاري التحقق..." : "دخول"}
            </Button>
          </form>
        </Card>
      </motion.div>
    </div>
  );
}
