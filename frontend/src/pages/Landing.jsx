import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Landing = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const handleCtaClick = () => {
    if (isAuthenticated) {
      navigate('/dashboard');
    } else {
      navigate('/login');
    }
  };

  return (
    <div className="landing-stage">
      <div className="landing-card">
        <div className="landing-bg"></div>
        
        {/* Left Column: Image */}
        <div className="landing-photo">
          <img src="/assets/img/social/s62-sourdough.jpg" alt="Fresh artisan sourdough bread" />
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
              {isAuthenticated ? 'Go to Portal →' : 'Login / Portal →'}
            </button>
          </div>
        </div>
      </div>

      <style>{`
        /* ── Fullscreen Viewport stage ── */
        .landing-stage {
          margin: 0;
          padding: 0;
          background: #0a0a0a;
          width: 100vw;
          height: 100vh;
          overflow: hidden;
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
          color: #1a1a2e;
          -webkit-font-smoothing: antialiased;
          text-rendering: optimizeLegibility;
        }

        /* ── Fixed aspect-ratio 1600x900 social card layout ── */
        .landing-card {
          position: relative;
          overflow: hidden;
          width: 100%;
          max-width: 1600px;
          height: 100%;
          max-height: 900px;
          box-shadow: 0 30px 90px rgba(0,0,0,.55), 0 4px 14px rgba(0,0,0,.3);
          display: flex;
          background: #f7ebd5;
          animation: fadeIn 0.8s ease-out;
        }

        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }

        /* ── Left Column: Full-bleed photo ── */
        .landing-photo {
          width: 45%;
          height: 100%;
          overflow: hidden;
          position: relative;
        }
        .landing-photo img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
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

        /* ── Top Metadata Row ── */
        .landing-top-meta {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
          font-size: 12px;
          font-weight: 700;
          letter-spacing: .2em;
          text-transform: uppercase;
        }

        /* ── Pulsing "Open now" pill ── */
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

        /* ── Typography and Headings ── */
        .landing-brand {
          font-family: 'Caveat', cursive;
          font-weight: 700;
          font-size: 42px;
          color: #e63946;
          line-height: 1;
          margin-bottom: 6px;
        }
        .landing-headline {
          font-family: 'Poppins', sans-serif;
          font-weight: 900;
          font-size: 80px;
          line-height: .92;
          letter-spacing: -.03em;
          color: #5a3a1a;
          margin: 0;
        }
        .landing-headline em {
          font-style: italic;
          color: #e63946;
        }
        .landing-blurb {
          font-size: 15px;
          font-weight: 500;
          color: #5a3a1a;
          opacity: .85;
          margin-top: 14px;
          margin-bottom: 0;
          line-height: 1.5;
          max-width: 90%;
        }

        /* ── Operating Hours Card ── */
        .landing-hours-card {
          margin-top: 24px;
          background: #fff;
          border-radius: 16px;
          padding: 18px 22px;
          border: 2px dashed rgba(90, 58, 26, 0.3);
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

        /* ── Footer Address and CTA Button ── */
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
          opacity: .85;
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
        }
        .landing-cta:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(230, 57, 70, 0.4);
          background: #d62b38;
        }

        /* ── Responsive Styling ── */
        @media (max-width: 1024px) {
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
            overflow-y: auto;
            align-items: flex-start;
          }
          .landing-headline {
            font-size: 52px;
          }
        }
      `}</style>
    </div>
  );
};

export default Landing;
