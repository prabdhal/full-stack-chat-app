import { create } from "zustand";
import { axiosInstance } from "../lib/axios";
import { RegisterFormField } from "../pages/RegisterPage";
import toast from "react-hot-toast";
import { AxiosError } from "axios";
import { LoginFormField } from "../pages/LoginPage";
import { UpdateProfileField } from "../pages/ProfilePage";
import { io, Socket } from "socket.io-client";

const BASE_URL =
  import.meta.env.MODE === "developement" ? "http://localhost:5001/api" : "/";

export interface User {
  _id: string;
  name: string;
  email: string;
  fullName: string;
  password: string;
  profilePic: string;
  createdAt: number;
  updatedAt: number;
}

export interface AuthState {
  authUser: User | null;
  isRegistering: boolean;
  isLoggingIn: boolean;
  isUpdatingProfile: boolean;
  isCheckingAuth: boolean;
  onlineUsers: string[];
  socket: Socket | null;

  checkAuth: () => Promise<void>;
  register: (data: RegisterFormField) => Promise<void>;
  login: (data: LoginFormField) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (data: UpdateProfileField) => Promise<void>;
  connectSocket: () => void;
  disconnectSocket: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  authUser: null,
  isRegistering: false,
  isLoggingIn: false,
  isUpdatingProfile: false,
  isCheckingAuth: true,
  onlineUsers: [],
  socket: null,

  checkAuth: async () => {
    try {
      const res = await axiosInstance.get("/auth/check");

      set({ authUser: res.data });
      get().connectSocket();
    } catch (error) {
      set({ authUser: null });
      if (error instanceof AxiosError) {
        const status = error?.response?.status;
        const statusText = error?.response?.statusText;

        const message =
          status && statusText
            ? `Error ${status} - ${statusText}`
            : "An error occurred in authentication";

        toast.error(message);
      } else {
        const errorMessage =
          (error as Error)?.message ||
          "An unexpected error occurred in authentication";
        toast.error(errorMessage);
      }
    } finally {
      set({ isCheckingAuth: false });
    }
  },
  register: async (data: RegisterFormField) => {
    set({ isRegistering: true });
    try {
      const res = await axiosInstance.post("/auth/register", data);
      set({ authUser: res.data });
      toast.success("Account created successfully");
      get().connectSocket();
    } catch (error: unknown) {
      set({ authUser: null });
      if (error instanceof AxiosError) {
        const status = error?.response?.status;
        const statusText = error?.response?.statusText;

        const message =
          status && statusText
            ? `Error ${status} - ${statusText}`
            : "An error occurred in registration";

        toast.error(message);
      } else {
        const errorMessage =
          (error as Error)?.message || "An unexpected error occurred";
        toast.error(errorMessage);
      }
    } finally {
      set({ isRegistering: false });
    }
  },
  login: async (data: LoginFormField) => {
    set({ isLoggingIn: true });
    try {
      const res = await axiosInstance.post("/auth/login", data);
      set({ authUser: res.data });
      toast.success("Logged in successfully");

      get().connectSocket();
    } catch (error: unknown) {
      set({ authUser: null });
      if (error instanceof AxiosError) {
        const status = error?.response?.status;
        const statusText = error?.response?.statusText;

        const message =
          status && statusText
            ? `Error ${status} - ${statusText}`
            : "An error occurred in login";

        toast.error(message);
      } else {
        const errorMessage =
          (error as Error)?.message || "An unexpected error occurred in login";
        toast.error(errorMessage);
      }
    } finally {
      set({ isLoggingIn: false });
    }
  },
  logout: async () => {
    try {
      await axiosInstance.post("/auth/logout");
      set({ authUser: null });
      toast.success("Logged out successfully");
      get().disconnectSocket();
    } catch (error: unknown) {
      if (error instanceof AxiosError) {
        const status = error?.response?.status;
        const statusText = error?.response?.statusText;

        const message =
          status && statusText
            ? `Error ${status} - ${statusText}`
            : "An error occurred in logout";

        toast.error(message);
      } else {
        const errorMessage =
          (error as Error)?.message || "An unexpected error occurred in logout";
        toast.error(errorMessage);
      }
    }
  },
  updateProfile: async (data: UpdateProfileField) => {
    set({ isUpdatingProfile: true });
    try {
      const res = await axiosInstance.put("/auth/update-profile", data);
      set({ authUser: res.data });
      toast.success("Profile updated successfully");
    } catch (error: unknown) {
      if (error instanceof AxiosError) {
        const status = error?.response?.status;
        const statusText = error?.response?.statusText;

        const message =
          status && statusText
            ? `Error ${status} - ${statusText}`
            : "An error occurred in update profile";

        toast.error(message);
      } else {
        const errorMessage =
          (error as Error)?.message ||
          "An unexpected error occurred in update profile";
        toast.error(errorMessage);
      }
    } finally {
      set({ isUpdatingProfile: false });
    }
  },
  connectSocket: () => {
    const { authUser } = get();
    if (!authUser || get().socket?.connected) return;

    const socket = io(BASE_URL, {
      query: {
        userId: authUser._id,
      },
    });
    socket.connect();
    console.log("is connected in useAuthStore", socket?.connected);

    set({ socket: socket });

    socket.on("getOnlineUsers", (userIds) => {
      set({ onlineUsers: userIds });
    });
  },
  disconnectSocket: () => {
    if (get().socket?.connected) get().socket?.disconnect();
  },
}));
