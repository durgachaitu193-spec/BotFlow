"use client";

import React, { useRef, useState } from "react";
import {
  motion,
  useMotionTemplate,
  useMotionValue,
  useSpring,
} from "framer-motion";
import { Star, GitFork, User, ArrowRight } from "lucide-react";
import Link from "next/link";
import { Template } from "@/lib/templatesData";

interface TemplateCardProps {
  template: Template;
  index: number;
}

export default function TemplateCard({ template, index }: TemplateCardProps) {
  const Icon = template.icon;
  const ref = useRef<HTMLDivElement>(null);

  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const mouseX = useSpring(x, { stiffness: 500, damping: 100 });
  const mouseY = useSpring(y, { stiffness: 500, damping: 100 });

  function onMouseMove({ currentTarget, clientX, clientY }: React.MouseEvent) {
    const { left, top } = currentTarget.getBoundingClientRect();
    mouseX.set(clientX - left);
    mouseY.set(clientY - top);
  }

  const maskImage = useMotionTemplate`radial-gradient(240px at ${mouseX}px ${mouseY}px, white, transparent)`;
  const style = { maskImage, WebkitMaskImage: maskImage };

  // 3D Tilt Effect
  const xPct = useMotionValue(0.5);
  const yPct = useMotionValue(0.5);

  const rotateX = useSpring(useMotionValue(0), { stiffness: 300, damping: 30 });
  const rotateY = useSpring(useMotionValue(0), { stiffness: 300, damping: 30 });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const xP = mouseX / width;
    const yP = mouseY / height;

    xPct.set(xP);
    yPct.set(yP);

    rotateX.set((yP - 0.5) * 20 * -1);
    rotateY.set((xP - 0.5) * 20);

    onMouseMove(e);
  };

  const handleMouseLeave = () => {
    xPct.set(0.5);
    yPct.set(0.5);
    rotateX.set(0);
    rotateY.set(0);
    mouseX.set(0);
    mouseY.set(0);
  };

  return (
    <Link href={`/marketplace/${template.id}`}>
      <motion.div
        ref={ref}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.05 }}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        style={{
          rotateX,
          rotateY,
          transformStyle: "preserve-3d",
        }}
        className="group relative flex h-full flex-col overflow-hidden rounded-xl border border-white/5 bg-bg-card/40 p-5 transition-all hover:shadow-2xl hover:shadow-accent-primary/10"
      >
        <motion.div
          className="pointer-events-none absolute -inset-px rounded-xl opacity-0 transition duration-300 group-hover:opacity-100"
          style={{
            background:
              "radial-gradient(600px circle at var(--mouse-x) var(--mouse-y), rgba(255,255,255,0.06), transparent 40%)",
          }}
        />
        <motion.div
          className="pointer-events-none absolute -inset-px rounded-xl opacity-0 transition duration-300 group-hover:opacity-100"
          style={style}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-accent-primary/10 to-transparent opacity-20" />
        </motion.div>
        <div
          style={{ transform: "translateZ(20px)" }}
          className="relative z-10 flex flex-col h-full"
        >
          <div className="mb-4 flex items-start justify-between">
            <div className="relative flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-white/10 to-white/5 text-accent-primary shadow-inner ring-1 ring-white/10 transition-transform group-hover:scale-110 group-hover:text-white">
              {Icon && <Icon className="h-6 w-6" />}
              <div className="absolute inset-0 rounded-xl bg-accent-primary/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <div className="flex flex-wrap justify-end gap-2 max-w-[60%]">
              {template.tags.slice(0, 2).map((tag) => (
                <span
                  key={tag}
                  className="rounded-full border border-white/5 bg-white/5 px-2 py-1 text-[10px] font-medium text-text-muted backdrop-blur-sm"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>

          <h3 className="mb-2 text-lg font-bold text-text-primary group-hover:text-accent-primary transition-colors">
            {template.title}
          </h3>
          <p className="mb-6 line-clamp-2 flex-1 text-sm text-text-secondary group-hover:text-text-primary/80 transition-colors">
            {template.description}
          </p>

          <div className="mt-auto pt-4 border-t border-white/5">
            <div className="flex items-center justify-between text-xs text-text-muted">
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5 rounded-full bg-white/5 px-2 py-1">
                  <User className="h-3 w-3" />
                  <span className="truncate max-w-[80px]">
                    {template.author}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1 hover:text-accent-primary transition-colors">
                  <GitFork className="h-3 w-3" />
                  <span>{template.forks}</span>
                </div>
                <div className="flex items-center gap-1 hover:text-yellow-400 transition-colors">
                  <Star className="h-3 w-3" />
                  <span>{template.stars}</span>
                </div>
              </div>
            </div>
            <div className="absolute bottom-5 right-5 translate-y-4 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent-primary text-bg-deep shadow-lg shadow-accent-primary/50">
                <ArrowRight className="h-4 w-4" />
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </Link>
  );
}
