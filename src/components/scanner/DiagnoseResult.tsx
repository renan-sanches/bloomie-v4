import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

interface DiagnoseData {
  healthScore: number;
  issues: Array<{ name: string; severity: "mild" | "moderate" | "severe"; description: string }>;
  treatmentPlan: string[];
  followUpDays: number;
  warningSigns: string[];
}

const severityColors: Record<string, string> = {
  mild: "bg-amber-50 text-amber-600",
  moderate: "bg-orange-50 text-orange-600",
  severe: "bg-rose-50 text-rose-500",
};

export function DiagnoseResult({ data }: { data: DiagnoseData }) {
  return (
    <div className="bg-white rounded-[32px] shadow-[0px_4px_24px_rgba(0,0,0,0.06)] p-6 flex flex-col gap-5">
      <div>
        <p className="text-sm font-semibold text-brand-carbon/50 mb-2">Health Score</p>
        <div className="flex items-center gap-3">
          <Progress value={data.healthScore} className="h-3 flex-1" />
          <span className="font-bold text-brand-carbon text-sm shrink-0">{data.healthScore}%</span>
        </div>
      </div>

      {data.issues.length > 0 && (
        <div>
          <p className="text-sm font-semibold text-brand-carbon/50 mb-2">Issues Found</p>
          <div className="flex flex-col gap-2">
            {data.issues.map((issue, i) => (
              <div key={i} className="flex items-start gap-3">
                <Badge className={`rounded-[12px] text-xs shrink-0 capitalize ${severityColors[issue.severity]}`}>
                  {issue.severity}
                </Badge>
                <div>
                  <p className="text-sm font-semibold text-brand-carbon">{issue.name}</p>
                  <p className="text-xs text-brand-carbon/60">{issue.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {data.treatmentPlan.length > 0 && (
        <div>
          <p className="text-sm font-semibold text-brand-carbon/50 mb-2">Treatment Plan</p>
          <ol className="flex flex-col gap-1.5">
            {data.treatmentPlan.map((step, i) => (
              <li key={i} className="flex gap-2 text-sm text-brand-carbon">
                <span className="shrink-0 w-5 h-5 bg-brand-green/10 text-brand-green rounded-full flex items-center justify-center text-xs font-bold">
                  {i + 1}
                </span>
                {step}
              </li>
            ))}
          </ol>
        </div>
      )}

      <p className="text-xs text-brand-carbon/40 text-center">
        Check again in {data.followUpDays} day{data.followUpDays !== 1 ? "s" : ""}
      </p>
    </div>
  );
}
