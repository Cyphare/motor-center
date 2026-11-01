import { afterEach, beforeEach, describe, expect, it } from "vitest";
import axios, { AxiosError, type AxiosAdapter } from "axios";

import {
  ApiRequestError,
  apiClient,
  request,
  requestBlob,
  requestPaginated,
} from "@/lib/api-client";

// Swap the axios adapter so requests resolve/reject from canned responses
// without any network, exercising the real interceptors.
const originalAdapter = apiClient.defaults.adapter;
const originalDefaultAdapter = axios.defaults.adapter;

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
  axios.defaults.adapter = originalDefaultAdapter;
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

describe("requestBlob error decoding", () => {
  // requestBlob uses responseType: "blob", so a rejected response delivers the
  // body as a Blob. Reject the default axios adapter with an AxiosError whose
  // response.data is a Blob, which is what axios produces for a blob request.
  function rejectingBlobAdapter(blob: Blob, status: number): AxiosAdapter {
    return async (config) => {
      throw new AxiosError(
        `Request failed with status code ${status}`,
        AxiosError.ERR_BAD_REQUEST,
        config,
        undefined,
        {
          data: blob,
          status,
          statusText: "Bad Request",
          headers: {},
          config,
        }
      );
    };
  }

  it("decodes a JSON blob error body into a friendly ApiRequestError", async () => {
    const blob = new Blob(
      [
        JSON.stringify({
          success: false,
          message: "Faktur tersedia setelah tiket berstatus Diambil",
          errors: [],
        }),
      ],
      { type: "application/json" }
    );

    axios.defaults.adapter = rejectingBlobAdapter(blob, 400);

    await expect(
      requestBlob({ method: "GET", url: "/bookings/x/invoice/pdf" })
    ).rejects.toMatchObject({
      name: "ApiRequestError",
      status: 400,
      message: "Faktur tersedia setelah tiket berstatus Diambil",
    });
  });

  it("falls back to the generic axios message when the blob body is not JSON", async () => {
    const blob = new Blob(["<html>Not Found</html>"], { type: "text/html" });

    axios.defaults.adapter = rejectingBlobAdapter(blob, 404);

    try {
      await requestBlob({ method: "GET", url: "/bookings/x/invoice/pdf" });
      throw new Error("should have thrown");
    } catch (error) {
      expect(error).toBeInstanceOf(ApiRequestError);
      const apiError = error as ApiRequestError;
      expect(apiError.status).toBe(404);
      expect(apiError.message).toContain("Request failed");
      expect(apiError.fieldErrors).toEqual([]);
    }
  });
});
