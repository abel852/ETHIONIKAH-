import { useMatchStore } from "@/store/matches";
import { act, renderHook } from "@testing-library/react";

const mockSearch = jest.fn();
const mockGetRecommended = jest.fn();
const mockGetFavorites = jest.fn();
const mockAddFavorite = jest.fn();
const mockRemoveFavorite = jest.fn();
const mockSendInterest = jest.fn();

jest.mock("@/services/matches", () => ({
  matchService: {
    search: (...args: any[]) => mockSearch(...args),
    getRecommended: (...args: any[]) => mockGetRecommended(...args),
    getFavorites: (...args: any[]) => mockGetFavorites(...args),
    addFavorite: (...args: any[]) => mockAddFavorite(...args),
    removeFavorite: (...args: any[]) => mockRemoveFavorite(...args),
    sendInterest: (...args: any[]) => mockSendInterest(...args),
  },
}));

describe("matchStore", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useMatchStore.setState({
      matches: [],
      recommendations: [],
      favorites: [],
      favoriteProfiles: [],
      isLoading: false,
      error: null,
    });
  });

  it("fetchMatches calls matchService.search and updates state", async () => {
    const mockData = { data: { matches: [{ id: "1", name: "Test" }] } };
    mockSearch.mockResolvedValue(mockData);

    await act(async () => {
      await useMatchStore.getState().fetchMatches({ gender: "female" });
    });

    expect(mockSearch).toHaveBeenCalledWith({ gender: "female" });
    const state = useMatchStore.getState();
    expect(state.matches).toEqual([{ id: "1", name: "Test" }]);
    expect(state.isLoading).toBe(false);
    expect(state.error).toBeNull();
  });

  it("fetchMatches handles errors gracefully", async () => {
    mockSearch.mockRejectedValue(new Error("Network error"));

    await act(async () => {
      await useMatchStore.getState().fetchMatches();
    });

    const state = useMatchStore.getState();
    expect(state.error).toBe("Failed to load matches");
    expect(state.isLoading).toBe(false);
  });

  it("fetchRecommendations calls getRecommended and updates state", async () => {
    const mockData = { data: { matches: [{ id: "r1", firstName: "Recommended" }] } };
    mockGetRecommended.mockResolvedValue(mockData);

    await act(async () => {
      await useMatchStore.getState().fetchRecommendations();
    });

    expect(mockGetRecommended).toHaveBeenCalled();
    const state = useMatchStore.getState();
    expect(state.recommendations).toEqual([{ id: "r1", firstName: "Recommended" }]);
    expect(state.isLoading).toBe(false);
  });

  it("fetchRecommendations handles errors gracefully", async () => {
    mockGetRecommended.mockRejectedValue(new Error("Error"));

    await act(async () => {
      await useMatchStore.getState().fetchRecommendations();
    });

    const state = useMatchStore.getState();
    expect(state.error).toBe("Failed to load recommendations");
    expect(state.isLoading).toBe(false);
  });

  it("fetchFavorites calls getFavorites and updates state", async () => {
    const mockData = { data: { favorites: [{ id: "f1" }, { id: "f2" }] } };
    mockGetFavorites.mockResolvedValue(mockData);

    await act(async () => {
      await useMatchStore.getState().fetchFavorites();
    });

    expect(mockGetFavorites).toHaveBeenCalled();
    const state = useMatchStore.getState();
    expect(state.favorites).toEqual(["f1", "f2"]);
    expect(state.favoriteProfiles).toEqual([{ id: "f1" }, { id: "f2" }]);
  });

  it("fetchFavorites handles errors gracefully", async () => {
    mockGetFavorites.mockRejectedValue(new Error("Error"));

    await act(async () => {
      await useMatchStore.getState().fetchFavorites();
    });

    const state = useMatchStore.getState();
    expect(state.favorites).toEqual([]);
  });

  it("toggleFavorite adds to favorites when not already favorited", async () => {
    mockAddFavorite.mockResolvedValue({});

    await act(async () => {
      await useMatchStore.getState().toggleFavorite("new-id");
    });

    expect(mockAddFavorite).toHaveBeenCalledWith("new-id");
    expect(mockRemoveFavorite).not.toHaveBeenCalled();
    const state = useMatchStore.getState();
    expect(state.favorites).toContain("new-id");
  });

  it("toggleFavorite removes from favorites when already favorited", async () => {
    useMatchStore.setState({ favorites: ["existing-id"] });
    mockRemoveFavorite.mockResolvedValue({});

    await act(async () => {
      await useMatchStore.getState().toggleFavorite("existing-id");
    });

    expect(mockRemoveFavorite).toHaveBeenCalledWith("existing-id");
    expect(mockAddFavorite).not.toHaveBeenCalled();
    const state = useMatchStore.getState();
    expect(state.favorites).not.toContain("existing-id");
  });

  it("toggleFavorite handles errors gracefully", async () => {
    useMatchStore.setState({ favorites: ["id1"] });
    mockRemoveFavorite.mockRejectedValue(new Error("Error"));

    await act(async () => {
      await useMatchStore.getState().toggleFavorite("id1");
    });

    const state = useMatchStore.getState();
    expect(state.favorites).toContain("id1");
  });

  it("sendInterest calls matchService.sendInterest", async () => {
    mockSendInterest.mockResolvedValue({});

    await act(async () => {
      await useMatchStore.getState().sendInterest("user-1");
    });

    expect(mockSendInterest).toHaveBeenCalledWith("user-1");
  });

  it("sendInterest handles errors gracefully", async () => {
    mockSendInterest.mockRejectedValue(new Error("Error"));

    await act(async () => {
      await useMatchStore.getState().sendInterest("user-1");
    });

    expect(mockSendInterest).toHaveBeenCalledWith("user-1");
  });
});
