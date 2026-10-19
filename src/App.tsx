import { useEffect, useMemo, useState } from 'react';
import {
  CalendarDays,
  ChevronRight,
  Compass,
  Instagram,
  Menu,
  Megaphone,
  Mountain,
  Search,
  Sparkles,
  X,
} from 'lucide-react';
import { api } from '@appdeploy/client';
import { auth } from '@appdeploy/client';
import { ImagePlus, ShieldCheck, Link2 } from 'lucide-react';
import { Copy, ImageIcon, MoreHorizontal, SearchIcon, Trash2 } from 'lucide-react';

type EventItem = {
  id: string;
  title: string;
  date: string;
  time?: string;
  location: string;
  category: string;
  status: string;
  price: string;
  description: string;
  image: string;
  experience?: string;
  registrationLink?: string;
  capacity?: number;
};
type ExperienceItem = { id: string; name: string; description: string; category: string; coverImage?: string; status?: string; featured?: boolean; socialLink?: string; website?: string };
type Story = {
  id: string;
  title: string;
  category: string;
  date: string;
  excerpt: string;
  content?: string;
  coverImage?: string;
  status?: string;
  featured?: boolean;
};
type Announcement = { id: string; title: string; body: string; date: string };

const fallbackEvents: EventItem[] = [
  {
    id: 'e1',
    title: 'Urban Hikers — Reactivation Hike',
    date: '2026-08-22',
    location: 'Coal Camp, Enugu',
    category: 'Urban Hikers',
    status: 'completed',
    price: '₦2,500',
    description: 'A return to the trail: movement, exploration and community.',
    image:
      'https://images.unsplash.com/photo-1551632811-561732d1e306?auto=format&fit=crop&w=1400&q=80',
  },
  {
    id: 'e2',
    title: 'Urban Hangout',
    date: '2026-08-16',
    location: 'Villa Toscana, Enugu',
    category: 'Community',
    status: 'completed',
    price: '₦1,000',
    description: 'Games, music, drinks and the people that make the community.',
    image:
      'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=1400&q=80',
  },
  {
    id: 'e3',
    title: 'Urban Hikers × Eastern United',
    date: '2026-09-12',
    location: 'Ngwo Park',
    category: 'Outdoor',
    status: 'completed',
    price: 'Free',
    description:
      'An active afternoon built around touch rugby, movement and connection.',
    image:
      'https://images.unsplash.com/photo-1518609878373-06d740f60d8b?auto=format&fit=crop&w=1400&q=80',
  },
];

const fallbackStories: Story[] = [
  {
    id: 's1',
    title: 'More Than a Hike. It’s a Community.',
    category: 'Community',
    date: '2026-08-28',
    excerpt:
      'Why the trail is only the beginning of what Urban Hikers is building.',
  },
  {
    id: 's2',
    title: 'Why We Live. Connect. Explore.',
    category: 'Urban Life Co.',
    date: '2026-08-20',
    excerpt: 'The three ideas at the centre of every experience we create.',
  },
  {
    id: 's3',
    title: 'The Urban Life Field Notes',
    category: 'Journal',
    date: '2026-08-10',
    excerpt: 'A growing archive of places, people and experiences.',
  },
];

function formatDate(value: string) {
  return new Intl.DateTimeFormat('en-NG', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(value));
}

