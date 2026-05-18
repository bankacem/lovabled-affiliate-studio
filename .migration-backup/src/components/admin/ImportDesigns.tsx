import { useState } from "react";
import { motion } from "framer-motion";
import { Download, Loader2, CheckCircle, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface ImportResult {
  success: boolean;
  message?: string;
  designs?: number;
  error?: string;
}

export function ImportDesigns() {
  const [isImporting, setIsImporting] = useState<string | null>(null);
  const [results, setResults] = useState<{ redbubble?: ImportResult; teepublic?: ImportResult }>({});

  const importFromStore = async (source: "redbubble" | "teepublic") => {
    setIsImporting(source);
    
    const storeUrls = {
      redbubble: "https://www.redbubble.com/people/rengone/shop",
      teepublic: "https://www.teepublic.com/user/bankacem"
    };

    try {
      const { data, error } = await supabase.functions.invoke("import-designs", {
        body: { storeUrl: storeUrls[source], source }
      });

      if (error) {
        throw new Error(error.message);
      }

      setResults(prev => ({ ...prev, [source]: data }));
      
      if (data.success) {
        toast.success(`Imported ${data.designs} designs from ${source === "redbubble" ? "Redbubble" : "TeePublic"}!`);
      } else {
        toast.error(data.error || "Import failed");
      }
    } catch (error: any) {
      console.error("Import error:", error);
      setResults(prev => ({ 
        ...prev, 
        [source]: { success: false, error: error.message } 
      }));
      toast.error(`Failed to import from ${source}: ${error.message}`);
    } finally {
      setIsImporting(null);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="text-center">
        <h2 className="font-display text-2xl font-bold text-foreground">
          Import Your Designs
        </h2>
        <p className="mt-2 text-muted-foreground">
          Automatically import designs from your TeePublic and Redbubble stores
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {/* Redbubble Import */}
        <Card className="p-6 space-y-4">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-red-500/10">
              <span className="text-xl font-bold text-red-500">RB</span>
            </div>
            <div>
              <h3 className="font-display font-semibold text-card-foreground">Redbubble</h3>
              <p className="text-sm text-muted-foreground">rengone</p>
            </div>
          </div>
          
          <Button
            onClick={() => importFromStore("redbubble")}
            disabled={isImporting !== null}
            className="w-full"
            variant={results.redbubble?.success ? "outline" : "coral"}
          >
            {isImporting === "redbubble" ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Importing...
              </>
            ) : results.redbubble?.success ? (
              <>
                <CheckCircle className="h-4 w-4" />
                Imported {results.redbubble.designs} designs
              </>
            ) : (
              <>
                <Download className="h-4 w-4" />
                Import from Redbubble
              </>
            )}
          </Button>

          {results.redbubble?.error && (
            <div className="flex items-center gap-2 text-sm text-destructive">
              <AlertCircle className="h-4 w-4" />
              {results.redbubble.error}
            </div>
          )}
        </Card>

        {/* TeePublic Import */}
        <Card className="p-6 space-y-4">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-500/10">
              <span className="text-xl font-bold text-blue-500">TP</span>
            </div>
            <div>
              <h3 className="font-display font-semibold text-card-foreground">TeePublic</h3>
              <p className="text-sm text-muted-foreground">bankacem</p>
            </div>
          </div>
          
          <Button
            onClick={() => importFromStore("teepublic")}
            disabled={isImporting !== null}
            className="w-full"
            variant={results.teepublic?.success ? "outline" : "coral"}
          >
            {isImporting === "teepublic" ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Importing...
              </>
            ) : results.teepublic?.success ? (
              <>
                <CheckCircle className="h-4 w-4" />
                Imported {results.teepublic.designs} designs
              </>
            ) : (
              <>
                <Download className="h-4 w-4" />
                Import from TeePublic
              </>
            )}
          </Button>

          {results.teepublic?.error && (
            <div className="flex items-center gap-2 text-sm text-destructive">
              <AlertCircle className="h-4 w-4" />
              {results.teepublic.error}
            </div>
          )}
        </Card>
      </div>

      <p className="text-center text-xs text-muted-foreground">
        Note: Import may take a few minutes depending on the number of designs.
        Only the first 20 designs from each store will be imported initially.
      </p>
    </motion.div>
  );
}
