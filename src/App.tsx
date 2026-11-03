import { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  ChevronRight,
  Compass,
  Instagram,
  Menu,
  Megaphone,
  Mountain,
  Pause,
  Play,
  Search,
  Sparkles,
  X,
  ImagePlus,
  ShieldCheck,
  Link2,
  Mail,
  MessageCircle,
  Phone,
  RefreshCw,
} from 'lucide-react';
import { api, auth } from '@appdeploy/client';
import { applyPageMeta } from './seo';
import { findByRef, itemRef, parseLocation, routeToHash, type StaticPage } from './routing';

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
type ExperienceItem = {
  id: string;
  name: string;
  description: string;
  category: string;
  coverImage?: string;
  status?: string;
  featured?: boolean;
  socialLink?: string;
  website?: string;
};
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
const heroMemories = [
  {
    image: 'https://raw.githubusercontent.com/emeriem/urban-life-co/main/public/events/optimized/urban-hikers-trail-walk.jpg',
    alt: 'Urban Hikers walking together along a trail',
  },
  {
    image: 'https://raw.githubusercontent.com/emeriem/urban-life-co/main/public/events/optimized/urban-hikers-summit-group.jpg',
    alt: 'Urban Hikers celebrating together at the summit',
  },
  {
    image: 'https://raw.githubusercontent.com/emeriem/urban-life-co/main/public/events/optimized/urban-hikers-community.jpg',
    alt: 'Urban Hikers sharing a moment outdoors',
  },
  {
    image: 'https://raw.githubusercontent.com/emeriem/urban-life-co/main/public/events/optimized/urban-hikers-enugu-view.jpg',
    alt: 'Urban Hikers looking out over Enugu',
  },
];
const fieldPhotos = [
  {
    image: 'https://raw.githubusercontent.com/emeriem/urban-life-co/main/public/events/optimized/urban-hikers-ije-ugwu-hike.jpg',
    alt: 'Ije Ugwu hike event poster',
    caption: 'Ije Ugwu hike',
    type: 'poster',
  },
  {
    image: 'https://raw.githubusercontent.com/emeriem/urban-life-co/main/public/events/optimized/urban-hikers-ball-and-banter-poster.jpg',
    alt: 'Urban Hikers Ball and Banter event poster',
    caption: 'Ball and Banter',
    type: 'poster',
  },
  {
    image: 'https://raw.githubusercontent.com/emeriem/urban-life-co/main/public/events/optimized/urban-hikers-hangout-poster.jpg',
    alt: 'Urban Hikers community hangout event poster',
    caption: 'Community hangout',
    type: 'poster',
  },
  {
    image: 'https://raw.githubusercontent.com/emeriem/urban-life-co/main/public/events/optimized/urban-fitness-walk-poster.jpg',
    alt: 'Urban Fitness Walk event poster',
    caption: 'Urban Fitness Walk',
    type: 'poster',
  },
  {
    image: 'https://raw.githubusercontent.com/emeriem/urban-life-co/main/public/events/optimized/urban-hikers-story.jpg',
    alt: 'Urban Hikers story artwork',
    caption: 'Stories from the trail',
    type: 'poster',
  },
  {
    image: 'https://raw.githubusercontent.com/emeriem/urban-life-co/main/public/events/optimized/urban-hikers-trail-walk.jpg',
    alt: 'The group setting out together on a trail',
    caption: 'On the move',
    type: 'photo',
  },
  {
    image: 'https://raw.githubusercontent.com/emeriem/urban-life-co/main/public/events/optimized/urban-hikers-trail-rest.jpg',
    alt: 'Hikers taking a break together on the trail',
    caption: 'A moment to catch our breath',
    type: 'photo',
  },
  {
    image: 'https://raw.githubusercontent.com/emeriem/urban-life-co/main/public/events/optimized/urban-hikers-enugu-view.jpg',
    alt: 'The group taking in a view over Enugu',
    caption: 'Enugu from above',
    type: 'photo',
  },
  {
    image: 'https://raw.githubusercontent.com/emeriem/urban-life-co/main/public/events/optimized/urban-hikers-summit-group.jpg',
    alt: 'The Urban Hikers group at the summit',
    caption: 'Made it together',
    type: 'photo',
  },
  {
    image: 'https://raw.githubusercontent.com/emeriem/urban-life-co/main/public/events/optimized/urban-hikers-trail-pair.jpg',
    alt: 'Two hikers walking together outdoors',
    caption: 'The people make the path',
    type: 'photo',
  },
  {
    image: 'https://raw.githubusercontent.com/emeriem/urban-life-co/main/public/events/optimized/urban-hikers-hillside-group.jpg',
    alt: 'Urban Hikers gathered on a hillside',
    caption: 'A hillside gathering',
    type: 'photo',
  },
  {
    image: 'https://raw.githubusercontent.com/emeriem/urban-life-co/main/public/events/optimized/urban-hikers-city-walk.jpg',
    alt: 'The group exploring the city on foot',
    caption: 'A city walk',
    type: 'photo',
  },
  {
    image: 'https://raw.githubusercontent.com/emeriem/urban-life-co/main/public/events/optimized/urban-hikers-city-walk-2.jpg',
    alt: 'Urban Hikers walking through the neighbourhood',
    caption: 'Finding a new route',
    type: 'photo',
  },
  {
    image: 'https://raw.githubusercontent.com/emeriem/urban-life-co/main/public/events/optimized/urban-hikers-community.jpg',
    alt: 'Friends sharing the day outdoors',
    caption: 'Good company, open air',
    type: 'photo',
  },
];

