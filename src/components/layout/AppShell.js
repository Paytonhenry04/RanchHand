// src/components/layout/AppShell.js
import React, { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

const NAV_ADMIN = [
  { to: "/dashboard",    icon: "🏠", label: "Dashboard"   },
  { to: "/animals",      icon: "🐴", label: "Animals"     },
  { to: "/services",     icon: "📋", label: "Services"    },
  { to: "/todo",         icon: "✅", label: "Daily Tasks" },
  { to: "/billing",      icon: "💰", label: "Billing"     },
  { to: "/members",      icon: "👥", label: "Members"     },
  { to: "/settings",     icon: "⚙️", label: "Settings"   },
];

const NAV_USER = [
  { to: "/dashboard",    icon: "🏠", label: "Dashboard"   },
  { to: "/my-animals",   icon: "🐴", label: "My Animals"  },
  { to: "/ranch",        icon: "🌾", label: "Ranch Board" },
  { to: "/my-billing",   icon: "💰", label: "My Billing"  },
  { to: "/settings",     icon: "⚙️", label: "Settings"   },
];

export const AppShell = ({ children }) => {
  const { currentUser, userProfile, isAdmin, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = isAdmin ? NAV_ADMIN : NAV_USER;

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const navLinkStyle = ({ isActive }) => ({
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "10px 16px",
    borderRadius: "var(--radius-sm)",
    color: isActive ? "var(--color-cream)" : "rgba(245,239,230,0.6)",
    background: isActive ? "rgba(255,255,255,0.12)" : "transparent",
    fontSize: 14,
    fontWeight: isActive ? 500 : 400,
    transition: "all 0.15s",
    textDecoration: "none",
  });

  const SidebarContent = () => (
    <div style={{
      display: "flex",
      flexDirection: "column",
      height: "100%",
      padding: "24px 12px",
    }}>
      {/* Brand */}
      <div style={{ padding: "0 8px", marginBottom: 32 }}>
        <h2 style={{
          fontFamily: "var(--font-display)",
          color: "var(--color-cream)",
          fontSize: 20,
          letterSpacing: "0.02em",
        }}>Ranch Hand</h2>
        <p style={{ color: "rgba(245,239,230,0.5)", fontSize: 12, marginTop: 2 }}>
          {isAdmin ? "🌟 Admin" : "🐴 Owner"}
        </p>
      </div>

      {/* Nav */}
      <nav style={{ display: "flex", flexDirection: "column", gap: 2, flex: 1 }}>
        {navItems.map((item) => (
          <NavLink key={item.to} to={item.to} style={navLinkStyle} onClick={() => setMobileMenuOpen(false)}>
            <span style={{ fontSize: 16 }}>{item.icon}</span>
            {item.label}
          </NavLink>
        ))}
      </nav>

      {/* User info + logout */}
      <div style={{
        borderTop: "1px solid rgba(255,255,255,0.1)",
        paddingTop: 16,
        marginTop: 16,
      }}>
        <div style={{ padding: "0 8px", marginBottom: 12 }}>
          <p style={{ color: "var(--color-cream)", fontSize: 13, fontWeight: 500 }}>
            {userProfile?.displayName || currentUser?.email}
          </p>
          <p style={{ color: "rgba(245,239,230,0.45)", fontSize: 12, marginTop: 2 }}>
            {currentUser?.email}
          </p>
        </div>
        <button
          onClick={handleLogout}
          style={{
            width: "100%",
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "9px 16px",
            borderRadius: "var(--radius-sm)",
            background: "transparent",
            border: "none",
            color: "rgba(245,239,230,0.5)",
            fontSize: 13,
            cursor: "pointer",
            transition: "all 0.15s",
          }}
          onMouseEnter={(e) => e.currentTarget.style.color = "var(--color-cream)"}
          onMouseLeave={(e) => e.currentTarget.style.color = "rgba(245,239,230,0.5)"}
        >
          <span>🚪</span> Sign Out
        </button>
      </div>
    </div>
  );

  return (
    <div style={{ display: "flex", height: "100vh", overflow: "hidden" }}>
      {/* Desktop Sidebar */}
      <aside style={{
        width: "var(--sidebar-width)",
        background: "var(--bg-sidebar)",
        flexShrink: 0,
        overflowY: "auto",
        display: "none",
      }} className="sidebar-desktop">
        <SidebarContent />
      </aside>

      {/* Mobile overlay */}
      {mobileMenuOpen && (
        <div
          onClick={() => setMobileMenuOpen(false)}
          style={{
            position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 40,
          }}
        />
      )}

      {/* Mobile drawer */}
      <aside style={{
        position: "fixed",
        top: 0, left: 0, bottom: 0,
        width: "var(--sidebar-width)",
        background: "var(--bg-sidebar)",
        zIndex: 50,
        transform: mobileMenuOpen ? "translateX(0)" : "translateX(-100%)",
        transition: "transform 0.25s ease",
        overflowY: "auto",
      }}>
        <SidebarContent />
      </aside>

      {/* Main content */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        {/* Top bar (mobile) */}
        <header style={{
          height: "var(--header-height)",
          borderBottom: "1px solid var(--border)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 20px",
          background: "var(--bg-card)",
        }}>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", padding: 4 }}
          >
            ☰
          </button>
          <span style={{ fontFamily: "var(--font-display)", fontSize: 16, color: "var(--text-primary)" }}>
            Ranch Hand
          </span>
          <div style={{ width: 32 }} /> {/* spacer */}
        </header>

        {/* Page content */}
        <main style={{
          flex: 1,
          overflowY: "auto",
          padding: "24px 20px",
        }}>
          {children}
        </main>
      </div>

      {/* Desktop sidebar show via media query — handled in index.css */}
      <style>{`
        @media (min-width: 768px) {
          .sidebar-desktop { display: block !important; }
          header { display: none !important; }
        }
      `}</style>
    </div>
  );
};
