jest.mock("@/lib/api", () => ({
  __esModule: true,
  default: { get: jest.fn(), post: jest.fn(), put: jest.fn(), delete: jest.fn() },
}));

import api from "@/lib/api";
import { verificationService } from "@/services/verification";

const mockGet = api.get as jest.Mock;
const mockPost = api.post as jest.Mock;

describe("verificationService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("getStatus calls correct endpoint", () => {
    verificationService.getStatus();
    expect(mockGet).toHaveBeenCalledWith("/verification/me");
  });

  it("submitVerification calls correct endpoint with FormData", () => {
    const formData = new FormData();
    formData.append("doc", "file");
    verificationService.submitVerification(formData);
    expect(mockPost).toHaveBeenCalledWith("/verification", formData, {
      headers: { "Content-Type": undefined },
    });
  });

  it("uploadProfilePhoto calls correct endpoint with FormData", () => {
    const formData = new FormData();
    formData.append("photo", "file");
    verificationService.uploadProfilePhoto(formData);
    expect(mockPost).toHaveBeenCalledWith("/profile/photo", formData, {
      headers: { "Content-Type": undefined },
    });
  });
});
