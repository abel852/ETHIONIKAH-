import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import { ToastProvider } from "@/components/common/Toast";

jest.mock("sonner", () => ({
  Toaster: ({ position, toastOptions }: any) => (
    <div data-testid="toaster" data-position={position} data-duration={toastOptions?.duration}>
      Mock Toaster
    </div>
  ),
  toast: { error: jest.fn(), success: jest.fn(), info: jest.fn() },
}));

describe("ToastProvider", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders Toaster component", () => {
    render(<ToastProvider />);
    expect(screen.getByTestId("toaster")).toBeInTheDocument();
  });

  it("uses top-right position", () => {
    render(<ToastProvider />);
    const toaster = screen.getByTestId("toaster");
    expect(toaster).toHaveAttribute("data-position", "top-right");
  });

  it("sets duration to 4000ms", () => {
    render(<ToastProvider />);
    const toaster = screen.getByTestId("toaster");
    expect(toaster).toHaveAttribute("data-duration", "4000");
  });
});
