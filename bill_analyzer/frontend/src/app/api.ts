/* Created by Metrum AI for Dell */
/* eslint-disable @typescript-eslint/no-empty-object-type */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import {
  BaseQueryApi,
  createApi,
  fetchBaseQuery,
} from "@reduxjs/toolkit/query/react";

const VITE_REMOTE_IP = window.location.hostname;

interface StartRunsResponse {
  flow_run_id: string;
  state: string;
}

interface ReplicaIdsResponse {
  [key: string]: string;
}

interface LoginRequest {
  username: string;
  password: string;
}

interface LoginResponse {
  access_token: string;
  token_type: string;
}

interface RegisterRequest {
  username: string;
  password: string;
}

const dynamicBaseQuery = async (
  args: { [x: string]: any; url: any; headers: any },
  api: BaseQueryApi,
  extraOptions: {}
) => {
  const { url, headers = {}, ...rest } =
    typeof args === "string" ? { url: args, headers: {} } : args;
  const baseUrl =  `http://${VITE_REMOTE_IP}:8100/api`;

  // Get auth token from store
  const state = api.getState() as { user: { token?: string } };
  const token = state.user?.token;

  // Add authorization header if token exists
  const updatedHeaders = {
    ...headers,
    ...(token && { Authorization: `Bearer ${token}` })
  };

  return fetchBaseQuery({ baseUrl })({ url, headers: updatedHeaders, ...rest }, api, extraOptions);
};

const api = createApi({
  reducerPath: "api",
  baseQuery: dynamicBaseQuery,
  endpoints: (builder) => ({
    startRuns: builder.mutation<
      StartRunsResponse,
      { bill: File; replicas: number }
    >({
      query: ({ bill, replicas }) => {
        const formData = new FormData();
        formData.append("bill", bill);
        return {
          url: `/start_runs?replicas=${replicas}`,
          method: "POST",
          body: formData,
          headers: {}, // Add headers property
        };
      },
    }),
    getReplicaIds: builder.query<ReplicaIdsResponse, string>({
      query: (flowRunId) => ({
        url: `/get_replica_ids?flow_run_id=${flowRunId}`,
        method: "GET",
        headers: {},
      }),
    }),
    getStatus: builder.query<any, string>({
      query: (replicaId) => ({
        url: `/get_status?flow_run_id=${replicaId}`,
        method: "GET",
        headers: {},
      }),
    }),
    getOutput: builder.query<any, string>({
      query: (key) => ({
        url: `/get_output?key=${key}`,
        method: "GET",
        headers: {}, // Add headers property
      }),
    }),
    loginUser: builder.mutation<LoginResponse, LoginRequest>({
      query: (credentials) => ({
        url: '/auth/token',
        method: 'POST',
        body: new URLSearchParams({
          username: credentials.username,
          password: credentials.password
        }).toString(),
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      }),
    }),

    logoutUser: builder.mutation<void, void>({
      query: () => ({
        url: '/auth/logout',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      }),
    }),
    registerUser: builder.mutation<void, RegisterRequest>({
      query: (userData) => ({
        url: '/auth/register',
        method: 'POST',
        body: new URLSearchParams({
          username: userData.username,
          password: userData.password
        }).toString(),
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      }),
    }),
  }),
});

export const {
  useStartRunsMutation,
  useGetReplicaIdsQuery,
  useGetStatusQuery,
  useGetOutputQuery,
  useLazyGetOutputQuery,
  useLoginUserMutation,
  useLogoutUserMutation,
  useRegisterUserMutation,
} = api;

export default api;
