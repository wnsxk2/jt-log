import { create } from "zustand";
import { combine, devtools } from "zustand/middleware";

type User = {
  id: string;
  email: string;
};

type Session = {
  accessToken: string;
  expiresIn: number;
  expiresAt: number;
  user: User;
};

type State = {
  isLoaded: boolean;
  session: Session | null;
};

const initialState = {
  isLoaded: false,
  session: null,
} as State;

export const useSessionStore = create(
  devtools(
    combine(initialState, (set) => ({
      actions: {
        setSession: (session: Session | null) => {
          set({ session, isLoaded: true });
        },
      },
    })),
    {
      name: "sessionStore",
    },
  ),
);

export const useSession = () => {
  const session = useSessionStore((store) => store.session);
  return session;
};

export const useIsSessionLoaded = () => {
  const isSessionLoaded = useSessionStore((store) => store.isLoaded);
  return isSessionLoaded;
};

export const useSetSession = () => {
  const setSession = useSessionStore((store) => store.actions.setSession);
  return setSession;
};

export const getAccessToken = () => {
  const accessToken = useSessionStore.getState().session?.accessToken;
  return accessToken;
};
