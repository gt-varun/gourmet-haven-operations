import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Landing = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // Background images for cross-fade slideshow
  const images = [
    '/assets/img/social/s62-sourdough.jpg',
    '/assets/img/social/s78-baguettes.jpg',
    '/assets/img/social/s90-vegetables.jpg'
  ];
  const [currentImageIndex, setCurrentImageIndex] = React.useState(0);

  React.useEffect(() => {
    const timer = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % images.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const handleCtaClick = () => {
    if (isAuthenticated) {
      navigate('/dashboard');
    } else {
      navigate('/login');
    }
  };

  return (
    <div className="landing-scroll-container">
      {/* PUBLIC HEADER NAVBAR (Top-Right Login Align) */}
      <header className="landing-header-bar">
        <div className="landing-logo">
          <span>★ Gourmet Haven</span>
        </div>
        <nav className="landing-nav-links">
          <a href="#story-section">Our Story</a>
          <a href="#philosophy-section">Philosophy</a>
          <a href="#specials-section">Specials</a>
          <button className="landing-nav-login-btn" onClick={handleCtaClick}>
            {isAuthenticated ? 'Go to Portal →' : 'Login / Portal →'}
          </button>
        </nav>
      </header>

      {/* SECTION 1: HERO SPOTLIGHT (1600x900 Split Card) */}
      <div className="landing-stage">
        <div className="landing-card">
          <div className="landing-bg"></div>
          
          {/* Left Column: Image with cross-fade slideshow */}
          <div className="landing-photo">
            {images.map((imgUrl, index) => (
              <img
                key={imgUrl}
                src={imgUrl}
                alt="Artisan food showcase"
                className={index === currentImageIndex ? 'active' : ''}
              />
            ))}
          </div>
          
          {/* Right Column: Content */}
          <div className="landing-right">
            <div className="landing-top-meta">
              <span>★ @gourmethaven.group</span>
              <span className="landing-open-pill">Open now</span>
            </div>
            
            <div className="landing-brand">— Gourmet Haven —</div>
            
            <h1 className="landing-headline">
              Gourmet bakes,<br />
              <em>every</em> morning.
            </h1>
            
            <p className="landing-blurb">
              Sourdough out at 7am · Croissants at 8 · Cinnamon rolls by 9. We bake everything from scratch in our branch kitchens, every day.
            </p>
            
            <div className="landing-hours-card">
              <div className="landing-hours-label">— Today's hours —</div>
              <div className="landing-hours-row">
                <span>Mon — Thu</span>
                <strong>7am — 6pm</strong>
              </div>
              <div className="landing-hours-row">
                <span>Friday</span>
                <strong>7am — 9pm</strong>
              </div>
              <div className="landing-hours-row">
                <span>Sat — Sun</span>
                <strong>8am — 9pm</strong>
              </div>
            </div>
            
            <div className="landing-footer">
              <span>📍 Downtown Bistro & Uptown Café</span>
              <button className="landing-cta" onClick={handleCtaClick}>
                {isAuthenticated ? (
                  <span>Go to Portal <span className="landing-arrow">→</span></span>
                ) : (
                  <span>Login / Portal <span className="landing-arrow">→</span></span>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 2: BRAND STORY & HERITAGE */}
      <section id="story-section" className="landing-details-section">
        <div className="landing-details-container">
          <div className="landing-section-header">
            <h2 className="landing-section-title">Our Heritage & Craft</h2>
            <div className="landing-section-divider"></div>
            <p className="landing-section-subtitle">It's the Simple Pleasures in Life</p>
          </div>

          <div className="landing-story-block">
            <div className="landing-story-content">
              <h3>Traditional Baking, Refined Taste</h3>
              <p>
                At Gourmet Haven, we believe great food begins with authentic ingredients and raw passion. Every single loaf of bread we pull from our stone hearths is fermented using our wild 100-year-old starter, hand-shaped, and cold-proofed for 24 hours to yield the ultimate crispy blistered crust and rich sourdough tang.
              </p>
              <p>
                Whether it is our signature croissants layered with French butter or our robust stone-ground whole wheat bakes, we bake everything from scratch daily in our branch kitchens. No chemical improvers, no stabilizers—just flour, water, sea salt, and pure love.
              </p>
            </div>
            <div className="landing-story-badge">
              <div className="badge-inner">
                <span className="badge-num">100%</span>
                <span className="badge-label">Artisan Organic</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 3: CRAFTSMANSHIP HIGHLIGHTS (4 Cards Grid - No Hover Tilt) */}
      <section id="philosophy-section" className="landing-details-section" style={{ background: '#fef8f0' }}>
        <div className="landing-details-container">
          <div className="landing-section-header">
            <h2 className="landing-section-title">Our Baking Philosophy</h2>
            <div className="landing-section-divider" style={{ background: '#fdb44b' }}></div>
            <p className="landing-section-subtitle">Crafted With Honesty & Natural Grains</p>
          </div>

          <div className="landing-philosophy-grid">
            <div className="philosophy-card">
              <div className="philosophy-icon">🌾</div>
              <h3>100% Organic Flour</h3>
              <p>We source stone-ground heirloom grains exclusively from local family mills. Wholesome and unbleached.</p>
            </div>

            <div className="philosophy-card">
              <div className="philosophy-icon">⏰</div>
              <h3>24h Slow Ferment</h3>
              <p>Time is our secret ingredient. Our cold rises develop complex wheat sugars and yield open, elastic crumbs.</p>
            </div>

            <div className="philosophy-card">
              <div className="philosophy-icon">🍃</div>
              <h3>Wild Starters</h3>
              <p>Our doughs rely solely on natural wild starters fed daily. No commercial yeasts, yielding classic lacto-flavor.</p>
            </div>

            <div className="philosophy-card">
              <div className="philosophy-icon">🛡️</div>
              <h3>Zero Additives</h3>
              <p>Clean label bakes made without artificial dough conditioners, preservatives, or GMO products.</p>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 4: WEEKLY SPECIALS SHOWCASE (3 Product Cards - No Hover Tilt) */}
      <section id="specials-section" className="landing-details-section">
        <div className="landing-details-container">
          <div className="landing-section-header">
            <h2 className="landing-section-title">Weekly Specials</h2>
            <div className="landing-section-divider"></div>
            <p className="landing-section-subtitle">Freshly Baked Morning Favorites</p>
          </div>

          <div className="landing-specials-grid">
            <div className="special-card">
              <div className="special-card-image">
                <img src="/assets/img/social/s62-sourdough.jpg" alt="Artisan Sourdough" />
                <span className="special-badge">Signature 🌟</span>
              </div>
              <div className="special-card-info">
                <h3>Artisan Sourdough Loaf</h3>
                <p>Crispy, blistered crust with a soft, moist elastic crumb. Fermented 24 hours for a balanced sourdough tang.</p>
                <div className="special-card-rating">
                  <span>⭐⭐⭐⭐⭐</span>
                  <span className="rating-num">4.9 (142 reviews)</span>
                </div>
                <div className="special-card-footer">
                  <span className="special-price">₹450.00</span>
                  <button className="special-btn" onClick={handleCtaClick}>Order Now</button>
                </div>
              </div>
            </div>

            <div className="special-card">
              <div className="special-card-image">
                <img src="/assets/img/social/s78-baguettes.jpg" alt="French Baguettes" />
                <span className="special-badge" style={{ background: '#52c1e8' }}>Bestseller 🔥</span>
              </div>
              <div className="special-card-info">
                <h3>Crispy French Baguette</h3>
                <p>Traditional Parisian bread. Extremely crisp crust, light aerated interior, and rich toasted-grain aroma.</p>
                <div className="special-card-rating">
                  <span>⭐⭐⭐⭐⭐</span>
                  <span className="rating-num">4.8 (98 reviews)</span>
                </div>
                <div className="special-card-footer">
                  <span className="special-price">₹180.00</span>
                  <button className="special-btn" onClick={handleCtaClick}>Order Now</button>
                </div>
              </div>
            </div>

            <div className="special-card">
              <div className="special-card-image">
                <img src="/assets/img/social/s90-vegetables.jpg" alt="Bistro Quinoa Salad" />
                <span className="special-badge" style={{ background: '#7ed9a3' }}>Healthy 🌾</span>
              </div>
              <div className="special-card-info">
                <h3>Bistro Quinoa Salad Bowl</h3>
                <p>Fresh organic greens, tri-color quinoa, roasted root vegetables, and toasted seeds tossed in olive oil vinaigrette.</p>
                <div className="special-card-rating">
                  <span>⭐⭐⭐⭐⭐</span>
                  <span className="rating-num">5.0 (64 reviews)</span>
                </div>
                <div className="special-card-footer">
                  <span className="special-price">₹480.00</span>
                  <button className="special-btn" onClick={handleCtaClick}>Order Now</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER CALL-TO-ACTION */}
      <footer className="landing-page-footer">
        <p>© 2026 Gourmet Haven Group. Crafted under Sunshine Theme. All rights reserved.</p>
      </footer>

      <style>{`
        html {
          scroll-behavior: smooth;
        }

        /* ── Scroll Container stage ── */
        .landing-scroll-container {
          background: #fffbf5;
          width: 100vw;
          min-height: 100vh;
          overflow-x: hidden;
          overflow-y: auto;
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
          color: #2d3436;
          -webkit-font-smoothing: antialiased;
        }

        /* ── Sticky Public Header Navbar ── */
        .landing-header-bar {
          position: sticky;
          top: 0;
          left: 0;
          width: 100%;
          height: 70px;
          background: rgba(255, 251, 245, 0.95);
          backdrop-filter: blur(8px);
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 40px;
          border-bottom: 1px solid #e8dcc8;
          z-index: 1000;
          box-shadow: 0 4px 20px rgba(90, 58, 26, 0.03);
          box-sizing: border-box;
        }
        .landing-logo {
          font-family: 'Poppins', sans-serif;
          font-weight: 800;
          font-size: 20px;
          color: #5a3a1a;
        }
        .landing-nav-links {
          display: flex;
          align-items: center;
          gap: 24px;
        }
        .landing-nav-links a {
          font-size: 14px;
          font-weight: 600;
          color: #8a6e54;
          text-decoration: none;
          transition: color 0.25s ease;
        }
        .landing-nav-links a:hover {
          color: #e63946;
        }
        .landing-nav-login-btn {
          background: #e63946;
          color: white;
          border: none;
          padding: 10px 20px;
          border-radius: 99px;
          font-size: 13px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          cursor: pointer;
          transition: all 0.25s ease;
          box-shadow: 0 4px 10px rgba(230, 57, 70, 0.2);
        }
        .landing-nav-login-btn:hover {
          background: #d62b38;
          transform: translateY(-1px);
          box-shadow: 0 6px 15px rgba(230, 57, 70, 0.3);
        }

        /* ── Fullscreen Hero Section ── */
        .landing-stage {
          width: 100%;
          height: calc(100vh - 70px);
          display: flex;
          align-items: center;
          justify-content: center;
          background: #fffbf5; /* Removed dark background, match theme */
          padding: 0; /* Removed padding to get rid of the border frame */
          box-sizing: border-box;
        }

        /* ── Full-bleed premium split layout ── */
        .landing-card {
          position: relative;
          overflow: hidden;
          width: 100%;
          height: 100%;
          display: flex;
          background: #f7ebd5;
          opacity: 0;
          border-bottom: 1px solid #e8dcc8;
          animation: cardEntrance 1.2s cubic-bezier(0.25, 1, 0.5, 1) forwards;
        }

        @keyframes cardEntrance {
          from { opacity: 0; transform: translateY(15px); }
          to { opacity: 1; transform: translateY(0); }
        }

        /* ── Left Column: Full-bleed photo slideshow with cross-fade ── */
        .landing-photo {
          width: 45%;
          height: 100%;
          overflow: hidden;
          position: relative;
        }
        .landing-photo img {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
          opacity: 0;
          transform: scale(1.06);
          transition: opacity 1.5s ease-in-out, transform 2.5s ease-in-out;
        }
        .landing-photo img.active {
          opacity: 1;
          transform: scale(1);
          z-index: 1;
        }
        .landing-photo:hover img.active {
          transform: scale(1.04);
        }

        /* ── Right Column: Content ── */
        .landing-right {
          width: 55%;
          height: 100%;
          padding: 50px 60px;
          display: flex;
          flex-direction: column;
          justify-content: center;
          color: #5a3a1a;
          box-sizing: border-box;
          z-index: 2;
        }

        .landing-top-meta {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
          font-size: 12px;
          font-weight: 700;
          letter-spacing: .2em;
          text-transform: uppercase;
          opacity: 0;
          animation: fadeInUp 0.8s cubic-bezier(0.25, 1, 0.5, 1) 0.3s forwards;
        }

        .landing-brand {
          font-family: 'Caveat', cursive;
          font-weight: 700;
          font-size: 42px;
          color: #e63946;
          line-height: 1;
          margin-bottom: 6px;
          opacity: 0;
          animation: fadeInUp 0.8s cubic-bezier(0.25, 1, 0.5, 1) 0.4s forwards;
        }

        .landing-headline {
          font-family: 'Poppins', sans-serif;
          font-weight: 900;
          font-size: 80px;
          line-height: .92;
          letter-spacing: -.03em;
          color: #5a3a1a;
          margin: 0;
          opacity: 0;
          animation: headlineEntrance 1.5s cubic-bezier(0.19, 1, 0.22, 1) 0.4s forwards;
        }
        @keyframes headlineEntrance {
          0% {
            opacity: 0;
            transform: translateY(35px) skewY(1deg);
            filter: blur(4px);
          }
          100% {
            opacity: 1;
            transform: translateY(0) skewY(0);
            filter: blur(0);
          }
        }
        .landing-headline em {
          display: inline-block;
          font-style: italic;
          color: #e63946;
          animation: emphasisPulse 2.8s ease-in-out infinite alternate;
        }
        @keyframes emphasisPulse {
          0% {
            transform: scale(1);
            text-shadow: 0 0 0px rgba(230, 57, 70, 0);
          }
          100% {
            transform: scale(1.03);
            text-shadow: 0 4px 15px rgba(230, 57, 70, 0.2);
          }
        }

        .landing-blurb {
          font-size: 15px;
          font-weight: 500;
          color: #5a3a1a;
          opacity: 0;
          margin-top: 14px;
          margin-bottom: 0;
          line-height: 1.5;
          max-width: 90%;
          animation: fadeInUp 0.8s cubic-bezier(0.25, 1, 0.5, 1) 0.6s forwards;
        }

        .landing-hours-card {
          margin-top: 24px;
          background: #fff;
          border-radius: 16px;
          padding: 18px 22px;
          border: 2px dashed rgba(90, 58, 26, 0.3);
          opacity: 0;
          animation: fadeInUp 0.8s cubic-bezier(0.25, 1, 0.5, 1) 0.7s forwards;
        }

        .landing-footer {
          margin-top: 24px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: .18em;
          text-transform: uppercase;
          color: #5a3a1a;
          opacity: 0;
          animation: fadeInUp 0.8s cubic-bezier(0.25, 1, 0.5, 1) 0.8s forwards;
        }

        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .landing-open-pill {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          background: #2eb872;
          color: #fff;
          padding: 8px 16px;
          border-radius: 99px;
          font-size: 11px;
          letter-spacing: 0.1em;
        }
        .landing-open-pill::before {
          content: "";
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #fff;
          animation: pulseAnim 1.6s ease-in-out infinite;
        }
        @keyframes pulseAnim {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }

        .landing-hours-label {
          font-size: 11px;
          font-weight: 700;
          letter-spacing: .22em;
          text-transform: uppercase;
          color: #8a6e54;
          margin-bottom: 10px;
        }
        .landing-hours-row {
          display: flex;
          justify-content: space-between;
          align-items: baseline;
          padding: 6px 0;
          font-size: 14px;
          font-weight: 600;
          color: #5a3a1a;
        }
        .landing-hours-row strong {
          font-family: 'Poppins', sans-serif;
          font-weight: 800;
          font-size: 16px;
        }

        .landing-cta {
          background: #e63946;
          color: #fff;
          border: none;
          padding: 12px 24px;
          border-radius: 99px;
          letter-spacing: .18em;
          font-weight: 800;
          text-transform: uppercase;
          cursor: pointer;
          transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow: 0 4px 12px rgba(230, 57, 70, 0.25);
          display: inline-flex;
          align-items: center;
          gap: 6px;
        }
        .landing-cta:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(230, 57, 70, 0.4);
          background: #d62b38;
        }
        .landing-arrow {
          display: inline-block;
          transition: transform 0.25s cubic-bezier(0.25, 1, 0.5, 1);
        }
        .landing-cta:hover .landing-arrow {
          transform: translateX(4px);
        }

        /* ── SECTION STYLING (Story, Philosophy, Specials) ── */
        .landing-details-section {
          padding: 80px 24px;
          background: #fffbf5;
          display: flex;
          justify-content: center;
          box-sizing: border-box;
        }
        .landing-details-container {
          width: 100%;
          max-width: 1200px;
        }
        .landing-section-header {
          text-align: center;
          margin-bottom: 48px;
        }
        .landing-section-title {
          font-family: 'Poppins', sans-serif;
          font-weight: 800;
          font-size: 32px;
          color: #5a3a1a;
          margin: 0;
        }
        .landing-section-divider {
          width: 60px;
          height: 3px;
          background: #e63946;
          margin: 12px auto;
          border-radius: 2px;
        }
        .landing-section-subtitle {
          font-family: 'Caveat', cursive;
          font-size: 24px;
          color: #8a6e54;
          margin: 0;
        }

        /* ── Story Section Block ── */
        .landing-story-block {
          display: flex;
          align-items: center;
          gap: 60px;
          margin-top: 20px;
        }
        .landing-story-content {
          flex: 1.5;
        }
        .landing-story-content h3 {
          font-family: 'Poppins', sans-serif;
          font-weight: 700;
          font-size: 24px;
          color: #5a3a1a;
          margin-top: 0;
          margin-bottom: 16px;
        }
        .landing-story-content p {
          font-size: 15px;
          line-height: 1.6;
          color: #636e72;
          margin-bottom: 16px;
        }
        .landing-story-badge {
          flex: 1;
          display: flex;
          justify-content: center;
        }
        .badge-inner {
          width: 200px;
          height: 200px;
          border-radius: 50%;
          border: 3px dashed rgba(90, 58, 26, 0.25);
          background: #ffffff;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          box-shadow: 0 10px 30px rgba(90, 58, 26, 0.05);
        }
        .badge-num {
          font-family: 'Poppins', sans-serif;
          font-weight: 900;
          font-size: 42px;
          color: #e63946;
          line-height: 1;
        }
        .badge-label {
          font-size: 13px;
          font-weight: 700;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: #8a6e54;
          margin-top: 6px;
        }

        /* ── Philosophy 4-Card Grid (No hover tilt) ── */
        .landing-philosophy-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 24px;
        }
        .philosophy-card {
          background: #ffffff;
          border-radius: 16px;
          padding: 32px 24px;
          border: 1px solid #e8dcc8;
          box-shadow: 0 4px 20px rgba(90, 58, 26, 0.05);
          transition: transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275), box-shadow 0.4s ease;
          text-align: center;
        }
        .philosophy-card:hover {
          transform: translateY(-8px); /* Lift only, no tilt */
          box-shadow: 0 12px 30px rgba(90, 58, 26, 0.12);
          border-color: #e63946;
        }
        .philosophy-icon {
          font-size: 40px;
          margin-bottom: 16px;
        }
        .philosophy-card h3 {
          font-family: 'Poppins', sans-serif;
          font-weight: 700;
          font-size: 18px;
          color: #5a3a1a;
          margin-top: 0;
          margin-bottom: 12px;
        }
        .philosophy-card p {
          font-size: 14px;
          line-height: 1.5;
          color: #636e72;
          margin: 0;
        }

        /* ── Specials 3-Card Grid (No hover tilt) ── */
        .landing-specials-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
          gap: 30px;
        }
        .special-card {
          background: #ffffff;
          border-radius: 16px;
          overflow: hidden;
          border: 1px solid #e8dcc8;
          box-shadow: 0 4px 20px rgba(90, 58, 26, 0.05);
          transition: transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275), box-shadow 0.4s ease;
          display: flex;
          flex-direction: column;
        }
        .special-card:hover {
          transform: translateY(-8px); /* Lift only, no tilt */
          box-shadow: 0 12px 30px rgba(90, 58, 26, 0.12);
          border-color: #e63946;
        }
        .special-card-image {
          position: relative;
          height: 220px;
          overflow: hidden;
        }
        .special-card-image img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform 0.6s ease;
        }
        .special-card:hover .special-card-image img {
          transform: scale(1.1); /* Zoom only, no rotate */
        }
        .special-badge {
          position: absolute;
          top: 15px;
          right: 15px;
          padding: 6px 12px;
          border-radius: 20px;
          font-size: 11px;
          font-weight: 700;
          color: white;
          background: #e63946;
          box-shadow: 0 4px 10px rgba(0,0,0,0.1);
        }
        .special-card-info {
          padding: 24px;
          display: flex;
          flex-direction: column;
          flex-grow: 1;
        }
        .special-card-info h3 {
          font-family: 'Poppins', sans-serif;
          font-weight: 700;
          font-size: 18px;
          color: #5a3a1a;
          margin-top: 0;
          margin-bottom: 8px;
        }
        .special-card-info p {
          font-size: 14px;
          line-height: 1.5;
          color: #636e72;
          margin-top: 0;
          margin-bottom: 12px;
          flex-grow: 1;
        }
        .special-card-rating {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 16px;
          font-size: 13px;
        }
        .rating-num {
          color: #8a6e54;
          font-weight: 500;
        }
        .special-card-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-top: 1px solid #e8dcc8;
          padding-top: 16px;
          margin-top: auto;
        }
        .special-price {
          font-family: 'Poppins', sans-serif;
          font-weight: 800;
          font-size: 18px;
          color: #e63946;
        }
        .special-btn {
          background: #e63946;
          color: white;
          border: none;
          padding: 8px 16px;
          border-radius: 8px;
          font-weight: 600;
          font-size: 13px;
          cursor: pointer;
          transition: background 0.25s ease;
        }
        .special-btn:hover {
          background: #d62b38;
        }

        /* ── Simple footer ── */
        .landing-page-footer {
          background: #fef8f0;
          padding: 40px 24px;
          text-align: center;
          font-size: 13px;
          color: #8a6e54;
          border-top: 1px solid #e8dcc8;
        }

        /* ── Responsive Styling ── */
        @media (max-width: 1024px) {
          .landing-header-bar {
            padding: 0 20px;
          }
          .landing-nav-links {
            gap: 12px;
          }
          .landing-card {
            max-height: none;
            height: auto;
            flex-direction: column;
          }
          .landing-photo {
            width: 100%;
            height: 380px;
          }
          .landing-right {
            width: 100%;
            padding: 40px 30px;
          }
          .landing-stage {
            height: auto;
            min-height: calc(100vh - 70px);
            padding: 10px;
          }
          .landing-headline {
            font-size: 52px;
          }
          .landing-story-block {
            flex-direction: column;
            gap: 30px;
          }
        }
      `}</style>
    </div>
  );
};

export default Landing;
