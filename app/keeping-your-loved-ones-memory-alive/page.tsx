import type { Metadata } from 'next';
import Link from 'next/link';
import styles from './page.module.css';

export const metadata: Metadata = {
  title: {
    absolute:
      "Memorial Ideas for Loved Ones | Keep Their Memory Alive | MyEMemorial",
  },
  description:
    "Discover meaningful memorial ideas for loved ones, ways to remember someone who died, and how to preserve their voice, photographs, stories, and precious family memories.",
  alternates: {
    canonical: "/keeping-your-loved-ones-memory-alive",
  },
  openGraph: {
    title: "Keeping Your Loved One's Memory Alive | MyEMemorial",
    description:
      "Gentle ideas for honoring someone you love and preserving their voice, photographs, stories, and treasured memories.",
    url: "/keeping-your-loved-ones-memory-alive",
    type: "article",
  },
};

const memories = [
  { symbol: '♫', title: 'The sound of their voice', body: 'A familiar hello, a favorite saying, or the sound of their laughter can mean so much. Save existing voicemails and videos somewhere safe so those moments remain close.' },
  { symbol: '♡', title: 'The moments you shared', body: 'A holiday, an ordinary afternoon, a silly photograph. The little moments are often the ones we treasure most.' },
  { symbol: '✧', title: 'The stories only they could tell', body: 'Their traditions, favorite places, funny habits, and family stories deserve to be remembered and passed along.' },
];
const ideas = [
  { title: 'Gather the photographs', body: 'Choose a few favorite pictures. Add names, dates, and the stories behind them so their meaning is never lost.' },
  { title: 'Save the recordings', body: 'Back up any existing videos, voicemails, or audio recordings in more than one secure location.' },
  { title: 'Invite a story', body: 'Ask a relative or friend to share one special memory. You may discover a side of your loved one you never knew.' },
  { title: 'Create a place to return to', body: 'A scrapbook, memory box, family tradition, or online memorial can give treasured memories a home.' },
];

