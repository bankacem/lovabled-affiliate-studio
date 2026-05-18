import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Search, Target, Lightbulb, Trophy, AlertTriangle, CheckCircle2, Copy, Loader2 } from "lucide-react";

interface CompetitorEntry {
  title: string;
  estimated_word_count: number;
  main_headings: string[];
  strengths: string[];
  weaknesses: string[];
}

interface ContentGaps {
  missing_sections: string[];
  weak_explanations: string[];
  lack_of_examples: string[];
  poor_structure: string[];
}

interface OutlineSection {
  heading: string;
  subheadings?: string[];
  key_points?: string[];
  content_type?: string;
}

interface SuperiorOutline {
  suggested_title: string;
  suggested_meta_description: string;
  estimated_word_count: number;
  outline: OutlineSection[];
}

interface UnfairAdvantage {
  unique_angle: string;
  strong_opinions: string[];
  real_life_insights: string[];
  call_to_action: string;
}

interface SERPResult {
  competitor_analysis: CompetitorEntry[];
  content_gaps: ContentGaps;
  superior_outline: SuperiorOutline;
  unfair_advantage: UnfairAdvantage;
}

export function SERPAnalyzer() {
  const [keyword, setKeyword] = useState("");
  const [language, setLanguage] = useState("en");
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<SERPResult | null>(null);
  const { toast } = useToast();

  const analyze = async () => {
    if (!keyword.trim()) {
      toast({ title: "Error", description: "Please enter a keyword", variant: "destructive" });
      return;
    }

    setIsLoading(true);
    setResult(null);

    try {
      const { data, error } = await supabase.functions.invoke("serp-analysis", {
        body: { keyword: keyword.trim(), language },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      setResult(data as SERPResult);
      toast({ title: "Analysis Complete", description: "SERP analysis generated successfully" });
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "Failed to analyze", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const copyOutline = () => {
    if (!result?.superior_outline) return;
    const text = result.superior_outline.outline
      .map((s) => {
        let t = `## ${s.heading}`;
        if (s.subheadings?.length) t += "\n" + s.subheadings.map((h) => `### ${h}`).join("\n");
        if (s.key_points?.length) t += "\n" + s.key_points.map((p) => `- ${p}`).join("\n");
        return t;
      })
      .join("\n\n");
    navigator.clipboard.writeText(text);
    toast({ title: "Copied", description: "Outline copied to clipboard" });
  };

  const copyJSON = () => {
    if (!result) return;
    navigator.clipboard.writeText(JSON.stringify(result, null, 2));
    toast({ title: "Copied", description: "Full analysis JSON copied" });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            SERP Domination Engine
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-3">
            <Input
              placeholder="Enter target keyword..."
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !isLoading && analyze()}
              className="flex-1"
            />
            <Select value={language} onValueChange={setLanguage}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="en">English</SelectItem>
                <SelectItem value="ar">العربية</SelectItem>
                <SelectItem value="fr">Français</SelectItem>
                <SelectItem value="es">Español</SelectItem>
                <SelectItem value="de">Deutsch</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={analyze} disabled={isLoading}>
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Search className="h-4 w-4 mr-2" />}
              {isLoading ? "Analyzing..." : "Analyze"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {result && (
        <div className="space-y-4">
          {/* Competitor Analysis */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Search className="h-5 w-5 text-blue-500" />
                Competitor Analysis
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Accordion type="multiple" className="w-full">
                {result.competitor_analysis?.map((comp, i) => (
                  <AccordionItem key={i} value={`comp-${i}`}>
                    <AccordionTrigger className="text-left">
                      <div className="flex items-center gap-3">
                        <Badge variant="outline">#{i + 1}</Badge>
                        <span className="font-medium">{comp.title}</span>
                        <Badge variant="secondary">{comp.estimated_word_count} words</Badge>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="space-y-3">
                      <div>
                        <p className="font-semibold text-sm mb-1">Headings:</p>
                        <div className="flex flex-wrap gap-1">
                          {comp.main_headings?.map((h, j) => (
                            <Badge key={j} variant="outline" className="text-xs">{h}</Badge>
                          ))}
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="font-semibold text-sm text-green-600 mb-1 flex items-center gap-1">
                            <CheckCircle2 className="h-3 w-3" /> Strengths
                          </p>
                          <ul className="text-sm space-y-1">
                            {comp.strengths?.map((s, j) => (
                              <li key={j} className="text-muted-foreground">• {s}</li>
                            ))}
                          </ul>
                        </div>
                        <div>
                          <p className="font-semibold text-sm text-red-500 mb-1 flex items-center gap-1">
                            <AlertTriangle className="h-3 w-3" /> Weaknesses
                          </p>
                          <ul className="text-sm space-y-1">
                            {comp.weaknesses?.map((w, j) => (
                              <li key={j} className="text-muted-foreground">• {w}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </CardContent>
          </Card>

          {/* Content Gaps */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <AlertTriangle className="h-5 w-5 text-orange-500" />
                Content Gaps
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                {(["missing_sections", "weak_explanations", "lack_of_examples", "poor_structure"] as const).map((key) => {
                  const labels: Record<string, string> = {
                    missing_sections: "Missing Sections",
                    weak_explanations: "Weak Explanations",
                    lack_of_examples: "Lack of Examples",
                    poor_structure: "Poor Structure",
                  };
                  const items = result.content_gaps?.[key] || [];
                  return (
                    <div key={key} className="space-y-1">
                      <p className="font-semibold text-sm">{labels[key]}</p>
                      {items.length > 0 ? (
                        <ul className="text-sm space-y-1">
                          {items.map((item, j) => (
                            <li key={j} className="text-muted-foreground">• {item}</li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-sm text-muted-foreground italic">None found</p>
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Superior Outline */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Trophy className="h-5 w-5 text-yellow-500" />
                  Superior Outline
                </CardTitle>
                <Button variant="outline" size="sm" onClick={copyOutline}>
                  <Copy className="h-3 w-3 mr-1" /> Copy Outline
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Badge>Title</Badge>
                  <span className="font-medium">{result.superior_outline?.suggested_title}</span>
                </div>
                <div className="flex items-start gap-2">
                  <Badge variant="secondary">Meta</Badge>
                  <span className="text-sm text-muted-foreground">{result.superior_outline?.suggested_meta_description}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">Target</Badge>
                  <span className="text-sm">{result.superior_outline?.estimated_word_count} words</span>
                </div>
              </div>

              <div className="space-y-3 border-t pt-4">
                {result.superior_outline?.outline?.map((section, i) => (
                  <div key={i} className="border rounded-lg p-3 space-y-2">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">{section.content_type || "text"}</Badge>
                      <span className="font-semibold text-sm">{section.heading}</span>
                    </div>
                    {section.subheadings?.length ? (
                      <div className="pl-4 space-y-1">
                        {section.subheadings.map((sub, j) => (
                          <p key={j} className="text-sm text-muted-foreground">↳ {sub}</p>
                        ))}
                      </div>
                    ) : null}
                    {section.key_points?.length ? (
                      <ul className="pl-4 text-xs text-muted-foreground space-y-0.5">
                        {section.key_points.map((pt, j) => (
                          <li key={j}>• {pt}</li>
                        ))}
                      </ul>
                    ) : null}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Unfair Advantage */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Lightbulb className="h-5 w-5 text-purple-500" />
                Unfair Advantage
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="font-semibold text-sm">Unique Angle</p>
                <p className="text-sm text-muted-foreground">{result.unfair_advantage?.unique_angle}</p>
              </div>
              <div>
                <p className="font-semibold text-sm">Strong Opinions</p>
                <ul className="text-sm space-y-1">
                  {result.unfair_advantage?.strong_opinions?.map((o, i) => (
                    <li key={i} className="text-muted-foreground">💪 {o}</li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="font-semibold text-sm">Real-Life Insights</p>
                <ul className="text-sm space-y-1">
                  {result.unfair_advantage?.real_life_insights?.map((r, i) => (
                    <li key={i} className="text-muted-foreground">🎯 {r}</li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="font-semibold text-sm">Call to Action</p>
                <p className="text-sm text-muted-foreground">{result.unfair_advantage?.call_to_action}</p>
              </div>
            </CardContent>
          </Card>

          {/* Copy Full JSON */}
          <div className="flex justify-end">
            <Button variant="outline" onClick={copyJSON}>
              <Copy className="h-4 w-4 mr-2" /> Copy Full Analysis (JSON)
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
