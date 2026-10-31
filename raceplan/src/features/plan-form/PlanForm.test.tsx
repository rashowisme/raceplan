// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import messages from "../../../messages/en.json";
import { PlanForm } from "./PlanForm";

const push = vi.fn();
vi.mock("@/i18n/navigation", () => ({
  useRouter: () => ({ push, replace: vi.fn() }),
  usePathname: () => "/plan/new",
  Link: (p: { children: React.ReactNode }) => p.children,
}));

function renderForm() {
  return render(
    <NextIntlClientProvider locale="en" messages={messages}>
      <PlanForm />
    </NextIntlClientProvider>,
  );
}

const next = () => fireEvent.click(screen.getByRole("button", { name: /continue/i }));

describe("PlanForm", () => {
  beforeEach(() => {
    window.localStorage.clear();
    window.scrollTo = vi.fn();
  });
  afterEach(cleanup);

  it("shows translated errors and blocks the step until fixed", async () => {
    renderForm();
    expect(await screen.findByRole("heading", { name: "Your race" })).toBeTruthy();
    next();
    expect(screen.getAllByText("This field is required.").length).toBeGreaterThanOrEqual(2);
    expect(screen.getByRole("heading", { name: "Your race" })).toBeTruthy();
  });

  it("reveals distance fields for trail races and moves to the next step", async () => {
    renderForm();
    await screen.findByRole("heading", { name: "Your race" });
    fireEvent.click(screen.getByLabelText("Trail"));
    expect(screen.getByLabelText(/Race distance/)).toBeTruthy();
    expect(screen.getByLabelText(/Elevation gain/)).toBeTruthy();
    fireEvent.change(screen.getByLabelText(/Race distance/), { target: { value: "30" } });
    fireEvent.change(screen.getByLabelText(/Elevation gain/), { target: { value: "1500" } });
    fireEvent.change(screen.getByLabelText(/Race date/), { target: { value: "2099-05-01" } });
    next();
    expect(await screen.findByRole("heading", { name: "Your fitness" })).toBeTruthy();
  });

  it("restores a saved draft", async () => {
    window.localStorage.setItem(
      "raceplan.formDraft.v1",
      JSON.stringify({ values: { raceType: "10k", raceDate: "2099-05-01" }, unit: "km", step: 1 }),
    );
    renderForm();
    expect(await screen.findByRole("heading", { name: "Your fitness" })).toBeTruthy();
  });

  it("warns and blocks currently injured runners", async () => {
    window.localStorage.setItem(
      "raceplan.formDraft.v1",
      JSON.stringify({
        values: { raceType: "10k", raceDate: "2099-05-01", age: "40" },
        unit: "km",
        step: 3,
      }),
    );
    renderForm();
    await screen.findByRole("heading", { name: "About you" });
    fireEvent.click(screen.getByLabelText(/currently injured/i));
    expect(screen.getByText(/don't start a training plan while injured/i)).toBeTruthy();
    next();
    expect(screen.getByText("We can't create a plan while you're injured.")).toBeTruthy();
  });
});
