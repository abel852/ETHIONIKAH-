import { useMessageStore } from "@/store/messages";
import { act } from "@testing-library/react";

const mockGetConversations = jest.fn();
const mockGetMessages = jest.fn();
const mockSendMessage = jest.fn();
const mockMarkAsRead = jest.fn();

jest.mock("@/services/messages", () => ({
  messageService: {
    getConversations: (...args: any[]) => mockGetConversations(...args),
    getMessages: (...args: any[]) => mockGetMessages(...args),
    sendMessage: (...args: any[]) => mockSendMessage(...args),
    markAsRead: (...args: any[]) => mockMarkAsRead(...args),
  },
}));

describe("messageStore", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useMessageStore.setState({
      conversations: [],
      activeConversation: null,
      messages: [],
      isLoading: false,
      error: null,
    });
  });

  it("fetchConversations loads conversations", async () => {
    const mockData = { data: { conversations: [{ id: "conv-1", name: "Chat 1" }] } };
    mockGetConversations.mockResolvedValue(mockData);

    await act(async () => {
      await useMessageStore.getState().fetchConversations();
    });

    expect(mockGetConversations).toHaveBeenCalled();
    const state = useMessageStore.getState();
    expect(state.conversations).toEqual([{ id: "conv-1", name: "Chat 1" }]);
    expect(state.error).toBeNull();
  });

  it("fetchConversations handles errors", async () => {
    mockGetConversations.mockRejectedValue(new Error("Error"));

    await act(async () => {
      await useMessageStore.getState().fetchConversations();
    });

    const state = useMessageStore.getState();
    expect(state.error).toBe("Failed to load conversations");
  });

  it("fetchMessages loads messages for conversation", async () => {
    const mockData = { data: { messages: [{ id: "msg-1", content: "Hello" }] } };
    mockGetMessages.mockResolvedValue(mockData);

    await act(async () => {
      await useMessageStore.getState().fetchMessages("conv-1");
    });

    expect(mockGetMessages).toHaveBeenCalledWith("conv-1");
    const state = useMessageStore.getState();
    expect(state.messages).toEqual([{ id: "msg-1", content: "Hello" }]);
    expect(state.isLoading).toBe(false);
  });

  it("fetchMessages handles errors", async () => {
    mockGetMessages.mockRejectedValue(new Error("Error"));

    await act(async () => {
      await useMessageStore.getState().fetchMessages("conv-1");
    });

    const state = useMessageStore.getState();
    expect(state.error).toBe("Failed to load messages");
    expect(state.isLoading).toBe(false);
  });

  it("sendMessage sends and appends to messages", async () => {
    const newMessage = { id: "msg-new", content: "Hi!" };
    mockSendMessage.mockResolvedValue({ data: newMessage });

    await act(async () => {
      await useMessageStore.getState().sendMessage("conv-1", "Hi!");
    });

    expect(mockSendMessage).toHaveBeenCalledWith("conv-1", "Hi!");
    const state = useMessageStore.getState();
    expect(state.messages).toContainEqual(newMessage);
  });

  it("sendMessage handles errors", async () => {
    mockSendMessage.mockRejectedValue(new Error("Error"));

    await act(async () => {
      await useMessageStore.getState().sendMessage("conv-1", "Hi!");
    });

    const state = useMessageStore.getState();
    expect(state.error).toBe("Failed to send message");
  });

  it("setActiveConversation updates activeConversation", () => {
    act(() => {
      useMessageStore.getState().setActiveConversation("conv-2");
    });

    const state = useMessageStore.getState();
    expect(state.activeConversation).toBe("conv-2");
  });

  it("setActiveConversation sets null", () => {
    useMessageStore.setState({ activeConversation: "conv-1" });

    act(() => {
      useMessageStore.getState().setActiveConversation(null);
    });

    expect(useMessageStore.getState().activeConversation).toBeNull();
  });

  it("markAsRead updates unreadCount", async () => {
    useMessageStore.setState({
      conversations: [{ id: "conv-1", unreadCount: 3 } as any],
    });
    mockMarkAsRead.mockResolvedValue({});

    await act(async () => {
      await useMessageStore.getState().markAsRead("conv-1");
    });

    expect(mockMarkAsRead).toHaveBeenCalledWith("conv-1");
    const state = useMessageStore.getState();
    const conv = state.conversations.find((c: any) => c.id === "conv-1");
    expect(conv?.unreadCount).toBe(0);
  });

  it("markAsRead handles errors gracefully", async () => {
    useMessageStore.setState({
      conversations: [{ id: "conv-1", unreadCount: 3 } as any],
    });
    mockMarkAsRead.mockRejectedValue(new Error("Error"));

    await act(async () => {
      await useMessageStore.getState().markAsRead("conv-1");
    });

    const state = useMessageStore.getState();
    const conv = state.conversations.find((c: any) => c.id === "conv-1");
    expect(conv?.unreadCount).toBe(3);
  });

  it("addMessage appends to messages", () => {
    useMessageStore.setState({ messages: [{ id: "old" } as any] });
    const newMsg = { id: "new" } as any;

    act(() => {
      useMessageStore.getState().addMessage(newMsg);
    });

    const state = useMessageStore.getState();
    expect(state.messages).toHaveLength(2);
    expect(state.messages[1]).toEqual(newMsg);
  });
});
