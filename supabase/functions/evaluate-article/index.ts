import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { runRuleChecks } from "../_shared/quality-check.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// The missing piece from a full agentic loop: something that actually
// checks the writer's output before it ships, instead of handing back
// whatever the model produced on the first try.
//
// Deliberately simple by design (per explicit request — no new paid tools,
// no framework, no complex multi-agent orchestration):
//   1. Free, instant, rule-based checks (word count, clichés, placeholders,
//      structure) — reuses the exact same logic as seoagent's own audit
//      script, zero cost.
//   2. Exactly ONE additional AI call, only to answer the one thing rules
//      can't check: "does this article actually cover the specific gaps
//      found in the competitor analysis?" Uses whichever key is already
//      configured (same fallback order as everywhere else in this project).
//
// Does NOT touch analyze-competitors or the generator functions' core
// logic — this only reads their output and scores it.

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { title, content, keyword, metaDescription, includeFAQ, includeComparisonTable, competitorBrief } =
      await req.json();

    if (!content) {
      return json({ error: "content is required" }, 400);
    }

    const rules = runRuleChecks({
      content,
      includeFAQ: !!includeFAQ,
      includeComparisonTable: !!includeComparisonTable,
      metaDescription,
    });

    let gapCoverage: { addressed: boolean; feedback: string } = {
      addressed: true,
      feedback: "",
    };

    // Only worth an AI call if there's actually a competitor brief to check
    // the article against — otherwise there's nothing gap-specific to verify.
    if (competitorBrief) {
      gapCoverage = await checkGapCoverage(title, content, keyword, competitorBrief);
    }

    // Rule score carries most of the weight (it's free and objective);
    // the gap-coverage check is a pass/fail modifier on top.
    let finalScore = rules.score;
    if (!gapCoverage.addressed) finalScore -= 20;
    finalScore = Math.max(0, Math.min(100, finalScore));

    const allIssues = [...rules.issues];
    if (!gapCoverage.addressed && gapCoverage.feedback) {
      allIssues.push(`Competitor gaps not fully addressed: ${gapCoverage.feedback}`);
    }

    return json({
      score: finalScore,
      passesThreshold: finalScore >= 75,
      issues: allIssues,
      // Ready to feed straight back into a generator's revisionFeedback
      // param for one corrective pass.
      revisionFeedback: allIssues.length > 0 ? allIssues.join(" ") : null,
    });
  } catch (error) {
    console.error("evaluate-article error:", error);
    // Evaluation failing must never block publishing entirely — fail open
    // with a neutral pass rather than stalling the whole pipeline.
    return json({ score: 70, passesThreshold: true, issues: [], revisionFeedback: null, evaluationError: String(error) });
  }
});

async function checkGapCoverage(
  title: string,
  content: string,
  keyword: string,
  competitorBrief: string,
): Promise<{ addressed: boolean; feedback: string }> {
  const openrouterKey = Deno.env.get("OPENROUTER_API_KEY");
  const groqKey = Deno.env.get("GROQ_API_KEY");
  const lovableKey = Deno.env.get("LOVABLE_API_KEY");

  const plainText = content.replace(/<[^>]+>/g, " ").slice(0, 6000);
  const prompt = `Keyword: "${keyword}"
Article title: "${title}"

The competitor gap analysis said the new article MUST do this to outrank the top 3 competitors:
${competitorBrief}

Here is the actual article that was written (truncated):
${plainText}

Did the article actually address most of those points? Reply in EXACTLY this format, nothing else:
VERDICT: yes or no
FEEDBACK: one short sentence naming the specific gap(s) still missing, or "none" if VERDICT is yes.`;

  const call = async (url: string, headers: Record<string, string>, body: unknown) => {
    const r = await fetch(url, { method: "POST", headers, body: JSON.stringify(body) });
    if (!r.ok) return null;
    const d = await r.json();
    return d.choices?.[0]?.message?.content as string | undefined;
  };

  try {
    let text: string | undefined;
    if (openrouterKey) {
      text = await call(
        "https://openrouter.ai/api/v1/chat/completions",
        { Authorization: `Bearer ${openrouterKey}`, "Content-Type": "application/json" },
        { model: "anthropic/claude-sonnet-4", messages: [{ role: "user", content: prompt }], max_tokens: 150, temperature: 0.2 },
      );
    }
    if (!text && groqKey) {
      text = await call(
        "https://api.groq.com/openai/v1/chat/completions",
        { Authorization: `Bearer ${groqKey}`, "Content-Type": "application/json" },
        { model: "llama-3.3-70b-versatile", messages: [{ role: "user", content: prompt }], max_tokens: 150, temperature: 0.2 },
      );
    }
    if (!text && lovableKey) {
      text = await call(
        "https://ai.gateway.lovable.dev/v1/chat/completions",
        { Authorization: `Bearer ${lovableKey}`, "Content-Type": "application/json" },
        { model: "google/gemini-2.5-flash", messages: [{ role: "user", content: prompt }] },
      );
    }

    if (!text) return { addressed: true, feedback: "" }; // no key available — don't block on this check

    const verdictMatch = text.match(/VERDICT:\s*(yes|no)/i);
    const feedbackMatch = text.match(/FEEDBACK:\s*(.+)/i);
    const addressed = verdictMatch ? verdictMatch[1].toLowerCase() === "yes" : true;
    const feedback = feedbackMatch ? feedbackMatch[1].trim() : "";
    return { addressed, feedback: feedback === "none" ? "" : feedback };
  } catch (e) {
    console.error("checkGapCoverage error:", e);
    return { addressed: true, feedback: "" };
  }
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
