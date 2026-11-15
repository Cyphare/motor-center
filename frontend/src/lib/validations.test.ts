import { describe, expect, it } from "vitest";

import {
  changePasswordFormSchema,
  createOnlineBookingFormSchema,
  createStaffFormSchema,
  createWalkInBookingFormSchema,
  loginFormSchema,
  partFormSchema,
  registerFormSchema,
  restockPartFormSchema,
  serviceFormSchema,
  updateProfileFormSchema,
  validateDateRange,
} from "@/lib/validations";

describe("centralized Zod v4 form schemas", () => {
  it("trims whitespace before checking min-length constraints", () => {
    expect(
      registerFormSchema.safeParse({
        name: "   ",
        email: "user@motorcenter.id",
        password: "password123",
        phone: "08123456789",
      }).success
    ).toBe(false);

    expect(
      createOnlineBookingFormSchema.safeParse({
        plateNumber: "   ",
        motorModel: "Honda Beat",
        complaint: "Mesin kasar",
      }).success
    ).toBe(false);

    expect(
      updateProfileFormSchema.safeParse({
        name: "Budi Santoso",
        phone: "081234567890",
      }).success
    ).toBe(true);
  });

  it("enforces 10-13 digit numeric phone numbers matching backend phoneSchema", () => {
    expect(
      registerFormSchema.safeParse({
        name: "Andi",
        email: "andi@motorcenter.id",
        password: "password123",
        phone: "081234567", // 9 digits -> rejected
      }).success
    ).toBe(false);

    expect(
      registerFormSchema.safeParse({
        name: "Andi",
        email: "andi@motorcenter.id",
        password: "password123",
        phone: "08123456789012", // 14 digits -> rejected
      }).success
    ).toBe(false);

    expect(
      createWalkInBookingFormSchema.safeParse({
        customerName: "Andi",
        customerPhone: "+62812345678", // non-digits -> rejected
        plateNumber: "B 1234 XYZ",
        motorModel: "Honda Beat",
        complaint: "Ganti oli",
      }).success
    ).toBe(false);

    expect(
      createWalkInBookingFormSchema.safeParse({
        customerName: "Andi",
        customerPhone: "081234567890", // 12 digits -> accepted
        plateNumber: "B 1234 XYZ",
        motorModel: "Honda Beat",
        complaint: "Ganti oli",
      }).success
    ).toBe(true);
  });

  it("enforces password confirmation and rejects reusing oldPassword", () => {
    const sameAsOld = changePasswordFormSchema.safeParse({
      oldPassword: "secret123",
      newPassword: "secret123",
      confirmPassword: "secret123",
    });
    expect(sameAsOld.success).toBe(false);

    const mismatched = changePasswordFormSchema.safeParse({
      oldPassword: "secret123",
      newPassword: "newpassword123",
      confirmPassword: "differentpassword",
    });
    expect(mismatched.success).toBe(false);

    const valid = changePasswordFormSchema.safeParse({
      oldPassword: "secret123",
      newPassword: "newpassword123",
      confirmPassword: "newpassword123",
    });
    expect(valid.success).toBe(true);
  });

  it("validates integer string inputs for parts, restock, and services", () => {
    expect(
      partFormSchema.safeParse({
        code: "OIL-001",
        name: "Oli Mesin",
        stock: "10",
        minStock: "2",
        price: "55000",
        unit: "botol",
      }).success
    ).toBe(true);

    expect(
      partFormSchema.safeParse({
        code: "OIL-001",
        name: "Oli Mesin",
        stock: "-1",
        minStock: "2",
        price: "55000",
        unit: "botol",
      }).success
    ).toBe(false);

    expect(
      restockPartFormSchema.safeParse({
        quantity: "5",
        note: "Supplier AHM",
      }).success
    ).toBe(true);

    expect(
      restockPartFormSchema.safeParse({
        quantity: "0",
      }).success
    ).toBe(false);

    expect(
      serviceFormSchema.safeParse({
        name: "Servis Rutin",
        description: "Cek rutin",
        estimatedPrice: "75000",
        estimatedDurationMinutes: "0",
      }).success
    ).toBe(false);
  });

  it("validates login and staff creation schemas", () => {
    expect(
      loginFormSchema.safeParse({
        email: "admin@motorcenter.id",
        password: "secret",
      }).success
    ).toBe(true);

    expect(
      createStaffFormSchema.safeParse({
        name: "Rina",
        email: "rina@motorcenter.id",
        password: "password123",
        role: "kasir",
        phone: "081234567890",
      }).success
    ).toBe(true);
  });
});

describe("validateDateRange", () => {
  it("allows empty dates and partial dates when requireBoth is false", () => {
    expect(validateDateRange("", "")).toBeNull();
    expect(validateDateRange("2026-04-01", "")).toBeNull();
    expect(validateDateRange("", "2026-04-30")).toBeNull();
  });

  it("requires both dates when requireBoth is true", () => {
    expect(validateDateRange("", "", { requireBoth: true })).toBeNull();
    expect(
      validateDateRange("2026-04-01", "", { requireBoth: true })
    ).not.toBeNull();
  });

  it("rejects reversed date ranges", () => {
    expect(validateDateRange("2026-04-30", "2026-04-01")).not.toBeNull();
    expect(validateDateRange("2026-04-15", "2026-04-15")).toBeNull();
  });
});