function App() {
  const [events, setEvents] = useState<EventItem[]>(fallbackEvents);
  const [stories, setStories] = useState<Story[]>(fallbackStories);
  const [experiences, setExperiences] = useState<ExperienceItem[]>([]);
  const [announcement, setAnnouncement] = useState<Announcement | null>(null);
  const [page, setPage] = useState(() => window.location.hash.startsWith('#admin') ? 'admin' : 'home');
  const [menu, setMenu] = useState(false);
  const [adminUser, setAdminUser] = useState<any>(null);
  const [adminAuthorised, setAdminAuthorised] = useState(false);
  const [adminError, setAdminError] = useState('');
  const [query, setQuery] = useState('');
  const globalResults = useMemo(() => { const q = query.trim().toLowerCase(); if (!q) return []; return [...events.map(x => ({ type: 'Event', title: x.title, id: x.id })), ...stories.map(x => ({ type: 'Journal', title: x.title, id: x.id })), ...experiences.map(x => ({ type: 'Experience', title: x.name, id: x.id }))].filter(x => x.title.toLowerCase().includes(q)).slice(0, 8); }, [query, events, stories, experiences]);
  const [selectedEvent, setSelectedEvent] = useState<EventItem | null>(null);
  const [selectedExperience, setSelectedExperience] = useState<ExperienceItem | null>(null);
  const [selectedStory, setSelectedStory] = useState<Story | null>(null);
  const [settings, setSettings] = useState<any>({});

  useEffect(() => {
    auth.getUser().then(async user => {
      setAdminUser(user);
      if (user && window.location.hash.startsWith('#admin')) {
        try {
          await api.get('/api/admin/status');
          setAdminAuthorised(true);
          setAdminError('');
        } catch {
          setAdminAuthorised(false);
          setAdminError('Wrong account. This account does not have administrator access.');
        }
      }
    }).catch(() => {
      setAdminUser(null);
      setAdminAuthorised(false);
    });
    api
      .get('/api/content')
      .then(({ data }) => {
        if (data?.events?.length) setEvents(data.events);
        if (data?.announcement) setAnnouncement(data.announcement);
        if (data?.stories?.length) setStories(data.stories);
        if (data?.experiences?.length) setExperiences(data.experiences);
        if (data?.settings) setSettings(data.settings);
        if (data?.settings?.heroTitle) document.title = `${data.settings.heroTitle} — Urban Life Co.`;
      })
      .catch(() => undefined);
  }, []);

  // Re-read published content whenever the visitor leaves the CMS so admin changes are reflected immediately without a hard refresh.
  useEffect(() => {
    if (page === 'admin') return;
    api.get('/api/content').then(({ data }) => {
      if (data?.events) setEvents(data.events);
      if (data?.announcement !== undefined) setAnnouncement(data.announcement);
      if (data?.stories) setStories(data.stories);
      if (data?.experiences) setExperiences(data.experiences);
      if (data?.settings) setSettings(data.settings);
    }).catch(() => undefined);
  }, [page]);

  const filteredEvents = useMemo(
    () =>
      events.filter(e =>
        `${e.title} ${e.category} ${e.location}`
          .toLowerCase()
          .includes(query.toLowerCase())
      ),
    [events, query]
  );
  const upcoming = filteredEvents.filter(e => e.status !== 'completed' && e.status !== 'cancelled' && e.status !== 'postponed' && new Date(e.date) >= new Date());
  const past = filteredEvents.filter(e => e.status === 'completed' || e.status === 'cancelled' || e.status === 'postponed' || new Date(e.date) < new Date());

  const openEvent = (event: EventItem) => { setSelectedEvent(event); setSelectedExperience(null); setSelectedStory(null); setPage('event'); setMenu(false); window.scrollTo({ top: 0, behavior: 'smooth' }); };
  const openExperience = (experience: ExperienceItem) => { setSelectedExperience(experience); setSelectedEvent(null); setSelectedStory(null); setPage('experience'); setMenu(false); window.scrollTo({ top: 0, behavior: 'smooth' }); };
  const openStory = (story: Story) => { setSelectedStory(story); setSelectedEvent(null); setSelectedExperience(null); setPage('story'); setMenu(false); window.scrollTo({ top: 0, behavior: 'smooth' }); };

  const nav = (target: string) => {
    if (target === 'admin') window.location.hash = 'admin';
    else if (window.location.hash) window.history.replaceState(null, '', window.location.pathname + window.location.search);
    setPage(target);
    setMenu(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="site-shell">
      {announcement && (
        <div className="announcement">
          <Megaphone size={15} />
          <span>{announcement.title}</span>
          <button
            onClick={() => setAnnouncement(null)}
            aria-label="Dismiss announcement"
          >
            <X size={15} />
          </button>
        </div>
      )}
      <header className="nav-wrap">
        <button
          className="brand"
          onClick={() => nav('home')}
          aria-label="Urban Life Co. home"
        >
          <img className="brand-logo" src="/resources/urban-life-logo.png" alt="Urban Life Co." />
        </button>
        <nav className={menu ? 'nav open' : 'nav'}>
          {[
            'home',
            'about',
            'experiences',
            'events',
            'journal',
            'community',
            'contact',
          ].map(item => (
            <button
              key={item}
              className={page === item ? 'active' : ''}
              onClick={() => nav(item)}
            >
              {item}
            </button>
          ))}
          <button className="nav-cta" onClick={() => nav('events')}>
            Explore events <ChevronRight size={15} />
          </button>
        </nav>
        <button
          className="menu-btn"
          onClick={() => setMenu(!menu)}
          aria-label="Toggle navigation"
        >
          {menu ? <X /> : <Menu />}
        </button>
      </header>

      {page === 'admin' && (
        <AdminPanelV2
          user={adminUser}
          authorised={adminAuthorised}
          adminError={adminError}
          onSignIn={async () => {
            setAdminError('');
            try {
              const result = await auth.signIn({ scope: 'openid email profile offline_access' });
              setAdminUser(result.user);
              try {
                await api.get('/api/admin/status');
                setAdminAuthorised(true);
                setAdminError('');
              } catch {
                setAdminAuthorised(false);
                setAdminError('Wrong account. This account does not have administrator access.');
              }
            } catch (error: any) {
              setAdminUser(null);
              setAdminAuthorised(false);
              if (error?.code === 'popup_closed') {
                setAdminError('');
              } else {
                setAdminError('Account not found. Please try again.');
              }
            }
          }}
          onSignOut={async () => {
            await auth.signOut();
            setAdminUser(null);
            setAdminAuthorised(false);
            setAdminError('');
            window.location.hash = 'admin';
            setPage('admin');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
        />
      )}

      {page === 'home' && (
        <>
          <section className="hero">
            <div className="hero-image" />
            <div className="hero-content">
              <p className="eyebrow">{settings.heroEyebrow ?? 'URBAN LIFE CO. · ENUGU · NIGERIA'}</p>
              <h1>{(settings.heroTitle ?? 'Live. Connect. Explore.').split('. ').map((word: string, index: number) => <span key={word + index}>{word}{index < 2 ? '. ' : '.'}<br /></span>)}</h1>
              <p className="hero-copy">{settings.heroCopy ?? 'We create experiences that bring people together, encourage exploration and make everyday life more meaningful.'}</p>
              <div className="actions">
                <button
                  className="button light"
                  onClick={() => nav('experiences')}
                >
                  Explore experiences <ChevronRight size={17} />
                </button>
                <button className="text-button" onClick={() => nav('events')}>
                  See what’s happening <ChevronRight size={17} />
                </button>
              </div>
              <div className="hero-meta">
                <span><b>01</b> COMMUNITY</span>
                <span><b>02</b> OUTDOORS</span>
                <span><b>03</b> CONNECTION</span>
              </div>
            </div>
          </section>
          <div className="brand-marquee" aria-hidden="true">
            <div className="marquee-track">
              <span>LIVE</span><i>•</i><span>CONNECT</span><i>•</i><span>EXPLORE</span><i>•</i><span>URBAN LIFE</span><i>•</i><span>LIVE</span><i>•</i><span>CONNECT</span><i>•</i><span>EXPLORE</span><i>•</i><span>URBAN LIFE</span><i>•</i>
            </div>
          </div>
          <section className="statement">
            <p className="eyebrow">THE IDEA</p>
            <h2>
              A lifestyle brand built around{' '}
              <span>people, places and experiences.</span>
            </h2>
            <p>
              Urban Life Co. is a growing ecosystem for people who want to live
              fully, meet good people and discover more of the world around
              them.
            </p>
          </section>
          <Pillars />
          <ExperienceShowcase onNavigate={nav} />
          <section className="section">
            <div className="section-head">
              <div>
                <p className="eyebrow">NEXT UP</p>
                <h2>Upcoming experiences</h2>
              </div>
              <button className="link-button" onClick={() => nav('events')}>
                View all <ChevronRight size={16} />
              </button>
            </div>
            {upcoming.length ? (
              <div className="event-grid">
                {upcoming.slice(0, 3).map(e => (
                  <EventCard key={e.id} event={e} onOpen={openEvent} />
                ))}
              </div>
            ) : (
              <Empty text="Nothing on the calendar yet. Check back soon." />
            )}
          </section>
          <BrandFeature onNavigate={nav} />
          <StoryStrip stories={stories} onView={() => nav('journal')} onOpen={openStory} />
        </>
      )}

      {page === 'about' && (
        <PageIntro
          eyebrow="OUR STORY"
          title="A life lived together."
          copy="Urban Life Co. exists to create spaces and experiences where people can live, connect and explore. We are building a modern lifestyle ecosystem from Enugu, Nigeria, with a long view toward communities across Africa."
          settings={settings}
        />
      )}
      {page === 'experiences' && (
        <section className="section page-section">
          <PageHeading eyebrow="EXPERIENCES" title="Find your way in." copy="Urban Life Co. is the home for communities and experiences designed around movement, discovery and connection." />
          <div className="experience-grid">
            {experiences.map((experience, index) => <Experience key={experience.id} title={experience.name} eyebrow={experience.category?.toUpperCase() ?? 'EXPERIENCE'} tone={index === 0 ? 'hikers' : index === 1 ? 'fitness' : 'connect'} icon={index === 0 ? <Mountain /> : index === 1 ? <Sparkles /> : <Compass />} copy={experience.description} onOpen={() => openExperience(experience)} />)}
          </div>
        </section>
      )}
      {page === 'event' && selectedEvent && <EventDetail event={selectedEvent} onBack={() => nav('events')} />}
      {page === 'experience' && selectedExperience && <ExperienceDetail experience={selectedExperience} events={events.filter(e => e.experience === selectedExperience.name)} onOpenEvent={openEvent} onBack={() => nav('experiences')} />}
      {page === 'story' && selectedStory && <StoryDetail story={selectedStory} onBack={() => nav('journal')} />}
      {page === 'events' && (
        <section className="section page-section">
          <PageHeading
            eyebrow="EVENTS"
            title="The Urban Life calendar."
            copy="Explore what has happened, what is happening and what comes next."
          />
          <div className="search">
            <Search size={17} />
            <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search events, stories or experiences" />
          </div>
          {query.trim() && <div className="search-results">{globalResults.map(result => <button key={`${result.type}-${result.id}`} onClick={() => { if (result.type === 'Event') { const item = events.find(x => x.id === result.id); if (item) openEvent(item); } else if (result.type === 'Journal') { const item = stories.find(x => x.id === result.id); if (item) openStory(item); } else { const item = experiences.find(x => x.id === result.id); if (item) openExperience(item); } }}>{result.type} · {result.title}</button>)}{!globalResults.length && <span>No matching content.</span>}</div>}
          <h3 className="subhead">Upcoming</h3>
          {upcoming.length ? (
            <div className="event-grid">                {upcoming.map(e => (
                <EventCard key={e.id} event={e} onOpen={openEvent} />
              ))}
            </div>
          ) : (
            <Empty text="No upcoming events published yet." />
          )}
          <h3 className="subhead">Past events</h3>
          <div className="event-grid">
            {past.map(e => (
              <EventCard key={e.id} event={e} onOpen={openEvent} />
            ))}
          </div>
        </section>
      )}
      {page === 'journal' && (
        <section className="section page-section">
          <PageHeading
            eyebrow="JOURNAL"
            title="Field notes from the community."
            copy="Stories, reflections, guides and recaps from the Urban Life ecosystem."
          />
          <StoryStrip stories={stories} onView={() => undefined} onOpen={openStory} />
        </section>
      )}
      {page === 'contact' && <ContactPage />}
      {page === 'community' && (
        <section className="community-page">
          <div className="community-copy">
            <p className="eyebrow">COMMUNITY</p>
            <h1>{settings.communityHeadline ?? 'Come for the experience. Stay for the people.'}</h1>
            <p>{settings.communityCopy ?? 'Urban Life Co. is being built around the belief that life gets better when people have places to meet, move, explore and build something together.'}</p>
            <button className="button dark" onClick={() => nav('events')}>
              Find an experience <ChevronRight size={17} />
            </button>
          </div>
          <div className="community-image" />
        </section>
      )}
      <footer>
        <div>
          <img className="footer-logo" src="/resources/urban-life-logo.png" alt="Urban Life Co." />
          <p>Live. Connect. Explore.</p>
        </div>
        <div className="footer-links">
          <button onClick={() => nav('about')}>About</button>
          <button onClick={() => nav('events')}>Events</button>
          <button onClick={() => nav('journal')}>Journal</button>
          <button onClick={() => nav('community')}>Community</button>
        </div>
        <div className="footer-bottom">
          <span>© 2026 Urban Life Co.</span>
          <span>Built for people who want more from life.</span>
          <a
            href="https://www.instagram.com/"
            target="_blank"
            rel="noreferrer"
            aria-label="Instagram"
          >
            <Instagram size={17} />
          </a>
        </div>
      </footer>
    </div>
  );
}

function Pillars() {
  return (
    <section className="pillars">
      <Pillar
        n="01"
        title="Live"
        text="Wellness, culture, recreation and experiences that make life feel lived."
      />
      <Pillar
        n="02"
        title="Connect"
        text="Friendships, community, networking and meaningful human relationships."
      />
      <Pillar
        n="03"
        title="Explore"
        text="Trails, places, adventures and the curiosity to keep discovering."
      />
    </section>
  );
}
function Pillar({
  n,
  title,
  text,
}: {
  n: string;
  title: string;
  text: string;
}) {
  return (
    <article className="pillar">
      <span>{n}</span>
      <h3>{title}</h3>
      <p>{text}</p>
    </article>
  );
}
function EventCard({ event, onOpen }: { event: EventItem; onOpen?: (event: EventItem) => void }) {
  return (
    <article className="event-card">
      <div
        className="event-image"
        style={{ backgroundImage: `url(${event.image})` }}
      >
        <span>{event.category}</span>
      </div>
      <div className="event-info">
        <div className="date">{formatDate(event.date)}</div>
        <h3>{event.title}</h3>
        <p>
          {event.location} · {event.price}
        </p>
        <button className="link-button" onClick={() => onOpen?.(event)}>
          View event <ChevronRight size={15} />
        </button>
      </div>
    </article>
  );
}
function EventDetail({ event, onBack }: { event: EventItem; onBack: () => void }) {
  return <section className="event-detail"><button className="link-button" onClick={onBack}>← Back to events</button><div className="event-detail-image" style={{ backgroundImage: `url(${event.image})` }} /><div className="event-detail-copy"><p className="eyebrow">{event.experience ?? event.category}</p><h1>{event.title}</h1><p className="event-detail-meta">{formatDate(event.date)}{event.time ? ` · ${event.time}` : ''} · {event.location}</p><p>{event.description}</p><div className="event-detail-actions">{event.registrationLink && <a className="button dark" href={event.registrationLink} target="_blank" rel="noreferrer">Register <ChevronRight size={16} /></a>}<span>{event.price}</span></div><div className="event-detail-grid"><div><b>What to expect</b><p>A thoughtfully designed Urban Life experience centred on people, place and participation.</p></div><div><b>Experience</b><p>{event.experience ?? event.category}</p></div></div></div></section>;
}
function ExperienceDetail({ experience, events, onOpenEvent, onBack }: { experience: ExperienceItem; events: EventItem[]; onOpenEvent: (event: EventItem) => void; onBack: () => void }) {
  return <section className="section page-section"><button className="link-button" onClick={onBack}>← Back to experiences</button><div className="page-heading"><p className="eyebrow">{experience.category}</p><h1>{experience.name}</h1><p>{experience.description}</p></div><div className="subhead">Events</div>{events.length ? <div className="event-grid">{events.map(event => <EventCard key={event.id} event={event} onOpen={onOpenEvent} />)}</div> : <Empty text="No events are attached to this experience yet." />}</section>;
}
function StoryDetail({ story, onBack }: { story: Story; onBack: () => void }) {
  return <section className="section page-section"><button className="link-button" onClick={onBack}>← Back to journal</button><div className="page-heading"><p className="eyebrow">{story.category} · {formatDate(story.date)}</p><h1>{story.title}</h1><p>{story.excerpt}</p></div><article className="story-detail-copy">{(story.content ?? story.excerpt).split('\n').map((paragraph, index) => <p key={index}>{paragraph}</p>)}</article></section>;
}
function ContactPage() {
  const [sent, setSent] = useState(false); const [busy, setBusy] = useState(false); const [errorMessage, setErrorMessage] = useState('');
  const submit = async (e: React.FormEvent<HTMLFormElement>) => { e.preventDefault(); setBusy(true); setErrorMessage(''); const form = new FormData(e.currentTarget); try { await api.post('/api/messages', { name: form.get('name'), email: form.get('email'), phone: form.get('phone'), type: form.get('type'), message: form.get('message') }); setSent(true); e.currentTarget.reset(); } catch { setErrorMessage('We could not send your message. Please try again.'); } finally { setBusy(false); } };
  return <section className="section page-section contact-page"><PageHeading eyebrow="CONTACT" title="Let’s build something together." copy="For partnerships, events, community enquiries and general conversations, send us a note." />{sent ? <div className="admin-notice"><ShieldCheck size={28} /><h2>Message received.</h2><p>Thanks for reaching out. We’ll get back to you as soon as we can.</p><button className="button dark" onClick={() => setSent(false)}>Send another message</button></div> : <form className="contact-form" onSubmit={submit}><label>Name<input required name="name" /></label><label>Email<input required type="email" name="email" /></label><label>Phone<input name="phone" /></label><label>Enquiry type<select name="type"><option>General enquiry</option><option>Partnership</option><option>Event</option><option>Community</option></select></label><label className="full">Message<textarea required name="message" rows={6} /></label>{errorMessage && <div className="photos-error full" role="alert">{errorMessage}</div>}<button className="button dark" disabled={busy} type="submit">{busy ? 'Sending…' : 'Send enquiry'} <ChevronRight size={16} /></button></form>}</section>;
}
function StoryStrip({
  stories,
  onView,
  onOpen,
}: {
  stories: Story[];
  onView: () => void;
  onOpen: (story: Story) => void;
}) {
  return (
    <section className="section stories">
      <div className="section-head">
        <div>
          <p className="eyebrow">JOURNAL</p>
          <h2>From the field</h2>
        </div>
        <button className="link-button" onClick={onView}>
          All stories <ChevronRight size={16} />
        </button>
      </div>
      <div className="story-grid">
        {stories.map((s, i) => (
          <article className={`story story-${i}`} key={s.id}>
            <div className="story-meta">
              {s.category} · {formatDate(s.date)}
            </div>
            <h3>{s.title}</h3>
            <p>{s.excerpt}</p>
            <button className="text-button" onClick={() => onOpen(s)}>
              Read story <ChevronRight size={16} />
            </button>
          </article>
        ))}
      </div>
    </section>
  );
}
function Experience({
  title,
  eyebrow,
  tone,
  icon,
  copy,
  onOpen,
}: {
  title: string;
  eyebrow: string;
  tone: 'hikers' | 'fitness' | 'connect';
  icon: React.ReactNode;
  copy: string;
  onOpen: () => void;
}) {
  return (
    <article className={`experience experience-${tone}`}>
      <div className="experience-top">
        <span className="experience-label">{eyebrow}</span>
        <div className="experience-icon">{icon}</div>
      </div>
      <h3>{title}</h3>
      <p>{copy}</p>
      <button className="link-button" onClick={onOpen}>
        Explore <ChevronRight size={15} />
      </button>
    </article>
  );
}

function ExperienceShowcase({ onNavigate }: { onNavigate: (target: string) => void }) {
  return (
    <section className="ecosystem-section">
      <div className="section-head ecosystem-head">
        <div>
          <p className="eyebrow">THE ECOSYSTEM</p>
          <h2>One life. Different ways to live it.</h2>
        </div>
        <p className="ecosystem-intro">Urban Life Co. is the parent brand. Each experience has its own personality, community and visual identity.</p>
      </div>
      <div className="ecosystem-grid">
        <button className="ecosystem-tile hikers" onClick={() => onNavigate('experiences')}>
          <span>01 · URBAN HIKERS</span>
          <strong>Find your trail.</strong>
          <small>Outdoor lifestyle · Exploration · Community</small>
          <ChevronRight />
        </button>
        <button className="ecosystem-tile fitness" onClick={() => onNavigate('experiences')}>
          <span>02 · URBAN FITNESS</span>
          <strong>Move with purpose.</strong>
          <small>Movement · Wellness · Energy</small>
          <ChevronRight />
        </button>
        <button className="ecosystem-tile connect" onClick={() => onNavigate('community')}>
          <span>03 · URBAN CONNECT</span>
          <strong>Meet. Build. Grow.</strong>
          <small>Networking · People · Opportunity</small>
          <ChevronRight />
        </button>
      </div>
    </section>
  );
}

function BrandFeature({ onNavigate }: { onNavigate: (target: string) => void }) {
  return (
    <section className="brand-feature">
      <div className="brand-feature-copy">
        <p className="eyebrow">A HOUSE OF EXPERIENCES</p>
        <h2>Different worlds.<br /><em>One urban life.</em></h2>
        <p>Urban Life Co. brings together distinct experiences without flattening them into one visual identity. Urban Hikers, Urban Fitness and future experiences each get room to be themselves.</p>
        <button className="button dark" onClick={() => onNavigate('experiences')}>Explore the ecosystem <ChevronRight size={17} /></button>
      </div>
      <div className="brand-feature-stack" aria-hidden="true">
        <div className="stack-card stack-life"><span>URBAN LIFE CO.</span><strong>LIVE.</strong></div>
        <div className="stack-card stack-hikers"><span>URBAN HIKERS</span><strong>EXPLORE.</strong></div>
        <div className="stack-card stack-fitness"><span>URBAN FITNESS</span><strong>MOVE.</strong></div>
      </div>
    </section>
  );
}
function PageHeading({
  eyebrow,
  title,
  copy,
}: {
  eyebrow: string;
  title: string;
  copy: string;
}) {
  return (
    <div className="page-heading">
      <p className="eyebrow">{eyebrow}</p>
      <h1>{title}</h1>
      <p>{copy}</p>
    </div>
  );
}
function PageIntro({
  eyebrow,
  title,
  copy,
  settings,
}: {
  eyebrow: string;
  title: string;
  copy: string;
  settings: any;
}) {
  return (
    <section className="page-intro">
      <PageHeading eyebrow={eyebrow} title={title} copy={settings.aboutStory ?? copy} />
      <div className="timeline">
        <div><b>2026</b><span>{settings.timeline2026 ?? 'Urban Life Co. begins shaping a lifestyle ecosystem around community, outdoors and connection.'}</span></div>
        <div><b>Now</b><span>{settings.timelineNow ?? 'Urban Hikers grows as an experience-led community under the Urban Life Co. umbrella.'}</span></div>
        <div><b>Next</b><span>{settings.timelineNext ?? 'More experiences, more people, more places and more ways to connect.'}</span></div>
      </div>
    </section>
  );
}
function Empty({ text }: { text: string }) {
  return (
    <div className="empty">
      <CalendarDays size={22} />
      <p>{text}</p>
    </div>
  );
}
function AdminPanelV2({ user, authorised, adminError, onSignIn, onSignOut }: { user:any; authorised:boolean; adminError:string; onSignIn:()=>void; onSignOut:()=>Promise<void> }) {
  const [tab,setTab]=useState('dashboard'); const [data,setData]=useState<any>({metrics:{},events:[],stories:[],experiences:[],announcements:[],messages:[],settings:{}}); const [busy,setBusy]=useState(false); const [errorMessage,setErrorMessage]=useState(''); const [notice,setNotice]=useState('');
  const load=async()=>{if(!authorised)return;setBusy(true);setErrorMessage('');try{const [dash,events,stories,experiences,announcements,messages,settings]=await Promise.all([api.get('/api/admin/dashboard'),api.get('/api/admin/events'),api.get('/api/admin/stories'),api.get('/api/admin/experiences'),api.get('/api/admin/announcements'),api.get('/api/admin/messages'),api.get('/api/admin/settings')]);setData({...dash.data,events:events.data,stories:stories.data,experiences:experiences.data,announcements:announcements.data,messages:messages.data,settings:settings.data});setNotice('')}catch{setErrorMessage('The CMS could not load its data. Use Sync now or sign in again.')}finally{setBusy(false)}};
  useEffect(()=>{void load()},[authorised]);
  if(!user||!authorised)return <section className="admin-shell admin-signin-shell"><div className="admin-signin"><div className="admin-signin-mark"><span>UL</span></div><p className="dashboard-eyebrow">PRIVATE CONTROL CENTRE</p><h1>Urban Life Co.</h1><p>Sign in to access the administration workspace.</p>{adminError&&<div className="admin-error" role="alert">{adminError}</div>}<button className="button dark" onClick={user?onSignOut:onSignIn}>{user?'Try another account':'Sign in'}</button></div></section>;
  const tabs=[['dashboard','Overview'],['events','Events'],['experiences','Experiences'],['stories','Journal'],['announcements','Announcements'],['messages','Messages'],['media','Media'],['pages','Site content']];
  return <section className="cms-app-shell"><aside className="cms-sidebar"><div className="cms-sidebar-top"><div className="cms-brand"><strong>URBAN LIFE CO.</strong><span>CONTROL CENTRE</span></div><nav className="cms-nav">{tabs.map(([key,label])=><button key={key} className={tab===key?'active':''} onClick={()=>{setTab(key);setNotice('');setErrorMessage('')}}>{label}</button>)}</nav></div><div className="cms-sidebar-bottom"><span>SUPER ADMIN</span><strong>Administrator session</strong><button onClick={()=>void onSignOut()}>Sign out</button></div></aside><div className="cms-workspace"><div className="cms-workspace-mobile-bar"><strong>URBAN LIFE CO.</strong><button onClick={()=>void load()} disabled={busy}>{busy?'Syncing…':'Sync'}</button></div><main className="cms-main">{errorMessage&&<div className="photos-error" role="alert">{errorMessage}</div>}{notice&&<div className="admin-notice" role="status">{notice}</div>}{tab==='dashboard'&&<DashboardView data={data} onOpen={setTab} onRefresh={load}/>} {tab==='events'&&<EventsManagerV2 items={data.events} reload={load} setNotice={setNotice} setError={setErrorMessage}/>} {tab==='experiences'&&<ExperiencesManagerV2 items={data.experiences} reload={load} setNotice={setNotice} setError={setErrorMessage}/>} {tab==='stories'&&<StoriesManagerV2 items={data.stories} reload={load} setNotice={setNotice} setError={setErrorMessage}/>} {tab==='announcements'&&<AnnouncementsManagerV2 items={data.announcements} reload={load} setNotice={setNotice} setError={setErrorMessage}/>} {tab==='messages'&&<MessagesManagerV2 items={data.messages} reload={load} setNotice={setNotice} setError={setErrorMessage}/>} {tab==='media'&&<MediaManagerV2 reload={load} events={data.events}/>} {tab==='pages'&&<SiteSettingsManager settings={data.settings??{}} reload={load}/>}</main></div></section>;
}
function CmsImageField({ label, value, onUploaded, hint='PNG, JPG or WebP · up to 6 MB' }: { label:string; value?:string; onUploaded:(path:string,url?:string)=>void; hint?:string }) { const [busy,setBusy]=useState(false); const [error,setError]=useState(''); const upload=async(file:File)=>{if(!file.type.startsWith('image/')){setError('Choose an image file.');return;}if(file.size>6*1024*1024){setError('Choose an image under 6 MB.');return;}setBusy(true);setError('');try{const reader=new FileReader();const base64=await new Promise<string>((resolve,reject)=>{reader.onload=()=>resolve(String(reader.result).split(',')[1]??'');reader.onerror=()=>reject(new Error('read'));reader.readAsDataURL(file);});const {data}=await api.post('/api/admin/media/upload',{name:file.name,contentType:file.type,base64});const media=await api.get('/api/media');const item=(media.data.media??[]).find((m:any)=>m.id===data.id);onUploaded(data.path,item?.url);}catch{setError('Upload failed. Please try again.');}finally{setBusy(false);}};return <div className="cms-image-field"><div className="field-label">{label}</div><label className="image-dropzone">{value?<img src={value} alt="Selected"/>:<div className="image-placeholder"><ImagePlus size={22}/><strong>{busy?'Uploading…':'Choose an image'}</strong><span>{hint}</span></div>}<input type="file" accept="image/*" disabled={busy} onChange={e=>{const f=e.target.files?.[0];if(f)void upload(f);e.currentTarget.value='';}}/></label>{error&&<div className="field-error">{error}</div>}</div>; }
function EventsManagerV2({items,reload,setNotice,setError}:{items:any[];reload:()=>Promise<void>;setNotice:(x:string)=>void;setError:(x:string)=>void}) { const empty={title:'',date:'',time:'',location:'',category:'Urban Hikers',experience:'Urban Hikers',status:'draft',price:'',description:'',image:'',imagePath:'',registrationLink:'',capacity:''}; const [form,setForm]=useState<any>(empty); const [editing,setEditing]=useState<string|null>(null); const [saving,setSaving]=useState(false); const save=async()=>{if(!form.title||!form.date||!form.location||!form.description){setError('Title, date, location and description are required.');return;}setSaving(true);setError('');setNotice('');try{const payload={...form,capacity:form.capacity?Number(form.capacity):undefined};if(editing)await api.put(`/api/admin/events/${editing}`,payload);else await api.post('/api/admin/events',payload);setForm(empty);setEditing(null);setNotice('Event saved successfully.');await reload();}catch{setError('Event could not be saved. Nothing was changed.');}finally{setSaving(false);}};return <ManagerLayout title="Events" description="Create, edit, publish and archive events."><div className="editor-toolbar"><div><span className="toolbar-kicker">EVENT BUILDER</span><h3>{editing?'Edit event':'New event'}</h3><p>Give the experience a clear story, place and visual identity.</p></div><div className="status-selector"><span>Status</span><select value={form.status} onChange={e=>setForm({...form,status:e.target.value})}><option>draft</option><option>published</option><option>upcoming</option><option>ongoing</option><option>completed</option><option>cancelled</option><option>postponed</option></select></div></div><div className="editor-grid"><div className="editor-main"><section className="editor-card"><div className="card-title"><span>01</span><div><h4>Event details</h4><p>Core information shown on the public event page.</p></div></div><div className="cms-form-grid modern-form"><label className="full">Event title<input value={form.title??''} placeholder="e.g. Freedom Hike — A Hike for Independence" onChange={e=>setForm({...form,title:e.target.value})}/></label><label>Experience<select value={form.experience??'Urban Hikers'} onChange={e=>setForm({...form,experience:e.target.value,category:e.target.value})}><option>Urban Hikers</option><option>Urban Fitness</option><option>Urban Connect</option><option>Urban Life Co.</option></select></label><label>Category<input value={form.category??''} placeholder="Outdoor" onChange={e=>setForm({...form,category:e.target.value})}/></label><label>Date<input type="date" value={form.date??''} onChange={e=>setForm({...form,date:e.target.value})}/></label><label>Time<input type="time" value={form.time??''} onChange={e=>setForm({...form,time:e.target.value})}/></label><label className="full">Location<input value={form.location??''} placeholder="Choose a location" onChange={e=>setForm({...form,location:e.target.value})}/></label><label>Price<input value={form.price??''} placeholder="₦2,500" onChange={e=>setForm({...form,price:e.target.value})}/></label><label>Capacity<input type="number" min="1" value={form.capacity??''} placeholder="30" onChange={e=>setForm({...form,capacity:e.target.value})}/></label><label className="full">Registration link<input type="url" value={form.registrationLink??''} placeholder="https://…" onChange={e=>setForm({...form,registrationLink:e.target.value})}/></label><label className="full">Description<textarea rows={7} value={form.description??''} placeholder="Tell people what this experience is about…" onChange={e=>setForm({...form,description:e.target.value})}/></label></div></section><section className="editor-card"><div className="card-title"><span>02</span><div><h4>Visual identity</h4><p>Use a real image instead of pasting an image URL.</p></div></div><CmsImageField label="Cover image" value={form.image || form.imagePreview} onUploaded={(path,url)=>setForm({...form,image:url||form.image,imagePath:path})}/></section></div><aside className="editor-side"><section className="preview-card"><div className="preview-label">LIVE PREVIEW</div><div className="preview-image" style={form.image?{backgroundImage:`url(${form.image})`}:undefined}><span>{form.category||'EVENT'}</span></div><div className="preview-copy"><small>{form.date||'DATE'} {form.time&&`· ${form.time}`}</small><h3>{form.title||'Your event title'}</h3><p>{form.location||'Your location'} {form.price&&`· ${form.price}`}</p></div></section><section className="check-card"><div className="preview-label">READINESS</div>{[['Title',!!form.title],['Date & time',!!form.date&&!!form.time],['Location',!!form.location],['Description',!!form.description],['Cover image',!!(form.image||form.imagePath)]].map(([label,ok])=><div className="check-row" key={label as string}><span className={ok?'check-ok':'check-empty'}>{ok?'✓':'—'}</span><span>{label as string}</span></div>)}</section></aside></div><div className="editor-footer"><button className="button ghost" onClick={()=>{setEditing(null);setForm(empty)}}>{editing?'Cancel':'Clear'}</button><button className="button dark" disabled={saving} onClick={save}>{saving?'Saving…':editing?'Save changes':'Save event'}</button><button className="button accent" disabled={saving||!form.title||!form.date||!form.location||!form.description} onClick={async()=>{const next={...form,status:'published'};setForm(next);setTimeout(()=>void save(),0)}}>Save & publish</button></div><section className="records-card"><div className="records-head"><div><span className="toolbar-kicker">EVENT LIBRARY</span><h3>Published & draft events</h3></div><span>{items.length} total</span></div><ListTable items={items} columns={['title','date','status','experience']} onEdit={x=>{setEditing(x.id);setForm({...x});setNotice('Editing event.')}} onArchive={async x=>{try{await api.delete(`/api/admin/events/${x.id}`);setNotice('Event archived.');await reload();}catch{setError('Event could not be archived.')}}}/></section></ManagerLayout>; }
function ExperiencesManagerV2({items,reload,setNotice,setError}:{items:any[];reload:()=>Promise<void>;setNotice:(x:string)=>void;setError:(x:string)=>void}) { const blank={name:'',category:'',description:'',coverImage:'',coverImagePath:'',status:'published',featured:false}; const [form,setForm]=useState<any>(blank);const [editing,setEditing]=useState<any>(null);const [saving,setSaving]=useState(false);const save=async()=>{if(!form.name||!form.description){setError('Name and description are required.');return;}setSaving(true);setError('');try{if(editing)await api.put(`/api/admin/experiences/${editing.id}`,form);else await api.post('/api/admin/experiences',form);setEditing(null);setForm(blank);setNotice('Experience saved successfully.');await reload();}catch{setError('Experience could not be saved.');}finally{setSaving(false);}};return <ManagerLayout title="Experiences" description="Manage the communities and experiences under Urban Life Co."><div className="editor-card"><div className="card-title"><span>01</span><div><h4>Experience identity</h4><p>Define the community and how it appears publicly.</p></div></div><div className="cms-form-grid modern-form"><label>Name<input value={form.name} placeholder="Urban Hikers" onChange={e=>setForm({...form,name:e.target.value})}/></label><label>Category<input value={form.category} placeholder="Outdoor lifestyle" onChange={e=>setForm({...form,category:e.target.value})}/></label><label>Status<select value={form.status} onChange={e=>setForm({...form,status:e.target.value})}><option>draft</option><option>published</option><option>archived</option></select></label><label className="full">Description<textarea rows={6} value={form.description} placeholder="Describe the experience…" onChange={e=>setForm({...form,description:e.target.value})}/></label></div><CmsImageField label="Cover image" value={form.coverImage} onUploaded={(path,url)=>setForm({...form,coverImage:url||form.coverImage,coverImagePath:path})}/></div><div className="editor-footer"><button className="button ghost" onClick={()=>{setEditing(null);setForm(blank)}}>{editing?'Cancel':'Clear'}</button><button className="button dark" disabled={saving} onClick={save}>{saving?'Saving…':editing?'Save changes':'Create experience'}</button></div><section className="records-card"><div className="records-head"><div><span className="toolbar-kicker">EXPERIENCE LIBRARY</span><h3>Communities & experiences</h3></div><span>{items.length} total</span></div><ListTable items={items} columns={['name','category','status']} onEdit={x=>{setEditing(x);setForm({...x});setNotice('Editing experience.')}} onArchive={async x=>{try{await api.delete(`/api/admin/experiences/${x.id}`);setNotice('Experience archived.');await reload();}catch{setError('Experience could not be archived.')}}}/></section></ManagerLayout>; }
function StoriesManagerV2({items,reload,setNotice,setError}:{items:any[];reload:()=>Promise<void>;setNotice:(x:string)=>void;setError:(x:string)=>void}) { const blank={title:'',category:'',date:'',excerpt:'',content:'',coverImage:'',coverImagePath:'',status:'draft',featured:false};const [form,setForm]=useState<any>(blank);const [editing,setEditing]=useState<any>(null);const [saving,setSaving]=useState(false);const save=async()=>{if(!form.title||!form.date||!form.excerpt||!form.content){setError('Title, date, excerpt and story content are required.');return;}setSaving(true);setError('');try{if(editing)await api.put(`/api/admin/stories/${editing.id}`,form);else await api.post('/api/admin/stories',form);setEditing(null);setForm(blank);setNotice('Journal story saved successfully.');await reload();}catch{setError('Journal story could not be saved.');}finally{setSaving(false);}};return <ManagerLayout title="Journal" description="Draft, publish, feature and archive stories."><div className="editor-card"><div className="card-title"><span>01</span><div><h4>Story details</h4><p>Build a polished editorial entry for the Urban Life archive.</p></div></div><div className="cms-form-grid modern-form"><label className="full">Title<input value={form.title} placeholder="Story title" onChange={e=>setForm({...form,title:e.target.value})}/></label><label>Category<input value={form.category} placeholder="Community" onChange={e=>setForm({...form,category:e.target.value})}/></label><label>Date<input type="date" value={form.date} onChange={e=>setForm({...form,date:e.target.value})}/></label><label>Status<select value={form.status} onChange={e=>setForm({...form,status:e.target.value})}><option>draft</option><option>published</option><option>archived</option></select></label><label className="full">Excerpt<textarea rows={3} value={form.excerpt} placeholder="Short editorial introduction…" onChange={e=>setForm({...form,excerpt:e.target.value})}/></label><label className="full">Story content<textarea rows={10} value={form.content} placeholder="Write the story…" onChange={e=>setForm({...form,content:e.target.value})}/></label></div><CmsImageField label="Cover image" value={form.coverImage} onUploaded={(path,url)=>setForm({...form,coverImage:url||form.coverImage,coverImagePath:path})}/></div><div className="editor-footer"><button className="button ghost" onClick={()=>{setEditing(null);setForm(blank)}}>{editing?'Cancel':'Clear'}</button><button className="button dark" disabled={saving} onClick={save}>{saving?'Saving…':editing?'Save changes':'Create story'}</button></div><section className="records-card"><div className="records-head"><div><span className="toolbar-kicker">EDITORIAL ARCHIVE</span><h3>Stories</h3></div><span>{items.length} total</span></div><ListTable items={items} columns={['title','date','status']} onEdit={x=>{setEditing(x);setForm({...x});setNotice('Editing story.')}} onArchive={async x=>{try{await api.delete(`/api/admin/stories/${x.id}`);setNotice('Story archived.');await reload();}catch{setError('Story could not be archived.')}}}/></section></ManagerLayout>; }
function AnnouncementsManagerV2({items,reload,setNotice,setError}:{items:any[];reload:()=>Promise<void>;setNotice:(x:string)=>void;setError:(x:string)=>void}) { const blank={title:'',body:'',status:'draft',startAt:'',expiresAt:'',priority:'normal'};const [form,setForm]=useState<any>(blank);const [editing,setEditing]=useState<any>(null);const [saving,setSaving]=useState(false);const save=async()=>{if(!form.title||!form.body){setError('Headline and message are required.');return;}if(form.startAt&&form.expiresAt&&new Date(form.expiresAt)<=new Date(form.startAt)){setError('Expiry must be after the start date.');return;}setSaving(true);setError('');try{if(editing)await api.put(`/api/admin/announcements/${editing.id}`,form);else await api.post('/api/admin/announcements',form);setEditing(null);setForm(blank);setNotice('Announcement saved successfully.');await reload();}catch{setError('Announcement could not be saved.');}finally{setSaving(false);}};return <ManagerLayout title="Announcements" description="Publish, schedule and expire timely messages."><div className="cms-form-grid"><label>Headline<input value={form.title} onChange={e=>setForm({...form,title:e.target.value})}/></label><label>Priority<select value={form.priority} onChange={e=>setForm({...form,priority:e.target.value})}><option>normal</option><option>high</option></select></label><label>Status<select value={form.status} onChange={e=>setForm({...form,status:e.target.value})}><option>draft</option><option>published</option><option>archived</option></select></label><label>Start<input type="datetime-local" value={form.startAt} onChange={e=>setForm({...form,startAt:e.target.value})}/></label><label>Expires<input type="datetime-local" value={form.expiresAt} onChange={e=>setForm({...form,expiresAt:e.target.value})}/></label><label className="full">Message<textarea rows={4} value={form.body} onChange={e=>setForm({...form,body:e.target.value})}/></label></div><div className="cms-actions"><button className="button dark" disabled={saving} onClick={save}>{saving?'Saving…':editing?'Save changes':'Create announcement'}</button>{editing&&<button className="button ghost" onClick={()=>{setEditing(null);setForm(blank)}}>Cancel</button>}</div><ListTable items={items} columns={['title','priority','status']} onEdit={x=>{setEditing(x);setForm({...x});setNotice('Editing announcement. Make changes and save.')}} onArchive={async x=>{try{await api.delete(`/api/admin/announcements/${x.id}`);setNotice('Announcement archived.');await reload();}catch{setError('Announcement could not be archived.')}}}/></ManagerLayout>; }
function MessagesManagerV2({items,reload,setNotice,setError}:{items:any[];reload:()=>Promise<void>;setNotice:(x:string)=>void;setError:(x:string)=>void}) { const update=async(x:any)=>{try{await api.put(`/api/admin/messages/${x.id}`,{status:x.status==='new'?'read':'resolved'});setNotice(x.status==='new'?'Message marked read.':'Message resolved.');await reload();}catch{setError('Message status could not be updated.')}};return <ManagerLayout title="Messages" description="Manage partnership, event and community enquiries."><ListTable items={items} columns={['name','email','type','status','createdAt']} onEdit={update} actionLabel="Update status"/></ManagerLayout>; }
function DashboardView({data,onOpen,onRefresh}:{data:any;onOpen:(tab:string)=>void;onRefresh:()=>Promise<void>}) {
  const m=data.metrics??{},events=data.events??[],stories=data.stories??[],messages=data.messages??[],experiences=data.experiences??[],now=new Date(); const upcoming=events.filter((e:any)=>e.status!=='archived'&&e.status!=='cancelled'&&e.status!=='postponed'&&new Date(e.date)>=now).sort((a:any,b:any)=>new Date(a.date).getTime()-new Date(b.date).getTime()).slice(0,4); const published=events.filter((x:any)=>x.status==='published').length+stories.filter((x:any)=>x.status==='published').length+(data.announcements??[]).filter((x:any)=>x.status==='published').length; const activity=[...events.map((x:any)=>({id:'e'+x.id,title:x.title+' was updated',detail:'Event content is ready for the public calendar.',date:x.updatedAt??x.createdAt??x.date,tab:'events'})),...stories.map((x:any)=>({id:'s'+x.id,title:'Journal post “'+x.title+'” was updated',detail:'Editorial content is part of the live archive.',date:x.updatedAt??x.createdAt??x.date,tab:'stories'})),...messages.map((x:any)=>({id:'m'+x.id,title:(x.name??'A visitor')+' sent a message',detail:x.type??'Community enquiry',date:x.updatedAt??x.createdAt,tab:'messages'})),...experiences.map((x:any)=>({id:'x'+x.id,title:'Experience “'+x.name+'” was updated',detail:x.category??'Experience',date:x.updatedAt??x.createdAt,tab:'experiences'}))].filter(x=>x.date).sort((a:any,b:any)=>new Date(b.date).getTime()-new Date(a.date).getTime()).slice(0,5); const today=new Intl.DateTimeFormat('en-NG',{weekday:'long',day:'numeric',month:'long',year:'numeric'}).format(now); const cards=[['Published events',m.publishedEvents??0,upcoming.length+' upcoming','events'],['Upcoming events',upcoming.length,'Next on the calendar','events'],['Unread messages',m.newMessages??0,'Community inbox','messages'],['Journal entries',m.stories??0,published+' published content items','stories']];
  return <div className="dashboard-view"><div className="dashboard-greeting"><div><p className="dashboard-eyebrow">OVERVIEW</p><h2>Welcome back.</h2><p>Here is the state of the Urban Life community today, {today}.</p></div><button className="dashboard-create" onClick={()=>onOpen('events')}><span>+</span>Create event</button></div><section className="dashboard-card analytics-card"><div className="dashboard-section-head"><div><h3>Analytics summary</h3><p>Richer signals, clearer trends, and a more editorial flow.</p></div><button className="dashboard-chip" onClick={()=>void onRefresh()}>Sync now</button></div><div className="analytics-grid">{cards.map(([label,value,note,tab])=><button key={label as string} className="analytics-tile" onClick={()=>onOpen(tab as string)}><div className="analytics-top"><span>{label as string}</span><b>{value as any}</b></div><div className="analytics-bottom"><span>{note as string}</span><span className="analytics-trend">↗</span></div></button>)}</div></section><section className="dashboard-card upcoming-card"><div className="dashboard-section-head"><div><h3>Upcoming events</h3><p>The next experiences your team has published.</p></div><button className="dashboard-chip" onClick={()=>onOpen('events')}>Manage all events <ChevronRight size={13}/></button></div><div className="event-feed">{upcoming.length?upcoming.map((event:any)=>{const capacity=Number(event.capacity??0);const width=capacity?Math.min(100,Math.max(8,100-Math.min(capacity,100))):18;return <button className="event-feed-row" key={event.id} onClick={()=>onOpen('events')}><div className="event-thumb">{event.image?<img src={event.image} alt="" />:<span>UL</span>}</div><div className="event-feed-main"><div className="event-feed-title"><b>{event.title}</b><span className={'status-pill '+event.status}>{String(event.status??'upcoming').toUpperCase()}</span></div><div className="event-feed-meta">{formatDate(event.date)}{event.time?' · '+event.time:''}<i/> {event.experience??event.category??'Urban Life Co.'}</div><div className="event-capacity"><span>Capacity</span><div><i style={{width:String(width)+'%'}}/></div><small>{capacity?String(capacity)+' spots':'Capacity not set'}</small></div></div><ChevronRight size={16}/></button>;}):<Empty text="No upcoming events published yet."/>}</div></section><section className="dashboard-card pulse-card"><div className="dashboard-section-head"><div><h3>Community Pulse</h3><p>A quick snapshot of engagement, responsiveness, and publishing momentum.</p></div><span className="dashboard-chip">Live data</span></div><div className="pulse-grid"><button onClick={()=>onOpen('events')}><span>Event pipeline</span><strong>{events.length}</strong><p>Total events currently in the CMS.</p></button><button onClick={()=>onOpen('messages')}><span>Open messages</span><strong>{m.newMessages??0}</strong><p>New enquiries waiting for a team response.</p></button><button onClick={()=>onOpen('stories')}><span>Content published</span><strong>{published}</strong><p>Events, journal posts and announcements currently live.</p></button></div></section><section className="dashboard-card activity-card"><div className="dashboard-section-head"><div><h3>Recent Activity</h3><p>A cleaner, more scannable feed of the latest CMS changes.</p></div><span className="dashboard-chip">Latest</span></div><div className="activity-feed">{activity.length?activity.map(item=><button key={item.id} className="activity-row" onClick={()=>onOpen(item.tab)}><i/><div><div><b>{item.title}</b><span>{item.date?formatDate(String(item.date)):'Recently'}</span></div><p>{item.detail}</p></div><ChevronRight size={14}/></button>):<Empty text="No recent activity yet."/>}</div></section><div className="quick-actions"><button onClick={()=>onOpen('announcements')}><span><Megaphone size={16}/></span><div><b>Compose Announcement</b><small>Broadcast to community</small></div><ChevronRight size={14}/></button><button onClick={()=>onOpen('messages')}><span><ShieldCheck size={16}/></span><div><b>View Messages</b><small>Respond to enquiries</small></div><ChevronRight size={14}/></button><button onClick={()=>onOpen('pages')}><span><Sparkles size={16}/></span><div><b>Manage Site Settings</b><small>Configure public content</small></div><ChevronRight size={14}/></button></div></div>;
}
function SiteSettingsManager({settings,reload}:{settings:any;reload:()=>Promise<void>}) { const [form,setForm]=useState<any>(settings); useEffect(()=>setForm(settings),[settings]); const [saving,setSaving]=useState(false); const [message,setMessage]=useState(''); const save=async()=>{setSaving(true);setMessage('');try{await api.put('/api/admin/settings',form);await reload();setMessage('Site content saved.');}catch{setMessage('Could not save site content.');}finally{setSaving(false);}}; return <ManagerLayout title="Site content" description="Control the core homepage messaging without editing code."><div className="cms-form-grid"><label>Hero eyebrow<input value={form.heroEyebrow??''} onChange={e=>setForm({...form,heroEyebrow:e.target.value})}/></label><label>Hero title<input value={form.heroTitle??''} onChange={e=>setForm({...form,heroTitle:e.target.value})}/></label><label className="full">Hero copy<textarea rows={4} value={form.heroCopy??''} onChange={e=>setForm({...form,heroCopy:e.target.value})}/></label><label className="full">Community headline<input value={form.communityHeadline??''} onChange={e=>setForm({...form,communityHeadline:e.target.value})}/></label><label className="full">Community copy<textarea rows={4} value={form.communityCopy??''} onChange={e=>setForm({...form,communityCopy:e.target.value})}/></label><label className="full">About story<textarea rows={5} value={form.aboutStory??''} onChange={e=>setForm({...form,aboutStory:e.target.value})}/></label><label>Timeline 2026<input value={form.timeline2026??''} onChange={e=>setForm({...form,timeline2026:e.target.value})}/></label><label>Timeline now<input value={form.timelineNow??''} onChange={e=>setForm({...form,timelineNow:e.target.value})}/></label><label>Timeline next<input value={form.timelineNext??''} onChange={e=>setForm({...form,timelineNext:e.target.value})}/></label></div><div className="cms-actions"><button className="button dark" disabled={saving} onClick={save}>{saving?'Saving…':'Save site content'}</button>{message&&<span>{message}</span>}</div></ManagerLayout>; }
function ManagerLayout({title,description,children}:{title:string;description:string;children:React.ReactNode}) { return <div><div className="cms-heading"><div><p className="eyebrow">CMS</p><h2>{title}</h2><p>{description}</p></div></div>{children}</div>; }
function ListTable({items,columns,onEdit,onArchive,actionLabel='Edit'}:{items:any[];columns:string[];onEdit:(x:any)=>void;onArchive?:(x:any)=>void;actionLabel?:string}) { return <div className="cms-table">{items.map(x=><div className="cms-row" key={x.id}><div className="cms-row-main">{columns.map(c=><span key={c}><b>{c===columns[0]?String(x[c]??'Untitled'):''}</b>{c!==columns[0]&&String(x[c]??'')}</span>)}</div><div className="cms-row-actions"><button onClick={()=>onEdit(x)}>{actionLabel}</button>{onArchive&&<button onClick={()=>onArchive(x)}>Archive</button>}</div></div>)}{!items.length&&<Empty text="Nothing here yet."/>}</div>; }

function MediaManagerV2({reload,events}:{reload:()=>Promise<void>;events:any[]}) {
  const [items,setItems]=useState<any[]>([]);
  const [selected,setSelected]=useState<any|null>(null);
  const [query,setQuery]=useState('');
  const [uploading,setUploading]=useState(false);
  const [uploadError,setUploadError]=useState('');
  const load=()=>api.get('/api/media').then(r=>{const next=r.data.media??[];setItems(next);if(selected)setSelected(next.find((x:any)=>x.id===selected.id)||null);});
  useEffect(()=>{void load()},[]);
  const filtered=useMemo(()=>items.filter(x=>(String(x.caption||'')+' '+String(x.experience||'')+' '+String(x.name||'')).toLowerCase().includes(query.toLowerCase())),[items,query]);
  const upload=async(file:File)=>{if(!file.type.startsWith('image/')){setUploadError('Please choose an image file.');return;}if(file.size>6*1024*1024){setUploadError('Please choose an image under 6 MB.');return;}setUploading(true);setUploadError('');try{const reader=new FileReader();const base64=await new Promise<string>((resolve,reject)=>{reader.onload=()=>resolve(String(reader.result).split(',')[1]??'');reader.onerror=()=>reject(new Error('read'));reader.readAsDataURL(file);});await api.post('/api/admin/media/upload',{name:file.name,contentType:file.type,base64});await load();}catch{setUploadError('Image upload failed. Please try again.');}finally{setUploading(false);}};
  const remove=async(item:any)=>{if(!window.confirm('Remove this media item?'))return;try{await api.delete('/api/admin/media/'+item.id);setSelected(null);await load();await reload();}catch{setUploadError('The media item could not be removed.');}};
  const copyUrl=async(url:string)=>{try{await navigator.clipboard.writeText(url);setUploadError('Asset URL copied to clipboard.');}catch{setUploadError('Could not copy the asset URL.');}};
  return <ManagerLayout title="Media library" description="A visual archive for covers, galleries and campaign assets."><GooglePhotosPanel events={events}/><div className="media-toolbar"><div className="library-search"><SearchIcon size={15}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search media"/></div><label className="button dark media-upload-button"><ImageIcon size={15}/>{uploading?'Uploading…':'Upload media'}<input type="file" accept="image/*" disabled={uploading} onChange={e=>{const file=e.target.files?.[0];if(file)void upload(file);e.currentTarget.value='';}}/></label></div>{uploadError&&<div className="photos-error" role="alert">{uploadError}</div>}<div className="media-library-layout"><section className="media-library-grid">{filtered.map(item=><button className={'media-asset-card '+(selected?.id===item.id?'selected':'')} key={item.id} onClick={()=>setSelected(item)}><div className="media-asset-image">{item.url?<img src={item.url} alt={item.caption||''}/>:<ImageIcon size={22}/>}</div><div className="media-asset-meta"><b>{item.caption||item.name||'Untitled asset'}</b><span>{item.experience||'Urban Life Co.'}</span></div></button>)}{!filtered.length&&<div className="cms-empty-state compact"><ImageIcon size={20}/><h3>No media found</h3><p>Upload an image or import event photography from Google Photos.</p></div>}</section>{selected&&<aside className="asset-detail-card"><div className="asset-detail-head"><div><span className="toolbar-kicker">ASSET DETAILS</span><h3>{selected.caption||selected.name||'Untitled asset'}</h3></div><button onClick={()=>setSelected(null)} aria-label="Close"><MoreHorizontal size={17}/></button></div><div className="asset-detail-image">{selected.url&&<img src={selected.url} alt=""/>}</div><dl><div><dt>Type</dt><dd>{selected.contentType||'Image'}</dd></div><div><dt>Experience</dt><dd>{selected.experience||'Urban Life Co.'}</dd></div><div><dt>Uploaded</dt><dd>{selected.createdAt?formatDate(selected.createdAt):'—'}</dd></div><div><dt>File</dt><dd>{selected.name||selected.path||'—'}</dd></div></dl><div className="asset-detail-actions"><button className="button ghost" onClick={()=>void copyUrl(selected.url)}><Copy size={14}/> Copy URL</button><button className="button danger" onClick={()=>void remove(selected)}><Trash2 size={14}/> Remove</button></div></aside>}</div></ManagerLayout>;
}

function GooglePhotosPanel({events}:{events:any[]}) {
  const [config, setConfig] = useState<{ configured: boolean; clientId?: string; scope?: string } | null>(null);
  const [accessToken, setAccessToken] = useState('');
  const [session, setSession] = useState<{ sessionId: string; pickerUri: string } | null>(null);
  const [target, setTarget] = useState({ eventId: '', experience: 'Urban Hikers' });
  const [message, setMessage] = useState('');

  useEffect(() => {
    api.get('/api/admin/google-photos/config').then(({ data }) => setConfig(data)).catch(() => setMessage('Unable to load Google Photos configuration.'));
  }, []);

  const authorize = () => {
    const googleApi = (window as any).google;
    if (!config?.configured || !config.clientId) {
      setMessage('Google Photos is not configured. Add GOOGLE_PHOTOS_CLIENT_ID to AppDeploy secrets first.');
      return;
    }
    if (!googleApi?.accounts?.oauth2) {
      setMessage('Google authorization is still loading. Please try again in a moment.');
      return;
    }
    const client = googleApi.accounts.oauth2.initTokenClient({
      client_id: config.clientId,
      scope: config.scope,
      include_granted_scopes: true,
      callback: (response: any) => {
        if (response?.access_token) {
          setAccessToken(response.access_token);
          setMessage('Google Photos connected for this Super Admin session.');
        } else {
          setMessage('Google Photos authorization was not completed.');
        }
      },
      error_callback: (error: any) => { const code = String(error?.type ?? error?.error ?? '').toLowerCase(); setMessage(code.includes('invalid_client') ? 'Google rejected this OAuth client. Check that the Client ID is a Web application credential, still exists, and has this site registered under Authorized JavaScript origins.' : 'Google Photos authorization could not be opened. Please check the OAuth client configuration.'); },
    });
    client.requestAccessToken({ prompt: 'consent' });
  };

  const startPicker = async () => {
    if (!accessToken) {
      authorize();
      return;
    }
    // Open the window synchronously from the click so popup blockers do not silently kill the Picker.
    const pickerWindow = window.open('about:blank', '_blank');
    try {
      const { data } = await api.post('/api/admin/google-photos/session', { accessToken, ...target, maxItemCount: 30 });
      setSession(data);
      if (pickerWindow) pickerWindow.location.href = data.pickerUri;
      else setMessage('Your browser blocked the Google Photos window. Allow pop-ups for this site and try again.');
      setMessage('Select photos in Google Photos. This page will detect when you finish.');
    } catch (error: any) {
      pickerWindow?.close();
      const detail = error?.message ? ` ${error.message}` : '';
      setMessage(`Could not start the Google Photos Picker.${detail}`);
    }
  };

  useEffect(() => {
    if (!session || !accessToken) return;
    let stopped = false;
    const poll = async () => {
      if (stopped) return;
      try {
        const { data } = await api.post(`/api/admin/google-photos/session/${session.sessionId}/status`, { accessToken });
        if (data.mediaItemsSet) {
          setMessage('Selection complete. Importing photos into the Urban Life media library…');
          const result = await api.post(`/api/admin/google-photos/import/${session.sessionId}`, { accessToken });
          const imported = Number(result.data?.imported ?? 0);
          const skipped = Number(result.data?.skipped ?? 0);
          setMessage(imported ? `${imported} photo${imported === 1 ? '' : 's'} imported successfully${skipped ? ` · ${skipped} skipped` : ''}.` : 'Google Photos returned no importable images. Select photos again and retry.');
          setSession(null);
          return;
        }
      } catch (error: any) {
        const detail = error?.message ? ` ${error.message}` : '';
        setMessage(`The Google Photos selection session expired or needs to be restarted.${detail}`);
        setSession(null);
        return;
      }
      window.setTimeout(poll, 3500);
    };
    poll();
    return () => { stopped = true; };
  }, [session, accessToken]);

  return (
    <article className="admin-card photos-card">
      <div className="admin-icon"><Link2 /></div>
      <div className="photos-card-heading"><div><span className="photos-kicker">MEDIA SOURCE</span><h3>Google Photos</h3></div><span className={accessToken ? 'connected-badge' : 'disconnected-badge'}>{accessToken ? 'Connected' : 'Not connected'}</span></div>
      <p>Select event photography directly from Google Photos and import the approved images into the Urban Life media library. The Google access token stays in this browser session and is never stored by Urban Life Co.</p>
      {!accessToken ? <div className="photos-connect-state"><div><strong>{config?.configured ? 'Connect your photo library' : 'Google Photos needs one-time setup'}</strong><p>{config?.configured ? 'Authorise this Super Admin session, then choose the event and photos you want to bring into Urban Life.' : 'The Connect button is ready, but the Google OAuth client is not yet configured in AppDeploy.'}</p></div><button className="button dark" onClick={authorize}><Link2 size={16} /> Connect Google Photos</button>{!config?.configured && <small>Admin setup: add <code>GOOGLE_PHOTOS_CLIENT_ID</code> to AppDeploy secrets, then return here and connect.</small>}</div> : <div className="picker-controls"><div className="picker-fields"><label>Experience<select value={target.experience} onChange={e => setTarget(prev => ({ ...prev, experience: e.target.value }))}><option>Urban Hikers</option><option>Urban Fitness</option><option>Urban Connect</option><option>Urban Life Co.</option></select></label><label>Event (optional)<select value={target.eventId} onChange={e => setTarget(prev => ({ ...prev, eventId: e.target.value }))}><option value="">No event</option>{events.map(event=><option key={event.id} value={event.id}>{event.title}</option>)}</select></label></div><button className="button dark" onClick={startPicker}><ImagePlus size={16} /> Pick photos from Google Photos</button><p className="picker-help">Google Photos opens separately. Search for the event or album, select the photos, and tap Done. The CMS then imports the selected images.</p></div>}
      {message && <div className="photos-error">{message}</div>}
    </article>
  );
}

export default App;
