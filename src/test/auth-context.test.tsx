import { render, screen, waitFor } from "@testing-library/react";
import { describe, test, expect, vi, beforeEach } from "vitest";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";

vi.mock("firebase/auth", () => ({
  onAuthStateChanged: vi.fn((_, cb) => {
    cb(null);
    return () => {};
  }),
  signOut: vi.fn(),
  getAuth: vi.fn(() => ({})),
}));

vi.mock("@/lib/firebase", () => ({ auth: {} }));

function TestComponent() {
  const { user, loading } = useAuth();
  if (loading) return <div>loading</div>;
  return <div>{user ? "signed-in" : "signed-out"}</div>;
}

describe("AuthContext", () => {
  test("shows signed-out when no user", async () => {
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );
    await waitFor(() => {
      expect(screen.getByText("signed-out")).toBeInTheDocument();
    });
  });
});
