import React, { useMemo, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
} from 'lucide-react';
import { useData } from '../context/DataContext';
import { ProductCard } from '../components/products/ProductCard';
import { ChemicalBackgroundEffect } from '../components/home/ChemicalBackgroundEffect';
import { CompaniesCircularCarousel } from '../components/home/CompaniesCircularCarousel';

export const HomePage: React.FC = () => {
  const { collaborations = [], products = [] } = useData();

  // Intersection Observer for smooth scroll reveal animations
  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('reveal-visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

    document.querySelectorAll('.reveal-on-scroll').forEach(el => observer.observe(el));
    
    return () => observer.disconnect();
  }, [products, collaborations]);

  const activeCollaborations = collaborations.filter((c) => c?.active);
  const activeProducts = products.filter((product) => product?.active !== false);
  
  // Ensure exactly up to 4 products are displayed on home screen (featured first, then padded with active)
  const displayProducts = useMemo(() => {
    const featuredList = activeProducts.filter(p => p.featured);
    const nonFeaturedList = activeProducts.filter(p => !p.featured);
    return [...featuredList, ...nonFeaturedList].slice(0, 4);
  }, [activeProducts]);

  return (
    <div className="homepage-wrapper" style={{ position: 'relative', minHeight: '100vh', opacity: 1 }}>
      {/* 0. Chemical-Themed Scroll-Reactive Background Effects */}
      <ChemicalBackgroundEffect />

      {/* Embedded Styles for smooth transitions and text animations */}
      <style>{`
        .homepage-wrapper {
          opacity: 1;
        }
        .reveal-on-scroll {
          opacity: 0;
          transform: translateY(32px);
          transition: opacity 0.7s cubic-bezier(0.16, 1, 0.3, 1), transform 0.7s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .reveal-visible {
          opacity: 1;
          transform: translateY(0);
        }
        
        .hero-element {
          opacity: 0;
          transform: translateY(18px);
          animation: fadeUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .hero-stagger-1 { animation-delay: 0.05s; }
        .hero-stagger-2 { animation-delay: 0.18s; }
        .hero-stagger-3 { animation-delay: 0.3s; }

        .highlight-animate {
          display: inline-block;
          background-size: 200% auto;
          background-image: linear-gradient(135deg, #1d4ed8 0%, #0284c7 50%, #2563eb 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          animation: shine 4s linear infinite;
        }

        .home-product-card-link {
          height: 100%;
          display: flex;
          flex-direction: column;
          transition: transform 0.25s ease, box-shadow 0.25s ease;
        }
        .home-product-card-link:hover {
          transform: translateY(-6px);
        }
        .home-product-card-link:hover .catalog-product-card {
          box-shadow: 0 20px 40px -10px rgba(37, 99, 235, 0.20), 0 0 0 1px #93c5fd !important;
          border-color: #93c5fd !important;
        }

        @keyframes fadeUp {
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes shine {
          to { background-position: 200% center; }
        }
      `}</style>

      {/* 1. HERO SECTION (2-Column Balanced Layout with Elevated Containers) */}
      <section className="hero-section" style={{ position: 'relative', zIndex: 1 }}>
        <div className="hero-content-wrapper">
          {/* Left Column: Humanized Marketing Story & Actions */}
          <div className="hero-content-container">
            <h1 className="hero-title hero-element hero-stagger-1">
              Precision Formulations.{' '}
              <span className="text-highlight highlight-animate">Chemistry that connects.</span>
            </h1>

            <p className="hero-description hero-element hero-stagger-2">
              At Raghav Texchems, we engineer high-yield specialty chemicals, polymer emulsions, and vibrant dyestuffs designed for peak industrial consistency. Trusted across textile, paper, and polymer manufacturing hubs worldwide.
            </p>

            <div className="hero-actions hero-element hero-stagger-2">
              <Link
                to="/products"
                className="btn btn-primary hero-btn-primary"
                id="hero-story-btn"
              >
                <span>View Products Catalog</span>
                <ArrowRight size={17} />
              </Link>

              <Link
                to="/contact"
                className="btn btn-secondary hero-btn-secondary"
                id="hero-contact-btn"
              >
                <span>Contact Chemical Specialists</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 2. PRODUCTS SHOWCASE (Clean Product Preview Without Card Action Buttons) */}
      {activeProducts.length > 0 && (
        <section className="section-padding products-showcase-section" style={{ position: 'relative', zIndex: 1 }}>
          <div className="section-container">
            <div className="section-header text-center reveal-on-scroll">
              <h2 className="section-title">Products & Chemical Solutions</h2>
              <p className="section-subtitle">
                Explore our signature chemical formulations engineered for consistency and optimal yield.
              </p>
            </div>

            <div className="home-products-single-row-grid">
              {displayProducts.map((product, index) => (
                <Link
                  key={product.id}
                  to="/products"
                  className="reveal-on-scroll product-card-wrapper home-product-card-link"
                  style={{ 
                    textDecoration: 'none', 
                    color: 'inherit', 
                    display: 'block', 
                    transitionDelay: `${index * 120}ms`,
                    height: '100%'
                  }}
                  title={`View ${product.name} on the products catalog`}
                >
                  <ProductCard
                    product={product}
                    showActions={false}
                  />
                </Link>
              ))}
            </div>


          </div>
        </section>
      )}

      {/* 3. STRATEGIC ALLIANCES & COLLABORATIONS */}
      {activeCollaborations.length > 0 && (
        <section className="section-padding companies-tieups-section" style={{ background: '#f8fafc', position: 'relative', zIndex: 1 }}>
          <div className="section-container">
            <div className="section-header text-center reveal-on-scroll">
              <h2 className="section-title">Trusted By Leading Manufacturing Hubs</h2>
              <p className="section-subtitle">
                Collaborating with industrial corporations and export mills across domestic and international markets.
              </p>
            </div>

            <div className="reveal-on-scroll" style={{ width: '100%', marginTop: '1.5rem' }}>
              <CompaniesCircularCarousel collaborations={activeCollaborations} />
            </div>
          </div>
        </section>
      )}
    </div>
  );
};