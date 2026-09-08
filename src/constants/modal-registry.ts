import type { Component } from "svelte";
import type { DialogSize } from "@ui/modal/Dialog.svelte";
import AnnouncementsModal from "@ui/modal/AnnouncementsModal.svelte";
import ChangelogModal from "@ui/modal/ChangelogModal.svelte";
import CoverageModal from "@ui/modal/CoverageModal.svelte";
import EditorToolsModal from "@ui/modal/EditorToolsModal.svelte";
import HotlinesModal from "@ui/modal/HotlinesModal.svelte";
import JeepneyRouteModal from "@ui/modal/JeepneyRouteModal.svelte";
import LandingModal from "@ui/modal/LandingModal.svelte";
import LeaderboardModal from "@ui/modal/LeaderboardModal.svelte";
import OfflineMapsModal from "@ui/modal/OfflineMapsModal.svelte";
import PrivacyModal from "@ui/modal/PrivacyModal.svelte";
import ProposalReviewPanel from "@ui/ProposalReviewPanel.svelte";
import ScheduleModal from "@ui/modal/ScheduleModal.svelte";
import SettingsModal from "@ui/modal/SettingsModal.svelte";
import StudentOrgsModal from "@ui/modal/StudentOrgsModal.svelte";
import type { modalOptions } from "@constants/modal-states";

export type ModalType = (typeof modalOptions)[number];

export type ModalEntry = {
  component: Component<Record<string, never>>;
  size: DialogSize;
  /** Accessible name. Omit only when `labelledBy` is set. */
  label?: string;
  /** Id of a heading the modal content renders itself. */
  labelledBy?: string;
  /** Close button label. Defaults to "Close dialog". */
  closeLabel?: string;
  /** Content that paints its own chrome supplies its own dismiss. */
  showClose?: boolean;
  /** Wrap children in a scroll region (long task surfaces). */
  scroll?: boolean;
};

/**
 * Every modal the app can open, declared once. Adding a modal means adding
 * a row here, not another branch in a ternary. Labels are load-bearing:
 * they are the accessible names the e2e suite and screen readers use.
 */
export const MODAL_REGISTRY: Record<ModalType, ModalEntry> = {
  landing: {
    component: LandingModal,
    size: "showcase",
    labelledBy: "landing-modal-title",
    showClose: false,
  },
  "schedule-expand": {
    component: ScheduleModal,
    size: "default",
    label: "Room schedule",
    closeLabel: "Close schedule",
  },
  leaderboard: {
    component: LeaderboardModal,
    size: "compact",
    label: "Contributor leaderboard",
    labelledBy: "leaderboard-modal-title",
    closeLabel: "Close leaderboard",
  },
  coverage: {
    component: CoverageModal,
    size: "compact",
    label: "Campus data coverage",
    labelledBy: "coverage-modal-title",
    closeLabel: "Close data coverage",
  },
  changelog: {
    component: ChangelogModal,
    size: "large",
    label: "What's new",
    closeLabel: "Close changelog",
  },
  announcements: {
    component: AnnouncementsModal,
    size: "large",
    label: "Announcements",
    closeLabel: "Close announcements",
  },
  review: {
    component: ProposalReviewPanel,
    size: "large",
    label: "Review suggested edits",
    closeLabel: "Close review",
    scroll: true,
  },
  "student-orgs": {
    component: StudentOrgsModal,
    size: "default",
    label: "Student organizations",
    closeLabel: "Close student organizations",
  },
  settings: {
    component: SettingsModal,
    size: "reading",
    label: "Settings",
    closeLabel: "Close settings",
  },
  "jeepney-route": {
    component: JeepneyRouteModal,
    size: "reading",
    label: "Jeepney route",
    closeLabel: "Close jeepney route",
  },
  "editor-tools": {
    component: EditorToolsModal,
    size: "reading",
    label: "Editor tools",
    closeLabel: "Close editor tools",
  },
  privacy: {
    component: PrivacyModal,
    size: "reading",
    label: "Privacy policy",
    closeLabel: "Close privacy policy",
  },
  "offline-maps": {
    component: OfflineMapsModal,
    size: "reading",
    label: "Offline maps",
    closeLabel: "Close offline maps",
  },
  hotlines: {
    component: HotlinesModal,
    size: "reading",
    label: "Emergency hotlines",
    closeLabel: "Close emergency hotlines",
  },
};
