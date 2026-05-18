import { useState } from "react";
import { motion } from "framer-motion";
import { Lock, Mail, Eye, EyeOff, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { useAuthContext } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface AdminLoginProps {
  onSuccess: () => void;
}

export function AdminLogin({ onSuccess }: AdminLoginProps) {
  const { signIn } = useAuthContext();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    setIsLoading(true);

    const { error } = await signIn(email, password);

    if (error) {
      toast.error("كلمة المرور أو البريد الإلكتروني غير صحيح");
    } else {
      onSuccess();
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
              أدخل بيانات الدخول للوصول إلى لوحة الإدارة
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative">
              <Mail className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="البريد الإلكتروني"
                className="pr-10 text-right"
                dir="rtl"
                required
              />
            </div>

            <div className="relative">
              <Input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="كلمة المرور"
                className="pr-10 text-right"
                dir="rtl"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            <Button
              type="submit"
              variant="coral"
              className="w-full"
              disabled={isLoading || !email || !password}
            >
              {isLoading ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" />جاري التحقق...</>
              ) : (
                "دخول"
              )}
            </Button>
          </form>
        </Card>
      </motion.div>
    </div>
  );
}
