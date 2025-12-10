import {
  LucideIcon,
  Mail,
  Globe,
  MessageSquare,
  Youtube,
  Github,
  Database,
  Search,
  FileText,
  Bot,
} from "lucide-react";

export interface TemplateNode {
  id: string;
  type: string;
  label: string;
  position: { x: number; y: number };
  data?: any;
}

export interface TemplateEdge {
  id: string;
  source: string;
  target: string;
  label?: string;
}

export interface Template {
  id: string;
  title: string;
  description: string;
  author: string;
  stars: number;
  forks: number;
  tags: string[];
  updatedAt: string;
  credentials?: string[];
  flowData: {
    nodes: TemplateNode[];
    edges: TemplateEdge[];
  };
  icon?: any; // LucideIcon
}

export const templates: Template[] = [
  {
    id: "landing-page-analysis",
    title: "Landing Page Analysis",
    description:
      "Analyze a landing page and determine its quality with multiple agents",
    author: "Adam Gough",
    stars: 3,
    forks: 247,
    tags: ["Browser Use", "Perplexity", "OpenAI"],
    updatedAt: "about 2 hours ago",
    credentials: [
      "API Key for Browser Use",
      "Perplexity API Key",
      "OpenAI API Key",
    ],
    icon: Globe,
    flowData: {
      nodes: [
        {
          id: "start",
          type: "trigger",
          label: "Start",
          position: { x: 100, y: 300 },
        },
        {
          id: "router",
          type: "router",
          label: "Router 1",
          position: { x: 300, y: 300 },
        },
        {
          id: "browser",
          type: "agent",
          label: "Browser Use 1",
          position: { x: 500, y: 150 },
        },
        {
          id: "analysis",
          type: "agent",
          label: "Landing Page Analysis",
          position: { x: 700, y: 150 },
        },
        {
          id: "memory1",
          type: "memory",
          label: "Memory 1",
          position: { x: 900, y: 150 },
        },
        {
          id: "followup",
          type: "agent",
          label: "Follow Up Agent",
          position: { x: 500, y: 450 },
        },
        {
          id: "memory2",
          type: "memory",
          label: "Memory 2",
          position: { x: 700, y: 450 },
        },
        {
          id: "memory3",
          type: "memory",
          label: "Memory 3",
          position: { x: 300, y: 450 },
        },
      ],
      edges: [
        { id: "e1", source: "start", target: "router" },
        { id: "e2", source: "start", target: "memory3" },
        { id: "e3", source: "router", target: "browser" },
        { id: "e4", source: "router", target: "followup" },
        { id: "e5", source: "browser", target: "analysis" },
        { id: "e6", source: "analysis", target: "memory1" },
        { id: "e7", source: "followup", target: "memory2" },
      ],
    },
  },
  {
    id: "automated-gmail-labeling",
    title: "Automated Gmail Labeling",
    description:
      "Automatically label emails in Gmail based on their content using AI.",
    author: "Adam Gough",
    stars: 2,
    forks: 366,
    tags: ["Gmail", "OpenAI"],
    updatedAt: "1 day ago",
    credentials: ["Gmail API Key", "OpenAI API Key"],
    icon: Mail,
    flowData: {
      nodes: [
        {
          id: "gmail-trigger",
          type: "trigger",
          label: "New Email",
          position: { x: 100, y: 200 },
        },
        {
          id: "classifier",
          type: "agent",
          label: "Classifier Agent",
          position: { x: 300, y: 200 },
        },
        {
          id: "labeler",
          type: "action",
          label: "Add Label",
          position: { x: 500, y: 200 },
        },
      ],
      edges: [
        { id: "e1", source: "gmail-trigger", target: "classifier" },
        { id: "e2", source: "classifier", target: "labeler" },
      ],
    },
  },
  {
    id: "chatbot-internal-data",
    title: "Chatbot with Internal Data",
    description:
      "A chatbot that answers questions using your internal documentation and data.",
    author: "Adam Gough",
    stars: 0,
    forks: 221,
    tags: ["RAG", "Vector DB", "OpenAI"],
    updatedAt: "3 days ago",
    credentials: ["OpenAI API Key", "Pinecone API Key"],
    icon: MessageSquare,
    flowData: {
      nodes: [
        {
          id: "input",
          type: "trigger",
          label: "User Query",
          position: { x: 100, y: 200 },
        },
        {
          id: "retriever",
          type: "action",
          label: "Retrieve Docs",
          position: { x: 300, y: 200 },
        },
        {
          id: "generator",
          type: "agent",
          label: "Answer Generator",
          position: { x: 500, y: 200 },
        },
      ],
      edges: [
        { id: "e1", source: "input", target: "retriever" },
        { id: "e2", source: "retriever", target: "generator" },
      ],
    },
  },
  {
    id: "youtube-search-summary",
    title: "YouTube Search and Summary",
    description:
      "Search for YouTube videos on a topic and generate summaries for them.",
    author: "Adam Gough",
    stars: 2,
    forks: 198,
    tags: ["YouTube", "Summarization"],
    updatedAt: "5 days ago",
    credentials: ["YouTube API Key", "OpenAI API Key"],
    icon: Youtube,
    flowData: {
      nodes: [
        {
          id: "search",
          type: "trigger",
          label: "Search Query",
          position: { x: 100, y: 200 },
        },
        {
          id: "yt-search",
          type: "action",
          label: "Search YouTube",
          position: { x: 300, y: 200 },
        },
        {
          id: "summarizer",
          type: "agent",
          label: "Summarizer",
          position: { x: 500, y: 200 },
        },
      ],
      edges: [
        { id: "e1", source: "search", target: "yt-search" },
        { id: "e2", source: "yt-search", target: "summarizer" },
      ],
    },
  },
  {
    id: "github-release-bot",
    title: "GitHub Release Bot",
    description:
      "Automatically generate release notes and publish releases on GitHub.",
    author: "Waleed Latif",
    stars: 2,
    forks: 140,
    tags: ["GitHub", "Automation"],
    updatedAt: "1 week ago",
    credentials: ["GitHub Token"],
    icon: Github,
    flowData: {
      nodes: [
        {
          id: "trigger",
          type: "trigger",
          label: "Push to Main",
          position: { x: 100, y: 200 },
        },
        {
          id: "generator",
          type: "agent",
          label: "Notes Generator",
          position: { x: 300, y: 200 },
        },
        {
          id: "publisher",
          type: "action",
          label: "Publish Release",
          position: { x: 500, y: 200 },
        },
      ],
      edges: [
        { id: "e1", source: "trigger", target: "generator" },
        { id: "e2", source: "generator", target: "publisher" },
      ],
    },
  },
  {
    id: "lead-generation",
    title: "Lead Generation",
    description: "Scrape websites for potential leads and enrich their data.",
    author: "Adam Gough",
    stars: 1,
    forks: 117,
    tags: ["Scraping", "Enrichment"],
    updatedAt: "2 weeks ago",
    credentials: ["Scraping API Key"],
    icon: Search,
    flowData: {
      nodes: [
        {
          id: "start",
          type: "trigger",
          label: "Start",
          position: { x: 100, y: 200 },
        },
        {
          id: "scraper",
          type: "agent",
          label: "Web Scraper",
          position: { x: 300, y: 200 },
        },
        {
          id: "enricher",
          type: "agent",
          label: "Data Enricher",
          position: { x: 500, y: 200 },
        },
        {
          id: "save",
          type: "action",
          label: "Save to CRM",
          position: { x: 700, y: 200 },
        },
      ],
      edges: [
        { id: "e1", source: "start", target: "scraper" },
        { id: "e2", source: "scraper", target: "enricher" },
        { id: "e3", source: "enricher", target: "save" },
      ],
    },
  },
  {
    id: "rag-skeleton",
    title: "RAG Skeleton for Chat",
    description:
      "A basic skeleton for building Retrieval Augmented Generation chat applications.",
    author: "Adam Gough",
    stars: 0,
    forks: 94,
    tags: ["RAG", "Skeleton"],
    updatedAt: "2 weeks ago",
    credentials: ["OpenAI API Key"],
    icon: Database,
    flowData: {
      nodes: [
        {
          id: "query",
          type: "trigger",
          label: "User Query",
          position: { x: 100, y: 200 },
        },
        {
          id: "embed",
          type: "action",
          label: "Embed Query",
          position: { x: 300, y: 200 },
        },
        {
          id: "retrieve",
          type: "action",
          label: "Retrieve Context",
          position: { x: 500, y: 200 },
        },
        {
          id: "generate",
          type: "agent",
          label: "Generate Response",
          position: { x: 700, y: 200 },
        },
      ],
      edges: [
        { id: "e1", source: "query", target: "embed" },
        { id: "e2", source: "embed", target: "retrieve" },
        { id: "e3", source: "retrieve", target: "generate" },
      ],
    },
  },
  {
    id: "personal-assistant",
    title: "Personal Assistant Telegram",
    description:
      "A personal assistant bot on Telegram to manage your tasks and schedule.",
    author: "Adam Gough",
    stars: 2,
    forks: 185,
    tags: ["Telegram", "Productivity"],
    updatedAt: "1 week ago",
    credentials: ["Telegram Bot Token", "OpenAI API Key"],
    icon: Bot,
    flowData: {
      nodes: [
        {
          id: "msg",
          type: "trigger",
          label: "New Message",
          position: { x: 100, y: 200 },
        },
        {
          id: "intent",
          type: "agent",
          label: "Intent Classifier",
          position: { x: 300, y: 200 },
        },
        {
          id: "action",
          type: "router",
          label: "Action Router",
          position: { x: 500, y: 200 },
        },
        {
          id: "reply",
          type: "action",
          label: "Send Reply",
          position: { x: 700, y: 200 },
        },
      ],
      edges: [
        { id: "e1", source: "msg", target: "intent" },
        { id: "e2", source: "intent", target: "action" },
        { id: "e3", source: "action", target: "reply" },
      ],
    },
  },
];
