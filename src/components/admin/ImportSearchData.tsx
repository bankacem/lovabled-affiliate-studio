import { useState, useRef } from "react";
import { Upload, FileSpreadsheet, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface ImportSearchDataProps {
  onImportComplete: () => void;
}

interface CSVRow {
  keyword: string;
  impressions: number;
  clicks: number;
}

export function ImportSearchData({ onImportComplete }: ImportSearchDataProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [results, setResults] = useState<{
    matched: number;
    unmatched: number;
    total: number;
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const parseCSV = (text: string): CSVRow[] => {
    const lines = text.trim().split('\n');
    if (lines.length < 2) return [];

    const headers = lines[0].toLowerCase().split(',').map(h => h.trim().replace(/"/g, ''));
    
    // Find column indices - support multiple naming conventions
    const keywordIdx = headers.findIndex(h => 
      h === 'keyword' || h === 'query' || h === 'top queries' || h === 'queries'
    );
    const impressionsIdx = headers.findIndex(h => 
      h === 'impressions' || h === 'impr' || h === 'impression'
    );
    const clicksIdx = headers.findIndex(h => 
      h === 'clicks' || h === 'click'
    );

    if (keywordIdx === -1 || impressionsIdx === -1) {
      throw new Error('CSV must have "Keyword" (or "Query") and "Impressions" columns');
    }

    const rows: CSVRow[] = [];
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''));
      if (values.length > keywordIdx && values.length > impressionsIdx) {
        const keyword = values[keywordIdx];
        const impressions = parseInt(values[impressionsIdx]) || 0;
        const clicks = clicksIdx !== -1 ? (parseInt(values[clicksIdx]) || 0) : 0;
        
        if (keyword) {
          rows.push({ keyword, impressions, clicks });
        }
      }
    }

    return rows;
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.csv')) {
      toast.error('Please upload a CSV file');
      return;
    }

    setIsProcessing(true);
    setResults(null);

    try {
      const text = await file.text();
      const csvData = parseCSV(text);

      if (csvData.length === 0) {
        toast.error('No valid data found in CSV');
        setIsProcessing(false);
        return;
      }

      // Fetch all blog posts
      const { data: posts, error: fetchError } = await supabase
        .from('blog_posts')
        .select('id, title, slug, keywords');

      if (fetchError) throw fetchError;

      let matched = 0;
      let unmatched = 0;

      // Match keywords with posts
      for (const row of csvData) {
        const keyword = row.keyword.toLowerCase();
        
        // Find matching post by title, slug, or keywords
        const matchedPost = posts?.find(post => {
          const titleMatch = post.title.toLowerCase().includes(keyword) || 
                            keyword.includes(post.title.toLowerCase().slice(0, 30));
          const slugMatch = post.slug.toLowerCase().includes(keyword.replace(/\s+/g, '-'));
          const keywordMatch = post.keywords?.some((k: string) => 
            k.toLowerCase().includes(keyword) || keyword.includes(k.toLowerCase())
          );
          
          return titleMatch || slugMatch || keywordMatch;
        });

        if (matchedPost) {
          const { error: updateError } = await supabase
            .from('blog_posts')
            .update({ 
              impressions: row.impressions,
              clicks: row.clicks
            })
            .eq('id', matchedPost.id);

          if (!updateError) {
            matched++;
          }
        } else {
          unmatched++;
        }
      }

      setResults({
        matched,
        unmatched,
        total: csvData.length
      });

      if (matched > 0) {
        toast.success(`Successfully updated ${matched} articles with search data`);
        onImportComplete();
      }

    } catch (error) {
      console.error('Import error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to import data');
    } finally {
      setIsProcessing(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Upload className="h-4 w-4" />
          Import Search Data
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5 text-primary" />
            Import Google Search Console Data
          </DialogTitle>
          <DialogDescription>
            Upload a CSV file exported from Google Search Console to update article impressions and clicks.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* CSV Format Guide */}
          <div className="bg-muted/50 rounded-lg p-4 text-sm">
            <p className="font-medium mb-2">Expected CSV format:</p>
            <div className="bg-background rounded border p-2 font-mono text-xs overflow-x-auto">
              <div className="text-muted-foreground">Keyword,Impressions,Clicks</div>
              <div>bachelorette party shirts,1926,45</div>
              <div>v neck style guide,537,12</div>
            </div>
            <p className="text-muted-foreground mt-2 text-xs">
              Columns: Query/Keyword, Impressions, Clicks (optional)
            </p>
          </div>

          {/* Upload Area */}
          <div className="relative">
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={handleFileUpload}
              disabled={isProcessing}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
            />
            <div className={`
              border-2 border-dashed rounded-lg p-8 text-center transition-colors
              ${isProcessing ? 'border-muted bg-muted/30' : 'border-primary/30 hover:border-primary/50 hover:bg-primary/5'}
            `}>
              {isProcessing ? (
                <div className="flex flex-col items-center gap-2">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <p className="text-sm text-muted-foreground">Processing CSV...</p>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2">
                  <Upload className="h-8 w-8 text-muted-foreground" />
                  <p className="text-sm font-medium">Click to upload CSV</p>
                  <p className="text-xs text-muted-foreground">or drag and drop</p>
                </div>
              )}
            </div>
          </div>

          {/* Results */}
          {results && (
            <div className="bg-muted/50 rounded-lg p-4 space-y-2">
              <p className="font-medium text-sm">Import Results:</p>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>{results.matched} articles matched</span>
                </div>
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-yellow-500" />
                  <span>{results.unmatched} unmatched</span>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                Total rows processed: {results.total}
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
