"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { updateEventStatus, deleteEvent } from "./actions";

type EventStatus = "draft" | "published" | "cancelled" | "completed";

interface EventActionsProps {
  eventId: string;
  currentStatus: EventStatus;
}

export default function EventActions({ eventId, currentStatus }: EventActionsProps) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleStatus = async (status: "draft" | "published" | "cancelled") => {
    setLoading(status);
    setError("");
    const result = await updateEventStatus(eventId, status);
    if (!result.success) setError(result.error ?? "Erreur");
    setLoading(null);
  };

  const handleDelete = async () => {
    setLoading("delete");
    setError("");
    const result = await deleteEvent(eventId);
    if (!result.success) {
      setError(result.error ?? "Erreur");
      setLoading(null);
      return;
    }
    router.push("/dashboard/events");
  };

  return (
    <div>
      {error && (
        <p
          style={{
            color: "var(--danger)",
            fontSize: "11px",
            marginBottom: "12px",
            letterSpacing: "0.05em",
          }}
        >
          ▸ {error}
        </p>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        {/* Publish / Unpublish */}
        {currentStatus === "draft" && (
          <button
            onClick={() => handleStatus("published")}
            disabled={loading !== null}
            className="btn btn-primary btn-sm"
            style={{ width: "100%" }}
          >
            {loading === "published" ? "..." : "▸ PUBLIER"}
          </button>
        )}
        {currentStatus === "published" && (
          <button
            onClick={() => handleStatus("draft")}
            disabled={loading !== null}
            className="btn btn-ghost btn-sm"
            style={{ width: "100%" }}
          >
            {loading === "draft" ? "..." : "DÉPUBLIER"}
          </button>
        )}
        {currentStatus === "published" && (
          <button
            onClick={() => handleStatus("cancelled")}
            disabled={loading !== null}
            className="btn btn-danger btn-sm"
            style={{ width: "100%" }}
          >
            {loading === "cancelled" ? "..." : "ANNULER L'ÉVÉNEMENT"}
          </button>
        )}

        {/* Delete */}
        {currentStatus === "draft" && !showDeleteConfirm && (
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="btn btn-danger btn-sm"
            style={{ width: "100%", marginTop: "8px" }}
          >
            SUPPRIMER
          </button>
        )}
        {showDeleteConfirm && (
          <div
            style={{
              border: "1px solid var(--danger)",
              padding: "14px",
              marginTop: "8px",
            }}
          >
            <p
              style={{
                fontSize: "11px",
                color: "var(--danger)",
                marginBottom: "12px",
                letterSpacing: "0.05em",
              }}
            >
              CONFIRMER LA SUPPRESSION ?
            </p>
            <div style={{ display: "flex", gap: "8px" }}>
              <button
                onClick={handleDelete}
                disabled={loading === "delete"}
                className="btn btn-danger btn-sm"
                style={{ flex: 1 }}
              >
                {loading === "delete" ? "..." : "OUI, SUPPRIMER"}
              </button>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="btn btn-ghost btn-sm"
                style={{ flex: 1 }}
              >
                ANNULER
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
