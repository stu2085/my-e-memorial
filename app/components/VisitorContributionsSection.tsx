
import MuxPlayer from "@mux/mux-player-react";
import FormSection from "./FormSection";

type VisitorContributionsSectionProps = {
  submissionsMessage: string;
  submissions: any[];
  form: any;
  existingVideoDurations: number[];
  setSubmissionPhotoViewer: (viewer: { photos: string[]; index: number }) => void;
  handleSubmissionStatus: (
  id: number,
  status: "approved" | "rejected"
) => Promise<void>;
  handleBuyExtraVideos: (
  quantity: number,
  submissionId?: number
) => Promise<void>;
};

export default function VisitorContributionsSection({
  submissionsMessage,
  submissions,
  form,
  existingVideoDurations,
  setSubmissionPhotoViewer,
  handleSubmissionStatus,
  handleBuyExtraVideos,
}: VisitorContributionsSectionProps) {
  return (
    <FormSection
      title="Visitor Contributions"
      description="Review memories, stories, corrections, or information submitted by visitors."
    >
      {submissionsMessage && (
        <div className="mb-4 rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm text-stone-700">
          {submissionsMessage}
        </div>
      )}

      {submissions.length === 0 ? (
        <p className="text-sm text-stone-500">
          No visitor contributions have been submitted yet.
        </p>
      ) : (
        <div className="space-y-4">
          {submissions.map((submission) => {
            let submittedPhotos: string[] = [];

            if (Array.isArray(submission.photo_urls)) {
              submittedPhotos = submission.photo_urls;
            } else if (typeof submission.photo_urls === "string") {
              try {
                submittedPhotos = JSON.parse(submission.photo_urls);
              } catch {
                submittedPhotos = [];
              }
            }

            submittedPhotos = submittedPhotos.filter(Boolean);

            let submittedVideos: string[] = [];

            if (Array.isArray(submission.video_urls)) {
              submittedVideos = submission.video_urls;
            } else if (typeof submission.video_urls === "string") {
              try {
                submittedVideos = JSON.parse(submission.video_urls);
              } catch {
                submittedVideos = submission.video_urls
                  .split(",")
                  .map((item: string) => item.trim())
                  .filter(Boolean);
              }
            }

            submittedVideos = submittedVideos
              .filter(Boolean)
              .filter((videoId) => videoId.length > 15);

            const baseLimitMinutes =
              form.plan === "premium" ? 60 : form.plan === "plus" ? 30 : 15;

            const effectiveLimitMinutes =
              baseLimitMinutes + Number(form.extraVideoMinutes || 0);

            const existingVideoSeconds = existingVideoDurations.reduce(
              (total, seconds) => total + Number(seconds || 0),
              0
            );

            const contributorVideoSeconds = submittedVideos.length * 5 * 60;
            const projectedTotalSeconds =
              existingVideoSeconds + contributorVideoSeconds;
            const projectedTotalMinutes = Math.ceil(projectedTotalSeconds / 60);

            const needsExtraVideoPurchase =
              projectedTotalMinutes > effectiveLimitMinutes;

            return (
              <div
                key={submission.id}
                className="rounded-2xl border border-stone-200 bg-white p-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-stone-900">
                      {submission.submitter_name || "Anonymous visitor"}
                    </p>

                    {submission.submitter_email && (
                      <p className="text-xs text-stone-500">
                        {submission.submitter_email}
                      </p>
                    )}

                    <p className="mt-1 text-xs text-stone-500">
                      Status: {submission.status}
                    </p>
                  </div>

                  {submission.created_at && (
                    <p className="text-xs text-stone-400">
                      {new Date(submission.created_at).toLocaleString()}
                    </p>
                  )}
                </div>

                <p className="mt-4 whitespace-pre-line text-sm leading-6 text-stone-700">
                  {submission.message}
                </p>

                {submission.status === "pending" &&
                  submittedPhotos.length > 0 && (
                    <div className="mt-4">
                      <p className="mb-3 text-sm font-semibold text-stone-800">
                        Submitted Photos
                      </p>

                      <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6">
                        {submittedPhotos.map((photoUrl, index) => (
                          <button
                            key={`${photoUrl}-${index}`}
                            type="button"
                            onClick={() =>
                              setSubmissionPhotoViewer({
                                photos: submittedPhotos,
                                index,
                              })
                            }
                            className="block overflow-hidden rounded-xl border border-stone-200 bg-stone-50 text-left"
                          >
                            <img
                              src={photoUrl}
                              alt={`Submitted photo ${index + 1}`}
                              className="h-20 w-full object-cover transition hover:scale-105"
                            />
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                {submittedVideos.length > 0 && (
                  <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
                    {submittedVideos.map((playbackId, index) => (
                      <div
                        key={`${playbackId}-${index}`}
                        className="overflow-hidden rounded-2xl border border-stone-200 bg-stone-50 p-4"
                      >
                        <p className="mb-3 text-sm font-semibold text-stone-800">
                          Submitted Video {index + 1}
                        </p>

                        <MuxPlayer
                          playbackId={playbackId}
                          streamType="on-demand"
                          className="aspect-video w-full rounded-xl bg-black"
                        />
                      </div>
                    ))}
                  </div>
                )}

                {submission.status === "pending" && (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {!needsExtraVideoPurchase ? (
                      <button
                        type="button"
                        onClick={() =>
                          handleSubmissionStatus(submission.id, "approved")
                        }
                        className="rounded-full bg-green-600 px-4 py-2 text-xs font-semibold text-white hover:bg-green-700"
                      >
                        Approve
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() =>
                          handleBuyExtraVideos(
                            Math.ceil(
                              (projectedTotalMinutes -
                                effectiveLimitMinutes) /
                                10
                            ),
                            submission.id
                          )
                        }
                        className="rounded-full bg-amber-500 px-4 py-2 text-xs font-semibold text-stone-900 hover:bg-amber-400"
                      >
                        Approve With 10-Minute Video Memory Pack — $9.95
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() =>
                        handleSubmissionStatus(submission.id, "rejected")
                      }
                      className="rounded-full border border-red-300 px-4 py-2 text-xs font-semibold text-red-600 hover:bg-red-50"
                    >
                      Reject
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </FormSection>
  );
}