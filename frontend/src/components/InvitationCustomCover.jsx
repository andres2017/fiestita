/**
 * InvitationCustomCover — renders the organizer's own uploaded design (image, PDF, or
 * short video, via POST /uploads/custom-invite) as the invitation's cover, replacing the
 * system-generated hero entirely. Everything below the cover (video greeting, photos,
 * countdown, venue details, RSVP form, gift registry) still renders normally — this only
 * swaps out the very first thing a guest sees, controlled by inv.custom_invite_active.
 *
 * Everything (badge, media, scroll cue) sits inside ONE consistent dark frame — not the
 * theme's own --inv-bg, which swings from near-black to pastel-white across 25+ themes and
 * would clash unpredictably with whatever colors happen to be in the organizer's upload
 * (a first version put the badge directly on --inv-bg and the media edge-to-edge on a
 * separate #000 slab; on a light-background upload the seam between them read as two
 * mismatched bars sandwiching the image, not one composed piece). The media itself sits
 * inset with rounded corners + shadow, like a photo in a mat, so it reads as "framed" no
 * matter what colors or aspect ratio the upload has.
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
      <video
        src={url}
        controls
        playsInline
        className="inv-custom-cover-media inv-custom-cover-video"
        data-testid="inv-custom-cover-video"
      />
    );
  } else if (type === "pdf") {
    media = (
      <>
        <iframe
          src={url}
          title="Invitación"
          className="inv-custom-cover-media inv-custom-cover-pdf"
          data-testid="inv-custom-cover-pdf"
        />
        <a href={url} target="_blank" rel="noopener noreferrer" className="inv-btn inv-btn-outline inv-custom-cover-pdf-link">
          Ver invitación en PDF
        </a>
      </>
    );
  } else {
    media = (
      <img src={url} alt="Invitación" className="inv-custom-cover-media inv-custom-cover-image" data-testid="inv-custom-cover-image" />
    );
  }

  return (
    <section className="inv-custom-cover-frame" data-testid="inv-custom-cover">
      <div className="inv-badge inv-custom-cover-badge" data-testid="inv-badge">
        Tienes una invitación especial
      </div>

      <div className="inv-custom-cover-mat">
        {media}
      </div>

      <div className="inv-custom-cover-scrollcue" data-testid="inv-custom-cover-scrollcue">
        <span className="inv-custom-cover-scrollcue-arrows">▼ ▼ ▼</span>
        <p className="inv-custom-cover-scrollcue-text">
          Desliza hacia abajo para ver la fecha, el lugar y confirmar tu asistencia
        </p>
      </div>
    </section>
  );
};

export default InvitationCustomCover;
