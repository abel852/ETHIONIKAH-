jest.mock("@/lib/api", () => ({
  __esModule: true,
  default: { get: jest.fn(), post: jest.fn(), put: jest.fn(), delete: jest.fn() },
}));

import api from "@/lib/api";
import { messageService } from "@/services/messages";

const mockGet = api.get as jest.Mock;
const mockPost = api.post as jest.Mock;
const mockPut = api.put as jest.Mock;
const mockDelete = api.delete as jest.Mock;

describe("messageService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("getConversations calls correct endpoint", () => {
    messageService.getConversations();
    expect(mockGet).toHaveBeenCalledWith("/messages/conversations");
  });

  it("getMessages calls correct endpoint", () => {
    messageService.getMessages("conv-1");
    expect(mockGet).toHaveBeenCalledWith("/messages/conversation/conv-1");
  });

  it("sendMessage calls correct endpoint", () => {
    messageService.sendMessage("conv-1", "Hello!");
    expect(mockPost).toHaveBeenCalledWith("/messages", { receiverId: "conv-1", content: "Hello!" });
  });

  it("markAsRead calls correct endpoint", () => {
    messageService.markAsRead("msg-1");
    expect(mockPut).toHaveBeenCalledWith("/messages/msg-1/read");
  });

  it("deleteMessage calls correct endpoint", () => {
    messageService.deleteMessage("msg-1");
    expect(mockDelete).toHaveBeenCalledWith("/messages/msg-1");
  });

  it("blockUser calls correct endpoint", () => {
    messageService.blockUser("user-123");
    expect(mockPost).toHaveBeenCalledWith("/messages/block", { blockedUserId: "user-123" });
  });
});
