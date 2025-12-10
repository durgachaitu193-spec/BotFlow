"use client";

import React from "react";
import TemplateCard from "./TemplateCard";
import { templates } from "@/lib/templatesData";
import { Flame } from "lucide-react";
import Link from "next/link";

export default function TrendingTemplates() {
  const trendingTemplates = templates.slice(0, 3);

  return (
    <div className="rounded-2xl border border-white/5 bg-bg-card p-6 mb-4">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Flame className="h-5 w-5 text-accent-primary" />
          <h3 className="text-xl font-bold text-text-primary">
            Trending Templates
          </h3>
        </div>
        <Link
          href="/templates"
          className="text-sm text-text-secondary hover:text-accent-primary transition-colors"
        >
          View All
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {trendingTemplates.map((template, index) => (
          <div key={template.id} className="h-[280px]">
            <TemplateCard template={template} index={index} />
          </div>
        ))}
      </div>
    </div>
  );
}
