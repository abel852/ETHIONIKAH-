import "@testing-library/jest-dom";
import { render } from "@testing-library/react";
import {
  ProfileCardSkeleton,
  DashboardCardSkeleton,
  ConversationListSkeleton,
  MessageListSkeleton,
  NotificationSkeleton,
  ProfileDetailSkeleton,
  ActivityListSkeleton,
  StatsGridSkeleton,
} from "@/components/common/Skeleton";

describe("Skeleton variants", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("ProfileCardSkeleton renders without crashing", () => {
    const { container } = render(<ProfileCardSkeleton />);
    expect(container.querySelectorAll(".animate-shimmer").length).toBeGreaterThan(0);
  });

  it("DashboardCardSkeleton renders without crashing", () => {
    const { container } = render(<DashboardCardSkeleton />);
    expect(container.querySelectorAll(".animate-shimmer").length).toBeGreaterThan(0);
  });

  it("ConversationListSkeleton renders without crashing", () => {
    const { container } = render(<ConversationListSkeleton />);
    expect(container.querySelectorAll(".animate-shimmer").length).toBeGreaterThan(0);
  });

  it("MessageListSkeleton renders without crashing", () => {
    const { container } = render(<MessageListSkeleton />);
    expect(container.querySelectorAll(".animate-shimmer").length).toBeGreaterThan(0);
  });

  it("NotificationSkeleton renders without crashing", () => {
    const { container } = render(<NotificationSkeleton />);
    expect(container.querySelectorAll(".animate-shimmer").length).toBeGreaterThan(0);
  });

  it("ProfileDetailSkeleton renders without crashing", () => {
    const { container } = render(<ProfileDetailSkeleton />);
    expect(container.querySelectorAll(".animate-shimmer").length).toBeGreaterThan(0);
  });

  it("ActivityListSkeleton renders without crashing", () => {
    const { container } = render(<ActivityListSkeleton />);
    expect(container.querySelectorAll(".animate-shimmer").length).toBeGreaterThan(0);
  });

  it("StatsGridSkeleton renders without crashing", () => {
    const { container } = render(<StatsGridSkeleton />);
    expect(container.querySelectorAll(".animate-shimmer").length).toBeGreaterThan(0);
  });
});
