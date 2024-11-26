/* Created by Metrum AI for Dell */
import { createSlice } from "@reduxjs/toolkit";
import api from "../app/api";

// Add this interface at the top of the file
interface User {
  username: string;
  // add other user properties here
}

const initialState = {
  token: localStorage.getItem("token"),
  user: null as User | null,
  isAuthenticated: !!localStorage.getItem("token"),
  flowRunId: null as string | null,
  replicas: [] as string[],
  firstReplicaId: null as string | null,
  status: {},
  output: {},
  jobs: null as number | null,
};

const userSlice = createSlice({
  name: "user",
  initialState,
  reducers: {
    setJobs: (state, action) => {
      state.jobs = action.payload;
    },
    setToken: (state, action) => {
      state.token = action.payload;
      state.isAuthenticated = true;
      localStorage.setItem("token", action.payload);
    },
    setUser: (state, action) => {
      state.user = action.payload;
    },
    clearUser: (state) => {
      state.token = null;
      state.user = null;
      state.isAuthenticated = false;
      localStorage.removeItem("token");
    },
  },
  extraReducers: (builder) => {
    builder
      // Store flow run ID and initial status from startRuns
      .addMatcher(
        api.endpoints.startRuns.matchFulfilled,
        (state, { payload }) => {
          state.flowRunId = payload.flow_run_id;
          state.status = { ...state.status, flowState: payload.state };
        }
      )
      // Store all replica IDs and set the first replica ID for polling
      .addMatcher(
        api.endpoints.getReplicaIds.matchFulfilled,
        (state, { payload }) => {
          state.replicas = Object.values(payload); // Store all replica IDs as array
          state.firstReplicaId = state.replicas[0] || null; // Only use the first replica ID for polling
        }
      )
      // Update status with the latest polled status
      .addMatcher(
        api.endpoints.getStatus.matchFulfilled,
        (state, { payload }) => {
          state.status = { ...state.status, ...payload };
        }
      );
  },
});

export const { setJobs, setToken, setUser, clearUser } = userSlice.actions;
export default userSlice.reducer;
