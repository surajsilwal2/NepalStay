"use client";
import { adToBS, formatBS, formatBSShort } from "@/lib/nepali-date";
import { useCalendar } from "@/components/providers/CalendarContext";
import { format } from "date-fns";

interface Props {
  date: Date | string;
  showBoth?: boolean;
  short?: boolean;
  className?: string;
}

export default function BsDateDisplay({ date, showBoth = false, short = false, className = "" }: Props) {
  const { isBS } = useCalendar();
  const d = typeof date === "string" ? new Date(date) : date;

  if (!isBS) {
    return <span className={className}>{format(d, "dd MMM yyyy")}</span>;
  }

  const bs = adToBS(d);

  if (showBoth) {
    return (
      <span className={className}>
        {format(d, "dd MMM yyyy")}
        <span className="text-amber-600 font-medium ml-1">
          ({short ? formatBSShort(bs) : formatBS(bs)} BS)
        </span>
      </span>
    );
  }

  return (
    <span className={className} title={`AD: ${format(d, "dd MMM yyyy")}`}>
      {short ? formatBSShort(bs) : formatBS(bs)}
      <span className="text-xs text-slate-400 ml-1">BS</span>
    </span>
  );
}
