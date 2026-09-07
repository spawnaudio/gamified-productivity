import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { AuthScreen } from "./AuthScreen";

afterEach(() => {
  cleanup();
});

describe("AuthScreen", () => {
  it("does not show Check your email after onSubmit fails", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockResolvedValue(false);
    render(<AuthScreen onSubmit={onSubmit} error="Invalid login" />);
    await user.type(screen.getByLabelText("Email"), "a@b.com");
    await user.click(screen.getByRole("button", { name: "Send link" }));
    expect(onSubmit).toHaveBeenCalledWith("a@b.com");
    expect(screen.queryByText("Check your email.")).toBeNull();
    expect(screen.getByRole("alert").textContent).toBe("Invalid login");
  });

  it("shows Check your email when onSubmit succeeds", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockResolvedValue(true);
    render(<AuthScreen onSubmit={onSubmit} error={null} />);
    await user.type(screen.getByLabelText("Email"), "a@b.com");
    await user.click(screen.getByRole("button", { name: "Send link" }));
    expect(screen.getByText("Check your email.")).toBeTruthy();
  });
});
