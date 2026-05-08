import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Image, Search, Loader2, CheckCircle2, XCircle, AlertTriangle, RefreshCw } from "lucide-react";
import { toast } from "sonner";

interface PostWithoutImage {
  id: string;
  title: string;
  meta_description: string | null;
}

interface ImageResult {
  postId: string;
  title: string;
  imageUrl: string;
  status: "pending" | "approved" | "skipped" | "saved" | "failed";
  source: "pollinations" | "unsplash";
  photographer?: string;
}

type ImageSource = "pollinations" | "unsplash" | "pollinations+unsplash";

export function MissingImageGenerator() {
  const [posts, setPosts] = useState<PostWithoutImage[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [previewMode, setPreviewMode] = useState(true);
  const [results, setResults] = useState<ImageResult[]>([]);
  const [progress, setProgress] = useState(0);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [imageSource, setImageSource] = useState<ImageSource>("pollinations+unsplash");
  const [summary, setSummary] = useState<{ added: number; skipped: number; failed: number } | null>(null);

  const scanPosts = async () => {
    setIsScanning(true);
    setPosts([]);
    setResults([]);
    setSummary(null);

    const { data, error } = await supabase
      .from("blog_posts")
      .select("id, title, meta_description")
      .or("featured_image.is.null,featured_image.eq.")
      .eq("status", "published");

    if (error) {
      toast.error("Failed to scan posts: " + error.message);
    } else {
      setPosts(data || []);
      toast.success(`Found ${data?.length || 0} posts without a featured image`);
    }
    setIsScanning(false);
  };

  const generatePollinationsUrl = (post: PostWithoutImage): string => {
    const shortTitle = post.title.length > 60 ? post.title.substring(0, 60) : post.title;
    const imagePrompt = `A premium mockup photo of a stylish t-shirt on a wooden hanger against a clean minimal background. The t-shirt features a bold graphic design with the text "${shortTitle}" printed on the front. Professional product photography, soft studio lighting, print-on-demand style, high quality, modern aesthetic, 4k`;
    const encodedPrompt = encodeURIComponent(imagePrompt);
    return `https://image.pollinations.ai/prompt/${encodedPrompt}?width=1200&height=630&model=flux&nologo=true&format=webp`;
  };

  const fetchUnsplashImage = async (title: string): Promise<{ url: string; photographer?: string } | null> => {
    try {
      const { data, error } = await supabase.functions.invoke("search-unsplash", {
        body: { query: title },
      });

      if (error || data?.error) return null;
      return { url: data.imageUrl, photographer: data.photographer };
    } catch {
      return null;
    }
  };

  const getImageForPost = async (post: PostWithoutImage): Promise<{ url: string; source: "pollinations" | "unsplash"; photographer?: string }> => {
    if (imageSource === "unsplash") {
      const unsplash = await fetchUnsplashImage(post.title);
      if (unsplash) return { url: unsplash.url, source: "unsplash", photographer: unsplash.photographer };
      // If unsplash-only fails, still return pollinations as last resort
      return { url: generatePollinationsUrl(post), source: "pollinations" };
    }

    if (imageSource === "pollinations") {
      return { url: generatePollinationsUrl(post), source: "pollinations" };
    }

    // pollinations+unsplash: try Pollinations first, fallback to Unsplash
    const pollinationsUrl = generatePollinationsUrl(post);
    try {
      const testRes = await fetch(pollinationsUrl, { method: "HEAD" });
      if (testRes.ok) return { url: pollinationsUrl, source: "pollinations" };
    } catch {
      // Pollinations failed, try Unsplash
    }

    const unsplash = await fetchUnsplashImage(post.title);
    if (unsplash) return { url: unsplash.url, source: "unsplash", photographer: unsplash.photographer };

    return { url: pollinationsUrl, source: "pollinations" };
  };

  const handleGenerateAll = async () => {
    if (posts.length === 0) return;

    setIsGenerating(true);
    setProgress(0);
    setSummary(null);

    const newResults: ImageResult[] = [];
    let added = 0, skipped = 0, failed = 0;

    for (let i = 0; i < posts.length; i++) {
      setCurrentIndex(i);
      const post = posts[i];
      const imgData = await getImageForPost(post);

      const result: ImageResult = {
        postId: post.id,
        title: post.title,
        imageUrl: imgData.url,
        status: "pending",
        source: imgData.source,
        photographer: imgData.photographer,
      };

      if (previewMode) {
        result.status = "pending";
        newResults.push(result);
        setResults([...newResults]);
        setProgress(((i + 1) / posts.length) * 100);
        await new Promise(resolve => setTimeout(resolve, 300));
      } else {
        try {
          const { error } = await supabase
            .from("blog_posts")
            .update({ featured_image: imgData.url })
            .eq("id", post.id);

          if (error) {
            result.status = "failed";
            failed++;
          } else {
            result.status = "saved";
            added++;
          }
        } catch {
          result.status = "failed";
          failed++;
        }
        newResults.push(result);
        setResults([...newResults]);
        setProgress(((i + 1) / posts.length) * 100);

        if (i < posts.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
    }

    if (!previewMode) {
      setSummary({ added, skipped, failed });
    }
    setIsGenerating(false);
  };

  const approveImage = async (index: number) => {
    const result = results[index];
    try {
      const { error } = await supabase
        .from("blog_posts")
        .update({ featured_image: result.imageUrl })
        .eq("id", result.postId);

      const updated = [...results];
      if (error) {
        updated[index].status = "failed";
        toast.error(`Failed to save image for "${result.title}"`);
      } else {
        updated[index].status = "saved";
      }
      setResults(updated);
    } catch {
      const updated = [...results];
      updated[index].status = "failed";
      setResults(updated);
    }
  };

  const skipImage = (index: number) => {
    const updated = [...results];
    updated[index].status = "skipped";
    setResults(updated);
  };

  const regenerateImage = async (index: number) => {
    const post = posts.find(p => p.id === results[index].postId);
    if (!post) return;
    const updated = [...results];

    // Toggle source on regenerate
    const currentSource = updated[index].source;
    if (currentSource === "pollinations") {
      const unsplash = await fetchUnsplashImage(post.title);
      if (unsplash) {
        updated[index].imageUrl = unsplash.url;
        updated[index].source = "unsplash";
        updated[index].photographer = unsplash.photographer;
      } else {
        updated[index].imageUrl = generatePollinationsUrl(post) + `&seed=${Date.now()}`;
      }
    } else {
      updated[index].imageUrl = generatePollinationsUrl(post) + `&seed=${Date.now()}`;
      updated[index].source = "pollinations";
      updated[index].photographer = undefined;
    }
    updated[index].status = "pending";
    setResults(updated);
  };

  const generateSingleImage = async (postId: string) => {
    const post = posts.find(p => p.id === postId);
    if (!post) return;

    const imgData = await getImageForPost(post);
    try {
      const { error } = await supabase
        .from("blog_posts")
        .update({ featured_image: imgData.url })
        .eq("id", postId);

      if (error) {
        toast.error("Failed to save image");
      } else {
        toast.success(`Image saved from ${imgData.source}!`);
        setPosts(prev => prev.filter(p => p.id !== postId));
      }
    } catch {
      toast.error("Failed to generate image");
    }
  };

  const savedCount = results.filter(r => r.status === "saved").length;
  const skippedCount = results.filter(r => r.status === "skipped").length;
  const failedCount = results.filter(r => r.status === "failed").length;
  const pendingCount = results.filter(r => r.status === "pending").length;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Image className="h-6 w-6 text-primary" />
          Generate Missing Images
        </h2>
        <p className="text-muted-foreground">
          Auto-generate featured images using Pollinations.AI with Unsplash fallback (WebP format)
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Controls */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Controls</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button onClick={scanPosts} disabled={isScanning} className="w-full" size="lg">
              {isScanning ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Scanning...</>
              ) : (
                <><Search className="h-4 w-4 mr-2" />Scan for Missing Images</>
              )}
            </Button>

            {posts.length > 0 && (
              <>
                <div className="bg-muted/50 rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold text-primary">{posts.length}</p>
                  <p className="text-sm text-muted-foreground">posts without images</p>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm">Image Source</Label>
                  <Select value={imageSource} onValueChange={(v) => setImageSource(v as ImageSource)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pollinations+unsplash">Pollinations + Unsplash Fallback</SelectItem>
                      <SelectItem value="pollinations">Pollinations Only</SelectItem>
                      <SelectItem value="unsplash">Unsplash Only</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center justify-between">
                  <Label className="text-sm">Preview Before Save</Label>
                  <Switch checked={previewMode} onCheckedChange={setPreviewMode} />
                </div>

                <Button
                  onClick={handleGenerateAll}
                  disabled={isGenerating}
                  className="w-full"
                  size="lg"
                >
                  {isGenerating ? (
                    <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Processing {currentIndex + 1}/{posts.length}</>
                  ) : (
                    <><Image className="h-4 w-4 mr-2" />Generate All Missing Images</>
                  )}
                </Button>

                {isGenerating && (
                  <div className="space-y-1">
                    <Progress value={progress} className="h-2" />
                    <p className="text-xs text-muted-foreground text-center">{Math.round(progress)}%</p>
                  </div>
                )}
              </>
            )}

            {/* Summary */}
            {(summary || results.length > 0) && (
              <div className="border-t pt-3 space-y-2">
                <p className="text-sm font-medium">Results</p>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="bg-green-500/10 rounded p-2">
                    <p className="text-lg font-bold text-green-600">{summary?.added ?? savedCount}</p>
                    <p className="text-xs text-muted-foreground">Added</p>
                  </div>
                  <div className="bg-amber-500/10 rounded p-2">
                    <p className="text-lg font-bold text-amber-600">{summary?.skipped ?? skippedCount}</p>
                    <p className="text-xs text-muted-foreground">Skipped</p>
                  </div>
                  <div className="bg-red-500/10 rounded p-2">
                    <p className="text-lg font-bold text-red-600">{summary?.failed ?? failedCount}</p>
                    <p className="text-xs text-muted-foreground">Failed</p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Results / Preview */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              Results
              {pendingCount > 0 && <Badge variant="outline">{pendingCount} pending</Badge>}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {results.length === 0 && posts.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Image className="h-12 w-12 mx-auto mb-3 opacity-20" />
                <p>Click "Scan for Missing Images" to start</p>
              </div>
            ) : results.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <p>{posts.length} posts ready. Click "Generate All" to begin.</p>
              </div>
            ) : (
              <ScrollArea className="h-[500px]">
                <div className="space-y-4 pr-2">
                  {results.map((result, index) => (
                    <div key={result.postId} className="border rounded-lg p-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-medium line-clamp-1 flex-1">{result.title}</h4>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">
                            {result.source === "unsplash" ? "📷 Unsplash" : "🎨 Pollinations"}
                          </Badge>
                          <Badge
                            variant={
                              result.status === "saved" ? "default" :
                              result.status === "skipped" ? "secondary" :
                              result.status === "failed" ? "destructive" : "outline"
                            }
                          >
                            {result.status === "saved" && <><CheckCircle2 className="h-3 w-3 mr-1" />Saved</>}
                            {result.status === "skipped" && <><AlertTriangle className="h-3 w-3 mr-1" />Skipped</>}
                            {result.status === "failed" && <><XCircle className="h-3 w-3 mr-1" />Failed</>}
                            {result.status === "pending" && "Pending"}
                          </Badge>
                        </div>
                      </div>

                      {result.photographer && (
                        <p className="text-xs text-muted-foreground">📸 Photo by {result.photographer} on Unsplash</p>
                      )}

                      {previewMode && result.status === "pending" && (
                        <>
                          <div className="aspect-[1200/630] bg-muted rounded overflow-hidden">
                            <img
                              src={result.imageUrl}
                              alt={result.title}
                              className="w-full h-full object-cover"
                              loading="lazy"
                            />
                          </div>
                          <div className="flex gap-2">
                            <Button size="sm" onClick={() => approveImage(index)} className="flex-1">
                              <CheckCircle2 className="h-3 w-3 mr-1" />Approve
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => regenerateImage(index)}>
                              <RefreshCw className="h-3 w-3 mr-1" />Try {result.source === "pollinations" ? "Unsplash" : "Pollinations"}
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => skipImage(index)}>
                              Skip
                            </Button>
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}

            {/* Individual post generation when no bulk results */}
            {results.length === 0 && posts.length > 0 && (
              <ScrollArea className="h-[500px]">
                <div className="space-y-2 pr-2">
                  {posts.map(post => (
                    <div key={post.id} className="flex items-center justify-between p-2 border rounded">
                      <span className="text-sm line-clamp-1 flex-1">{post.title}</span>
                      <Button size="sm" variant="outline" onClick={() => generateSingleImage(post.id)}>
                        <Image className="h-3 w-3 mr-1" />Generate
                      </Button>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
