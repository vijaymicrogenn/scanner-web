import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isFocused, setIsFocused] = useState({ username: false, password: false });
  const navigate = useNavigate();

  // Redirect if already logged in
  useEffect(() => {
    const token = sessionStorage.getItem("token");
    if (token) navigate("/", { replace: true });
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      if (res.ok) {
        sessionStorage.setItem("token", data.token);
        // Success animation
        const card = document.querySelector('.login-card');
        if (card) {
          card.style.transform = 'scale(0.95)';
          card.style.transition = 'all 0.3s ease';
          setTimeout(() => {
            card.style.transform = 'scale(1)';
            navigate("/", { replace: true });
          }, 300);
        } else {
          navigate("/", { replace: true });
        }
      } else {
        setError(data.message || "Invalid credentials");
        // Shake animation for error
        const card = document.querySelector('.login-card');
        if (card) {
          card.style.animation = 'shake 0.5s ease-in-out';
          setTimeout(() => {
            card.style.animation = '';
          }, 500);
        }
      }
    } catch (err) {
      setError("Server error. Please try again.");
      const card = document.querySelector('.login-card');
      if (card) {
        card.style.animation = 'shake 0.5s ease-in-out';
        setTimeout(() => {
          card.style.animation = '';
        }, 500);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div 
      className="min-vh-100 d-flex align-items-center justify-content-center position-relative overflow-hidden"
      style={{
        background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%)',
        backgroundSize: '400% 400%',
        animation: 'gradientShift 12s ease infinite',
      }}
    >
      {/* Animated Background Elements */}
      <div className="position-absolute w-100 h-100">
        {/* Floating geometric shapes */}
        {[...Array(8)].map((_, i) => (
          <div
            key={i}
            className="position-absolute"
            style={{
              width: `${60 + i * 30}px`,
              height: `${60 + i * 30}px`,
              background: `rgba(255, 255, 255, ${0.02 + i * 0.005})`,
              top: `${10 + i * 12}%`,
              left: `${i * 15}%`,
              animation: `float 18s ease-in-out infinite`,
              animationDelay: `${i * 1.5}s`,
              filter: 'blur(0.5px)',
              borderRadius: i % 2 === 0 ? '50%' : '8px',
              transform: `rotate(${i * 45}deg)`
            }}
          />
        ))}
        
        {/* Subtle grid pattern */}
        <div 
          className="position-absolute w-100 h-100"
          style={{
            backgroundImage: `
              linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)
            `,
            backgroundSize: '60px 60px',
            animation: 'gridMove 40s linear infinite'
          }}
        />
      </div>

      {/* Main Login Card */}
      <div 
        className="login-card card p-5 position-relative"
        style={{
          width: "100%",
          maxWidth: "440px",
          background: 'rgba(255, 255, 255, 0.08)',
          backdropFilter: 'blur(16px)',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          borderRadius: '24px',
          boxShadow: `
            0 25px 50px -12px rgba(0, 0, 0, 0.5),
            inset 0 1px 0 rgba(255, 255, 255, 0.1),
            0 0 0 1px rgba(255, 255, 255, 0.05)
          `,
          animation: 'cardEntrance 0.8s cubic-bezier(0.34, 1.56, 0.64, 1)',
          overflow: 'hidden'
        }}
      >
        {/* Glass morphism effect */}
        <div 
          className="position-absolute top-0 start-0 w-100 h-100"
          style={{
            background: 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)',
            pointerEvents: 'none'
          }}
        />

        {/* Accent gradient border */}
        <div 
          className="position-absolute top-0 start-0 w-100"
          style={{
            height: '3px',
            background: 'linear-gradient(90deg, #3b82f6, #8b5cf6, #06b6d4)',
            backgroundSize: '200% 100%',
            animation: 'gradientShift 3s ease infinite'
          }}
        />

        {/* Header */}
        <div className="text-center mb-5 position-relative">
          <div 
            className="rounded-circle d-inline-flex align-items-center justify-content-center mb-4 position-relative"
            style={{
              width: '80px',
              height: '80px',
              background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.8), rgba(139, 92, 246, 0.8))',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
              animation: 'iconFloat 4s ease-in-out infinite'
            }}
          >
            <span 
              style={{ 
                fontSize: '2rem',
                filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.3))'
              }}
            >
              🔐
            </span>
          </div>
          <h3 
            className="fw-bold mb-2 text-white"
            style={{ animation: 'fadeInUp 0.8s ease-out' }}
          >
           Log in
          </h3>
         
        </div>

        {/* Error Message */}
        {error && (
          <div 
            className="alert d-flex align-items-center mb-4 position-relative fade-in"
            style={{
              animation: 'slideInDown 0.5s ease-out',
              background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.9), rgba(220, 38, 38, 0.9))',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '16px',
              color: 'white',
              padding: '16px'
            }}
          >
            <span className="me-3" style={{ fontSize: '1.2rem' }}>⚠️</span>
            <span className="fw-medium">{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Username Input */}
          <div className="mb-4">
            <div 
              className="input-group position-relative"
              style={{ animation: 'fadeInUp 1.2s ease-out' }}
            >
              <span 
                className="input-group-text bg-transparent border-end-0"
                style={{
                  borderColor: isFocused.username ? 'rgba(59, 130, 246, 0.6)' : 'rgba(255, 255, 255, 0.15)',
                  transition: 'all 0.3s ease',
                  borderTopLeftRadius: '16px',
                  borderBottomLeftRadius: '16px',
                  color: 'rgba(255, 255, 255, 0.8)'
                }}
              >
                <span 
                  style={{ 
                    opacity: isFocused.username ? 1 : 0.7,
                    transition: 'opacity 0.3s ease'
                  }}
                >
                  👤
                </span>
              </span>
              <input
                type="text"
                className="form-control border-start-0 ps-0"
                style={{
                  borderColor: isFocused.username ? 'rgba(59, 130, 246, 0.6)' : 'rgba(255, 255, 255, 0.15)',
                  borderRadius: '0 16px 16px 0',
                  transition: 'all 0.3s ease',
                  background: 'rgba(255, 255, 255, 0.05)',
                  backdropFilter: 'blur(10px)',
                  padding: '14px 16px',
                  fontSize: '1rem',
                  color: 'white'
                }}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                onFocus={() => setIsFocused(prev => ({ ...prev, username: true }))}
                onBlur={() => setIsFocused(prev => ({ ...prev, username: false }))}
                required
                placeholder="Enter your username"
              />
            </div>
          </div>

          {/* Password Input */}
          <div className="mb-4">
            <div 
              className="input-group position-relative"
              style={{ animation: 'fadeInUp 1.4s ease-out' }}
            >
              <span 
                className="input-group-text bg-transparent border-end-0"
                style={{
                  borderColor: isFocused.password ? 'rgba(59, 130, 246, 0.6)' : 'rgba(255, 255, 255, 0.15)',
                  transition: 'all 0.3s ease',
                  borderTopLeftRadius: '16px',
                  borderBottomLeftRadius: '16px',
                  color: 'rgba(255, 255, 255, 0.8)'
                }}
              >
                <span 
                  style={{ 
                    opacity: isFocused.password ? 1 : 0.7,
                    transition: 'opacity 0.3s ease'
                  }}
                >
                  🔒
                </span>
              </span>
              <input
                type="password"
                className="form-control border-start-0 ps-0"
                style={{
                  borderColor: isFocused.password ? 'rgba(59, 130, 246, 0.6)' : 'rgba(255, 255, 255, 0.15)',
                  borderRadius: '0 16px 16px 0',
                  transition: 'all 0.3s ease',
                  background: 'rgba(255, 255, 255, 0.05)',
                  backdropFilter: 'blur(10px)',
                  padding: '14px 16px',
                  fontSize: '1rem',
                  color: 'white'
                }}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onFocus={() => setIsFocused(prev => ({ ...prev, password: true }))}
                onBlur={() => setIsFocused(prev => ({ ...prev, password: false }))}
                required
                placeholder="Enter your password"
              />
            </div>
          </div>

          {/* Login Button */}
          <button 
            type="submit"
            className={`btn w-100 fw-semibold border-0 position-relative overflow-hidden ${
              isLoading ? 'btn-secondary' : 'btn-primary'
            }`}
            style={{
              borderRadius: '16px',
              background: isLoading 
                ? 'rgba(100, 116, 139, 0.6)' 
                : 'linear-gradient(135deg, rgba(59, 130, 246, 0.9) 0%, rgba(139, 92, 246, 0.9) 100%)',
              backdropFilter: 'blur(10px)',
              color: 'white',
              padding: '16px 24px',
              fontSize: '1rem',
              animation: 'fadeInUp 1.6s ease-out',
              transition: 'all 0.3s ease',
              boxShadow: isLoading 
                ? 'none' 
                : '0 8px 32px rgba(59, 130, 246, 0.4)',
              border: '1px solid rgba(255, 255, 255, 0.1)'
            }}
            disabled={isLoading}
            onMouseEnter={(e) => {
              if (!isLoading) {
                e.target.style.transform = 'translateY(-2px)';
                e.target.style.boxShadow = '0 12px 40px rgba(59, 130, 246, 0.6)';
              }
            }}
            onMouseLeave={(e) => {
              if (!isLoading) {
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = '0 8px 32px rgba(59, 130, 246, 0.4)';
              }
            }}
          >
            {isLoading ? (
              <div className="d-flex align-items-center justify-content-center">
                <div 
                  className="spinner-border spinner-border-sm me-3"
                  style={{ 
                    width: '1.2rem', 
                    height: '1.2rem',
                    borderWidth: '2px',
                    borderColor: 'rgba(255,255,255,0.3) transparent transparent transparent'
                  }}
                />
                Signing In...
              </div>
            ) : (
              <>
                Sign In
                <span 
                  className="position-absolute"
                  style={{
                    right: '20px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    transition: 'transform 0.3s ease',
                    fontSize: '1.2rem'
                  }}
                >
                  →
                </span>
              </>
            )}
          </button>
        </form>

        {/* Footer */}
        <div 
          className="text-center mt-5 pt-4 position-relative"
          style={{
            borderTop: '1px solid rgba(255, 255, 255, 0.1)',
            animation: 'fadeInUp 1.8s ease-out'
          }}
        >
          <small style={{ color: 'rgba(255, 255, 255, 0.6)' }}>
            Secure access • Protected by encryption
          </small>
        </div>
      </div>

      {/* Global Styles */}
      <style>
        {`
          @keyframes gradientShift {
            0%, 100% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
          }

          @keyframes cardEntrance {
            from {
              opacity: 0;
              transform: translateY(40px) scale(0.95);
            }
            to {
              opacity: 1;
              transform: translateY(0) scale(1);
            }
          }

          @keyframes fadeInUp {
            from {
              opacity: 0;
              transform: translateY(30px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }

          @keyframes slideInDown {
            from {
              opacity: 0;
              transform: translateY(-20px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }

          @keyframes float {
            0%, 100% { 
              transform: translateY(0px) rotate(0deg); 
            }
            33% { 
              transform: translateY(-15px) rotate(120deg); 
            }
            66% { 
              transform: translateY(10px) rotate(240deg); 
            }
          }

          @keyframes iconFloat {
            0%, 100% { 
              transform: translateY(0px) scale(1); 
            }
            50% { 
              transform: translateY(-8px) scale(1.05); 
            }
          }

          @keyframes gridMove {
            0% { transform: translate(0, 0); }
            100% { transform: translate(60px, 60px); }
          }

          @keyframes shake {
            0%, 100% { transform: translateX(0); }
            25% { transform: translateX(-8px); }
            75% { transform: translateX(8px); }
          }

          .fade-in {
            animation: fadeInUp 0.5s ease-out;
          }

          /* Input focus effects */
          .form-control:focus {
            box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.15) !important;
            border-color: rgba(59, 130, 246, 0.6) !important;
            background: rgba(255, 255, 255, 0.08) !important;
            color: white !important;
          }

          /* Placeholder color */
          .form-control::placeholder {
            color: rgba(255, 255, 255, 0.5) !important;
          }

          /* Smooth transitions for all interactive elements */
          .login-card * {
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          }

          /* Custom scrollbar */
          ::-webkit-scrollbar {
            width: 8px;
          }

          ::-webkit-scrollbar-track {
            background: rgba(255, 255, 255, 0.05);
          }

          ::-webkit-scrollbar-thumb {
            background: rgba(255, 255, 255, 0.2);
            border-radius: 4px;
          }

          ::-webkit-scrollbar-thumb:hover {
            background: rgba(255, 255, 255, 0.3);
          }
        `}
      </style>  
    </div>
  );
}