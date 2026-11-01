/* data.js - fake data for the Content Lab prototype, as plain JS objects.
   Loaded before app.js, which reads it from window.APP_DATA. */

window.APP_DATA = {
  contentLab: [
    {
      title: 'Repurpose with AI',
      items: [
        { label: 'Clips', meta: '12 Clips', icon: 'assets/clips.svg', badge: true },
        { label: 'Quiz', meta: '1 Quiz', icon: 'assets/quiz.svg' },
        { label: 'Summary & Chapters', meta: '1 Summary and chapter', icon: 'assets/summary-chapters.svg', view: 'summary' },
        { label: 'Metadata enrichment', icon: 'assets/metadata-enrichment.svg' }
      ]
    },
    {
      title: 'Accessibility & localization',
      items: [
        { label: 'Captions & Translations', meta: '2 Active', icon: 'assets/captions.svg' },
        { label: 'Audio description', icon: 'assets/audio-description.svg' },
        { label: 'Dubbing', icon: 'assets/dubbing.svg' },
        { label: 'Sign language', icon: 'assets/sign-language.svg' }
      ]
    }
  ],

  // Kaltura entry used by the player and thumbnails (public embed; no secrets here).
  kaltura: { partnerId: 1912501, uiConfId: 57496443, entryId: '1_3i30cncg', duration: 2605 },

  // Summary = the entry's AI summary (REACH). Chapters were derived from the entry's
  // transcript, with real start times (the entry has no chapter cue points).
  summaryDrafts: [
    {
      meta: '6 Chapters',
      title: 'Summary 1 - Beyond the content supernova',
      videoTitle: 'Beyond the content supernova: Turning abundance into relevance with agentic AI',
      summary: 'Discover how enterprises can navigate content oversaturation by shifting from traditional supply chains to intelligent value chains powered by agentic AI. This webinar explores the fundamental shifts in content strategy, revealing why current systems optimized for throughput fail in today\'s abundance economy. Learn how breaking content into atomic components and inserting AI at each stage creates a continuous learning flywheel that drives relevance, personalization, and business outcomes. Featuring insights from EY Studio+ and a live demonstration of Kaltura\'s AI publishing agent, this session shows how organizations can transform content operations from linear production to dynamic, adaptive systems that deliver measurable impact.',
      chapters: [
        { time: '04:41', title: 'Welcome and introductions', views: 412,
          text: 'Talia, director of product marketing at Kaltura, welcomes Michael Klazema, chief marketing technologist at EY Studio+, and outlines the session: content abundance, AI in the loop, and agentic AI in Kaltura\'s products.' },
        { time: '10:00', title: 'The content supernova', views: 268,
          text: 'Content has become a commodity. Why the sheer volume no longer works for consumers or content teams, and the pain points it creates around distribution, channels and governance.' },
        { time: '14:10', title: 'From supply chain to value chain', views: 231,
          text: 'Michael explains what replaces the traditional content supply chain: breaking content into atomic components, inserting AI at each stage, and matching micro-content to micro-audiences so content becomes the start of a learning loop.' },
        { time: '19:50', title: 'Inside Kaltura\'s AI publishing agent', views: 305,
          text: 'A live walkthrough of building an agent that enriches, tags, captions and distributes content automatically, and how the insights it collects feed a revenue flywheel across the organization.' },
        { time: '29:55', title: 'Humans and AI in the value chain', views: 187,
          text: 'The mindset shift leaders need: feedback loops over linear plans, documenting strategy as precisely as a taxonomy, and why critical, creative thinking is still best left to humans.' },
        { time: '37:45', title: 'Genie and the future of content', views: 142,
          text: 'How Kaltura Genie turns a stream of video into an answerable knowledge base, what content oversaturation means for businesses and the market, and closing thoughts.' }
      ]
    }
  ]
};
