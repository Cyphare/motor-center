import { afterEach, beforeEach, describe, expect, it } from "vitest";
import type { AxiosAdapter } from "axios";

import {
  ApiRequestError,
  apiClient,
  request,
  requestPaginated,
} from "@/lib/api-client";

// Swap the axios adapter so requests resolve/reject from canned responses
// without any network, exercising the real interceptors.
const originalAdapter = apiClient.defaults.adapter;

function mockAdapter(response: {
  status: number;
  data: unknown;
}): AxiosAdapter {
  return async (config) =>
    ({
      data: response.data,
      status: response.status,
      statusText: "",
      headers: {},
      config,
    }) as Awaited<ReturnType<AxiosAdapter>>;
}

beforeEach(() => {
  // Avoid touching localStorage during the request interceptor.
  globalThis.localStorage?.clear?.();
});

afterEach(() => {
  apiClient.defaults.adapter = originalAdapter;
});

describe("request (envelope unwrap)", () => {
  it("returns the unwrapped data payload on success", async () => {
    apiClient.defaults.adapter = mockAdapter({
      status: 200,
      data: { success: true, message: "ok", data: { id: "abc", name: "Budi" } },
    });

    const result = await request<{ id: string; name: string }>({
      method: "GET",
      url: "/anything",
    });

    expect(result).toEqual({ id: "abc", name: "Budi" });
  });
});

describe("requestPaginated", () => {
  it("returns data and pagination metadata", async () => {
    apiClient.defaults.adapter = mockAdapter({
      status: 200,
      data: {
        success: true,
        message: "ok",
        data: [{ id: 1 }],
        pagination: { page: 1, limit: 10, total: 1, totalPages: 1 },
      },
    });

    const result = await requestPaginated<{ id: number }[]>({
      method: "GET",
      url: "/list",
    });

    expect(result.data).toEqual([{ id: 1 }]);
    expect(result.pagination).toEqual({
      page: 1,
      limit: 10,
      total: 1,
      totalPages: 1,
    });
  });
});

describe("error throwing", () => {
  it("throws a typed ApiRequestError on a non-2xx envelope", async () => {
    apiClient.defaults.adapter = mockAdapter({
      status: 400,
      data: {
        success: false,
        message: "Validasi gagal",
        errors: [{ field: "email", message: "Email tidak valid" }],
      },
    });

    await expect(
      request({ method: "POST", url: "/auth/register", data: {} })
    ).rejects.toMatchObject({
      name: "ApiRequestError",
      status: 400,
      message: "Validasi gagal",
    });
  });

  it("exposes field errors on the thrown error", async () => {
    apiClient.defaults.adapter = mockAdapter({
      status: 400,
      data: {
        success: false,
        message: "Validasi gagal",
        errors: [
          { field: "email", location: "body", message: "Email tidak valid" },
        ],
      },
    });

    try {
      await request({ method: "POST", url: "/auth/register", data: {} });
      throw new Error("should have thrown");
    } catch (error) {
      expect(error).toBeInstanceOf(ApiRequestError);
      const apiError = error as ApiRequestError;
      expect(apiError.fieldErrors).toEqual([
        { field: "email", location: "body", message: "Email tidak valid" },
      ]);
    }
  });

  it("throws on a success:false body even with a 200 status", async () => {
    apiClient.defaults.adapter = mockAdapter({
      status: 200,
      data: { success: false, message: "Tetap gagal" },
    });

    await expect(request({ method: "GET", url: "/x" })).rejects.toMatchObject({
      name: "ApiRequestError",
      message: "Tetap gagal",
    });
  });
});
