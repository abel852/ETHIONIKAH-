jest.mock("@/lib/api", () => ({
  __esModule: true,
  default: { get: jest.fn(), post: jest.fn(), put: jest.fn(), delete: jest.fn() },
}));

import api from "@/lib/api";
import { matchService } from "@/services/matches";

const mockGet = api.get as jest.Mock;
const mockPost = api.post as jest.Mock;
const mockPut = api.put as jest.Mock;
const mockDelete = api.delete as jest.Mock;

describe("matchService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("getRecommended calls correct endpoint", () => {
    matchService.getRecommended();
    expect(mockGet).toHaveBeenCalledWith("/matches/recommended");
  });

  it("search calls correct endpoint with params", () => {
    matchService.search({ page: 1, limit: 10 });
    expect(mockGet).toHaveBeenCalledWith("/matches/search", { params: { page: 1, limit: 10 } });
  });

  it("sendInterest calls correct endpoint", () => {
    matchService.sendInterest("user-789");
    expect(mockPost).toHaveBeenCalledWith("/matches/interest", { matchedUserId: "user-789" });
  });

  it("respondToInterest calls correct endpoint", () => {
    matchService.respondToInterest("match-1", "accepted");
    expect(mockPut).toHaveBeenCalledWith("/matches/match-1/respond", { status: "accepted" });
  });

  it("respondToInterest rejects calls correct endpoint", () => {
    matchService.respondToInterest("match-1", "rejected");
    expect(mockPut).toHaveBeenCalledWith("/matches/match-1/respond", { status: "rejected" });
  });

  it("getMyMatches calls correct endpoint", () => {
    matchService.getMyMatches();
    expect(mockGet).toHaveBeenCalledWith("/matches/my-matches");
  });

  it("getFavorites calls correct endpoint", () => {
    matchService.getFavorites();
    expect(mockGet).toHaveBeenCalledWith("/matches/favorites");
  });

  it("addFavorite calls correct endpoint", () => {
    matchService.addFavorite("user-789");
    expect(mockPost).toHaveBeenCalledWith("/matches/favorites", { favoritedUserId: "user-789" });
  });

  it("removeFavorite calls correct endpoint", () => {
    matchService.removeFavorite("user-789");
    expect(mockDelete).toHaveBeenCalledWith("/matches/favorites/user-789");
  });
});