function PWAControls() {
  const [online, setOnline] = useState(navigator.onLine);
  const [installPrompt, setInstallPrompt] = useState<any>(null);
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [installHelp, setInstallHelp] = useState(false);

  useEffect(() => {
    const updateConnection = () => setOnline(navigator.onLine);
    const captureInstall = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event);
    };
    const installed = () => {
      setInstallPrompt(null);
      setInstallHelp(false);
    };
    let hadController = Boolean(navigator.serviceWorker?.controller);
    const controllerChanged = () => {
      if (hadController) setUpdateAvailable(true);
      hadController = true;
    };

    window.addEventListener('online', updateConnection);
    window.addEventListener('offline', updateConnection);
    window.addEventListener('beforeinstallprompt', captureInstall);
    window.addEventListener('appinstalled', installed);
    navigator.serviceWorker?.addEventListener('controllerchange', controllerChanged);

    return () => {
      window.removeEventListener('online', updateConnection);
      window.removeEventListener('offline', updateConnection);
      window.removeEventListener('beforeinstallprompt', captureInstall);
      window.removeEventListener('appinstalled', installed);
      navigator.serviceWorker?.removeEventListener('controllerchange', controllerChanged);
    };
  }, []);

  const install = async () => {
    if (!installPrompt) {
      setInstallHelp(true);
      return;
    }
    await installPrompt.prompt();
    const result = await installPrompt.userChoice;
    if (result?.outcome === 'accepted') setInstallPrompt(null);
  };

  if (online && !installPrompt && !updateAvailable && !installHelp) return null;

  return (
    <aside className="pwa-status" aria-live="polite">
      {!online && (
        <span className="pwa-status-message">
          <span className="pwa-status-dot" /> You’re offline. Some content may be unavailable.
        </span>
      )}
      {online && installPrompt && (
        <button className="pwa-action" onClick={install}>Install Urban Life Co. <span aria-hidden="true">↗</span></button>
      )}
      {online && !installPrompt && installHelp && (
        <span className="pwa-status-message">To install, open your browser menu and choose “Add to Home Screen” or “Install app”.</span>
      )}
      {updateAvailable && (
        <button className="pwa-action" onClick={() => window.location.reload()}>Update available · Refresh <span aria-hidden="true">↻</span></button>
      )}
      {(installHelp || updateAvailable) && (
        <button className="pwa-dismiss" aria-label="Dismiss message" onClick={() => { setInstallHelp(false); setUpdateAvailable(false); }}>×</button>
      )}
    </aside>
  );
}

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
    image: 'https://raw.githubusercontent.com/emeriem/urban-life-co/main/public/events/optimized/urban-hikers-trail-walk.jpg',
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
    image: 'https://raw.githubusercontent.com/emeriem/urban-life-co/main/public/events/optimized/urban-hikers-community.jpg',
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
    image: 'https://raw.githubusercontent.com/emeriem/urban-life-co/main/public/events/optimized/urban-hikers-summit-group.jpg',
  },
];
const fallbackStories: Story[] = [
  {
    id: 's1',
    title: 'More Than a Hike. It’s a Community.',
    category: 'Community',
    date: '2026-08-28',
    coverImage: 'https://raw.githubusercontent.com/emeriem/urban-life-co/main/public/events/optimized/urban-hikers-trail-pair.jpg',
    excerpt:
      'Why the trail is only the beginning of what Urban Hikers is building.',
  },
  {
    id: 's2',
    title: 'Why We Live. Connect. Explore.',
    category: 'Urban Life Co.',
    date: '2026-08-20',
    coverImage: 'https://raw.githubusercontent.com/emeriem/urban-life-co/main/public/events/optimized/urban-hikers-hillside-group.jpg',
    excerpt: 'The three ideas at the centre of every experience we create.',
  },
  {
    id: 's3',
    title: 'The Urban Life Field Notes',
    category: 'Journal',
    date: '2026-08-10',
    coverImage: 'https://raw.githubusercontent.com/emeriem/urban-life-co/main/public/events/optimized/urban-hikers-story.jpg',
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
  const [page, setPage] = useState(() => parseLocation(window.location.hash).page);
  const [menu, setMenu] = useState(false);
  const [adminUser, setAdminUser] = useState<any>(null);
  const [adminAuthorised, setAdminAuthorised] = useState(false);
  const [adminError, setAdminError] = useState('');
  const [query, setQuery] = useState('');
  const [selectedEvent, setSelectedEvent] = useState<EventItem | null>(null);
  const [selectedExperience, setSelectedExperience] =
    useState<ExperienceItem | null>(null);
  const [selectedStory, setSelectedStory] = useState<Story | null>(null);
  const [settings, setSettings] = useState<any>({});
  const [heroSlide, setHeroSlide] = useState(0);
  const [heroPlaying, setHeroPlaying] = useState(
    () => !window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
  useEffect(() => {
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
    const updatePlayback = () => setHeroPlaying(!preference.matches);
    preference.addEventListener('change', updatePlayback);
    return () => preference.removeEventListener('change', updatePlayback);
  }, []);
  useEffect(() => {
    if (!heroPlaying) return;
    const timer = window.setInterval(() => {
      if (!document.hidden) {
        setHeroSlide(current => (current + 1) % heroMemories.length);
      }
    }, 6500);
    return () => window.clearInterval(timer);
  }, [heroPlaying]);
  useEffect(() => {
    auth
      .getUser()
      .then(async user => {
        setAdminUser(user);
        if (user && window.location.hash.startsWith('#admin'))
          try {
            await api.get('/api/admin/status');
            setAdminAuthorised(true);
            setAdminError('');
          } catch {
            setAdminAuthorised(false);
            setAdminError(
              'Wrong account. This account does not have administrator access.'
            );
          }
      })
      .catch(() => {
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
      })
      .catch(() => undefined);
  }, []);
  useEffect(() => {
    const syncRoute = () => {
      const route = parseLocation(window.location.hash);
      if ('ref' in route) {
        if (route.page === 'event') {
          const item = findByRef(events, route.ref);
          if (item) {
            setSelectedEvent(item);
            setSelectedExperience(null);
            setSelectedStory(null);
            setPage('event');
            return;
          }
        }
        if (route.page === 'experience') {
          const item = findByRef(experiences, route.ref);
          if (item) {
            setSelectedExperience(item);
            setSelectedEvent(null);
            setSelectedStory(null);
            setPage('experience');
            return;
          }
        }
        if (route.page === 'story') {
          const item = findByRef(stories, route.ref);
          if (item) {
            setSelectedStory(item);
            setSelectedEvent(null);
            setSelectedExperience(null);
            setPage('story');
            return;
          }
        }
        setSelectedEvent(null);
        setSelectedExperience(null);
        setSelectedStory(null);
        setPage('home');
        return;
      }
      setSelectedEvent(null);
      setSelectedExperience(null);
      setSelectedStory(null);
      setPage(route.page === 'notfound' ? 'home' : route.page);
    };
    syncRoute();
    window.addEventListener('hashchange', syncRoute);
    return () => window.removeEventListener('hashchange', syncRoute);
  }, [events, experiences, stories]);
  useEffect(() => {
    const titles: Record<string, string> = {
      home: settings.heroTitle || 'Live. Connect. Explore.',
      about: 'Our Story',
      experiences: 'Experiences',
      events: 'Events',
      journal: 'Journal',
      community: 'Community',
      contact: 'Contact',
      privacy: 'Privacy Policy',
      terms: 'Terms of Use',
      admin: 'Admin workspace',
    };
    const title = selectedEvent
      ? `${selectedEvent.title} — Urban Life Co.`
      : selectedExperience
        ? `${selectedExperience.name} — Urban Life Co.`
        : selectedStory
          ? `${selectedStory.title} — Urban Life Co.`
          : `${titles[page] ?? 'Urban Life Co.'} — Urban Life Co.`;
    const description = selectedEvent?.description || selectedExperience?.description || selectedStory?.excerpt || settings.heroCopy || 'Experiences that bring people together. Home of Urban Hikers, Urban Fitness and Urban Connect — Enugu, Nigeria.';
    const jsonLd = selectedEvent
      ? {
          '@context': 'https://schema.org',
          '@type': 'Event',
          name: selectedEvent.title,
          description: selectedEvent.description,
          startDate: selectedEvent.date,
          location: { '@type': 'Place', name: selectedEvent.location },
          image: selectedEvent.image,
          offers: selectedEvent.registrationLink ? { '@type': 'Offer', url: selectedEvent.registrationLink, price: selectedEvent.price } : undefined,
        }
      : selectedStory
        ? { '@context': 'https://schema.org', '@type': 'Article', headline: selectedStory.title, description: selectedStory.excerpt, datePublished: selectedStory.date, image: selectedStory.coverImage }
        : null;
    applyPageMeta({
      title,
      description,
      path: `${window.location.pathname}${window.location.search}${window.location.hash}`,
      image: selectedEvent?.image || selectedExperience?.coverImage || selectedStory?.coverImage || '/resources/urban-life-logo.png',
      noindex: page === 'admin',
      jsonLd,
    });
  }, [page, selectedEvent, selectedExperience, selectedStory, settings]);
  const filteredEvents = useMemo(
    () =>
      events.filter(e =>
        `${e.title} ${e.category} ${e.location}`
          .toLowerCase()
          .includes(query.toLowerCase())
      ),
    [events, query]
  );
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const upcoming = filteredEvents
    .filter(e => new Date(e.date) >= startOfToday)
    .sort((a, b) => +new Date(a.date) - +new Date(b.date));
  const past = filteredEvents
    .filter(e => new Date(e.date) < startOfToday)
    .sort((a, b) => +new Date(b.date) - +new Date(a.date));
  const openEvent = (event: EventItem) => {
    window.location.hash = routeToHash({ page: 'event', ref: itemRef(event.title, event.id) });
    setSelectedEvent(event);
    setSelectedExperience(null);
    setSelectedStory(null);
    setPage('event');
    setMenu(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  const openExperience = (experience: ExperienceItem) => {
    window.location.hash = routeToHash({ page: 'experience', ref: itemRef(experience.name, experience.id) });
    setSelectedExperience(experience);
    setSelectedEvent(null);
    setSelectedStory(null);
    setPage('experience');
    setMenu(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  const openStory = (story: Story) => {
    window.location.hash = routeToHash({ page: 'story', ref: itemRef(story.title, story.id) });
    setSelectedStory(story);
    setSelectedEvent(null);
    setSelectedExperience(null);
    setPage('story');
    setMenu(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  const nav = (target: StaticPage) => {
    window.location.hash = target === 'admin'
      ? 'admin'
      : routeToHash({ page: target as StaticPage });
    setPage(target);
    setMenu(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  const signIn = async () => {
    setAdminError('');
    try {
      const result = await auth.signIn({
        scope: 'openid email profile offline_access',
      });
      setAdminUser(result.user);
      try {
        await api.get('/api/admin/status');
        setAdminAuthorised(true);
        setAdminError('');
      } catch {
        setAdminAuthorised(false);
        setAdminError(
          'Wrong account. This account does not have administrator access.'
        );
      }
    } catch (error: any) {
      setAdminUser(null);
      setAdminAuthorised(false);
      setAdminError(
        error?.code === 'popup_closed'
          ? ''
          : 'Account not found. Please try again.'
      );
    }
  };
  const signOut = async () => {
    await auth.signOut();
    setAdminUser(null);
    setAdminAuthorised(false);
    setAdminError('');
    window.location.hash = 'admin';
    setPage('admin');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  return (
    <div className="site-shell">
      <PWAControls />
      {announcement && page !== 'admin' && (
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
      {page !== 'admin' && (
        <header className="nav-wrap modern-nav-wrap">
          <button
            className="brand"
            onClick={() => nav('home')}
            aria-label="Urban Life Co. home"
          >
            <img
              className="brand-mark"
              src="https://raw.githubusercontent.com/emeriem/urban-life-co/main/public/brand/urban-life-ul-mark.png"
              alt="Urban Life Co."
            />
          </button>
          <nav className={menu ? 'nav modern-nav open' : 'nav modern-nav'}>
            {([
              'home',
              'about',
              'experiences',
              'events',
              'journal',
              'community',
              'contact',
            ] as StaticPage[]).map(item => (
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
      )}
      {page === 'admin' && (
        <AdminPanel
          user={adminUser}
          authorised={adminAuthorised}
          adminError={adminError}
          onSignIn={signIn}
          onSignOut={signOut}
        />
      )}{' '}
      {page === 'home' && (
        <>
          <section className="hero modern-hero">
            <div
              key={heroSlide}
              className="hero-image"
              role="img"
              aria-label={heroMemories[heroSlide].alt}
              style={{
                backgroundImage: `url("${heroMemories[heroSlide].image}")`,
              }}
            />
            <div className="hero-content">
              <p className="eyebrow">
                {settings.heroEyebrow ?? 'A LIFESTYLE ECOSYSTEM FROM NIGERIA'}
              </p>
              <h1>
                {(settings.heroTitle ?? 'Live. Connect. Explore.')
                  .split('. ')
                  .map((word: string, index: number) => (
                    <span key={word + index}>
                      {word.replace(/\.$/, '')}.<br />
                    </span>
                  ))}
              </h1>
              <p className="hero-copy">
                {settings.heroCopy ??
                  'We create experiences that bring people together, encourage exploration and make everyday life more meaningful.'}
              </p>
              <div className="actions">
                <button
                  className="button light"
                  onClick={() => nav('experiences')}
                >
                  Explore experiences <ChevronRight size={17} />
                </button>
                <button className="text-button" onClick={() => nav('about')}>
                  Discover our story ↗
                </button>
              </div>
              <div className="hero-meta">
                <span>ENUGU, NIGERIA</span>
                <span>BUILT FOR LIFE IN MOTION</span>
                <span aria-live="polite">
                  {String(heroSlide + 1).padStart(2, '0')} /{' '}
                  {String(heroMemories.length).padStart(2, '0')}
                </span>
                <div className="hero-controls" aria-label="Hero memories">
                  <button
                    className="hero-control"
                    aria-label="Show previous memory"
                    onClick={() =>
                      setHeroSlide(
                        current =>
                          (current - 1 + heroMemories.length) %
                          heroMemories.length
                      )
                    }
                  >
                    <ArrowLeft size={15} />
                  </button>
                  {heroMemories.map((memory, index) => (
                    <button
                      key={memory.image}
                      className={
                        index === heroSlide
                          ? 'hero-dot is-active'
                          : 'hero-dot'
                      }
                      aria-label={`Show memory ${index + 1}`}
                      aria-current={index === heroSlide ? 'true' : undefined}
                      onClick={() => setHeroSlide(index)}
                    />
                  ))}
                  <button
                    className="hero-control"
                    aria-label="Show next memory"
                    onClick={() =>
                      setHeroSlide(
                        current => (current + 1) % heroMemories.length
                      )
                    }
                  >
                    <ArrowRight size={15} />
                  </button>
                  <button
                    className="hero-control"
                    aria-label={
                      heroPlaying
                        ? 'Pause memory slideshow'
                        : 'Play memory slideshow'
                    }
                    aria-pressed={heroPlaying}
                    onClick={() => setHeroPlaying(playing => !playing)}
                  >
                    {heroPlaying ? <Pause size={14} /> : <Play size={14} />}
                  </button>
                </div>
              </div>
            </div>
          </section>
          <div className="brand-marquee modern-hidden-marquee" aria-hidden="true">
            <div className="marquee-track">
              <span>LIVE</span>
              <i>•</i>
              <span>CONNECT</span>
              <i>•</i>
              <span>EXPLORE</span>
              <i>•</i>
              <span>URBAN LIFE</span>
              <i>•</i>
              <span>LIVE</span>
              <i>•</i>
              <span>CONNECT</span>
              <i>•</i>
              <span>EXPLORE</span>
              <i>•</i>
              <span>URBAN LIFE</span>
              <i>•</i>
            </div>
          </div>
          <section className="statement">
            <p className="eyebrow">01 / WHY WE EXIST</p>
            <h2>A richer life is <span>a shared experience.</span></h2>
            <p>From movement and the outdoors to culture, travel and new connections, Urban Life Co. is building a home for experiences that make life feel bigger.</p>
            <button className="link-button modern-intro-link" onClick={() => nav('about')}>Meet Urban Life Co. ↗</button>
          </section>
          <Pillars />
          <ExperienceShowcase onNavigate={nav} />
          <section className="section">
            <div className="section-head">
              <div>
                <p className="eyebrow">03 / MAKE A PLAN</p>
                <h2>Something to look forward to.</h2>
              </div>
              <button className="link-button" onClick={() => nav('events')}>View all events ↗</button>
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
          <StoryStrip
            stories={stories}
            onView={() => nav('journal')}
            onOpen={openStory}
          />
        </>
      )}
      {page === 'about' && (
        <PageIntro
          eyebrow="OUR STORY"
          title="A life lived together."          copy="Urban Life Co. exists to create spaces and experiences where people can live, connect and explore. We are building a modern lifestyle ecosystem from Enugu, Nigeria, with a long view toward communities across Africa."
        />
      )}
      {page === 'experiences' && (
        <section className="section page-section">
          <PageHeading
            eyebrow="EXPERIENCES"
            title="Find your way in."
            copy="Urban Life Co. is the home for communities and experiences designed around movement, discovery and connection."
          />
          <div className="experience-grid">
            {experiences.map((experience, index) => (
              <Experience
                key={experience.id}
                title={experience.name}
                eyebrow={experience.category?.toUpperCase() ?? 'EXPERIENCE'}
                tone={
                  index === 0 ? 'hikers' : index === 1 ? 'fitness' : 'connect'
                }
                icon={
                  index === 0 ? (
                    <Mountain />
                  ) : index === 1 ? (
                    <Sparkles />
                  ) : (
                    <Compass />
                  )
                }
                copy={experience.description}
                onOpen={() => openExperience(experience)}
              />
            ))}
          </div>
        </section>
      )}
      {page === 'event' && selectedEvent && (
        <EventDetail event={selectedEvent} onBack={() => nav('events')} />
      )}{' '}
      {page === 'experience' && selectedExperience && (
        <ExperienceDetail
          experience={selectedExperience}
          events={events.filter(e => e.experience === selectedExperience.name)}
          onOpenEvent={openEvent}
          onBack={() => nav('experiences')}
        />
      )}{' '}
      {page === 'story' && selectedStory && (
        <StoryDetail story={selectedStory} onBack={() => nav('journal')} />
      )}{' '}
      {page === 'events' && (
        <section className="section page-section">
          <PageHeading
            eyebrow="EVENTS"
            title="The Urban Life calendar."
            copy="Explore what has happened, what is happening and what comes next."
          />
          <div className="search">
            <Search size={17} />
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search events, places or experiences"
            />
          </div>
          <h3 className="subhead">Upcoming</h3>
          {upcoming.length ? (
            <div className="event-grid">
              {upcoming.map(e => (
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
          <StoryStrip
            stories={stories}
            onView={() => undefined}
            onOpen={openStory}
          />
        </section>
      )}
      {page === 'contact' && <ContactPage />}
      {page === 'privacy' && <PrivacyPage />}
      {page === 'terms' && <TermsPage />}
      {page === 'community' && (
        <>
          <section className="community-page">
            <div className="community-copy">
              <p className="eyebrow">COMMUNITY</p>
              <h1>
                Come for the experience.
                <br />
                <em>Stay for the people.</em>
              </h1>
              <p>
                Urban Life Co. is being built around the belief that life gets
                better when people have places to meet, move, explore and build
                something together.
              </p>
              <button className="button dark" onClick={() => nav('events')}>
                Find an experience <ChevronRight size={17} />
              </button>
            </div>
            <div className="community-image" />
          </section>
          <section className="field-gallery section">
            <div className="field-gallery-heading">
              <p className="eyebrow">URBAN HIKERS · FIELD NOTES</p>
              <h2>Moments from the field.</h2>
              <p>Real people, open trails and the memories made along the way.</p>
            </div>
            <div className="field-gallery-grid">
              {fieldPhotos.map(photo => (
                <figure
                  className={`field-photo field-photo-${photo.type}`}
                  key={photo.image}
                >
                  <img
                    src={photo.image}
                    alt={photo.alt}
                    loading="lazy"
                    decoding="async"
                  />
                  <figcaption>{photo.caption}</figcaption>
                </figure>
              ))}
            </div>
          </section>
        </>
      )}
      {page !== 'admin' && (
        <footer>
          <div>
            <span className="footer-wordmark">URBAN LIFE CO.</span>
            <p>Live. Connect. Explore.</p>
          </div>
          <div className="footer-links">
            <button onClick={() => nav('about')}>About</button>
            <button onClick={() => nav('events')}>Events</button>
            <button onClick={() => nav('journal')}>Journal</button>
            <button onClick={() => nav('community')}>Community</button>
            <button onClick={() => nav('privacy')}>Privacy Policy</button>
            <button onClick={() => nav('terms')}>Terms of Use</button>
          </div>
          <div className="footer-bottom">
            <span>© 2026 Urban Life Co.</span>
            <span>Built for people who want more from life.</span>
            <a
              href="https://www.instagram.com/urbanhikersng/"
              target="_blank"
              rel="noreferrer"
              aria-label="Instagram"
            >
              <Instagram size={17} />
            </a>
          </div>
        </footer>
      )}
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
function EventCard({
  event,
  onOpen,
}: {
  event: EventItem;
  onOpen?: (event: EventItem) => void;
}) {
  return (
    <article className="event-card">
      <div
        className="event-image"
        role="img"
        aria-label={event.title}
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
  const [quantity, setQuantity] = useState(1);
  const [purchaserName, setPurchaserName] = useState('');
  const [purchaserEmail, setPurchaserEmail] = useState('');
  const [purchaserPhone, setPurchaserPhone] = useState('');
  const [attendees, setAttendees] = useState<string[]>(['']);
  const [busy, setBusy] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [booking, setBooking] = useState<any>(null);
  const [accessToken] = useState(() => crypto.randomUUID() + crypto.randomUUID());
  const [idempotencyKey, setIdempotencyKey] = useState(() => crypto.randomUUID());
  const [transferReference, setTransferReference] = useState('');
  const [transferSubmitted, setTransferSubmitted] = useState(false);
  const [tickets, setTickets] = useState<any[]>([]);
  const [ticketBatchIndex, setTicketBatchIndex] = useState(0);
  const [ticketBatchCount, setTicketBatchCount] = useState(0);
  const rawPrice = String(event.price ?? '').trim();
  const normalizedPrice = rawPrice.replace(/₦|NGN|,/gi, '').trim();
  const isFree = /^free$/i.test(rawPrice) || (rawPrice !== '' && Number(normalizedPrice) === 0);
  const changeQuantity = (next: number) => {
    const safe = Number.isFinite(next) ? Math.max(1, Math.min(50000, Math.floor(next))) : 1;
    setQuantity(safe);
    setAttendees(current => Array.from({ length: safe }, (_, i) => current[i] ?? ''));
  };
  const loadTicketBatch = async (registrationId: string, batchIndex: number, append = false) => {
    const { data } = await api.post('/api/registrations/' + registrationId + '/tickets', { accessToken, batchIndex });
    setTickets(current => append ? [...current, ...(data.tickets ?? [])] : (data.tickets ?? []));
    setTicketBatchIndex(data.batchIndex);
    setTicketBatchCount(data.batchCount);
  };
  const refreshStatus = async () => {
    if (!booking?.registrationId) return;
    setBusy(true); setErrorMessage('');
    try {
      const { data } = await api.post('/api/registrations/' + booking.registrationId + '/status', { accessToken });
      setBooking((current: any) => ({ ...current, ...data, ticketCount: data.attendeeCount ?? current.ticketCount }));
      if (data.status === 'confirmed') await loadTicketBatch(booking.registrationId, 0);
    } catch (err: any) {
      setErrorMessage(err?.response?.data?.message ?? err?.message ?? 'Could not refresh booking status.');
    } finally { setBusy(false); }
  };
  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault(); setBusy(true); setErrorMessage('');
    try {
      const { data } = await api.post('/api/registrations', {
        eventId: event.id, idempotencyKey, accessToken, purchaserName, purchaserEmail, purchaserPhone,
        paymentMethod: isFree ? 'free' : 'manual_transfer', attendees: attendees.map(name => ({ name })),
      });
      setBooking(data);
      if (data.status === 'confirmed') await loadTicketBatch(data.registrationId, 0);
    } catch (err: any) {
      setErrorMessage(err?.response?.data?.message ?? err?.message ?? 'We could not create your booking. Please try again.');
    } finally { setBusy(false); }
  };
  const submitTransfer = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault(); if (!booking?.registrationId) return;
    setBusy(true); setErrorMessage('');
    try {
      await api.post('/api/registrations/' + booking.registrationId + '/manual-transfer', { accessToken, transferReference });
      setTransferSubmitted(true);
    } catch (err: any) {
      setErrorMessage(err?.response?.data?.message ?? err?.message ?? 'We could not submit the transfer reference. Please try again.');
    } finally { setBusy(false); }
  };
  const resetBooking = () => {
    setBooking(null); setTransferSubmitted(false); setTransferReference(''); setTickets([]);
    setTicketBatchIndex(0); setTicketBatchCount(0); setIdempotencyKey(crypto.randomUUID());
  };
  return (
    <section className="event-detail">
      <button className="link-button" onClick={onBack}>← Back to events</button>
      <div className="event-detail-image" style={{ backgroundImage: 'url(' + event.image + ')' }} />
      <div className="event-detail-copy">
        <p className="eyebrow">{event.experience ?? event.category}</p>
        <h1>{event.title}</h1>
        <p className="event-detail-meta">{formatDate(event.date)}{event.time ? ' · ' + event.time : ''} · {event.location}</p>
        <p>{event.description}</p>
        <div className="event-detail-actions"><span>{event.price}</span></div>
        {booking ? (
          <div className="admin-notice" role="status">
            <ShieldCheck size={28} />
            <h2>{booking.status === 'confirmed' ? 'Booking confirmed.' : 'Booking created — payment pending.'}</h2>
            <p>Booking reference: <strong>{booking.paymentReference}</strong></p>
            <p>{booking.ticketCount} ticket(s) · ₦{(booking.amountMinor / 100).toLocaleString('en-NG')}</p>
            {booking.status === 'confirmed' && <>
              <p>Your tickets have been issued. Present each ticket code at event check-in.</p>
              {tickets.map((ticket, i) => <p key={ticket.id}>Ticket {i + 1 + ticketBatchIndex * 500}: <strong>{ticket.attendeeName}</strong> · <code>{ticket.id}</code> · {ticket.status}</p>)}
              {ticketBatchIndex + 1 < ticketBatchCount && <button className="button ghost" onClick={() => loadTicketBatch(booking.registrationId, ticketBatchIndex + 1, true)}>Load next tickets</button>}
            </>}
            {booking.status === 'pending_payment' && booking.transferDetails && <>
              <p>Transfer to the approved account below. Tickets are issued only after an administrator verifies the actual bank credit.</p>
              <p><strong>{booking.transferDetails.bankName}</strong><br />{booking.transferDetails.accountName}<br /><strong>{booking.transferDetails.accountNumber}</strong></p>
              {booking.transferDetails.instructions && <p>{booking.transferDetails.instructions}</p>}
              <p>Use this payment reference in your transfer narration: <strong>{booking.paymentReference}</strong></p>
              {transferSubmitted ? <p>Reference received. Your booking is pending administrator verification. No tickets have been issued yet.</p> : (
                <form className="contact-form" onSubmit={submitTransfer}>
                  <label className="full">Bank transfer reference<input required value={transferReference} onChange={e => setTransferReference(e.target.value)} /></label>
                  <button className="button dark" type="submit" disabled={busy}>{busy ? 'Submitting…' : 'Submit transfer reference'}</button>
                </form>
              )}
            </>}
            {booking.status === 'pending_payment' && <button className="button ghost" disabled={busy} onClick={refreshStatus}>{busy ? 'Checking…' : 'Refresh payment status'}</button>}
            {!isFree && !booking.transferDetails && <p>Payment instructions are not configured yet. Please contact the event team before making a transfer.</p>}
            <button className="button ghost" onClick={resetBooking}>Make another booking</button>
          </div>
        ) : (
          <form className="contact-form" onSubmit={submit}>
            <h2 className="full">Book your tickets</h2>
            <label>Number of tickets<input type="number" min="1" step="1" value={quantity} onChange={e => changeQuantity(Number(e.target.value))} required /></label>
            <label>Purchaser name<input required maxLength={120} value={purchaserName} onChange={e => setPurchaserName(e.target.value)} /></label>
            <label>Email address<input required type="email" maxLength={200} value={purchaserEmail} onChange={e => setPurchaserEmail(e.target.value)} /></label>
            <label>Phone number<input value={purchaserPhone} maxLength={40} onChange={e => setPurchaserPhone(e.target.value)} /></label>
            <div className="full"><h3>Attendee details</h3><p>Enter the name of each person who will use a ticket.</p></div>
            {attendees.map((name, index) => <label key={index}>Ticket {index + 1} — attendee name<input required maxLength={120} value={name} onChange={e => setAttendees(current => current.map((v, i) => i === index ? e.target.value : v))} /></label>)}
            <p className="full consent-note">{isFree ? 'Free registration. Tickets are issued once the booking is accepted.' : 'Manual bank transfer is available only where approved bank details have been configured. Automated bank transfer and USSD will appear after provider sandbox verification.'}</p>
            {errorMessage && <div className="photos-error full" role="alert">{errorMessage}</div>}
            <button className="button dark" type="submit" disabled={busy}>{busy ? 'Creating booking…' : 'Continue · ' + quantity + ' ticket' + (quantity === 1 ? '' : 's')} <ChevronRight size={16} /></button>
          </form>
        )}
        {errorMessage && booking && <div className="photos-error" role="alert">{errorMessage}</div>}
        <div className="event-detail-grid">
          <div><b>What to expect</b><p>A thoughtfully designed Urban Life experience centred on people, place and participation.</p></div>
          <div><b>Experience</b><p>{event.experience ?? event.category}</p></div>
        </div>
      </div>
    </section>
  );
}
function ExperienceDetail({
  experience,
  events,
  onOpenEvent,
  onBack,
}: {
  experience: ExperienceItem;
  events: EventItem[];
  onOpenEvent: (event: EventItem) => void;
  onBack: () => void;
}) {
  return (
    <section className="section page-section">
      <button className="link-button" onClick={onBack}>
        ← Back to experiences
      </button>
      <div className="page-heading">
        <p className="eyebrow">{experience.category}</p>
        <h1>{experience.name}</h1>
        <p>{experience.description}</p>
      </div>
      <div className="subhead">Events</div>
      {events.length ? (
        <div className="event-grid">
          {events.map(event => (
            <EventCard key={event.id} event={event} onOpen={onOpenEvent} />
          ))}
        </div>
      ) : (
        <Empty text="No events are attached to this experience yet." />
      )}
    </section>
  );
}
function StoryDetail({ story, onBack }: { story: Story; onBack: () => void }) {
  return (
    <section className="section page-section">
      <button className="link-button" onClick={onBack}>
        ← Back to journal
      </button>
      <div className="page-heading">
        <p className="eyebrow">
          {story.category} · {formatDate(story.date)}
        </p>
        <h1>{story.title}</h1>
        <p>{story.excerpt}</p>
      </div>
      {story.coverImage && (
        <img className="story-detail-image" src={story.coverImage} alt="" />
      )}
      <article className="story-detail-copy">
        {(story.content ?? story.excerpt)
          .split('\n')
          .map((paragraph, index) => (
            <p key={index}>{paragraph}</p>
          ))}
      </article>
    </section>
  );
}
function ContactPage() {
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setBusy(true);
    setErrorMessage('');
    const formEl = e.currentTarget;
    const form = new FormData(formEl);
    try {
      await api.post('/api/messages', {
        name: form.get('name'),
        email: form.get('email'),
        phone: form.get('phone'),
        type: form.get('type'),
        message: form.get('message'),
        website: form.get('website'),
      });
      setSent(true);
      formEl.reset();
    } catch {
      setErrorMessage('We could not send your message. Please try again.');
    } finally {
      setBusy(false);
    }
  };
  return (
    <section className="section page-section contact-page">
      <PageHeading
        eyebrow="CONTACT"
        title="Let’s build something together."
        copy="For partnerships, events, community enquiries and general conversations, send us a note."
      />
      <div className="contact-direct" aria-label="Direct contact options">
        <a
          className="contact-direct-link contact-whatsapp"
          href="https://wa.me/2348140098691?text=Hello%20Urban%20Life%20Co.%2C%20I%27d%20like%20to%20make%20an%20enquiry."
          target="_blank"
          rel="noreferrer"
        >
          <MessageCircle size={18} /> Chat with us on WhatsApp
        </a>
        <a className="contact-direct-link" href="mailto:njemtrybe@gmail.com">
          <Mail size={18} /> njemtrybe@gmail.com
        </a>
        <a className="contact-direct-link" href="tel:+2348140098691">
          <Phone size={18} /> +234 814 009 8691
        </a>
      </div>
      {sent ? (
        <div className="admin-notice">
          <ShieldCheck size={28} />
          <h2>Message received.</h2>
          <p>
            Thanks for reaching out. We’ll get back to you as soon as we can.
          </p>
          <button className="button dark" onClick={() => setSent(false)}>
            Send another message
          </button>
        </div>
      ) : (
        <form className="contact-form" onSubmit={submit}>
          <label>
            Name
            <input required name="name" />
          </label>
          <label>
            Email
            <input required type="email" name="email" />
          </label>
          <label>
            Phone
            <input name="phone" />
          </label>
          <label>
            Enquiry type
            <select name="type">
              <option>General enquiry</option>
              <option>Partnership</option>
              <option>Event</option>
              <option>Community</option>
            </select>
          </label>
          <label className="full">
            Message
            <textarea required name="message" rows={6} />
          </label>
          <input
            name="website"
            tabIndex={-1}
            autoComplete="off"
            aria-hidden="true"
            style={{
              position: 'absolute',
              left: '-9999px',
              opacity: 0,
              height: 0,
            }}
          />
          <p className="full consent-note">
            By sending this enquiry, you agree that Urban Life Co. may use your
            details to respond to you. Read our{' '}
            <button type="button" className="inline-legal-link" onClick={() => { window.location.hash = '#/privacy'; window.scrollTo({ top: 0 }); }}>
              Privacy Policy
            </button>{' '}
            for details about how your information is handled.
          </p>
          {errorMessage && (
            <div className="photos-error full" role="alert">
              {errorMessage}
            </div>
          )}
          <button className="button dark" disabled={busy} type="submit">
            {busy ? 'Sending…' : 'Send enquiry'} <ChevronRight size={16} />
          </button>
        </form>
      )}
    </section>
  );
}
function PrivacyPage() {
  return (
    <section className="section page-section legal-page">
      <PageHeading
        eyebrow="YOUR INFORMATION"
        title="Privacy Policy."
        copy="How Urban Life Co. collects, uses and protects information submitted through this website."
      />
      <article className="legal-copy">
        <p className="legal-updated">Last updated: 3 November 2026</p>
        <h2>1. Who we are</h2>
        <p>
          Urban Life Co. operates this website and handles enquiries submitted
          through it. For privacy questions or requests about your information,
          contact <a href="mailto:njemtrybe@gmail.com">njemtrybe@gmail.com</a>.
        </p>
        <h2>2. Information we collect</h2>
        <p>
          When you use the contact form, we collect your name, email address,
          optional phone number, enquiry type, message and the date and time the
          enquiry is received. We also process information needed to protect the
          form from spam and abuse.
        </p>
        <p>
          If you are an authorised site administrator, account information is
          processed for sign-in and access control. The administrator-only
          Google Photos feature may also process Google account and picker
          session information when the administrator chooses to use it.
        </p>
        <h2>3. How we use information</h2>
        <p>
          We use enquiry information to read, respond to and manage requests,
          coordinate relevant partnerships or event conversations, maintain
          business records, and protect the website against spam or misuse.
          Contact details are not used to add you to a marketing mailing list
          through this form.
        </p>
        <h2>4. Service providers and sharing</h2>
        <p>
          The website uses AppDeploy for application hosting and backend
          services. When email alerts are configured, Resend is used to deliver
          new-enquiry notifications to our team. Google services are involved
          only when an authorised administrator uses Google sign-in or the
          Google Photos feature. These providers process information as needed
          to provide their services. Urban Life Co. does not sell personal
          information.
        </p>
        <h2>5. Retention and security</h2>
        <p>
          Enquiries are stored in the website's administrative inbox and are
          retained for as long as reasonably necessary to respond, manage
          business records, protect the service and meet applicable legal
          obligations. We use access controls and service-provider security
          measures, but no internet transmission or storage system can be
          guaranteed to be completely secure.
        </p>
        <h2>6. Your choices and requests</h2>
        <p>
          You may contact us to request access to, correction of or deletion of
          personal information you submitted, or to raise a privacy concern.
          We will assess and respond to requests in accordance with applicable
          data-protection law and any record-retention obligations.
        </p>
        <h2>7. Cookies and essential technologies</h2>
        <p>
          The website and its authentication or hosting services may use
          essential cookies, browser storage or similar technologies for
          security, sign-in and core site functionality. This website does not
          intentionally use advertising cookies.
        </p>
        <h2>8. Third-party websites</h2>
        <p>
          Links to social networks, event registration services or other
          external websites are governed by those providers' own privacy
          practices. Review their policies before submitting information to
          them.
        </p>
        <h2>9. Updates and contact</h2>
        <p>
          We may update this policy when the website or its data practices
          change. The latest revision date will appear at the top of this page.
          For questions, email{' '}
          <a href="mailto:njemtrybe@gmail.com">njemtrybe@gmail.com</a>.
        </p>
      </article>
    </section>
  );
}

function TermsPage() {
  return (
    <section className="section page-section legal-page">
      <PageHeading
        eyebrow="USING THIS WEBSITE"
        title="Terms of Use."
        copy="The basic terms that apply when you visit or use the Urban Life Co. website."
      />
      <article className="legal-copy">
        <p className="legal-updated">Last updated: 3 November 2026</p>
        <h2>1. About these terms</h2>
        <p>
          These terms apply to your use of the Urban Life Co. website. By using
          the website, you agree to use it lawfully and in a way that does not
          interfere with other visitors or the operation of the service.
        </p>
        <h2>2. Website information</h2>
        <p>
          The website provides information about Urban Life Co., its
          communities, experiences, journal content and events. We aim to keep
          information accurate and current, but event details, availability,
          prices, venues and schedules may change. Check the latest event
          information or contact us before making plans.
        </p>
        <h2>3. Enquiries and event participation</h2>
        <p>
          Submitting a contact enquiry does not create a partnership, booking,
          membership or other contractual relationship. Event participation
          may be subject to separate registration requirements, capacity
          limits, fees, safety instructions or terms communicated for that
          event. Where registration is handled by another provider, that
          provider's terms also apply.
        </p>
        <h2>4. Acceptable use</h2>
        <p>
          You must not misuse the website, attempt to gain unauthorised access,
          disrupt its operation, submit malicious content, impersonate another
          person, or use the contact form for unlawful, abusive or unsolicited
          messages.
        </p>
        <h2>5. Content and intellectual property</h2>
        <p>
          Unless otherwise stated, website text, branding, graphics and
          original materials are owned by or used with permission by Urban Life
          Co. You may view and share links to public pages for personal,
          non-commercial purposes. You must not reproduce, adapt or commercially
          exploit website materials without prior permission from the relevant
          rights holder.
        </p>
        <h2>6. External services and links</h2>
        <p>
          The website may link to third-party platforms, social networks,
          registration pages or services. We do not control those services and
          are not responsible for their content, availability or terms.
        </p>
        <h2>7. Availability and liability</h2>
        <p>
          We may update, suspend or withdraw parts of the website to maintain
          or improve the service. To the extent permitted by applicable law,
          the website is provided for general information and is not a
          guarantee that every page, listing or linked service will always be
          available or error-free.
        </p>
        <h2>8. Changes and contact</h2>
        <p>
          We may revise these terms as the website develops. Continued use
          after an update means you accept the revised terms. Questions about
          these terms can be sent to{' '}
          <a href="mailto:njemtrybe@gmail.com">njemtrybe@gmail.com</a>.
        </p>
      </article>
    </section>
  );
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
  const orderedStories = [...stories].sort((a, b) => {
    const featuredDelta = Number(Boolean(b.featured)) - Number(Boolean(a.featured));
    if (featuredDelta !== 0) return featuredDelta;
    return new Date(b.date).getTime() - new Date(a.date).getTime();
  });

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
        {orderedStories.map((s, i) => (
          <article className={`story story-${i}`} key={s.id}>
            {s.coverImage && (
              <img
                className="story-cover"
                src={s.coverImage}
                alt=""
                loading="lazy"
                decoding="async"
              />
            )}
            <div className="story-meta-row">
              <div className="story-meta">
                {s.category} · {formatDate(s.date)}
              </div>
              {s.featured && <span className="story-badge">Featured</span>}
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
function ExperienceShowcase({
  onNavigate,
}: {
  onNavigate: (target: StaticPage) => void;
}) {
  return (
    <section className="ecosystem-section modern-experiences">
      <div className="section-head ecosystem-head">
        <div>          <p className="eyebrow">02 / FIND YOUR PEOPLE</p>
          <h2>Different ways to live more.</h2>
          <p className="modern-section-subtitle">One ecosystem. Many ways to belong.</p>
        </div>
        <button className="link-button" onClick={() => onNavigate('experiences')}>Explore the ecosystem ↗</button>
      </div>
      <div className="ecosystem-grid modern-bento-grid">
        <button className="ecosystem-tile hikers modern-bento-hikers" onClick={() => onNavigate('experiences')}>
          <span>URBAN HIKERS</span><strong>Move outside.</strong><small>Outdoor lifestyle · Exploration · Community</small><span className="modern-card-arrow" aria-hidden="true">↗</span>
        </button>
        <button className="ecosystem-tile fitness modern-bento-fitness" onClick={() => onNavigate('experiences')}>
          <span>FITNESS &amp; WELLNESS</span><strong>Move well.</strong><small>Movement · Wellness · Energy</small><span className="modern-card-arrow" aria-hidden="true">↗</span>
        </button>
        <button className="ecosystem-tile connect modern-bento-connect" onClick={() => onNavigate('community')}>
          <span>URBAN CONNECT</span><strong>Meet people.</strong><small>Connection · Networking · Opportunity</small><span className="modern-card-arrow" aria-hidden="true">↗</span>
        </button>
        <button className="ecosystem-tile travel modern-bento-travel" onClick={() => onNavigate('experiences')}>
          <span>TRAVEL &amp; CULTURE</span><strong>Go further.</strong><small>Places · Culture · Discovery</small><span className="modern-card-arrow" aria-hidden="true">↗</span>
        </button>
      </div>
    </section>
  );
}
function BrandFeature({
  onNavigate,
}: {
  onNavigate: (target: StaticPage) => void;
}) {
  return (
    <section className="brand-feature">
      <div className="brand-feature-copy">
        <p className="eyebrow">A HOUSE OF EXPERIENCES</p>
        <h2>
          Different worlds.
          <br />
          <em>One urban life.</em>
        </h2>
        <p>
          Urban Life Co. brings together distinct experiences without flattening
          them into one visual identity. Urban Hikers, Urban Fitness and future
          experiences each get room to be themselves.
        </p>
        <button
          className="button dark"
          onClick={() => onNavigate('experiences')}
        >
          Explore the ecosystem <ChevronRight size={17} />
        </button>
      </div>
      <div className="brand-feature-stack" aria-hidden="true">
        <div className="stack-card stack-life">
          <span>URBAN LIFE CO.</span>
          <strong>LIVE.</strong>
        </div>
        <div className="stack-card stack-hikers">
          <span>URBAN HIKERS</span>
          <strong>EXPLORE.</strong>
        </div>
        <div className="stack-card stack-fitness">
          <span>URBAN FITNESS</span>
          <strong>MOVE.</strong>
        </div>
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
}: {
  eyebrow: string;
  title: string;
  copy: string;
}) {
  return (
    <section className="page-intro">
      <PageHeading eyebrow={eyebrow} title={title} copy={copy} />
      <div className="timeline">
        <div>
          <b>2026</b>
          <span>
            Urban Life Co. begins shaping a lifestyle ecosystem around
            community, outdoors and connection.
          </span>
        </div>
        <div>
          <b>Now</b>
          <span>
            Urban Hikers grows as an experience-led community under the Urban
            Life Co. umbrella.
          </span>
        </div>
        <div>
          <b>Next</b>
          <span>
            More experiences, more people, more places and more ways to connect.
          </span>
        </div>
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
function AdminPanel({
  user,
  authorised,
  adminError,
  onSignIn,
  onSignOut,
}: {
  user: any;
  authorised: boolean;
  adminError: string;
  onSignIn: () => void;
  onSignOut: () => Promise<void>;
}) {
  const [tab, setTab] = useState('dashboard');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any>({
    metrics: {},
    events: [],
    stories: [],
    experiences: [],
    announcements: [],
    messages: [],
    registrations: [],
  });
  const load = async () => {
    if (!authorised) return;
    setLoading(true);
    try {
      const [
        dash,
        events,
        stories,
        experiences,
        announcements,
        messages,
        settings,
        registrations,
      ] = await Promise.all([
        api.get('/api/admin/dashboard'),
        api.get('/api/admin/events'),
        api.get('/api/admin/stories'),
        api.get('/api/admin/experiences'),
        api.get('/api/admin/announcements'),
        api.get('/api/admin/messages'),
        api.get('/api/admin/settings'),
        api.get('/api/admin/registrations'),
      ]);
      setData({
        ...dash.data,
        events: events.data,
        stories: stories.data,
        experiences: experiences.data,
        announcements: announcements.data,
        messages: messages.data,
        settings: settings.data,
        registrations: registrations.data?.registrations ?? [],
      });
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    load();
  }, [authorised]);
  if (!user || !authorised)
    return (
      <section className="admin-shell admin-auth">
        <div className="cms-topbar">
          <a
            className="cms-brand"
            href={`${window.location.pathname}${window.location.search}`}
          >
            <img src="https://raw.githubusercontent.com/emeriem/urban-life-co/main/public/brand/urban-life-ul-mark.png" alt="" />
            <span>
              Urban Life Co.<small>Content studio</small>
            </span>
          </a>
          <a
            className="cms-site-link"
            href={`${window.location.pathname}${window.location.search}`}
          >
            View website <ArrowRight size={15} />
          </a>
        </div>
        <div className="admin-access-note">Private CMS</div>
        <div className="admin-top">
          <div>
            <p className="eyebrow">ADMIN</p>
            <h1>Urban Life CMS</h1>
            <p>
              Sign in to access the Urban Life Co. administration dashboard.
            </p>
          </div>
          {user ? (
            <button className="button ghost" onClick={onSignOut}>
              Sign out
            </button>
          ) : null}
        </div>
        <div className="admin-notice">
          <ShieldCheck size={30} />
          <h2>{user ? 'Access denied' : 'Administrator sign in'}</h2>
          <p>
            {user
              ? 'Wrong account. This account does not have administrator access.'
              : 'Sign in to continue to the Urban Life Co. administration dashboard.'}
          </p>
          {adminError && (
            <div className="admin-error" role="alert">
              {adminError}
            </div>
          )}
          {!user && (
            <button className="button dark" onClick={onSignIn}>
              Sign in to admin
            </button>
          )}
        </div>
      </section>
    );
  const tabs = [
    ['dashboard', 'Overview', Compass],
    ['events', 'Events', CalendarDays],
    ['registrations', 'Bookings & tickets', ShieldCheck],
    ['experiences', 'Experiences', Mountain],
    ['stories', 'Journal', Sparkles],
    ['announcements', 'Announcements', Megaphone],
    ['messages', 'Messages', Mail],
    ['media', 'Media', ImagePlus],
    ['pages', 'Site content', Menu],
  ] as const;
  return (
    <section className="admin-shell">
      <div className="cms-topbar">
        <a
          className="cms-brand"
          href={`${window.location.pathname}${window.location.search}`}
        >
          <img src="https://raw.githubusercontent.com/emeriem/urban-life-co/main/public/brand/urban-life-ul-mark.png" alt="" />
          <span>
            Urban Life Co.<small>Content studio</small>
          </span>
        </a>
        <a
          className="cms-site-link"
          href={`${window.location.pathname}${window.location.search}`}
        >
          View website <ArrowRight size={15} />
        </a>
      </div>
      <div className="admin-access-note">
        <ShieldCheck size={14} /> Private CMS · Super Admin
      </div>
      <div className="admin-top">
        <div>
          <p className="eyebrow">CONTROL CENTRE</p>
          <h1>Urban Life CMS</h1>
          <p>Operate the ecosystem from one place.</p>
        </div>
        <div className="admin-user-actions">
          <div className="admin-user">
            <ShieldCheck size={18} /> Administrator session
          </div>
          <button className="button ghost" onClick={onSignOut}>
            Sign out
          </button>
        </div>
      </div>
      <div className="cms-layout">
        <nav className="cms-nav" aria-label="CMS sections">
          {tabs.map(([key, label, Icon]) => (
            <button
              key={key}
              className={tab === key ? 'active' : ''}
              aria-current={tab === key ? 'page' : undefined}
              onClick={() => setTab(key)}
            >
              <Icon size={16} aria-hidden="true" />
              <span>{label}</span>
            </button>
          ))}
          <button onClick={() => load()}>
            <RefreshCw size={15} aria-hidden="true" /> <span>Refresh data</span>
          </button>
        </nav>
        <main className="cms-main">
          {loading && <div className="cms-loading">Updating…</div>}
          {tab === 'dashboard' && (
            <DashboardView data={data} onOpen={setTab} />
          )}{' '}
          {tab === 'events' && (
            <EventsManager items={data.events} reload={load} />
          )}{' '}
          {tab === 'registrations' && (
            <RegistrationsManager items={data.registrations} reload={load} />
          )}{' '}
          {tab === 'experiences' && (
            <ExperiencesManager items={data.experiences} reload={load} />
          )}{' '}
          {tab === 'stories' && (
            <StoriesManager items={data.stories} reload={load} />
          )}{' '}
          {tab === 'announcements' && (
            <AnnouncementsManager items={data.announcements} reload={load} />
          )}{' '}
          {tab === 'messages' && (
            <MessagesManager items={data.messages} reload={load} />
          )}{' '}
          {tab === 'media' && (
            <MediaManager reload={load} events={data.events} />
          )}{' '}
          {tab === 'pages' && (
            <SiteSettingsManager settings={data.settings ?? {}} reload={load} />
          )}
        </main>
      </div>
    </section>
  );
}

function RegistrationsManager({ items, reload }: { items: any[]; reload: () => Promise<void> }) {
  const [busyId, setBusyId] = useState('');
  const [message, setMessage] = useState('');
  const [ticketId, setTicketId] = useState('');
  const [checkInBusy, setCheckInBusy] = useState(false);
  const checkIn = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!ticketId.trim()) return;
    setCheckInBusy(true); setMessage('');
    try {
      await api.post(`/api/admin/tickets/${ticketId.trim()}/check-in`);
      setMessage('Ticket checked in successfully.'); setTicketId('');
    } catch (err: any) {
      setMessage(err?.response?.data?.message ?? err?.message ?? 'Ticket check-in failed.');
    } finally { setCheckInBusy(false); }
  };
  const review = async (item: any, action: 'confirm' | 'reject') => {
    const reason = window.prompt(action === 'confirm'
      ? 'Confirm actual bank credit has been independently verified. Enter the audit note:'
      : 'Enter the reason for rejecting this transfer reference:');
    if (!reason?.trim()) return;
    let verifiedAmountMinor: number | undefined;
    if (action === 'confirm') {
      if (!window.confirm('Have you verified the actual credit in the business bank account? A receipt screenshot alone is not sufficient.')) return;
      const amount = window.prompt('Enter the exact amount credited to the business bank account in Naira (e.g. 7500.00):');
      if (amount === null || !/^\d+(?:\.\d{1,2})?$/.test(amount.replace(/,/g, '').trim())) return;
      verifiedAmountMinor = Math.round(Number(amount.replace(/,/g, '').trim()) * 100);
    }
    setBusyId(item.id); setMessage('');
    try {
      if (action === 'confirm') {
        await api.post(`/api/admin/registrations/${item.id}/confirm-transfer`, { bankCreditVerified: true, verifiedAmountMinor, reason });
      } else {
        await api.post(`/api/admin/registrations/${item.id}/reject-transfer`, { reason });
      }
      setMessage(action === 'confirm' ? 'Transfer verified and tickets issued.' : 'Transfer reference rejected.');
      await reload();
    } catch (err: any) {
      setMessage(err?.response?.data?.message ?? err?.message ?? 'The action could not be completed.');
    } finally { setBusyId(''); }
  };
  return (
    <ManagerLayout title="Bookings & tickets" description="Review bookings, verify manual bank transfers and manage event check-in.">
      <form className="contact-form" onSubmit={checkIn}>
        <label className="full">Ticket ID for check-in<input required value={ticketId} onChange={e => setTicketId(e.target.value)} placeholder="Scan or enter the ticket code" /></label>
        <button className="button dark" type="submit" disabled={checkInBusy}>{checkInBusy ? 'Checking…' : 'Check in ticket'}</button>
      </form>
      {message && <div className="admin-notice" role="status">{message}</div>}
      {items.length ? items.map(item => (
        <article className="cms-panel" key={item.id}>
          <div className="cms-panel-head">
            <div>
              <p className="eyebrow">{item.eventTitle || 'Event booking'}</p>
              <h3>{item.purchaserName} · {item.attendeeCount} ticket(s)</h3>
              <p>{item.purchaserEmail} {item.purchaserPhone ? '· ' + item.purchaserPhone : ''}</p>
            </div>
            <span className={'status-pill status-' + String(item.paymentStatus).toLowerCase()}>{item.paymentStatus}</span>
          </div>
          <p>Booking: <code>{item.id}</code></p>
          <p>Payment reference: <strong>{item.paymentReference}</strong></p>
          {item.transferReference && <p>Customer transfer reference: <strong>{item.transferReference}</strong></p>}
          <p>Amount: ₦{(item.amountMinor / 100).toLocaleString('en-NG')} · Created: {new Date(item.createdAt).toLocaleString('en-NG')}</p>
          {item.paymentStatus === 'manual_review' && <div className="cms-actions">
            <button className="button dark" disabled={busyId === item.id} onClick={() => review(item, 'confirm')}>Verify bank credit & issue tickets</button>
            <button className="button ghost" disabled={busyId === item.id} onClick={() => review(item, 'reject')}>Reject reference</button>
          </div>}
        </article>
      )) : <Empty text="No bookings have been received yet." />}
      <button className="button ghost" onClick={reload}>Refresh bookings</button>
    </ManagerLayout>
  );
}

function DashboardView({
  data,
  onOpen,
}: {
  data: any;
  onOpen: (tab: string) => void;
}) {
  const m = data.metrics ?? {};
  return (
    <div>
      <div className="cms-heading dashboard-heading">
        <div>
          <p className="eyebrow">OVERVIEW / OPERATIONS</p>
          <h2>The operating picture.</h2>
          <p className="dashboard-intro">
            A clear view of your content, community enquiries and what needs attention next.
          </p>
        </div>
        <div className="dashboard-actions">
          <button className="button dark" onClick={() => onOpen('events')}>
            Create event <ChevronRight size={16} />
          </button>
          <button className="button ghost" onClick={() => onOpen('stories')}>
            Write a story <ChevronRight size={16} />
          </button>
        </div>
      </div>
      <div className="metric-grid">
        {[
          ['Events', m.events, 'events'],
          ['Published', m.publishedEvents, 'events'],
          ['Journal', m.stories, 'stories'],
          ['Drafts', m.drafts, 'stories'],
          ['Media', m.media, 'media'],
          ['New messages', m.newMessages, 'messages'],
        ].map(([label, value, key]) => (
          <button
            className="metric-card"
            key={label as string}
            onClick={() => onOpen(key as string)}
          >
            <span>{label}</span>
            <strong>{value ?? 0}</strong>
          </button>
        ))}
      </div>
      <div className="cms-two-col">
        <div className="cms-panel dashboard-list-panel">
          <div className="cms-panel-head">
            <div>
              <p className="eyebrow">UP NEXT</p>
              <h3>Recent events</h3>
            </div>
            <button className="text-action" onClick={() => onOpen('events')}>
              All events <ChevronRight size={15} />
            </button>
          </div>
          {(data.recentEvents ?? []).length ? (data.recentEvents ?? []).map((e: any) => (
            <div className="cms-row" key={e.id}>
              <div className="cms-row-main">
                <b>{e.title}</b>
                <small>
                  {e.date || 'Date not set'} · <span className={`status-pill status-${String(e.status || 'draft').toLowerCase()}`}>{e.status || 'draft'}</span>
                </small>
              </div>
            </div>
          )) : (
            <div className="dashboard-empty">
              <CalendarDays size={20} />
              <p>No events to show yet.</p>
              <button className="text-action" onClick={() => onOpen('events')}>Create the first event <ChevronRight size={15} /></button>
            </div>
          )}
        </div>
        <div className="cms-panel dashboard-list-panel">
          <div className="cms-panel-head">
            <div>
              <p className="eyebrow">COMMUNITY</p>
              <h3>New enquiries</h3>
            </div>
            <button className="text-action" onClick={() => onOpen('messages')}>
              Inbox <ChevronRight size={15} />
            </button>
          </div>
          {(data.recentMessages ?? []).length ? (data.recentMessages ?? []).map((x: any) => (
            <div className="cms-row" key={x.id}>
              <div className="cms-row-main">
                <b>{x.name || 'Community member'}</b>
                <small>
                  {x.type || 'General enquiry'} · <span className={`status-pill status-${String(x.status || 'new').toLowerCase()}`}>{x.status || 'new'}</span>
                </small>
              </div>
            </div>
          )) : (
            <div className="dashboard-empty">
              <ShieldCheck size={20} />
              <p>You’re all caught up. New enquiries will appear here.</p>
              <button className="text-action" onClick={() => onOpen('messages')}>Open inbox <ChevronRight size={15} /></button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
function EventsManager({
  items,
  reload,
}: {
  items: any[];
  reload: () => Promise<void>;
}) {
  const empty = {
    title: '',
    date: '',
    time: '',
    location: '',
    category: 'Urban Hikers',
    experience: 'Urban Hikers',
    status: 'draft',
    price: '',
    description: '',
    image: '',
    registrationLink: '',
    capacity: '',
  };
  const [form, setForm] = useState<any>(empty);
  const [editing, setEditing] = useState<string | null>(null);
  const save = async () => {
    const payload = {
      ...form,
      capacity: form.capacity ? Number(form.capacity) : undefined,
    };
    if (editing) await api.put(`/api/admin/events/${editing}`, payload);
    else await api.post('/api/admin/events', payload);
    setForm(empty);
    setEditing(null);
    await reload();
  };  return (
    <ManagerLayout
      title="Events"
      description="Create, publish, update and archive every Urban Life event."
    >
      <div className="cms-form-grid">
        {[
          'title',
          'date',
          'time',
          'location',
          'price',
          'image',
          'registrationLink',
          'capacity',
        ].map(k => (
          <label key={k}>
            {k}
            <input
              value={form[k] ?? ''}
              onChange={e => setForm({ ...form, [k]: e.target.value })}
            />
          </label>
        ))}
        <label>
          Experience
          <select
            value={form.experience}
            onChange={e =>
              setForm({
                ...form,
                experience: e.target.value,
                category: e.target.value,
              })
            }
          >
            <option>Urban Hikers</option>
            <option>Urban Fitness</option>
            <option>Urban Connect</option>
            <option>Urban Life Co.</option>
          </select>
        </label>
        <label>
          Status
          <select
            value={form.status}
            onChange={e => setForm({ ...form, status: e.target.value })}
          >
            <option>draft</option>
            <option>published</option>
            <option>completed</option>
          </select>
        </label>
        <label className="full">
          Description          <textarea
            rows={4}
            value={form.description ?? ''}
            onChange={e => setForm({ ...form, description: e.target.value })}
          />
        </label>
      </div>
      <div className="cms-actions">
        <button className="button dark" onClick={save}>
          {editing ? 'Save changes' : 'Create event'}
        </button>
        {editing && (
          <button
            className="button ghost"
            onClick={() => {
              setEditing(null);
              setForm(empty);
            }}
          >
            Cancel
          </button>
        )}
      </div>
      <ListTable
        items={items}
        columns={['title', 'date', 'status', 'experience']}
        onEdit={x => {
          setEditing(x.id);
          setForm({ ...x });
        }}
        onArchive={async x => {
          await api.delete(`/api/admin/events/${x.id}`);
          await reload();
        }}
      />
    </ManagerLayout>
  );
}
function ExperiencesManager({
  items,
  reload,
}: {
  items: any[];
  reload: () => Promise<void>;
}) {
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState<any>({
    name: '',
    category: '',
    description: '',
    coverImage: '',
    status: 'published',
    featured: false,
  });
  const save = async () => {
    if (editing) await api.put(`/api/admin/experiences/${editing.id}`, form);
    else await api.post('/api/admin/experiences', form);
    setEditing(null);
    setForm({
      name: '',
      category: '',
      description: '',
      coverImage: '',
      status: 'published',
      featured: false,
    });
    await reload();
  };
  return (
    <ManagerLayout
      title="Experiences"
      description="Manage the distinct worlds inside Urban Life Co."
    >
      <div className="cms-form-grid">
        <label>
          Name
          <input
            value={form.name}
            onChange={e => setForm({ ...form, name: e.target.value })}
          />
        </label>
        <label>
          Category
          <input
            value={form.category}
            onChange={e => setForm({ ...form, category: e.target.value })}
          />
        </label>
        <label>
          Cover image
          <input
            value={form.coverImage}
            onChange={e => setForm({ ...form, coverImage: e.target.value })}
          />
        </label>
        <label>
          Status
          <select
            value={form.status}
            onChange={e => setForm({ ...form, status: e.target.value })}
          >
            <option>draft</option>
            <option>published</option>
            <option>archived</option>
          </select>
        </label>
        <label className="full">
          Description
          <textarea
            rows={4}
            value={form.description}
            onChange={e => setForm({ ...form, description: e.target.value })}
          />
        </label>
      </div>
      <div className="cms-actions">
        <button className="button dark" onClick={save}>
          {editing ? 'Save changes' : 'Create experience'}
        </button>
        {editing && (
          <button
            className="button ghost"
            onClick={() => {
              setEditing(null);
              setForm({
                name: '',
                category: '',
                description: '',
                coverImage: '',
                status: 'published',
                featured: false,
              });
            }}
          >
            Cancel
          </button>
        )}
      </div>
      <ListTable
        items={items}
        columns={['name', 'category', 'status']}
        onEdit={x => {
          setEditing(x);
          setForm({ ...x });
        }}
        onArchive={async x => {
          await api.delete(`/api/admin/experiences/${x.id}`);
          await reload();
        }}
      />
    </ManagerLayout>
  );
}
function StoriesManager({
  items,
  reload,
}: {
  items: any[];
  reload: () => Promise<void>;
}) {
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState<any>({
    title: '',
    category: '',
    date: '',
    excerpt: '',
    content: '',
    coverImage: '',
    status: 'draft',
    featured: false,
  });
  const save = async () => {
    if (editing) await api.put(`/api/admin/stories/${editing.id}`, form);
    else await api.post('/api/admin/stories', form);
    setEditing(null);
    setForm({
      title: '',
      category: '',
      date: '',
      excerpt: '',
      content: '',
      coverImage: '',
      status: 'draft',
      featured: false,
    });
    await reload();
  };
  return (
    <ManagerLayout
      title="Journal"
      description="Build the editorial archive: draft, publish, feature and archive stories."
    >
      <div className="cms-form-grid">
        <label className="full">
          Title
          <input
            value={form.title}
            onChange={e => setForm({ ...form, title: e.target.value })}
          />
        </label>
        <label>
          Category
          <input
            value={form.category}
            onChange={e => setForm({ ...form, category: e.target.value })}
          />
        </label>
        <label>
          Date
          <input
            type="date"
            value={form.date}
            onChange={e => setForm({ ...form, date: e.target.value })}
          />
        </label>
        <label>
          Cover image
          <input
            value={form.coverImage}
            onChange={e => setForm({ ...form, coverImage: e.target.value })}
          />
        </label>
        <label>
          Status
          <select
            value={form.status}
            onChange={e => setForm({ ...form, status: e.target.value })}
          >
            <option>draft</option>
            <option>published</option>
            <option>archived</option>
          </select>
        </label>
        <label className="checkbox-field">
          <input
            type="checkbox"
            checked={Boolean(form.featured)}
            onChange={e => setForm({ ...form, featured: e.target.checked })}
          />
          <span>Feature on homepage</span>
        </label>
        <label className="full">
          Excerpt
          <textarea
            rows={3}
            value={form.excerpt}
            onChange={e => setForm({ ...form, excerpt: e.target.value })}
          />
        </label>
        <label className="full">
          Story content
          <textarea
            rows={8}
            value={form.content}
            onChange={e => setForm({ ...form, content: e.target.value })}
          />
        </label>
      </div>
      <div className="cms-actions">
        <button className="button dark" onClick={save}>
          {editing ? 'Save changes' : 'Create story'}
        </button>
      </div>
      <ListTable
        items={items}
        columns={['title', 'date', 'status']}
        onEdit={x => {
          setEditing(x);
          setForm({ ...x });
        }}
        onArchive={async x => {
          await api.delete(`/api/admin/stories/${x.id}`);
          await reload();
        }}
      />
    </ManagerLayout>
  );
}
function AnnouncementsManager({
  items,
  reload,
}: {
  items: any[];
  reload: () => Promise<void>;
}) {
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState<any>({
    title: '',
    body: '',
    status: 'draft',
    startAt: '',
    expiresAt: '',
    priority: 'normal',
  });
  const save = async () => {
    if (editing) await api.put(`/api/admin/announcements/${editing.id}`, form);
    else await api.post('/api/admin/announcements', form);
    setEditing(null);
    setForm({
      title: '',
      body: '',
      status: 'draft',
      startAt: '',
      expiresAt: '',
      priority: 'normal',
    });
    await reload();
  };
  return (
    <ManagerLayout
      title="Announcements"
      description="Control timely messages across the public site."
    >
      <div className="cms-form-grid">
        <label>
          Headline
          <input
            value={form.title}
            onChange={e => setForm({ ...form, title: e.target.value })}
          />
        </label>
        <label>
          Priority
          <select
            value={form.priority}
            onChange={e => setForm({ ...form, priority: e.target.value })}
          >
            <option>normal</option>
            <option>high</option>
          </select>
        </label>
        <label>
          Status
          <select
            value={form.status}
            onChange={e => setForm({ ...form, status: e.target.value })}
          >
            <option>draft</option>
            <option>published</option>
            <option>archived</option>
          </select>
        </label>
        <label>
          Start
          <input
            type="datetime-local"
            value={form.startAt}
            onChange={e => setForm({ ...form, startAt: e.target.value })}
          />
        </label>
        <label>
          Expires
          <input
            type="datetime-local"
            value={form.expiresAt}
            onChange={e => setForm({ ...form, expiresAt: e.target.value })}
          />
        </label>
        <label className="full">
          Message
          <textarea
            rows={4}
            value={form.body}
            onChange={e => setForm({ ...form, body: e.target.value })}
          />
        </label>
      </div>
      <div className="cms-actions">
        <button className="button dark" onClick={save}>
          {editing ? 'Save changes' : 'Create announcement'}
        </button>
        {editing && (
          <button
            className="button ghost"
            onClick={() => {
              setEditing(null);
              setForm({
                title: '',
                body: '',
                status: 'draft',
                startAt: '',
                expiresAt: '',
                priority: 'normal',
              });
            }}
          >
            Cancel
          </button>
        )}
      </div>
      <ListTable
        items={items}
        columns={['title', 'priority', 'status']}
        onEdit={x => {
          setEditing(x);
          setForm({ ...x });
        }}
        onArchive={async x => {
          await api.delete(`/api/admin/announcements/${x.id}`);
          await reload();
        }}
      />
    </ManagerLayout>
  );
}
function MessagesManager({
  items,
  reload,
}: {
  items: any[];
  reload: () => Promise<void>;
}) {
  const setStatus = async (x: any) => {
    await api.put(`/api/admin/messages/${x.id}`, {
      status: x.status === 'new' ? 'read' : 'resolved',
    });
    await reload();
  };
  return (
    <ManagerLayout
      title="Messages"
      description="Manage partnership, event and community enquiries submitted through the website."
    >
      <ListTable
        items={items}
        columns={['name', 'email', 'type', 'status', 'createdAt']}
        onEdit={setStatus}
        actionLabel="Update status"
      />
    </ManagerLayout>
  );
}
function MediaManager({
  reload,
  events,
}: {
  reload: () => Promise<void>;
  events: any[];
}) {
  const [items, setItems] = useState<any[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const load = () =>
    api
      .get('/api/media')
      .then(r => setItems(r.data.media ?? []))
      .catch(() => setUploadError('Could not load the media library. Please refresh and try again.'));
  useEffect(() => {
    void load();
  }, []);
  const upload = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setUploadError('Please choose an image file.');
      return;
    }
    if (file.size > 6 * 1024 * 1024) {
      setUploadError('Please choose an image under 6 MB.');
      return;
    }
    setUploading(true);
    setUploadError('');
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const base64 = String(reader.result).split(',')[1] ?? '';
        await api.post('/api/admin/media/upload', {
          name: file.name,
          contentType: file.type,
          base64,
        });
        await load();
        await reload();
      } catch {
        setUploadError('Image upload failed. Please try again.');
      } finally {
        setUploading(false);
      }
    };
    reader.onerror = () => {
      setUploading(false);
      setUploadError('The image could not be read.');
    };
    reader.readAsDataURL(file);
  };
  const remove = async (item: any) => {
    if (!window.confirm('Remove this media item?')) return;
    try {
      await api.delete(`/api/admin/media/${item.id}`);
      await load();
      await reload();
    } catch {
      setUploadError('The media item could not be removed.');
    }
  };
  return (
    <ManagerLayout
      title="Media"
      description="Upload images directly, import event photography from Google Photos, and maintain the Urban Life archive."
    >
      <GooglePhotosPanel
        events={events}
        onImported={() => {
          void load();
          void reload();
        }}
      />
      <div className="cms-panel" style={{ marginTop: 18 }}>
        <h3>Direct image upload</h3>        <p>
          Upload a cover, gallery or campaign image directly into the Urban Life
          media library.
        </p>
        <input
          type="file"
          accept="image/*"
          disabled={uploading}
          onChange={e => {
            const file = e.target.files?.[0];
            if (file) void upload(file);
            e.currentTarget.value = '';
          }}
        />
        {uploading && <p>Uploading…</p>}
        {uploadError && (
          <div className="photos-error" role="alert">
            {uploadError}
          </div>
        )}
      </div>
      <div className="media-grid">
        {items.map(x => (
          <figure key={x.id}>
            <img src={x.url} alt={x.caption || 'Urban Life media'} />
            <figcaption>
              {x.caption || x.experience || 'Urban Life Co.'}
              <button className="link-button" onClick={() => remove(x)}>
                Remove
              </button>
            </figcaption>
          </figure>
        ))}
      </div>
      {!items.length && (
        <Empty text="No media imported yet. Upload an image or use Google Photos." />
      )}
      <button
        className="button ghost"
        onClick={async () => {
          await load();
          await reload();
        }}
      >
        Refresh media
      </button>
    </ManagerLayout>
  );
}
function SiteSettingsManager({
  settings,
  reload,
}: {
  settings: any;
  reload: () => Promise<void>;
}) {
  const [form, setForm] = useState<any>(settings);
  useEffect(() => setForm(settings), [settings]);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const save = async () => {
    setSaving(true);
    setMessage('');
    try {
      await api.put('/api/admin/settings', form);
      await reload();
      setMessage('Site content saved.');
    } catch {
      setMessage('Could not save site content.');
    } finally {
      setSaving(false);
    }
  };
  return (
    <ManagerLayout
      title="Site content"
      description="Control the core homepage messaging without editing code."
    >
      <div className="cms-form-grid">
        <label>
          Hero eyebrow
          <input
            value={form.heroEyebrow ?? ''}
            onChange={e => setForm({ ...form, heroEyebrow: e.target.value })}
          />
        </label>
        <label>
          Hero title
          <input
            value={form.heroTitle ?? ''}
            onChange={e => setForm({ ...form, heroTitle: e.target.value })}
          />
        </label>
        <label className="full">
          Hero copy
          <textarea
            rows={4}
            value={form.heroCopy ?? ''}
            onChange={e => setForm({ ...form, heroCopy: e.target.value })}
          />
        </label>
        <label className="full">
          Community headline
          <input
            value={form.communityHeadline ?? ''}
            onChange={e =>
              setForm({ ...form, communityHeadline: e.target.value })
            }
          />
        </label>
        <label className="full">
          Community copy
          <textarea
            rows={4}
            value={form.communityCopy ?? ''}
            onChange={e => setForm({ ...form, communityCopy: e.target.value })}
          />
        </label>
      </div>
      <div className="cms-actions">
        <button className="button dark" disabled={saving} onClick={save}>
          {saving ? 'Saving…' : 'Save site content'}
        </button>
        {message && <span>{message}</span>}
      </div>
    </ManagerLayout>
  );
}
function ManagerLayout({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="cms-heading">
        <div>
          <p className="eyebrow">CMS</p>
          <h2>{title}</h2>
          <p>{description}</p>
        </div>
      </div>
      {children}
    </div>
  );
}
function ListTable({
  items,
  columns,
  onEdit,
  onArchive,
  actionLabel = 'Edit',
}: {
  items: any[];
  columns: string[];
  onEdit: (x: any) => void;
  onArchive?: (x: any) => void;
  actionLabel?: string;
}) {
  return (
    <div className="cms-table">
      {items.map(x => (
        <div className="cms-row" key={x.id}>
          <div className="cms-row-main">
            {columns.map(c => (
              <span key={c}>
                <b>{c === columns[0] ? String(x[c] ?? 'Untitled') : ''}</b>
                {c !== columns[0] && String(x[c] ?? '')}
              </span>
            ))}
          </div>
          <div className="cms-row-actions">
            <button onClick={() => onEdit(x)}>{actionLabel}</button>
            {onArchive && <button onClick={() => onArchive(x)}>Archive</button>}
          </div>
        </div>
      ))}
      {!items.length && <Empty text="Nothing here yet." />}
    </div>
  );
}
function GooglePhotosPanel({
  events,
  onImported,
}: {
  events: any[];
  onImported: () => void;
}) {
  const [config, setConfig] = useState<{
    configured: boolean;
    clientId?: string;
    scope?: string;
  } | null>(null);
  const [accessToken, setAccessToken] = useState('');
  const [session, setSession] = useState<{
    sessionId: string;
    pickerUri: string;
  } | null>(null);
  const [target, setTarget] = useState({
    eventId: '',
    experience: 'Urban Hikers',
  });
  const [message, setMessage] = useState('');
  useEffect(() => {
    api
      .get('/api/admin/google-photos/config')
      .then(({ data }) => setConfig(data))
      .catch(() => setMessage('Unable to load Google Photos configuration.'));
  }, []);
  const authorize = () => {
    const googleApi = (window as any).google;
    if (!config?.configured || !config.clientId) {
      setMessage(
        'Google Photos is not configured. Add GOOGLE_PHOTOS_CLIENT_ID to AppDeploy secrets first.'
      );
      return;
    }
    if (!googleApi?.accounts?.oauth2) {
      setMessage(
        'Google authorization is still loading. Please try again in a moment.'
      );
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
        } else setMessage('Google Photos authorization was not completed.');
      },
      error_callback: () =>
        setMessage('Google Photos authorization could not be opened.'),
    });
    client.requestAccessToken({ prompt: 'consent' });
  };
  const startPicker = async () => {
    if (!accessToken) {
      authorize();
      return;
    }

    // Open the tab synchronously inside the click handler so browser popup
    // blockers do not prevent the picker from opening after the API request.
    const pickerWindow = window.open('about:blank', '_blank');
    if (!pickerWindow) {
      setMessage(
        'Your browser blocked the Google Photos window. Allow pop-ups for this site and try again.'
      );
      return;
    }

    try {
      const { data } = await api.post('/api/admin/google-photos/session', {
        accessToken,
        ...target,
        maxItemCount: 30,
      });
      setSession(data);
      pickerWindow.opener = null;
      pickerWindow.location.href = data.pickerUri;
      setMessage(
        'Select photos in Google Photos. This page will detect when you finish.'
      );
    } catch {
      pickerWindow.close();
      setMessage(
        'Could not start the Google Photos Picker. Please authorize again.'
      );
    }
  };
  useEffect(() => {
    if (!session || !accessToken) return;
    let stopped = false;
    const poll = async () => {
      if (stopped) return;
      try {
        const { data } = await api.post(
          `/api/admin/google-photos/session/${session.sessionId}/status`,
          { accessToken }
        );
        if (data.mediaItemsSet) {
          setMessage(
            'Selection complete. Importing photos into the Urban Life media library…'
          );
          const result = await api.post(
            `/api/admin/google-photos/import/${session.sessionId}`,
            { accessToken }
          );
          setMessage(
            `${result.data?.imported ?? 0} photos imported successfully.`
          );
          onImported();
          setSession(null);
          return;
        }
      } catch {
        setMessage(
          'The Google Photos selection session expired or needs to be restarted.'
        );
        setSession(null);
        return;
      }
      window.setTimeout(poll, 3500);
    };
    poll();
    return () => {
      stopped = true;
    };
  }, [session, accessToken]);
  return (
    <article className="admin-card photos-card">
      <div className="admin-icon">
        <Link2 />
      </div>
      <div className="photos-card-heading">
        <div>
          <span className="photos-kicker">MEDIA SOURCE</span>
          <h3>Google Photos</h3>
        </div>
        <span
          className={accessToken ? 'connected-badge' : 'disconnected-badge'}
        >
          {accessToken ? 'Connected' : 'Not connected'}
        </span>
      </div>
      <p>
        Select event photography directly from Google Photos and import the
        approved images into the Urban Life media library. The Google access
        token stays in this browser session and is never stored by Urban Life
        Co.
      </p>
      {!config?.configured ? (
        <div className="photos-setup">
          <strong>One-time setup required</strong>
          <span>Add GOOGLE_PHOTOS_CLIENT_ID to AppDeploy secrets.</span>
          <small>
            The integration uses Google's Photos Picker scope and does not
            require a client secret in the browser.
          </small>
        </div>
      ) : !accessToken ? (
        <button className="button dark" onClick={authorize}>
          <Link2 size={16} /> Connect Google Photos
        </button>
      ) : (
        <div className="picker-controls">
          <div className="picker-fields">
            <label>
              Experience
              <select
                value={target.experience}
                onChange={e =>
                  setTarget(prev => ({ ...prev, experience: e.target.value }))
                }
              >
                <option>Urban Hikers</option>
                <option>Urban Fitness</option>
                <option>Urban Connect</option>
                <option>Urban Life Co.</option>
              </select>
            </label>
            <label>
              Event (optional)
              <select
                value={target.eventId}
                onChange={e =>
                  setTarget(prev => ({ ...prev, eventId: e.target.value }))
                }
              >
                <option value="">No event</option>
                {events.map(event => (
                  <option key={event.id} value={event.id}>
                    {event.title}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <button className="button dark" onClick={startPicker}>
            <ImagePlus size={16} /> Pick photos from Google Photos
          </button>
          <p className="picker-help">
            Google Photos opens separately. Search for the event or album,
            select the photos, and tap Done. The CMS then imports the selected
            images.
          </p>
        </div>
      )}
      {message && <div className="photos-error">{message}</div>}
    </article>
  );
}
export default App;
