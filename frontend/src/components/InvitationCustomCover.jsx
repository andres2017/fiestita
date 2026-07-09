/**
 * InvitationCustomCover — renders the organizer's own uploaded design (image, PDF, or
 * short video, via POST /uploads/custom-invite) as the invitation's cover, replacing the
 * system-generated hero entirely. Everything below the cover (video greeting, photos,
 * countdown, venue details, RSVP form, gift registry) still renders normally — this only
 * swaps out the very first thing a guest sees, controlled by inv.custom_invite_active.
 *
 * Carries the same "Tienes una invitación especial" badge every other hero variant shows
 * (InvitationHeroElegant's kicker, the plain .inv-hero's badge) — a raw uploaded image with
 * no framing above it read as broken/unfinished, so the badge stays even when the cover
 * itself is fully custom.
 *
 * Also carries a "keep scrolling" nudge below the upload: the organizer's own design
 * usually already looks complete on its own (it has its own date/venue baked in as an
 * image), so without a cue a guest has no reason to suspect there's a whole page of real
 * content (video, photos, countdown, RSVP form) still below it.
 *
 * Props:
 *   url    string   absolute URL to the uploaded file (already resolved via mediaUrl)
 *   type   string   "image" | "pdf" | "video" — set together with url at upload time
 */
export const InvitationCustomCover = ({ url, type }) => {
  if (!url) return null;

  let media;
  if (type === "video") {
    media = (
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
  } else if (type === "pdf") {
    media = (
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
  } else {
    media = (
      <section className="inv-custom-cover" data-testid="inv-custom-cover">
        <img src={url} alt="Invitación" className="inv-custom-cover-image" data-testid="inv-custom-cover-image" />
      </section>
    );
  }

  return (
    <>
      <div className="inv-badge inv-custom-cover-badge" data-testid="inv-badge">
        Tienes una invitación especial
      </div>
      {media}
      <div className="inv-custom-cover-scrollcue" data-testid="inv-custom-cover-scrollcue">
        <span className="inv-custom-cover-scrollcue-arrows">▼ ▼ ▼</span>
        <p className="inv-custom-cover-scrollcue-text">
          Desliza hacia abajo para ver la fecha, el lugar y confirmar tu asistencia
        </p>
      </div>
    </>
  );
};

export default InvitationCustomCover;
