import { create } from "zustand";
import toast from "react-hot-toast";
import { axiosInstance } from "../lib/axios";
import { useAuthStore, User } from "./useAuthStore";
import { AxiosError } from "axios";

export interface Message {
  _id?: string;
  senderId?: string;
  receiverId?: string;
  text: string;
  image: string | null;
  createdAt?: number;
  updatedAt?: number;
}

export interface ChatState {
  messages: Message[];
  users: Array<User>;
  selectedUser: User | null;
  isUsersLoading: boolean;
  isMessagesLoading: boolean;

  getUsers: () => Promise<void>;
  getMessages: (userId: string) => Promise<void>;
  sendMessage: (messageData: Message) => Promise<void>;
  subscribeToMessages: () => void;
  unsubscribeFromMessages: () => void;
  setSelectedUser: (selectedUser: User | null) => void;
}

export const useChatStore = create<ChatState>((set, get) => ({
  messages: [],
  users: [],
  selectedUser: null,
  isUsersLoading: false,
  isMessagesLoading: false,

  getUsers: async (): Promise<void> => {
    set({ isUsersLoading: true });
    try {
      const res = await axiosInstance.get("/messages/users");
      set({ users: res.data });
    } catch (error) {
      if (error instanceof AxiosError) {
        const status = error?.response?.status;
        const statusText = error?.response?.statusText;

        const message =
          status && statusText
            ? `Error ${status} - ${statusText}`
            : "An error occurred in getting users";

        toast.error(message);
      } else {
        const errorMessage =
          (error as Error)?.message || "An unexpected error occurred";
        toast.error(errorMessage);
      }
    } finally {
      set({ isUsersLoading: false });
    }
  },
  getMessages: async (userId: string): Promise<void> => {
    set({ isMessagesLoading: true });
    try {
      const res = await axiosInstance.get(`/messages/${userId}`);
      set({ messages: res.data });
    } catch (error) {
      if (error instanceof AxiosError) {
        const status = error?.response?.status;
        const statusText = error?.response?.statusText;

        const message =
          status && statusText
            ? `Error ${status} - ${statusText}`
            : "An error occurred in getting messages";

        toast.error(message);
      }
    } finally {
      set({ isMessagesLoading: false });
    }
  },
  sendMessage: async (messageData: Message): Promise<void> => {
    const { selectedUser, messages } = get();
    try {
      const res = await axiosInstance.post(
        `/messages/send/${selectedUser?._id}`,
        messageData
      );
      set({ messages: [...messages, res.data] });
    } catch (error) {
      if (error instanceof AxiosError) {
        const status = error?.response?.status;
        const statusText = error?.response?.statusText;

        const message =
          status && statusText
            ? `Error ${status} - ${statusText}`
            : "An error occurred in getting messages";

        toast.error(message);
      }
    }
  },
  subscribeToMessages: () => {
    const { selectedUser } = get();
    if (!selectedUser) return;

    const socket = useAuthStore.getState().socket;
    console.log('is connected in useChatStore', socket?.connected);
    socket?.on("newMessage", (newMessage) => {
      const isMessageSentFromSelectedUser = newMessage.senderId === selectedUser._id;
      if (!isMessageSentFromSelectedUser) return;
      
      set({
        messages: [...get().messages, newMessage],
      });
    });
  },
  unsubscribeFromMessages: () => {
    const socket = useAuthStore.getState().socket;
    socket?.off("newMessage");
  },
  setSelectedUser: (selectedUser) => set({ selectedUser }),
}));
