import { useState } from "react";
import { motion } from "framer-motion";
import {
  Calendar,
  Clock,
  Play,
  Pause,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Settings,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { adminFetch } from "@/lib/adminApi";
import { toast } from "sonner";
import { format, addMinutes, addHours, addDays } from "date-fns";

interface SchedulingPanelProps {
  selectedPostIds: string[];
  onScheduleComplete?: () => void;
}

type IntervalUnit = "minutes" | "hours" | "days";

export function SchedulingPanel({ selectedPostIds, onScheduleComplete }: SchedulingPanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isScheduling, setIsScheduling] = useState(false);
  const [intervalValue, setIntervalValue] = useState(1);
  const [intervalUnit, setIntervalUnit] = useState<IntervalUnit>("hours");
  const [startDate, setStartDate] = useState(format(new Date(), "yyyy-MM-dd'T'HH:mm"));
  const [scheduledCount, setScheduledCount] = useState(0);

  const loadGitArticle = async (slug: string) =>
    adminFetch<Record<string, unknown>>(
      `/content/articles/${encodeURIComponent(slug)}`,
    );

  const createArticlePullRequest = async (
    slug: string,
    patch: Record<string, unknown>,
  ) => {
    const article = await loadGitArticle(slug);
    return adminFetch<{ pullRequest?: { url?: string } }>(
      "/content/articles/pull-request",
      {
        method: "POST",
        body: JSON.stringify({ article: { ...article, ...patch, slug } }),
      },
    );
  };

  const getPublishAt = (startDateTime: Date, index: number) => {
    switch (intervalUnit) {
      case "minutes":
        return addMinutes(startDateTime, index * intervalValue);
      case "hours":
        return addHours(startDateTime, index * intervalValue);
      case "days":
        return addDays(startDateTime, index * intervalValue);
      default:
        return addHours(startDateTime, index * intervalValue);
    }
  };

  const handleSchedule = async () => {
    if (selectedPostIds.length === 0) {
      toast.error("No Git articles selected for scheduling");
      return;
    }

    setIsScheduling(true);
    setScheduledCount(0);

    try {
      const startDateTime = new Date(startDate);
      let successCount = 0;
      const updatedDate = new Date().toISOString().slice(0, 10);

      for (let i = 0; i < selectedPostIds.length; i += 1) {
        const publishAt = getPublishAt(startDateTime, i);
        await createArticlePullRequest(selectedPostIds[i], {
          status: "scheduled",
          scheduled_at: publishAt.toISOString(),
          updated: updatedDate,
        });
        successCount += 1;
        setScheduledCount(successCount);
      }

      toast.success(
        `Created ${successCount} scheduling pull request${successCount === 1 ? "" : "s"}.`,
      );
      setIsOpen(false);
      onScheduleComplete?.();
    } catch (error) {
      console.error("Scheduling PR error:", error);
      const message = error instanceof Error ? error.message : "Unknown error";
      toast.error(`Failed to create scheduling pull request: ${message}`);
    } finally {
      setIsScheduling(false);
    }
  };

  const handlePublishNow = async () => {
    if (selectedPostIds.length === 0) {
      toast.error("No Git articles selected");
      return;
    }

    setIsScheduling(true);

    try {
      let successCount = 0;
      const updatedDate = new Date().toISOString().slice(0, 10);
      for (const slug of selectedPostIds) {
        await createArticlePullRequest(slug, {
          status: "published",
          scheduled_at: "",
          date: updatedDate,
          updated: updatedDate,
        });
        successCount += 1;
      }

      toast.success(
        `Created ${successCount} publication pull request${successCount === 1 ? "" : "s"}.`,
      );
      onScheduleComplete?.();
    } catch (error) {
      console.error("Publish PR error:", error);
      const message = error instanceof Error ? error.message : "Unknown error";
      toast.error(`Failed to create publication pull request: ${message}`);
    } finally {
      setIsScheduling(false);
    }
  };

  const handleRunScheduler = async () => {
    try {
      const status = await adminFetch<{ canCreatePullRequest?: boolean }>(
        "/content/github/status",
      );
      if (status.canCreatePullRequest) {
        toast.success("GitHub scheduler is configured. Due articles are published by GitHub Actions.");
      } else {
        toast.info("GitHub scheduler is not configured yet.");
      }
    } catch (error) {
      console.error("GitHub scheduler status error:", error);
      const message = error instanceof Error ? error.message : "Unknown error";
      toast.error(`Failed to check GitHub scheduler: ${message}`);
    }
  };

  // Calculate preview dates
  const previewDates = () => {
    const startDateTime = new Date(startDate);
    const dates: Date[] = [];
    for (let i = 0; i < Math.min(5, selectedPostIds.length); i++) {
      switch (intervalUnit) {
        case "minutes":
          dates.push(addMinutes(startDateTime, i * intervalValue));
          break;
        case "hours":
          dates.push(addHours(startDateTime, i * intervalValue));
          break;
        case "days":
          dates.push(addDays(startDateTime, i * intervalValue));
          break;
      }
    }
    return dates;
  };

  return (
    <>
      <div className="flex flex-wrap gap-2">
        <Button
          variant="outline"
          onClick={() => setIsOpen(true)}
          disabled={selectedPostIds.length === 0}
        >
          <Calendar className="h-4 w-4 mr-2" />
          Schedule ({selectedPostIds.length})
        </Button>
        
        <Button
          variant="default"
          onClick={handlePublishNow}
          disabled={selectedPostIds.length === 0 || isScheduling}
        >
          {isScheduling ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Play className="h-4 w-4 mr-2" />
          )}
          Publish Now
        </Button>

        <Button variant="secondary" onClick={handleRunScheduler}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Check GitHub Scheduler
        </Button>
      </div>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Schedule Posts
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="bg-muted/50 rounded-lg p-3">
              <p className="text-sm text-muted-foreground">
                Scheduling <strong>{selectedPostIds.length}</strong> posts
              </p>
            </div>

            {/* Start Date */}
            <div className="space-y-2">
              <Label>Start Date & Time</Label>
              <Input
                type="datetime-local"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>

            {/* Interval */}
            <div className="space-y-2">
              <Label>Publish Interval</Label>
              <div className="flex gap-2">
                <Input
                  type="number"
                  min={1}
                  value={intervalValue}
                  onChange={(e) => setIntervalValue(parseInt(e.target.value) || 1)}
                  className="w-24"
                />
                <Select value={intervalUnit} onValueChange={(v) => setIntervalUnit(v as IntervalUnit)}>
                  <SelectTrigger className="flex-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="minutes">Minutes</SelectItem>
                    <SelectItem value="hours">Hours</SelectItem>
                    <SelectItem value="days">Days</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <p className="text-xs text-muted-foreground">
                Each post will be published {intervalValue} {intervalUnit} after the previous one
              </p>
            </div>

            {/* Preview */}
            <div className="space-y-2">
              <Label>Preview Schedule</Label>
              <div className="bg-muted/50 rounded-lg p-3 space-y-1">
                {previewDates().map((date, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm">
                    <Badge variant="outline" className="w-8 justify-center">
                      {i + 1}
                    </Badge>
                    <Clock className="h-3 w-3 text-muted-foreground" />
                    <span>{format(date, "MMM d, yyyy 'at' HH:mm")}</span>
                  </div>
                ))}
                {selectedPostIds.length > 5 && (
                  <p className="text-xs text-muted-foreground mt-2">
                    ... and {selectedPostIds.length - 5} more posts
                  </p>
                )}
              </div>
            </div>

            {isScheduling && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Scheduling {scheduledCount}/{selectedPostIds.length} posts...
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsOpen(false)} disabled={isScheduling}>
              Cancel
            </Button>
            <Button onClick={handleSchedule} disabled={isScheduling}>
              {isScheduling ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Scheduling...
                </>
              ) : (
                <>
                  <Calendar className="h-4 w-4 mr-2" />
                  Schedule All
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