export default function KeepingMemoryAlivePage() {
  return <main className={styles.page} id="main-content">
    <header className={styles.hero}>
      <div className={`${styles.shell} ${styles.topbar}`}><Link href="/" className={styles.brand}>My<em>E</em>Memorial</Link><Link href="/memorials" className={styles.topLink}>Explore memorials</Link></div>
      <div className={styles.heroInner}>
        <p className={styles.eyebrow}>A gentle place for remembrance</p>
        <h1>Keeping Your Loved One’s Memory Alive</h1>
        <p className={styles.heroText}>Their voice. Their laughter. Their stories. The little things that made them who they were. There are beautiful ways to hold those memories close and share them with the people who loved them.</p>
        <p className={styles.heroText}>
  Remembering loved ones is a deeply personal experience.
  Whether you're looking for ways to keep memories alive,
  preserve family memories, or celebrate the moments you shared,
  there are many meaningful ways to honor someone who has passed away.
  Preserving memories through photographs, videos, and personal stories
  can help keep their life story close to your heart.
</p>
        <a className={styles.button} href="#ways-to-remember">Explore ways to remember</a>
        <span className={styles.subcta}>Read at your own pace. There is no rush.</span><p className={styles.heroLink}><Link href="/memorials#begin-memorial" className={styles.textLink}>Or begin a free MyEMemorial →</Link></p>
      </div><div className={styles.wave}/>
    </header>
    <section className={styles.intro}><div className={styles.ornament}>✦</div><h2>Love doesn’t end when a life does.</h2><p>When someone you love dies, memories can feel both precious and fragile. You may want to hold on to their smile, their words, the way they made everyone laugh. Remembering them is personal, and there is no single right way to do it.</p><p>Here are some gentle ideas for honoring their life and preserving the moments you treasure.</p></section>
    <section className={`${styles.section} ${styles.muted}`} id="ways-to-remember"><div className={styles.shell}><div className={styles.sectionHead}><p className={styles.smallTitle}>The memories that matter</p><h2>Sometimes the smallest things mean the most.</h2><p>There is more to a life than dates and milestones. It is the ordinary, beautiful details that make a person unforgettable.</p></div><div className={styles.cards}>{memories.map(m=><article className={styles.card} key={m.title}><div aria-hidden className={styles.symbol}>{m.symbol}</div><h3>{m.title}</h3><p>{m.body}</p></article>)}</div><p className={styles.centerLink}><Link href="/memorials#begin-memorial" className={styles.textLink}>Begin preserving their memories →</Link></p></div></section>
    <section className={styles.section}><div className={`${styles.shell} ${styles.split}`}><div className={styles.art} aria-label="Illustration of treasured photographs and family memories" role="img"><div className={styles.photo}><div className={styles.photoInside}><span>♡</span></div></div><div className={`${styles.photo} ${styles.two}`}><div className={styles.photoInside}><span>✦</span></div></div><div className={styles.note}>Every picture holds a story.</div></div><div className={styles.content}><p className={styles.smallTitle}>A fear many people share</p><h2>“What if I forget the sound of their voice?”</h2><p>Sometimes it’s not the big moments we fear losing. It’s the way Mom said our name, Dad’s familiar laugh, or a quiet conversation with someone we miss.</p><p>If you have recordings, even brief ones, they can be precious. Consider saving old voicemails, gathering family videos, and making secure backup copies.</p><blockquote className={styles.quote}>You may never forget how much you loved them. Preserve the little details that made them who they were.</blockquote><div className={styles.callout}><strong>A home for their memories</strong><p>MyEMemorial can bring existing photos, videos, and personal stories together in one place that family can revisit.</p><Link href="/memorials#begin-memorial" className={styles.textLink}>Preserve their voice and memories →</Link></div></div></div></section>
    <section className={`${styles.section} ${styles.muted}`}><div className={styles.shell}><div className={styles.sectionHead}><p className={styles.smallTitle}>A few simple beginnings</p><h2>Meaningful ways to remember someone you love</h2><p>Choose what feels right for you. One photograph or one story can be enough for today.</p></div><div className={styles.ideas}>{ideas.map(i=><article className={styles.idea} key={i.title}><h3>{i.title}</h3><p>{i.body}</p></article>)}</div><p className={styles.centerLink}><Link href="/memorials#begin-memorial" className={styles.textLink}>Bring their photographs and stories together →</Link></p></div></section>
    <section className={styles.section}><div className={`${styles.shell} ${styles.split}`}><div className={styles.content}><p className={styles.smallTitle}>Remembering together</p><h2>Their story belongs to more than one memory.</h2><p>A brother remembers a childhood adventure. A friend recalls a kind gesture. A grandchild wants to know what Grandma was like when she was young.</p><p>When families share stories, the picture of a life grows richer. What begins as one memory can become a collection that future generations will cherish.</p><ul className={styles.list}><li>Invite family members to share a favorite story</li><li>Record the meaning behind cherished photographs</li><li>Preserve family traditions and important milestones</li><li>Return to those memories on meaningful days</li></ul><p className={styles.inlineCta}><Link href="/memorials#begin-memorial" className={styles.textLink}>Create a place for family memories →</Link></p></div><div className={styles.art} aria-label="Illustration of cherished family photographs" role="img"><div className={styles.photo}><div className={styles.photoInside}><span>✿</span></div></div><div className={`${styles.photo} ${styles.two}`}><div className={styles.photoInside}><span>♡</span></div></div><div className={styles.note}>Stories grow when shared.</div></div></div></section>
    <section className={`${styles.section} ${styles.muted}`}><div className={styles.shell}><div className={styles.sectionHead}><p className={styles.smallTitle}>Grief and remembrance</p><h2>Remembering can be a source of comfort.</h2><p>For some people, looking through photographs, telling stories, and maintaining a connection through memories can offer comfort during bereavement. For others, these activities can feel painful at times. Both experiences are understandable.</p><p>There is no schedule for grief, and creating a memorial is never something you have to do. You can remember your loved one in whatever way feels meaningful to you.</p><p className={styles.centerLink}><Link href="/memorials#begin-memorial" className={styles.textLink}>Celebrate the life they lived →</Link></p></div></div></section>
    <section className={styles.section}><div className={styles.shell}><div className={styles.sectionHead}><p className={styles.smallTitle}>Questions you may have</p><h2>It’s okay to wonder where to begin.</h2></div><div className={styles.faq}><details><summary>What if I’m not ready to look through photographs?</summary><p>You don’t need to begin today. Memories can be gathered little by little, whenever you feel ready, or with the help of someone you trust.</p></details><details><summary>What if I don’t know what to write?</summary><div className={styles.faqBody}><p>You may remember more than you realize. One question can bring back a whole chapter of their life. Think about stories they told you or moments you shared:</p><ul className={styles.promptList}><li><strong>Before age five:</strong> Did they ever tell stories about their earliest home, favorite toy, pet, or a little childhood mischief?</li><li><strong>Ages five to ten:</strong> What about their first school, childhood friends, family trips, or favorite games?</li><li><strong>Teenage years:</strong> Do you remember stories about their first date, first car, friendships, or funny adventures?</li><li><strong>Young adulthood:</strong> How did they meet someone they loved? What dreams did they have, and what made them proud?</li><li><strong>Everyday life:</strong> What were their sayings, traditions, favorite meals, or things that always made them laugh?</li><li><strong>The unforgettable stories:</strong> What was the funniest story they ever told? Which story does your family love to retell?</li></ul><p>Ask siblings, cousins, friends, and grandchildren what they remember, too. A single story can become the beginning of a heartfelt life story or obituary. You don’t have to write everything at once.</p><p><Link href="/memorials#begin-memorial" className={styles.textLink}>Begin telling their story →</Link></p></div></details><details><summary>Is an online memorial different from an obituary?</summary><p>An obituary usually shares important life details and news of a death. An online memorial can grow into a collection of photographs, videos, stories, and family memories over time.</p></details><details><summary>Do I have to finish a memorial all at once?</summary><p>No. MyEMemorial is designed so you can save your work and return to it. Begin simply and add more when you wish.</p></details></div></div></section>
    <section className={styles.final}><div className={styles.inner}><p className={styles.smallTitle}>When you feel ready</p><h2>Give their story a special place to live on.</h2><p>You can begin a free MyEMemorial with a name, then add photographs, videos, and treasured memories at your own pace. There’s no pressure to tell the whole story today.</p><Link href="/memorials#begin-memorial" className={styles.button}>Start a Free MyEMemorial</Link><span className={styles.subcta}>Start free. Add memories as you're ready.</span></div></section>
    <footer className={styles.footer}><div className={styles.shell}>Made with care by <Link href="/">MyEMemorial</Link> · A place for stories worth remembering.</div></footer>
  </main>;
}

