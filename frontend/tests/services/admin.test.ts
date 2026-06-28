jest.mock("@/lib/api", () => ({
  __esModule: true,
  default: { get: jest.fn(), post: jest.fn(), put: jest.fn(), delete: jest.fn() },
}));

import api from "@/lib/api";
import { adminService } from "@/services/admin";

const mockGet = api.get as jest.Mock;
const mockPost = api.post as jest.Mock;
const mockPut = api.put as jest.Mock;
const mockDelete = api.delete as jest.Mock;

describe("adminService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("getUsers calls correct endpoint", () => {
    adminService.getUsers();
    expect(mockGet).toHaveBeenCalledWith("/admin/users", { params: undefined });
  });

  it("getUsers with params calls correct endpoint", () => {
    adminService.getUsers({ page: 1, limit: 20 });
    expect(mockGet).toHaveBeenCalledWith("/admin/users", { params: { page: 1, limit: 20 } });
  });

  it("getUserById calls correct endpoint", () => {
    adminService.getUserById("user-1");
    expect(mockGet).toHaveBeenCalledWith("/admin/users/user-1");
  });

  it("suspendUser calls correct endpoint", () => {
    adminService.suspendUser("user-1", "violation");
    expect(mockPost).toHaveBeenCalledWith("/admin/users/user-1/suspend", { reason: "violation" });
  });

  it("activateUser calls correct endpoint", () => {
    adminService.activateUser("user-1");
    expect(mockPost).toHaveBeenCalledWith("/admin/users/user-1/activate");
  });

  it("banUser calls correct endpoint", () => {
    adminService.banUser("user-1", "spam");
    expect(mockPost).toHaveBeenCalledWith("/admin/users/user-1/ban", { reason: "spam" });
  });

  it("deleteUser calls correct endpoint", () => {
    adminService.deleteUser("user-1");
    expect(mockDelete).toHaveBeenCalledWith("/admin/users/user-1");
  });

  it("verifyUser calls correct endpoint", () => {
    adminService.verifyUser("user-1");
    expect(mockPost).toHaveBeenCalledWith("/admin/users/user-1/verify");
  });

  it("getReports calls correct endpoint", () => {
    adminService.getReports();
    expect(mockGet).toHaveBeenCalledWith("/reports/admin/all", { params: {} });
  });

  it("getSubscriptions calls correct endpoint", () => {
    adminService.getSubscriptions();
    expect(mockGet).toHaveBeenCalledWith("/subscriptions/admin/subscriptions", { params: undefined });
  });

  it("getAnalytics calls correct endpoint", () => {
    adminService.getAnalytics();
    expect(mockGet).toHaveBeenCalledWith("/admin/analytics");
  });

  it("getDashboardData calls correct endpoint", () => {
    adminService.getDashboardData();
    expect(mockGet).toHaveBeenCalledWith("/admin/dashboard");
  });

  it("getSettings calls correct endpoint", () => {
    adminService.getSettings();
    expect(mockGet).toHaveBeenCalledWith("/admin/settings");
  });

  it("listAdmins calls correct endpoint", () => {
    adminService.listAdmins();
    expect(mockGet).toHaveBeenCalledWith("/admin/admins");
  });
});
