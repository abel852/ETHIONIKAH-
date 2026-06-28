jest.mock("@/lib/api", () => ({
  __esModule: true,
  default: { get: jest.fn(), post: jest.fn(), put: jest.fn(), delete: jest.fn() },
}));

import api from "@/lib/api";
import { profileService } from "@/services/profile";

const mockGet = api.get as jest.Mock;
const mockPost = api.post as jest.Mock;
const mockDelete = api.delete as jest.Mock;

describe("profileService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("getMyProfile calls correct endpoint", () => {
    profileService.getMyProfile();
    expect(mockGet).toHaveBeenCalledWith("/profile/me");
  });

  it("getProfileById calls correct endpoint", () => {
    profileService.getProfileById("user-123");
    expect(mockGet).toHaveBeenCalledWith("/profile/user-123");
  });

  it("createOrUpdate calls correct endpoint", () => {
    const data = { firstName: "John", bio: "Updated bio" };
    profileService.createOrUpdate(data);
    expect(mockPost).toHaveBeenCalledWith("/profile", data);
  });

  it("uploadPhoto calls correct endpoint with FormData", () => {
    const file = new File(["test"], "photo.jpg", { type: "image/jpeg" });
    profileService.uploadPhoto(file);
    expect(mockPost).toHaveBeenCalledWith("/profile/photo", expect.any(FormData));
  });

  it("deletePhoto calls correct endpoint", () => {
    profileService.deletePhoto(1);
    expect(mockDelete).toHaveBeenCalledWith("/profile/photo", { data: { photoIndex: 1 } });
  });

  it("setProfileComplete calls correct endpoint", () => {
    profileService.setProfileComplete();
    expect(mockPost).toHaveBeenCalledWith("/profile/complete");
  });

  it("updateProfileStep calls correct endpoint", () => {
    profileService.updateProfileStep({ step: 3 });
    expect(mockPost).toHaveBeenCalledWith("/profile/step", { step: 3 });
  });

  it("getSpousePreference calls correct endpoint", () => {
    profileService.getSpousePreference();
    expect(mockGet).toHaveBeenCalledWith("/spouse-preference");
  });

  it("updateSpousePreference calls correct endpoint", () => {
    const data = { minAge: 25, maxAge: 35 };
    profileService.updateSpousePreference(data);
    expect(mockPost).toHaveBeenCalledWith("/spouse-preference", data);
  });
});
