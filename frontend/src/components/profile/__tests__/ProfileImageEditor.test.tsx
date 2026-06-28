import "@testing-library/jest-dom";
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import { ProfileImageEditor } from "../ProfileImageEditor";

// Mock react-easy-crop
jest.mock("react-easy-crop", () => {
  return function MockCropper({ image, onCropChange, onZoomChange, onCropComplete }: any) {
    return (
      <div data-testid="mock-cropper" data-image={image}>
        <button type="button" data-testid="mock-crop-change" onClick={() => onCropChange({ x: 10, y: 10 })} />
        <button type="button" data-testid="mock-zoom-change" onClick={() => onZoomChange(1.5)} />
        <button
          type="button"
          data-testid="mock-crop-complete"
          onClick={() => onCropComplete({ width: 100, height: 100 }, { width: 200, height: 200, x: 0, y: 0 })}
        />
      </div>
    );
  };
});

const mockObjectURL = "blob:mock-url-123";
global.URL.createObjectURL = jest.fn(() => mockObjectURL);
global.URL.revokeObjectURL = jest.fn();

// Image mock — fires onload asynchronously via setTimeout
let imageOnload: (() => void) | null = null;
jest.spyOn(global, "Image").mockImplementation(() => {
  const img: any = { width: 800, height: 600, crossOrigin: "" };
  Object.defineProperty(img, "src", {
    set() {
      setTimeout(() => imageOnload?.(), 0);
    },
  });
  Object.defineProperty(img, "onload", {
    get() { return imageOnload; },
    set(fn: any) { imageOnload = fn; },
  });
  return img;
});

// Mock canvas toBlob for the crop operation
const mockCtx = { drawImage: jest.fn() };
HTMLCanvasElement.prototype.getContext = jest.fn(() => mockCtx as any) as any;
HTMLCanvasElement.prototype.toBlob = jest.fn((cb: (b: Blob | null) => void) => {
  cb(new Blob(["cropped"], { type: "image/jpeg" }));
}) as any;

beforeEach(() => {
  jest.clearAllMocks();
  imageOnload = null;
});

function getFileInput(container: HTMLElement): HTMLInputElement {
  return container.querySelector('input[type="file"]')!;
}

describe("ProfileImageEditor", () => {
  describe("placeholder state", () => {
    it("shows placeholder when no image is provided", () => {
      render(<ProfileImageEditor isOpen={true} onSave={jest.fn()} onCancel={jest.fn()} />);
      expect(screen.getByText(/select a photo/i)).toBeInTheDocument();
      expect(screen.getByText(/choose photo/i)).toBeInTheDocument();
    });

    it("does NOT render when isOpen is false", () => {
      const { container } = render(<ProfileImageEditor isOpen={false} onSave={jest.fn()} onCancel={jest.fn()} />);
      expect(container.innerHTML).toBe("");
    });
  });

  describe("file selection", () => {
    it("shows Cropper when a file is selected", async () => {
      const { container } = render(
        <ProfileImageEditor isOpen={true} onSave={jest.fn()} onCancel={jest.fn()} />,
      );
      const file = new File(["dummy"], "photo.jpg", { type: "image/jpeg" });
      fireEvent.change(getFileInput(container), { target: { files: [file] } });
      await waitFor(() => {
        expect(screen.getByTestId("mock-cropper")).toBeInTheDocument();
      });
      expect(global.URL.createObjectURL).toHaveBeenCalledWith(file);
    });

    it("shows zoom slider and drag hint after file selection", async () => {
      const { container } = render(
        <ProfileImageEditor isOpen={true} onSave={jest.fn()} onCancel={jest.fn()} />,
      );
      const file = new File(["dummy"], "test.jpg", { type: "image/jpeg" });
      fireEvent.change(getFileInput(container), { target: { files: [file] } });
      await waitFor(() => {
        expect(screen.getByText(/drag to reposition/i)).toBeInTheDocument();
      });
    });
  });

  describe("cropper controls", () => {
    it("renders the Cropper with the selected image", async () => {
      const { container } = render(
        <ProfileImageEditor isOpen={true} currentImage="/test/photo.jpg" onSave={jest.fn()} onCancel={jest.fn()} />,
      );
      await waitFor(() => {
        expect(screen.getByTestId("mock-cropper")).toHaveAttribute("data-image", "/test/photo.jpg");
      });
    });

    it("renders zoom slider", async () => {
      const { container } = render(
        <ProfileImageEditor isOpen={true} currentImage="/test.jpg" onSave={jest.fn()} onCancel={jest.fn()} />,
      );
      await waitFor(() => {
        const sliders = document.querySelectorAll<HTMLInputElement>('input[type="range"]');
        expect(sliders.length).toBeGreaterThanOrEqual(1);
      });
    });
  });

  describe("save and cancel", () => {
    it("calls onCancel when Cancel is clicked", async () => {
      const onCancel = jest.fn();
      const { container } = render(
        <ProfileImageEditor isOpen={true} currentImage="/test.jpg" onSave={jest.fn()} onCancel={onCancel} />,
      );
      await waitFor(() => {
        expect(screen.getByTestId("mock-cropper")).toBeInTheDocument();
      });
      fireEvent.click(screen.getByText(/cancel/i));
      expect(onCancel).toHaveBeenCalled();
    });

    it("calls onCancel when close button is clicked", async () => {
      const onCancel = jest.fn();
      render(
        <ProfileImageEditor isOpen={true} currentImage="/test.jpg" onSave={jest.fn()} onCancel={onCancel} />,
      );
      await waitFor(() => {
        expect(screen.getByTestId("mock-cropper")).toBeInTheDocument();
      });
      const closeBtn = document.querySelector("svg.lucide-x")?.closest("button");
      fireEvent.click(closeBtn!);
      expect(onCancel).toHaveBeenCalled();
    });

    it("Save button is disabled when no crop area is set", async () => {
      render(
        <ProfileImageEditor isOpen={true} currentImage="/test.jpg" onSave={jest.fn()} onCancel={jest.fn()} />,
      );
      await waitFor(() => {
        const saveBtn = screen.getByText(/save/i).closest("button");
        expect(saveBtn).toBeDisabled();
      });
    });

    it("calls onSave with a Blob when Save is clicked after crop", async () => {
      const onSave = jest.fn();
      render(
        <ProfileImageEditor isOpen={true} currentImage="/test.jpg" onSave={onSave} onCancel={jest.fn()} />,
      );
      await waitFor(() => {
        expect(screen.getByTestId("mock-cropper")).toBeInTheDocument();
      });
      fireEvent.click(screen.getByTestId("mock-crop-complete"));
      fireEvent.click(screen.getByText(/save/i));
      await waitFor(() => {
        expect(onSave).toHaveBeenCalledWith(expect.any(Blob));
      });
    });

    it("Save button is not shown when no file is selected", () => {
      render(<ProfileImageEditor isOpen={true} onSave={jest.fn()} onCancel={jest.fn()} />);
      expect(screen.queryByText(/save/i)).not.toBeInTheDocument();
    });
  });
});
