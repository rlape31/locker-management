import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import Badge from '@mui/material/Badge';
import NotificationsIcon from '@mui/icons-material/Notifications';
import HomeIcon from '@mui/icons-material/Home';
import { useRouter } from "next/router";

export default function ToolbarBar({
  userName = 'User',
  requestCount = 0,
  onLogout,
  notificationCount,
  onNavigate,
}) {
  const router = useRouter();
  const currentPath = router.pathname;
  const totalNotifications = notificationCount ?? requestCount;

  const navigateTo = (path) => {
    if (typeof onNavigate === 'function') {
      onNavigate(path);
      return;
    }

    router.push(path);
  };

  const handleLogout = () => {
    if (typeof onLogout === 'function') {
      onLogout();
    }
  };

  const goToDashboard = () => navigateTo('/homefab5');
  const goToDirectory = () => navigateTo('/lockerdirectory');
  const goToHistory = () => navigateTo('/lockerhistory');
  const goToNotifications = () => navigateTo('/approvalrequest');

  const navButtonSx = {
    color: '#1f2937',
    borderRadius: 2,
    px: 1.5,
    py: 0.75,
    textTransform: 'none',
    fontWeight: 700,
    fontFamily: 'Segoe UI, system-ui, Arial',
    transition: 'all 0.2s ease-in-out',
    '&:hover': {
      backgroundColor: '#eaf1ff',
      color: '#0b3b8e',
    },
  };

  return (
    <AppBar
      position="static"
      color="default"
      elevation={0}
      sx={{
        borderBottom: '1px solid rgba(15, 23, 42, 0.08)',
        backgroundColor: '#ffffff',
      }}
    >
      <Toolbar
        sx={{
          minHeight: 72,
          gap: 2,
          px: { xs: 2, md: 3 },
          backgroundColor: '#fcfcfc',
          justifyContent: 'space-between',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Button
            variant="text"
            onClick={goToDashboard}
            sx={{
              minWidth: 0,
              width: 42,
              height: 42,
              borderRadius: '50%',
              color: '#1f2937',
              backgroundColor: '#f3f6fb',
              '&:hover': {
                backgroundColor: '#dfe9ff',
                color: '#0b3b8e',
              },
            }}
          >
            <HomeIcon sx={{ fontSize: 24 }} />
          </Button>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flexGrow: 1 }}>
          <Typography
            variant="h6"
            sx={{
              fontWeight: 800,
              letterSpacing: '0.02em',
              fontFamily: 'Segoe UI, system-ui, Arial',
              color: '#1f3b4d',
            }}
          >
            Locker Management System
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
          <Button
            variant="text"
            onClick={goToNotifications}
            sx={{
              ...navButtonSx,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 1,
            }}
          >
            <Badge
              badgeContent={totalNotifications}
              invisible={totalNotifications === 0}
              max={99}
              overlap="circular"
              sx={{
                '& .MuiBadge-badge': {
                  fontSize: '0.72rem',
                  height: 20,
                  minWidth: 20,
                  color: '#ffffff',
                  backgroundColor: '#1372ee',
                  padding: '0 6px',
                  border: '2px solid #ffffff',
                  boxShadow: '0 0 0 2px rgba(19, 114, 238, 0.12)',
                },
              }}
            >
              <NotificationsIcon sx={{ fontSize: 26, color: '#370df7' }} />
            </Badge>
            <Typography
              variant="subtitle1"
              sx={{
                fontWeight: 700,
                fontFamily: 'Segoe UI, system-ui, Arial',
              }}
            >
              {`Request Notification${totalNotifications > 0 ? ` (${totalNotifications})` : ''}`}
            </Typography>
          </Button>

          <Button variant="text" onClick={goToDirectory} sx={navButtonSx}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, fontFamily: 'Segoe UI, system-ui, Arial' }}>
              Directory
            </Typography>
          </Button>

          <Button variant="text" onClick={goToHistory} sx={navButtonSx}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, fontFamily: 'Segoe UI, system-ui, Arial' }}>
              History
            </Typography>
          </Button>

          <Box sx={{ display: 'flex', alignItems: 'center', ml: 1 }}>
            <Typography
              variant="subtitle1"
              component="div"
              sx={{
                fontWeight: 700,
                color: '#243b53',
                fontFamily: 'Segoe UI, system-ui, Arial',
              }}
            >
              Hi {userName}
            </Typography>
          </Box>

          <Button
            variant="contained"
            color="secondary"
            onClick={handleLogout}
            sx={{
              borderRadius: 2,
              px: 2,
              py: 1,
              textTransform: 'none',
              background: 'linear-gradient(135deg, #8a2be2 0%, #6a1b9a 100%)',
              boxShadow: 'none',
              '&:hover': {
                background: 'linear-gradient(135deg, #7b1fa2 0%, #5e1a8a 100%)',
              },
            }}
          >
            Logout
          </Button>
        </Box>
      </Toolbar>
    </AppBar>
  );
}


