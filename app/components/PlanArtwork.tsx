import Image from "next/image";

export default function PlanArtwork({ plan }: { plan: string }) {
  if (plan === "free") return (
    <div aria-hidden="true" className="relative mx-auto mb-3 h-44 w-44 overflow-hidden">
      <Image src="/Images/plans/free-heart.png" alt="" fill sizes="176px" className="object-contain scale-[1.2]" />
    </div>
  );
  const index = { basic: 0, plus: 1, premium: 2 }[plan] ?? 0;
  return (
    <div aria-hidden="true" className="relative mx-auto mb-3 h-44 w-44 overflow-hidden">
      <div className="absolute inset-y-0 w-[300%]" style={{ left: `${-index * 100}%` }}>
        <Image src="/Images/plans/paid-hearts.png" alt="" fill sizes="528px" className="object-contain" />
      </div>
    </div>
  );
}
