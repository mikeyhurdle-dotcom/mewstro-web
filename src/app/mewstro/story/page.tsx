import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";

export const metadata: Metadata = {
  title: "The story behind Mewstro",
  description:
    "I started piano at 40, second time really, the first try at school didn't stick. Built a spreadsheet to track my practice. Showed my teacher Ellie. That's pretty much how it became Mewstro.",
};

const evolution = [
  {
    name: "Spreadsheet",
    year: "June 2023",
    description:
      "Printed weekly, with a goal at the top and columns for sight reading, technique, scales, theory, repertoire, and playing for fun. Feedback on the reverse. I tracked every session by hand before I tracked anything on a phone.",
  },
  {
    name: "Skald",
    year: "Late 2024",
    description:
      "First code version. Named after a Norse musician-warrior class from Dark Ages of Camelot, an MMORPG I played way too much of. Sleep Token aesthetic, heavy metal energy. Built for me, on my own keyboard, for my own practice.",
  },
  {
    name: "Maestro",
    year: "Late 2024",
    description:
      "Same app, with a few new themes. One calmer green version called Maestro, and a reskin in Ellie's own studio colours, which was mostly a joke to show her. That's the version that made her say her students would want this.",
  },
  {
    name: "Mewstro",
    year: "2025",
    description:
      "The name came first. Maestro felt too formal, and the Mewstro wordplay just landed. The cat mascot followed. Your companion on the piano bench, celebrating streaks, gently noticing when you haven't practised in a while.",
  },
];

