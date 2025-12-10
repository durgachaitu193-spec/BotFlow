"use client";

import React from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Share2,
  Star,
  GitFork,
  User,
  Globe,
  Twitter,
  Linkedin,
  Mail,
} from "lucide-react";
import NextLink from "next/link";
const Link = NextLink as any;
import { useParams, useRouter } from "next/navigation";
import { templates } from "@/lib/templatesData";
import FlowPreview from "@/components/FlowPreview";

export default function TemplateDetailPage() {
  const params = useParams();
  const router = useRouter();
  const template = templates.find((t) => t.id === params.id);

  if (!template) {
    return (
      <DashboardLayout>
        <div className="flex h-full items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-text-primary">
              Template not found
            </h2>
            <Link
              href="/marketplace"
              className="mt-4 inline-block text-accent-primary hover:underline"
            >
              Back to Marketplace
            </Link>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-6xl">
        {/* Header Navigation */}
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          className="mb-6"
        >
          <Link
            href="/marketplace"
            className="flex items-center gap-2 text-sm text-text-secondary hover:text-text-primary transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            More Templates
          </Link>
        </motion.div>

        {/* Title Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 flex flex-col gap-6 md:flex-row md:items-start md:justify-between"
        >
          <div>
            <h1 className="mb-2 text-3xl font-bold text-text-primary">
              {template.title}
            </h1>
            <p className="mb-4 text-lg text-text-secondary">
              {template.description}
            </p>

            <div className="flex items-center gap-6 text-sm text-text-muted">
              <div className="flex items-center gap-2">
                <Star className="h-4 w-4" />
                <span>{template.stars}</span>
              </div>
              <div className="flex items-center gap-2">
                <GitFork className="h-4 w-4" />
                <span>{template.forks}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex h-5 w-5 items-center justify-center rounded-full bg-accent-primary/20 text-xs font-bold text-accent-primary">
                  {template.author[0]}
                </div>
                <span>{template.author}</span>
              </div>
            </div>

            {template.credentials && (
              <div className="mt-4 text-sm text-text-muted">
                <span className="font-medium text-text-secondary">
                  Credentials needed:{" "}
                </span>
                {template.credentials.join(", ")}
              </div>
            )}
          </div>

          <div className="flex items-center gap-3">
            <button className="flex items-center gap-2 rounded-lg bg-accent-primary px-6 py-2.5 font-medium text-bg-deep transition-all hover:bg-accent-primary/90 hover:shadow-glow-primary">
              Use template
            </button>
            <button className="flex items-center justify-center rounded-lg border border-white/10 bg-bg-card p-2.5 text-text-secondary transition-colors hover:bg-bg-surface hover:text-text-primary">
              <Share2 className="h-5 w-5" />
            </button>
          </div>
        </motion.div>

        {/* Flow Preview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-12"
        >
          <FlowPreview
            nodes={template.flowData.nodes}
            edges={template.flowData.edges}
          />
        </motion.div>

        {/* Details Grid */}
        <div className="grid gap-12 md:grid-cols-3">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="md:col-span-2"
          >
            <h2 className="mb-4 text-xl font-bold text-text-primary">
              About this Workflow
            </h2>
            <div className="prose prose-invert max-w-none text-text-secondary">
              <p>
                This workflow is designed to streamline your operations by
                leveraging multiple AI agents. It starts with a trigger and
                processes data through various steps including routing, agent
                analysis, and memory storage.
              </p>
              <p className="mt-4">Key features:</p>
              <ul className="list-disc pl-5 mt-2 space-y-1">
                <li>Automated data processing</li>
                <li>Multi-agent collaboration</li>
                <li>Persistent memory storage</li>
                <li>Error handling and routing</li>
              </ul>
              <p className="mt-4">
                Ensure that you have the necessary API keys configured in your
                settings to use this template effectively.
              </p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <h2 className="mb-4 text-xl font-bold text-text-primary">
              About the Creator
            </h2>
            <div className="rounded-xl border border-white/5 bg-bg-card/50 p-6">
              <div className="mb-4 flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-accent-primary/20 text-xl font-bold text-accent-primary">
                  {template.author[0]}
                </div>
                <div>
                  <div className="font-bold text-text-primary">
                    {template.author}
                  </div>
                  <div className="flex items-center gap-3 mt-1 text-text-muted">
                    <Globe className="h-4 w-4 cursor-pointer hover:text-text-primary" />
                    <Twitter className="h-4 w-4 cursor-pointer hover:text-text-primary" />
                    <Linkedin className="h-4 w-4 cursor-pointer hover:text-text-primary" />
                    <Mail className="h-4 w-4 cursor-pointer hover:text-text-primary" />
                  </div>
                </div>
              </div>

              <div className="space-y-4 text-sm text-text-secondary">
                <div>
                  <div className="mb-1 font-medium text-text-primary">
                    About Me
                  </div>
                  <p>
                    I'm {template.author.split(" ")[0]} with a passion for
                    building agentic systems.
                  </p>
                </div>
                <div>
                  <div className="mb-1 font-medium text-text-primary">
                    What I Enjoy
                  </div>
                  <p>
                    Building workflow templates and exploring new AI
                    capabilities.
                  </p>
                </div>
                <div>
                  <div className="mb-1 font-medium text-text-primary">
                    Get in Touch
                  </div>
                  <p>
                    Feel free to message me on LinkedIn or send me any
                    suggestions.
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </DashboardLayout>
  );
}
