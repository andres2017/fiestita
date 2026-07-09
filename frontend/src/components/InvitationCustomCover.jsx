/**
 * InvitationCustomCover — renders the organizer's own uploaded design (image, PDF, or
 * short video, via POST /uploads/custom-invite) as the invitation's cover, replacing the
 * system-generated hero entirely. Everything below the cover (video greeting, photos,
 * countdown, venue details, RSVP form, gift registry) still renders normally — this only
 * swaps out the very first thing a guest sees, controlled by inv.custom_invite_active.
 *
 * Props:
 *   url    string   absolute URL to the uploaded file (already resolved via mediaUrl)
 *   type   string   "image" | "pdf" | "video" — set together with url at upload time
 */
export const InvitationCustomCover = ({ url, type }) => {
  if (!url) return null;

  if (type === "video") {
    return (
      <section className="inv-custom-cover" data-testid="inv-custom-cover">
        <video
          src={url}
          controls
          playsInline
          className="inv-custom-cover-video"
          data-testid="inv-custom-cover-video"
        />
      </section>
    );
  }

  if (type === "pdf") {
    return (
      <section className="inv-custom-cover inv-custom-cover-pdf-wrap" data-testid="inv-custom-cover">
        <iframe
          src={url}
          title="Invitación"
          className="inv-custom-cover-pdf"
          data-testid="inv-custom-cover-pdf"
        />
        <a href={url} target="_blank" rel="noopener noreferrer" className="inv-btn inv-btn-outline inv-custom-cover-pdf-link">
          Ver invitación en PDF
        </a>
      </section>
    );
  }

  return (
    <section className="inv-custom-cover" data-testid="inv-custom-cover">
      <img src={url} alt="Invitación" className="inv-custom-cover-image" data-testid="inv-custom-cover-image" />
    </section>
  );
};

export default InvitationCustomCover;
