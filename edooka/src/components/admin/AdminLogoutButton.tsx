"use client";

export function AdminLogoutButton() {
  return (
    <button
      type="button"
      onClick={() =>
        void fetch("/api/admin/logout", { method: "POST" }).then(() => {
          window.location.href = "/admin/login";
        })
      }
      className="rounded-xl border border-border-default px-4 py-2 text-sm font-semibold text-text-secondary hover:border-primary hover:text-primary"
    >
      Sign out
    </button>
  );
}
