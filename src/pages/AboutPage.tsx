import React, { useMemo, useRef, useEffect } from 'react';
import { useData } from '../context/DataContext';

export const AboutPage: React.FC = () => {
  const { aboutContent, companySettings } = useData();
  const videoRef = useRef<HTMLVideoElement>(null);

  // Fallback video URL if none provided in database
  const defaultVideoUrl = 'https://strvid.nyc3.cdn.digitaloceanspaces.com/motionsite/dna_video.mp4';
  const directVideoSrc = aboutContent?.videoUrl || defaultVideoUrl;

  // Ensure direct video autoplays, mutes, and keeps continuously repeating
  useEffect(() => {
    const vid = videoRef.current;
    if (vid) {
      vid.defaultMuted = true;
      vid.muted = true;
      vid.play().catch(() => {
        // Fallback for strict browser autoplay permissions
      });
    }
  }, [aboutContent?.videoUrl, aboutContent?.videoType]);

  // Extract YouTube embed ID from various URL formats
  const youtubeEmbedUrl = useMemo(() => {
    if (aboutContent?.videoType !== 'youtube') return null;
    const url = aboutContent?.videoUrl || '';
    let videoId = '';
    const match1 = url.match(/[?&]v=([^&#]+)/);
    if (match1) videoId = match1[1];
    const match2 = url.match(/youtu\.be\/([^?&#]+)/);
    if (match2) videoId = match2[1];
    const match3 = url.match(/youtube\.com\/embed\/([^?&#]+)/);
    if (match3) videoId = match3[1];

    if (!videoId) return null;
    return `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&loop=1&playlist=${videoId}&controls=0&showinfo=0&modestbranding=1&rel=0&playsinline=1&enablejsapi=1`;
  }, [aboutContent?.videoUrl, aboutContent?.videoType]);

  const paragraphs = useMemo(() => {
    if (aboutContent?.storyParagraphs && aboutContent.storyParagraphs.length > 0) {
      return aboutContent.storyParagraphs;
    }
    if (aboutContent?.storyMarkdown) {
      return aboutContent.storyMarkdown.split(/\n\n+/).filter(Boolean);
    }
    return [
      'Founded with a bold vision to bridge cutting-edge polymer research with heavy industrial utility, Raghav Texchems Chemical Private Limited has grown into an international manufacturer of specialty dyestuffs, polymer emulsions, and surface coatings.',
      'Our manufacturing units operate with strict quality parameters, ensuring batch-to-batch consistency and high environmental compliance for domestic and global export markets.'
    ];
  }, [aboutContent]);

  const milestones = aboutContent?.milestones || [];
  const coreValues = aboutContent?.coreValues || [];

  return (
    <div className="about-page">
      {/* ─── 1. Video Hero Section (Always Autoplays and Continuously Loops) ─── */}
      <section className="about-video-hero">
        <div className="about-video-wrapper">
          {aboutContent?.videoType === 'youtube' && youtubeEmbedUrl ? (
            <iframe
              className="about-video-iframe"
              src={youtubeEmbedUrl}
              title="Company Story Video"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          ) : (
            <video
              ref={videoRef}
              className="about-video-direct"
              src={directVideoSrc}
              autoPlay
              muted
              loop
              playsInline
              onEnded={(e) => {
                e.currentTarget.currentTime = 0;
                e.currentTarget.play().catch(() => {});
              }}
            />
          )}
          <div className="about-video-overlay" />
        </div>

        <div className="about-video-hero-content">
          <div className="section-badge" style={{ background: 'rgba(255,255,255,0.15)', color: 'white', backdropFilter: 'blur(10px)' }}>
            OUR STORY
          </div>
          <h1 className="about-hero-title">{aboutContent?.storyTitle || 'Directorate Overview & Chemical Excellence'}</h1>
          <p className="about-hero-subtitle">
            {companySettings?.tagline && <em>"{companySettings.tagline}"</em>}
          </p>
        </div>
      </section>

      {/* ─── 2. Company Story & 2 Highlighted Containers Close to Description ─── */}
      <section className="about-story-section">
        <div className="about-story-container">
          {/* Centered Heading in black with exact same fontsize as description */}
          <h2 className="about-company-heading">
            About {companySettings?.companyName || 'Raghav Texchems Chemical Private Limited'}
          </h2>

          <div className="about-story-content">
            {paragraphs.map((para: string, idx: number) => (
              <p key={idx} className="about-story-paragraph">
                {para}
              </p>
            ))}
          </div>

          {/* 2 Simple & Highlighted Containers close to the description */}
          <div className="about-mv-grid-tight">
            <div className="about-mv-highlight-card mission">
              <h3 className="about-mv-highlight-title">
                {aboutContent?.missionTitle || 'Our Mission'}
              </h3>
              <p className="about-mv-highlight-text">
                {aboutContent?.missionText || 'To engineer sustainable, high-yield chemical formulations that empower global textile, paper, and polymer industries while preserving ecological harmony.'}
              </p>
            </div>

            <div className="about-mv-highlight-card vision">
              <h3 className="about-mv-highlight-title">
                {aboutContent?.visionTitle || 'Our Vision'}
              </h3>
              <p className="about-mv-highlight-text">
                {aboutContent?.visionText || 'To be the most trusted international partner in specialty chemical connectivity, recognized for technical excellence and uncompromising reliability.'}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ─── 3. Key Milestones (No 'Our Journey', vertical circular floating motion, pure sphere pointer) ─── */}
      {milestones.length > 0 && (
        <section className="about-milestones-section">
          <div className="section-header" style={{ marginBottom: '2.5rem' }}>
            <h2 className="section-title">Key Milestones</h2>
            <p className="section-subtitle">
              A timeline of growth, innovation, and expanding chemical excellence across industries and borders.
            </p>
          </div>

          <div className="about-timeline">
            {milestones.map((ms, idx) => (
              <div key={ms.id} className={`about-timeline-item ${idx % 2 === 0 ? 'left' : 'right'}`}>
                {/* Pointer on the line: MUST ONLY be a sphere, nothing else */}
                <div className="about-timeline-sphere" />

                {/* Animated container with slight vertical circular motion */}
                <div
                  className="about-timeline-card animated-vertical-circle"
                  style={{ animationDelay: `${idx * 1.5}s` }}
                >
                  <span className="about-timeline-year">{ms.year}</span>
                  <h4 className="about-timeline-title">{ms.title}</h4>
                  <p className="about-timeline-desc">{ms.description}</p>
                </div>
              </div>
            ))}
            <div className="about-timeline-line" />
          </div>
        </section>
      )}

      {/* ─── 4. Our Core Values (No badge, text-only puzzled 4 containers) ─── */}
      {coreValues.length > 0 && (
        <section className="about-values-section">
          <div className="section-header" style={{ marginBottom: '2.5rem' }}>
            <h2 className="section-title">Our Core Values</h2>
            <p className="section-subtitle">
              The principles that define our chemistry, our partnerships, and our commitment to excellence.
            </p>
          </div>

          <div className="about-puzzle-grid">
            {coreValues.map((val, idx) => (
              <div
                key={val.id}
                className={`about-puzzle-card puzzle-piece-${(idx % 4) + 1}`}
              >
                <div className="puzzle-card-top">
                  <span className="puzzle-index">0{idx + 1}</span>
                  <span className="puzzle-label">
                    {idx === 0 ? 'SYNTHESIS' : idx === 1 ? 'ECOLOGY' : idx === 2 ? 'PARTNERS' : 'INTEGRITY'}
                  </span>
                </div>
                <h3 className="puzzle-card-title">{val.title}</h3>
                <p className="puzzle-card-desc">{val.description}</p>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};
