import { ProductManifest } from "@prosis/sdk";

export const MARKETING_MANIFEST: ProductManifest = {
  id: "marketing",
  name: "Prosis Marketing",
  slug: "marketing",
  description: "Automated promotional campaigns, loyalty guest segmentation, and omnichannel marketing SaaS",
  icon: "Megaphone",
  version: "1.1.0",
  status: "active",
  capabilities: [
    {
      id: "campaigns",
      name: "Campaign Lifecycle & Automation",
      description: "Create, stage, schedule, and track multi-channel marketing campaigns.",
      version: "1.0",
      operations: ["create_campaign", "list_campaigns", "track_conversions"],
    },
    {
      id: "leads",
      name: "Guest Leads & Acquisition",
      description: "Lead capture, guest referrals, and reservation conversion tracking.",
      version: "1.0",
      operations: ["capture_lead", "list_leads"],
    },
    {
      id: "email",
      name: "Email & SMS Outbound Dispatch",
      description: "Dispatch promotional SMS and email newsletters to opted-in audiences.",
      version: "1.0",
      operations: ["send_broadcast", "preview_email"],
    },
    {
      id: "analytics",
      name: "Campaign Performance Analytics",
      description: "Track open rates, guest click-throughs, and incremental revenue attribution.",
      version: "1.1",
      operations: ["get_metrics", "conversion_attribution"],
    },
  ],
  tools: [
    "marketing_listCampaigns",
    "marketing_createCampaignDraft",
  ],
  navigation: [
    { label: "Active Campaigns", path: "/marketing/campaigns", icon: "Megaphone" },
    { label: "Guest Segments", path: "/marketing/segments", icon: "Users" },
    { label: "Outbound Dispatch", path: "/marketing/dispatch", icon: "Send" },
  ],
  workspace: {
    id: "workspace_marketing",
    title: "Marketing Automation Workspace",
    slug: "marketing",
    route: "/marketing",
    layout: "split",
    quickActions: [
      { label: "Create Campaign", action: "new_campaign", icon: "Plus" },
      { label: "View Performance", action: "view_metrics", icon: "BarChart" },
    ],
  },
  apiConfig: {
    baseUrl: "https://api.marketing.internal/v1",
    apiVersion: "2026-01",
    authStrategy: "internal_service",
    timeoutMs: 3000,
  },
  permissions: [
    "marketing.read",
    "marketing.campaigns.write",
    "marketing.broadcast.send",
    "marketing.admin",
  ],
  enabled: true,
};
