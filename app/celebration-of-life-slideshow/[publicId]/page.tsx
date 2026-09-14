import CelebrationPresentationPlayer from "../../components/celebration-presentation/CelebrationPresentationPlayer";

type PageProps = {
  params: Promise<{
    publicId: string;
  }>;
};

export default async function CelebrationPresentationPage({
  params,
}: PageProps) {
  const { publicId } = await params;

  return (
    <CelebrationPresentationPlayer
      publicId={publicId}
    />
  );
}
