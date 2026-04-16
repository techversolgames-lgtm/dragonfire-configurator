import { create } from "zustand";
import { persist } from "zustand/middleware";
import crypto from "crypto";

const useAuthStore = create(
  persist(
    (set) => ({
      // authorizedManufacturers: new Set(),
      authorizedManufacturer: null,
      currentUser: "guest",
      userImage: "/guest.png",

      validUsers: {
        nikolatesla: {
          name: "Nikola Tesla",
          image: "/tesla.png",
        },
      },

      // verifyUsername: (username) => {
      //   const state = useAuthStore.getState();
      //   return username in state.validUsers;
      // },

      setUser: (manufacturer) => {
        set(() => ({
          currentUser: manufacturer,
          authorizedManufacturer: manufacturer,
          userImage: "/tesla.png",
        }));
      },

      hashPassword: (password) => {
        return crypto.createHash("sha256").update(password).digest("hex");
      },

      verifyPassword: (manufacturer, password) => {
        const manufacturerPasswords = {
          camtech: "m7n4p2",
          forgeline: "x3k9v5",
          "keizer-aluminium": "j8h2w6",
          mezco: "f2d6k9",
          "pl-custom": "t4q9c3",
          storloc: "b5r7n8",
          "tafel-home": "p8v3m4",
          "mob-armor": "m3h6c8",
          nexafence: "nex123",
        };
        const correctPassword = manufacturerPasswords[manufacturer];
        if (!correctPassword) return false;

        const hashedInput = useAuthStore.getState().hashPassword(password);
        const hashedCorrect = useAuthStore
          .getState()
          .hashPassword(correctPassword);
        if (hashedInput === hashedCorrect) {
          set((state) => ({
            // authorizedManufacturers: new Set([
            //   ...state.authorizedManufacturers,
            //   manufacturer,
            // ]),
            authorizedManufacturer: manufacturer,
          }));
          return true;
        }
        return false;
      },

      isAuthorized: (manufacturer) => {
        return useAuthStore.getState().authorizedManufacturer === manufacturer;
      },

      logout: (manufacturer) => {
        set((state) => ({
          authorizedManufacturers: new Set(
            [...state.authorizedManufacturers].filter(
              (m) => m !== manufacturer,
            ),
          ),
        }));
      },
      login: () => {
        set({ isAuthenticated: true });
      },
    }),
    {
      name: "auth-storage",
      partialize: (state) => ({
        authorizedManufacturer: state.authorizedManufacturer,
        currentUser: state.currentUser,
        userImage: state.userImage,
      }),
      onRehydrateStorage: () => (state) => {
        if (state && state.authorizedManufacturers) {
          state.authorizedManufacturers = new Set(
            state.authorizedManufacturers,
          );
        }
      },
    },
  ),
);

export default useAuthStore;