export default function MewstroStoryPage() {
  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden bg-[#FFFBF7] px-6 py-20 md:py-28">
        <div
          className="absolute -top-40 -right-40 h-96 w-96 rounded-full bg-[#F4845F] opacity-20 blur-3xl"
          aria-hidden
        />
        <div className="relative mx-auto max-w-4xl">
          <p className="text-sm font-semibold uppercase tracking-wider text-[#2D8B7E]">
            The story behind Mewstro
          </p>
          <h1 className="mt-3 text-4xl font-extrabold tracking-tight text-[#1A1A2E] md:text-6xl">
            Started piano at 40. Built the app my teacher inspired.
          </h1>
          <p className="mt-8 text-lg text-[#5A4E42] md:text-xl">
            I&apos;m Mikey, and I started piano just before my 40th birthday.
            Well, second time really. The first try was at school when I was
            about twelve, and it didn&apos;t stick. I&apos;ve spent most of my
            career in professional services tracking time for projects, so
            when I picked the piano up again I built a spreadsheet for my
            practice in the same way. My teacher Ellie saw it. That&apos;s
            pretty much how Mewstro began.
          </p>

          {/* Hero collage hidden until /mewstro/story-collage.jpg is ready
              (Canva: spreadsheet | PowerPoint timeline | playing at home).
              To restore: remove the {false && (...)} wrapper and swap the
              placeholder div for an <Image src="/mewstro/story-collage.jpg" />.
              Recommended export: 1600x900 JPG. */}
          {false && (
            <figure className="mt-12">
              <div
                className="relative aspect-video w-full overflow-hidden rounded-3xl border border-[#E8DFD3] bg-[#FAF6EF]"
                aria-hidden
              >
                <div className="absolute inset-0 grid grid-cols-3 gap-px">
                  <div className="bg-[#FFFBF7]" />
                  <div className="bg-[#FAF6EF]" />
                  <div className="bg-[#FFFBF7]" />
                </div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <p className="text-xs uppercase tracking-wider text-[#6B7280]">
                    Spreadsheet · Timeline tracker · At the keys
                  </p>
                </div>
              </div>
              <figcaption className="mt-3 text-center text-xs text-[#6B7280]">
                June 2023 → today.
              </figcaption>
            </figure>
          )}
        </div>
      </section>

      {/* Evolution timeline */}
      <section className="bg-white px-6 py-20">
        <div className="mx-auto max-w-5xl">
          <div className="text-center">
            <p className="text-xs uppercase tracking-wider text-[#6B7280]">
              How it evolved
            </p>
            <h2 className="mt-2 text-3xl font-bold text-[#1A1A2E] md:text-4xl">
              From a printed spreadsheet to a cat with a baton
            </h2>
          </div>
          <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-4">
            {evolution.map((step, idx) => (
              <div
                key={step.name}
                className="relative rounded-2xl border border-[#E8DFD3] bg-[#FFFBF7] p-6"
              >
                <div className="flex items-baseline justify-between">
                  <h3 className="text-lg font-bold text-[#1A1A2E]">
                    {step.name}
                  </h3>
                  <span className="text-xs font-medium text-[#6B7280]">
                    {step.year}
                  </span>
                </div>
                <p className="mt-3 text-sm leading-relaxed text-[#5A4E42]">
                  {step.description}
                </p>
                <div className="absolute -top-3 left-6 flex h-7 w-7 items-center justify-center rounded-full bg-[#2D8B7E] text-xs font-bold text-white">
                  {idx + 1}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Full narrative */}
      <section className="bg-[#FFFBF7] px-6 py-20">
        <article className="prose-mewstro mx-auto max-w-3xl text-[17px] leading-[1.75] text-[#2B2B2E]">
          <h2 className="text-2xl font-bold text-[#1A1A2E] md:text-3xl">
            The long version
          </h2>

          <p className="mt-6">
            Here&apos;s the bit that usually gets skipped. I first wanted to
            play the keyboard when I was at school, probably year seven or
            eight, I can&apos;t remember exactly. My parents bought me a
            block of five or ten lessons. My sister had a keyboard at home
            she&apos;d never really played, and I was interested in a way.
            Unfortunately, I didn&apos;t find the lessons that interactive,
            and I was also quite bad at doing my homework, so I didn&apos;t
            enjoy the conflict of coming to a lesson and not having
            improved. I&apos;d come from a background where I was usually
            pretty good at picking things up, sport especially. I had good
            hand-eye coordination, and if I started a new sport I&apos;d
            have transferable skills. I didn&apos;t really have that with
            piano. I didn&apos;t see progress quickly, so my interest waned
            and I dropped it. I&apos;ve not really been that musical
            throughout my life, I guess. Or that&apos;s what I told myself.
          </p>

          <p className="mt-6">
            That frame stuck for about twenty years. Every time I saw a
            piano, in a friend&apos;s house or an airport lounge or a hotel
            lobby, I&apos;d think &ldquo;oh yeah, it&apos;d be cool to be
            able to play that.&rdquo; But I never did. Sport took over my
            life instead, cricket and hockey especially, they pretty much
            became my weekends and my whole practice routine.
          </p>

          <p className="mt-6">
            Music was still a constant, it just came through listening
            rather than playing. My dad had a wide record collection,
            then CDs, and my taste got shaped around those growing up. I
            ended up with a pretty eclectic mix of influences. Radiohead,
            Jimi Hendrix, a free compilation CD of romantic-period
            classical that came with something I honestly can&apos;t
            remember. Then nu metal came onto the scene and that
            properly took over my passion for a while. I discovered
            Ludovico Einaudi at university and put Divenire on repeat
            when I first heard it, thinking this is stunning. I saw him
            live on London&apos;s Embankment and was completely blown
            away. The piano bits of my listening were always the ones
            I came back to.
          </p>

          <h3 className="mt-10 text-xl font-bold text-[#1A1A2E]">
            Why, actually?
          </h3>

          <p className="mt-4">
            As I got older I stopped playing competitive sport, which
            freed up a chunk of my week. Here&apos;s something I&apos;ve
            learned about myself, I&apos;m not great with hobbies. I pick
            things up, get super into them, and then drop them once the
            initial excitement wears off. I can&apos;t play computer games
            because their addictive nature is too much for me, I end up
            thinking about them when I&apos;m not playing, and that
            becomes quite a toxic environment for my brain. So I&apos;ve
            had to learn to be selective about my hobbies, to make sure
            they have a positive influence on my life rather than a
            toxic one, and don&apos;t just keep my resting brain busy.
          </p>

          <p className="mt-6">
            Just before turning 40, a few things lined up. I&apos;d been
            to see my dad playing at one of his folk circles. It&apos;s
            something he&apos;s picked up in his retirement, where
            he&apos;s really found a community in playing with
            like-minded people and talking about the music they love. He
            plays guitar and sings, and he won&apos;t mind me saying
            he&apos;s not the most confident singer, but the room is safe
            and warm and everyone&apos;s there to connect over the music.
            Being a male in my late thirties, it&apos;s actually quite
            difficult to keep hold of friends and stay connected with
            people, and I&apos;d always had sport as the vehicle for
            that. What I was seeing at dad&apos;s folk circles was that
            music could be another way in. I&apos;m not always going to
            be able to play sport forever.
          </p>

          <p className="mt-6">
            I&apos;ve always wanted to play the piano. Let&apos;s do it.
          </p>

          <p className="mt-6">
            My wife was a little sceptical in the nicest way, she knows
            my hobby pattern. So we compromised. I went on Facebook
            Marketplace, found a pretty cheap keyboard, drove to pick it
            up. The first thing I had to do when I got it home was give
            it a really good clean. The previous owner had stuck letter
            stickers on every key, and I&apos;d already read that using
            those stickers takes away from your learning, you end up
            leaning on them rather than learning which key is which. So
            I pulled them all off. The residue was awful, it took me ages
            to scrub down before I could even play a single note.
          </p>

          <h3 className="mt-10 text-xl font-bold text-[#1A1A2E]">
            The first few months
          </h3>

          <p className="mt-4">
            Then I just googled &ldquo;beginner piano where to start,&rdquo;
            and discovered there was just so much content on YouTube. I
            came across the Superhuman Piano guy, really charismatic,
            using the 1-5-6-4 pop chord pattern to get you playing songs
            fast. His thing was basically labelling a handful of keys in
            a video and saying &ldquo;press this, now this, now this,
            now this,&rdquo; and it&apos;d come out sounding like a song
            you actually recognised in its simplest form. You could
            learn tricks like the Interstellar theme with one hand, that
            sort of thing. He was great at getting you excited about
            playing songs straight away rather than learning the
            instrument properly. I&apos;m a bit older though, and I
            wasn&apos;t really looking to go to a party and impress
            people. What I wanted was more about doing it for me and
            connecting with the instrument itself, to understand what
            all these keys actually mean, not just play a quick
            sound-bite. Saying that, I&apos;ve since shared some of
            these hacks with friends who have kids, because they make a
            really fun hook to get a child interested in the piano. Way
            better than starting on Twinkle Twinkle Little Star.
          </p>

          <p className="mt-6">
            I set two parallel goals pretty early on. One fun, one
            serious. The fun one was Matt and Kim&apos;s
            &ldquo;Daylight,&rdquo; a really easy hook on the piano, and
            I remember after about a week I could play it. It wasn&apos;t
            very good, slightly out of time and probably wrong in places,
            but I could feel the music and it was close enough that I
            could recognise it. Matt and Kim have this really relaxed,
            unpretentious way of performing in their videos, lying
            around on beds with all sorts of instruments, and I just
            loved that energy. The serious goal was being able to play
            something by Ludovico Einaudi, &ldquo;Experience&rdquo;
            specifically.{" "}
            <a
              href="https://www.pianote.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-[#2D8B7E] underline decoration-[#2D8B7E]/40 underline-offset-2 transition-colors hover:decoration-[#2D8B7E]"
            >
              Pianote
            </a>{" "}
            had a beginner version of it in their
            course and I got a bit obsessed. It was straight-up muscle
            memory really, I was watching Lisa Witt play it and
            memorising every finger position before I really understood
            the instrument at all. Honestly, I&apos;d set Einaudi as a
            long-term goal and it surprised me how quickly I could get
            something like him sounding okay. That was a bit of a
            revelation for me, how accessible a piece that sounds
            complex can actually be if you can just hack the patterns
            into your brain on your own.
          </p>

          <p className="mt-6">
            Pianote I&apos;d happily recommend to anyone starting out.
            Lisa is a fantastic teacher, she made me feel like I was in
            a lesson with her rather than just watching a video back,
            which is rare. I don&apos;t really go back to it myself
            anymore, but I do still go back to some of the YouTube
            videos I discovered when I first started playing. I
            subscribed to{" "}
            <a
              href="https://www.matthewcawood.com/monday-music-tips"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-[#2D8B7E] underline decoration-[#2D8B7E]/40 underline-offset-2 transition-colors hover:decoration-[#2D8B7E]"
            >
              Matthew Cawood&apos;s Monday Music Tips
            </a>{" "}
            newsletter and I still read it today, really insightful
            stuff. David Bennett&apos;s theory channel filled in loads
            of the gaps. I probably Googled &ldquo;how to practise
            piano&rdquo; a hundred times and stitched my own approach
            together from everything I read.
          </p>

          <p className="mt-6">
            After about three and a half months I realised what the
            actual problem was. I wasn&apos;t stuck on a piece, I
            wasn&apos;t plateauing really, I was just genuinely
            overwhelmed by the sheer amount of content out there. I
            wanted someone to shepherd me through the noise, basically,
            and help me work out where I should be spending all of my
            time. I wanted to get good fast, I&apos;m bad like that.
          </p>

          <p className="mt-6">
            Time-wise I had the hours. My wife had just started a new
            job at a bakery so she was up at 4:45 four mornings a week,
            Wednesday to Saturday, and I&apos;m a morning person anyway,
            so I didn&apos;t want to be on a different rhythm to her.
            We like spending time together, so going to bed later than
            her didn&apos;t really appeal. I started getting up around
            5:00, practising before work. Turns out my peak learning
            window is first thing in the morning, patience to burn,
            energised from sleep, no mushy post-work brain.
          </p>

          <h3 className="mt-10 text-xl font-bold text-[#1A1A2E]">
            Josh
          </h3>

          <p className="mt-4">
            I went on musicteachers.com. I was a bit money-conscious
            about how I wanted to spend my money at that point, so I
            was looking at people on the lower end of the scale. I
            think I&apos;m quite a difficult student honestly, I&apos;ve
            got a strong understanding of what motivates me and what
            gets me to work well, and I&apos;ll push back when
            something isn&apos;t landing. I agreed to do a trial
            lesson with a guy called{" "}
            <a
              href="https://musicteachers.co.uk/musicteacher/Josh/JZYcvb5SL7"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-[#2D8B7E] underline decoration-[#2D8B7E]/40 underline-offset-2 transition-colors hover:decoration-[#2D8B7E]"
            >
              Josh
            </a>
            , based up in Scotland from
            what I remember. Really nice guy, a lot younger than me,
            but you could tell he was super passionate about music. I
            even looked him up on YouTube on his own personal account
            and he was talking about wellness stuff, which resonates
            with me.
          </p>

          <p className="mt-6">
            Josh was predominantly a guitarist and by his own
            admission wasn&apos;t the greatest pianist. That was fine
            for a while, what I really needed was the dialogue.
            Someone to explain intervals and theory and how the notes
            connected to each other. Pianote does that brilliantly
            one-way, but what I&apos;d been missing was being able to
            stop the video and ask why. Josh gave me that.
          </p>

          <p className="mt-6">
            He started us on Adele, which I like, but I wouldn&apos;t
            actually choose to play Adele in my own time. I told him
            that, not because he&apos;d done anything wrong, but
            because I think as a learner it&apos;s important to be
            clear about what motivates you. Your teacher is trying to
            do their best work, and they can&apos;t if you don&apos;t
            give them the feedback. Josh really appreciated the
            honesty. About a month and a half into our lessons he
            admitted he was going to have to push his own piano hard
            to stay ahead of where I was heading, and we both knew
            where that was going.
          </p>

          <p className="mt-6">
            I booked one last lesson specifically to break up with
            him. Didn&apos;t even set up the piano. I just wanted to
            talk to him face-to-face, I&apos;d really enjoyed the
            lessons and it was important to me to be genuine with
            him. It felt like breaking up with someone at school, the
            same sort of fear of doing it, and at least this time I
            didn&apos;t have to write out a script like I did on the
            phone breaking up with someone when I was younger. We had
            a really good breakup conversation, he advised me on
            where I should go next based on what I wanted to get out
            of things, and I think he also appreciated the fact that
            I didn&apos;t just send him an email. Yes, I paid for a
            lesson that I didn&apos;t learn any piano at, but Josh
            had imparted his time and knowledge and he deserved it.
          </p>

          <p className="mt-6">
            Josh, if you&apos;re ever reading this, thanks a lot.
            Really appreciate you being my first teacher, and I love
            what we learned together.
          </p>

          <h3 className="mt-10 text-xl font-bold text-[#1A1A2E]">
            The spreadsheet
          </h3>

          <p className="mt-4">
            Around the time Josh and I parted ways, I started the
            spreadsheet. 1 June 2023 according to the timestamp on
            it. I work in Professional Services, I&apos;m a Director
            now but I&apos;ve been a project manager for most of my
            career, and everyone on my team does timecards as part
            of what you do in a professional service organisation.
            I&apos;m extremely used to tracking time, I can see how
            valuable the data can be. I really love data, it&apos;s
            a weird thing to say, but being able to visualise or see
            where you&apos;ve gone or how well you&apos;ve done is
            properly interesting to look back on.
          </p>

          <p className="mt-6">
            So what I ended up with was basically me applying what I
            already know how to do, project-managing delivery, to the
            new thing I was trying to learn.{" "}
            <a
              href="https://www.youtube.com/watch?v=uFz8rJ2PGeU"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-[#2D8B7E] underline decoration-[#2D8B7E]/40 underline-offset-2 transition-colors hover:decoration-[#2D8B7E]"
            >
              Matthew Cawood&apos;s writing on deliberate practice
            </a>{" "}
            gave it the rest of its
            shape, along with{" "}
            <a
              href="https://www.youtube.com/watch?v=13Qa9mpCHo0"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-[#2D8B7E] underline decoration-[#2D8B7E]/40 underline-offset-2 transition-colors hover:decoration-[#2D8B7E]"
            >
              a guy called Jazer
            </a>{" "}
            and a handful of other
            piano teachers and bloggers who kept showing up in my
            research. They all said variations of the same thing.
            Don&apos;t go through the motions, have intent in every
            session, break pieces down into sections and work the hard
            sections properly. That maps exactly onto how I&apos;d
            learned sport over the years, you know when you&apos;re
            training and practising you need to have intent, you
            can&apos;t just go through the motions. You need systems to
            achieve growth, having a growth mindset alone isn&apos;t
            really enough.
          </p>

          <p className="mt-6">
            I printed a weekly sheet each week. It had a goal for the
            week at the top, and then columns for sight reading,
            technique, scales and arpeggios, musical theory, repertoire,
            and playing for fun. It ran Saturday through Friday, and I&apos;d
            use a pen to write down how many minutes I&apos;d spent on
            each activity as I went. Feedback questions on the reverse
            side, what was your focus, was the plan effective, that sort
            of thing. Repertoire tracking on the back page. I guess it
            looked a bit like a well-run team&apos;s sprint planner,
            because of course it did.
          </p>

          <p className="mt-6">
            Around the same time I upgraded to a weighted keyboard,
            second hand off eBay. The seller had dropped it so the
            case was cracked, and they were selling it really cheap.
            Absolute bargain. Believe in recycling, this was
            important to me. It was a Casio CDP, 110 or something
            like that I think. The crack means the lower notes
            vibrate and distort a bit, so with headphones it&apos;s
            fantastic and without them it&apos;s interesting.
            It&apos;s still in my shed, actually, if anyone&apos;s
            in the market for a slightly cracked digital piano.
          </p>

          <h3 className="mt-10 text-xl font-bold text-[#1A1A2E]">
            James
          </h3>

          <p className="mt-4">
            <a
              href="https://jameshawken.com/home"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-[#2D8B7E] underline decoration-[#2D8B7E]/40 underline-offset-2 transition-colors hover:decoration-[#2D8B7E]"
            >
              James Hawken
            </a>{" "}
            was my second teacher. A Cornish man, a
            wonderful human being, and we really hit it off on a
            personal level, which was important to me. I needed to
            feel in a safe environment and he provided that. The
            other thing about James was that he&apos;d previously
            worked with children on the spectrum, and what that
            meant in practice was that he could handle me being
            obsessive, me wanting to do things my own way. He knew
            when to push back on me and vice versa. We built up a
            brilliant working relationship really quickly.
          </p>

          <p className="mt-6">
            I decided pretty quickly I didn&apos;t want one lesson a
            week. I wanted an hour on a Wednesday and then a
            half-hour check-in on a Friday, and I&apos;d do it that
            way so that we could focus deep on something mid-week
            and then course-correct before the weekend. Josh&apos;s
            parting advice had included doing the grades for
            structure, and James assessed me at Grade 2 level
            straight away. We worked through Grade 2, then Grade 3,
            then Grade 4, not officially, no exams sat, just mock
            assessments he&apos;d record. By the way, as soon as he
            pressed that red button to record, my hands would
            suddenly feel heavier. If you&apos;re doing real exams,
            make sure your teacher records you in practice, the
            jeopardy is a useful variable to train under.
          </p>

          <p className="mt-6">
            I played my first public piano in San Diego airport on a
            work trip. My head office is in San Diego and I was over
            there for two weeks, away from my keyboard for a while,
            which was quite difficult. So when I saw the piano at
            the airport I couldn&apos;t help myself. I played for
            probably an hour or an hour and a half, I don&apos;t
            know enough piano to be playing for that long but I was
            just so happy to be back at one. A colleague filmed me
            doing &ldquo;Experience,&rdquo; but he didn&apos;t quite
            catch the ending because he wanted to go and get food,
            and I hadn&apos;t really warned him how long the piece
            was going to go on for.
          </p>

          <figure className="mt-8">
            <div className="overflow-hidden rounded-2xl border border-[#E8DFD3] shadow-sm">
              <div className="relative aspect-video w-full bg-black">
                <iframe
                  src="https://www.youtube.com/embed/sy-c1KlgY04"
                  title="Mikey playing &lsquo;Experience&rsquo; at San Diego airport"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                  className="absolute inset-0 h-full w-full"
                />
              </div>
            </div>
            <figcaption className="mt-3 text-center text-xs text-[#6B7280]">
              San Diego airport, mid-&ldquo;Experience.&rdquo; The
              ending got away from us.
            </figcaption>
          </figure>

          <p className="mt-8">
            The public piano thing had
            already been a rule for me by that point, actually. If I
            see a piano, I sit down and play something. It&apos;s
            not really about performing, I&apos;m not into that at
            all. It&apos;s more that every piano has its own
            character, some of them are in tune and some definitely
            aren&apos;t, and they all feel slightly different to
            play. Same rule applies in my own house. Seeing the
            piano means sitting down for five minutes, even when
            I&apos;m busy.
          </p>

          <blockquote className="mt-8 rounded-2xl border-l-4 border-[#2D8B7E] bg-white p-6 text-lg italic text-[#1A1A2E]">
            Music for me is about presence, not performance.
          </blockquote>

          <p className="mt-8">
            I did have one other public piano moment, at Melbourne
            airport on a holiday with my wife. Someone clapped
            after I played something, and I got so embarrassed that
            I couldn&apos;t actually carry on, I just had to stop.
            I did say thanks though.
          </p>

          <p className="mt-6">
            After Grade 4 I started to doubt a little bit. I was
            leaning too hard on memorising scores, it&apos;s one
            of my strengths, but it was masking that my sight
            reading was still pretty terrible. We decided to
            maybe go for an actual official grade this time, and I
            realised I&apos;d have to do everything on catch-up,
            scales, arpeggios, reading. I also started to question
            whether grades were even what I wanted. Some of the
            set pieces, looking at you Spooky Wooky Hollow, I was
            never going to play outside of grade submissions.
            What did I actually want from this?
          </p>

          <p className="mt-6">
            It was actually James who said to me, you know, maybe
            you need to look elsewhere and have another fit and
            see if you get some more inspiration. He is such an
            amazing man. I could have carried on with him happily
            and I still would have been learning loads, but he
            suggested I explore because he could see I was
            hitting something different. Who does that.
          </p>

          <h3 className="mt-10 text-xl font-bold text-[#1A1A2E]">
            Singing, Auris, and how I found Ellie
          </h3>

          <p className="mt-4">
            I wanted to learn to sing. Not in public, this is all
            completely for me, I&apos;m not really a performer and
            I don&apos;t like the limelight. I don&apos;t do social
            media or anything like that, I have quite a personal
            private life. But I&apos;d realised that actually
            playing an Einaudi piece I&apos;ve loved and connected
            with is a whole new experience, completely different to
            just listening to it, and I was curious what singing
            songs I loved would do.
          </p>

          <p className="mt-6">
            I tried a couple of online singing trial lessons and
            found them really awkward. Not the teachers, the
            actual exercise itself. I&apos;m a terrible singer, I
            just never sing, so it&apos;s a completely untrained
            thing for me. When you&apos;ve got an instrument
            between you and a stranger there&apos;s some
            separation, but when you <em>are</em> the instrument,
            that&apos;s very disarming. I didn&apos;t know how to
            control my voice, hadn&apos;t connected with my head
            voice in any way, and opening up that side of me to
            someone on Zoom felt like more vulnerability than
            I&apos;d signed up for.
          </p>

          <p className="mt-6">
            I messaged a teacher called{" "}
            <a
              href="https://musicteachers.co.uk/musicteacher/Auris/jBWV0AErUE"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-[#2D8B7E] underline decoration-[#2D8B7E]/40 underline-offset-2 transition-colors hover:decoration-[#2D8B7E]"
            >
              Auris
            </a>{" "}
            about singing lessons
            and he sent me one of the most interesting replies
            I&apos;ve had from a prospective teacher. He basically
            said he didn&apos;t think I should do singing lessons
            via Zoom, the medium has this personal quality that
            doesn&apos;t really translate. Which was exactly what
            I&apos;d just experienced. I was already intrigued by
            Auris anyway because he was also a jazz pianist, and
            my practice had neglected improvisation completely,
            improv is pretty much the opposite of how my brain
            works. So I asked him for a piano trial instead and
            went that route.
          </p>

          <p className="mt-6">
            Somewhere in the middle of all this, a local teacher
            I&apos;d had a discussion with said I wasn&apos;t
            really the right fit for her, and she pointed me at
            Ellie.{" "}
            <a
              href="https://www.em-cas.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-[#2D8B7E] underline decoration-[#2D8B7E]/40 underline-offset-2 transition-colors hover:decoration-[#2D8B7E]"
            >
              Ellie Moorhouse
            </a>
            , who runs a music studio
            locally but does all her lessons online. I thought
            I&apos;d still have an introductory call rather than
            going straight into a lesson, and we had a quick chat
            and decided we&apos;d go ahead with giving singing and
            piano a go together. What really appealed to me first
            of all was that she had a Google doc for me to
            document everything that we&apos;re doing. It felt
            nice and structured and there was a clear pathway for
            me to go forward. We spoke about goals and intent as
            well, so my learning style was pretty well aligned
            with her teaching style. That was the click. My
            spreadsheet had finally met its teaching counterpart.
          </p>

          <p className="mt-6">
            I ran Ellie and Auris in parallel for a few weeks,
            because the lessons with Auris were still interesting,
            sort of jazz and improv, and it was quite different
            from Ellie&apos;s style. I was up front with them both
            though, I said look, I&apos;m having lessons with
            multiple teachers at the moment because I want to
            make sure I&apos;ve got the right fit. It felt more
            and more that Ellie was the right fit. So I had
            another breakup conversation with Auris, which he
            understood and was super supportive about. We sort of
            left it that maybe in the future I&apos;d love to
            come back and continue the jazz pathway, because
            it&apos;s still something that interests me.
          </p>

          <h3 className="mt-10 text-xl font-bold text-[#1A1A2E]">
            Here&apos;s where Mewstro actually began
          </h3>

          <p className="mt-4">
            I&apos;d shared the Google Sheet with Ellie on my first
            introduction because I thought it was important to
            show her what my learning style was and what I was
            like as an individual. She instantly thought it was
            brilliant, loved that I was so intentful with my
            learning. I think she may have used the phrase
            &ldquo;ideal student.&rdquo; Little did she know
            she&apos;d end up being asked loads of questions about
            teaching apps and tracking software for her students
            further down the line. What was real was that she
            immediately got the approach, and our lesson rhythm
            locked in around it.
          </p>

          <p className="mt-6">
            A while later I started wondering if the spreadsheet
            should really be an app. At work I use an app to
            track time, my team uses one too, and it just felt
            like it would be cool if I could do this on my phone.
            Tap a button, session starts, session ends, no manual
            adding up at the end of the week. So I started
            building, for me, nothing else. I decided to call it
            Skald, which is basically a Nordic poet kind of
            figure. I actually took the name from Dark Ages of
            Camelot, an MMORPG I played way too much of. The
            Skald was a musician-warrior class on one of the
            factions, and I&apos;d also played the Minstrel on
            another faction, both music-related. At the time I
            was deep in a Sleep Token obsession, still am,
            they&apos;re one of my favourite bands. They&apos;ve
            got a real aesthetic and they&apos;ve built their own
            world around it, and I wanted to lean into that.
            Heavy metal energy, built entirely for me.
          </p>

          <p className="mt-6">
            I was in a lesson with Ellie one day and I was like,
            oh, can I show you something? Almost as an aside. I
            showed her Skald running on my phone. She said,
          </p>

          <blockquote className="mt-6 rounded-2xl border-l-4 border-[#2D8B7E] bg-white p-6 text-lg italic text-[#1A1A2E]">
            This is really cool. I think some of my other
            students would like this.
          </blockquote>

          <p className="mt-8">
            Between that lesson and the next one I was like,
            well, I&apos;ve got this heavy metal theme going on
            here, I&apos;m not sure all of Ellie&apos;s students
            would like that. So I added a couple of other themes.
            A calmer green one I called Maestro, and a re-skin
            which was a bit more neutral. I also thought, while
            I&apos;m at it, I&apos;ll create a theme in
            Ellie&apos;s studio colours, because that would just
            be quite funny to show her. She saw that and was
            like, okay yeah, let&apos;s start thinking about
            giving this to my students.
          </p>

          <p className="mt-6">
            That was a bigger conversation. We started talking
            about what she would actually find interesting or
            useful for her students. The leaderboard idea came
            from those discussions, she wanted a way to set up
            competitions across her studio. I kept thinking
            about what she&apos;d said, and the logic shifted.
            If Ellie finds this useful as a teacher, other
            teachers are almost certainly going to find it
            useful too. Going back to the fact that I love data,
            I can only imagine that week-to-week teachers
            don&apos;t really know what their students have got
            up to between lessons. If I could help with that by
            gamifying it and adding streaks, the app I&apos;d
            built for students was really an app for teachers.
          </p>

          <p className="mt-6">
            The other practice apps I looked at were solid on
            features but I thought they kind of lacked
            personality. I wondered whether a mascot might help.
            I was rolling the name Maestro around and realised
            Maestro plus meow gave me Mewstro, and that just
            stuck. The word came first, the cat followed.
          </p>

          <h3 className="mt-10 text-xl font-bold text-[#1A1A2E]">
            Where I am now
          </h3>

          <p className="mt-4">
            Still having lessons with Ellie, still learning
            piano and singing. We&apos;re working towards Grade 7
            over the next couple of years. I took the Grade 5
            repertoire through with her but didn&apos;t sit it
            officially, and we&apos;ve parked Grade 6.
            Developing Mewstro has definitely taken a bite out
            of the time I used to put into practice, so Grade 7
            might be a few years out, I don&apos;t really know.
            But I&apos;m loving still being able to connect with
            and play the piano.
          </p>

          <p className="mt-6">
            The public-piano rule is definitely still active.
            Only this week I played at Amsterdam airport,
            they&apos;ve got a nice piano there, and my flight
            connection time was pretty tight, but I still found
            the time to sit down and play. My train from Oxford
            station was delayed yesterday, so the staff there
            got another rendition of &ldquo;Experience.&rdquo;
            They&apos;ve probably heard it quite a few times
            from me by now, poor things. I don&apos;t commute
            regularly, but every time I do I go and sit down at
            the piano and play.
          </p>

          <p className="mt-6">
            Ellie is my first teacher turned first customer,
            she&apos;s my co-creator, and she&apos;s the reason
            Mewstro exists at all.
          </p>

          <p className="mt-8 text-lg font-semibold text-[#1A1A2E]">
            Built by someone who wanted to practise more and
            found the structure to actually do it, alongside
            the piano teacher who helped me get there.
          </p>
        </article>
      </section>

      {/* Ellie quote — captured after her founding pilot wrapped */}
      <section className="bg-white px-6 py-16">
        <div className="mx-auto max-w-3xl rounded-3xl border border-[#E8DFD3] bg-[#FAF6EF] p-8 md:p-10">
          <div className="flex flex-col items-center gap-4 text-center">
            <Image
              src="/mewstro/mascot-conducting.png"
              alt=""
              width={72}
              height={72}
            />
            <p className="text-xs uppercase tracking-wider text-[#6B7280]">
              From our founding teacher
            </p>
            <blockquote className="text-lg leading-relaxed text-[#1A1A2E]">
              &ldquo;This app is everything that I&apos;d been looking for!
              It allows me to work with my students to put together their
              practice schedule, and creates an inviting space for them to
              record how well they&apos;re able to stick to that schedule.
              I also love the leader-board feature, this really appeals to
              my more competitive students! Highly recommend.&rdquo;
            </blockquote>
            <p className="text-sm font-semibold text-[#1A1A2E]">
              Ellie Moorhouse
              <span className="ml-2 font-normal text-[#6B7280]">
                EM:CAS — Founding Studio #1
              </span>
            </p>
          </div>
        </div>
      </section>

      {/* Josh quote — captured after his first four weeks as Founding Studio #2 */}
      <section className="bg-[#FFFBF7] px-6 py-16">
        <div className="mx-auto max-w-3xl rounded-3xl border border-[#E8DFD3] bg-[#FAF6EF] p-8 md:p-10">
          <div className="flex flex-col items-center gap-4 text-center">
            <p className="text-xs uppercase tracking-wider text-[#6B7280]">
              From a founding studio
            </p>
            <blockquote className="text-lg leading-relaxed text-[#1A1A2E]">
              &ldquo;Overall Mewstro has given me a clearer understanding of my
              students&apos; activity in between lessons. It has allowed me
              greater ease of sharing learning materials with my students and
              has enabled me to have a source of contact which was missing
              before using the app.&rdquo;
            </blockquote>
            <p className="text-sm font-semibold text-[#1A1A2E]">
              Josh Ingram
              <span className="ml-2 font-normal text-[#6B7280]">
                Founding Studio #2
              </span>
            </p>
            <Link
              href="/mewstro/case-study"
              className="text-sm font-semibold text-[#2D8B7E] hover:underline"
            >
              Read Josh&apos;s first four weeks →
            </Link>
          </div>
        </div>
      </section>

      {/* Dual CTA — self-fork */}
      <section className="bg-[#FFFBF7] px-6 py-20">
        <div className="mx-auto max-w-4xl">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-[#1A1A2E] md:text-4xl">
              Where next?
            </h2>
          </div>
          <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-2">
            <div className="rounded-3xl border border-[#E8DFD3] bg-white p-8 shadow-sm">
              <p className="text-xs uppercase tracking-wider text-[#2D8B7E]">
                I&apos;m a music teacher
              </p>
              <h3 className="mt-2 text-2xl font-bold text-[#1A1A2E]">
                Apply for a Founding Studio slot
              </h3>
              <p className="mt-3 text-sm text-[#5A4E42]">
                Five founding studios, 50% off for life, direct line to me.
                Applications reviewed personally.
              </p>
              <Link
                href="/mewstro/teachers/apply"
                className="mt-6 inline-block rounded-full bg-[#2D8B7E] px-6 py-3 text-sm font-semibold text-white transition-transform hover:scale-[1.02]"
              >
                Apply to be a Founding Studio
              </Link>
            </div>
            <div className="rounded-3xl border border-[#E8DFD3] bg-white p-8 shadow-sm">
              <p className="text-xs uppercase tracking-wider text-[#F4845F]">
                I&apos;m learning an instrument
              </p>
              <h3 className="mt-2 text-2xl font-bold text-[#1A1A2E]">
                Get Mewstro on your phone
              </h3>
              <p className="mt-3 text-sm text-[#5A4E42]">
                Free to start. Solo Premium unlocks everything after a 7-day
                trial.
              </p>
              <Link
                href="/mewstro/app"
                className="mt-6 inline-block rounded-full border border-[#1A1A2E] bg-white px-6 py-3 text-sm font-semibold text-[#1A1A2E] transition-colors hover:bg-[#FAF6EF]"
              >
                See Mewstro for solo learners
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
