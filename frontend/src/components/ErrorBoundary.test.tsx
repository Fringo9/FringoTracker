import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import ErrorBoundary from "./ErrorBoundary";

// Suppress console.error for expected errors in tests
beforeEach(() => {
  vi.spyOn(console, "error").mockImplementation(() => {});
});

function ThrowingComponent({ error }: { error?: Error }) {
  if (error) throw error;
  return <div>No error</div>;
}

describe("ErrorBoundary", () => {
  it("renders children when no error", () => {
    render(
      <ErrorBoundary>
        <div>Hello World</div>
      </ErrorBoundary>,
    );
    expect(screen.getByText("Hello World")).toBeInTheDocument();
  });

  it("renders error UI when child throws", () => {
    render(
      <ErrorBoundary>
        <ThrowingComponent error={new Error("Test crash")} />
      </ErrorBoundary>,
    );

    expect(screen.getByText("Qualcosa è andato storto")).toBeInTheDocument();
    expect(screen.getByText("Test crash")).toBeInTheDocument();
    expect(screen.getByText("Ricarica Pagina")).toBeInTheDocument();
  });

  it("shows default message when error has no message", () => {
    render(
      <ErrorBoundary>
        <ThrowingComponent error={new Error("")} />
      </ErrorBoundary>,
    );

    expect(
      screen.getByText("Errore imprevisto nell'applicazione"),
    ).toBeInTheDocument();
  });
});
