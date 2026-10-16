import Image from "next/image";
export default function AccountWelcome({ living = false }: { living?: boolean }) {
  return <header className="text-center">
    <p className="font-serif text-2xl font-semibold text-blue-950">MyEMemorial</p>
    <div className="relative mx-auto my-2 h-28 w-44" aria-hidden="true">
      <Image src="/images/plans/free-heart.png" alt="" fill sizes="176px" className="object-contain" />
    </div>
    <p className="font-serif text-2xl font-semibold leading-snug text-blue-950 md:text-3xl">
      {living ? "A gift for future generations to remember your life, your stories, and the love you shared." : "The best gift for your loved one so future generations will always remember who they were."}
    </p>
  </header>;
}
