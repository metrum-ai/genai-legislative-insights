/* Created by Metrum AI for Dell */
import { configureStore } from "@reduxjs/toolkit";
import UserSlice from "../actions/UserSlice";
import api from "./api";

export const store = configureStore({
  reducer: {
    user: UserSlice,
    [api.reducerPath]: api.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(api.middleware),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export default store;
