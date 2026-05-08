import { useState } from "react";
import { motion } from "framer-motion";
import { Download, Link as LinkIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

interface CustomImportProps {
  onImport: (storeUrl: string, platform: "redbubble" | "teepublic") => void;
  isImporting: boolean;
}

export function CustomImport({ onImport, isImporting }: CustomImportProps) {
  const [storeUrl, setStoreUrl] = useState("");
  const [platform, setPlatform] = useState<"redbubble" | "teepublic">("redbubble");

  const handleImport = () => {
    if (!storeUrl) {
      toast.error("Please enter a store URL");
      return;
    }

    // Validate URL format
    if (platform === "redbubble" && !storeUrl.includes("redbubble.com")) {
      toast.error("Please enter a valid Redbubble URL");
      return;
    }
    if (platform === "teepublic" && !storeUrl.includes("teepublic.com")) {
      toast.error("Please enter a valid TeePublic URL");
      return;
    }

    onImport(storeUrl, platform);
  };

  return (
    <Card className="p-6">
      <div className="mb-4">
        <h3 className="font-semibold text-foreground flex items-center gap-2">
          <LinkIcon className="w-5 h-5" />
          Quick Import
        </h3>
        <p className="text-sm text-muted-foreground">
          Import designs from any Redbubble or TeePublic store URL
        </p>
      </div>

      <div className="space-y-4">
        <div className="grid gap-4 md:grid-cols-3">
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="store-url">Store URL</Label>
            <Input
              id="store-url"
              value={storeUrl}
              onChange={(e) => setStoreUrl(e.target.value)}
              placeholder={
                platform === "redbubble"
                  ? "https://www.redbubble.com/people/username/shop"
                  : "https://www.teepublic.com/user/username"
              }
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="platform">Platform</Label>
            <Select
              value={platform}
              onValueChange={(value: "redbubble" | "teepublic") => setPlatform(value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="redbubble">Redbubble</SelectItem>
                <SelectItem value="teepublic">TeePublic</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <Button onClick={handleImport} disabled={isImporting} className="w-full md:w-auto">
          {isImporting ? (
            <>
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              >
                <Download className="w-4 h-4 mr-2" />
              </motion.div>
              Importing...
            </>
          ) : (
            <>
              <Download className="w-4 h-4 mr-2" />
              Import Designs
            </>
          )}
        </Button>
      </div>

      <div className="mt-4 p-4 bg-muted/50 rounded-lg">
        <p className="text-sm text-muted-foreground">
          <strong>Tip:</strong> The import will fetch up to 15 designs from the store page. 
          Make sure the store URL points to the main shop page.
        </p>
        <div className="mt-2 text-xs text-muted-foreground">
          <p><strong>Redbubble:</strong> https://www.redbubble.com/people/[username]/shop</p>
          <p><strong>TeePublic:</strong> https://www.teepublic.com/user/[username]</p>
        </div>
      </div>
    </Card>
  );
}
