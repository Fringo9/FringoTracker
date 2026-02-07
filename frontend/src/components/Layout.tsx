import { ReactNode } from "react";
import {
  AppBar,
  Avatar,
  Box,
  Chip,
  Collapse,
  Divider,
  Drawer,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Toolbar,
  Typography,
} from "@mui/material";
import {
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  ListAlt as ListAltIcon,
  Analytics as AnalyticsIcon,
  Upload as UploadIcon,
  Event as EventIcon,
  Settings as SettingsIcon,
  Logout as LogoutIcon,
  Person as PersonIcon,
  Category as CategoryIcon,
  ExpandLess,
  ExpandMore,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  DarkMode as DarkModeIcon,
  LightMode as LightModeIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
} from "@mui/icons-material";
import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuthStore } from "../stores/authStore";
import { useThemeStore } from "../stores/themeStore";
import { usePrivacyStore } from "../stores/privacyStore";
import SnapshotReminderBanner from "./SnapshotReminderBanner";

const DRAWER_WIDTH = 240;
const DRAWER_WIDTH_COLLAPSED = 60;

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(true);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [snapshotsOpen, setSnapshotsOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const logout = useAuthStore((state) => state.logout);
  const user = useAuthStore((state) => state.user);
  const themeMode = useThemeStore((state) => state.mode);
  const toggleMode = useThemeStore((state) => state.toggleMode);
  const isObscured = usePrivacyStore((state) => state.isObscured);
  const toggleObscured = usePrivacyStore((state) => state.toggleObscured);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleLogout = () => {
    handleMenuClose();
    logout();
    navigate("/login");
  };

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const getDisplayName = () => {
    if (user?.displayName) return user.displayName;
    return user?.email?.split("@")[0] || "Utente";
  };

  useEffect(() => {
    const isSnapshotsRoute =
      location.pathname.startsWith("/snapshots") ||
      location.pathname.startsWith("/import");
    const isSettingsRoute =
      location.pathname.startsWith("/settings") ||
      location.pathname.startsWith("/profile");

    setSnapshotsOpen(isSnapshotsRoute);
    setSettingsOpen(isSettingsRoute);
  }, [location.pathname]);

  const menuItems = [
    { text: "Dashboard", icon: <DashboardIcon />, path: "/dashboard" },
    { text: "Analytics", icon: <AnalyticsIcon />, path: "/analytics" },
    { text: "Milestone", icon: <EventIcon />, path: "/milestones" },
  ];

  const drawer = (
    <Box
      sx={{ p: 2, display: "flex", flexDirection: "column", height: "100%" }}
    >
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: drawerOpen ? "space-between" : "center",
          minHeight: drawerOpen ? 64 : 48,
          width: "100%",
        }}
      >
        {drawerOpen && (
          <Box>
            <Typography variant="h6" noWrap component="div">
              FringoTracker
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Gestione smart del patrimonio
            </Typography>
          </Box>
        )}
        <IconButton
          onClick={() => setDrawerOpen(!drawerOpen)}
          size="small"
          sx={{ flexShrink: 0, ml: drawerOpen ? 0 : "auto" }}
        >
          {drawerOpen ? <ChevronLeftIcon /> : <ChevronRightIcon />}
        </IconButton>
      </Box>
      <List sx={{ mt: 2 }}>
        {drawerOpen && (
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ px: 1, mb: 1, textTransform: "uppercase", letterSpacing: 1 }}
          >
            Panoramica
          </Typography>
        )}
        {menuItems.map((item) => (
          <ListItem key={item.text} disablePadding>
            <ListItemButton
              selected={location.pathname === item.path}
              onClick={() => {
                navigate(item.path);
                setMobileOpen(false);
              }}
              sx={{ justifyContent: drawerOpen ? "initial" : "center" }}
            >
              <ListItemIcon sx={{ minWidth: drawerOpen ? 40 : "auto" }}>
                {item.icon}
              </ListItemIcon>
              {drawerOpen && <ListItemText primary={item.text} />}
            </ListItemButton>
          </ListItem>
        ))}
        <Divider sx={{ my: 1.5 }} />
        {drawerOpen && (
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ px: 1, mb: 1, textTransform: "uppercase", letterSpacing: 1 }}
          >
            Snapshot
          </Typography>
        )}
        <ListItem disablePadding>
          <ListItemButton
            onClick={() => setSnapshotsOpen(!snapshotsOpen)}
            sx={{ justifyContent: drawerOpen ? "initial" : "center" }}
          >
            <ListItemIcon sx={{ minWidth: drawerOpen ? 40 : "auto" }}>
              <ListAltIcon />
            </ListItemIcon>
            {drawerOpen && <ListItemText primary="Snapshots" />}
            {drawerOpen && (snapshotsOpen ? <ExpandLess /> : <ExpandMore />)}
          </ListItemButton>
        </ListItem>
        <Collapse in={drawerOpen && snapshotsOpen} timeout="auto" unmountOnExit>
          <List component="div" disablePadding>
            <ListItemButton
              sx={{ pl: 4 }}
              selected={location.pathname === "/snapshots"}
              onClick={() => {
                navigate("/snapshots");
                setMobileOpen(false);
              }}
            >
              <ListItemIcon>
                <ListAltIcon />
              </ListItemIcon>
              <ListItemText primary="Visualizza Snapshots" />
            </ListItemButton>
            <ListItemButton
              sx={{ pl: 4 }}
              selected={location.pathname === "/import"}
              onClick={() => {
                navigate("/import");
                setMobileOpen(false);
              }}
            >
              <ListItemIcon>
                <UploadIcon />
              </ListItemIcon>
              <ListItemText primary="Import" />
            </ListItemButton>
          </List>
        </Collapse>
        <Divider sx={{ my: 1.5 }} />
        {drawerOpen && (
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ px: 1, mb: 1, textTransform: "uppercase", letterSpacing: 1 }}
          >
            Impostazioni
          </Typography>
        )}
        <ListItem disablePadding>
          <ListItemButton
            onClick={() => setSettingsOpen(!settingsOpen)}
            sx={{ justifyContent: drawerOpen ? "initial" : "center" }}
          >
            <ListItemIcon sx={{ minWidth: drawerOpen ? 40 : "auto" }}>
              <SettingsIcon />
            </ListItemIcon>
            {drawerOpen && <ListItemText primary="Impostazioni" />}
            {drawerOpen && (settingsOpen ? <ExpandLess /> : <ExpandMore />)}
          </ListItemButton>
        </ListItem>
        <Collapse in={drawerOpen && settingsOpen} timeout="auto" unmountOnExit>
          <List component="div" disablePadding>
            <ListItemButton
              sx={{ pl: 4 }}
              selected={location.pathname === "/settings"}
              onClick={() => {
                navigate("/settings");
                setMobileOpen(false);
              }}
            >
              <ListItemIcon>
                <CategoryIcon />
              </ListItemIcon>
              <ListItemText primary="Voci e Categorie" />
            </ListItemButton>
            <ListItemButton
              sx={{ pl: 4 }}
              selected={location.pathname === "/profile"}
              onClick={() => {
                navigate("/profile");
                setMobileOpen(false);
              }}
            >
              <ListItemIcon>
                <PersonIcon />
              </ListItemIcon>
              <ListItemText primary="Profilo" />
            </ListItemButton>
          </List>
        </Collapse>
      </List>

      {/* Spacer */}
      <Box sx={{ flexGrow: 1 }} />

      {/* Dark mode toggle */}
      <Divider sx={{ my: 1 }} />
      <ListItem disablePadding>
        <ListItemButton
          onClick={toggleMode}
          sx={{ justifyContent: drawerOpen ? "initial" : "center" }}
        >
          <ListItemIcon sx={{ minWidth: drawerOpen ? 40 : "auto" }}>
            {themeMode === "light" ? <DarkModeIcon /> : <LightModeIcon />}
          </ListItemIcon>
          {drawerOpen && (
            <ListItemText
              primary={themeMode === "light" ? "Tema Scuro" : "Tema Chiaro"}
            />
          )}
        </ListItemButton>
      </ListItem>
    </Box>
  );

  return (
    <Box sx={{ display: "flex" }}>
      <AppBar
        position="fixed"
        sx={{
          width: {
            xs: "100%",
            sm: `calc(100% - ${drawerOpen ? DRAWER_WIDTH : DRAWER_WIDTH_COLLAPSED}px)`,
          },
          ml: {
            xs: 0,
            sm: `${drawerOpen ? DRAWER_WIDTH : DRAWER_WIDTH_COLLAPSED}px`,
          },
          backgroundColor:
            themeMode === "light"
              ? "rgba(241, 247, 255, 0.85)"
              : "rgba(15, 23, 42, 0.85)",
          backdropFilter: "blur(12px)",
          color: "text.primary",
          boxShadow: "none",
          borderBottom: "1px solid",
          borderColor:
            themeMode === "light"
              ? "rgba(37, 99, 235, 0.08)"
              : "rgba(255, 255, 255, 0.06)",
          transition: "margin 0.2s ease, width 0.2s ease",
          zIndex: (theme) => theme.zIndex.appBar,
        }}
      >
        <Toolbar
          sx={{
            justifyContent: "flex-end",
            pr: { xs: 2, sm: 3 },
            minHeight: 64,
            alignItems: "center",
          }}
        >
          <IconButton
            color="inherit"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 1, display: { xs: "inline-flex", sm: "none" } }}
          >
            <MenuIcon />
          </IconButton>
          <Box sx={{ flexGrow: 1 }} />
          <IconButton
            onClick={toggleObscured}
            title={isObscured ? "Mostra valori" : "Nascondi valori"}
            sx={{
              mr: 1,
              color: isObscured ? "primary.main" : "text.secondary",
            }}
          >
            {isObscured ? <VisibilityOffIcon /> : <VisibilityIcon />}
          </IconButton>
          {user?.email === "demo@fringotracker.it" && (
            <Chip
              label="DEMO"
              size="small"
              sx={{
                mr: 1,
                fontWeight: 700,
                letterSpacing: 1,
                bgcolor: "warning.main",
                color: "warning.contrastText",
              }}
            />
          )}
          <Chip
            avatar={
              <Avatar
                src={user?.photoURL}
                alt={getDisplayName()}
                sx={{ width: 40, height: 40 }}
              >
                {!user?.photoURL && getDisplayName()[0].toUpperCase()}
              </Avatar>
            }
            label={getDisplayName()}
            onClick={handleMenuClick}
            sx={{
              height: 48,
              paddingX: 1,
              borderRadius: "24px",
              backgroundColor: "rgba(37, 99, 235, 0.1)",
              color: "text.primary",
              cursor: "pointer",
              "&:hover": {
                backgroundColor: "rgba(37, 99, 235, 0.15)",
              },
              "& .MuiChip-label": {
                px: 3,
                fontSize: "1rem",
              },
            }}
          />
          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleMenuClose}
            anchorOrigin={{
              vertical: "bottom",
              horizontal: "right",
            }}
            transformOrigin={{
              vertical: "top",
              horizontal: "right",
            }}
            slotProps={{
              paper: {
                sx: { zIndex: 1300 },
              },
            }}
          >
            <MenuItem onClick={handleLogout}>
              <ListItemIcon>
                <LogoutIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText>Logout</ListItemText>
            </MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>

      <Box
        component="nav"
        sx={{
          width: { sm: drawerOpen ? DRAWER_WIDTH : DRAWER_WIDTH_COLLAPSED },
          flexShrink: { sm: 0 },
        }}
      >
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true,
          }}
          sx={{
            display: { xs: "block", sm: "none" },
            "& .MuiDrawer-paper": {
              boxSizing: "border-box",
              width: DRAWER_WIDTH,
            },
          }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: "none", sm: "block" },
            "& .MuiDrawer-paper": {
              boxSizing: "border-box",
              width: drawerOpen ? DRAWER_WIDTH : DRAWER_WIDTH_COLLAPSED,
              transition: "width 0.2s ease",
              overflowX: "hidden",
              boxShadow:
                themeMode === "light"
                  ? "2px 0 12px rgba(37, 99, 235, 0.12)"
                  : "2px 0 12px rgba(0, 0, 0, 0.3)",
              borderRight: "none",
            },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: { xs: 1.5, sm: 3 },
          width: {
            sm: `calc(100% - ${drawerOpen ? DRAWER_WIDTH : DRAWER_WIDTH_COLLAPSED}px)`,
          },
          transition: "width 0.2s ease",
          overflow: "hidden",
        }}
      >
        <Toolbar />
        <SnapshotReminderBanner />
        {children}
      </Box>
    </Box>
  );
}
